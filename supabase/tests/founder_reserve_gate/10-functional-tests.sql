-- Sprint P0.10E-A — test funzionali claim_founder_grant_if_eligible_gated()
-- su supabase/postgres reale.
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
-- Caso 1: account PRE-cutoff, allowlisted -> il gate delega fedelmente,
-- eligible:true come lo stub legacy.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('allowlisted@test.local', '2026-07-01T00:00:00Z'::timestamptz);
  v_res jsonb;
begin
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'eligible' = 'true', 'Caso 1: atteso eligible=true, trovato ' || (v_res->>'eligible'));
  perform test.assert(v_res->>'reason' = 'granted', 'Caso 1: atteso reason=granted, trovato ' || (v_res->>'reason'));
  raise notice 'Caso 1 OK: pre-cutoff allowlisted -> granted (delega fedele)';
end $$;

-- ============================================================================
-- Caso 2: account PRE-cutoff, NON allowlisted -> il gate delega fedelmente,
-- eligible:false/not_in_allowlist (prova che il gate non trasforma un
-- rifiuto legittimo in un successo, ne' viceversa).
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('random-user@test.local', '2026-07-01T00:00:00Z'::timestamptz);
  v_res jsonb;
begin
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'eligible' = 'false', 'Caso 2: atteso eligible=false');
  perform test.assert(v_res->>'reason' = 'not_in_allowlist', 'Caso 2: atteso reason=not_in_allowlist, trovato ' || (v_res->>'reason'));
  raise notice 'Caso 2 OK: pre-cutoff non-allowlisted -> not_in_allowlist (delega fedele)';
end $$;

-- ============================================================================
-- Caso 3 (IL CASO CHE CONTA): account POST-cutoff, ALLOWLISTED nello stub
-- legacy -> il gate deve rifiutare comunque con 'program_closed', E la
-- funzione legacy non deve MAI essere raggiunta (probe piatto).
-- ============================================================================
do $$
declare
  v_hits_before int;
  v_hits_after int;
  v_user uuid := test.mkuser('allowlisted-reserved-2@test.local', '2026-08-01T00:00:00Z'::timestamptz);
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
-- Caso 5: account creato 1ms PRIMA del cutoff -> ancora pre-cutoff, delega.
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
-- Caso 6: nessun JWT -> eccezione esplicita, non un default silenzioso.
-- ============================================================================
do $$
declare
  v_raised boolean := false;
begin
  perform set_config('request.jwt.claim.sub', '', true);
  reset role;
  begin
    perform public.claim_founder_grant_if_eligible_gated();
  exception when others then
    v_raised := true;
  end;
  perform test.assert(v_raised, 'Caso 6: senza auth.uid() il gate deve sollevare eccezione');
  raise notice 'Caso 6 OK';
end $$;

-- ============================================================================
-- Caso 7: ACL — authenticated puo' chiamare il gate; NON puo' piu' chiamare
-- direttamente la funzione legacy grezza (ne' _apply_founder_grant); anon
-- non puo' chiamare nessuna delle due.
-- ============================================================================
do $$
declare
  v_auth_gate boolean;
  v_auth_legacy boolean;
  v_auth_apply boolean;
  v_anon_gate boolean;
begin
  select has_function_privilege('authenticated', 'public.claim_founder_grant_if_eligible_gated()', 'execute') into v_auth_gate;
  select has_function_privilege('authenticated', 'public.claim_founder_grant_if_eligible()', 'execute') into v_auth_legacy;
  select has_function_privilege('authenticated', 'public._apply_founder_grant(uuid, text)', 'execute') into v_auth_apply;
  select has_function_privilege('anon', 'public.claim_founder_grant_if_eligible_gated()', 'execute') into v_anon_gate;

  perform test.assert(v_auth_gate, 'Caso 7: authenticated deve poter chiamare il gate');
  perform test.assert(not v_auth_legacy, 'Caso 7: authenticated NON deve piu'' poter chiamare la funzione legacy grezza direttamente');
  perform test.assert(not v_auth_apply, 'Caso 7: authenticated NON deve piu'' poter chiamare _apply_founder_grant direttamente');
  perform test.assert(not v_anon_gate, 'Caso 7: anon non deve poter chiamare il gate');
  raise notice 'Caso 7 OK: ACL corretta, il gate resta l''unico percorso esterno verso la logica di riserva';
end $$;

-- ============================================================================
-- Caso 8: il gate FUNZIONA comunque per un account pre-cutoff nonostante
-- l'ACL della funzione legacy sia stata revocata da authenticated — prova
-- che la delega interna (SECURITY DEFINER) non e' rotta dalla revoca.
-- ============================================================================
do $$
declare
  v_user uuid := test.mkuser('post-revoke-check@test.local', '2026-07-01T00:00:00Z'::timestamptz);
  v_res jsonb;
begin
  v_res := test.call_gate_as(v_user);
  perform test.assert(v_res->>'reason' = 'not_in_allowlist', 'Caso 8: il gate deve continuare a funzionare (delegando internamente) anche dopo la revoca ACL sulla funzione legacy');
  raise notice 'Caso 8 OK: la delega interna sopravvive alla revoca ACL (SECURITY DEFINER)';
end $$;

reset role;
select '✅ TUTTI GLI 8 CASI FOUNDER_RESERVE_GATE SUPERATI' as risultato;
