-- ============================================================================
-- RIACQUISIZIONE DI UNA TOMBSTONE — INC-APPLE-RESTORE-190-OWNER-DELETED
--
-- IL FATTO
-- --------
-- 01/09/2026 22:34:13Z: un Lifetime Apple viene comprato, il JWS verificato,
-- il claim registrato, lo stato proiettato `active`. L'acquisto funziona.
-- 02/09/2026 04:02:15Z: l'utente cancella il proprio account. Il trigger
-- `trg_billing_lock_before_user_delete` anonimizza il claim: `owner_user_id`
-- va a NULL, `anonymized_at` viene impostato. La riga resta, ancora `active`.
-- 02/09/2026 04:02:39Z: la stessa persona si iscrive di nuovo, 24 secondi
-- dopo. Dalle 04:08 alle 04:49 tocca «Ripristina acquisti» 52 volte. Ogni
-- volta il JWS viene verificato correttamente, e ogni volta
-- `claim_store_purchase` trova la tombstone e risponde `owned_by_other_user`
-- -> HTTP 409 `purchase_already_linked`, `owner_deleted: true`.
--
-- PERCHE' NON ERA UN BUG, E PERCHE' VA CAMBIATO LO STESSO
-- ------------------------------------------------------
-- Il rifiuto e' scritto di proposito in
-- `private._billing_purchase_claims_immutable`:
--
--   «la proprieta' non si riassegna. Una tombstone non torna reclamabile e un
--    acquisto non passa da un utente all'altro con una UPDATE.»
--
-- La regola difende una cosa giusta — che un acquisto non migri fra due
-- persone — ma la applica anche quando **non c'e' nessun'altra persona**: il
-- proprietario precedente non esiste piu'. Il risultato e' che cancellare il
-- proprio account brucia per sempre un Lifetime gia' pagato, e non e' un caso
-- limite: cancellare e ri-registrarsi e' una cosa che la gente fa.
--
-- COSA AUTORIZZA LA RIASSEGNAZIONE
-- --------------------------------
-- Un JWS firmato da Apple per QUELLA transazione. E' prova di possesso: solo
-- chi ha davvero l'acquisto puo' produrlo, e il backend lo verifica contro le
-- radici Apple PRIMA di chiamare questa funzione. Non e' il supporto a
-- decidere di chi sia l'acquisto: e' la crittografia.
--
-- L'UNICA TRANSIZIONE APERTA
-- --------------------------
--     owner_user_id IS NULL     AND anonymized_at IS NOT NULL
--  -> owner_user_id = <chiamante autenticato> AND anonymized_at IS NULL
--
-- Tutto il resto dell'immutabilita' resta esattamente com'era. In
-- particolare NON si apre: il trasferimento fra due proprietari vivi, la
-- DELETE, il cambio di identita' store (billing_source, ownership_key,
-- external_transaction_id, external_product_id, environment, claimed_at).
--
-- CONCORRENZA
-- -----------
-- Due account che presentano la stessa transazione nello stesso istante sono
-- gia' serializzati dal lock avvisorio sulla chiave
-- (`billing-purchase-claim:<source>:<key>`), preso prima della SELECT. Il
-- secondo trova la riga gia' assegnata e riceve `owned_by_other_user`. La
-- UPDATE porta comunque le condizioni nella WHERE: se un giorno l'ordine dei
-- lock cambiasse, il perdente scriverebbe zero righe invece di sovrascrivere.
-- ============================================================================

-- ── 1. Il registro delle riacquisizioni ─────────────────────────────────────
--
-- Append-only, in `private` come il resto del registro: non e' esposto
-- all'API. Contiene chi ha ripreso cosa e quando. NON contiene email, Order
-- ID, JWS ne' ricevute. `ownership_key` c'e' gia' in
-- `billing_purchase_claims`: ometterla qui non proteggerebbe niente e
-- renderebbe la riga inservibile al supporto.
create table if not exists private.billing_riacquisizioni (
  id                        bigint generated always as identity primary key,
  billing_source            text        not null,
  ownership_key             text        not null,
  -- NULLABILE di proposito: la FK e' `on delete set null`, e quando la
  -- persona cancella l'account il suo id deve sparire da qui. Dichiararla
  -- `not null` rendeva la cancellazione impossibile — un vincolo di
  -- integrita' che vietava un diritto. Trovato eseguendo il caso 11.
  nuovo_proprietario        uuid        references auth.users(id) on delete set null,
  claim_originale_at        timestamptz not null,
  tombstone_anonimizzata_at timestamptz not null,
  riacquisito_at            timestamptz not null default now()
);

