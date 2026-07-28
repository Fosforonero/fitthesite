-- Sprint P0.10E addendum — test funzionali get_entitlement_status() +
-- hardening grant_b2c_trial, su supabase/postgres reale.
\set ON_ERROR_STOP on
set role postgres;

create or replace function test.assert(p_cond boolean, p_msg text)
returns void language plpgsql as $$
begin
  if not p_cond then
    raise exception 'ASSERT FALLITO: %', p_msg;
  end if;
end;
$$;

-- ============================================================================
-- Caso 1: nessun entitlement, trial giorno 0 (created_at = now())
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('trial-day0@test.local', now());
  v_res jsonb;
begin
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'entitlementKind' = 'trial', 'Caso 1: atteso trial, trovato ' || (v_res->>'entitlementKind'));
  perform test.assert(v_res->>'trialStatus' = 'active', 'Caso 1: trialStatus deve essere active');
  perform test.assert((v_res->>'entitlementExpiresAt')::timestamptz = (v_res->>'trialEndsAt')::timestamptz, 'Caso 1: expiresAt deve coincidere con trialEndsAt per un trial attivo');
  perform test.assert(v_res->>'founderEligibility' = 'pending_first_sync', 'Caso 1: founderEligibility deve essere pending_first_sync (creato prima del cutoff)');
  perform test.assert((v_res->>'contractVersion')::int = 1, 'Caso 1: contractVersion deve essere 1');
  perform test.assert(v_res->>'evaluationReason' = 'trial_within_window', 'Caso 1: evaluationReason atteso trial_within_window, trovato ' || (v_res->>'evaluationReason'));
  perform test.assert(v_res->>'founderWindowClosed' = 'false', 'Caso 1: founderWindowClosed deve essere false (pending_first_sync)');
  perform test.assert((v_res->>'offlineValidUntil')::timestamptz = (v_res->>'serverNow')::timestamptz + interval '24 hours', 'Caso 1: offlineValidUntil deve essere serverNow + 24h esatte');
  raise notice 'Caso 1 OK: %', v_res;
end $$;

-- ============================================================================
-- Caso 2: trial un secondo prima della scadenza (13gg 23h59m59s dopo signup)
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('trial-almost-expired@test.local', now() - interval '14 days' + interval '1 second');
  v_res jsonb;
begin
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'entitlementKind' = 'trial', 'Caso 2: atteso ancora trial, trovato ' || (v_res->>'entitlementKind'));
  perform test.assert(v_res->>'trialStatus' = 'active', 'Caso 2: trialStatus deve essere ancora active');
  raise notice 'Caso 2 OK';
end $$;

-- ============================================================================
-- Caso 3: trial scaduto un secondo dopo (14gg + 1s dopo signup) -> none
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('trial-just-expired@test.local', now() - interval '14 days' - interval '1 second');
  v_res jsonb;
begin
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'trialStatus' = 'expired', 'Caso 3: trialStatus deve essere expired');
  perform test.assert(v_res->>'entitlementKind' = 'none', 'Caso 3: atteso none dopo scadenza trial senza altri entitlement, trovato ' || (v_res->>'entitlementKind'));
  perform test.assert(v_res->>'entitlementExpiresAt' is null, 'Caso 3: expiresAt deve essere null per entitlementKind=none');
  raise notice 'Caso 3 OK';
end $$;

-- ============================================================================
-- Caso 4: clock rollback lato client NON ha alcun effetto — il server usa
-- solo il proprio now(), il test non passa alcun timestamp client.
-- (Verifica strutturale: la funzione ha zero parametri di input.)
-- ============================================================================
do $$
declare
  v_argcount int;
begin
  select pronargs into v_argcount from pg_proc where proname = 'get_entitlement_status' and pronamespace = 'public'::regnamespace;
  perform test.assert(v_argcount = 0, 'Caso 4: get_entitlement_status deve avere zero parametri (nessun modo per il client di iniettare un now() proprio)');
  raise notice 'Caso 4 OK: zero parametri, il client non puo'' passare un timestamp';
end $$;

-- ============================================================================
-- Caso 5: Founder esistente -> founder, mai declassato dal trial scaduto
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('founder@test.local', now() - interval '400 days');
  v_res jsonb;
