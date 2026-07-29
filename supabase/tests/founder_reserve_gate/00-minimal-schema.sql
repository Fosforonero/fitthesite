-- Sprint P0.10E-E — schema minimo per testare la migration REALE
-- (20260729161341_founder_reserve_cutoff_gate.sql, rinominata da
-- 20260729120000 in Sprint P0.10F dopo l'apply reale — vedi
-- docs/architecture/p010-post-apply-migration-mapping.md — non riscritta
-- qui) su supabase/postgres reale.
--
-- IMPORTANTE — due categorie diverse di stub qui sotto:
--   1. claim_founder_grant_if_eligible()/handle_new_founder(): il loro
--      corpo REALE in produzione non e' mai stato letto per intero in
--      nessuna sessione. Solo firma/ACL/MD5 del primo sono stati confermati
--      da Matteo il 2026-07-29 via lettura diretta su produzione. Lo stub
--      replica il contratto JSON live documentato e l'ACL live di
--      partenza, ma la logica di allowlist vera resta sconosciuta e fuori
--      dalla portata di questa suite.
--   2. _apply_founder_grant(uuid, text): a differenza delle altre due, la
--      migration REALE la RISCRIVE per intero (FASE 4, barriera atomica +
--      convenzione live). Lo stub qui sotto (P0.10E-E) rappresenta il
--      comportamento PRE-migration ORA CONFERMATO da una lettura integrale
--      del corpo live fatta da Matteo (non un testo letterale incollato,
--      ma le sue proprieta' comportamentali esatte — vedi il commento in
--      testa alla migration reale): null-check, lookup allowlist su
--      founder_grants, convenzione di valori lifetime_founder/
--      founder_grant_<n>/2099-12-31/raw_payload, MA con l'upsert
--      INCONDIZIONATO (nessuna whitelist billing_source) che questa
--      migration corregge. E' il "prima" che la migration sostituisce col
--      "dopo" testato nei Casi 24+.
set role postgres;

create schema if not exists test;

create table test.probe_hits (
  n int primary key default 1,
  hits int not null default 0,
  constraint probe_hits_singleton check (n = 1)
);
insert into test.probe_hits (n, hits) values (1, 0);

-- founder_grants: stessa forma di 20260729161059 (rinominata da
-- 20260728090000) (email PK, founder_number,
-- applied_user_id/applied_at) — necessaria qui perche' la nuova
-- _apply_founder_grant legge (SELECT ... FOR UPDATE) e scrive in questa
-- tabella.
create table if not exists public.founder_grants (
  email text primary key,
  founder_number integer not null unique,
  granted_at timestamptz not null default now(),
  notes text null,
  applied_user_id uuid null references auth.users(id) on delete set null,
  applied_at timestamptz null
);

-- b2c_subscriptions: DDL REALE, non inventata — copiata per intero da
-- supabase/migrations/20260514120004_init_b2c_subs.sql (colonne, default,
-- vincoli, incluse external_order_id/raw_payload che una bozza precedente
-- di questa suite non replicava — trovato solo quando la barriera atomica
-- P0.10E-D falliva "null value in column external_product_id" contro
-- questa DDL). Uniche differenze deliberate rispetto all'originale: FK su
-- auth.users(id) invece di public.profiles(id) (questa suite non stub-a
-- profiles, non rilevante per testare _apply_founder_grant), e
-- billing_source include 'founder_grant' (assente nel CHECK della
-- migration TRACCIATA — deve essere stato aggiunto da un ALTER non
-- tracciato in produzione, stesso pattern di drift gia' documentato per
-- founder_grants/schema private/le altre funzioni Founder; confermato
-- indirettamente dalle 18 righe reali con billing_source='founder_grant'
-- che Matteo ha contato il 2026-07-29 — non potrebbero esistere se il
-- CHECK live non lo permettesse).
create table if not exists public.b2c_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  billing_source text not null
    check (billing_source in ('google_play', 'apple_iap', 'stripe', 'trial', 'founder_grant')),
  external_product_id text not null,
  external_subscription_id text not null,
  external_order_id text,
  active_until timestamptz not null,
  auto_renewing boolean not null default true,
  state text not null default 'active'
    check (state in ('active', 'grace', 'on_hold', 'paused', 'expired', 'cancelled')),
  last_notification_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (billing_source, external_subscription_id)
);

