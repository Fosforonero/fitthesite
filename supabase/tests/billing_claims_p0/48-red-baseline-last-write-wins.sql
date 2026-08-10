-- ============================================================================
-- BASELINE ROSSA — il comportamento PRIMA di B', misurato eseguendolo.
--
-- Non e' una simulazione e non e' una riscrittura "equivalente" del vecchio
-- codice: il blocco qui sotto e' la funzione public.claim_store_purchase
-- ESTRATTA VERBATIM dal commit 262ade1 (git show
-- 262ade1:supabase/migrations/20260808211929_billing_purchase_claims_registry.sql,
-- righe 452-700). Viene creata dentro una transazione, esercitata, e la
-- transazione viene annullata: al termine nel database resta soltanto la
-- versione nuova.
--
-- Le due funzioni convivono per la durata del test perche' hanno firme
-- diverse: la vecchia prende (…, p_active_until, p_state, …) e non conosce
-- ne' il tipo d'acquisto ne' la freschezza dell'evidenza. Le chiamate qui
-- sotto usano i nomi dei parametri vecchi, quindi risolvono senza ambiguita'.
--
-- A che serve: a impedire che la matrice verde di 50-entitlement-precedence
-- venga creduta senza prova. Un test che non e' mai stato rosso non dimostra
-- niente sul difetto che dice di coprire.
-- ============================================================================
\set ON_ERROR_STOP on
begin;

