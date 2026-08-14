-- ============================================================================
-- QUATTRO DIFETTI TROVATI DA UNA REVIEW AVVERSARIALE SU 232bd6c
--
-- Nessuno dei quattro era visibile dai test verdi che li precedevano, e tutti
-- e quattro nascono dalla stessa abitudine: dimostrare la semantica di UNA
-- chiamata e dare per scontato il contorno (l'ambiente, la concorrenza, chi
-- altro scrive sulle stesse righe).
--
--   1  UNA REVOCA SANDBOX POTEVA COLPIRE UN ACQUISTO DI PRODUZIONE.
--      Il claim namespacia la chiave (`sandbox:<id>`), la revoca no: passava
--      l'`originalTransactionId` nudo. Sandbox e produzione numerano gli
--      identificativi in spazi indipendenti e possono coincidere, quindi una
--      revoca Sandbox non revocava il proprio acquisto e, a ID coincidente,
--      poteva revocare quello di un cliente vero. (Correzione nel backend.)
--
--   2  UNA REVOCA SENZA ACQUISTO VENIVA BUTTATA VIA, E LA RISPOSTA ERA
--      TERMINALE. La segnalazione parlava della corsa (claim non ancora
--      committato, quindi invisibile), ma indagandola si e' visto che la corsa
--      e' il caso raro: quello comune e' l'evidenza del rimborso che arriva
--      PRIMA che l'acquisto sia mai stato reclamato — un client che valida in
--      ritardo una transazione gia' rimborsata. In entrambi i casi si
--      rispondeva `unknown_purchase`, il client chiudeva la transazione, la
--      revoca finiva nel niente e il claim successivo concedeva il Pro su un
--      acquisto rimborsato. Qui sotto.
--
--   3  IL GDPR VERO CONSERVAVA L'ORDINE INVERSO. Il trigger BEFORE DELETE su
--      auth.users impone il gradino giusto a chi cancella dall'API di
--      Supabase, ma `gdpr_process_deletions()` cancella prima
--      `public.profiles` (e in cascata `b2c_subscriptions`) e SOLO DOPO
--      `auth.users`: prende cioe' b2c e poi utente, esattamente al contrario
--      del claim. Il trigger arriva troppo tardi, perche' quando parte l'ABBA
--      e' gia' formato. Qui sotto.
--
--   4  IL CANCELLO SANDBOX VIVEVA SOLO NELLA ROUTE. La RPC accettava
--      `p_environment = 'sandbox'` da chiunque avesse il service_role, senza
--      chiedere se quell'utente fosse un revisore, senza pretendere che la
--      chiave stesse nello spazio separato e senza il legame di account. Una
--      difesa che vive in un solo punto del percorso e' una difesa che il
--      prossimo chiamante aggira senza saperlo. Qui sotto.
--
-- Il quinto, minore ma con la stessa forma: la scadenza dell'allowlist NON
-- toglieva un lifetime Sandbox gia' proiettato. Il permesso scadeva e il Pro
-- restava. Qui sotto, nel ricalcolo.
-- ============================================================================

