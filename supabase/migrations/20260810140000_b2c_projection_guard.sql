-- ============================================================================
-- LA GUARDIA SULLA PROIEZIONE — e la finestra di rollout che non deve esistere
--
-- IL PROBLEMA CHE RISOLVE
--
-- Il registro funziona solo se NESSUNA scrittura commerciale lo aggira. Il
-- codice che le faceva e' stato rimosso (a379e71), ma "l'abbiamo tolto dal
-- codice" e' una garanzia che dura fino al prossimo commit distratto, e
-- soprattutto non dice niente su cio' che scrive qualcun altro: il client
-- admin usa service_role, che salta la RLS e potrebbe scrivere
-- public.b2c_subscriptions direttamente via PostgREST. Serve una difesa nel
-- database, dove i dati vivono.
--
-- LA FINESTRA CHE UNA DIFESA INGENUA APRIREBBE
--
-- Se questa migration installasse subito il divieto, fra l'applicazione della
-- migration e il deploy della route nuova ci sarebbe un intervallo in cui il
-- backend VECCHIO e' ancora in produzione e fa upsert diretti. Quegli upsert
-- comincerebbero a fallire, la 189 riceverebbe un errore e — e' il suo
-- difetto, quello del 5 agosto 2026 — chiuderebbe comunque la transazione.
-- Acquisti pagati e mai serviti, in massa, causati dalla difesa stessa.
--
-- L'ordine inverso non aiuta: deployare prima e migrare dopo lascia scoperta
-- la finestra opposta, in cui la route nuova non trova la RPC.
--
-- LA SOLUZIONE: DUE MODI, E SI PARTE DA QUELLO PERMISSIVO
--
--   compatibility  (dalla migration in poi) una scrittura commerciale che NON
--                  viene dal registro non viene respinta: viene COMPLETATA, e
--                  la proprieta' mancante viene iscritta al volo dal trigger.
--                  Il backend vecchio continua a funzionare esattamente come
--                  prima, e ogni sua scrittura lascia comunque una riga nel
--                  registro. La finestra non e' scoperta: e' coperta da qui.
--
--   strict         (dopo il deploy, con un comando esplicito) la stessa
--                  scrittura viene respinta. Da quel momento l'unico modo di
--                  toccare la proiezione commerciale e' passare dalla RPC.
--
-- Il passaggio a strict NON e' un interruttore che si gira a occhi chiusi:
-- private.set_billing_projection_guard_mode() si RIFIUTA di passare a strict
-- finche' esiste anche una sola riga commerciale senza proprieta' registrata.
-- E' la prova, non la speranza, che la finestra sia stata coperta davvero.
--
-- COSA NON TOCCA
--   founder_grant, trial, stripe: non sono acquisti store, non hanno una
--   chiave di proprieta' e non passano dal registro. Il trigger li ignora, e
--   la riga founder resta protetta dov'e' gia' protetta (dentro la proiezione).
-- ============================================================================

-- ============================================================================
-- 1. IL MODO CORRENTE
-- ============================================================================
create table if not exists private.billing_projection_guard_mode (
  -- Una riga sola, per costruzione: il modo e' uno stato globale, e una
  -- tabella che puo' averne due e' una tabella che prima o poi ne ha due.
  singleton boolean primary key default true,
  mode text not null,
  changed_at timestamptz not null default now(),
  note text,
  constraint billing_projection_guard_singleton check (singleton),
  constraint billing_projection_guard_mode_check
    check (mode in ('compatibility', 'strict'))
);

insert into private.billing_projection_guard_mode (singleton, mode, note)
values (true, 'compatibility',
        'Stato iniziale. Copre la finestra fra questa migration e il deploy della route che passa dal registro.')
on conflict (singleton) do nothing;

revoke all on table private.billing_projection_guard_mode
  from public, anon, authenticated, service_role;

-- ============================================================================
-- 2. LA GUARDIA
-- ============================================================================
-- Come si riconosce una scrittura che viene dal registro: il parametro di
-- sessione `billing.projection`, impostato SOLO da
-- private._billing_project_entitlement e solo per la durata della sua UPSERT.
--
-- Un parametro di sessione non e' una barriera crittografica: chi ha una
-- connessione SQL diretta puo' impostarlo. Ma chi ha una connessione SQL
-- diretta puo' gia' fare qualunque cosa, e non e' l'avversario contro cui
-- questa guardia esiste. L'avversario e' un percorso applicativo — presente o
-- futuro — che scrive la proiezione via PostgREST con service_role senza
-- passare dal registro, e contro quello il parametro non e' impostabile.
create or replace function private._b2c_projection_guard()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_mode text;
  v_from_ledger boolean;
  v_key text;
  v_owner uuid;
  v_kind text;
