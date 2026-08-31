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

  -- ── P6: la rete NON cancella cio' che non e' riuscita ad applicare ───────
  --
  -- IL DIFETTO: la rete faceva `perform record_store_purchase_revocation(...)`
  -- e poi cancellava. Ma quella RPC non solleva quando la scrittura fallisce:
  -- cattura e risponde `persistence_failed`. Il valore buttato via significava
  -- che la riga spariva lo stesso — e quella riga era l'ULTIMA copia di quel
  -- rimborso, perche' la transazione del client era gia' stata chiusa.
  --
  -- Il guasto si produce sostituendo il proiettore con uno che solleva: e' il
  -- modo piu' vicino a un guasto vero, e tocca esattamente il punto dove la
  -- RPC cattura.
  create temporary table t_proiettore on commit drop as
  select pg_catalog.pg_get_functiondef(
           'private._billing_project_entitlement(uuid)'::regprocedure) as def;

  execute $mut$
    create or replace function private._billing_project_entitlement(p_user_id uuid)
    returns jsonb language plpgsql security definer set search_path to '' as $f$
    begin
      raise exception 'proiezione guasta (mutazione di prova)' using errcode = 'XX000';
    end; $f$;
  $mut$;

  insert into private.billing_pending_revocations (
    billing_source, ownership_key, external_product_id, purchase_kind,
    store_event_at, store_event_source, revocation_at
  ) values (
    'apple_iap', v_chiave, 'fitmesh_pro_lifetime', 'lifetime',
    now() + interval '10 hours', 'apple_signed_date', now()
  );

  perform private.billing_apply_pending_revocations();

  select count(*) into v_attese
  from private.billing_pending_revocations where ownership_key = v_chiave;
  if v_attese <> 1 then
    raise exception 'P6 FAIL: la rete ha cancellato una revoca che non era riuscita ad applicare (righe rimaste %)', v_attese;
  end if;
  raise notice 'P6 PASS: proiezione guasta, la revoca in attesa e'' ancora li''';

  -- ── P7: al giro dopo, riparato il guasto, viene applicata ────────────────
  execute (select def || ';' from t_proiettore);

  perform private.billing_apply_pending_revocations();

  select count(*) into v_attese
  from private.billing_pending_revocations where ownership_key = v_chiave;
  if v_attese <> 0 then
    raise exception 'P7 FAIL: riparato il guasto, la revoca e'' rimasta in attesa (righe %)', v_attese;
  end if;
  select state into v_proiettato from public.b2c_subscriptions where user_id = v_utente;
  if v_proiettato is distinct from 'expired' then
    raise exception 'P7 FAIL: la revoca recuperata non ha tolto il diritto (proiezione "%")', v_proiettato;
  end if;
  raise notice 'P7 PASS: il secondo giro applica cio'' che il primo aveva conservato';

  -- ── P8: una revoca SUPERATA non resta in attesa per sempre ───────────────
  --
  -- Chi si fa rimborsare e poi ricompra: la revoca ha perso il confronto, e ha
  -- perso legittimamente. Senza questo ramo la riga verrebbe riprovata ogni
  -- dieci minuti a vuoto, per sempre.
  insert into private.billing_pending_revocations (
    billing_source, ownership_key, external_product_id, purchase_kind,
    store_event_at, store_event_source, revocation_at
  ) values (
    'apple_iap', v_chiave, 'fitmesh_pro_lifetime', 'lifetime',
    now() - interval '10 days', 'apple_signed_date', now() - interval '10 days'
  );

  perform private.billing_apply_pending_revocations();

  select count(*) into v_attese
  from private.billing_pending_revocations where ownership_key = v_chiave;
  if v_attese <> 0 then
    raise exception 'P8 FAIL: una revoca superata da evidenza piu'' recente resta in attesa (righe %)', v_attese;
  end if;
  raise notice 'P8 PASS: superata da evidenza piu'' recente, smette di essere in attesa';

  -- ── P9: un SEGNAPOSTO non consuma una revoca in attesa ───────────────────
  --
  -- IL DIFETTO (2a review): la postcondizione chiedeva `s.store_event_at >
  -- r.store_event_at`, cioe' un confronto fra numeri, mentre in questo sistema
  -- il confronto fra evidenze e' `_billing_evidenza_supera`. Un segnaposto
  -- (`projection_backfill`) porta il timestamp del momento in cui l'abbiamo
  -- dedotto, quindi e' quasi sempre PIU' RECENTE di una revoca vera: con il
  -- confronto numerico bastava una riga scritta dal percorso vecchio per far
  -- sparire l'ultima copia di un rimborso.
  --
  -- P6 non lo vedeva perche' li' lo stato registrato e' piu' VECCHIO della
  -- revoca in attesa: il ramo sbagliato non veniva nemmeno raggiunto.
  alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
  update private.billing_purchase_states
     set state = 'active',
         store_event_source = 'projection_backfill',
         store_event_at = now() + interval '20 hours',
         revocation_at = null
   where billing_source = 'apple_iap' and ownership_key = v_chiave;
  alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;

  insert into private.billing_pending_revocations (
    billing_source, ownership_key, external_product_id, purchase_kind,
    store_event_at, store_event_source, revocation_at
  ) values (
    'apple_iap', v_chiave, 'fitmesh_pro_lifetime', 'lifetime',
    now() + interval '15 hours', 'apple_signed_date', now()
  );

  -- Il guasto di scrittura: senza, la revoca verrebbe applicata (un'evidenza
  -- store SUPERA un segnaposto) e il ramo della postcondizione non si
  -- raggiungerebbe. E' lo scenario che la review descrive: "dopo un
  -- persistence_failed".
  execute $mut$
    create or replace function private._billing_project_entitlement(p_user_id uuid)
    returns jsonb language plpgsql security definer set search_path to '' as $f$
    begin
      raise exception 'proiezione guasta (mutazione di prova)' using errcode = 'XX000';
    end; $f$;
  $mut$;

  perform private.billing_apply_pending_revocations();

  select count(*) into v_attese
  from private.billing_pending_revocations where ownership_key = v_chiave;
  if v_attese <> 1 then
    raise exception 'P9 FAIL: un segnaposto piu'' recente ha consumato l''ultima copia di un rimborso (righe rimaste %)', v_attese;
  end if;
  raise notice 'P9 PASS: un segnaposto non supera un''evidenza store, nemmeno per cancellarla';

  execute (select def || ';' from t_proiettore);

  -- ── P10: una RICEVUTA LEGACY non sbarra la strada a una revoca JWS ───────
  --
  -- LA VERSIONE PRECEDENTE DI QUESTO CASO ERA CIECA, e la cecita' costava un
  -- rimborso. Asseriva che la riga in attesa SOPRAVVIVESSE, e sopravviveva:
  -- passava. Ma nessuno guardava il diritto proiettato, e il diritto restava
  -- `active` — per sempre, perche' quella revoca non poteva essere applicata
  -- in nessun giro futuro. Per il cliente rimborsato, una revoca conservata e
  -- mai applicata e una revoca buttata via sono la stessa cosa.
  --
  -- Il difetto stava nella REGOLA, non nella rete: `_billing_evidenza_supera`
  -- diceva che una ricevuta legacy non annulla una revoca JWS gia' registrata,
  -- ma taceva sul caso opposto, che finiva nel confronto fra timestamp. E il
  -- piu' recente e' quasi sempre la ricevuta legacy, perche' `request_date` e'
  -- l'istante in cui NOI abbiamo chiesto: basta che il cliente riapra l'app
  -- dopo essere stato rimborsato.
  --
  -- Adesso la regola vale nei due versi e l'esito non dipende dall'ordine di
  -- arrivo: la revoca si applica, e si asserisce il DIRITTO, non la riga.
  delete from private.billing_pending_revocations where ownership_key = v_chiave;

  alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
  update private.billing_purchase_states
     set state = 'active',
         store_event_source = 'apple_request_date',
         store_event_at = now() - interval '1 hour',
         revocation_at = null
   where billing_source = 'apple_iap' and ownership_key = v_chiave;
  alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;
  perform private._billing_project_entitlement(v_utente);

  select state into v_proiettato from public.b2c_subscriptions where user_id = v_utente;
  if v_proiettato is distinct from 'active' then
    raise exception 'P10 premessa FAIL: doveva esserci un Pro attivo da revocare (proiezione "%")', v_proiettato;
  end if;

  -- La revoca firmata da Apple, con signedDate ANTERIORE all'ultima
  -- interrogazione verifyReceipt. E' l'ordine normale, non un caso di
  -- laboratorio.
  insert into private.billing_pending_revocations (
    billing_source, ownership_key, external_product_id, purchase_kind,
    store_event_at, store_event_source, revocation_at
  ) values (
    'apple_iap', v_chiave, 'fitmesh_pro_lifetime', 'lifetime',
    now() - interval '5 hours', 'apple_signed_date', now() - interval '5 hours'
  );

  perform private.billing_apply_pending_revocations();

  select state into v_stato
  from private.billing_purchase_states where ownership_key = v_chiave;
  if v_stato is distinct from 'revoked' then
    raise exception 'P10 FAIL: una ricevuta legacy piu'' recente ha impedito alla revoca JWS di entrare nel registro (stato "%")', v_stato;
  end if;

  select state into v_proiettato from public.b2c_subscriptions where user_id = v_utente;
  if v_proiettato is distinct from 'expired' then
    raise exception 'P10 FAIL: il cliente e'' stato rimborsato e il Pro e'' ancora "%"', v_proiettato;
  end if;

  select count(*) into v_attese
  from private.billing_pending_revocations where ownership_key = v_chiave;
  if v_attese <> 0 then
    raise exception 'P10 FAIL: la revoca e'' stata applicata ma resta in attesa (righe %)', v_attese;
  end if;
  raise notice 'P10 PASS: la revoca JWS entra anche se la ricevuta legacy e'' piu'' recente, e il Pro se ne va';

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