-- ============================================================================
-- 2. UNA REVOCA SENZA ACQUISTO NON SI BUTTA VIA: ASPETTA IL SUO ACQUISTO
--
-- La segnalazione era sulla concorrenza: la revoca cercava il claim senza
-- prendere nessun lock, quindi non vedeva un claim in volo, rispondeva
-- `unknown_purchase` — che e' terminale — e il claim committava subito dopo.
--
-- Il primo tentativo di correzione e' stato prendere l'advisory lock sulla
-- chiave e rileggere. Non basta, e vale la pena scrivere perche', perche' era
-- una correzione che sembrava completa: il claim quell'advisory lo prende al
-- GRADINO 3, dopo auth.users, dopo b2c e dopo l'advisory sull'utente. Fra
-- l'inizio del claim e il gradino 3 c'e' una finestra in cui il claim e' in
-- volo e non tiene ancora la chiave: una revoca puo' entrare, prenderla,
-- trovare il registro vuoto e rispondere terminale lo stesso.
--
-- Chiudere quella finestra con i lock vorrebbe dire far prendere al claim
-- l'advisory della chiave per PRIMO. Non si puo': la guardia di
-- compatibilita' — quella che intercetta l'UPSERT della 189 — la chiave la
-- ricava dalla riga di proiezione e quindi la prende DOPO b2c, che in una
-- UPDATE semplice l'executor le ha gia' messo in mano. Claim con chiave per
-- prima e guardia con chiave per ultima e' un ABBA nuovo, cioe' si tapperebbe
-- questo buco riaprendo quello che tutto il lavoro precedente ha chiuso.
--
-- Quindi la correzione non e' un lock: e' un FATTO CHE ASPETTA.
--
-- Una revoca che non trova il suo acquisto viene SCRITTA in
-- private.billing_pending_revocations, e il primo claim che reclamera' quella
-- chiave se la trovera' addosso. `unknown_purchase` torna a essere una
-- risposta terminale lecita non perche' abbiamo dimostrato che non c'era
-- nessun claim in volo, ma perche' non ci serve piu' dimostrarlo: comunque
-- vada, il rimborso e' registrato.
--
-- E questo copre un caso molto piu' comune della corsa, che nessuno aveva
-- notato perche' si stava guardando la concorrenza: L'EVIDENZA DEL RIMBORSO
-- CHE ARRIVA PRIMA DELL'ACQUISTO. Un client che valida in ritardo una
-- transazione gia' rimborsata — succede a ogni reinstallazione dopo un
-- rimborso — riceveva `unknown_purchase`, la revoca finiva nel niente, e il
-- claim successivo concedeva il Pro su un acquisto rimborsato. Non e' una
-- corsa: e' una perdita di soldi che capitava in orario d'ufficio.
-- ============================================================================
create table if not exists private.billing_pending_revocations (
  billing_source      text        not null check (billing_source in ('apple_iap', 'google_play')),
  ownership_key       text        not null check (length(ownership_key) between 1 and 64),
  external_product_id text        not null check (external_product_id in ('fitmesh_pro_lifetime', 'fitmesh_pro_sub')),
  purchase_kind       text        not null check (purchase_kind in ('lifetime', 'subscription')),
  -- Gli stessi due orologi del registro: la FOTOGRAFIA ordina, l'EFFICACIA no.
  store_event_at      timestamptz not null,
  store_event_source  text        not null check (store_event_source in ('apple_signed_date', 'apple_request_date', 'google_backend_fetch')),
  revocation_at       timestamptz,
  recorded_at         timestamptz not null default now(),
  primary key (billing_source, ownership_key)
);

comment on table private.billing_pending_revocations is
  'Rimborsi e revoche di acquisti che al momento in cui li abbiamo saputi non '
  'erano (ancora) nel registro. Non sono scarti: sono fatti in attesa del loro '
  'acquisto, e il primo claim su quella chiave se li applica addosso.';

revoke all on private.billing_pending_revocations from public, anon, authenticated, service_role;