begin
  -- Non commerciale: founder, trial, stripe. Non hanno proprieta' da
  -- registrare, e questa guardia non li riguarda.
  if new.billing_source not in ('apple_iap', 'google_play') then
    return new;
  end if;

  v_from_ledger := pg_catalog.current_setting('billing.projection', true) = 'on';
  if v_from_ledger then
    return new;
  end if;

  select m.mode into v_mode
  from private.billing_projection_guard_mode m
  where m.singleton;

  if v_mode = 'strict' then
    raise exception
      'public.b2c_subscriptions: scrittura commerciale fuori dal registro rifiutata (billing_source=%). L''entitlement si scrive solo con public.claim_store_purchase, che iscrive la proprieta'' nella stessa transazione.',
      new.billing_source
      using errcode = '42501';
  end if;

  -- ── compatibility: si completa la scrittura E si iscrive la proprieta' ──
  --
  -- La chiave si ricava dal valore che il backend vecchio scrive in
  -- external_subscription_id, che e' esattamente cio' da cui il backfill la
  -- ricava: per Apple l'originalTransactionId cosi' com'e', per Google il
  -- digest del purchase token. Se il valore e' gia' un digest (64 esadecimali)
  -- e' stato scritto dal registro e non si ri-digerisce.
  if new.external_subscription_id is null then
    raise warning 'guardia proiezione: riga commerciale senza external_subscription_id, proprieta'' non iscrivibile. La scrittura passa, ma il passaggio a strict la segnalera''.';
    return new;
  end if;

  v_key := case new.billing_source
    when 'google_play' then
      case when new.external_subscription_id ~ '^[0-9a-f]{64}$'
           then new.external_subscription_id
           else pg_catalog.encode(
                  pg_catalog.sha256(pg_catalog.convert_to(new.external_subscription_id, 'UTF8')),
                  'hex')
      end
    else new.external_subscription_id
  end;

  -- Forma incompatibile col vincolo del registro: si lascia passare la
  -- scrittura invece di farla fallire. Una scrittura respinta, con la 189 in
  -- giro, significa una transazione chiusa senza diritto — cioe' il danno che
  -- questa migration esiste per evitare. Il buco resta visibile: il passaggio
  -- a strict lo trova e si rifiuta di procedere.
  if new.billing_source = 'apple_iap'
     and (pg_catalog.length(v_key) > 64 or v_key ~ '[[:space:]]' or v_key = '') then
    raise warning 'guardia proiezione: chiave Apple di forma inattesa, proprieta'' non iscritta. La scrittura passa.';
    return new;
  end if;

  select c.owner_user_id into v_owner
  from private.billing_purchase_claims c
  where c.billing_source = new.billing_source and c.ownership_key = v_key;

  if found then
    if v_owner is distinct from new.user_id then
      -- Questo NON e' un caso da lasciar passare: e' un tentativo di
      -- proiettare su un utente una transazione che il registro attribuisce a
      -- un altro (o a un account cancellato). E' esattamente il difetto HIGH.
      raise exception
        'public.b2c_subscriptions: la transazione presentata risulta di un altro account nel registro. Nessuna proiezione.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- Proprieta' mancante: si iscrive adesso, con i dati che la riga porta.
  v_kind := case when new.external_product_id = 'fitmesh_pro_sub'
                 then 'subscription' else 'lifetime' end;

  insert into private.billing_purchase_claims (
    billing_source, ownership_key, external_transaction_id,
    external_product_id, owner_user_id, environment, claimed_at
  ) values (
    new.billing_source, v_key, new.external_order_id,
    new.external_product_id, new.user_id, 'production', pg_catalog.now()
  )
  on conflict (billing_source, ownership_key) do nothing;

  -- E lo stato, con la freschezza dichiarata per quello che e': non viene da
  -- un payload store, viene dalla riga che il backend vecchio sta scrivendo.
  insert into private.billing_purchase_states (
    billing_source, ownership_key, external_product_id, purchase_kind,
    state, active_until, auto_renewing,
    store_event_at, store_event_source, verified_at
  ) values (
    new.billing_source, v_key, new.external_product_id, v_kind,
    new.state,
    case when v_kind = 'lifetime' and new.active_until <= '9000-01-01'::timestamptz
         then '9999-12-31T23:59:59Z'::timestamptz
         else new.active_until end,
    coalesce(new.auto_renewing, false),
    pg_catalog.now(),
    case when new.billing_source = 'apple_iap'
         then 'apple_request_date' else 'google_backend_fetch' end,
    pg_catalog.now()
  )
  on conflict (billing_source, ownership_key) do nothing;

  return new;