-- ── I DUE PERCORSI DI LETTURA, COME LI PERCORRE IL PRODOTTO ─────────────────
--
-- Nessuno dei due chiama il ricalcolo: e' esattamente il punto. Il primo e' la
-- RPC del contratto, il secondo e' la lettura diretta della tabella che fa il
-- client (SubscriptionsRepository.fetchActiveSubscription), nella sua forma
-- esatta — stato attivo o grace, scadenza nel futuro.
create or replace function pg_temp.kind_of(p_user uuid) returns text
language plpgsql as $$
declare v text;
begin
  perform set_config('request.jwt.claims',
                     json_build_object('sub', p_user::text)::text, true);
  select public.get_entitlement_status() ->> 'entitlementKind' into v;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $$;

-- `clock_timestamp()` e non `now()`: il client legge con l'orologio del
-- momento in cui chiede, mentre `now()` resta fermo all'inizio della
-- transazione. Dentro un test che misura il passare del tempo, la differenza
-- e' fra provare qualcosa e non provare niente.
create or replace function pg_temp.lettura_diretta(p_user uuid) returns boolean
language sql as $$
  select exists (
    select 1 from public.b2c_subscriptions t
    where t.user_id = p_user
      and t.state in ('active', 'grace')
      and t.active_until > clock_timestamp()
  );