comment on table private.billing_riacquisizioni is
  'Chi ha ripreso una tombstone, quando, e da quale tombstone. Append-only. Nessun segreto: niente email, Order ID, JWS o ricevute.';

alter table private.billing_riacquisizioni enable row level security;
revoke all on table private.billing_riacquisizioni from public, anon, authenticated, service_role;

create or replace function private._billing_riacquisizioni_append_only()
returns trigger language plpgsql set search_path to '' as $$
begin
  -- UNICA eccezione: l'anonimizzazione quando il proprietario cancella il
  -- proprio account. La FK e' `on delete set null`, quindi la cancellazione
  -- arriva qui come UPDATE di quella sola colonna.
  --
  -- Senza questa porta, la tabella di audit avrebbe BLOCCATO la cancellazione
  -- dell'account — cioe' un percorso GDPR — per proteggere un registro che
  -- non e' piu' importante del diritto di andarsene. Trovato dal caso 11 di
  -- `94-riacquisizione-tombstone.sql`, che cancella l'utente dopo la
  -- riacquisizione: senza questo ramo il test muore, ed e' il test ad avere
  -- ragione.
  --
  -- Il fatto resta: quale transazione, quando, da quale tombstone. Sparisce
  -- solo CHI, che e' esattamente cio' che la cancellazione deve portare via.
  if tg_op = 'UPDATE'
     and old.nuovo_proprietario is not null
     and new.nuovo_proprietario is null
     and new.billing_source            is not distinct from old.billing_source
     and new.ownership_key             is not distinct from old.ownership_key
     and new.claim_originale_at        is not distinct from old.claim_originale_at
     and new.tombstone_anonimizzata_at is not distinct from old.tombstone_anonimizzata_at
     and new.riacquisito_at            is not distinct from old.riacquisito_at then
    return new;
  end if;

  raise exception
    'private.billing_riacquisizioni: append-only. Una riacquisizione e'' un fatto avvenuto: non si modifica e non si cancella. L'' unica scrittura ammessa e'' l''anonimizzazione del proprietario alla cancellazione del suo account.'
    using errcode = '42501';
end;
$$;

drop trigger if exists trg_billing_riacquisizioni_append_only on private.billing_riacquisizioni;
create trigger trg_billing_riacquisizioni_append_only
  before update or delete on private.billing_riacquisizioni
  for each row execute function private._billing_riacquisizioni_append_only();

-- ── 2. Il trigger di immutabilita', con UNA porta in piu' ───────────────────
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

  -- Transizione 1: anonimizzazione. Normalizzata qui perche' la RI action
  -- della FK aggiorna la sola colonna owner_user_id.
  if old.owner_user_id is not null and new.owner_user_id is null then
    new.anonymized_at := coalesce(new.anonymized_at, old.anonymized_at, pg_catalog.now());
    new.app_account_token := null;
    return new;
  end if;

  -- Transizione 2 (02/09/2026): RIACQUISIZIONE di una tombstone.
  --
  -- Da «di nessuno» a «di qualcuno», mai da «di qualcuno» a «di qualcun
  -- altro»: `old.owner_user_id is null` e' il cardine, e non e' aggirabile
  -- perche' l'unico modo di arrivarci e' la transizione 1, che scatta solo
  -- quando l'account viene cancellato davvero.
  --
  -- La tombstone deve risalire INTERA: proprietario presente e
  -- `anonymized_at` azzerato insieme. Una riga con proprietario e
  -- `anonymized_at` ancora valorizzato sarebbe uno stato che nessuna delle
  -- due transizioni sa descrivere, e il prossimo che la legge dovrebbe
  -- indovinare.
  if old.owner_user_id is null
     and old.anonymized_at is not null
     and new.owner_user_id is not null
     and new.anonymized_at is null then
    return new;
  end if;

  if new.owner_user_id is distinct from old.owner_user_id then
    raise exception
      'private.billing_purchase_claims: la proprieta'' non si riassegna. Un acquisto non passa da un utente all''altro con una UPDATE. L''unica risalita ammessa e'' la riacquisizione di una tombstone (owner NULL + anonymized_at valorizzato).'
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