end;
$$;

revoke all on function private._b2c_projection_guard() from public, anon, authenticated, service_role;

drop trigger if exists b2c_projection_guard on public.b2c_subscriptions;
create trigger b2c_projection_guard
  before insert or update on public.b2c_subscriptions
  for each row execute function private._b2c_projection_guard();

-- ============================================================================
-- 3. IL PASSAGGIO A STRICT, CHE SI RIFIUTA SE LA FINESTRA NON E' COPERTA
-- ============================================================================
create or replace function private.set_billing_projection_guard_mode(
  p_mode text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_scoperte bigint;
  v_conflitti bigint;
begin
  if p_mode not in ('compatibility', 'strict') then
    raise exception 'modo non valido: %', p_mode using errcode = '22023';
  end if;

  if p_mode = 'strict' then
    -- Ogni riga commerciale deve avere una proprieta' registrata, e deve
    -- essere la sua. Se non e' cosi', passare a strict non chiuderebbe la
    -- finestra: la dichiarerebbe chiusa.
    select count(*) into v_scoperte
    from public.b2c_subscriptions t
    where t.billing_source in ('apple_iap', 'google_play')
      and not exists (
        select 1 from private.billing_purchase_claims c
        where c.billing_source = t.billing_source
          and c.owner_user_id = t.user_id
      );

    select count(*) into v_conflitti
    from public.b2c_subscriptions t
    join private.billing_purchase_claims c
      on c.billing_source = t.billing_source
     and c.ownership_key = case t.billing_source
           when 'google_play' then
             case when t.external_subscription_id ~ '^[0-9a-f]{64}$'
                  then t.external_subscription_id
                  else pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(t.external_subscription_id, 'UTF8')), 'hex')
             end
           else t.external_subscription_id
         end
    where t.billing_source in ('apple_iap', 'google_play')
      and c.owner_user_id is distinct from t.user_id;

    if v_scoperte > 0 or v_conflitti > 0 then
      raise exception
        'passaggio a strict rifiutato: % righe commerciali senza proprieta'' registrata, % attribuite a un altro utente. Finche'' esistono, strict non chiuderebbe la finestra: la dichiarerebbe chiusa. Eseguire il backfill e ricontrollare.',
        v_scoperte, v_conflitti
        using errcode = '42501';
    end if;
  end if;

  update private.billing_projection_guard_mode
     set mode = p_mode, changed_at = pg_catalog.now(), note = p_note
   where singleton;

  return pg_catalog.jsonb_build_object('mode', p_mode, 'changedAt', pg_catalog.now());
end;
$$;

revoke all on function private.set_billing_projection_guard_mode(text, text)
  from public, anon, authenticated, service_role;

comment on function private.set_billing_projection_guard_mode(text, text) is
  'Passa la guardia della proiezione fra compatibility e strict. Il passaggio '
  'a strict si RIFIUTA se esiste anche una sola riga commerciale senza '
  'proprieta'' registrata: e'' la prova che la finestra di rollout sia stata '
  'coperta, non la sua dichiarazione.';

-- ============================================================================
-- 4. LA PROIEZIONE DICHIARA DI ESSERE SE STESSA
-- ============================================================================
-- Unica differenza rispetto alla versione di 20260810120000: il parametro di
-- sessione viene acceso prima della UPSERT e SPENTO subito dopo. Spegnerlo non
-- e' pignoleria: lasciandolo acceso, qualunque altra scrittura nella stessa
-- transazione passerebbe la guardia senza esserne titolata.
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
  v_raw_payload jsonb;
  v_actual record;
begin
  select s.*, c.external_transaction_id, c.owner_user_id
    into v_win
  from private.billing_purchase_states s
  join private.billing_purchase_claims c
    on c.billing_source = s.billing_source
   and c.ownership_key  = s.ownership_key
  where c.owner_user_id = p_user_id
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
    v_win.external_transaction_id, v_win.active_until,
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

revoke all on function private._billing_project_entitlement(uuid) from public, anon, authenticated, service_role;