-- ── Perche' la revoca puo' ancora rispondere `claim_in_flight` ──────────────
--
-- L'advisory lock sulla chiave resta, e serve a distinguere due situazioni che
-- meritano risposte diverse. Dopo averlo preso si rilegge il registro:
--
--   * il claim NON c'e' -> si scrive la revoca in attesa e si risponde
--     `unknown_purchase`. Il client puo' chiudere: il fatto e' al sicuro.
--
--   * il claim c'e' ADESSO -> ha committato mentre aspettavamo. La revoca in
--     attesa si scrive lo stesso, ma la risposta e' `claim_in_flight`, che NON
--     e' terminale: al giro dopo il claim e' visibile alla prima lettura e si
--     passa dal percorso normale, che revoca davvero invece di rimandare.
--     Non si prosegue qui dentro perche' a quel punto terremmo la chiave e
--     dovremmo chiedere l'utente, cioe' l'inversione descritta sopra.
--
-- Mentre aspetta la chiave questa funzione non tiene NESSUN altro lock, e dopo
-- averla presa non ne aspetta nessuno: non puo' far parte di un ciclo.
-- ============================================================================
create or replace function public.record_store_purchase_revocation(
  p_billing_source text,
  p_ownership_key text,
  p_external_product_id text,
  p_purchase_kind text,
  -- FRESCHEZZA DELLA FOTOGRAFIA: signedDate del JWS che porta la revoca, o
  -- request_date della risposta verifyReceipt. E' l'unico campo che ordina.
  p_store_event_at timestamptz,
  p_store_event_source text,
  -- EFFICACIA del rimborso: revocationDate / cancellation_date_ms. Non ordina
  -- niente, e va conservato perche' e' la data che conta per il supporto e
  -- per la contabilita'.
  p_revocation_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_owner uuid;
  v_owner_recheck uuid;
  v_claim_apparso boolean := false;
  v_applied boolean := false;
  v_persisted boolean := false;
  v_entitlement jsonb;
  v_sqlstate text;
  v_message text;
begin
  if p_billing_source is null or p_billing_source not in ('apple_iap', 'google_play') then
    raise exception 'record_store_purchase_revocation: p_billing_source deve essere apple_iap o google_play (ricevuto %)', p_billing_source
      using errcode = '22023';
  end if;
  if p_ownership_key is null or length(p_ownership_key) = 0 then
    raise exception 'record_store_purchase_revocation: p_ownership_key obbligatorio' using errcode = '22004';
  end if;
  if p_external_product_id is null
     or p_external_product_id not in ('fitmesh_pro_lifetime', 'fitmesh_pro_sub') then
    raise exception 'record_store_purchase_revocation: SKU non supportato' using errcode = '22023';
  end if;
  if p_purchase_kind is null or p_purchase_kind not in ('lifetime', 'subscription') then
    raise exception 'record_store_purchase_revocation: p_purchase_kind non valido' using errcode = '22023';
  end if;
  if p_store_event_at is null or p_store_event_source is null then
    raise exception 'record_store_purchase_revocation: freschezza obbligatoria' using errcode = '22004';
  end if;
  if p_store_event_source not in ('apple_signed_date', 'apple_request_date', 'google_backend_fetch') then
    raise exception 'record_store_purchase_revocation: p_store_event_source "%" non e'' un orologio di store.', p_store_event_source
      using errcode = '22023';
  end if;

  select c.owner_user_id into v_owner
  from private.billing_purchase_claims c
  where c.billing_source = p_billing_source and c.ownership_key = p_ownership_key;

  if not found then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtext('billing-purchase-claim:' || p_billing_source || ':' || p_ownership_key)
    );

    select c.owner_user_id into v_owner
    from private.billing_purchase_claims c
    where c.billing_source = p_billing_source and c.ownership_key = p_ownership_key;

    v_claim_apparso := found;

    -- Il fatto si scrive in ogni caso, e questo e' cio' che rende lecita una
    -- risposta terminale: non stiamo affermando che nessun claim esista, ma
    -- che qualunque claim arrivi si trovera' addosso questa revoca.
    insert into private.billing_pending_revocations (
      billing_source, ownership_key, external_product_id, purchase_kind,
      store_event_at, store_event_source, revocation_at
    ) values (
      p_billing_source, p_ownership_key, p_external_product_id, p_purchase_kind,
      p_store_event_at, p_store_event_source, p_revocation_at
    )
    on conflict (billing_source, ownership_key) do update set
      external_product_id = excluded.external_product_id,
      purchase_kind       = excluded.purchase_kind,
      store_event_at      = excluded.store_event_at,
      store_event_source  = excluded.store_event_source,
      revocation_at       = excluded.revocation_at,
      recorded_at         = pg_catalog.now()
    -- Fra due evidenze in attesa vince la fotografia piu' recente, come
    -- ovunque nel registro.
    where private.billing_pending_revocations.store_event_at < excluded.store_event_at;

    if v_claim_apparso then
      -- Il claim ha committato mentre aspettavamo la chiave. La revoca e' al
      -- sicuro, ma NON e' stata applicata: la risposta non e' terminale.
      return pg_catalog.jsonb_build_object(
        'outcome', 'claim_in_flight',
        'applied', false,
        'persisted', false,
        'pendingRegistrata', true
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'outcome', 'unknown_purchase',
      'applied', false,
      'persisted', false,
      -- Dichiarato, perche' e' la differenza fra una risposta terminale lecita
      -- e una scommessa: il rimborso e' scritto e aspetta il suo acquisto.
      'pendingRegistrata', true
    );
  end if;

  if v_owner is null then
    return pg_catalog.jsonb_build_object('outcome', 'owner_deleted', 'applied', false);
  end if;

  -- ORDINE UNICO DEI LOCK — gradini 0 e 1, prima degli advisory. La lettura
  -- del proprietario qui sopra e' una lettura semplice e non prende lock: puo'
  -- essere stale, ed e' esattamente per questo che sotto c'e' una rilettura
  -- dopo gli advisory. Vedi il blocco in testa a 20260812093000.
  perform 1 from auth.users u where u.id = v_owner for key share;
  perform 1 from public.b2c_subscriptions t
   where t.user_id = v_owner for update;

  perform pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext(v_owner::text));
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('billing-purchase-claim:' || p_billing_source || ':' || p_ownership_key)
  );

  select c.owner_user_id into v_owner_recheck
  from private.billing_purchase_claims c
  where c.billing_source = p_billing_source and c.ownership_key = p_ownership_key;

  if v_owner_recheck is null or v_owner_recheck <> v_owner then
    return pg_catalog.jsonb_build_object('outcome', 'owner_deleted', 'applied', false);
  end if;

  begin
    insert into private.billing_purchase_states (
      billing_source, ownership_key, external_product_id, purchase_kind,
      state, active_until, auto_renewing,
      store_event_at, store_event_source, revocation_at, verified_at
    ) values (
      p_billing_source, p_ownership_key, p_external_product_id, p_purchase_kind,
      'revoked',
      case when p_purchase_kind = 'lifetime'
           then '9999-12-31T23:59:59Z'::timestamptz
           else p_store_event_at end,
      false,
      p_store_event_at, p_store_event_source,
      coalesce(p_revocation_at, p_store_event_at), pg_catalog.now()
    )
    on conflict (billing_source, ownership_key) do update set
      state              = 'revoked',
      auto_renewing      = false,
      store_event_at     = excluded.store_event_at,
      store_event_source = excluded.store_event_source,
      revocation_at      = excluded.revocation_at,
      verified_at        = excluded.verified_at
    -- Ordinata per fotografia, come tutto il resto. Non c'e' piu' nessuna
    -- eccezione "la revoca vince sempre": con `store_event_at` finalmente
    -- valorizzato col signedDate (e non col revocationDate, che e' anteriore
    -- per costruzione) la revoca e' una fotografia recente e vince da sola.
    -- E deve poter perdere: REFUND_REVERSED e' una fotografia ancora piu'
    -- recente che ripristina l'accesso.
    where private._billing_evidenza_supera(
            private.billing_purchase_states.store_event_source,
            private.billing_purchase_states.store_event_at,
            private.billing_purchase_states.state,
            excluded.store_event_source,
            excluded.store_event_at,
            excluded.state);

    v_applied := found;

    -- `applied = false` non basta a dire che la revoca sia registrata: puo'
    -- voler dire "era gia' revocato" (persistito) oppure "non ho scritto"
    -- (non persistito). Chi legge deve poterli distinguere, perche' su questo
    -- codice il client CHIUDE la transazione.
    select s.state = 'revoked' into v_persisted
    from private.billing_purchase_states s
    where s.billing_source = p_billing_source and s.ownership_key = p_ownership_key;

    v_entitlement := private._billing_project_entitlement(v_owner);

  exception
    when others then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_message = message_text;
      return pg_catalog.jsonb_build_object(
        'outcome', 'persistence_failed',
        'applied', false,
        'sqlstate', v_sqlstate,
        'message', v_message
      );
  end;

  -- L'esito distingue "la revoca e' nel registro" da "non sono riuscito a
  -- scriverla". Solo il primo autorizza una risposta terminale al client.
  return pg_catalog.jsonb_build_object(
    'outcome', case when v_persisted then 'revoked' else 'not_persisted' end,
    'applied', v_applied,
    'persisted', coalesce(v_persisted, false),
    'entitlement', v_entitlement
  );
