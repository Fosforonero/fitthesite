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
  v_scoperto text;
begin
  -- ── CASO 4. A acquista T1, poi acquista una SECONDA transazione T2 ──────
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => t1,
    p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => t1,
    p_app_account_token => a
  );
  if v->>'outcome' <> 'claimed' then
    raise exception 'CASO 4: primo acquisto non riuscito, %', v;
  end if;

  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => t2,
    p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => t2,
    p_app_account_token => a
  );
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
  -- presente, cioe' che la proiezione da sola non protegge uno dei due
  -- acquisti di A.
  --
  -- Fino a B' la precondizione era piu' brutale: l'upsert su user_id
  -- SOSTITUIVA la riga, quindi t1 spariva del tutto e restava t2. Da B' la
  -- proiezione conserva il MIGLIORE diritto invece dell'ultimo scritto — ma
  -- resta comunque una riga sola per utente, e quindi uno dei due acquisti non
  -- e' rappresentato. Il vincolo unique (billing_source,
  -- external_subscription_id), su cui poggiava la vecchia difesa, su quello
  -- non ha niente da difendere.
  --
  -- Il test non presume piu' QUALE dei due resti: lo legge, e attacca l'altro.
  -- Presumerlo lo renderebbe fragile rispetto a un criterio di precedenza che
  -- puo' cambiare, e la cosa da provare non e' quale vince: e' che quello che
  -- perde resti comunque di A.
  select external_subscription_id into v_txt from public.b2c_subscriptions where user_id = a;
  if v_txt not in (t1, t2) then
    raise exception 'CASO 5: la proiezione di A non contiene ne'' T1 ne'' T2 (%)', v_txt;
  end if;
  v_scoperto := case when v_txt = t1 then t2 else t1 end;

  select count(*) into v_rows from public.b2c_subscriptions
   where billing_source = 'apple_iap' and external_subscription_id = v_scoperto;
  if v_rows <> 0 then
    raise exception
      'CASO 5: precondizione non riprodotta. Entrambe le transazioni risultano in proiezione (% righe): il test non sta piu'' esercitando il difetto HIGH.', v_rows;
  end if;

  -- Seconda meta': B prova a reclamare la transazione SCOPERTA, quella che
  -- nessuna riga di proiezione protegge. Prima di questo registro sarebbe
  -- passata: era il difetto.
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => v_scoperto,
    p_owner_user_id => b,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date'
  );
  if v->>'outcome' <> 'owned_by_other_user' then
    raise exception
      'CASO 5 FALLITO, DIFETTO HIGH APERTO: B ha reclamato la vecchia transazione di A. Esito %', v;
  end if;
  if (v->>'ownerDeleted')::boolean then
    raise exception 'CASO 5: ownerDeleted deve essere false, A esiste ancora';
  end if;

  -- E non deve aver lasciato niente dietro di se'.
  select owner_user_id::text into v_txt from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = v_scoperto;
  if v_txt <> a::text then
    raise exception 'CASO 5: il proprietario della transazione scoperta e'' cambiato in %', v_txt;
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
    p_billing_source => 'apple_iap',
    p_ownership_key => t1,
    p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => '49000000000000' || i::text,
    p_app_account_token => a
  );
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
    p_billing_source => 'apple_iap',
    p_ownership_key => t2,
    p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'active',
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => t2,
    p_app_account_token => a
  );
  if v->>'outcome' <> 'already_owned_by_same_user' then
    raise exception 'CASO 15a: l''evento duplicato doveva essere idempotente, ottenuto %', v;
  end if;
  select count(*) - v_rows into v_rows from private.billing_purchase_claims;
  if v_rows <> 0 then
    raise exception 'CASO 15a: l''evento duplicato ha aggiunto % righe al registro', v_rows;
  end if;
  v_passed := v_passed + 1;

  -- ── CASO 15b. Evento FUORI ORDINE ──────────────────────────────────────
  -- Una fotografia piu' VECCHIA che arriva dopo una piu' recente.
  --
  -- Fino a B' questo caso fissava il comportamento REALE e sbagliato: la
  -- proprieta' reggeva, ma la proiezione REGREDIVA, perche' la RPC riscriveva
  -- state e active_until con qualunque cosa le venisse passata. Il commento di
  -- allora diceva che se un giorno fosse arrivata una guardia questo caso
  -- sarebbe fallito e andava aggiornato di proposito. E' quel giorno.
  --
  -- La guardia non e' "non tornare mai indietro", che avrebbe rotto rimborsi e
  -- revoche: e' "non applicare un'evidenza piu' vecchia di quella registrata".
  -- Indietro si torna eccome — ma solo con evidenza piu' recente, e per la
  -- revoca c'e' una funzione dedicata (CASO 6 della matrice 50).
  v := public.claim_store_purchase(
    p_billing_source => 'apple_iap',
    p_ownership_key => t2,
    p_owner_user_id => a,
    p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime',
    p_environment => 'production',
    p_state => 'expired',
    -- La sentinella resta: un lifetime senza di essa viene respinto dal CHECK
    -- billing_purchase_states_lifetime_sentinel_check PRIMA che la guardia di
    -- freschezza possa dire la sua (l'INSERT valuta i vincoli sulla tupla
    -- proposta, prima di risolvere il conflitto). Qui vogliamo esercitare la
    -- freschezza, non il vincolo di forma: sono due difese diverse e vanno
    -- misurate separatamente.
    p_active_until => lifetime,
    p_auto_renewing => false,
    p_store_event_at => now() - interval '30 days',
    p_store_event_source => 'apple_signed_date',
    p_external_transaction_id => t2,
    p_app_account_token => a
  );
  if v->>'outcome' <> 'already_owned_by_same_user' then
    raise exception 'CASO 15b: atteso already_owned_by_same_user, ottenuto %', v;
  end if;
  if (v->>'stateApplied')::boolean is not false then
    raise exception 'CASO 15b: un evento di 30 giorni fa e'' stato applicato (stateApplied=%)', v->>'stateApplied';
  end if;

  -- La proprieta' non si e' mossa.
  select owner_user_id::text into v_txt
    from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = t2;
  if v_txt <> a::text then
    raise exception 'CASO 15b: un evento fuori ordine ha cambiato il proprietario (%)', v_txt;
  end if;

  -- E nemmeno lo STATO: 'active' registrato prima resta, 'expired' vecchio no.
  select state into v_txt from private.billing_purchase_states
   where billing_source = 'apple_iap' and ownership_key = t2;
  if v_txt <> 'active' then
    raise exception 'CASO 15b: lo stato e'' regredito a % per un evento piu'' vecchio', v_txt;
  end if;

  -- E la proiezione non e' regredita: A resta con un diritto valido.
  select state into v_txt from public.b2c_subscriptions where user_id = a;
  if v_txt <> 'active' then
    raise exception 'CASO 15b: la proiezione e'' regredita a % per un evento fuori ordine', v_txt;
  end if;
  v_passed := v_passed + 1;

  raise notice 'persistenza della proprieta'': % casi superati (4, 5, 14, 15a, 15b)', v_passed;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'billing_claims_p0 / persistenza: TUTTE LE VERIFICHE OK'
\echo '=================================================='