-- TEST-ONLY (P0.10E-E, Caso 40): colonna/meccanismo che NON esiste sulla
-- tabella reale, usata esclusivamente per dimostrare che
-- _apply_founder_grant rilancia (RAISE) un unique_violation su un vincolo
-- NON riconosciuto invece di assorbirlo silenziosamente nel fallback
-- UPDATE. Attivato solo dalla GUC di sessione test.force_synthetic_
-- violation='true' (default/assente altrove — nessun impatto sugli altri
-- casi). Il vincolo/nome sintetico non esiste su nessuna tabella reale:
-- serve solo a costruire un CONSTRAINT_NAME che la funzione non riconosce.
create or replace function test.trg_synthetic_unique_violation()
returns trigger
language plpgsql
as $$
begin
  if current_setting('test.force_synthetic_violation', true) = 'true' then
    raise exception 'P0.10E-E test: unique_violation sintetico su un vincolo sconosciuto'
      using errcode = 'unique_violation', constraint = 'test_only_unrelated_constraint';
  end if;
  return new;
end;
$$;

create trigger trg_test_synthetic_unique_violation
  before insert on public.b2c_subscriptions
  for each row execute function test.trg_synthetic_unique_violation();

-- Helper di test: inserisce una riga b2c_subscriptions con TUTTE le
-- colonne NOT NULL popolate. Valori di external_product_id/
-- external_subscription_id/active_until scelti per coerenza interna del
-- test (simulano una sottoscrizione commerciale/trial pre-esistente), non
-- devono necessariamente coincidere con le convenzioni reali di produzione
-- per QUESTO scopo (verificare che _apply_founder_grant/il precheck del
-- wrapper si comportino correttamente), a differenza dei valori scelti
-- DENTRO _apply_founder_grant stesso nella migration reale, che invece
-- rispecchiano deliberatamente la convenzione live esatta delle 18 righe
-- founder_grant reali.
create or replace function test.mkcommercial(p_user_id uuid, p_billing_source text, p_state text default 'active')
returns void
language plpgsql
as $$
declare
  v_active_until timestamptz;
begin
  v_active_until := case p_billing_source
    when 'founder_grant' then '2099-12-31 23:59:59+00'::timestamptz
    when 'trial' then now() + interval '7 days'
    else now() + interval '365 days'
  end;

  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state
  ) values (
    p_user_id, p_billing_source, 'test-product-' || p_billing_source, 'test-sub-' || p_user_id::text,
    v_active_until, false, p_state
  );
end;
$$;

-- Stub minimale della funzione legacy: "eligible" solo per un'email che
-- inizia con 'allowlisted', altrimenti 'not_in_allowlist'. Incrementa il
-- contatore probe ad OGNI chiamata REALE, per provare che il wrapper non
-- la raggiunga mai quando non deve (post-cutoff o finestra scaduta).
--
-- Per un'email allowlisted, chiama DAVVERO _apply_founder_grant. A
-- differenza della propria allowlist per prefisso (solo per decidere se
-- delegare o no), _apply_founder_grant ORA ha una propria allowlist REALE
-- basata su public.founder_grants (P0.10E-E) — un'email che inizia per
-- 'allowlisted' in questo stub ma NON ha una riga founder_grants
-- corrispondente ottiene comunque false da _apply_founder_grant (allowlist
-- vera, non quella del solo prefisso stub). I casi che si aspettano
-- 'granted' inseriscono quindi esplicitamente la riga founder_grants
-- corrispondente prima di chiamare test.call_gate_as.
--
-- Se _apply_founder_grant ritorna false, il reason usato
-- ('not_in_allowlist') e' un PLACEHOLDER deliberato — il corpo legacy reale
-- (mai riletto) potrebbe usare un reason diverso in questo caso, e i Casi
-- FASE 5 sotto provano che il wrapper corregge comunque la risposta finale
-- indipendentemente da quale placeholder sia qui.
--
-- Hook di simulazione race (single-threaded, deterministico): se l'email
-- e' 'allowlisted-simulate-race-<source>@test.local', inserisce la riga
-- commerciale corrispondente PROPRIO PRIMA di chiamare
-- _apply_founder_grant — simula "un INSERT commerciale concorrente e'
-- arrivato dopo il precheck del wrapper ma prima della delega", senza
-- bisogno di una vera seconda sessione concorrente per questo caso
-- specifico (la vera concorrenza multi-sessione e' testata separatamente
-- in run-suite.sh direttamente su _apply_founder_grant).
create or replace function public.claim_founder_grant_if_eligible()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_applied boolean;
begin
  update test.probe_hits set hits = hits + 1 where n = 1;

  v_user_id := auth.uid();
  select email into v_email from auth.users where id = v_user_id;

  if lower(v_email) like 'allowlisted%@test.local' then
    if v_email = 'allowlisted-simulate-race-google@test.local' then
      perform test.mkcommercial(v_user_id, 'google_play');
    elsif v_email = 'allowlisted-simulate-race-apple@test.local' then
      perform test.mkcommercial(v_user_id, 'apple_iap');
    elsif v_email = 'allowlisted-simulate-race-stripe@test.local' then
      perform test.mkcommercial(v_user_id, 'stripe');
    end if;

    v_applied := public._apply_founder_grant(v_user_id, v_email);
    if v_applied then
      return jsonb_build_object('eligible', true, 'reason', 'granted');
    else
      return jsonb_build_object('eligible', false, 'reason', 'not_in_allowlist');
    end if;
  end if;
  return jsonb_build_object('eligible', false, 'reason', 'not_in_allowlist');