-- ── inizio estratto verbatim da 262ade1 ─────────────────────────────────────
create or replace function public.claim_store_purchase(
  p_billing_source text,
  p_ownership_key text,
  p_owner_user_id uuid,
  p_external_product_id text,
  p_environment text,
  p_active_until timestamptz,
  p_state text,
  p_auto_renewing boolean,
  p_external_transaction_id text default null,
  p_app_account_token uuid default null,
  -- Valore da scrivere in public.b2c_subscriptions.external_subscription_id.
  -- Tenuto SEPARATO da p_ownership_key di proposito: la proiezione conserva
  -- oggi il purchase token Play in chiaro, e cambiarne il significato
  -- riscriverebbe la semantica di righe gia' esistenti. Questo file non
  -- tocca dati esistenti.
  p_external_subscription_id text default null,
  p_external_order_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_existing_owner uuid;
  v_existing_anonymized_at timestamptz;
  v_existing_claimed_at timestamptz;
  v_found boolean;
  v_outcome text;
  v_claimed_at timestamptz;
  v_projection_key text;
  v_raw_payload jsonb;
  v_sqlstate text;
  v_message text;
  v_reason text;
begin
  -- ── Contratto d'ingresso ────────────────────────────────────────────────
  -- Violarlo e' un errore di programmazione del chiamante, non un esito
  -- operativo: si solleva, non si restituisce un outcome.
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
  if p_external_product_id is null or length(p_external_product_id) = 0 then
    raise exception 'claim_store_purchase: p_external_product_id obbligatorio' using errcode = '22004';
  end if;

  -- Nessun valore a forma di segreto puo' entrare nella proiezione.
  --
  -- public.b2c_subscriptions e' LEGGIBILE dall'utente (policy "self reads own
  -- b2c sub"), e tre di questi parametri finiscono dentro raw_payload. Non
  -- basta che oggi il backend passi un identificativo di prodotto: se domani
  -- qualcuno ci passa per sbaglio un JWS, una ricevuta App Store, un purchase
  -- token o uno shared secret, quel segreto diventa leggibile via API.
  --
  -- La forma e' quella dei blob firmati e delle credenziali: due punti con
  -- segmenti lunghi (JWS), base64 lunghi (ricevute, purchase token), stringhe
  -- esadecimali lunghe (shared secret). Un identificativo di prodotto vero
  -- (fitmesh_pro_lifetime) non assomiglia a nessuna di queste.
  -- Allowlist degli SKU ESATTI, non della forma.
  --
  -- Questa guardia ha gia' sbagliato due volte, e ogni volta perche' era piu'
  -- larga del necessario. Prima era una blocklist: respingeva JWS, ricevute e
  -- purchase token, e lasciava passare uno shared secret esadecimale e un
  -- header "Bearer eyJ...", perche' nessuno dei due somiglia a cio' che stava
  -- cercando. Poi era una forma: '^fitmesh[a-z0-9_.]{1,56}$', che respinge i
  -- travestimenti noti ma accetta comunque qualunque stringa nuova purche'
  -- cominci per "fitmesh".
  --
  -- Gli SKU che vendiamo sono due, e sono noti. Elencarli e' l'unica versione
  -- di questo controllo che non ha bisogno di indovinare niente: cio' che non
  -- e' uno dei due non entra, punto. Aggiungerne uno richiede una migration, ed
  -- e' voluto: un prodotto nuovo e' una decisione, non un dato che arriva.
  if p_external_product_id not in ('fitmesh_pro_lifetime', 'fitmesh_pro_sub') then
    raise exception 'claim_store_purchase: p_external_product_id "%" non e uno degli SKU supportati (fitmesh_pro_lifetime, fitmesh_pro_sub).', left(p_external_product_id, 40)
      using errcode = '22023';
  end if;
  if p_environment is null or p_environment not in ('production', 'sandbox') then
    raise exception 'claim_store_purchase: p_environment deve essere production o sandbox (ricevuto %)', p_environment
      using errcode = '22023';
  end if;
  if p_active_until is null then
    raise exception 'claim_store_purchase: p_active_until obbligatorio (colonna NOT NULL nella proiezione)' using errcode = '22004';
  end if;
  if p_state is null or p_state not in ('active', 'grace', 'on_hold', 'paused', 'expired', 'cancelled') then
    raise exception 'claim_store_purchase: p_state fuori dal CHECK di public.b2c_subscriptions (ricevuto %)', p_state
      using errcode = '22023';
  end if;
  if p_app_account_token is not null and p_app_account_token <> p_owner_user_id then
    -- Il backend deve gia' aver risposto 409 in questo caso. Se arriva fin
    -- qui, il controllo a monte e' saltato: meglio fermarsi che registrare
    -- una proprieta' che contraddice la prova di appartenenza.
    raise exception 'claim_store_purchase: app_account_token non coincide con il proprietario. Il binding di account va risolto nel backend PRIMA del claim.'
      using errcode = '22023';
  end if;

  if p_environment is null or p_environment not in ('production', 'sandbox') then
    raise exception 'claim_store_purchase: p_environment deve essere production o sandbox (ricevuto %)', p_environment
      using errcode = '22023';
  end if;

  v_projection_key := coalesce(p_external_subscription_id, p_ownership_key);

  -- Il contenuto di raw_payload lo COSTRUISCE questa funzione, non lo riceve.
  --
  -- Prima era un parametro jsonb con scritto in un commento che il backend lo
  -- passava gia' sanificato. Un commento non e' una garanzia: bastava un
  -- chiamante distratto, o un domani in cui quel percorso cambia, e dentro
  -- public.b2c_subscriptions.raw_payload (tabella che l'utente LEGGE, policy
  -- "self reads own b2c sub") sarebbe finito un JWS, una ricevuta App Store o
  -- un purchase token Play.
  --
  -- Costruendolo qui dentro, da parametri gia' tipizzati e gia' scritti in
  -- colonne proprie, non esiste piu' nessun canale attraverso cui un segreto
  -- possa arrivarci: non c'e' un parametro capace di trasportarlo.
  --
  -- Deliberatamente ASSENTI: ownership_key, external_subscription_id,
  -- external_order_id e qualunque identificatore di transazione. Vivono gia'
  -- nelle loro colonne, e duplicarli qui allargherebbe la superficie senza
  -- aggiungere niente.
  -- Campi espliciti, scelti uno per uno, e nessun input JSON libero. Ogni
  -- valore qui dentro proviene da un parametro tipizzato che questa funzione
  -- ha gia' validato: lo SKU e' uno dei due dell'allowlist, l'ambiente e' uno
  -- dei due ammessi, la fonte e' uno dei due store.
  --
  -- Tutto il resto (scadenza, stato, rinnovo automatico, identificativi) vive
  -- gia' in colonne proprie di public.b2c_subscriptions: ripeterlo qui non
  -- aggiungerebbe niente e allargherebbe la superficie di una tabella che
  -- l'utente legge.
  v_raw_payload := pg_catalog.jsonb_build_object(
    'source', 'claim_store_purchase',
    'contract_version', 1,
    'ownership_key_derivation_version', 1,
    'billing_source', p_billing_source,
    'product_id', p_external_product_id,
    'environment', p_environment
  );

  -- Serializza i claim concorrenti sulla STESSA chiave. Il vincolo di
  -- unicita' resta l'ultima parola (e infatti e' gestito nell'handler sotto):
  -- il lock evita che due richieste simultanee dello stesso acquisto
  -- arrivino entrambe a leggere "non esiste" e producano una fra loro un
  -- errore invece di un esito pulito.
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
      -- Altro utente, oppure tombstone di account cancellato. In entrambi i
      -- casi non e' di chi sta chiedendo, e non si scrive niente.
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

  -- ── Claim + proiezione, tutto dentro o tutto fuori ──────────────────────
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

    insert into public.b2c_subscriptions (
      user_id, billing_source, external_product_id, external_subscription_id,
      external_order_id, active_until, auto_renewing, state,
      raw_payload, last_notification_at
    ) values (
      p_owner_user_id, p_billing_source, p_external_product_id, v_projection_key,
      p_external_order_id, p_active_until, coalesce(p_auto_renewing, false), p_state,
      v_raw_payload, pg_catalog.now()
    )
    on conflict (user_id) do update set
      billing_source = excluded.billing_source,
      external_product_id = excluded.external_product_id,
      external_subscription_id = excluded.external_subscription_id,
      external_order_id = excluded.external_order_id,
      active_until = excluded.active_until,
      auto_renewing = excluded.auto_renewing,
      state = excluded.state,
      raw_payload = excluded.raw_payload,
      last_notification_at = excluded.last_notification_at;

  exception
    when unique_violation then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_message = message_text;
      -- Due sorgenti possibili, entrambe rollbackate insieme al claim:
      --  1. corsa persa sul registro nonostante l'advisory lock;
      --  2. `unique (billing_source, external_subscription_id)` della
      --     proiezione, cioe' una riga LEGACY scritta prima che il registro
      --     esistesse e appartenente a un altro utente. Il backend puo'
      --     mappare questa reason su 409 invece che su 500.
      v_reason := 'projection_or_registry_unique_violation';
      return pg_catalog.jsonb_build_object(
        'outcome', 'persistence_failed',
        'reason', v_reason,
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
    'ownerDeleted', false
  );
end;
$$;

-- ── fine estratto verbatim ──────────────────────────────────────────────────

-- ============================================================================
-- Gli scenari, contro la funzione appena ricreata.
--
-- Ogni caso asserisce cio' che il comportamento CORRETTO dovrebbe essere. Qui
-- fallisce: e' il punto. Il conteggio finale pretende che siano rossi TUTTI,
-- perche' un RED che smette di essere rosso senza che nessuno abbia corretto
-- niente e' un test che ha smesso di misurare.
-- ============================================================================

create or replace function pg_temp.mk_user(p_label text) returns uuid
language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', p_label || '-' || v::text || '@example.invalid', 'x',
          now(), now(), now());
  return v;
end $$;


-- Chiave Google: 64 esadecimali, DERIVATA da un'etichetta unica. Prima erano
-- repeat('8',64) e simili, e due scenari diversi hanno usato la stessa: il
-- secondo claim rispondeva owned_by_other_user e non scriveva niente, quindi
-- il caso risultava verde senza aver esercitato nulla.
create or replace function pg_temp.k(p_label text) returns text
language sql immutable as $$
  select encode(sha256(convert_to(p_label, 'UTF8')), 'hex');
$$;

-- Un claim con la firma VECCHIA.
create or replace function pg_temp.old_claim(
  p_user uuid, p_src text, p_key text, p_sku text,
  p_until timestamptz, p_state text, p_auto boolean default false)
returns void language plpgsql as $$
begin
  perform public.claim_store_purchase(
    p_billing_source => p_src,
    p_ownership_key  => p_key,
    p_owner_user_id  => p_user,
    p_external_product_id => p_sku,
    p_environment    => 'production',
    p_active_until   => p_until,
    p_state          => p_state,
    p_auto_renewing  => p_auto,
    p_external_subscription_id => p_key);
end $$;

-- Che cosa risulta proiettato, in forma leggibile.
create or replace function pg_temp.proj(p_user uuid) returns text
language sql as $$
  select coalesce(
    (select t.external_product_id || '/' || t.state ||
            case when public.is_b2c_lifetime(t) then '/lifetime' else '/timed' end
     from public.b2c_subscriptions t where t.user_id = p_user),
    '<nessuna riga>');
$$;

do $$
declare
  v_rossi int := 0;
  v_verdi int := 0;
  v_a uuid; v_b uuid;
  v_p1 text; v_p2 text;
  v_life constant timestamptz := '9999-12-31T23:59:59Z';

begin
  ---------------------------------------------------------------------------
  -- 1. lifetime -> subscription, e l'ordine inverso.
  --    Atteso corretto: lo stesso risultato nei due ordini, e in entrambi
  --    vince il lifetime.
  ---------------------------------------------------------------------------
  v_a := pg_temp.mk_user('r1a');
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-02'), 'fitmesh_pro_lifetime', v_life, 'active');
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-03'), 'fitmesh_pro_sub', now() + interval '30 days', 'active', true);
  v_p1 := pg_temp.proj(v_a);

  v_b := pg_temp.mk_user('r1b');
  perform pg_temp.old_claim(v_b, 'google_play', pg_temp.k('red-04'), 'fitmesh_pro_sub', now() + interval '30 days', 'active', true);
  perform pg_temp.old_claim(v_b, 'google_play', pg_temp.k('red-05'), 'fitmesh_pro_lifetime', v_life, 'active');
  v_p2 := pg_temp.proj(v_b);

  if v_p1 = v_p2 and v_p1 like '%lifetime' then
    v_verdi := v_verdi + 1;
    raise notice '  1. lifetime<->subscription           VERDE  (%)', v_p1;
  else
    v_rossi := v_rossi + 1;
    raise notice '  1. lifetime<->subscription           ROSSO  ordine A=%  ordine B=%', v_p1, v_p2;
  end if;

  ---------------------------------------------------------------------------
  -- 2. Due subscription, entrambe le permutazioni.
  --    Atteso corretto: vince sempre la scadenza maggiore, in tutti e due
  --    gli ordini.
  ---------------------------------------------------------------------------
  v_a := pg_temp.mk_user('r2a');
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-06'), 'fitmesh_pro_sub', now() + interval '200 days', 'active', true);
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-07'), 'fitmesh_pro_sub', now() + interval '10 days', 'active', true);
  select t.active_until::date::text into v_p1 from public.b2c_subscriptions t where t.user_id = v_a;

  v_b := pg_temp.mk_user('r2b');
  perform pg_temp.old_claim(v_b, 'google_play', pg_temp.k('red-08'), 'fitmesh_pro_sub', now() + interval '10 days', 'active', true);
  perform pg_temp.old_claim(v_b, 'google_play', pg_temp.k('red-09'), 'fitmesh_pro_sub', now() + interval '200 days', 'active', true);
  select t.active_until::date::text into v_p2 from public.b2c_subscriptions t where t.user_id = v_b;

  if v_p1 = v_p2 then
    v_verdi := v_verdi + 1;
    raise notice '  2. due subscription, permutazioni    VERDE  (%)', v_p1;
  else
    v_rossi := v_rossi + 1;
    raise notice '  2. due subscription, permutazioni    ROSSO  A scade % / B scade %', v_p1, v_p2;
  end if;

  ---------------------------------------------------------------------------
  -- 3. Rinnovo della STESSA chiave: la scadenza deve avanzare.
  --    Questo il vecchio codice lo fa gia' bene: e' l'unico caso in cui
  --    last-write-wins coincide con la risposta giusta.
  ---------------------------------------------------------------------------
  v_a := pg_temp.mk_user('r3');
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-10'), 'fitmesh_pro_sub', now() + interval '10 days', 'active', true);
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-10'), 'fitmesh_pro_sub', now() + interval '190 days', 'active', true);
  select (t.active_until > now() + interval '180 days')::text into v_p1
  from public.b2c_subscriptions t where t.user_id = v_a;
  if v_p1 = 'true' then
    v_verdi := v_verdi + 1;
    raise notice '  3. rinnovo stessa chiave             VERDE';
  else
    v_rossi := v_rossi + 1;
    raise notice '  3. rinnovo stessa chiave             ROSSO';
  end if;

  ---------------------------------------------------------------------------
  -- 5. Subscription SCADUTA mentre esiste un lifetime valido.
  --    Atteso corretto: resta il lifetime.
  ---------------------------------------------------------------------------
  v_a := pg_temp.mk_user('r5');
  perform pg_temp.old_claim(v_a, 'apple_iap', '2000000000000001', 'fitmesh_pro_lifetime', v_life, 'active');
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-12'), 'fitmesh_pro_sub', now() - interval '30 days', 'expired');
  v_p1 := pg_temp.proj(v_a);
  if v_p1 like '%lifetime' then
    v_verdi := v_verdi + 1;
    raise notice '  5. sub scaduta + lifetime valido     VERDE  (%)', v_p1;
  else
    v_rossi := v_rossi + 1;
    raise notice '  5. sub scaduta + lifetime valido     ROSSO  (%)', v_p1;
  end if;

  ---------------------------------------------------------------------------
  -- 7. Restore in QUALUNQUE ordine -> stessa proiezione.
  --    Tre acquisti, due ordini opposti.
  ---------------------------------------------------------------------------
  v_a := pg_temp.mk_user('r7a');
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-13'), 'fitmesh_pro_sub', now() - interval '90 days', 'expired');
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-14'), 'fitmesh_pro_lifetime', v_life, 'active');
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-15'), 'fitmesh_pro_sub', now() + interval '5 days', 'active', true);
  v_p1 := pg_temp.proj(v_a);

  v_b := pg_temp.mk_user('r7b');
  perform pg_temp.old_claim(v_b, 'google_play', pg_temp.k('red-16'), 'fitmesh_pro_sub', now() + interval '5 days', 'active', true);
  perform pg_temp.old_claim(v_b, 'google_play', pg_temp.k('red-17'), 'fitmesh_pro_lifetime', v_life, 'active');
  perform pg_temp.old_claim(v_b, 'google_play', pg_temp.k('red-18'), 'fitmesh_pro_sub', now() - interval '90 days', 'expired');
  v_p2 := pg_temp.proj(v_b);

  if v_p1 = v_p2 then
    v_verdi := v_verdi + 1;
    raise notice '  7. restore, ordine indifferente      VERDE  (%)', v_p1;
  else
    v_rossi := v_rossi + 1;
    raise notice '  7. restore, ordine indifferente      ROSSO  A=%  B=%', v_p1, v_p2;
  end if;

  ---------------------------------------------------------------------------
  -- 8. Apple lifetime + Google subscription sullo stesso account.
  --    Atteso corretto: vince il lifetime Apple.
  ---------------------------------------------------------------------------
  v_a := pg_temp.mk_user('r8');
  perform pg_temp.old_claim(v_a, 'apple_iap', '2000000000000008', 'fitmesh_pro_lifetime', v_life, 'active');
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-19') , 'fitmesh_pro_sub', now() + interval '20 days', 'active', true);
  v_p1 := pg_temp.proj(v_a);
  if v_p1 like '%lifetime' then
    v_verdi := v_verdi + 1;
    raise notice '  8. Apple lifetime + Google sub       VERDE  (%)', v_p1;
  else
    v_rossi := v_rossi + 1;
    raise notice '  8. Apple lifetime + Google sub       ROSSO  (%)', v_p1;
  end if;

  ---------------------------------------------------------------------------
  -- 9. Founder + acquisto commerciale.
  --    Atteso corretto: la riga founder NON viene toccata.
  ---------------------------------------------------------------------------
  v_a := pg_temp.mk_user('r9');
  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state)
  values (v_a, 'founder_grant', 'founder', 'founder-' || v_a::text,
          '9999-12-31T23:59:59Z', false, 'active');
  perform pg_temp.old_claim(v_a, 'google_play', pg_temp.k('red-20'), 'fitmesh_pro_sub', now() + interval '20 days', 'active', true);
  select t.billing_source into v_p1 from public.b2c_subscriptions t where t.user_id = v_a;
  if v_p1 = 'founder_grant' then
    v_verdi := v_verdi + 1;
    raise notice '  9. founder + acquisto commerciale    VERDE';
  else
    v_rossi := v_rossi + 1;
    raise notice '  9. founder + acquisto commerciale    ROSSO  riga founder sostituita da %', v_p1;
  end if;

  ---------------------------------------------------------------------------
  raise notice '';
  raise notice '  ROSSI: %   VERDI: %', v_rossi, v_verdi;

  if v_rossi = 0 then
    raise exception 'Nessun caso rosso: questa baseline non misura piu'' niente. Se il comportamento vecchio fosse davvero corretto, la migration B'''' non servirebbe.';
  end if;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'billing_claims_p0 / baseline ROSSA: confermata'
\echo '=================================================='
