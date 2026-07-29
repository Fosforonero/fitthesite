-- Sprint P0.10E-E — test funzionali della migration REALE
-- (20260729161341_founder_reserve_cutoff_gate.sql, rinominata da
-- 20260729120000 in Sprint P0.10F dopo l'apply reale) su supabase/postgres
-- reale. Ogni caso chiama SEMPRE public.claim_founder_grant_if_eligible()
-- (il nome pubblico ORIGINALE, zero argomenti) tramite test.call_gate_as():
-- e' esattamente cio' che il client gia' pubblicato chiama, quindi ogni
-- singolo caso valida anche la compatibilita' col client come effetto
-- collaterale, non solo il caso 1. Casi 16-22: no-clobber sottoscrizioni
-- commerciali nel wrapper (BLOCCO 3). Casi 24-32: barriera atomica REALE
-- dentro _apply_founder_grant (FASE 4) e ri-verifica post-delega (FASE 5).
-- Casi 37-39 (P0.10E-E): allowlist reale/null-check ripristinati e
-- selettivita' del GET STACKED DIAGNOSTICS/CONSTRAINT_NAME — 33-36 sono
-- riservati ai test di concorrenza reale in run-suite.sh (bash).
\set ON_ERROR_STOP on
set role postgres;

-- coalesce(..., false): un condizione NULL (es. confrontando un valore
-- assente) deve fallire l'assert, mai passarlo silenziosamente — trovato in
-- review avversariale che `if not p_cond` con p_cond NULL salta il ramo
-- 'not NULL is NULL', quindi un assert su una condizione NULL passerebbe a
-- vuoto invece di segnalare il problema.
create or replace function test.assert(p_cond boolean, p_msg text)
returns void language plpgsql as $$
begin
  if not coalesce(p_cond, false) then
    raise exception 'ASSERT FALLITO: %', p_msg;
  end if;
end;
$$;

-- ============================================================================
-- Caso 1: account PRE-cutoff, DENTRO la propria finestra di 14 giorni,
-- allowlisted -> il wrapper delega fedelmente, eligible:true come lo stub
-- legacy. Prova ANCHE (per costruzione: test.call_gate_as chiama sempre il
-- nome pubblico originale) che il client pubblicato continua a funzionare
-- senza alcuna release, e che la delega interna SECURITY DEFINER funziona
-- nonostante l'ACL sulla funzione ora privata sia stata revocata da
-- authenticated.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('allowlisted@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  -- P0.10E-E: _apply_founder_grant ora ha una propria allowlist REALE
  -- basata su founder_grants (non solo il prefisso 'allowlisted' dello
  -- stub legacy) — senza questa riga la delega raggiungerebbe comunque
  -- _apply_founder_grant, che pero' ritornerebbe false (email non
  -- presente nel ledger), rompendo l'aspettativa granted di questo caso.
  insert into public.founder_grants (email, founder_number) values ('allowlisted@test.local', 9010);
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'eligible' = 'true', 'Caso 1: atteso eligible=true, trovato ' || (v_res->>'eligible'));
  perform test.assert(v_res->>'reason' = 'granted', 'Caso 1: atteso reason=granted, trovato ' || (v_res->>'reason'));
  raise notice 'Caso 1 OK: pre-cutoff, dentro finestra, allowlisted -> granted (nome pubblico originale, delega fedele)';
end $$;

