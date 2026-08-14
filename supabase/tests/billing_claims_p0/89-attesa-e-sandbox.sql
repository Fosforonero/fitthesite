-- ============================================================================
-- LA REVOCA CHE ASPETTA IL SUO ACQUISTO, E IL CANCELLO SANDBOX SUL REGISTRO
--
-- Due famiglie di casi, tutte e due nate da una review avversariale su 232bd6c.
--
-- P1-P5  Una revoca che arriva quando l'acquisto non e' (ancora) nel registro
--        non si butta via. Il caso famoso e' la corsa con un claim in volo, ma
--        quello raro; il caso comune e' un client che valida in ritardo una
--        transazione gia' rimborsata, e li' non c'e' nessuna concorrenza da
--        incolpare: c'era solo un fatto scartato.
--
-- S9-S13 Il cancello Sandbox vive sulla TABELLA, non nella route. Una difesa
--        che sta in un solo punto del percorso e' una difesa che il prossimo
--        chiamante aggira senza saperlo.
-- ============================================================================

\set ON_ERROR_STOP on
\timing off

-- ── P: la revoca in attesa ──────────────────────────────────────────────────
do $$
declare
  v_utente uuid := '00000000-0000-4000-8000-00000000e001';
  v_chiave text := '7000000000000001';
  v_lifetime timestamptz := '9999-12-31T23:59:59Z';
  v_esito jsonb;
  v_stato text;
  v_proiettato text;
  v_attese int;
