-- ============================================================================
-- ROLLBACK di 20260815120000_billing_autorita_unica_revoche
--
-- ATTENZIONE, LEGGERE PRIMA DI ESEGUIRE.
--
-- Questo rollback RIAPRE un difetto che costa denaro. Dopo averlo eseguito:
--
--   * sul PAREGGIO di store_event_at il claim torna a cancellare la revoca in
--     attesa senza averla applicata. Quella e' l'ultima copia del rimborso —
--     il claim raccoglie le pending dentro la propria transazione — quindi il
--     rimborso smette di esistere e il cliente resta Pro per sempre;
--   * il pareggio e' la forma NORMALE di una verifyReceipt che contiene
--     insieme una transazione viva e una annullata dello stesso prodotto,
--     perche' la route legacy passa lo stesso requestDateMs a entrambe le
--     chiamate. Non e' un caso raro;
--   * la postcondizione torna a essere scritta in due posti che divergono.
--
-- Si esegue solo per provare che il rollback esista e funzioni, dentro una
-- transazione che si annulla, oppure in un'emergenza in cui la migration
-- nuova stia facendo danni peggiori di questi.
-- ============================================================================

-- 1. Via l'autorita' unica.
drop function if exists private._billing_consuma_pending(text, text, timestamptz);

-- 2. Il comparatore torna alla versione senza il ramo del pareggio.
create or replace function private._billing_evidenza_supera(
  p_vecchia_fonte text, p_vecchia_at timestamptz, p_vecchio_stato text,
  p_nuova_fonte text,   p_nuova_at timestamptz,   p_nuovo_stato text
)
returns boolean
language sql
immutable
set search_path to ''
as $$
  select case
    -- Un segnaposto non cancella mai un'evidenza store, nemmeno se piu'
    -- recente: e' il caso in cui la 189 riscrive una riga vecchia mentre
    -- l'acquisto e' gia' stato verificato dal percorso nuovo.
    when p_nuova_fonte in ('projection_backfill', 'projection_compatibility')
     and p_vecchia_fonte not in ('projection_backfill', 'projection_compatibility')
      then false
    -- Un'evidenza store supera sempre un segnaposto, anche se anteriore: i due
    -- valori non stanno sullo stesso orologio, e fra i due solo quello dello
    -- store dice qualcosa sull'acquisto.
    when p_vecchia_fonte in ('projection_backfill', 'projection_compatibility')
     and p_nuova_fonte not in ('projection_backfill', 'projection_compatibility')
      then true
    -- UNA REVOCA JWS NON SI ANNULLA CON UNA RICEVUTA LEGACY, E VALE NEI DUE
    -- VERSI.
    --
    -- `revoked` NON e' assorbente: Apple prevede REFUND_REVERSED, cioe'
    -- l'annullamento di un rimborso, e in quel caso l'accesso va RIPRISTINATO
    -- sullo stesso originalTransactionId. Una fotografia JWS piu' recente
    -- senza revoca deve quindi poter riattivare.
    --
    -- Ma verifyReceipt (StoreKit 1) non porta la stessa informazione: il suo
    -- `request_date_ms` e' solo "quando abbiamo chiesto", e una sua risposta
    -- successiva non e' una prova che il rimborso sia stato annullato.
    --
    -- Quindi: una ricevuta legacy non toglie una revoca JWS gia' registrata...
    when p_vecchio_stato = 'revoked'
     and p_nuovo_stato <> 'revoked'
     and p_vecchia_fonte = 'apple_signed_date'
     and p_nuova_fonte = 'apple_request_date'
      then false
    -- ...e non le sbarra nemmeno la strada quando arriva per prima. Era questo
    -- il ramo mancante, e non era simmetria per eleganza: `request_date` e'
    -- l'istante in cui NOI abbiamo chiesto, `signedDate` quello in cui APPLE
    -- ha firmato il rimborso. Il primo e' quasi sempre il piu' recente — basta
    -- che il cliente riapra l'app dopo essere stato rimborsato — e senza
    -- questo ramo la revoca perdeva il confronto per sempre.
    when p_vecchio_stato <> 'revoked'
     and p_nuovo_stato = 'revoked'
     and p_vecchia_fonte = 'apple_request_date'
     and p_nuova_fonte = 'apple_signed_date'
      then true
    -- Stessa classe di orologio: vince la fotografia piu' recente. E' la
    -- regola che Apple documenta per ordinare le evidenze della stessa
    -- transazione.
    else p_nuova_at > p_vecchia_at
  end;
