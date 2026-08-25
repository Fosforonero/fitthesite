-- ============================================================================
-- IL PAREGGIO NEL VERSO OPPOSTO: UN `active` NON RIACCENDE UN RIMBORSO
--
-- 91 prova il pareggio in UN solo verso: la revoca arriva su una chiave mai
-- reclamata, finisce in attesa, e il claim arriva dopo. In quella forma il
-- verso opposto non e' nemmeno osservabile — non c'e' mai uno stato `revoked`
-- registrato contro cui un `active` possa competere.
--
-- Qui la sequenza e' quella di un acquisto GIA' RECLAMATO, che e' il caso
-- normale di un abbonamento in corso:
--
--   1. claim        active  @T0   apple_request_date   (validazione precedente)
--   2. revoca       revoked @T    apple_request_date   (rimborso nella ricevuta)
--   3. claim        active  @T    apple_request_date   (route.ts:866-867)
--
-- I passi 2 e 3 usano LO STESSO `result.requestDateMs`, perche' la route
-- legacy lo passa a entrambe le chiamate. Al passo 3 il registro dice gia'
-- `revoked` con lo stesso istante: e' un pareggio, nel verso
-- `revoked -> active`.
--
-- LA PROPRIETA': a parita' di evidenza un `active` non toglie una revoca.
-- Se la togliesse, la route riaccenderebbe il Pro a un cliente rimborsato
-- dentro la stessa richiesta che ha appena registrato il rimborso.
--
-- ── PERCHE' QUESTO FILE ESISTE ─────────────────────────────────────────────
--
-- Una review indipendente ha iniettato nel comparatore il ramo simmetrico
--
--     when p_vecchio_stato = 'revoked'
--      and p_nuovo_stato <> 'revoked'
--      and p_nuova_at = p_vecchia_at   then true
--
-- cioe' esattamente cio' che il commento e il COMMENT ON dichiarano non debba
-- mai valere, e **tutti e 13 i file SQL della suite sono rimasti verdi**. La
-- proprieta' su cui poggia la P0 non era difesa da niente: il comportamento
-- era giusto, l'evidenza no.
--
-- Con la mutazione, misurato: registro `active`, diritto proiettato `active`.
-- Pro riacceso a un rimborsato.
--
-- Tutto dentro una transazione chiusa da ROLLBACK: il container e' condiviso.
-- ============================================================================
\set ON_ERROR_STOP on
\timing off

begin;

do $$
declare
  v_utente uuid := '00000000-0000-4000-8000-00000000e093';
  v_chiave text := '9300000000000001';
  v_t0 timestamptz := now() - interval '6 hours';
  -- Un solo istante per la revoca e per il claim che la segue: e' quello che
  -- fa la route passando lo stesso requestDateMs a entrambe le chiamate.
  v_t  timestamptz := now() - interval '3 hours';
  v_esito jsonb;
  v_stato text;
  v_rev boolean;
  v_attese int;
  v_proiettato text;
begin
  raise notice '########### PAREGGIO NEL VERSO revoked -> active ###########';

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
  values (v_utente, 'verso-opposto@test.local', now());

  -- ── 1. Validazione precedente: l'abbonamento e' vivo ed e' reclamato. ────
  v_esito := public.claim_store_purchase(
    'apple_iap', v_chiave, v_utente, 'fitmesh_pro_sub', 'subscription',
    'production', 'active', now() + interval '30 days', true,
    v_t0, 'apple_request_date', null, null
  );
  if v_esito->>'outcome' <> 'claimed' then
    raise exception 'PREMESSA FAIL: il claim iniziale non ha reclamato (%)', v_esito->>'outcome';
  end if;

  -- ── 2. La ricevuta porta il rimborso. Qui la chiave E' reclamata, quindi
  --      la revoca non va in attesa: si applica subito.
  v_esito := public.record_store_purchase_revocation(
    'apple_iap', v_chiave, 'fitmesh_pro_sub', 'subscription',
    v_t, 'apple_request_date', v_t
  );
  select state into v_stato
    from private.billing_purchase_states where ownership_key = v_chiave;
  if v_stato is distinct from 'revoked' then
    raise exception
      'PREMESSA FAIL: la revoca su un acquisto reclamato non e'' stata applicata (stato "%", outcome %). Senza questo, il passo 3 non misura niente.',
      v_stato, v_esito->>'outcome';
  end if;

  -- ── 3. E subito dopo, nella stessa richiesta, il claim della transazione
  --      viva: stesso istante, stessa sorgente. Il pareggio.
  v_esito := public.claim_store_purchase(
    'apple_iap', v_chiave, v_utente, 'fitmesh_pro_sub', 'subscription',
    'production', 'active', now() + interval '30 days', true,
    v_t, 'apple_request_date', null, null
  );

  select state, revocation_at is not null into v_stato, v_rev
    from private.billing_purchase_states where ownership_key = v_chiave;
  select count(*) into v_attese
    from private.billing_pending_revocations where ownership_key = v_chiave;
  select state into v_proiettato
    from public.b2c_subscriptions where user_id = v_utente;

  -- ── LA PROPRIETA' ───────────────────────────────────────────────────────
  if v_stato is distinct from 'revoked' then
    raise exception
      'FAIL: un "active" a parita'' di istante ha tolto la revoca. Registro "%", revocation_at valorizzato %, diritto proiettato "%". La stessa richiesta che ha appena registrato il rimborso avrebbe riacceso il Pro al cliente rimborsato.',
      v_stato, v_rev, v_proiettato;
  end if;

  -- Il diritto proiettato va guardato a parte: il registro potrebbe essere
  -- giusto e la proiezione no, ed e' quella che decide se l'app da' il Pro.
  -- Misurato durante la review: `_billing_project_entitlement` non guarda
  -- `revocation_at`, quindi non c'e' nessuna rete a valle.
  if v_proiettato is distinct from 'expired' then
    raise exception
      'FAIL: registro "%" ma diritto proiettato "%". Il rimborso e'' nel registro e non arriva alla proiezione: il cliente vede ancora il Pro.',
      v_stato, v_proiettato;
  end if;

  if v_attese <> 0 then
    raise exception
      'FAIL: revoca applicata al passo 2 ma e'' comparsa una riga in attesa (righe = %): la revoca e'' stata riproposta invece che rispettata.',
      v_attese;
  end if;

  raise notice 'OK: a parita'' di istante un "active" non riaccende un rimborso — registro %, diritto %', v_stato, v_proiettato;
end $$;

rollback;