begin
  raise notice '########### REVOCA IN ATTESA DEL SUO ACQUISTO ###########';

  -- Pulizia: il registro e' append-only e i suoi trigger valgono anche per il
  -- proprietario, quindi vanno spenti e riaccesi (come fanno 30/40/55).
  alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
  alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
  delete from private.billing_purchase_states where ownership_key = v_chiave;
  delete from private.billing_purchase_claims where ownership_key = v_chiave;
  alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
  alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;
  delete from private.billing_pending_revocations where ownership_key = v_chiave;
  perform pg_catalog.set_config('billing.projection', 'on', true);
  delete from public.b2c_subscriptions where user_id = v_utente;
  perform pg_catalog.set_config('billing.projection', 'off', true);
  delete from auth.users where id = v_utente;
  insert into auth.users (id, email, created_at)
  values (v_utente, 'attesa@test.local', now());

  -- ── P1: una revoca su una chiave mai reclamata NON si perde ──────────────
  v_esito := public.record_store_purchase_revocation(
    'apple_iap', v_chiave, 'fitmesh_pro_lifetime', 'lifetime',
    now(), 'apple_signed_date', now() - interval '2 hours'
  );

  if v_esito->>'outcome' <> 'unknown_purchase' then
    raise exception 'P1 FAIL: atteso unknown_purchase, ricevuto %', v_esito->>'outcome';
  end if;
  if coalesce((v_esito->>'pendingRegistrata')::boolean, false) is not true then
    raise exception 'P1 FAIL: la risposta e'' terminale ma non dichiara di aver registrato niente';
  end if;

  select count(*) into v_attese
  from private.billing_pending_revocations
  where billing_source = 'apple_iap' and ownership_key = v_chiave;
  if v_attese <> 1 then
    raise exception 'P1 FAIL: la revoca doveva restare in attesa, righe trovate %', v_attese;
  end if;
  raise notice 'P1 PASS: la revoca senza acquisto e'' scritta, non buttata';

  -- ── P2: il claim successivo se la trova addosso ──────────────────────────
  --
  -- QUESTO E' IL DIFETTO CHE COSTAVA SOLDI. Prima: la revoca spariva e questo
  -- claim concedeva il Pro a vita su un acquisto rimborsato.
  v_esito := public.claim_store_purchase(
    'apple_iap', v_chiave, v_utente, 'fitmesh_pro_lifetime', 'lifetime',
    'production', 'active', v_lifetime, false,
    -- L'evidenza dell'acquisto e' PIU' VECCHIA della revoca: la revoca vince.
    now() - interval '1 hour', 'apple_signed_date', 'tx-attesa', null
  );

  select state into v_stato from private.billing_purchase_states
  where billing_source = 'apple_iap' and ownership_key = v_chiave;
  if v_stato is distinct from 'revoked' then
    raise exception 'P2 FAIL: dopo il claim lo stato e'' "%", doveva essere revoked', v_stato;
  end if;

  select state into v_proiettato from public.b2c_subscriptions where user_id = v_utente;
  if v_proiettato is distinct from 'expired' then
    raise exception 'P2 FAIL: la proiezione dice "%", un acquisto rimborsato non da'' accesso', v_proiettato;
  end if;
  raise notice 'P2 PASS: il claim ha raccolto la revoca in attesa, niente Pro su un rimborso';

  -- ── P3: consumata ────────────────────────────────────────────────────────
  select count(*) into v_attese
  from private.billing_pending_revocations
  where billing_source = 'apple_iap' and ownership_key = v_chiave;
  if v_attese <> 0 then
    raise exception 'P3 FAIL: la revoca in attesa non e'' stata consumata (righe %)', v_attese;
  end if;
  raise notice 'P3 PASS: applicata e tolta dall''attesa';

  -- ── P4: un riacquisto PIU' RECENTE del rimborso deve tornare a dare Pro ──
  --
  -- La revoca in attesa non e' un muro: e' un'evidenza, e perde contro
  -- un'evidenza piu' recente. Chi si fa rimborsare e ricompra deve riavere il
  -- Pro senza che nessuno intervenga a mano.
  v_esito := public.record_store_purchase_revocation(
    'apple_iap', v_chiave, 'fitmesh_pro_lifetime', 'lifetime',
    now() + interval '1 hour', 'apple_signed_date', now()
  );
  if v_esito->>'outcome' <> 'revoked' then
    raise exception 'P4 setup FAIL: la revoca sull''acquisto reclamato ha dato %', v_esito->>'outcome';
  end if;

  v_esito := public.claim_store_purchase(
    'apple_iap', v_chiave, v_utente, 'fitmesh_pro_lifetime', 'lifetime',
    'production', 'active', v_lifetime, false,
    now() + interval '2 hours', 'apple_signed_date', 'tx-riacquisto', null
  );
  select state into v_proiettato from public.b2c_subscriptions where user_id = v_utente;
  if v_proiettato is distinct from 'active' then
    raise exception 'P4 FAIL: dopo un riacquisto piu'' recente la proiezione dice "%"', v_proiettato;
  end if;
  raise notice 'P4 PASS: un''evidenza piu'' recente batte la revoca, il riacquisto vale';

  -- ── P5: la rete di riserva applica cio' che era rimasto in attesa ────────
  --
  -- Simula l'unico ordine che il claim non copre: la revoca ha trovato il
  -- claim gia' committato mentre aspettava l'advisory lock, quindi l'ha scritta
  -- in attesa senza applicarla, e il client non e' mai tornato.
  insert into private.billing_pending_revocations (
    billing_source, ownership_key, external_product_id, purchase_kind,
    store_event_at, store_event_source, revocation_at
  ) values (
    'apple_iap', v_chiave, 'fitmesh_pro_lifetime', 'lifetime',
    now() + interval '3 hours', 'apple_signed_date', now()
  );

  perform private.billing_apply_pending_revocations();

  select state into v_proiettato from public.b2c_subscriptions where user_id = v_utente;
  if v_proiettato is distinct from 'expired' then
    raise exception 'P5 FAIL: la rete non ha applicato la revoca rimasta in attesa (proiezione "%")', v_proiettato;
  end if;
  select count(*) into v_attese from private.billing_pending_revocations where ownership_key = v_chiave;
  if v_attese <> 0 then
    raise exception 'P5 FAIL: la rete non ha consumato la riga in attesa (righe %)', v_attese;
  end if;
  raise notice 'P5 PASS: la rete di riserva chiude anche il caso in cui il client non torna';

  -- Pulizia
  alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
  alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
  delete from private.billing_purchase_states where ownership_key = v_chiave;
  delete from private.billing_purchase_claims where ownership_key = v_chiave;
  alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
  alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;
  delete from private.billing_pending_revocations where ownership_key = v_chiave;
  perform pg_catalog.set_config('billing.projection', 'on', true);
  delete from public.b2c_subscriptions where user_id = v_utente;
  perform pg_catalog.set_config('billing.projection', 'off', true);
  delete from auth.users where id = v_utente;