begin
  insert into public.user_roles (user_id, role, note) values (v_user, 'pro', 'founder-launch');
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'entitlementKind' = 'founder', 'Caso 5: atteso founder, trovato ' || (v_res->>'entitlementKind'));
  perform test.assert(v_res->>'founderEligibility' = 'already_founder', 'Caso 5: founderEligibility deve essere already_founder');
  perform test.assert(v_res->>'entitlementExpiresAt' is null, 'Caso 5: Founder non scade mai');
  perform test.assert(v_res->>'evaluationReason' = 'founder_role', 'Caso 5: evaluationReason atteso founder_role');
  perform test.assert(v_res->>'founderWindowClosed' = 'true', 'Caso 5: founderWindowClosed deve essere true per un founder gia'' assegnato');
  raise notice 'Caso 5 OK';
end $$;

-- ============================================================================
-- Caso 6: grandfather (note fuzzy-matched) -> grandfather, non lifetime generico
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('grandfather@test.local', now() - interval '400 days');
  v_res jsonb;
begin
  insert into public.user_roles (user_id, role, note) values (v_user, 'pro', 'grandfather-prelaunch');
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'entitlementKind' = 'grandfather', 'Caso 6: atteso grandfather, trovato ' || (v_res->>'entitlementKind'));
  perform test.assert(v_res->>'evaluationReason' = 'grandfather_role', 'Caso 6: evaluationReason atteso grandfather_role');
  raise notice 'Caso 6 OK';
end $$;

-- ============================================================================
-- Caso 7: pro permanente non-founder non-grandfather (es. beta-tester) -> lifetime
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('beta-tester@test.local', now() - interval '400 days');
  v_res jsonb;
begin
  insert into public.user_roles (user_id, role, note) values (v_user, 'pro', 'beta-tester-closed-beta');
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'entitlementKind' = 'lifetime', 'Caso 7: atteso lifetime per pro non-founder/grandfather, trovato ' || (v_res->>'entitlementKind'));
  perform test.assert(v_res->>'evaluationReason' = 'lifetime_role', 'Caso 7: evaluationReason atteso lifetime_role');
  raise notice 'Caso 7 OK';
end $$;

-- ============================================================================
-- Caso 8: b2c_subscriptions lifetime (active_until oltre anno 9000) -> lifetime
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('lifetime-purchase@test.local', now() - interval '10 days');
  v_res jsonb;
begin
  insert into public.b2c_subscriptions (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state)
  values (v_user, 'google_play', 'fitmesh_lifetime', 'gpa.lifetime-1', '9999-12-31'::timestamptz, false, 'active');
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'entitlementKind' = 'lifetime', 'Caso 8: atteso lifetime da b2c_subscriptions, trovato ' || (v_res->>'entitlementKind'));
  perform test.assert(v_res->>'evaluationReason' = 'lifetime_subscription_row', 'Caso 8: evaluationReason atteso lifetime_subscription_row, trovato ' || (v_res->>'evaluationReason'));
  raise notice 'Caso 8 OK';
end $$;

-- ============================================================================
-- Caso 9: subscription attiva reale (non trial, non lifetime) -> subscription
-- con entitlementExpiresAt = active_until
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('sub-active@test.local', now() - interval '30 days');
  v_res jsonb;
  v_until timestamptz := now() + interval '17 days';
begin
  insert into public.b2c_subscriptions (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state)
  values (v_user, 'apple_iap', 'fitmesh_pro_monthly', 'sub-1', v_until, true, 'active');
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'entitlementKind' = 'subscription', 'Caso 9: atteso subscription, trovato ' || (v_res->>'entitlementKind'));
  perform test.assert((v_res->>'entitlementExpiresAt')::timestamptz = v_until, 'Caso 9: expiresAt deve coincidere con active_until');
  perform test.assert(v_res->>'evaluationReason' = 'active_subscription_row', 'Caso 9: evaluationReason atteso active_subscription_row');
  raise notice 'Caso 9 OK';
end $$;

-- ============================================================================
-- Caso 10: subscription scaduta/cancellata (state non active/grace), trial
-- gia' scaduto -> none (una subscription cancellata non deve fingere accesso)
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('sub-cancelled@test.local', now() - interval '400 days');
  v_res jsonb;
begin
  insert into public.b2c_subscriptions (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state)
  values (v_user, 'stripe', 'fitmesh_pro_monthly', 'sub-2', now() - interval '5 days', false, 'cancelled');
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'entitlementKind' = 'none', 'Caso 10: subscription cancellata + trial scaduto deve dare none, trovato ' || (v_res->>'entitlementKind'));
  raise notice 'Caso 10 OK';
end $$;

-- ============================================================================
-- Caso 11: App Review demo account -> appReview, anche con trial scaduto
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('appreview.demo@fitmesh.fit', now() - interval '400 days');
  v_res jsonb;
