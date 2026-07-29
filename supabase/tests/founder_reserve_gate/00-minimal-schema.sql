-- Sprint P0.10E-B — schema minimo per testare la migration REALE
-- (20260729120000_founder_reserve_cutoff_gate.sql, non riscritta qui) su
-- supabase/postgres reale.
--
-- IMPORTANTE: claim_founder_grant_if_eligible()/_apply_founder_grant(uuid,
-- text)/handle_new_founder() qui sotto sono STUB — il loro corpo REALE in
-- produzione non e' mai stato letto per intero in questa sessione. Solo
-- firma/ACL/MD5 del primo sono stati confermati da Matteo il 2026-07-29 via
-- lettura diretta su produzione (zero argomenti, ritorna jsonb, SECURITY
-- DEFINER, MD5 8419db344a7383ba53f01457335a3494, ACL PUBLIC/anon/
-- authenticated/service_role tutti con EXECUTE). Lo stub replica
-- ESATTAMENTE il contratto JSON live documentato
-- ({"eligible":true,"reason":"granted"} / {"eligible":false,"reason":
-- "not_in_allowlist"}) E l'ACL live di partenza, cosi' che la migration
-- reale trovi uno stato iniziale fedele da cui spostare/richiudere.
--
-- Questi test verificano SOLO che la migration (codice REALE, non questo
-- file) sposti correttamente la funzione, la richiuda, e la sostituisca con
-- un wrapper che intercetta cutoff+finestra individuale e deleghi
-- fedelmente altrimenti — MAI la correttezza della logica di allowlist
-- legacy stessa, che resta sconosciuta e fuori dalla portata di questa
-- suite.
set role postgres;

create schema if not exists test;

create table test.probe_hits (
  n int primary key default 1,
  hits int not null default 0,
  constraint probe_hits_singleton check (n = 1)
);
insert into test.probe_hits (n, hits) values (1, 0);

-- Stub minimale: "eligible" solo per un'email che inizia con 'allowlisted',
-- altrimenti 'not_in_allowlist'. Incrementa il contatore probe ad OGNI
-- chiamata REALE, per provare che il wrapper non la raggiunga mai quando
-- non deve (post-cutoff o finestra individuale scaduta).
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

-- Trigger function reale: RETURNS TRIGGER, Postgres rifiuta comunque
-- l'invocazione diretta via RPC indipendentemente dall'ACL (confermato in
-- produzione) — serve qui solo per testare che l'ACL venga revocata, mai
-- per essere effettivamente invocata da questa suite.
create or replace function public.handle_new_founder()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  return new;
end;
$$;

-- ACL di partenza fedele allo stato LIVE pre-migration, come confermato da
-- Matteo il 2026-07-29: claim_founder_grant_if_eligible() e
-- handle_new_founder() aperte a PUBLIC/anon/authenticated/service_role;
-- _apply_founder_grant() gia' chiusa a PUBLIC/anon/authenticated (solo
-- postgres/service_role hanno EXECUTE).
--
-- Il REVOKE esplicito su _apply_founder_grant sotto NON e' ridondante:
-- l'immagine Postgres di Supabase concede EXECUTE a PUBLIC/anon/
-- authenticated/service_role di default su OGNI funzione appena creata in
-- `public` (default privileges), verificato direttamente in review
-- avversariale — senza questo revoke lo stub partirebbe gia' aperto ad
-- authenticated, contraddicendo lo stato live reale che questo file vuole
-- riprodurre, e nascondendo un'eventuale regressione del reassert ACL della
-- migration (il test passerebbe anche se quel passo non facesse nulla).
grant execute on function public.claim_founder_grant_if_eligible() to public, anon, authenticated, service_role;
grant execute on function public.handle_new_founder() to public, anon, authenticated, service_role;
revoke all on function public._apply_founder_grant(uuid, text) from public, anon, authenticated;
grant execute on function public._apply_founder_grant(uuid, text) to service_role;

-- Sprint P0.10E-C — stub di b2c_subscriptions per il no-clobber. Colonne e
-- valori di billing_source confermati da Matteo via conteggio diretto su
-- produzione il 2026-07-29 (18 righe totali, tutte 'founder_grant'; zero
-- google_play/apple_iap/stripe/trial ad oggi). user_id PRIMARY KEY: dedotto
-- (non confermato via DDL diretta, ancora in sospeso — vedi §17b del
-- preflight) dal fatto che _apply_founder_grant usa
-- `ON CONFLICT (user_id) DO UPDATE`, che richiede un vincolo di unicita'
-- esattamente su quella colonna.
create table if not exists public.b2c_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  billing_source text not null check (billing_source in ('google_play', 'apple_iap', 'stripe', 'trial', 'founder_grant')),
  state text not null default 'active',
  created_at timestamptz not null default now()
);

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
  -- Chiama il nome PUBBLICO ORIGINALE: e' esattamente cio' che il client
  -- Flutter gia' pubblicato chiama, senza alcuna release necessaria. Se la
  -- migration avesse invece creato un endpoint con un nome diverso (come
  -- nella prima versione di questo sprint, mai applicata), questa stessa
  -- chiamata avrebbe raggiunto lo STUB legacy DIRETTAMENTE, bypassando ogni
  -- controllo di cutoff/finestra — ed e' esattamente cio' che i casi sotto
  -- provano non accadere.
  v_result := public.claim_founder_grant_if_eligible();
  reset role;
  return v_result;
end;
$$;
