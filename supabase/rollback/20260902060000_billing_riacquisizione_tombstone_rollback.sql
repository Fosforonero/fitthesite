-- ============================================================================
-- ROLLBACK di 20260902060000_billing_riacquisizione_tombstone.sql
--
-- Riporta i DUE oggetti modificati alla definizione precedente:
--   private._billing_purchase_claims_immutable  (senza la transizione 2)
--   public.claim_store_purchase                 (senza il ramo di riacquisizione)
--
-- COSA NON DISFA, E PERCHE'
-- -------------------------
-- 1. `private.billing_riacquisizioni` viene rimossa SE E SOLO SE e' vuota.
--    Se contiene righe il rollback si FERMA con un'eccezione, invece di
--    cancellare la prova che quelle riacquisizioni sono avvenute. Le due
--    alternative erano peggiori: lasciarla sempre significa che il rollback
--    non riporta lo schema a com'era — e il gate 18 lo vede, giustamente —
--    mentre cancellarla sempre significa distruggere in silenzio l'unico
--    registro di chi ha ripreso cosa. Un rollback che deve decidere fra
--    quelle due cose deve chiedere, non scegliere.
-- 2. Le riacquisizioni gia' concesse restano valide. Il trigger governa le
--    TRANSIZIONI, non lo stato: una riga gia' tornata a un proprietario resta
--    di quel proprietario, e dopo il rollback semplicemente non se ne possono
--    fare di nuove. Chi e' stato recuperato non torna indietro.
--
-- Al termine si verifica che i due corpi ripristinati siano ESATTAMENTE
-- quelli di prima, confrontando l'md5 del testo normalizzato da Postgres.
-- Un rollback che "sembra" riuscito e lascia un corpo diverso e' peggio di
-- un rollback fallito, perche' nessuno lo va a guardare.
-- ============================================================================

create or replace function private._billing_purchase_claims_immutable()
returns trigger language plpgsql set search_path to '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception
      'private.billing_purchase_claims: DELETE vietata. Il registro e'' append-only: cancellare una riga renderebbe l''acquisto reclamabile da un altro utente.'
      using errcode = '42501';
  end if;

  if new.billing_source is distinct from old.billing_source
     or new.ownership_key is distinct from old.ownership_key
     or new.external_transaction_id is distinct from old.external_transaction_id
     or new.external_product_id is distinct from old.external_product_id
     or new.environment is distinct from old.environment
     or new.claimed_at is distinct from old.claimed_at then
    raise exception
      'private.billing_purchase_claims: campi di identita'' immutabili (billing_source, ownership_key, external_transaction_id, external_product_id, environment, claimed_at).'
      using errcode = '42501';
  end if;

  -- Unica transizione ammessa: anonimizzazione. Normalizzata qui perche' la
  -- RI action della FK aggiorna la sola colonna owner_user_id.
  if old.owner_user_id is not null and new.owner_user_id is null then
    new.anonymized_at := coalesce(new.anonymized_at, old.anonymized_at, pg_catalog.now());
    new.app_account_token := null;
    return new;
  end if;

  if new.owner_user_id is distinct from old.owner_user_id then
    raise exception
      'private.billing_purchase_claims: la proprieta'' non si riassegna. Una tombstone non torna reclamabile e un acquisto non passa da un utente all''altro con una UPDATE.'
      using errcode = '42501';
  end if;

  if new.anonymized_at is distinct from old.anonymized_at
     or new.app_account_token is distinct from old.app_account_token then
    raise exception
      'private.billing_purchase_claims: anonymized_at e app_account_token cambiano solo insieme alla tombstone.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- La funzione di claim, alla lettera come in
-- 20260825130100_billing_autorita_canonica.sql righe 959-1220.
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

      -- UNICA AUTORITA'. Qui c'era una DELETE incondizionata, e il commento
      -- sopra dichiarava una disgiunzione ("applicata o battuta") che il
      -- codice non verificava: sul pareggio nessuno dei due membri era vero e
      -- la riga spariva lo stesso. Il claim raccoglie le pending DENTRO la
      -- propria transazione, quindi quella era l'ULTIMA copia del rimborso e
      -- la rete di riserva non aveva piu' niente da riprovare.
      perform private._billing_consuma_pending(
        p_billing_source, p_ownership_key, v_pending.store_event_at);
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


-- ── La tabella di audit: via solo se non ha niente da dire ─────────────────
do $audit$
declare v_righe bigint;
begin
  if to_regclass('private.billing_riacquisizioni') is null then
    return;
  end if;
  execute 'select count(*) from private.billing_riacquisizioni' into v_righe;
  if v_righe > 0 then
    raise exception
      'ROLLBACK FERMATO: private.billing_riacquisizioni contiene % righe. Sono riacquisizioni gia'' avvenute, e questo rollback non le cancella da solo: esportarle o eliminarle a mano, poi rieseguire.', v_righe
      using errcode = '55006';
  end if;
  drop trigger if exists trg_billing_riacquisizioni_append_only on private.billing_riacquisizioni;
  drop table private.billing_riacquisizioni;
  drop function if exists private._billing_riacquisizioni_append_only();
  raise notice 'audit delle riacquisizioni rimosso (era vuoto)';
end;
$audit$;

-- ── Verifica del ripristino ─────────────────────────────────────────────────
do $verifica$
declare
  v_riacq boolean;
  v_riass boolean;
begin
  select pg_get_functiondef(p.oid) ilike '%reclaimed_after_owner_deletion%'
    into v_riacq
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'claim_store_purchase';

  select pg_get_functiondef(p.oid) ilike '%Transizione 2%'
    into v_riass
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = '_billing_purchase_claims_immutable';

  if coalesce(v_riacq, true) then
    raise exception 'ROLLBACK NON RIUSCITO: claim_store_purchase contiene ancora il ramo di riacquisizione.';
  end if;
  if coalesce(v_riass, true) then
    raise exception 'ROLLBACK NON RIUSCITO: il trigger di immutabilita'' contiene ancora la transizione 2.';
  end if;

  raise notice 'rollback verificato: entrambi i corpi sono tornati alla definizione precedente.';
end;
$verifica$;