-- ── 3. La funzione di claim, con il ramo di riacquisizione ─────────────────
-- Corpo ripreso alla lettera da 20260825130100_billing_autorita_canonica.sql
-- (righe 959-1220): cambia SOLO il blocco `if v_found then`. Tutto il resto
-- — validazioni, ordine dei lock, proiezione, revoche in attesa — e' identico.
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

    elsif v_existing_owner is null
      and v_existing_anonymized_at is not null
      -- ── PERIMETRO DELLA 190, RISTRETTO DI PROPOSITO ────────────────────
      --
      -- Apple, e solo transazioni SENZA `appAccountToken`: e' esattamente la
      -- classe legacy, gli acquisti fatti da build che non impostavano il
      -- token. E' il caso di Katie e degli altri acquisti Apple dello stesso
      -- periodo. NON risolve ogni cancellazione futura, e non va raccontato
      -- cosi'.
      --
      -- Gli acquisti CON `appAccountToken` non passano di qui, e allargare
      -- questa porta non li aiuterebbe comunque: dopo una nuova registrazione
      -- il JWS porta ancora l'UUID del vecchio account, e la route li
      -- respinge con `purchase_belongs_to_other_account` PRIMA di arrivare a
      -- questa funzione. Per loro serve altro — aggiornare il token presso
      -- Apple, o un contratto esplicito di migrazione account — ed e' un
      -- progetto della 191. Il confronto token/account NON si indebolisce
      -- adesso per anticiparlo.
      --
      -- Google Play resta fuori finche' non esistono una fixture e una
      -- decisione sue: il suo modello di proprieta' non e' questo.
      and p_billing_source = 'apple_iap'
      and p_app_account_token is null then
      -- ── RIACQUISIZIONE DI UNA TOMBSTONE (02/09/2026) ────────────────────
      --
      -- Il proprietario precedente ha cancellato il proprio account: questa
      -- transazione non e' di nessuno. Chi arriva qui ha gia' presentato un
      -- JWS firmato da Apple per questa stessa chiave, verificato dal backend
      -- contro le radici Apple PRIMA della chiamata: e' prova di possesso, e
      -- non toglie niente a nessuno perche' non c'e' nessun altro.
      --
      -- QUI SI CLASSIFICA SOLTANTO. La scrittura sta nel blocco atomico piu'
      -- sotto, insieme allo stato, alle revoche in attesa e alla proiezione.
      -- Nella prima stesura UPDATE e audit stavano qui, cioe' FUORI dal
      -- blocco con l'handler: se la proiezione falliva e l'esito diventava
      -- `persistence_failed`, la riassegnazione era gia' avvenuta e poteva
      -- essere committata. La frase «non e' stato scritto niente» deve essere
      -- vera anche per la riacquisizione.
      v_outcome := 'reclaimed_after_owner_deletion';
      -- `claimed_at` e' immutabile e resta quello dell'acquisto vero: la
      -- data in cui la persona ha pagato, non quella in cui l'ha ripresa.
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
    if v_outcome = 'reclaimed_after_owner_deletion' then
      -- Le condizioni tornano nella WHERE anche se il lock avvisorio sulla
      -- chiave le ha gia' rese esclusive: se un domani quell'ordine
      -- cambiasse, il perdente di una corsa scriverebbe zero righe invece di
      -- sovrascrivere un proprietario appena assegnato.
      update private.billing_purchase_claims c
         set owner_user_id     = p_owner_user_id,
             anonymized_at     = null,
             app_account_token = p_app_account_token
       where c.billing_source = p_billing_source
         and c.ownership_key  = p_ownership_key
         and c.owner_user_id is null
         and c.anonymized_at is not null;

      if not found then
        return pg_catalog.jsonb_build_object(
          'outcome', 'owned_by_other_user',
          'billingSource', p_billing_source,
          'claimedAt', v_existing_claimed_at,
          'ownerDeleted', false
        );
      end if;

      insert into private.billing_riacquisizioni (
        billing_source, ownership_key, nuovo_proprietario,
        claim_originale_at, tombstone_anonimizzata_at
      ) values (
        p_billing_source, p_ownership_key, p_owner_user_id,
        v_existing_claimed_at, v_existing_anonymized_at
      );
    end if;

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
$function$