$$;

-- ── S: il cancello Sandbox e' un vincolo della tabella ──────────────────────
do $$
declare
  v_revisore uuid := '00000000-0000-4000-8000-00000000e011';
  v_normale  uuid := '00000000-0000-4000-8000-00000000e012';
  v_lifetime timestamptz := '9999-12-31T23:59:59Z';
  v_esito jsonb;
  v_stato text;
  v_fino_a timestamptz;
  v_permesso timestamptz;
  v_chiave_proiettata text;
  v_kind text;
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
  select state, active_until into v_stato, v_fino_a
  from public.b2c_subscriptions where user_id = v_revisore;
  if v_stato is distinct from 'active' then
    raise exception 'S13 FAIL: il revisore ha comprato ma la proiezione dice "%"', v_stato;
  end if;

  -- IL DIRITTO NON SUPERA IL PERMESSO. Il registro dice 9999-12-31 perche' lo
  -- store ha detto lifetime; la proiezione, che e' cio' che il prodotto legge,
  -- non puo' dire la stessa cosa. Con 9999 la riga risulta lifetime a
  -- `is_b2c_lifetime()` e nessuno dei due percorsi di lettura guarda oltre.
  select expires_at into v_permesso
  from private.billing_sandbox_reviewers where user_id = v_revisore;
  if v_fino_a is distinct from v_permesso then
    raise exception 'S13 FAIL: la proiezione Sandbox concede fino a % mentre il permesso finisce il % ', v_fino_a, v_permesso;
  end if;
  if exists (select 1 from public.b2c_subscriptions t
             where t.user_id = v_revisore and public.is_b2c_lifetime(t)) then
    raise exception 'S13 FAIL: un acquisto Sandbox risulta lifetime, quindi nessun lettore guardera'' la scadenza';
  end if;
  raise notice 'S13 PASS: il revisore compra, e il diritto dura quanto il permesso (non 9999)';

  -- ── S14: togliere il permesso toglie il diritto, SENZA chiamare niente ──
  --
  -- Il difetto: la scadenza toglieva il permesso e lasciava il diritto. La
  -- prova precedente non lo vedeva perche' chiamava il ricalcolo A MANO subito
  -- dopo: provava che il ricalcolo decide bene, non che parta. Qui non si
  -- chiama niente — si sposta la scadenza e basta, che e' quello che fa
  -- l'operatore in SQL.
  update private.billing_sandbox_reviewers
     set created_at = now() - interval '30 days',
         expires_at = now() - interval '1 second'
   where user_id = v_revisore;

  select state into v_stato from public.b2c_subscriptions where user_id = v_revisore;
  if v_stato is distinct from 'expired' then
    raise exception 'S14 FAIL: permesso scaduto ma la proiezione dice ancora "%"', v_stato;
  end if;
  if pg_temp.lettura_diretta(v_revisore) then
    raise exception 'S14 FAIL: la lettura diretta della tabella concede ancora il Pro';
  end if;
  v_kind := pg_temp.kind_of(v_revisore);
  if v_kind in ('lifetime', 'subscription') then
    raise exception 'S14 FAIL: get_entitlement_status risponde ancora "%"', v_kind;
  end if;
  raise notice 'S14 PASS: tolto il permesso, i due percorsi di lettura negano subito';

  -- ── S15: il teardown non aspetta la scadenza ────────────────────────────
  update private.billing_sandbox_reviewers
     set created_at = now(), expires_at = now() + interval '7 days'
   where user_id = v_revisore;
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

