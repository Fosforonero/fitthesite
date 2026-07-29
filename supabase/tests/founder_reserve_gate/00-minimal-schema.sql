-- Sprint P0.10E-A — schema minimo per testare
-- claim_founder_grant_if_eligible_gated() (migration REALE, non riscritta:
-- 20260729120000) su supabase/postgres reale.
--
-- IMPORTANTE: claim_founder_grant_if_eligible()/_apply_founder_grant(uuid,
-- text) qui sotto sono STUB — il loro corpo REALE in produzione non e'
-- mai stato letto (drift di schema non tracciato). Lo stub replica
-- ESATTAMENTE il contratto JSON live documentato
-- (docs/architecture/founder-p010-founder-pre-apply-checklist.md, sezione
-- "BLOCCANTE P0.10E"): {"eligible":true,"reason":"granted"} /
-- {"eligible":false,"reason":"not_in_allowlist"}. Questi test verificano
-- SOLO che il gate (codice REALE) intercetti correttamente in base al
-- cutoff e deleghi fedelmente altrimenti — MAI la correttezza della logica
-- di allowlist legacy stessa, che resta sconosciuta e fuori dalla portata
-- di questa suite.
set role postgres;

create schema if not exists test;

create table test.probe_hits (
  n int primary key default 1,
  hits int not null default 0,
  constraint probe_hits_singleton check (n = 1)
);
insert into test.probe_hits (n, hits) values (1, 0);

-- Stub minimale: "eligible" solo per l'email letteralmente
-- 'allowlisted@test.local', altrimenti 'not_in_allowlist'. Incrementa il
-- contatore probe ad ogni chiamata REALE, per provare che il gate non la
-- raggiunga mai per un account post-cutoff.
create or replace function public.claim_founder_grant_if_eligible()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  update test.probe_hits set hits = hits + 1 where n = 1;

  v_user_id := auth.uid();
  select email into v_email from auth.users where id = v_user_id;

  if lower(v_email) like 'allowlisted%@test.local' then
    return jsonb_build_object('eligible', true, 'reason', 'granted');
  end if;
  return jsonb_build_object('eligible', false, 'reason', 'not_in_allowlist');
end;
$$;

create or replace function public._apply_founder_grant(p_user_id uuid, p_email text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  return true;
end;
$$;

-- Nella realta' queste due partono probabilmente gia' aperte a
-- authenticated (e' esattamente il problema che questa migration chiude).
grant execute on function public.claim_founder_grant_if_eligible() to authenticated;
grant execute on function public._apply_founder_grant(uuid, text) to authenticated;

create schema if not exists test;

create or replace function test.mkuser(p_email text, p_created_at timestamptz default now())
returns uuid
language plpgsql
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, created_at) values (v_id, p_email, p_created_at);
  return v_id;
end;
$$;

create or replace function test.call_gate_as(p_user_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_result jsonb;
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  set local role authenticated;
  v_result := public.claim_founder_grant_if_eligible_gated();
  reset role;
  return v_result;
end;
$$;
