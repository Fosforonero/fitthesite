-- Sprint P0.10E-B — test funzionali della migration REALE
-- (20260729120000_founder_reserve_cutoff_gate.sql) su supabase/postgres
-- reale. Ogni caso chiama SEMPRE public.claim_founder_grant_if_eligible()
-- (il nome pubblico ORIGINALE, zero argomenti) tramite test.call_gate_as():
-- e' esattamente cio' che il client gia' pubblicato chiama, quindi ogni
-- singolo caso valida anche la compatibilita' col client come effetto
-- collaterale, non solo il caso 1.
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
  v_res1 := test.call_gate_as(v_user);
  v_res2 := test.call_gate_as(v_user);
  perform test.assert(v_res1 = v_res2, 'Caso 13: due chiamate consecutive per lo stesso account devono restituire la stessa risposta dal wrapper (stub stateless)');
  raise notice 'Caso 13 OK: doppia chiamata, nessun errore, risposta stabile (limite: stub stateless, non prova idempotenza del corpo reale)';
end $$;

reset role;
select '✅ TUTTI I CASI FOUNDER_RESERVE_GATE (P0.10E-B) SUPERATI' as risultato;