begin
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'entitlementKind' = 'appReview', 'Caso 11: atteso appReview, trovato ' || (v_res->>'entitlementKind'));
  perform test.assert(v_res->>'evaluationReason' = 'app_review_email', 'Caso 11: evaluationReason atteso app_review_email');
  raise notice 'Caso 11 OK';
end $$;

-- ============================================================================
-- Caso 18: risposta fresca con entitlement forte prevale SEMPRE su un trial
-- scaduto da tempo — nessuna logica di merge lato server, la priorita' e'
-- gia' risolta nell'if/elsif: un utente con trial scaduto da 400 giorni MA
-- con subscription attiva oggi deve leggere 'subscription', mai 'none'
-- ne' un valore derivato dal (falso) presupposto "trial scaduto = niente
-- accesso". Verifica esplicita della richiesta di Matteo del 28/07/2026
-- (addendum ADDENDUM P0.10 dopo il draft consumer app).
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('fresh-overrides-stale-trial@test.local', now() - interval '400 days');
  v_res jsonb;
begin
  insert into public.b2c_subscriptions (user_id, billing_source, external_product_id, external_subscription_id, active_until, auto_renewing, state)
  values (v_user, 'google_play', 'fitmesh_pro_monthly', 'sub-fresh-1', now() + interval '10 days', true, 'active');
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'trialStatus' = 'expired', 'Caso 18: il trial di questo utente deve risultare scaduto (400gg)');
  perform test.assert(v_res->>'entitlementKind' = 'subscription', 'Caso 18: nonostante il trial scaduto, una subscription attiva reale deve vincere sempre, trovato ' || (v_res->>'entitlementKind'));
  raise notice 'Caso 18 OK: subscription fresca prevale su trial scaduto, come richiesto';
end $$;

-- ============================================================================
-- Caso 12: account creato ESATTAMENTE al cutoff Founder -> founderEligibility
-- = program_closed (>=, mai eleggibile), anche se trial ancora attivo
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('exact-cutoff@test.local', '2026-07-31T22:00:00Z'::timestamptz);
  v_res jsonb;
begin
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'founderEligibility' = 'program_closed', 'Caso 12: creato esattamente al cutoff deve essere program_closed (>=), trovato ' || (v_res->>'founderEligibility'));
  perform test.assert(v_res->>'entitlementKind' = 'trial', 'Caso 12: il trial resta indipendente dal cutoff Founder, atteso trial');
  raise notice 'Caso 12 OK';
end $$;

-- ============================================================================
-- Caso 13: account creato 1ms prima del cutoff -> founderEligibility resta
-- pending_first_sync (< cutoff, ancora nella finestra teorica)
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('just-before-cutoff@test.local', '2026-07-31T22:00:00Z'::timestamptz - interval '1 millisecond');
  v_res jsonb;
begin
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'founderEligibility' = 'pending_first_sync', 'Caso 13: 1ms prima del cutoff deve restare pending_first_sync, trovato ' || (v_res->>'founderEligibility'));
  raise notice 'Caso 13 OK';
end $$;