-- ── S16-S17: LA SCADENZA CHE ARRIVA DA SOLA ─────────────────────────────────
--
-- Gli altri casi hanno tutti qualcuno che scrive: un permesso tolto, uno
-- accorciato, un teardown. Questo no. Qui non succede niente — passa e basta
-- il tempo — ed e' il caso che nessun trigger puo' vedere.
--
-- Sono DUE transazioni separate con un'attesa vera in mezzo, e non e' un
-- dettaglio: dentro una sola transazione `now()` resta fermo all'istante in
-- cui e' cominciata, quindi un `pg_sleep` non farebbe scadere niente e il
-- test proverebbe soltanto se stesso.
do $$
declare
  v_revisore uuid := '00000000-0000-4000-8000-00000000e013';
  v_lifetime timestamptz := '9999-12-31T23:59:59Z';
  v_esito jsonb;
  v_stato text;
  v_chiave text;
begin
  raise notice '########### LA SCADENZA CHE ARRIVA DA SOLA ###########';

  alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
  alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
  delete from private.billing_purchase_states where ownership_key like '%810000000000%';
  delete from private.billing_purchase_claims where ownership_key like '%810000000000%';
  alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
  alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;
  delete from private.billing_sandbox_reviewers where user_id = v_revisore;
  perform pg_catalog.set_config('billing.projection', 'on', true);
  delete from public.b2c_subscriptions where user_id = v_revisore;
  perform pg_catalog.set_config('billing.projection', 'off', true);
  delete from auth.users where id = v_revisore;
  insert into auth.users (id, email, created_at)
  values (v_revisore, 'rev-scadenza@test.local', now());

  -- Un acquisto di PRODUZIONE valido, comprato davvero. E' il diritto che deve
  -- tornare fuori quando il permesso Sandbox finisce: senza, "riproietta il
  -- miglior diritto rimasto" resterebbe una frase.
  v_esito := public.claim_store_purchase(
    'apple_iap', '8100000000001', v_revisore, 'fitmesh_pro_sub', 'subscription',
    'production', 'active', now() + interval '30 days', true,
    now(), 'apple_signed_date', 'tx-s16-prod', v_revisore
  );
  if v_esito->>'outcome' <> 'claimed' then
    raise exception 'S16 setup FAIL: l''acquisto di produzione non e'' entrato (%)', v_esito->>'outcome';
  end if;

  -- Il permesso Sandbox, che finisce fra tre secondi.
  insert into private.billing_sandbox_reviewers (user_id, note, expires_at)
  values (v_revisore, 'test scadenza naturale', now() + interval '3 seconds');

  v_esito := public.claim_store_purchase(
    'apple_iap', 'sandbox:8100000000002', v_revisore, 'fitmesh_pro_lifetime', 'lifetime',
    'sandbox', 'active', v_lifetime, false,
    now(), 'apple_signed_date', 'tx-s16-sbx', v_revisore
  );
  if v_esito->>'outcome' <> 'claimed' then
    raise exception 'S16 setup FAIL: il claim Sandbox non e'' entrato (%)', v_esito->>'outcome';
  end if;

  select external_subscription_id, state into v_chiave, v_stato
  from public.b2c_subscriptions where user_id = v_revisore;
  if v_chiave not like 'sandbox:%' or v_stato is distinct from 'active' then
    raise exception 'S16 setup FAIL: doveva vincere il Sandbox, la proiezione dice %/%', v_chiave, v_stato;
  end if;
  if not pg_temp.lettura_diretta(v_revisore) then
    raise exception 'S16 setup FAIL: il permesso e'' valido ma la lettura diretta gia'' nega';
  end if;