end;
$$;

revoke all on function public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text, timestamptz
) to service_role;

comment on function public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text, timestamptz
) is
  'Registra un rimborso o una revoca su un acquisto gia'' reclamato e ricalcola '
  'l''entitlement del proprietario registrato. `unknown_purchase` viene emesso '
  'solo dopo aver preso l''advisory lock sulla chiave, quindi esclude un claim '
  'in volo; se il claim c''e'' ma non era ancora visibile risponde '
  '`claim_in_flight`, che NON autorizza il client a chiudere la transazione.';

-- ── E il claim raccoglie cio' che la revoca ha lasciato in attesa ───────────
--
-- La funzione e' quella di 20260812093000, presa alla lettera e non riscritta;
-- l'unica aggiunta e' il blocco che consulta private.billing_pending_
-- revocations subito prima del ricalcolo. Sta DENTRO la stessa transazione e
-- dentro lo stesso advisory lock sulla chiave: o il claim vede la revoca in
-- attesa, oppure la revoca vede il claim. Non c'e' un ordine in cui nessuno
-- dei due veda l'altro.
create or replace function public.claim_store_purchase(
  p_billing_source text,
  p_ownership_key text,
  p_owner_user_id uuid,
  p_external_product_id text,
  p_purchase_kind text,
  p_environment text,
  p_state text,
  p_active_until timestamptz,
  p_auto_renewing boolean,
  p_store_event_at timestamptz,
  p_store_event_source text,
  p_external_transaction_id text default null,
  p_app_account_token uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
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
$$;

revoke all on function public.claim_store_purchase(
  text, text, uuid, text, text, text, text, timestamptz, boolean, timestamptz, text, text, uuid
) from public, anon, authenticated;

grant execute on function public.claim_store_purchase(
  text, text, uuid, text, text, text, text, timestamptz, boolean, timestamptz, text, text, uuid
) to service_role;

-- ============================================================================
-- 3. IL GDPR PRENDE I LOCK NELL'ORDINE DI TUTTI GLI ALTRI
--
-- La funzione faceva, per ogni utente da cancellare:
--
--     delete from public.profiles where id = uid;   -- cascata -> b2c
--     delete from auth.users   where id = uid;
--
-- cioe' b2c PRIMA e utente DOPO. Il claim fa il contrario (utente, poi b2c), e
-- questo e' l'ABBA:
--
--     GDPR  : tiene la riga b2c, aspetta la riga auth.users
--     claim : tiene la riga auth.users, aspetta la riga b2c
--
-- Il trigger BEFORE DELETE su auth.users introdotto in 20260812093000 non
-- copre questo caso, e non poteva: parte quando si cancella auth.users, cioe'
-- quando b2c e' gia' stata presa dallo statement precedente. Serviva a chi
-- cancella dall'API di Supabase con un solo `delete from auth.users`, e li'
-- continua a servire.
--
-- La correzione e' prendere i due lock in testa al giro, nell'ordine unico,
-- prima di cancellare qualunque cosa. `for update` su auth.users e non
-- `for key share`: questa funzione la riga la cancella davvero, e chiedere
-- meno di quello che serve significherebbe solo spostare il conflitto piu'
-- avanti.
--
-- Una nota che vale la pena scrivere: il `exception when others` di questo
-- ciclo intercetta ANCHE un deadlock. Quando il GDPR e' la vittima, la
-- cancellazione non avviene e l'unica traccia e' un `raise warning`; la
-- richiesta resta senza `data_deletion_completed_at` e il tick successivo di
-- cron riprova, quindi la promessa "entro 24h" regge — ma regge per il
-- ritentativo, non perche' non fosse fallita.
-- ============================================================================
create or replace function public.gdpr_process_deletions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  n integer := 0;
begin
  for uid in
    select pc.user_id
    from public.privacy_consents pc
    where pc.data_deletion_requested_at is not null
      and pc.data_deletion_completed_at is null
      and pc.data_deletion_requested_at < now() - interval '24 hours'
  loop
    begin
      -- ORDINE UNICO DEI LOCK, gradini 0 e 1: prima l'utente, poi la riga di
      -- proiezione. Gli stessi due, nella stessa sequenza, di
      -- claim_store_purchase e record_store_purchase_revocation.
      perform 1 from auth.users u where u.id = uid for update;
      perform 1 from public.b2c_subscriptions t where t.user_id = uid for update;

      delete from public.profiles where id = uid;
      delete from auth.users where id = uid;
      n := n + 1;
    exception when others then
      raise warning 'gdpr deletion skipped for %: %', uid, sqlerrm;
    end;
  end loop;
  return n;
end;
$$;

revoke all on function public.gdpr_process_deletions() from public, anon, authenticated;

comment on function public.gdpr_process_deletions() is
  'GDPR art.17: esegue le richieste di cancellazione scadute. Prende i lock '
  'nell''ordine unico (auth.users, poi public.b2c_subscriptions) prima di '
  'cancellare: senza, andava in deadlock con claim_store_purchase, che prende '
  'gli stessi due nell''ordine opposto.';

-- ============================================================================
-- 4. IL CANCELLO SANDBOX E' UN VINCOLO DEL REGISTRO, NON UN CONTROLLO DELLA
--    ROUTE
--
-- Le tre condizioni che la route applicava da sola diventano condizioni della
-- SCRITTURA. Non dentro claim_store_purchase, ma su private.billing_purchase_
-- claims: una difesa dentro la RPC vale per chi passa dalla RPC, e la RPC non
-- e' l'unico modo di scrivere nel registro (c'e' il backfill, c'e' la
-- manutenzione, ci sara' la prossima funzione che qualcuno aggiungera'). Su
-- una tabella, invece, non c'e' percorso che la aggiri.
--
--   a  `environment = 'sandbox'` -> il proprietario dev'essere un revisore
--      autorizzato ADESSO. Non "esiste un revisore": quello, quell'utente.
--   b  ambiente e chiave devono dire la stessa cosa. Una chiave `sandbox:...`
--      dichiarata di produzione, o una chiave nuda dichiarata Sandbox, sono
--      due modi di far finire un acquisto nello spazio sbagliato.
--   c  il legame di account e' obbligatorio: `app_account_token` dev'esserci e
--      coincidere con il proprietario.
--
-- La (c) merita di essere detta senza attenuanti, perche' la documentazione
-- prometteva il contrario: STOREKIT 1 NON PORTA appAccountToken, quindi con
-- questa regola una ricevuta Sandbox StoreKit 1 NON e' reclamabile. E' una
-- scelta, non una dimenticanza: la ricevuta StoreKit 1 non contiene niente che
-- leghi l'acquisto all'account FitMesh, quindi un revisore autorizzato
-- potrebbe presentare la ricevuta Sandbox di chiunque altro. Fra "un revisore
-- su iOS 14 non riesce a comprare" e "esiste un percorso Sandbox senza legame
-- di account", il primo e' un guaio che si vede subito e si risolve con un
-- dispositivo, il secondo e' una porta che nessuno riapre.
-- ============================================================================
create or replace function private._billing_cancello_sandbox()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.environment = 'sandbox' then
    if new.owner_user_id is null
       or not public.is_sandbox_reviewer(new.owner_user_id) then
      raise exception
        'registro acquisti: transazione sandbox per un account che non e'' un revisore autorizzato. Una transazione Sandbox e'' gratuita per chiunque abbia un Apple ID di test: senza questo controllo il Pro a vita si regala a chi lo chiede.'
        using errcode = '42501';
    end if;
    if new.ownership_key not like 'sandbox:%' then
      raise exception
        'registro acquisti: ambiente sandbox ma chiave senza prefisso. Sandbox e produzione numerano gli identificativi in spazi indipendenti e possono coincidere: senza prefisso un acquisto di prova rivendicherebbe la proprieta'' di un acquisto vero.'
        using errcode = '22023';
    end if;
    if new.app_account_token is null
       or new.app_account_token <> new.owner_user_id then
      raise exception
        'registro acquisti: su sandbox il legame di account e'' obbligatorio. Senza, un revisore autorizzato potrebbe presentare la transazione Sandbox di chiunque altro. StoreKit 1 non porta questo dato, quindi su sandbox non e'' un percorso reclamabile.'
        using errcode = '42501';
    end if;
  elsif new.ownership_key like 'sandbox:%' then
    raise exception
      'registro acquisti: chiave nello spazio sandbox dichiarata di produzione.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function private._billing_cancello_sandbox()
  from public, anon, authenticated, service_role;

drop trigger if exists trg_billing_cancello_sandbox on private.billing_purchase_claims;
create trigger trg_billing_cancello_sandbox
  before insert on private.billing_purchase_claims
  for each row execute function private._billing_cancello_sandbox();

comment on function private._billing_cancello_sandbox() is
  'Le tre condizioni del percorso Sandbox (revisore attivo, coerenza fra '
  'ambiente e prefisso della chiave, legame di account) applicate sulla '
  'tabella e non nella route: cosi'' valgono per ogni scrittura, compresa '
  'quella che qualcuno aggiungera'' domani.';
-- ============================================================================
-- 5. IL PERMESSO SCADUTO PORTA VIA ANCHE IL PRO CHE AVEVA CONCESSO
--
-- Prima: la riga dell'allowlist scadeva, `is_sandbox_reviewer` tornava falso,
-- e il lifetime Sandbox gia' proiettato restava dov'era. Il permesso finiva e
-- il diritto no — che e' il modo in cui un accesso temporaneo diventa
-- permanente senza che nessuno l'abbia deciso.
--
-- Adesso il ricalcolo ignora i claim nello spazio Sandbox quando il permesso
-- non e' piu' attivo, e se non resta nient'altro TOGLIE la riga che quel claim
-- aveva prodotto. La cancellazione e' mirata: si riconosce dalla chiave
-- (`external_subscription_id like 'sandbox:%'`) e non tocca ne' il Founder ne'
-- niente che non venga da qui.
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

revoke all on function private._billing_project_entitlement(uuid)
  from public, anon, authenticated, service_role;

-- ── Il teardown, che non aspetta la scadenza ────────────────────────────────
--
-- La scadenza da sola non basta a togliere il Pro: toglie il permesso, ma il
-- ricalcolo che se ne accorge avviene solo quando qualcosa lo provoca. Questa
-- funzione fa le due cose insieme ed e' quella che il runbook prescrive dopo
-- l'approvazione di Apple.
create or replace function private.billing_teardown_sandbox_reviewer(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_tolti int;
begin
  delete from private.billing_sandbox_reviewers where user_id = p_user_id;
  get diagnostics v_tolti = row_count;

  return pg_catalog.jsonb_build_object(
    'permessoRimosso', v_tolti > 0,
    'entitlement', private._billing_project_entitlement(p_user_id)
  );
end;
$$;

revoke all on function private.billing_teardown_sandbox_reviewer(uuid)
  from public, anon, authenticated, service_role;

comment on function private.billing_teardown_sandbox_reviewer(uuid) is
  'Toglie il permesso Sandbox E ricalcola subito la proiezione, cosi'' il Pro '
  'concesso da una transazione gratuita sparisce nello stesso istante del '
  'permesso invece di aspettare il prossimo ricalcolo.';

-- ============================================================================
-- 6. LE REVOCHE IN ATTESA CHE HANNO TROVATO IL LORO ACQUISTO PIU' TARDI
--
-- Il claim raccoglie le revoche in attesa, quindi nell'ordine normale non
-- resta niente da fare. Ne resta in UNO: la revoca che ha trovato il claim
-- gia' committato mentre aspettava l'advisory lock. Li' la revoca non la si
-- puo' applicare senza invertire l'ordine dei lock, quindi si scrive in attesa
-- e si risponde `claim_in_flight`, che non e' terminale: il client ripresenta
-- e il percorso normale la applica.
--
-- Se pero' quel client non torna — l'app disinstallata, il telefono perso —
-- resta un cliente con il Pro di un acquisto rimborsato e un fatto scritto che
-- nessuno rilegge. Questa funzione e' quel "qualcuno".
--
-- Non reimplementa niente: per ogni revoca in attesa che ORA ha un claim,
-- chiama la RPC vera, che prende i lock nell'ordine unico partendo da pulito.
-- Il `pg_try_advisory_xact_lock` singleton evita che due giri si sovrappongano
-- se uno diventa lento; l'ordinamento fisso rende deterministico l'ordine con
-- cui i clienti vengono toccati.
-- ============================================================================
create or replace function private.billing_apply_pending_revocations(p_max int default 100)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  r record;
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
      perform public.record_store_purchase_revocation(
        r.billing_source, r.ownership_key, r.external_product_id,
        r.purchase_kind, r.store_event_at, r.store_event_source,
        r.revocation_at
      );
      delete from private.billing_pending_revocations p
       where p.billing_source = r.billing_source
         and p.ownership_key  = r.ownership_key;
      n := n + 1;
    exception when others then
      -- Una riga che non si riesce ad applicare non deve fermare le altre, e
      -- non si cancella: resta in attesa e la si riprova al giro dopo.
      raise warning 'revoca in attesa non applicata (% %): %',
        r.billing_source, left(r.ownership_key, 8), sqlerrm;
    end;
  end loop;

  return n;
end;
$$;

revoke all on function private.billing_apply_pending_revocations(int)
  from public, anon, authenticated, service_role;

comment on function private.billing_apply_pending_revocations(int) is
  'Applica le revoche rimaste in attesa il cui acquisto e'' comparso dopo. '
  'E'' una rete, non il percorso principale: quello e'' il claim, che le '
  'raccoglie dentro la propria transazione.';

do $$
begin
  if exists (select 1 from cron.job where jobname = 'billing-apply-pending-revocations') then
    perform cron.unschedule('billing-apply-pending-revocations');
  end if;
end $$;

select cron.schedule(
  'billing-apply-pending-revocations',
  '*/10 * * * *',
  $$ select private.billing_apply_pending_revocations(); $$
);