-- ============================================================================
-- Caso 2: account PRE-cutoff, DENTRO la finestra, NON allowlisted -> delega
-- fedele, eligible:false/not_in_allowlist (prova che il wrapper non
-- trasforma un rifiuto legittimo in un successo, ne' viceversa).
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('random-user@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'eligible' = 'false', 'Caso 2: atteso eligible=false');
  perform test.assert(v_res->>'reason' = 'not_in_allowlist', 'Caso 2: atteso reason=not_in_allowlist, trovato ' || (v_res->>'reason'));
  raise notice 'Caso 2 OK: pre-cutoff, dentro finestra, non-allowlisted -> not_in_allowlist (delega fedele)';
end $$;

-- ============================================================================
-- Caso 3 (IL CASO CHE CONTA): account POST-cutoff, ALLOWLISTED nello stub
-- legacy -> il wrapper deve rifiutare comunque con 'program_closed', E la
-- funzione legacy (ora in private) non deve MAI essere raggiunta (probe
-- piatto).
-- ============================================================================
do $$
declare
  v_hits_before int;
  v_hits_after int;
  v_user uuid := test.mkuser('allowlisted-postcutoff@test.local', '2026-08-01T00:00:00Z'::timestamptz);
  v_res jsonb;
begin
  select hits into v_hits_before from test.probe_hits where n = 1;
  v_res := test.call_gate_as(v_user);
  select hits into v_hits_after from test.probe_hits where n = 1;

  perform test.assert(v_res->>'eligible' = 'false', 'Caso 3: un account post-cutoff NON deve mai risultare eligible, anche se allowlisted, trovato ' || (v_res->>'eligible'));
  perform test.assert(v_res->>'reason' = 'program_closed', 'Caso 3: atteso reason=program_closed, trovato ' || (v_res->>'reason'));
  perform test.assert(v_hits_after = v_hits_before, 'Caso 3: la funzione legacy NON deve essere invocata per un account post-cutoff (probe deve restare piatto)');
  raise notice 'Caso 3 OK: account post-cutoff allowlisted -> program_closed, legacy MAI raggiunta (probe invariato a %)', v_hits_after;
end $$;

-- ============================================================================
-- Caso 4: account creato ESATTAMENTE al cutoff -> post-cutoff (>=, mai <).
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('exact-cutoff@test.local', '2026-07-31T22:00:00Z'::timestamptz);
  v_res jsonb;
begin
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'reason' = 'program_closed', 'Caso 4: creato esattamente al cutoff deve essere program_closed (>=)');
  raise notice 'Caso 4 OK';
end $$;

-- ============================================================================
-- Caso 5: account creato 1ms PRIMA del cutoff -> ancora pre-cutoff, delega
-- (isola l'operatore stretto >= del cutoff dalla finestra: un created_at
-- cosi' vicino al cutoff e' nel futuro rispetto a "adesso", quindi la
-- finestra di 14gg non puo' essere scaduta per costruzione).
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('almost-cutoff@test.local', '2026-07-31T22:00:00Z'::timestamptz - interval '1 millisecond');
  v_res jsonb;
begin
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'reason' = 'not_in_allowlist', 'Caso 5: 1ms prima del cutoff deve ancora delegare al legacy (non allowlisted -> not_in_allowlist)');
  raise notice 'Caso 5 OK';
end $$;

-- ============================================================================
-- Caso 6: account PRE-cutoff ma con la finestra individuale di 14 giorni
-- GIA' SCADUTA (registrato 20 giorni fa) -> window_expired, E la funzione
-- legacy non deve MAI essere raggiunta, ANCHE SE l'email e' allowlisted
-- nello stub (stessa prova del Caso 3, ma per la finestra invece del
-- cutoff globale).
-- ============================================================================
do $$
declare
  v_hits_before int;
  v_hits_after int;
  v_user uuid := test.mkuser('allowlisted-window-expired@test.local', now() - interval '20 days');
  v_res jsonb;
begin
  select hits into v_hits_before from test.probe_hits where n = 1;
  v_res := test.call_gate_as(v_user);
  select hits into v_hits_after from test.probe_hits where n = 1;

  perform test.assert(v_res->>'eligible' = 'false', 'Caso 6: finestra scaduta deve sempre risultare non eligible, anche se allowlisted');
  perform test.assert(v_res->>'reason' = 'window_expired', 'Caso 6: atteso reason=window_expired, trovato ' || (v_res->>'reason'));
  perform test.assert(v_hits_after = v_hits_before, 'Caso 6: la funzione legacy NON deve essere invocata per una finestra scaduta (probe deve restare piatto)');
  raise notice 'Caso 6 OK: finestra scaduta (20gg) allowlisted -> window_expired, legacy MAI raggiunta';
end $$;

-- ============================================================================
-- Caso 7: finestra individuale al limite "appena dentro" (13 giorni, 23 ore,
-- 59 minuti e 55 secondi fa) -> NON scaduta, delega.
--
-- Margine di 5 secondi: NON per evitare un race reale — verificato in
-- review avversariale che `now()` e' congelato per l'intera transazione, e
-- un blocco `do $$ ... end $$` e' un'unica istruzione/transazione, quindi
-- `test.mkuser` (default now()) e il confronto interno del wrapper
-- risolvono lo stesso identico istante: un boundary esatto sarebbe qui
-- deterministico, non race-prone, a differenza di una vera chiamata in
-- produzione (dove created_at e' scritto in una transazione separata,
-- passata, e il confronto avviene in una transazione futura indipendente —
-- li' si', un vero drift di orologio e' possibile). Il margine resta solo
-- per leggibilita' (rende esplicito da quale lato del boundary ci si trova
-- senza calcolare l'istante esatto a mente); l'operatore stretto `>` e'
-- comunque esercitato correttamente su entrambi i lati.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('window-boundary-inside@test.local', now() - interval '14 days' + interval '5 seconds');
  v_res jsonb;
begin
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'reason' = 'not_in_allowlist', 'Caso 7: appena dentro la finestra deve ancora delegare al legacy, trovato ' || (v_res->>'reason'));
  raise notice 'Caso 7 OK: finestra appena dentro (14gg - 5s) -> delega';
end $$;

-- ============================================================================
-- Caso 8: finestra individuale appena scaduta (14 giorni e 5 secondi fa) ->
-- window_expired. Stesso margine (leggibilita', non anti-race) del Caso 7.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('window-boundary-outside@test.local', now() - interval '14 days' - interval '5 seconds');
  v_res jsonb;
begin
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'reason' = 'window_expired', 'Caso 8: appena fuori dalla finestra deve essere window_expired, trovato ' || (v_res->>'reason'));
  raise notice 'Caso 8 OK: finestra appena scaduta (14gg + 5s) -> window_expired';
end $$;

-- ============================================================================
-- Caso 9: nessun JWT -> eccezione esplicita, non un default silenzioso.
-- ============================================================================
do $$
declare
  v_raised boolean := false;
begin
  perform set_config('request.jwt.claim.sub', '', true);
  reset role;
  begin
    perform public.claim_founder_grant_if_eligible();
  exception when others then
    v_raised := true;
  end;
  perform test.assert(v_raised, 'Caso 9: senza auth.uid() il wrapper deve sollevare eccezione');
  raise notice 'Caso 9 OK';
end $$;

-- ============================================================================
-- Caso 10: ACL applicativa — authenticated puo' chiamare SOLO il wrapper
-- pubblico (nome originale); NON puo' piu' chiamare ne' la funzione legacy
-- (ora in private), ne' _apply_founder_grant, ne' handle_new_founder. anon
-- non puo' chiamare nessuna delle funzioni coinvolte.
-- ============================================================================
do $$
declare
  v_auth_wrapper boolean;
  v_auth_legacy boolean;
  v_auth_apply boolean;
  v_auth_handle_new boolean;
  v_anon_wrapper boolean;
  v_anon_legacy boolean;
begin
  select has_function_privilege('authenticated', 'public.claim_founder_grant_if_eligible()', 'execute') into v_auth_wrapper;
  select has_function_privilege('authenticated', 'private.claim_founder_grant_if_eligible()', 'execute') into v_auth_legacy;
  select has_function_privilege('authenticated', 'public._apply_founder_grant(uuid, text)', 'execute') into v_auth_apply;
  select has_function_privilege('authenticated', 'public.handle_new_founder()', 'execute') into v_auth_handle_new;
  select has_function_privilege('anon', 'public.claim_founder_grant_if_eligible()', 'execute') into v_anon_wrapper;
  select has_function_privilege('anon', 'private.claim_founder_grant_if_eligible()', 'execute') into v_anon_legacy;

  perform test.assert(v_auth_wrapper, 'Caso 10: authenticated deve poter chiamare il wrapper pubblico (nome originale)');
  perform test.assert(not v_auth_legacy, 'Caso 10: authenticated NON deve poter chiamare la funzione legacy ora privata');
  perform test.assert(not v_auth_apply, 'Caso 10: authenticated NON deve poter chiamare _apply_founder_grant');
  perform test.assert(not v_auth_handle_new, 'Caso 10: authenticated NON deve poter chiamare handle_new_founder');
  perform test.assert(not v_anon_wrapper, 'Caso 10: anon non deve poter chiamare il wrapper');
  perform test.assert(not v_anon_legacy, 'Caso 10: anon non deve poter chiamare la funzione legacy privata');
  raise notice 'Caso 10 OK: ACL applicativa corretta, il wrapper (nome originale) resta l''unico percorso esterno';
end $$;

-- ============================================================================
-- Caso 11: nessun grant residuo a PUBLIC (pseudo-ruolo, distinto da
-- 'anon'/'authenticated') su nessuna delle quattro funzioni coinvolte — un
-- grant a PUBLIC compare in pg_proc.proacl come voce "=X/owner" senza nome
-- di ruolo davanti al segno '='.
-- ============================================================================
do $$
declare
  v_acl_wrapper text;
  v_acl_legacy text;
  v_acl_apply text;
  v_acl_handle_new text;
begin
  select array_to_string(proacl, ',') into v_acl_wrapper from pg_proc where oid = 'public.claim_founder_grant_if_eligible()'::regprocedure;
  select array_to_string(proacl, ',') into v_acl_legacy from pg_proc where oid = 'private.claim_founder_grant_if_eligible()'::regprocedure;
  select array_to_string(proacl, ',') into v_acl_apply from pg_proc where oid = 'public._apply_founder_grant(uuid, text)'::regprocedure;
  select array_to_string(proacl, ',') into v_acl_handle_new from pg_proc where oid = 'public.handle_new_founder()'::regprocedure;

  perform test.assert(v_acl_wrapper !~ '(^|,)=', 'Caso 11: il wrapper pubblico non deve avere alcun grant residuo a PUBLIC, trovato ' || v_acl_wrapper);
  perform test.assert(v_acl_legacy !~ '(^|,)=', 'Caso 11: la funzione legacy privata non deve avere alcun grant residuo a PUBLIC, trovato ' || v_acl_legacy);
  perform test.assert(v_acl_apply !~ '(^|,)=', 'Caso 11: _apply_founder_grant non deve avere alcun grant residuo a PUBLIC, trovato ' || v_acl_apply);
  perform test.assert(v_acl_handle_new !~ '(^|,)=', 'Caso 11: handle_new_founder non deve avere alcun grant residuo a PUBLIC, trovato ' || v_acl_handle_new);
  raise notice 'Caso 11 OK: nessun grant residuo a PUBLIC su nessuna delle quattro funzioni';
end $$;

-- ============================================================================
-- Caso 12: forma della risposta JSON — esattamente le chiavi {eligible,
-- reason}, mai chiavi extra, sia per l'esito deciso dal wrapper stesso
-- (program_closed/window_expired) sia per l'esito delegato dallo stub
-- legacy (granted/not_in_allowlist) — il client si aspetta lo stesso
-- contratto in entrambi i casi.
-- ============================================================================
do $$
declare
  v_keys_closed text[];
  v_keys_delegated text[];
  v_user_closed uuid := test.mkuser('shape-closed@test.local', '2026-08-15T00:00:00Z'::timestamptz);
  v_user_delegated uuid := test.mkuser('shape-delegated@test.local', now() - interval '3 days');
begin
  select array_agg(k order by k) into v_keys_closed from jsonb_object_keys(test.call_gate_as(v_user_closed)) k;
  select array_agg(k order by k) into v_keys_delegated from jsonb_object_keys(test.call_gate_as(v_user_delegated)) k;

  perform test.assert(v_keys_closed = array['eligible', 'reason'], 'Caso 12: risposta program_closed deve avere esattamente {eligible,reason}, trovato ' || array_to_string(v_keys_closed, ','));
  perform test.assert(v_keys_delegated = array['eligible', 'reason'], 'Caso 12: risposta delegata deve avere esattamente {eligible,reason}, trovato ' || array_to_string(v_keys_delegated, ','));
  raise notice 'Caso 12 OK: contratto JSON {eligible,reason} identico sia per esiti decisi dal wrapper sia per esiti delegati';
end $$;

-- ============================================================================
-- Caso 13: doppia chiamata consecutiva per lo stesso account eligible non
-- deve mai fallire/crashare. LIMITE DICHIARATO: lo stub non persiste alcuno
-- stato "gia' concesso" (non e' il corpo reale, sconosciuto) — questo caso
-- prova solo che il WRAPPER e' stateless e ripetibile senza errori, MAI che
-- la logica legacy reale sia idempotente (quella resta una proprieta' della
-- funzione originale, invariata da questa migration, e non verificabile
-- senza il suo corpo reale).
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('allowlisted-double-call@test.local', now() - interval '2 days');
  v_res1 jsonb;
  v_res2 jsonb;
begin
  insert into public.founder_grants (email, founder_number) values ('allowlisted-double-call@test.local', 9011);
  v_res1 := test.call_gate_as(v_user);
  v_res2 := test.call_gate_as(v_user);
  perform test.assert(v_res1 = v_res2, 'Caso 13: due chiamate consecutive per lo stesso account devono restituire la stessa risposta dal wrapper');
  perform test.assert(v_res1->>'eligible' = 'true', 'Caso 13: con una riga founder_grants reale la doppia chiamata deve risultare eligible=true (non solo stabile)');
  raise notice 'Caso 13 OK: doppia chiamata, nessun errore, risposta stabile ed eligible=true (allowlist reale via founder_grants, P0.10E-E)';
end $$;

-- ============================================================================
-- Sprint P0.10E-C — no-clobber sottoscrizioni commerciali (BLOCCO 3).
-- Casi 16/17/18: Google Play / Apple IAP / Stripe attivi -> mai delegare,
-- founder_grants/b2c_subscriptions mai toccate (probe piatto), riserva mai
-- consumata, reason esatta 'existing_commercial_entitlement'. Tutti e tre
-- gli account sono ANCHE allowlisted nello stub (email che inizia con
-- 'allowlisted') e ben dentro cutoff+finestra: se il no-clobber non
-- funzionasse, otterrebbero 'granted' invece del blocco, non un rifiuto
-- generico — la prova e' quindi stringente, non vacua.
-- ============================================================================
do $$
declare
  v_hits_before int;
  v_hits_after int;
  v_user uuid := test.mkuser('allowlisted-google@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  perform test.mkcommercial(v_user, 'google_play', 'active');
  select hits into v_hits_before from test.probe_hits where n = 1;
  v_res := test.call_gate_as(v_user);
  select hits into v_hits_after from test.probe_hits where n = 1;

  perform test.assert(v_res->>'eligible' = 'false', 'Caso 16: Google Play attivo deve sempre risultare non eligible');
  perform test.assert(v_res->>'reason' = 'existing_commercial_entitlement', 'Caso 16: atteso reason=existing_commercial_entitlement, trovato ' || (v_res->>'reason'));
  perform test.assert(v_hits_after = v_hits_before, 'Caso 16: la funzione legacy NON deve essere invocata quando esiste una sottoscrizione Google Play');
  -- founder_grants/_apply_founder_grant sono raggiungibili SOLO dall'interno
  -- della funzione legacy (probe sopra) — il probe piatto e' gia' la prova
  -- che nessuna delle due e' stata toccata, non serve un controllo separato.
  raise notice 'Caso 16 OK: Google Play attivo -> existing_commercial_entitlement, legacy MAI raggiunta (probe invariato a %)', v_hits_after;
end $$;

do $$
declare
  v_hits_before int;
  v_hits_after int;
  v_user uuid := test.mkuser('allowlisted-apple@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  perform test.mkcommercial(v_user, 'apple_iap', 'active');
  select hits into v_hits_before from test.probe_hits where n = 1;
  v_res := test.call_gate_as(v_user);
  select hits into v_hits_after from test.probe_hits where n = 1;

  perform test.assert(v_res->>'eligible' = 'false', 'Caso 17: Apple IAP attivo deve sempre risultare non eligible');
  perform test.assert(v_res->>'reason' = 'existing_commercial_entitlement', 'Caso 17: atteso reason=existing_commercial_entitlement, trovato ' || (v_res->>'reason'));
  perform test.assert(v_hits_after = v_hits_before, 'Caso 17: la funzione legacy NON deve essere invocata quando esiste una sottoscrizione Apple IAP');
  raise notice 'Caso 17 OK: Apple IAP attivo -> existing_commercial_entitlement, legacy MAI raggiunta (probe invariato a %)', v_hits_after;
end $$;

do $$
declare
  v_hits_before int;
  v_hits_after int;
  v_user uuid := test.mkuser('allowlisted-stripe@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  perform test.mkcommercial(v_user, 'stripe', 'active');
  select hits into v_hits_before from test.probe_hits where n = 1;
  v_res := test.call_gate_as(v_user);
  select hits into v_hits_after from test.probe_hits where n = 1;

  perform test.assert(v_res->>'eligible' = 'false', 'Caso 18: Stripe attivo deve sempre risultare non eligible');
  perform test.assert(v_res->>'reason' = 'existing_commercial_entitlement', 'Caso 18: atteso reason=existing_commercial_entitlement, trovato ' || (v_res->>'reason'));
  perform test.assert(v_hits_after = v_hits_before, 'Caso 18: la funzione legacy NON deve essere invocata quando esiste una sottoscrizione Stripe');
  raise notice 'Caso 18 OK: Stripe attivo -> existing_commercial_entitlement, legacy MAI raggiunta (probe invariato a %)', v_hits_after;
end $$;

-- ============================================================================
-- Caso 19: sottoscrizione commerciale SCADUTA (state='expired') -> blocca
-- comunque, indipendentemente da `state` (decisione esplicita di Matteo: il
-- blocco e' su billing_source, mai su state).
-- ============================================================================
do $$
declare
  v_hits_before int;
  v_hits_after int;
  v_user uuid := test.mkuser('allowlisted-expired-commercial@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  perform test.mkcommercial(v_user, 'apple_iap', 'expired');
  select hits into v_hits_before from test.probe_hits where n = 1;
  v_res := test.call_gate_as(v_user);
  select hits into v_hits_after from test.probe_hits where n = 1;

  perform test.assert(v_res->>'eligible' = 'false', 'Caso 19: una sottoscrizione commerciale SCADUTA deve comunque bloccare');
  perform test.assert(v_res->>'reason' = 'existing_commercial_entitlement', 'Caso 19: atteso reason=existing_commercial_entitlement anche da scaduta, trovato ' || (v_res->>'reason'));
  perform test.assert(v_hits_after = v_hits_before, 'Caso 19: la funzione legacy NON deve essere invocata anche per una sottoscrizione commerciale scaduta');
  raise notice 'Caso 19 OK: commerciale scaduto -> existing_commercial_entitlement comunque, legacy MAI raggiunta';
end $$;

-- ============================================================================
-- Caso 20: billing_source='trial' -> NON blocca, Founder puo' sostituirla
-- (entitlement superiore). Delega normalmente, allowlisted -> granted.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('allowlisted-trial@test.local', now() - interval '5 days');
  v_res jsonb;
  v_row public.b2c_subscriptions%rowtype;
begin
  insert into public.founder_grants (email, founder_number) values ('allowlisted-trial@test.local', 9012);
  perform test.mkcommercial(v_user, 'trial', 'active');
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'eligible' = 'true', 'Caso 20: trial non deve bloccare il claim Founder, atteso eligible=true, trovato ' || (v_res->>'eligible'));
  perform test.assert(v_res->>'reason' = 'granted', 'Caso 20: atteso reason=granted (delega avvenuta), trovato ' || (v_res->>'reason'));

  select * into v_row from public.b2c_subscriptions where user_id = v_user;
  perform test.assert(v_row.billing_source = 'founder_grant', 'Caso 20: trial deve essere sostituito da founder_grant (convenzione live)');
  perform test.assert(v_row.external_product_id = 'lifetime_founder', 'Caso 20: external_product_id deve essere lifetime_founder anche nel ramo di promozione da trial');
  perform test.assert(v_row.external_subscription_id = 'founder_grant_9012', 'Caso 20: external_subscription_id deve usare il founder_number reale anche nel ramo di promozione da trial');
  perform test.assert(v_row.active_until = '2099-12-31 23:59:59+00'::timestamptz, 'Caso 20: active_until deve diventare 2099-12-31 23:59:59+00 (non restare la scadenza breve del trial)');
  raise notice 'Caso 20 OK: trial non blocca, Founder delega e sostituisce con la convenzione live esatta';
end $$;

-- ============================================================================
-- Caso 21: billing_source='founder_grant' -> NON blocca (gia' Founder,
-- idempotenza demandata al corpo legacy invariato). LIMITE DICHIARATO:
-- come il Caso 13, lo stub non simula una vera logica di idempotenza —
-- questo caso prova solo che il wrapper non intercetta 'founder_grant'
-- come se fosse commerciale.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('allowlisted-already-founder@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  insert into public.founder_grants (email, founder_number) values ('allowlisted-already-founder@test.local', 9013);
  perform test.mkcommercial(v_user, 'founder_grant', 'active');
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'reason' != 'existing_commercial_entitlement', 'Caso 21: founder_grant non deve mai essere trattato come sottoscrizione commerciale');
  perform test.assert(v_res->>'reason' = 'granted', 'Caso 21: atteso reason=granted (delega avvenuta), trovato ' || (v_res->>'reason'));
  raise notice 'Caso 21 OK: founder_grant non blocca, wrapper delega (limite: stub non prova idempotenza reale, vedi Caso 13)';
end $$;

-- ============================================================================
-- Caso 22: nessuna riga in b2c_subscriptions -> flusso legacy normale
-- (v_billing_source NULL, l'IN valuta NULL/falso, si procede a delegare).
-- Ridondante in senso stretto coi Casi 1/2 (nessuno di quei due utenti ha
-- mai avuto una riga b2c_subscriptions), ma reso esplicito perche' fa
-- parte della lista di verifica richiesta per il no-clobber.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('allowlisted-no-subscription-row@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  insert into public.founder_grants (email, founder_number) values ('allowlisted-no-subscription-row@test.local', 9014);
  perform test.assert(not exists (select 1 from public.b2c_subscriptions where user_id = v_user), 'Caso 22: precondizione, nessuna riga b2c_subscriptions per questo utente');
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'eligible' = 'true', 'Caso 22: nessuna riga b2c_subscriptions deve risultare in flusso legacy normale, atteso eligible=true');
  perform test.assert(v_res->>'reason' = 'granted', 'Caso 22: atteso reason=granted, trovato ' || (v_res->>'reason'));
  raise notice 'Caso 22 OK: nessuna riga b2c_subscriptions -> flusso legacy normale';
end $$;

-- ============================================================================
-- Sprint P0.10E-D — FASE 4: barriera atomica REALE dentro
-- _apply_founder_grant (non piu' uno stub passthrough). Casi 24-29
-- chiamano _apply_founder_grant DIRETTAMENTE (bypassando il wrapper) per
-- isolare la sola logica della barriera.
-- ============================================================================

-- Caso 24 (P0.10E-E): nessuna riga b2c_subscriptions -> insert normale,
-- ROW_COUNT>0, founder_grants marcata, ritorna true. Verifica ANCHE la
-- struttura esatta byte-per-byte contro la convenzione live delle 18 righe
-- founder_grant reali (lifetime_founder / founder_grant_<n> / 2099-12-31
-- 23:59:59+00 / raw_payload completo con source=rpc_claim) — copre in un
-- solo caso i requisiti "struttura esatta", "raw_payload completo" e
-- "founder_number usato in external_subscription_id".
do $$
declare
  v_user uuid := test.mkuser('direct-apply-insert@test.local', now() - interval '5 days');
  v_result boolean;
  v_row public.b2c_subscriptions%rowtype;
begin
  insert into public.founder_grants (email, founder_number) values ('direct-apply-insert@test.local', 9001);
  v_result := public._apply_founder_grant(v_user, 'direct-apply-insert@test.local');
  perform test.assert(v_result = true, 'Caso 24: insert normale deve ritornare true');

  select * into v_row from public.b2c_subscriptions where user_id = v_user;
  perform test.assert(v_row.billing_source = 'founder_grant', 'Caso 24: billing_source deve essere founder_grant dopo l''insert');
  perform test.assert(v_row.external_product_id = 'lifetime_founder', 'Caso 24: external_product_id deve essere lifetime_founder (convenzione live, NON fitmesh_founder_grant), trovato ' || v_row.external_product_id);
  perform test.assert(v_row.external_subscription_id = 'founder_grant_9001', 'Caso 24: external_subscription_id deve essere founder_grant_<founder_number> (convenzione live, NON founder-<user_id>), trovato ' || v_row.external_subscription_id);
  perform test.assert(v_row.active_until = '2099-12-31 23:59:59+00'::timestamptz, 'Caso 24: active_until deve essere 2099-12-31 23:59:59+00 (convenzione live, NON 9999-12-31), trovato ' || v_row.active_until::text);
  perform test.assert(v_row.auto_renewing = false, 'Caso 24: auto_renewing deve essere false');
  perform test.assert(v_row.state = 'active', 'Caso 24: state deve essere active');
  perform test.assert(v_row.raw_payload is not null, 'Caso 24: raw_payload non deve essere null (assente del tutto nella riscrittura P0.10E-D)');
  perform test.assert(v_row.raw_payload->>'source' = 'rpc_claim', 'Caso 24: raw_payload.source deve essere rpc_claim, trovato ' || (v_row.raw_payload->>'source'));
  perform test.assert((v_row.raw_payload->>'founder_number')::int = 9001, 'Caso 24: raw_payload.founder_number deve combaciare con founder_grants.founder_number');
  perform test.assert(v_row.raw_payload->>'grant_email' = 'direct-apply-insert@test.local', 'Caso 24: raw_payload.grant_email deve combaciare con founder_grants.email');
  perform test.assert(v_row.raw_payload ? 'granted_at', 'Caso 24: raw_payload deve contenere granted_at');

  perform test.assert((select applied_user_id from public.founder_grants where email = 'direct-apply-insert@test.local') = v_user, 'Caso 24: founder_grants.applied_user_id deve essere marcato');
  perform test.assert((select applied_at from public.founder_grants where email = 'direct-apply-insert@test.local') is not null, 'Caso 24: founder_grants.applied_at deve essere marcato');
  raise notice 'Caso 24 OK: struttura byte-per-byte identica alla convenzione live (lifetime_founder/founder_grant_<n>/2099-12-31/raw_payload completo con source=rpc_claim)';
end $$;

-- Caso 25 (P0.10E-E): riga esistente billing_source='trial' -> update
-- permesso (whitelist), ROW_COUNT>0, founder_grants marcata, ritorna true.
-- Verifica anche che il fallback UPDATE scriva la STESSA convenzione live
-- dell'INSERT (non solo billing_source/state come una bozza precedente).
do $$
declare
  v_user uuid := test.mkuser('direct-apply-trial@test.local', now() - interval '5 days');
  v_result boolean;
  v_row public.b2c_subscriptions%rowtype;
begin
  insert into public.founder_grants (email, founder_number) values ('direct-apply-trial@test.local', 9002);
  perform test.mkcommercial(v_user, 'trial', 'active');
  v_result := public._apply_founder_grant(v_user, 'direct-apply-trial@test.local');
  perform test.assert(v_result = true, 'Caso 25: sostituzione di un trial deve ritornare true');

  select * into v_row from public.b2c_subscriptions where user_id = v_user;
  perform test.assert(v_row.billing_source = 'founder_grant', 'Caso 25: trial deve essere sostituito da founder_grant');
  perform test.assert(v_row.external_product_id = 'lifetime_founder', 'Caso 25: external_product_id deve essere aggiornato a lifetime_founder anche nel ramo UPDATE, trovato ' || v_row.external_product_id);
  perform test.assert(v_row.external_subscription_id = 'founder_grant_9002', 'Caso 25: external_subscription_id deve essere aggiornato al founder_number reale anche nel ramo UPDATE, trovato ' || v_row.external_subscription_id);
  perform test.assert(v_row.active_until = '2099-12-31 23:59:59+00'::timestamptz, 'Caso 25: active_until deve diventare 2099-12-31 23:59:59+00 (non restare la scadenza breve del trial)');
  perform test.assert(v_row.raw_payload->>'source' = 'rpc_claim', 'Caso 25: raw_payload deve essere scritto anche nel ramo UPDATE');
  perform test.assert((select applied_user_id from public.founder_grants where email = 'direct-apply-trial@test.local') = v_user, 'Caso 25: founder_grants deve essere marcata');
  raise notice 'Caso 25 OK: trial -> sostituito da founder_grant con la convenzione live esatta anche nel ramo UPDATE, true';
end $$;

-- Caso 26 (P0.10E-E): riga esistente billing_source='founder_grant' ->
-- update permesso (idempotente), ROW_COUNT>0, ritorna true. Verifica anche
-- che updated_at avanzi fra le due chiamate (proprieta' live esplicitamente
-- richiesta: "aggiorna updated_at nel ramo di conflitto").
--
-- Le due chiamate sono DELIBERATAMENTE in due blocchi `do $$ $$` separati
-- (due transazioni distinte), non nello stesso blocco: `now()` resta
-- congelato per l'intera durata di UNA transazione (stesso principio gia'
-- documentato ai Casi 7/8) — due chiamate nella STESSA transazione
-- scriverebbero lo stesso identico updated_at per costruzione, rendendo
-- l'assert sotto un falso negativo, non una prova reale di avanzamento.
create temporary table if not exists test_caso26_scratch (updated_at_1 timestamptz);

do $$
declare
  v_user uuid := test.mkuser('direct-apply-idempotent@test.local', now() - interval '5 days');
  v_result1 boolean;
begin
  insert into public.founder_grants (email, founder_number) values ('direct-apply-idempotent@test.local', 9003);
  v_result1 := public._apply_founder_grant(v_user, 'direct-apply-idempotent@test.local');
  perform test.assert(v_result1 = true, 'Caso 26a: prima chiamata deve ritornare true');
  insert into test_caso26_scratch (updated_at_1) select updated_at from public.b2c_subscriptions where user_id = v_user;
  perform set_config('test.caso26_user', v_user::text, false);
end $$;

-- Attesa reale (nuova transazione autocommit sotto, non lo stesso blocco):
-- garantisce che clock_timestamp()/now() della SECONDA transazione sia
-- effettivamente successivo, non solo teoricamente diverso.
select pg_sleep(1);

do $$
declare
  v_user uuid := current_setting('test.caso26_user')::uuid;
  v_result2 boolean;
  v_updated_at_1 timestamptz;
  v_updated_at_2 timestamptz;
begin
  select updated_at_1 into v_updated_at_1 from test_caso26_scratch limit 1;
  v_result2 := public._apply_founder_grant(v_user, 'direct-apply-idempotent@test.local');
  select updated_at into v_updated_at_2 from public.b2c_subscriptions where user_id = v_user;

  perform test.assert(v_result2 = true, 'Caso 26b: seconda chiamata deve ritornare true (idempotenza reale)');
  perform test.assert((select count(*) from public.b2c_subscriptions where user_id = v_user) = 1, 'Caso 26b: nessuna riga duplicata dopo la seconda chiamata');
  perform test.assert(v_updated_at_2 > v_updated_at_1, 'Caso 26b: updated_at deve avanzare nel ramo UPDATE (proprieta'' live esplicita), prima=' || v_updated_at_1 || ' dopo=' || v_updated_at_2);
  perform test.assert((select external_subscription_id from public.b2c_subscriptions where user_id = v_user) = 'founder_grant_9003', 'Caso 26b: external_subscription_id deve restare founder_grant_<n> anche dopo la seconda chiamata');
  raise notice 'Caso 26 OK: founder_grant -> idempotente, nessun duplicato, updated_at avanza correttamente (verificato su due transazioni separate)';
end $$;

-- Casi 27/28/29: riga esistente commerciale (google_play/apple_iap/stripe)
-- -> l'upsert deve modificare ZERO righe, founder_grants NON toccata, la
-- riga b2c_subscriptions resta byte-identica, ritorna false.
do $$
declare
  v_user uuid := test.mkuser('direct-apply-google@test.local', now() - interval '5 days');
  v_result boolean;
  v_row_before record;
  v_row_after record;
begin
  insert into public.founder_grants (email, founder_number) values ('direct-apply-google@test.local', 9004);
  perform test.mkcommercial(v_user, 'google_play', 'active');
  select billing_source, state into v_row_before from public.b2c_subscriptions where user_id = v_user;

  v_result := public._apply_founder_grant(v_user, 'direct-apply-google@test.local');

  select billing_source, state into v_row_after from public.b2c_subscriptions where user_id = v_user;
  perform test.assert(v_result = false, 'Caso 27: Google Play attivo deve rifiutare l''upsert, ritorna false');
  perform test.assert(v_row_after.billing_source = v_row_before.billing_source and v_row_after.state = v_row_before.state, 'Caso 27: la riga b2c_subscriptions deve restare byte-identica');
  perform test.assert((select applied_user_id from public.founder_grants where email = 'direct-apply-google@test.local') is null, 'Caso 27: founder_grants NON deve essere marcata');
  raise notice 'Caso 27 OK: Google Play -> upsert zero righe, byte-identico, founder_grants intatta, false';
end $$;

do $$
declare
  v_user uuid := test.mkuser('direct-apply-apple@test.local', now() - interval '5 days');
  v_result boolean;
  v_row_before record;
  v_row_after record;
begin
  insert into public.founder_grants (email, founder_number) values ('direct-apply-apple@test.local', 9005);
  perform test.mkcommercial(v_user, 'apple_iap', 'expired');
  select billing_source, state into v_row_before from public.b2c_subscriptions where user_id = v_user;

  v_result := public._apply_founder_grant(v_user, 'direct-apply-apple@test.local');

  select billing_source, state into v_row_after from public.b2c_subscriptions where user_id = v_user;
  perform test.assert(v_result = false, 'Caso 28: Apple IAP anche SCADUTO deve rifiutare l''upsert, ritorna false');
  perform test.assert(v_row_after.billing_source = v_row_before.billing_source and v_row_after.state = v_row_before.state, 'Caso 28: la riga b2c_subscriptions (scaduta) deve restare byte-identica');
  perform test.assert((select applied_user_id from public.founder_grants where email = 'direct-apply-apple@test.local') is null, 'Caso 28: founder_grants NON deve essere marcata');
  raise notice 'Caso 28 OK: Apple IAP scaduto -> comunque protetto, upsert zero righe, false';
end $$;

do $$
declare
  v_user uuid := test.mkuser('direct-apply-stripe@test.local', now() - interval '5 days');
  v_result boolean;
  v_row_before record;
  v_row_after record;
begin
  insert into public.founder_grants (email, founder_number) values ('direct-apply-stripe@test.local', 9006);
  perform test.mkcommercial(v_user, 'stripe', 'active');
  select billing_source, state into v_row_before from public.b2c_subscriptions where user_id = v_user;

  v_result := public._apply_founder_grant(v_user, 'direct-apply-stripe@test.local');

  select billing_source, state into v_row_after from public.b2c_subscriptions where user_id = v_user;
  perform test.assert(v_result = false, 'Caso 29: Stripe attivo deve rifiutare l''upsert, ritorna false');
  perform test.assert(v_row_after.billing_source = v_row_before.billing_source and v_row_after.state = v_row_before.state, 'Caso 29: la riga b2c_subscriptions deve restare byte-identica');
  perform test.assert((select applied_user_id from public.founder_grants where email = 'direct-apply-stripe@test.local') is null, 'Caso 29: founder_grants NON deve essere marcata');
  raise notice 'Caso 29 OK: Stripe -> upsert zero righe, byte-identico, founder_grants intatta, false';
end $$;

-- ============================================================================
-- FASE 5 — ri-verifica del wrapper dopo un esito NON eligible dalla
-- delega. Casi 30a/b/c: simulano (single-threaded, deterministico) una
-- riga commerciale che appare fra il precheck del wrapper e la chiamata a
-- _apply_founder_grant (vedi hook nello stub legacy, 00-minimal-schema.sql)
-- — il wrapper deve comunque restituire existing_commercial_entitlement,
-- indipendentemente dal reason placeholder che lo stub legacy assegna
-- internamente a un esito _apply_founder_grant=false.
-- ============================================================================
do $$
declare
  v_hits_before int;
  v_hits_after int;
  v_user uuid := test.mkuser('allowlisted-simulate-race-google@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  -- Riga founder_grants richiesta: senza di essa _apply_founder_grant
  -- ritornerebbe false per "email non allowlisted" invece che per il
  -- conflitto commerciale che questo caso vuole davvero esercitare (P0.10E-E:
  -- l'allowlist ora e' reale, non piu' un placeholder per prefisso).
  insert into public.founder_grants (email, founder_number) values ('allowlisted-simulate-race-google@test.local', 9015);
  select hits into v_hits_before from test.probe_hits where n = 1;
  v_res := test.call_gate_as(v_user);
  select hits into v_hits_after from test.probe_hits where n = 1;

  perform test.assert(v_res->>'reason' = 'existing_commercial_entitlement', 'Caso 30a: il wrapper deve correggere la risposta a existing_commercial_entitlement anche se la legacy(stub) ha risposto con un reason diverso internamente, trovato ' || (v_res->>'reason'));
  perform test.assert(v_hits_after = v_hits_before + 1, 'Caso 30a: la legacy(stub) e'' stata raggiunta esattamente una volta (il precheck del wrapper non vedeva ancora nulla)');
  perform test.assert((select applied_user_id from public.founder_grants where email = 'allowlisted-simulate-race-google@test.local') is null, 'Caso 30a: founder_grants non deve mai essere marcata in questo scenario');
  raise notice 'Caso 30a OK: race simulata (Google Play) -> wrapper corregge a existing_commercial_entitlement';
end $$;

do $$
declare
  v_user uuid := test.mkuser('allowlisted-simulate-race-apple@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  insert into public.founder_grants (email, founder_number) values ('allowlisted-simulate-race-apple@test.local', 9016);
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'reason' = 'existing_commercial_entitlement', 'Caso 30b: atteso existing_commercial_entitlement, trovato ' || (v_res->>'reason'));
  raise notice 'Caso 30b OK: race simulata (Apple IAP) -> wrapper corregge a existing_commercial_entitlement';
end $$;

do $$
declare
  v_user uuid := test.mkuser('allowlisted-simulate-race-stripe@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  insert into public.founder_grants (email, founder_number) values ('allowlisted-simulate-race-stripe@test.local', 9017);
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'reason' = 'existing_commercial_entitlement', 'Caso 30c: atteso existing_commercial_entitlement, trovato ' || (v_res->>'reason'));
  raise notice 'Caso 30c OK: race simulata (Stripe) -> wrapper corregge a existing_commercial_entitlement';
end $$;

-- ============================================================================
-- Caso 31: percorso end-to-end completo senza alcuna race — allowlisted,
-- pre-cutoff, in finestra, nessuna sottoscrizione commerciale mai: il
-- wrapper delega, _apply_founder_grant scrive per davvero, founder_grants
-- viene marcata correttamente, contratto JSON finale {eligible:true,
-- reason:granted}.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('allowlisted-end-to-end@test.local', now() - interval '5 days');
  v_res jsonb;
begin
  insert into public.founder_grants (email, founder_number) values ('allowlisted-end-to-end@test.local', 9007);
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'eligible' = 'true', 'Caso 31: end-to-end senza race deve risultare eligible=true');
  perform test.assert(v_res->>'reason' = 'granted', 'Caso 31: atteso reason=granted');
  perform test.assert((select billing_source from public.b2c_subscriptions where user_id = v_user) = 'founder_grant', 'Caso 31: b2c_subscriptions deve mostrare founder_grant dopo il claim reale');
  perform test.assert((select applied_user_id from public.founder_grants where email = 'allowlisted-end-to-end@test.local') = v_user, 'Caso 31: founder_grants deve essere marcata con lo user_id corretto');
  raise notice 'Caso 31 OK: end-to-end completo, scrittura reale verificata';
end $$;

-- ============================================================================
-- Caso 32: chiamata ripetuta attraverso la catena REALE (non piu' uno stub
-- stateless come il vecchio Caso 13) — due chiamate consecutive per lo
-- stesso utente devono restituire lo stesso esito e non duplicare nulla.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('allowlisted-repeat-real@test.local', now() - interval '5 days');
  v_res1 jsonb;
  v_res2 jsonb;
begin
  insert into public.founder_grants (email, founder_number) values ('allowlisted-repeat-real@test.local', 9008);
  v_res1 := test.call_gate_as(v_user);
  v_res2 := test.call_gate_as(v_user);
  perform test.assert(v_res1 = v_res2, 'Caso 32: due chiamate reali consecutive devono restituire la stessa risposta');
  perform test.assert((select count(*) from public.b2c_subscriptions where user_id = v_user) = 1, 'Caso 32: nessuna riga duplicata dopo la seconda chiamata reale');
  raise notice 'Caso 32 OK: chiamata ripetuta attraverso la catena reale, idempotente, nessun duplicato';
end $$;

-- ============================================================================
-- Sprint P0.10E-E — Casi 37-39: proprieta' ripristinate (allowlist reale,
-- null-check) e la selettivita' del GET STACKED DIAGNOSTICS/CONSTRAINT_NAME.
-- Numerazione: 33-36 sono i test di concorrenza reale in run-suite.sh (bash,
-- non in questo file) — si continua qui da 37 per evitare la collisione dei
-- numeri fra i due file.
-- ============================================================================

-- Caso 37: parametri null -> false esplicito, nessuna scrittura, nessuna
-- eccezione. Il corpo live rifiuta null (P0.10E-D non lo faceva affatto).
do $$
declare
  v_user uuid := test.mkuser('direct-apply-null-email@test.local', now() - interval '5 days');
  v_result boolean;
begin
  insert into public.founder_grants (email, founder_number) values ('direct-apply-null-email@test.local', 9020);

  v_result := public._apply_founder_grant(null, 'direct-apply-null-email@test.local');
  perform test.assert(v_result = false, 'Caso 37a: p_user_id null deve ritornare false, non sollevare eccezione');
  perform test.assert((select applied_user_id from public.founder_grants where email = 'direct-apply-null-email@test.local') is null, 'Caso 37a: founder_grants non deve essere marcata con p_user_id null');

  v_result := public._apply_founder_grant(v_user, null);
  perform test.assert(v_result = false, 'Caso 37b: p_email null deve ritornare false, non sollevare eccezione');
  perform test.assert(not exists (select 1 from public.b2c_subscriptions where user_id = v_user), 'Caso 37b: nessuna riga b2c_subscriptions scritta con p_email null');

  raise notice 'Caso 37 OK: parametri null gestiti con return false esplicito, nessuna eccezione, nessuna scrittura';
end $$;

-- Caso 38: email non presente in founder_grants, chiamata DIRETTA (come
-- farebbe service_role, che ha EXECUTE su questa funzione indipendentemente
-- dal wrapper pubblico) -> false, zero righe b2c_subscriptions, zero righe
-- founder_grants modificate. Questa e' esattamente la protezione che
-- P0.10E-D aveva perso: senza l'allowlist ripristinata, QUALUNQUE
-- (user_id, email) avrebbe ottenuto un entitlement lifetime valido.
do $$
declare
  v_user uuid := test.mkuser('direct-apply-not-allowlisted@test.local', now() - interval '5 days');
  v_result boolean;
begin
  perform test.assert(not exists (select 1 from public.founder_grants where email = 'direct-apply-not-allowlisted@test.local'), 'Caso 38: precondizione, nessuna riga founder_grants per questa email');
  v_result := public._apply_founder_grant(v_user, 'direct-apply-not-allowlisted@test.local');
  perform test.assert(v_result = false, 'Caso 38: email non presente in founder_grants deve ritornare false (allowlist reale, non un placeholder)');
  perform test.assert(not exists (select 1 from public.b2c_subscriptions where user_id = v_user), 'Caso 38: zero righe b2c_subscriptions scritte per email non allowlisted');
  raise notice 'Caso 38 OK: chiamata diretta con email non allowlisted -> false, zero scritture (protezione ripristinata rispetto a P0.10E-D)';
end $$;

-- Caso 39: unique_violation su un vincolo NON riconosciuto (simulato via
-- trigger di test, vedi 00-minimal-schema.sql) deve essere RILANCIATO
-- (propagato al chiamante), mai assorbito nel fallback whitelist. Istruzione
-- esplicita di Matteo: "non catturare indiscriminatamente ogni
-- unique_violation" - solo b2c_subscriptions_pkey e
-- b2c_subscriptions_billing_source_external_subscription_id_key sono
-- trattati come "riga gia' esistente, applica il fallback".
do $$
declare
  v_user uuid := test.mkuser('direct-apply-unexpected-constraint@test.local', now() - interval '5 days');
  v_raised boolean := false;
begin
  insert into public.founder_grants (email, founder_number) values ('direct-apply-unexpected-constraint@test.local', 9021);

  perform set_config('test.force_synthetic_violation', 'true', true);
  begin
    perform public._apply_founder_grant(v_user, 'direct-apply-unexpected-constraint@test.local');
  exception when unique_violation then
    v_raised := true;
  end;
  perform set_config('test.force_synthetic_violation', 'false', true);

  perform test.assert(v_raised, 'Caso 39: un unique_violation su un vincolo NON riconosciuto deve essere rilanciato (RAISE), non assorbito nel fallback whitelist');
  perform test.assert(not exists (select 1 from public.b2c_subscriptions where user_id = v_user), 'Caso 39: nessuna riga scritta dopo un unique_violation non riconosciuto rilanciato');
  perform test.assert((select applied_user_id from public.founder_grants where email = 'direct-apply-unexpected-constraint@test.local') is null, 'Caso 39: founder_grants non deve essere marcata quando la funzione rilancia un errore imprevisto');
  raise notice 'Caso 39 OK: unique_violation su vincolo sconosciuto correttamente rilanciato, non assorbito, nessuna scrittura parziale';
end $$;

reset role;
select '✅ TUTTI I CASI FOUNDER_RESERVE_GATE (P0.10E-E) SUPERATI' as risultato;