end $$;

-- Il tempo, quello vero. Tre secondi e mezzo su un permesso di tre secondi.
select pg_sleep(3.5);

do $$
declare
  v_revisore uuid := '00000000-0000-4000-8000-00000000e013';
  v_stato text;
  v_chiave text;
  v_kind text;
  v_riconciliati int;
  v_f6 boolean;
begin
  -- ── S16: scaduto da solo, e i due percorsi NON dicono la stessa cosa ─────
  --
  -- Nessuno ha chiamato il ricalcolo, nessun trigger e' partito, il job non e'
  -- ancora girato. La riga in proiezione e' rimasta identica.
  --
  -- PRIMO PERCORSO — la lettura diretta della tabella, cioe' la query che fa
  -- davvero il client. Nega, e nega per una difesa che la 190 spedisce: la
  -- proiezione LIMITA `active_until` al permesso Sandbox (il `least()` in
  -- `_billing_project_entitlement`). Questa meta' non dipende da F6 e non ha
  -- mai dipeso da F6, anche se il commento che stava qui diceva il contrario.
  if pg_temp.lettura_diretta(v_revisore) then
    raise exception 'S16 FAIL: permesso scaduto e la lettura diretta della tabella concede ancora il Pro';
  end if;

  -- SECONDO PERCORSO — `get_entitlement_status`, che passa da
  -- `private.entitlement_core`. Qui la risposta dipende da F6, e la 190 NON
  -- applica F6.
  --
  -- La scelta di come scrivere questo caso conta piu' del caso stesso. Fino al
  -- 30/08/2026 asseriva che ANCHE questo percorso negasse, e quell'asserzione
  -- passava solo perche' F6 era nell'insieme pending. Il giorno
  -- dell'esclusione sarebbe diventata rossa, e sarebbe stata letta come un
  -- difetto scoperto invece che come il perimetro che era stato deciso.
  --
  -- Non si toglie l'asserzione: si LEGGE il corpo vivo e si pretende la cosa
  -- giusta nei due casi. La condizione non e' inventata qui — e' la stessa
  -- stringa con cui la postcondizione di F6 dichiara se stessa applicata.
  select pg_catalog.strpos(pg_catalog.pg_get_functiondef(p.oid),
                           'b.active_until > v_now') > 0
    into v_f6
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = 'entitlement_core'
  limit 1;

  if v_f6 is null then
    raise exception 'S16 FAIL: private.entitlement_core non esiste. Non e'' un perimetro diverso, e'' un database rotto.';
  end if;

  v_kind := pg_temp.kind_of(v_revisore);

  if v_f6 then
    -- F6 applicata: entrambi i percorsi devono negare. E' l'S16 storico.
    if v_kind in ('lifetime', 'subscription') then
      raise exception 'S16 FAIL: F6 e'' applicata e get_entitlement_status risponde ancora "%"', v_kind;
    end if;
    raise notice 'S16 PASS (con F6): scaduto il permesso, i DUE percorsi negano senza che giri niente';
  else
    -- 190: F6 esclusa. Il percorso RPC continua a concedere, e questo e' il
    -- RESIDUO DICHIARATO dell'esclusione — non un difetto trovato qui.
    --
    -- Va asserito, non taciuto. Un residuo che nessuno misura e' un residuo
    -- che nessuno vede ne' sparire ne' peggiorare: se un giorno questo ramo
    -- diventasse rosso, vorrebbe dire che qualcosa ha cambiato l'autorita'
    -- dell'entitlement senza passare da qui, ed e' esattamente il momento in
    -- cui qualcuno deve venire a leggere.
    --
    -- Perche' 'subscription' e non 'lifetime': la proiezione ha gia' limitato
    -- `active_until` al permesso, quindi `is_b2c_lifetime()` e' falsa e
    -- `entitlement_core` cade nel ramo a tempo. Concede lo stesso.
    if v_kind not in ('lifetime', 'subscription') then
      raise exception 'S16 FAIL: senza F6 il residuo dichiarato e'' che get_entitlement_status conceda ancora; risponde invece "%". Il perimetro e'' cambiato: rileggerlo prima di toccare questo test.', v_kind;
    end if;
    raise notice 'S16 PASS (senza F6, perimetro 190): la lettura diretta nega per scadenza; l''RPC concede ancora "%" — residuo dichiarato dell''esclusione di F6, non un difetto', v_kind;
  end if;

  -- ── S17: e il job rimette al suo posto il diritto vero ───────────────────
  --
  -- Premessa del caso: la riga proiettata e' ancora quella Sandbox, marcata
  -- `active` su un diritto finito. Finche' resta li', quell'account non vede
  -- l'abbonamento di produzione che ha davvero pagato — S16 lo ha appena
  -- misurato: nega tutto, anche cio' che spetta.
  select external_subscription_id, state into v_chiave, v_stato
  from public.b2c_subscriptions where user_id = v_revisore;
  if v_chiave not like 'sandbox:%' then
    raise exception 'S17 premessa FAIL: qualcosa ha gia'' riproiettato (chiave %)', v_chiave;
  end if;

  select private.billing_reconcile_sandbox_projections() into v_riconciliati;
  if v_riconciliati < 1 then
    raise exception 'S17 FAIL: il job non ha riconciliato nessun account (%)', v_riconciliati;
  end if;

  select external_subscription_id, state into v_chiave, v_stato
  from public.b2c_subscriptions where user_id = v_revisore;
  if v_chiave is distinct from '8100000000001' or v_stato is distinct from 'active' then
    raise exception 'S17 FAIL: il diritto di produzione non e'' tornato al suo posto (%/%)', v_chiave, v_stato;
  end if;
  v_kind := pg_temp.kind_of(v_revisore);
  if v_kind is distinct from 'subscription' then
    raise exception 'S17 FAIL: riproiettato, ma il contratto risponde "%"', v_kind;
  end if;
  raise notice 'S17 PASS: il job marca la riga scaduta e rimette davanti l''abbonamento di produzione';

  -- Pulizia
  alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
  alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
  delete from private.billing_purchase_states where ownership_key like '%810000000000%';
  delete from private.billing_purchase_claims where ownership_key like '%810000000000%';
  alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
  alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;
  delete from private.billing_sandbox_reviewers where user_id = v_revisore;
  perform pg_catalog.set_config('billing.projection', 'on', true);
  delete from public.b2c_subscriptions where user_id = v_revisore;
  perform pg_catalog.set_config('billing.projection', 'off', true);
  delete from auth.users where id = v_revisore;
end $$;

\echo ''
\echo '=================================================='
\echo 'ATTESA E SANDBOX: la revoca aspetta, il cancello e del registro'
\echo '=================================================='