-- ============================================================================
-- Caso 14: isolamento cross-user — A e B con stati diversi, ciascuno legge
-- SOLO il proprio stato (nessun parametro per leggere l'altrui)
-- ============================================================================
do $$
declare
  v_a uuid := test.mkuser('cross-a@test.local', now() - interval '400 days');
  v_b uuid := test.mkuser('cross-b@test.local', now() - interval '400 days');
  v_res_a jsonb;
  v_res_b jsonb;
begin
  insert into public.user_roles (user_id, role, note) values (v_a, 'pro', 'founder-launch');
  -- B non ha alcun entitlement e trial scaduto da tempo.
  v_res_a := test.call_as(v_a);
  v_res_b := test.call_as(v_b);
  perform test.assert(v_res_a->>'entitlementKind' = 'founder', 'Caso 14: A deve restare founder');
  perform test.assert(v_res_b->>'entitlementKind' = 'none', 'Caso 14: B non deve vedere lo stato di A (isolamento)');
  raise notice 'Caso 14 OK: isolamento cross-user confermato';
end $$;

-- ============================================================================
-- Caso 15: auth.uid() null (nessun JWT) -> eccezione, non un default silenzioso
-- ============================================================================
do $$
declare
  v_raised boolean := false;
begin
  perform set_config('request.jwt.claim.sub', '', true);
  reset role;
  begin
    perform public.get_entitlement_status();
  exception when others then
    v_raised := true;
  end;
  perform test.assert(v_raised, 'Caso 15: senza auth.uid() la funzione deve sollevare eccezione, non restituire un default');
  raise notice 'Caso 15 OK';
end $$;

-- ============================================================================
-- Caso 16: hardening grant_b2c_trial — authenticated NON puo'' piu'' eseguirla
-- ============================================================================
do $$
declare
  v_has_execute boolean;
begin
  select has_function_privilege('authenticated', 'public.grant_b2c_trial()', 'execute') into v_has_execute;
  perform test.assert(not v_has_execute, 'Caso 16: authenticated non deve avere EXECUTE su grant_b2c_trial dopo l''hardening');
  raise notice 'Caso 16 OK: grant_b2c_trial non piu'' invocabile da authenticated';
end $$;

do $$
declare
  v_has_execute boolean;
begin
  select has_function_privilege('anon', 'public.grant_b2c_trial()', 'execute') into v_has_execute;
  perform test.assert(not v_has_execute, 'Caso 16b: anon non deve avere EXECUTE su grant_b2c_trial dopo l''hardening');
  raise notice 'Caso 16b OK';
end $$;

-- ============================================================================
-- Caso 17: authenticated conserva EXECUTE su get_entitlement_status; anon no
-- ============================================================================
do $$
declare
  v_auth boolean;
  v_anon boolean;
begin
  select has_function_privilege('authenticated', 'public.get_entitlement_status()', 'execute') into v_auth;
  select has_function_privilege('anon', 'public.get_entitlement_status()', 'execute') into v_anon;
  perform test.assert(v_auth, 'Caso 17: authenticated deve poter chiamare get_entitlement_status');
  perform test.assert(not v_anon, 'Caso 17: anon NON deve poter chiamare get_entitlement_status');
  raise notice 'Caso 17 OK';
end $$;

-- ============================================================================
-- Caso 19: offlineValidUntil = min(trialEndsAt, serverNow + 24h) — utente
-- creato 13g23h fa: il trial scade fra 1h, ben prima delle 24h piene.
-- offlineValidUntil deve coincidere con trialEndsAt, MAI estendersi oltre.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('trial-ends-soon@test.local', now() - interval '13 days 23 hours');
  v_res jsonb;
begin
  v_res := test.call_as(v_user);
  perform test.assert(v_res->>'trialStatus' = 'active', 'Caso 19: trial deve essere ancora active (mancano ~1h)');
  perform test.assert(
    (v_res->>'offlineValidUntil')::timestamptz = (v_res->>'trialEndsAt')::timestamptz,
    'Caso 19: offlineValidUntil deve coincidere con trialEndsAt (che arriva prima delle 24h piene), trovato offlineValidUntil=' || (v_res->>'offlineValidUntil') || ' trialEndsAt=' || (v_res->>'trialEndsAt')
  );
  perform test.assert(
    (v_res->>'offlineValidUntil')::timestamptz < (v_res->>'serverNow')::timestamptz + interval '24 hours',
    'Caso 19: offlineValidUntil non deve mai superare serverNow + 24h'
  );
  raise notice 'Caso 19 OK: offlineValidUntil correttamente capped a trialEndsAt';
end $$;

-- ============================================================================
-- Caso 20: offlineValidUntil per un Founder con account vecchio (trialEndsAt
-- ampiamente nel passato) — il cap NON deve trascinare offlineValidUntil nel
-- passato, resta la normale finestra di 24h da serverNow.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('founder-old-account@test.local', now() - interval '400 days');
  v_res jsonb;
begin
  insert into public.user_roles (user_id, role, note) values (v_user, 'pro', 'founder-launch');
  v_res := test.call_as(v_user);
  perform test.assert(
    (v_res->>'offlineValidUntil')::timestamptz = (v_res->>'serverNow')::timestamptz + interval '24 hours',
    'Caso 20: per un Founder con trialEndsAt nel passato, offlineValidUntil deve restare serverNow + 24h, mai nel passato'
  );
  raise notice 'Caso 20 OK: offlineValidUntil non trascinato nel passato per entitlement permanenti';
end $$;

-- ============================================================================
-- Caso 21 (REGRESSIONE, trovata in review avversariale): ring-reward SCADUTO
-- (user_roles pro, note='ring-reward', expires_at nel passato) NON deve
-- valere come 'lifetime' permanente. Senza il filtro su expires_at questo
-- utente otterrebbe Pro perpetuo gratuito.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('ring-reward-expired@test.local', now() - interval '400 days');
  v_res jsonb;
begin
  insert into public.user_roles (user_id, role, note, expires_at)
  values (v_user, 'pro', 'ring-reward', now() - interval '1 day');
  v_res := test.call_as(v_user);
  perform test.assert(
    v_res->>'entitlementKind' = 'none',
    'Caso 21: un ring-reward SCADUTO + trial scaduto deve dare none, trovato ' || (v_res->>'entitlementKind')
  );
  perform test.assert(v_res->>'entitlementExpiresAt' is null, 'Caso 21: nessuna scadenza per entitlementKind=none');
  raise notice 'Caso 21 OK: reward a tempo scaduto NON letto come lifetime';
end $$;

-- ============================================================================
-- Caso 22: ring-reward ANCORA VALIDO -> subscription (pro a tempo), con
-- entitlementExpiresAt = la scadenza reale del ruolo, mai null.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('ring-reward-valid@test.local', now() - interval '400 days');
  v_res jsonb;
  v_until timestamptz := now() + interval '90 days';
begin
  insert into public.user_roles (user_id, role, note, expires_at)
  values (v_user, 'pro', 'ring-reward', v_until);
  v_res := test.call_as(v_user);
  perform test.assert(
    v_res->>'entitlementKind' = 'subscription',
    'Caso 22: un pro a tempo ancora valido deve dare subscription, trovato ' || (v_res->>'entitlementKind')
  );
  perform test.assert(v_res->>'evaluationReason' = 'timed_pro_role', 'Caso 22: evaluationReason atteso timed_pro_role');
  perform test.assert(
    (v_res->>'entitlementExpiresAt')::timestamptz = v_until,
    'Caso 22: entitlementExpiresAt deve essere la scadenza reale del ruolo'
  );
  raise notice 'Caso 22 OK: pro a tempo valido classificato con scadenza esplicita';
end $$;

-- ============================================================================
-- Caso 23: Founder con expires_at SCADUTO — caso patologico che non dovrebbe
-- esistere (i Founder sono permanenti, expires_at null), ma se esistesse non
-- deve comunque valere come founder attivo.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('founder-expired-anomaly@test.local', now() - interval '400 days');
  v_res jsonb;
begin
  insert into public.user_roles (user_id, role, note, expires_at)
  values (v_user, 'pro', 'founder-launch', now() - interval '1 day');
  v_res := test.call_as(v_user);
  perform test.assert(
    v_res->>'entitlementKind' <> 'founder',
    'Caso 23: un founder-launch con expires_at scaduto non deve risultare founder attivo, trovato ' || (v_res->>'entitlementKind')
  );
  raise notice 'Caso 23 OK: expires_at rispettato anche sul ramo founder';
end $$;

-- ============================================================================
-- Caso 24: utente pre-cutoff gia' pro per altra via (beta-tester permanente)
-- -> founderWindowClosed deve essere true: grant_founder_launch_core lo
-- short-circuita su role='pro' nudo, non ricevera' MAI un nuovo grant
-- Founder, quindi il client non deve continuare a richiamare la RPC.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('pre-cutoff-already-pro@test.local', '2026-07-01T00:00:00Z'::timestamptz);
  v_res jsonb;
begin
  insert into public.user_roles (user_id, role, note) values (v_user, 'pro', 'beta-tester-closed-beta');
  v_res := test.call_as(v_user);
  perform test.assert(
    v_res->>'founderWindowClosed' = 'true',
    'Caso 24: un utente pre-cutoff gia'' pro deve avere founderWindowClosed=true (mai un nuovo grant possibile)'
  );
  perform test.assert(
    v_res->>'founderEligibility' = 'already_has_pro',
    'Caso 24: founderEligibility atteso already_has_pro, trovato ' || (v_res->>'founderEligibility')
  );
  raise notice 'Caso 24 OK: nessun polling inutile per utenti gia'' pro pre-cutoff';
end $$;

-- ============================================================================
-- Caso 25: utente pre-cutoff SENZA alcun ruolo pro -> founderWindowClosed
-- false (e' l'unico caso in cui un nuovo grant Founder e' ancora possibile).
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('pre-cutoff-no-pro@test.local', '2026-07-01T00:00:00Z'::timestamptz);
  v_res jsonb;
begin
  v_res := test.call_as(v_user);
  perform test.assert(
    v_res->>'founderWindowClosed' = 'false',
    'Caso 25: utente pre-cutoff senza pro deve avere founderWindowClosed=false'
  );
  perform test.assert(v_res->>'founderEligibility' = 'pending_first_sync', 'Caso 25: founderEligibility atteso pending_first_sync');
  raise notice 'Caso 25 OK';
end $$;

reset role;
select '✅ TUTTI I 25 CASI ENTITLEMENT_P010E SUPERATI' as risultato;