end $$;

-- ── S: il cancello Sandbox e' un vincolo della tabella ──────────────────────
do $$
declare
  v_revisore uuid := '00000000-0000-4000-8000-00000000e011';
  v_normale  uuid := '00000000-0000-4000-8000-00000000e012';
  v_lifetime timestamptz := '9999-12-31T23:59:59Z';
  v_esito jsonb;
  v_stato text;
begin
  raise notice '########### CANCELLO SANDBOX SUL REGISTRO ###########';

  alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
  alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
  delete from private.billing_purchase_states where ownership_key like '%800000000000%';
  delete from private.billing_purchase_claims where ownership_key like '%800000000000%';
  alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
  alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;
  delete from private.billing_sandbox_reviewers where user_id in (v_revisore, v_normale);
  delete from auth.users where id in (v_revisore, v_normale);
  insert into auth.users (id, email, created_at) values
    (v_revisore, 'rev-sandbox@test.local', now()),
    (v_normale,  'utente-sandbox@test.local', now());

  -- ── S9: sandbox da un account qualunque -> rifiutato dalla TABELLA ───────
  --
  -- Non dalla route: qui si chiama la RPC direttamente, che e' esattamente cio'
  -- che farebbe un percorso nuovo scritto fra sei mesi da chi non sa che la
  -- route faceva un controllo in piu'.
  begin
    perform public.claim_store_purchase(
      'apple_iap', 'sandbox:8000000000001', v_normale, 'fitmesh_pro_lifetime', 'lifetime',
      'sandbox', 'active', v_lifetime, false,
      now(), 'apple_signed_date', 'tx-s9', v_normale
    );
    raise exception 'S9 FAIL: un account qualunque ha reclamato una transazione Sandbox';
  exception
    when insufficient_privilege then
      raise notice 'S9 PASS: sandbox rifiutata a chi non e'' un revisore autorizzato';
  end;

  -- ── S10: revisore autorizzato ma chiave SENZA prefisso ───────────────────
  insert into private.billing_sandbox_reviewers (user_id, note, expires_at)
  values (v_revisore, 'test cancello sandbox', now() + interval '7 days');

  begin
    perform public.claim_store_purchase(
      'apple_iap', '8000000000002', v_revisore, 'fitmesh_pro_lifetime', 'lifetime',
      'sandbox', 'active', v_lifetime, false,
      now(), 'apple_signed_date', 'tx-s10', v_revisore
    );
    raise exception 'S10 FAIL: accettata una chiave sandbox senza prefisso';
  exception
    when invalid_parameter_value then
      raise notice 'S10 PASS: ambiente sandbox e chiave nuda non stanno insieme';
  end;

  -- ── S11: chiave nello spazio sandbox dichiarata di produzione ────────────
  begin
    perform public.claim_store_purchase(
      'apple_iap', 'sandbox:8000000000003', v_revisore, 'fitmesh_pro_lifetime', 'lifetime',
      'production', 'active', v_lifetime, false,
      now(), 'apple_signed_date', 'tx-s11', v_revisore
    );
    raise exception 'S11 FAIL: accettata una chiave sandbox dichiarata di produzione';
  exception
    when invalid_parameter_value then
      raise notice 'S11 PASS: il prefisso e l''ambiente devono dire la stessa cosa';
  end;

  -- ── S12: sandbox SENZA legame di account (il caso StoreKit 1) ────────────
  --
  -- La documentazione prometteva "le stesse quattro condizioni su StoreKit 1".
  -- Era falso: StoreKit 1 non porta appAccountToken. Qui si sceglie il rifiuto,
  -- e lo si scrive: su sandbox una ricevuta StoreKit 1 NON e' reclamabile.
  begin
    perform public.claim_store_purchase(
      'apple_iap', 'sandbox:8000000000004', v_revisore, 'fitmesh_pro_lifetime', 'lifetime',
      'sandbox', 'active', v_lifetime, false,
      now(), 'apple_signed_date', 'tx-s12', null
    );
    raise exception 'S12 FAIL: accettata una sandbox senza legame di account';
  exception
    when insufficient_privilege then
      raise notice 'S12 PASS: su sandbox il legame di account non e'' facoltativo';
  end;

  -- ── S13: il revisore autorizzato compra davvero ─────────────────────────
  v_esito := public.claim_store_purchase(
    'apple_iap', 'sandbox:8000000000005', v_revisore, 'fitmesh_pro_lifetime', 'lifetime',
    'sandbox', 'active', v_lifetime, false,
    now(), 'apple_signed_date', 'tx-s13', v_revisore
  );
  if v_esito->>'outcome' <> 'claimed' then
    raise exception 'S13 FAIL: il revisore autorizzato non riesce a comprare (%)', v_esito->>'outcome';
  end if;
  select state into v_stato from public.b2c_subscriptions where user_id = v_revisore;
  if v_stato is distinct from 'active' then
    raise exception 'S13 FAIL: il revisore ha comprato ma la proiezione dice "%"', v_stato;
  end if;
  raise notice 'S13 PASS: con tutte e tre le condizioni il revisore compra e vede il Pro';

  -- ── S14: scaduto il permesso, sparisce anche il Pro che aveva concesso ──
  --
  -- Il difetto: la scadenza toglieva il permesso e lasciava il diritto. Un
  -- accesso temporaneo che diventa permanente perche' nessuno ha ricalcolato.
  update private.billing_sandbox_reviewers
     set created_at = now() - interval '30 days',
         expires_at = now() - interval '1 second'
   where user_id = v_revisore;

  perform private._billing_project_entitlement(v_revisore);

  select state into v_stato from public.b2c_subscriptions where user_id = v_revisore;
  if v_stato is distinct from 'expired' then
    raise exception 'S14 FAIL: permesso scaduto ma la proiezione dice ancora "%"', v_stato;
  end if;
  raise notice 'S14 PASS: scaduto il permesso, il Pro Sandbox se ne va con lui';

  -- ── S15: il teardown non aspetta la scadenza ────────────────────────────
  update private.billing_sandbox_reviewers
     set created_at = now(), expires_at = now() + interval '7 days'
   where user_id = v_revisore;
  perform private._billing_project_entitlement(v_revisore);
  select state into v_stato from public.b2c_subscriptions where user_id = v_revisore;
  if v_stato is distinct from 'active' then
    raise exception 'S15 setup FAIL: rinnovato il permesso, la proiezione dice "%"', v_stato;
  end if;

  v_esito := private.billing_teardown_sandbox_reviewer(v_revisore);
  if coalesce((v_esito->>'permessoRimosso')::boolean, false) is not true then
    raise exception 'S15 FAIL: il teardown dice di non aver rimosso niente';
  end if;
  select state into v_stato from public.b2c_subscriptions where user_id = v_revisore;
  if v_stato is distinct from 'expired' then
    raise exception 'S15 FAIL: dopo il teardown la proiezione dice "%"', v_stato;
  end if;
  raise notice 'S15 PASS: il teardown toglie permesso e diritto nello stesso istante';

  -- Pulizia
  alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
  alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
  delete from private.billing_purchase_states where ownership_key like '%800000000000%';
  delete from private.billing_purchase_claims where ownership_key like '%800000000000%';
  alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
  alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;
  delete from private.billing_sandbox_reviewers where user_id in (v_revisore, v_normale);
  perform pg_catalog.set_config('billing.projection', 'on', true);
  delete from public.b2c_subscriptions where user_id in (v_revisore, v_normale);
  perform pg_catalog.set_config('billing.projection', 'off', true);
  delete from auth.users where id in (v_revisore, v_normale);
end $$;

\echo ''
\echo '=================================================='
\echo 'ATTESA E SANDBOX: la revoca aspetta, il cancello e del registro'
\echo '=================================================='
