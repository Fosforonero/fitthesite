-- Sprint P0.10E-D — schema minimo per testare la migration REALE
-- (20260729120000_founder_reserve_cutoff_gate.sql, non riscritta qui) su
-- supabase/postgres reale.
--
-- IMPORTANTE — due categorie diverse di stub qui sotto:
--   1. claim_founder_grant_if_eligible()/handle_new_founder(): il loro
--      corpo REALE in produzione non e' mai stato letto per intero in
--      questa sessione. Solo firma/ACL/MD5 del primo sono stati confermati
--      da Matteo il 2026-07-29 via lettura diretta su produzione. Lo stub
--      replica il contratto JSON live documentato e l'ACL live di
--      partenza, ma la logica di allowlist vera resta sconosciuta e fuori
--      dalla portata di questa suite.
--   2. _apply_founder_grant(uuid, text): a differenza delle altre due, la
--      migration REALE la RISCRIVE per intero (FASE 4, barriera atomica).
--      Lo stub qui sotto rappresenta quindi il comportamento PRE-migration
--      documentato da Matteo (upsert incondizionato + marcatura
--      founder_grants + return true sempre) — e' il "prima" che la
--      migration sostituisce col "dopo" testato nei Casi 24+.
set role postgres;

create schema if not exists test;

create table test.probe_hits (
  n int primary key default 1,
  hits int not null default 0,
  constraint probe_hits_singleton check (n = 1)
);
insert into test.probe_hits (n, hits) values (1, 0);

-- founder_grants: stessa forma di 20260728090000 (email PK, founder_number,
-- applied_user_id/applied_at) — necessaria qui perche' la nuova
-- _apply_founder_grant scrive in questa tabella.
create table if not exists public.founder_grants (
  email text primary key,
  founder_number integer not null unique,
  granted_at timestamptz not null default now(),
  notes text null,
  applied_user_id uuid null references auth.users(id) on delete set null,
  applied_at timestamptz null
);

-- b2c_subscriptions: DDL REALE, non inventata — copiata da
-- supabase/migrations/20260514120004_init_b2c_subs.sql (gia' TRACCIATA in
-- questo stesso repo, mai cercata prima d'ora in questo sprint: un errore
-- di processo trovato solo in review avversariale, quando la prima bozza
-- della barriera atomica FASE 4 falliva "null value in column
-- external_product_id" contro questa DDL). Uniche differenze deliberate
-- rispetto all'originale: FK su auth.users(id) invece di
-- public.profiles(id) (questa suite non stub-a profiles, non rilevante per
-- testare _apply_founder_grant), e billing_source include 'founder_grant'
-- (assente nel CHECK della migration TRACCIATA — deve essere stato
-- aggiunto da un ALTER non tracciato in produzione, stesso pattern di
-- drift gia' documentato per founder_grants/schema private/le altre
-- funzioni Founder; confermato indirettamente dalle 18 righe reali con
-- billing_source='founder_grant' che Matteo ha contato il 2026-07-29 — non
-- potrebbero esistere se il CHECK live non lo permettesse).
create table if not exists public.b2c_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  billing_source text not null
    check (billing_source in ('google_play', 'apple_iap', 'stripe', 'trial', 'founder_grant')),
  external_product_id text not null,
  external_subscription_id text not null,
  active_until timestamptz not null,
  auto_renewing boolean not null default true,
  state text not null default 'active'
    check (state in ('active', 'grace', 'on_hold', 'paused', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (billing_source, external_subscription_id)
);

-- Helper di test: inserisce una riga b2c_subscriptions con TUTTE le
-- colonne NOT NULL popolate (non solo user_id/billing_source/state come
-- nelle bozze precedenti di questa suite, che non avrebbero mai scoperto
-- il bug NOT NULL perche' testavano contro uno stub incompleto). Valori
-- di external_product_id/external_subscription_id/active_until scelti per
-- coerenza interna del test, non devono necessariamente coincidere con le
-- convenzioni reali di produzione per QUESTO scopo (verificare che
-- _apply_founder_grant/il precheck del wrapper si comportino
-- correttamente), a differenza dei valori scelti DENTRO
-- _apply_founder_grant stesso nella migration reale, che invece rispecchiano
-- deliberatamente la convenzione live di grant_b2c_trial().
create or replace function test.mkcommercial(p_user_id uuid, p_billing_source text, p_state text default 'active')
returns void
language plpgsql
as $$
declare
  v_active_until timestamptz;
begin
  v_active_until := case p_billing_source
    when 'founder_grant' then '9999-12-31'::timestamptz
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
-- Per un'email allowlisted, chiama DAVVERO _apply_founder_grant (a
-- differenza delle versioni P0.10E-B/C di questo stub, che non la
-- chiamavano affatto: qui la barriera atomica reale (FASE 4) deve poter
-- essere esercitata end-to-end). Se _apply_founder_grant ritorna false, il
-- reason usato ('not_in_allowlist') e' un PLACEHOLDER deliberato — il
-- corpo legacy reale (mai riletto) potrebbe usare un reason diverso in
-- questo caso, e i Casi FASE 5 sotto provano che il wrapper corregge
-- comunque la risposta finale indipendentemente da quale placeholder sia
-- qui.
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

-- STUB PRE-MIGRATION di _apply_founder_grant: replica il comportamento
-- BUGGY documentato da Matteo (upsert incondizionato su b2c_subscriptions
-- + marcatura founder_grants + return true SEMPRE, senza controllare
-- ROW_COUNT). Questo e' esattamente il corpo che la migration reale (FASE
-- 4) deve sostituire con la barriera atomica whitelist. Il suo MD5 locale
-- e' NECESSARIAMENTE diverso da quello reale di produzione
-- (5c7649b942f04234c31d3c7961c4c6a0 — testo diverso, hash diverso per
-- costruzione): run-suite.sh calcola l'MD5 di QUESTO stub e lo sostituisce
-- nella copia di migration usata per il test, per verificare il
-- MECCANISMO del guard (abortisce su mismatch, procede su match), non per
-- riprodurre l'hash reale (impossibile senza il corpo vero).
create or replace function public._apply_founder_grant(p_user_id uuid, p_email text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state
  )
  values (
    p_user_id, 'founder_grant', 'test-product-founder_grant', 'test-sub-' || p_user_id::text,
    '9999-12-31'::timestamptz, false, 'active'
  )
  on conflict (user_id) do update
    set billing_source = 'founder_grant', state = 'active';

  update public.founder_grants
  set applied_user_id = p_user_id, applied_at = now()
  where lower(email) = lower(p_email);

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