$$;

-- 3. I due chiamanti tornano alle definizioni precedenti, DELETE
--    incondizionata inclusa. Sono i corpi estratti dal database prima della
--    migration, non riscritti a mano.

CREATE OR REPLACE FUNCTION public.claim_store_purchase(p_billing_source text, p_ownership_key text, p_owner_user_id uuid, p_external_product_id text, p_purchase_kind text, p_environment text, p_state text, p_active_until timestamp with time zone, p_auto_renewing boolean, p_store_event_at timestamp with time zone, p_store_event_source text, p_external_transaction_id text DEFAULT NULL::text, p_app_account_token uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_pending record;
  v_existing_owner uuid;
  v_existing_anonymized_at timestamptz;
  v_existing_claimed_at timestamptz;
  v_found boolean;
  v_outcome text;
  v_claimed_at timestamptz;
  v_state_applied boolean := false;
  v_entitlement jsonb;
  v_sqlstate text;
  v_message text;
begin
  if p_owner_user_id is null then
    raise exception 'claim_store_purchase: p_owner_user_id obbligatorio' using errcode = '22004';
  end if;
  if p_billing_source is null or p_billing_source not in ('apple_iap', 'google_play') then
    raise exception 'claim_store_purchase: p_billing_source deve essere apple_iap o google_play (ricevuto %). founder_grant, grandfather e trial non sono acquisti store e non hanno un claim.', p_billing_source
      using errcode = '22023';
  end if;
  if p_ownership_key is null or length(p_ownership_key) = 0 then
    raise exception 'claim_store_purchase: p_ownership_key obbligatorio' using errcode = '22004';
  end if;

  if p_external_product_id is null
     or p_external_product_id not in ('fitmesh_pro_lifetime', 'fitmesh_pro_sub') then
    raise exception 'claim_store_purchase: p_external_product_id "%" non e uno degli SKU supportati (fitmesh_pro_lifetime, fitmesh_pro_sub).', left(coalesce(p_external_product_id, '<null>'), 40)
      using errcode = '22023';
  end if;

  if p_purchase_kind is null or p_purchase_kind not in ('lifetime', 'subscription') then
    raise exception 'claim_store_purchase: p_purchase_kind deve essere lifetime o subscription (ricevuto %)', p_purchase_kind
      using errcode = '22023';
  end if;
  if (p_external_product_id = 'fitmesh_pro_lifetime' and p_purchase_kind <> 'lifetime')
     or (p_external_product_id = 'fitmesh_pro_sub' and p_purchase_kind <> 'subscription') then
    raise exception 'claim_store_purchase: SKU % e tipo % non combaciano.', p_external_product_id, p_purchase_kind
      using errcode = '22023';
  end if;

  if p_environment is null or p_environment not in ('production', 'sandbox') then
    raise exception 'claim_store_purchase: p_environment deve essere production o sandbox (ricevuto %)', p_environment
      using errcode = '22023';
  end if;
  if p_active_until is null then
    raise exception 'claim_store_purchase: p_active_until obbligatorio' using errcode = '22004';
  end if;

  if p_state is null or p_state not in ('active', 'grace', 'on_hold', 'paused', 'expired', 'cancelled') then
    raise exception 'claim_store_purchase: p_state non ammesso su questo percorso (ricevuto %). Per rimborso o revoca usare public.record_store_purchase_revocation.', p_state
      using errcode = '22023';
  end if;

  if p_store_event_at is null or p_store_event_source is null then
    raise exception 'claim_store_purchase: p_store_event_at e p_store_event_source obbligatori. Senza un ordinamento dichiarato non si puo'' sapere se questa evidenza sia piu'' recente di quella registrata, e in dubbio non si scrive.'
      using errcode = '22004';
  end if;
  -- Il backend dichiara solo orologi di store. I segnaposto sono del backfill
  -- e della guardia di compatibilita', e non regrediscono mai: metterli in
  -- mano al chiamante significherebbe dargli il modo di murare uno stato che
  -- nessuno store sostiene.
  if p_store_event_source not in ('apple_signed_date', 'apple_request_date', 'google_backend_fetch') then
    raise exception 'claim_store_purchase: p_store_event_source "%" non e'' un orologio di store. I segnaposto (projection_backfill, projection_compatibility) non si dichiarano da qui.', p_store_event_source
      using errcode = '22023';
  end if;
  if p_store_event_at > pg_catalog.now() + interval '24 hours' then
    raise exception 'claim_store_purchase: p_store_event_at nel futuro (%). Un orologio store cosi'' avanti non e'' un ordinamento affidabile.', p_store_event_at
      using errcode = '22023';
  end if;

  if p_app_account_token is not null and p_app_account_token <> p_owner_user_id then
    raise exception 'claim_store_purchase: app_account_token non coincide con il proprietario. Il binding di account va risolto nel backend PRIMA del claim.'
      using errcode = '22023';
  end if;

  -- ORDINE UNICO DEI LOCK — gradini 0 e 1. Vedi il blocco "L'ORDINE UNICO DEI
  -- LOCK" in testa a questa migration.
  --
  -- Il `for key share` su auth.users lo prenderebbe comunque la FK del
  -- registro, ma alla fine e non all'inizio: prenderlo qui e' cio' che mette
  -- questa transazione nello stesso ordine di una cancellazione account.
  perform 1 from auth.users u where u.id = p_owner_user_id for key share;
  perform 1 from public.b2c_subscriptions t
   where t.user_id = p_owner_user_id for update;

  perform pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext(p_owner_user_id::text));
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('billing-purchase-claim:' || p_billing_source || ':' || p_ownership_key)
  );

  select c.owner_user_id, c.anonymized_at, c.claimed_at
    into v_existing_owner, v_existing_anonymized_at, v_existing_claimed_at
  from private.billing_purchase_claims c
  where c.billing_source = p_billing_source
    and c.ownership_key = p_ownership_key;
  v_found := found;

  if v_found then
    if v_existing_owner is not null and v_existing_owner = p_owner_user_id then
      v_outcome := 'already_owned_by_same_user';
      v_claimed_at := v_existing_claimed_at;
    else
      return pg_catalog.jsonb_build_object(
        'outcome', 'owned_by_other_user',
        'billingSource', p_billing_source,
        'claimedAt', v_existing_claimed_at,
        'ownerDeleted', v_existing_anonymized_at is not null
      );
    end if;
  else
    v_outcome := 'claimed';
  end if;

  begin
    if v_outcome = 'claimed' then
      insert into private.billing_purchase_claims (
        billing_source, ownership_key, external_transaction_id,
        external_product_id, owner_user_id, environment,
        app_account_token, claimed_at
      ) values (
        p_billing_source, p_ownership_key, p_external_transaction_id,
        p_external_product_id, p_owner_user_id, p_environment,
        p_app_account_token, pg_catalog.now()
      )
      returning claimed_at into v_claimed_at;
    end if;

    insert into private.billing_purchase_states (
      billing_source, ownership_key, external_product_id, purchase_kind,
      state, active_until, auto_renewing,
      store_event_at, store_event_source, verified_at
    ) values (
      p_billing_source, p_ownership_key, p_external_product_id, p_purchase_kind,
      p_state, p_active_until, coalesce(p_auto_renewing, false),
      p_store_event_at, p_store_event_source, pg_catalog.now()
    )
    on conflict (billing_source, ownership_key) do update set
      external_product_id = excluded.external_product_id,
      purchase_kind       = excluded.purchase_kind,
      state               = excluded.state,
      active_until        = excluded.active_until,
      auto_renewing       = excluded.auto_renewing,
      store_event_at      = excluded.store_event_at,
      store_event_source  = excluded.store_event_source,
      verified_at         = excluded.verified_at
    where private._billing_evidenza_supera(
            private.billing_purchase_states.store_event_source,
            private.billing_purchase_states.store_event_at,
            private.billing_purchase_states.state,
            excluded.store_event_source,
            excluded.store_event_at,
            excluded.state);

    v_state_applied := found;

    -- ── IL RIMBORSO CHE E' ARRIVATO PRIMA DELL'ACQUISTO ──────────────────
    --
    -- Prima di proiettare qualunque diritto, si guarda se per questa chiave
    -- esiste gia' una revoca in attesa. Ce n'e' una quando l'evidenza del
    -- rimborso e' arrivata mentre l'acquisto non era ancora nel registro:
    -- succede nella corsa fra revoca e claim, e succede — piu' spesso — quando
    -- un client valida tardi una transazione gia' rimborsata.
    --
    -- Senza questo passaggio quella revoca veniva scartata e il claim
    -- successivo concedeva il Pro su un acquisto rimborsato. Con questo, il
    -- fatto aspetta il suo acquisto e gli si applica addosso.
    select * into v_pending
    from private.billing_pending_revocations r
    where r.billing_source = p_billing_source
      and r.ownership_key  = p_ownership_key;

    if found then
      insert into private.billing_purchase_states (
        billing_source, ownership_key, external_product_id, purchase_kind,
        state, active_until, auto_renewing,
        store_event_at, store_event_source, revocation_at, verified_at
      ) values (
        p_billing_source, p_ownership_key, v_pending.external_product_id,
        v_pending.purchase_kind, 'revoked',
        case when v_pending.purchase_kind = 'lifetime'
             then '9999-12-31T23:59:59Z'::timestamptz
             else v_pending.store_event_at end,
        false,
        v_pending.store_event_at, v_pending.store_event_source,
        coalesce(v_pending.revocation_at, v_pending.store_event_at), pg_catalog.now()
      )
      on conflict (billing_source, ownership_key) do update set
        state              = 'revoked',
        auto_renewing      = false,
        store_event_at     = excluded.store_event_at,
        store_event_source = excluded.store_event_source,
        revocation_at      = excluded.revocation_at,
        verified_at        = excluded.verified_at
      -- La stessa regola di precedenza di tutto il resto: se l'evidenza che
      -- stiamo reclamando adesso e' PIU' RECENTE della revoca in attesa, la
      -- revoca perde ed e' giusto cosi' — e' il caso di un riacquisto dopo un
      -- rimborso, che deve tornare a dare accesso.
      where private._billing_evidenza_supera(
              private.billing_purchase_states.store_event_source,
              private.billing_purchase_states.store_event_at,
              private.billing_purchase_states.state,
              excluded.store_event_source,
              excluded.store_event_at,
              excluded.state);

      -- Consumata: applicata o battuta da un'evidenza piu' recente, in
      -- entrambi i casi ha smesso di essere in attesa.
      delete from private.billing_pending_revocations r
       where r.billing_source = p_billing_source
         and r.ownership_key  = p_ownership_key;
    end if;

    v_entitlement := private._billing_project_entitlement(p_owner_user_id);

  exception
    -- ── UN RIFIUTO NON E' UN GUASTO ──────────────────────────────────────
    --
    -- Il cancello Sandbox vive sulla tabella, quindi si manifesta qui dentro
    -- come eccezione durante la scrittura. Senza questo ramo finiva nel
    -- `when others` e usciva come `persistence_failed`, che per il client
    -- significa "colpa nostra, riprova": un rifiuto di autorizzazione
    -- diventava un ciclo di tentativi infiniti su una cosa che non sara' mai
    -- concessa. Si rilancia, e chi chiama riceve un rifiuto vero.
    when insufficient_privilege or invalid_parameter_value then
      raise;
    when unique_violation then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_message = message_text;
      return pg_catalog.jsonb_build_object(
        'outcome', 'persistence_failed',
        'reason', 'projection_or_registry_unique_violation',
        'sqlstate', v_sqlstate,
        'message', v_message
      );
    when others then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_message = message_text;
      return pg_catalog.jsonb_build_object(
        'outcome', 'persistence_failed',
        'reason', 'write_failed',
        'sqlstate', v_sqlstate,
        'message', v_message
      );
  end;

  return pg_catalog.jsonb_build_object(
    'outcome', v_outcome,
    'billingSource', p_billing_source,
    'claimedAt', v_claimed_at,
    'ownerDeleted', false,
    'stateApplied', v_state_applied,
    'entitlement', v_entitlement
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.billing_apply_pending_revocations(p_max integer DEFAULT 100)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r record;
  v_esito jsonb;
  v_outcome text;
  v_superata boolean;
  n integer := 0;
begin
  if not pg_catalog.pg_try_advisory_xact_lock(2, 815150000) then
    return 0;
  end if;

  for r in
    select p.billing_source, p.ownership_key, p.external_product_id,
           p.purchase_kind, p.store_event_at, p.store_event_source,
           p.revocation_at
    from private.billing_pending_revocations p
    join private.billing_purchase_claims c
      on c.billing_source = p.billing_source
     and c.ownership_key  = p.ownership_key
    where c.owner_user_id is not null
    order by p.billing_source, p.ownership_key
    limit p_max
  loop
    begin
      -- L'ESITO SI GUARDA. Era un `perform`, cioe' un valore buttato via.
      v_esito := public.record_store_purchase_revocation(
        r.billing_source, r.ownership_key, r.external_product_id,
        r.purchase_kind, r.store_event_at, r.store_event_source,
        r.revocation_at
      );
      v_outcome := v_esito->>'outcome';

      -- (b) Superata: nel registro c'e' un'evidenza che per contratto batte
      -- questa revoca. Si chiede al comparatore canonico, non a `>`: le due
      -- domande sembrano la stessa e non lo sono (vedi il blocco in testa).
      --
      -- Si chiede al registro invece di dedurlo dall'esito, perche' la RPC
      -- risponde `not_persisted` sia quando ha perso il confronto sia quando
      -- non e' riuscita a scrivere, e le due cose meritano destini opposti.
      select private._billing_evidenza_supera(
               r.store_event_source, r.store_event_at, 'revoked',
               s.store_event_source, s.store_event_at, s.state)
        into v_superata
      from private.billing_purchase_states s
      where s.billing_source = r.billing_source
        and s.ownership_key  = r.ownership_key;

      -- Nessuno stato registrato: non c'e' niente che possa aver superato la
      -- revoca, quindi non e' superata. In dubbio la riga resta.
      v_superata := coalesce(v_superata, false);

      if (v_outcome = 'revoked' and coalesce((v_esito->>'persisted')::boolean, false))
         or v_outcome = 'owner_deleted'
         or v_superata
      then
        delete from private.billing_pending_revocations p
         where p.billing_source = r.billing_source
           and p.ownership_key  = r.ownership_key
           -- Si cancella la riga CHE ABBIAMO LETTO, non "la riga di quella
           -- chiave". Se nel frattempo ne fosse arrivata una piu' recente,
           -- quella deve sopravvivere e aspettare il proprio giro.
           and p.store_event_at = r.store_event_at;
        n := n + 1;
      else
        raise warning 'revoca in attesa NON applicata e conservata (% %): esito %',
          r.billing_source, left(r.ownership_key, 8), coalesce(v_outcome, 'sconosciuto');
      end if;

    exception when others then
      -- Una riga che solleva non deve fermare le altre, e NON si cancella.
      raise warning 'revoca in attesa non applicata (% %): %',
        r.billing_source, left(r.ownership_key, 8), sqlerrm;
    end;
  end loop;

  return n;
end;
$function$;

do $$
begin
  raise notice 'rollback 20260815120000 eseguito.';
  raise notice 'ATTENZIONE: sul pareggio di store_event_at un rimborso torna a sparire senza essere applicato.';
end $$;
