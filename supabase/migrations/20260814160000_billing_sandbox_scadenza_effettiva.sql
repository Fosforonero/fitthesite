-- ============================================================================
-- IL PERMESSO SANDBOX SCADEVA, IL DIRITTO NO — E LA PROVA CHE DICEVA IL
-- CONTRARIO CHIAMAVA IL RICALCOLO A MANO
--
-- 20260813150000 aveva insegnato al ricalcolo a ignorare i claim Sandbox di
-- chi non e' piu' un revisore autorizzato. Vero, e non basta: IL RICALCOLO
-- DEVE PARTIRE. Finche' nessuno lo chiama, in `public.b2c_subscriptions`
-- resta una riga `state='active'` con `active_until = 9999-12-31`, e quella
-- riga e' cio' che il prodotto legge davvero, per due strade diverse:
--
--   * `public.get_entitlement_status()`, che con `is_b2c_lifetime()` vera
--     risponde `lifetime` senza guardare nient'altro;
--   * il client, che legge `b2c_subscriptions` DIRETTAMENTE con la propria
--     RLS (SubscriptionsRepository.fetchActiveSubscription).
--
-- Il test S14 sembrava coprirlo e non lo copriva: chiamava
-- `_billing_project_entitlement()` a mano subito dopo aver spostato la
-- scadenza. Provava cioe' che il ricalcolo, SE eseguito, decide bene — che e'
-- un'altra domanda.
--
-- La correzione e' su tre piani, perche' i modi in cui un permesso finisce
-- sono tre e nessuno dei tre e' coperto dagli altri due.
--
--   1  QUANTO DURA IL DIRITTO — la proiezione smette di dire 9999.
--      Un acquisto Sandbox non vale piu' a lungo del permesso di chi lo ha
--      presentato: in proiezione `active_until` viene limitato a `expires_at`
--      del revisore. Da li' in poi la riga si descrive da sola e i due
--      percorsi di lettura negano PER SCADENZA, senza che debba girare
--      niente: `is_b2c_lifetime()` diventa falsa (non e' piu' oltre l'anno
--      9000) e sia la RPC sia il client confrontano `active_until` con adesso.
--
--      Il limite sta nel RICALCOLO, non in chi scrive nel registro. Il
--      registro conserva quello che lo store ha detto — e lo store ha detto
--      lifetime davvero; a essere a tempo e' il nostro permesso, non
--      l'acquisto. Metterlo anche sulla tabella significherebbe tenere due
--      copie della stessa regola in due punti, ed e' esattamente il difetto
--      appena corretto in 20260814140000. Ce n'e' una sola, e sta dove il
--      valore che qualcuno legge viene prodotto: se il permesso viene
--      accorciato DOPO il claim, il limite calcolato alla scrittura sarebbe
--      gia' vecchio.
--
--   2  IL PERMESSO TOLTO O ACCORCIATO — effetto immediato.
--      Il runbook dice all'operatore di fare `delete from
--      private.billing_sandbox_reviewers` dopo l'approvazione: cioe' proprio
--      la cosa che lasciava il Pro proiettato. Adesso un INSERT, UPDATE o
--      DELETE su quella tabella ricalcola l'entitlement dell'account toccato
--      nella stessa transazione. Non esiste piu' un modo di togliere il
--      permesso e lasciare il diritto, nemmeno scrivendo a mano in SQL.
--
--   3  IL PERMESSO CHE SCADE DA SOLO — la riga smette di restare stantia.
--      Se non succede niente, non parte niente: nessuna riga cambia quando un
--      timestamp diventa passato. Dopo il punto 1 nessuno CONCEDE piu' niente,
--      ma in proiezione resta scritto `active` su un diritto finito, e se
--      quell'account ha un acquisto di produzione valido nessuno glielo rimette
--      davanti. Un job periodico ricalcola quegli account: marca `expired`
--      oppure riproietta il miglior diritto rimasto.
--
-- Nessuno dei tre e' il fix "vero": il primo e' l'unico che regge senza che
-- giri niente, il secondo e' l'unico immediato, il terzo e' l'unico che
-- ripulisce cio' che il tempo lascia indietro.
-- ============================================================================

-- ============================================================================
-- 1. LA PROIEZIONE NON CONCEDE OLTRE IL PERMESSO
--
-- Rispetto a 20260813150000 cambiano due cose e nient'altro: la select che
-- elegge l'acquisto vincente porta con se' l'ambiente e la scadenza del
-- permesso, e la proiezione scrive `active_until` limitato.
-- ============================================================================
create or replace function private._billing_project_entitlement(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_win record;
  v_projected_state text;
  v_active_until timestamptz;
  v_raw_payload jsonb;
  v_actual record;
begin
  select s.*, c.external_transaction_id, c.owner_user_id,
         c.environment, r.expires_at as permesso_fino_a
    into v_win
  from private.billing_purchase_states s
  join private.billing_purchase_claims c
    on c.billing_source = s.billing_source
   and c.ownership_key  = s.ownership_key
  left join private.billing_sandbox_reviewers r
    on r.user_id = c.owner_user_id
  where c.owner_user_id = p_user_id
    -- Un acquisto Sandbox vale finche' vale il permesso di chi lo ha
    -- presentato. Scaduto quello, torna a essere quello che e' sempre stato:
    -- una transazione gratuita.
    and (c.environment <> 'sandbox' or public.is_sandbox_reviewer(c.owner_user_id))
  order by
    case
      when s.purchase_kind = 'lifetime' and s.state = 'active' then 0
      when s.purchase_kind = 'subscription'
       and s.state in ('active', 'grace', 'cancelled')
       and s.active_until > v_now then 1
      else 2
    end,
    s.active_until desc,
    s.store_event_at desc,
    s.billing_source,
    s.ownership_key
  limit 1;

  if not found then
    -- Nessun acquisto commerciale valido. Se pero' in proiezione c'e' ancora
    -- la riga prodotta da un claim Sandbox, quella va tolta adesso: e' l'unico
    -- momento in cui si puo' sapere che il permesso e' finito.
    perform pg_catalog.set_config('billing.projection', 'on', true);
    update public.b2c_subscriptions t
       set state = 'expired',
           auto_renewing = false,
           last_notification_at = pg_catalog.now()
     where t.user_id = p_user_id
       and t.billing_source <> 'founder_grant'
       and t.external_subscription_id like 'sandbox:%'
       and t.state <> 'expired';
    perform pg_catalog.set_config('billing.projection', 'off', true);

    return pg_catalog.jsonb_build_object('projected', false, 'reason', 'no_commercial_purchase');
  end if;

  v_projected_state := case
    when v_win.purchase_kind = 'lifetime' and v_win.state = 'active' then 'active'
    when v_win.purchase_kind = 'subscription'
     and v_win.state in ('active', 'cancelled')
     and v_win.active_until > v_now then 'active'
    when v_win.purchase_kind = 'subscription'
     and v_win.state = 'grace'
     and v_win.active_until > v_now then 'grace'
    when v_win.state = 'revoked' then 'expired'
    -- Un abbonamento marcato attivo ma con la scadenza nel passato non e'
    -- attivo, ed e' proprio la coppia di valori che ha prodotto il difetto
    -- originale. Si proietta per quello che e'.
    when v_win.purchase_kind = 'subscription' and v_win.active_until <= v_now then 'expired'
    else v_win.state
  end;

  -- ── IL DIRITTO NON SUPERA IL PERMESSO ─────────────────────────────────────
  --
  -- Il registro dice 9999-12-31 perche' lo store ha detto lifetime, ed e'
  -- vero. Ma un lifetime Sandbox e' gratuito, e quello che noi concediamo
  -- dura quanto il permesso di quella persona. Senza questo limite la riga
  -- proiettata risulta lifetime a `is_b2c_lifetime()` e nessuno dei due
  -- percorsi di lettura guarda oltre.
  v_active_until := v_win.active_until;
  if v_win.environment = 'sandbox' then
    v_active_until := least(v_active_until, coalesce(v_win.permesso_fino_a, v_now));
  end if;

  v_raw_payload := pg_catalog.jsonb_build_object(
    'source', 'billing_entitlement_projection',
    'contract_version', 2,
    'ownership_key_derivation_version', 1,
    'billing_source', v_win.billing_source,
    'product_id', v_win.external_product_id,
    'purchase_kind', v_win.purchase_kind,
    'store_state', v_win.state,
    'store_event_at', v_win.store_event_at,
    'store_event_source', v_win.store_event_source
  );

  perform pg_catalog.set_config('billing.projection', 'on', true);

  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    external_order_id, active_until, auto_renewing, state,
    raw_payload, last_notification_at
  ) values (
    p_user_id, v_win.billing_source, v_win.external_product_id, v_win.ownership_key,
    v_win.external_transaction_id, v_active_until,
    case when v_projected_state in ('active', 'grace') then v_win.auto_renewing else false end,
    v_projected_state, v_raw_payload, pg_catalog.now()
  )
  on conflict (user_id) do update set
    billing_source           = excluded.billing_source,
    external_product_id      = excluded.external_product_id,
    external_subscription_id = excluded.external_subscription_id,
    external_order_id        = excluded.external_order_id,
    active_until             = excluded.active_until,
    auto_renewing            = excluded.auto_renewing,
    state                    = excluded.state,
    raw_payload              = excluded.raw_payload,
    last_notification_at     = excluded.last_notification_at
  where public.b2c_subscriptions.billing_source <> 'founder_grant';

  perform pg_catalog.set_config('billing.projection', 'off', true);

  select t.billing_source, t.external_product_id, t.state, t.active_until,
         t.auto_renewing, public.is_b2c_lifetime(t) as is_lifetime
    into v_actual
  from public.b2c_subscriptions t
  where t.user_id = p_user_id;

  return pg_catalog.jsonb_build_object(
    'projected', true,
    'source',       v_actual.billing_source,
    'productId',    v_actual.external_product_id,
    'state',        v_actual.state,
    'activeUntil',  v_actual.active_until,
    'autoRenewing', v_actual.auto_renewing,
    'isLifetime',   v_actual.is_lifetime,
    'protectedFounderRow', v_actual.billing_source = 'founder_grant'
  );
end;
$$;

revoke all on function private._billing_project_entitlement(uuid)
  from public, anon, authenticated, service_role;

comment on function private._billing_project_entitlement(uuid) is
  'Ricalcola la proiezione di entitlement dal registro. Un acquisto Sandbox '
  'concede fino alla scadenza del permesso di chi lo ha presentato, mai oltre: '
  'e'' cio'' che fa negare per scadenza sia get_entitlement_status() sia la '
  'lettura diretta della tabella da parte del client.';

-- ============================================================================
-- 2. TOGLIERE IL PERMESSO TOGLIE IL DIRITTO, NELLA STESSA TRANSAZIONE
-- ============================================================================
create or replace function private._billing_permesso_sandbox_cambiato()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_utente uuid := coalesce(new.user_id, old.user_id);
begin
  -- Durante la cancellazione di un account questa riga sparisce in cascata da
  -- auth.users. Li' non c'e' nessun diritto da ricalcolare e la riga padre non
  -- esiste piu': ricalcolare vorrebbe dire riscrivere la proiezione di un
  -- utente che si sta cancellando, cioe' resuscitarla.
  if not exists (select 1 from auth.users u where u.id = v_utente) then
    return null;
  end if;

  perform private._billing_project_entitlement(v_utente);
  return null;
end;
$$;

revoke all on function private._billing_permesso_sandbox_cambiato()
  from public, anon, authenticated, service_role;

comment on function private._billing_permesso_sandbox_cambiato() is
  'Ricalcola l''entitlement quando il permesso Sandbox di un account viene '
  'creato, accorciato, prolungato o tolto. Senza, il runbook diceva di fare '
  'DELETE sull''allowlist e quel DELETE lasciava il Pro proiettato.';

drop trigger if exists trg_billing_permesso_sandbox_cambiato
  on private.billing_sandbox_reviewers;
create trigger trg_billing_permesso_sandbox_cambiato
  after insert or update or delete on private.billing_sandbox_reviewers
  for each row execute function private._billing_permesso_sandbox_cambiato();

-- ============================================================================
-- 3. CIO' CHE IL TEMPO LASCIA INDIETRO
--
-- Un permesso che scade da solo non fa cambiare nessuna riga: non c'e' niente
-- che possa accorgersene. Dopo il punto 1 quella riga non concede piu' Pro a
-- nessuno dei due percorsi di lettura, ma resta scritta `active` su un diritto
-- finito — e se quell'account ha un acquisto di PRODUZIONE valido, nessuno
-- glielo rimette davanti.
--
-- Si ricalcolano solo gli account la cui proiezione VIENE da un claim Sandbox
-- (`external_subscription_id like 'sandbox:%'`): il Founder ha una riga sua e
-- non entra mai in questo insieme.
-- ============================================================================
create or replace function private.billing_reconcile_sandbox_projections(p_max int default 200)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  r record;
  n integer := 0;
begin
  if not pg_catalog.pg_try_advisory_xact_lock(2, 816160000) then
    return 0;
  end if;

  for r in
    select t.user_id
    from public.b2c_subscriptions t
    where t.external_subscription_id like 'sandbox:%'
      and t.state <> 'expired'
      and (t.active_until <= pg_catalog.now()
           or not public.is_sandbox_reviewer(t.user_id))
    order by t.user_id
    limit p_max
  loop
    begin
      perform private._billing_project_entitlement(r.user_id);
      n := n + 1;
    exception when others then
      -- Un account che solleva non deve fermare gli altri.
      raise warning 'proiezione sandbox non riconciliata (%): %', r.user_id, sqlerrm;
    end;
  end loop;

  return n;
end;
$$;

revoke all on function private.billing_reconcile_sandbox_projections(int)
  from public, anon, authenticated, service_role;

comment on function private.billing_reconcile_sandbox_projections(int) is
  'Ricalcola gli account la cui proiezione viene da un acquisto Sandbox ormai '
  'scaduto o senza permesso: marca expired oppure riproietta il miglior '
  'diritto rimasto. E'' la rete per l''unico caso che nessun trigger puo'' '
  'vedere, cioe'' il tempo che passa senza che nessuno scriva niente.';

do $$
begin
  if exists (select 1 from cron.job where jobname = 'billing-reconcile-sandbox') then
    perform cron.unschedule('billing-reconcile-sandbox');
  end if;
end $$;

select cron.schedule(
  'billing-reconcile-sandbox',
  '*/10 * * * *',
  $$ select private.billing_reconcile_sandbox_projections(); $$
);
