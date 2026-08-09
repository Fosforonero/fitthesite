-- ============================================================================
-- Sprint P0 Apple IAP, FASE 5: la persistenza della proprieta' nel tempo.
--
-- 10-functional-tests.sql prova che una transazione non puo' appartenere a due
-- utenti CONTEMPORANEAMENTE. Questo file prova la cosa diversa e piu'
-- difficile, che e' il difetto HIGH vero: che una transazione resta di chi
-- l'ha comprata anche DOPO che l'entitlement corrente di quell'utente e'
-- passato a un altro acquisto, cioe' quando la proiezione non parla piu' di
-- lei.
--
-- Gira contro il database LOCALE gia' migrato. Tutto in transazione chiusa da
-- ROLLBACK: nessuna riga sopravvive.
-- ============================================================================

\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email, created_at) values
  ('00000000-0000-4000-8000-00000000a001', 'persist-a@test.local', now()),
  ('00000000-0000-4000-8000-00000000a002', 'persist-b@test.local', now());

do $$
declare
  a constant uuid := '00000000-0000-4000-8000-00000000a001';
  b constant uuid := '00000000-0000-4000-8000-00000000a002';
  -- T1 e T2: due acquisti distinti dello STESSO utente A, come dopo un
  -- upgrade, un riacquisto o una seconda catena di abbonamento.
  t1 constant text := '4000000000000001';
  t2 constant text := '4000000000000002';
  lifetime constant timestamptz := '9999-12-31T23:59:59Z';
  v jsonb;
  v_rows int;
  v_txt text;
  v_ts timestamptz;
  v_ts2 timestamptz;
  v_passed int := 0;