end;
$$;

-- STUB PRE-MIGRATION di _apply_founder_grant (P0.10E-E): ricostruisce
-- fedelmente le proprieta' comportamentali del corpo LIVE oggi in
-- produzione, ora note con precisione perche' Matteo ne ha letto il corpo
-- integrale (2026-07-29, secondo giro) — non un testo letterale incollato,
-- ma un elenco esatto di comportamenti (vedi il commento di testa alla
-- migration reale, sezione FASE 4). Include quindi: null-check su
-- entrambi i parametri, lookup allowlist su founder_grants (false se
-- assente), uso di founder_number/email/granted_at per costruire
-- external_subscription_id/raw_payload con la convenzione live esatta
-- (lifetime_founder / founder_grant_<n> / 2099-12-31 23:59:59+00 /
-- raw_payload con source=rpc_claim), aggiornamento di updated_at nel ramo
-- di conflitto. Il BUG che questa migration corregge resta lo stesso di
-- P0.10E-D: l'upsert su b2c_subscriptions e' un ON CONFLICT (user_id) DO
-- UPDATE INCONDIZIONATO (nessuna whitelist billing_source) -> puo'
-- sovrascrivere una riga commerciale gia' esistente.
--
-- Il suo MD5 locale e' NECESSARIAMENTE diverso da quello reale di
-- produzione (5c7649b942f04234c31d3c7961c4c6a0 — testo letterale diverso
-- per costruzione, dato che non lo possediamo): run-suite.sh calcola l'MD5
-- di QUESTO stub e lo sostituisce nella copia di migration usata per il
-- test, per verificare il MECCANISMO del guard (abortisce su mismatch,
-- procede su match), non per riprodurre l'hash reale (impossibile senza
-- il testo letterale).
create or replace function public._apply_founder_grant(p_user_id uuid, p_email text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_grant public.founder_grants%rowtype;
begin
  if p_user_id is null or p_email is null then
    return false;
  end if;

  select * into v_grant from public.founder_grants where lower(email) = lower(p_email);
  if not found then
    return false;
  end if;

  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state, raw_payload
  )
  values (
    p_user_id, 'founder_grant', 'lifetime_founder', 'founder_grant_' || v_grant.founder_number,
    '2099-12-31 23:59:59+00'::timestamptz, false, 'active',
    jsonb_build_object(
      'founder_number', v_grant.founder_number,
      'grant_email', v_grant.email,
      'granted_at', v_grant.granted_at,
      'source', 'rpc_claim'
    )
  )
  on conflict (user_id) do update
    set billing_source = 'founder_grant',
        updated_at = now();

  update public.founder_grants
  set applied_user_id = p_user_id, applied_at = now()
  where email = v_grant.email;

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
-- `public` (default privileges) — senza questo revoke lo stub partirebbe
-- gia' aperto ad authenticated, contraddicendo lo stato live reale.
grant execute on function public.claim_founder_grant_if_eligible() to public, anon, authenticated, service_role;
grant execute on function public.handle_new_founder() to public, anon, authenticated, service_role;
revoke all on function public._apply_founder_grant(uuid, text) from public, anon, authenticated;
grant execute on function public._apply_founder_grant(uuid, text) to service_role;

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