begin
  -- ── CASO 4. A acquista T1, poi acquista una SECONDA transazione T2 ──────
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => t1, p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime', p_environment => 'production',
    p_active_until => lifetime, p_state => 'active', p_auto_renewing => false,
    p_external_transaction_id => t1, p_app_account_token => a,
    p_external_subscription_id => t1);
  if v->>'outcome' <> 'claimed' then
    raise exception 'CASO 4: primo acquisto non riuscito, %', v;
  end if;

  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => t2, p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime', p_environment => 'production',
    p_active_until => lifetime, p_state => 'active', p_auto_renewing => false,
    p_external_transaction_id => t2, p_app_account_token => a,
    p_external_subscription_id => t2);
  if v->>'outcome' <> 'claimed' then
    raise exception 'CASO 4: la seconda transazione dello stesso utente doveva essere un claim nuovo, ottenuto %', v;
  end if;

  -- Il registro deve contenere ENTRAMBE le proprieta', non l'ultima.
  select count(*) into v_rows from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key in (t1, t2) and owner_user_id = a;
  if v_rows <> 2 then
    raise exception 'CASO 4: il registro deve conservare entrambi gli acquisti di A, trovate % righe', v_rows;
  end if;
  v_passed := v_passed + 1;

  -- ── CASO 5. IL CUORE DEL FIX ───────────────────────────────────────────
  -- Prima meta': dimostrare che la PRECONDIZIONE del difetto e' ancora
  -- presente, cioe' che la proiezione da sola non protegge piu' T1.
  -- L'upsert onConflict user_id ha SOSTITUITO la riga di A: adesso la
  -- proiezione dice t2, e di t1 non c'e' piu' traccia. Il vincolo
  -- unique (billing_source, external_subscription_id) su cui poggiava la
  -- vecchia difesa non ha piu' niente da difendere.
  --
  -- Questa assert non e' decorativa: se un giorno la proiezione smettesse di
  -- essere sostituibile, questo caso fallirebbe e ci direbbe che il test non
  -- sta piu' misurando il difetto che credeva di misurare.
  select count(*) into v_rows from public.b2c_subscriptions
   where billing_source = 'apple_iap' and external_subscription_id = t1;
  if v_rows <> 0 then
    raise exception
      'CASO 5: precondizione non riprodotta. T1 e'' ancora nella proiezione (% righe): il test non sta piu'' esercitando il difetto HIGH.', v_rows;
  end if;
  select external_subscription_id into v_txt from public.b2c_subscriptions where user_id = a;
  if v_txt is distinct from t2 then
    raise exception 'CASO 5: la proiezione di A doveva essere stata sostituita da T2, trovato %', v_txt;
  end if;

  -- Seconda meta': B prova a reclamare T1, che nessuna riga di proiezione
  -- protegge piu'. Prima di questo registro sarebbe passato: era il difetto.
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => t1, p_owner_user_id => b,
    p_external_product_id => 'fitmesh_pro_lifetime', p_environment => 'production',
    p_active_until => lifetime, p_state => 'active', p_auto_renewing => false,
    p_external_subscription_id => t1);
  if v->>'outcome' <> 'owned_by_other_user' then
    raise exception
      'CASO 5 FALLITO, DIFETTO HIGH APERTO: B ha reclamato la vecchia transazione di A. Esito %', v;
  end if;
  if (v->>'ownerDeleted')::boolean then
    raise exception 'CASO 5: ownerDeleted deve essere false, A esiste ancora';
  end if;

  -- E non deve aver lasciato niente dietro di se'.
  select owner_user_id::text into v_txt from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = t1;
  if v_txt <> a::text then
    raise exception 'CASO 5: il proprietario di T1 e'' cambiato in %', v_txt;
  end if;
  select count(*) into v_rows from public.b2c_subscriptions where user_id = b;
  if v_rows <> 0 then
    raise exception 'CASO 5: B ha ottenuto un entitlement da un acquisto non suo';
  end if;
  v_passed := v_passed + 1;

  -- ── CASO 14. Restore Apple RIPETUTO ────────────────────────────────────
  -- Un restore reale consegna la stessa proprieta' (originalTransactionId
  -- stabile) con un transactionId nuovo ogni volta. Tre giri di fila: la
  -- proprieta' non si sposta, la data di nascita non si sposta, l'id della
  -- transazione che ha stabilito la proprieta' non si sposta, e l'esito resta
  -- un successo idempotente invece di diventare un conflitto.
  select claimed_at, external_transaction_id into v_ts, v_txt
    from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = t1;

  for i in 1..3 loop
    v := public.claim_store_purchase(
      p_billing_source => 'apple_iap', p_ownership_key => t1, p_owner_user_id => a,
      p_external_product_id => 'fitmesh_pro_lifetime', p_environment => 'production',
      p_active_until => lifetime, p_state => 'active', p_auto_renewing => false,
      p_external_transaction_id => '49000000000000' || i::text,
      p_app_account_token => a,
      p_external_subscription_id => t1);
    if v->>'outcome' <> 'already_owned_by_same_user' then
      raise exception 'CASO 14: restore numero % doveva essere idempotente, ottenuto %', i, v;
    end if;
  end loop;

  select claimed_at, external_transaction_id into v_ts2, v_txt
    from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = t1;
  if v_ts2 <> v_ts then
    raise exception 'CASO 14: claimed_at spostato da un restore (% -> %)', v_ts, v_ts2;
  end if;
  if v_txt <> t1 then
    raise exception 'CASO 14: external_transaction_id sovrascritto da un restore (%)', v_txt;
  end if;
  select count(*) into v_rows from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = t1;
  if v_rows <> 1 then
    raise exception 'CASO 14: i restore hanno creato % righe invece di una sola', v_rows;
  end if;
  v_passed := v_passed + 1;

  -- ── CASO 15a. Evento DUPLICATO ─────────────────────────────────────────
  -- Stessa identica notifica consegnata due volte (ritentativo dello store,
  -- doppio tap, retry del client). Deve essere un no-op sul registro.
  select count(*) into v_rows from private.billing_purchase_claims;
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => t2, p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime', p_environment => 'production',
    p_active_until => lifetime, p_state => 'active', p_auto_renewing => false,
    p_external_transaction_id => t2, p_app_account_token => a,
    p_external_subscription_id => t2);
  if v->>'outcome' <> 'already_owned_by_same_user' then
    raise exception 'CASO 15a: l''evento duplicato doveva essere idempotente, ottenuto %', v;
  end if;
  select count(*) - v_rows into v_rows from private.billing_purchase_claims;
  if v_rows <> 0 then
    raise exception 'CASO 15a: l''evento duplicato ha aggiunto % righe al registro', v_rows;
  end if;
  v_passed := v_passed + 1;

  -- ── CASO 15b. Evento FUORI ORDINE ──────────────────────────────────────
  -- Una notifica piu' VECCHIA che arriva dopo una piu' recente.
  --
  -- Comportamento verificato, non desiderato: la PROPRIETA' regge (il registro
  -- non si muove di un byte, ed e' cio' che questo lavoro doveva garantire),
  -- ma la PROIEZIONE regredisce, perche' la RPC riscrive active_until e state
  -- con quello che le viene passato, senza confronto con il valore presente.
  --
  -- Il test fissa il comportamento REALE invece di quello che vorremmo, perche'
  -- la monotonia qui non e' ovviamente giusta: un rimborso, una revoca o un
  -- chargeback DEVONO poter riportare indietro l'entitlement. "Non tornare mai
  -- indietro" romperebbe proprio quei casi. La scelta fra ordinare gli eventi
  -- nel backend (per esempio con signedDate/notification ordering) e mettere
  -- una guardia nella RPC e' una decisione di prodotto aperta: vedi il report
  -- della FASE 5. Se un giorno verra' presa, questo caso fallira' e andra'
  -- aggiornato di proposito, che e' esattamente cio' che deve fare.
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => t2, p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime', p_environment => 'production',
    p_active_until => '2026-01-01T00:00:00Z', p_state => 'expired', p_auto_renewing => false,
    p_external_transaction_id => t2, p_app_account_token => a,
    p_external_subscription_id => t2);
  if v->>'outcome' <> 'already_owned_by_same_user' then
    raise exception 'CASO 15b: atteso already_owned_by_same_user, ottenuto %', v;
  end if;

  -- La proprieta' NON si e' mossa: e' il punto che questo sprint deve tenere.
  select owner_user_id::text, claimed_at into v_txt, v_ts2
    from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = t2;
  if v_txt <> a::text then
    raise exception 'CASO 15b: un evento fuori ordine ha cambiato il proprietario (%)', v_txt;
  end if;

  -- La proiezione INVECE e' regredita. Documentato, non nascosto.
  select state into v_txt from public.b2c_subscriptions where user_id = a;
  if v_txt <> 'expired' then
    raise exception
      'CASO 15b: atteso il comportamento reale (proiezione regredita a expired), trovato %. Se e'' stata introdotta una guardia di monotonia, aggiornare questo caso e il report FASE 5.', v_txt;
  end if;
  v_passed := v_passed + 1;

  raise notice 'persistenza della proprieta'': % casi superati (4, 5, 14, 15a, 15b)', v_passed;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'billing_claims_p0 / persistenza: TUTTE LE VERIFICHE OK'
\echo '=================================================='
