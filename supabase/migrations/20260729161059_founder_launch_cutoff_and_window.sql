-- Sprint P0.10A — Founder correctness (revisione indipendente della prima
-- bozza di questo stesso file, Sprint P0.10). File riscritto IN PLACE:
-- questa migration non e' mai stata applicata in produzione, quindi non
-- esiste alcun vincolo di compatibilita' storica da preservare — la bozza
-- precedente (cutoff + finestra basata su now(), cap su
-- count(distinct user_id) da user_roles) e' stata sostituita per intero,
-- non estesa. Nessuna seconda migration concorrente creata.
--
-- Tre difetti trovati in revisione indipendente della bozza precedente:
--
--   BLOCCO 1 — cap non persistente: contare
--   `count(distinct user_id) from user_roles where note='founder-launch'`
--   non soddisfa "un posto assegnato non viene mai riassegnato" — una
--   cancellazione account fa sparire la riga user_roles (il posto
--   tornerebbe disponibile) e i 3 posti riservati/non applicati in
--   `founder_grants` non erano considerati nel cap.
--
--   BLOCCO 2 — finestra sul now() di chiamata invece che sulla prima sync
--   riuscita: `now() > created_at + 14gg` valutato ad OGNI chiamata (questa
--   funzione viene richiamata a ogni sync 'success', non solo alla prima)
--   avrebbe fatto scadere retroattivamente l'eligibility di un utente che
--   aveva gia' sincronizzato con successo DENTRO la finestra.
--
--   BLOCCO 3 — rivalutazione indefinita: nessun esito terminale persistito
--   -> ogni sync successiva ripete l'intera valutazione da zero,
--   indefinitamente, per l'intera vita dell'account.
--
-- Risoluzione: ripreso e adattato il ledger gia' progettato e testato nello
-- Sprint P0.7 (branch `sprint-p07-founder-backend`, file
-- `20260720140000_founder_p0_cutoff_window_cap_reconciliation.sql`,
-- **mai applicato in produzione**, messo NO-GO da Matteo in attesa di
-- esattamente un checkpoint dedicato cutoff/finestra/cap-riservato — questo
-- file e' quel checkpoint) — NON importato alla cieca: confrontato con lo
-- schema di QUESTO branch e corretto un riferimento stale (vedi sotto).
--
-- Estende IN PLACE private.grant_founder_launch_core(uuid, uuid) — stessa
-- firma, stesso contratto di risposta jsonb (grantCreated/
-- alreadyHadEligibleGrant/grantKind/capReached/notEligibleReason) gia'
-- consumato da record_first_sync_transition e da
-- app/api/v1/sync/founder-grant.ts — zero modifiche lato route/TypeScript
-- richieste da questo file, nessuna seconda RPC.
--
-- Correzione rispetto alla bozza P0.7: quel file (redatto su un altro
-- worktree, in parallelo) estendeva ancora una versione con la sola
-- esclusione `appreview.demo@fitmesh.fit` e riferiva nei commenti
-- `20260720090000` come la migration live da estendere. In QUESTO branch la
-- migration realmente applicata in produzione il 2026-07-20 e'
-- `20260720120247_founder_launch_exclude_review_email_alias.sql`, che
-- esclude GIA' entrambe le email (`review@fitmesh.fit` e
-- `appreview.demo@fitmesh.fit`) — `20260720090000` non esiste in questo
-- branch e non va introdotta (creerebbe un secondo `create or replace`
-- ridondante). Questo file estende `120247`, non `090000`: stessa logica di
-- esclusione (gia' corretta e verificata li'), riferimenti aggiornati.
--
-- BLOCCO 3, oltre al ledger P0.7: i due controlli "gia' pro" e "esito gia'
-- persistito" sono stati SPOSTATI in cima alla funzione, prima delle query
-- fitness_metrics/auth.users — invariati nella logica, cambiati solo
-- nell'ordine. record_first_sync_transition chiama questa funzione ad OGNI
-- sync che risulta 'success' (non solo alla prima, vedi il file
-- 20260720055513): senza questo riordino, un utente gia' deciso
-- (Founder concesso, gia' pro da altra fonte, o gia' valutato non
-- eleggibile) ripete comunque le query fitness_metrics + auth.users ad ogni
-- singola sync successiva, per l'intera vita dell'account. Nessun cambio di
-- risultato per nessuno scenario: le due query saltate servono solo a
-- DERIVARE un esito che, in questi due casi, e' gia' noto.
--
-- Schema public.founder_grants: NON creato da alcuna migration in git in
-- questo branch (stesso pattern di deriva schema-non-tracciata gia'
-- documentato per lo schema `private` — vedi sotto). Confermato da Matteo
-- che la tabella esiste gia' in produzione, ~21 righe, 3 non applicate
-- (riservate). `create table if not exists` resta un no-op in produzione;
-- necessario per poter replicare il ledger su un Postgres locale usa-e-getta
-- per la suite di test di questa migration.
--
-- Schema private: stesso gap gia' segnalato in Sprint P0.7 — nessuna
-- migration in git lo crea, deve esistere gia' in produzione da un'azione
-- non tracciata (`grant_founder_launch_core` vive li' dal 2026-07-20).
-- `create schema if not exists` qui è un no-op in produzione e rende
-- questo file autosufficiente per il replay locale, senza bisogno di un
-- workaround fuori dal repo.
--
-- NON APPLICATA IN PRODUZIONE. Richiede snapshot pre-apply, suite di test
-- locale completa e GO esplicito di Matteo (vedi report Sprint P0.10A).
--
-- CORREZIONE Sprint P0.10B: la prima versione di questo file (P0.10A)
-- persisteva SEMPRE 'not_eligible' in private.founder_evaluations.outcome
-- sia per program_closed sia per window_expired (l'unico vincolo CHECK era
-- 'not_eligible'/'cap_reached') — il fast-path di rilettura poi MAPPAVA
-- quel valore generico di nuovo a 'window_expired' incondizionatamente.
-- Risultato: un account post-cutoff otteneva 'program_closed' alla prima
-- valutazione ma 'window_expired' a ogni sync successiva — violazione del
-- contratto stabile richiesto da docs/product/post-founder-entitlement-
-- contract.md (lo stesso utente, con lo stesso stato, deve ricevere sempre
-- lo stesso notEligibleReason). Corretto: `outcome` ora e' esattamente il
-- notEligibleReason (tre valori: program_closed/window_expired/
-- cap_reached, non piu' un bucket con perdita di informazione) e il
-- fast-path lo restituisce verbatim, senza alcuna rimappatura. Zero
-- cambi al contratto JSON pubblico e zero cambi a FounderGrantStatus
-- (TypeScript) — solo la fedelta' del valore persistito internamente.

-- ============================================================================
-- 0. Riconciliazione schema public.founder_grants (posti storici/riservati,
--    allowlist manuale pre-esistente al motore first-sync). Idempotente:
--    no-op contro la tabella gia' esistente in produzione.
-- ============================================================================

create table if not exists public.founder_grants (
  email text primary key,
  founder_number integer not null unique,
  granted_at timestamptz not null default now(),
  notes text null,
  applied_user_id uuid null references auth.users(id) on delete set null,
  applied_at timestamptz null
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.founder_grants'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%lower(email)%'
  ) then
    alter table public.founder_grants
      add constraint founder_grants_email_lowercase_check
      check (email = lower(email));
  end if;
end $$;

alter table public.founder_grants enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'founder_grants'
  ) then
    -- Nessuna policy per anon/authenticated: solo service_role/postgres
    -- (owner) possono leggere/scrivere. Allowlist curata a mano, mai
    -- self-service.
    create policy "founder_grants service_role only"
      on public.founder_grants for all
      using (false)
      with check (false);
  end if;
end $$;
revoke all on public.founder_grants from public, anon, authenticated;

-- ============================================================================
-- 1. Schema privato per il ledger persistente (posto consumato) e l'esito
--    terminale (nessun posto, mai piu' rivalutato).
--
--    Nessuna tabella "prova di sync" separata: devices.first_sync_at (gia'
--    esistente dal 14/07, scritta da record_first_sync_transition PRIMA di
--    chiamare questa funzione, stessa transazione) e' gia' l'evidenza
--    server-side corretta.
-- ============================================================================

create schema if not exists private;

-- Un posto Founder CONSUMATO (backfill legacy + ogni grant organico
-- futuro). user_id nullable + on delete set null (mai cascade): il posto
-- non si libera mai, nemmeno se l'account viene cancellato (BLOCCO 1).
create table if not exists private.founder_seats (
  founder_number integer primary key,
  user_id uuid null references auth.users(id) on delete set null,
  source text not null check (source in ('legacy_allowlist', 'legacy_autogrant', 'verified_sync')),
  registered_at timestamptz null,
  first_sync_evidence_at timestamptz null,
  granted_at timestamptz not null default now(),
  rule_version text not null,
  anonymized_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint founder_seats_registered_at_or_anonymized check (
    anonymized_at is not null or registered_at is not null
  )
);
create unique index if not exists founder_seats_user_id_idx on private.founder_seats (user_id) where user_id is not null;
create index if not exists founder_seats_source_idx on private.founder_seats (source);
alter table private.founder_seats enable row level security;

-- Esito terminale SENZA posto consumato. `outcome` e' esattamente il
-- notEligibleReason restituito dall'API (P0.10B: non piu' un bucket
-- generico 'not_eligible' che perdeva la distinzione program_closed vs
-- window_expired) — persistito una sola volta, mai rivalutato, mai
-- ricalcolato da un conteggio corrente (BLOCCO 3). Cascade delete: nessun
-- posto scarso in gioco, minimizzazione dati corretta alla cancellazione
-- GDPR.
create table if not exists private.founder_evaluations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  outcome text not null check (outcome in ('program_closed', 'window_expired', 'cap_reached')),
  registered_at timestamptz null,
  decided_at timestamptz not null default now(),
  rule_version text not null
);
alter table private.founder_evaluations enable row level security;

revoke all on schema private from public, anon, authenticated;

-- ============================================================================
-- 2. Allocatore del founder_number — i numeri gia' presenti in
--    public.founder_grants (applicati O non applicati) restano riservati
--    per sempre. SECURITY INVOKER: chiamata solo da
--    grant_founder_launch_core (DEFINER, eredita il contesto del proprio
--    owner) o dal backfill in fase di migration. Non sicura in isolamento
--    sotto concorrenza: il chiamante DEVE gia' avere
--    pg_advisory_xact_lock(hashtext('founder-launch-grant')).
-- ============================================================================

create or replace function private._next_founder_number()
returns integer
language plpgsql
security invoker
set search_path to pg_catalog, private
as $$
declare
  v_candidate integer := 1;
  v_cap constant integer := 1000;
begin
  loop
    exit when v_candidate > v_cap;
    if not exists (select 1 from public.founder_grants where founder_number = v_candidate)
       and not exists (select 1 from private.founder_seats where founder_number = v_candidate)
    then
      return v_candidate;
    end if;
    v_candidate := v_candidate + 1;
  end loop;
  return null;
end;
$$;
revoke all on function private._next_founder_number() from public;

-- ============================================================================
-- 3. Backfill collision-safe: calcola la popolazione AL MOMENTO
--    dell'applicazione (mai un numero scritto a mano), fallisce
--    rumorosamente su collisione invece di nascondersi dietro ON CONFLICT
--    DO NOTHING, verifica esplicitamente il set-equality fra fonte
--    (founder_grants applicati + user_roles founder-launch) e ledger
--    risultante. Nessun abbonamento (b2c_subscriptions) letto o scritto.
-- ============================================================================

do $$
declare
  v_expected_users uuid[];
  v_seated_users uuid[];
  v_missing_from_seats uuid[];
  v_extra_in_seats uuid[];
  v_legacy_count int := 0;
  v_autogrant_count int := 0;
  v_number int;
  r record;
begin
  perform pg_advisory_xact_lock(hashtext('founder-launch-grant'));

  -- Passo A: legacy_allowlist (founder_grants applicati).
  for r in
    select fg.applied_user_id as user_id, fg.founder_number, u.created_at as registered_at
    from public.founder_grants fg
    join auth.users u on u.id = fg.applied_user_id
    where fg.applied_user_id is not null
  loop
    begin
      insert into private.founder_seats
        (founder_number, user_id, source, registered_at, granted_at, rule_version)
      values (r.founder_number, r.user_id, 'legacy_allowlist', r.registered_at, now(), 'founder_p010a_ledger_v1');
    exception
      when unique_violation then
        raise exception 'founder_p010a backfill: collisione founder_number % per user_id % - fermare e verificare a mano, MAI un ON CONFLICT DO NOTHING silenzioso qui', r.founder_number, r.user_id;
    end;
    v_legacy_count := v_legacy_count + 1;
  end loop;

  -- Passo B: legacy_autogrant (user_roles founder-launch non gia' coperti dal passo A).
  for r in
    select ur.user_id, u.created_at as registered_at
    from public.user_roles ur
    join auth.users u on u.id = ur.user_id
    where ur.role = 'pro' and ur.note = 'founder-launch'
      and not exists (select 1 from private.founder_seats fs where fs.user_id = ur.user_id)
    order by u.created_at asc
  loop
    v_number := private._next_founder_number();
    if v_number is null then
      raise exception 'founder_p010a backfill: cap 1000 esaurito durante legacy_autogrant per user_id % - fermare e verificare a mano', r.user_id;
    end if;
    insert into private.founder_seats
      (founder_number, user_id, source, registered_at, granted_at, rule_version)
    values (v_number, r.user_id, 'legacy_autogrant', r.registered_at, now(), 'founder_p010a_ledger_v1');
    v_autogrant_count := v_autogrant_count + 1;
  end loop;

  -- Verifica set-equality esplicita: fonte (founder_grants applicati UNION
  -- user_roles founder-launch) contro il ledger appena costruito.
  -- Qualunque divergenza e' un errore bloccante, non un warning.
  select array_agg(distinct uid) into v_expected_users from (
    select applied_user_id as uid from public.founder_grants where applied_user_id is not null
    union
    select user_id as uid from public.user_roles where role = 'pro' and note = 'founder-launch'
  ) src;
  select array_agg(user_id) into v_seated_users from private.founder_seats where user_id is not null;

  select array_agg(u) into v_missing_from_seats
  from unnest(coalesce(v_expected_users, array[]::uuid[])) u
  where u <> all (coalesce(v_seated_users, array[]::uuid[]));

  select array_agg(u) into v_extra_in_seats
  from unnest(coalesce(v_seated_users, array[]::uuid[])) u
  where u <> all (coalesce(v_expected_users, array[]::uuid[]));

  if v_missing_from_seats is not null or v_extra_in_seats is not null then
    raise exception 'founder_p010a backfill: set-equality fallita - mancanti dal ledger: % (count %), extra nel ledger: % (count %). Fermare, non procedere.',
      v_missing_from_seats, coalesce(array_length(v_missing_from_seats, 1), 0),
      v_extra_in_seats, coalesce(array_length(v_extra_in_seats, 1), 0);
  end if;

  raise notice 'founder_p010a backfill: % legacy_allowlist, % legacy_autogrant, % totale, set-equality verificata (fonte = ledger, exact match)',
    v_legacy_count, v_autogrant_count, v_legacy_count + v_autogrant_count;
end $$;

-- ============================================================================
-- 4. Trigger GDPR — BEFORE DELETE ON auth.users, SECURITY DEFINER (owner =
--    chi applica la migration, verificato in Sprint P0.7 su
--    supabase/postgres reale: postgres non e' superuser ma e' membro di
--    supabase_auth_admin, il vero owner di auth.users). Intercetta sia
--    public.gdpr_process_deletions() (migration 20260616090000) sia
--    supabase.auth.admin.deleteUser() diretto.
-- ============================================================================

create or replace function private._anonymize_founder_seat_on_user_delete()
returns trigger
language plpgsql
security definer
set search_path to pg_catalog, private
as $$
begin
  update private.founder_seats
  set user_id = null,
      registered_at = null,
      first_sync_evidence_at = null,
      anonymized_at = now()
  where user_id = old.id;
  return old;
end;
$$;
revoke all on function private._anonymize_founder_seat_on_user_delete() from public, anon, authenticated;

drop trigger if exists trg_anonymize_founder_seat_before_user_delete on auth.users;
create trigger trg_anonymize_founder_seat_before_user_delete
  before delete on auth.users
  for each row execute function private._anonymize_founder_seat_on_user_delete();

-- ============================================================================
-- 5. grant_founder_launch_core esteso IN PLACE — stessa firma, stesso
--    owner implicito, stesso profilo di grant/revoke, stesso contratto di
--    risposta jsonb. Vedi BLOCCO 1/2/3 in testa al file per il dettaglio di
--    ogni sezione NUOVA rispetto a 20260720120247 (live).
-- ============================================================================

create or replace function private.grant_founder_launch_core(p_user_id uuid, p_device_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public, private
as $$
declare
  founder_cap constant int := 1000;
  -- Stesso istante letterale di lib/founder/program-window.ts FOUNDER_END_AT
  -- ("2026-07-31T22:00:00Z" = 2026-08-01T00:00:00+02:00 Europe/Rome). Nessun
  -- meccanismo automatico tiene sincronizzate le due copie (residuo
  -- dichiarato — vedi guardrail founder:window-check).
  founder_cutoff constant timestamptz := '2026-07-31T22:00:00Z'::timestamptz;
  founder_window constant interval := interval '14 days';
  v_rule_version constant text := 'founder_p010a_ledger_v1';
  v_email text;
  v_created_at timestamptz;
  v_first_sync_at timestamptz;
  v_taken int;
  v_reserved_pending int;
  v_founder_number int;
  v_rows int;
  v_outcome text;
begin
  if p_user_id is null or p_device_id is null then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'missing_context'
    );
  end if;

  -- BLOCCO 3: esito gia' stabilito per questo utente — salta le query
  -- fitness_metrics/auth.users/email sottostanti, che servono SOLO a
  -- derivare un esito che qui e' gia' noto. record_first_sync_transition
  -- chiama questa funzione ad OGNI sync 'success' (non solo alla prima,
  -- vedi 20260720055513): senza questo short-circuit ogni sync successiva
  -- di un utente gia' deciso ripete comunque prova-sync + lookup email.
  -- Puramente un riordino: stessa logica, nessun nuovo comportamento.
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null
    );
  end if;
  -- P0.10B: `outcome` E' il notEligibleReason esatto della prima
  -- valutazione (program_closed/window_expired/cap_reached) — restituito
  -- verbatim, mai rimappato. Prima di questa correzione un valore generico
  -- 'not_eligible' veniva sempre riletto come 'window_expired', anche per
  -- un account che era stato originariamente program_closed.
  select outcome into v_outcome from private.founder_evaluations where user_id = p_user_id;
  if v_outcome is not null then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false, 'grantKind', null,
      'capReached', v_outcome = 'cap_reached',
      'notEligibleReason', v_outcome
    );
  end if;

  -- Prova indipendente di sync riuscito (difesa in profondita', invariato
  -- da 20260720055513): raggiunta solo se l'utente non e' ancora deciso.
  if not exists (
    select 1 from public.fitness_metrics
    where user_id = p_user_id and device_id = p_device_id
  ) then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'no_metrics_evidence'
    );
  end if;

  -- Esclusioni allineate a 20260720120247 (LIVE): entrambe
  -- review@fitmesh.fit e appreview.demo@fitmesh.fit, case-insensitive.
  select email, created_at into v_email, v_created_at from auth.users where id = p_user_id;
  if v_email is null or v_email ilike '%.invalid'
    or lower(v_email) = lower('review@fitmesh.fit')
    or lower(v_email) = lower('appreview.demo@fitmesh.fit')
  then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'excluded_account'
    );
  end if;

  -- Difesa in profondita': posto gia' consumato ma user_roles non lo
  -- riflette (bug reale, invariante monitorabile) — mai ri-allocare.
  if exists (select 1 from private.founder_seats where user_id = p_user_id) then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null
    );
  end if;

  perform pg_advisory_xact_lock(hashtext('founder-launch-grant'));

  -- Ricontrollo POST-lock (invariato): race sullo stesso utente, due
  -- device o un retry di rete.
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null
    );
  end if;

  -- BLOCCO 2: cutoff di registrazione, SOLO da auth.users.created_at (mai
  -- un timestamp client). >= perche' una registrazione ESATTAMENTE al
  -- cutoff non e' eligible (simmetrico allo stretto `<` di
  -- isFounderProgramOpen lato TypeScript).
  if v_created_at is null or v_created_at >= founder_cutoff then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'program_closed', v_created_at, v_rule_version)
    on conflict (user_id) do nothing;
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'program_closed'
    );
  end if;

  -- BLOCCO 2: finestra di 14 giorni misurata dalla PRIMA sync REALMENTE
  -- riuscita (devices.first_sync_at, scritta da record_first_sync_transition
  -- PRIMA di chiamare questa funzione, stessa transazione) — mai now() al
  -- momento di QUESTA chiamata: una sync successiva alla prima non puo' mai
  -- cambiare retroattivamente l'esito gia' maturato alla prima sync. Al
  -- limite esatto dei 14 giorni resta eligible (<=).
  select first_sync_at into v_first_sync_at from public.devices where id = p_device_id;
  if v_first_sync_at is null or v_first_sync_at > v_created_at + founder_window then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'window_expired', v_created_at, v_rule_version)
    on conflict (user_id) do nothing;
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'window_expired'
    );
  end if;

  -- BLOCCO 1: cap 1000 sul ledger persistente, comprensivo dei posti
  -- riservati (founder_grants applicati O non applicati — mai assegnabili
  -- all'allocatore, verificato anche a cap pieno).
  select count(*) into v_taken from private.founder_seats;
  select count(*) into v_reserved_pending from public.founder_grants where applied_user_id is null;
  if v_taken + v_reserved_pending >= founder_cap then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'cap_reached', v_created_at, v_rule_version)
    on conflict (user_id) do nothing;
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', true, 'notEligibleReason', 'cap_reached'
    );
  end if;

  v_founder_number := private._next_founder_number();
  if v_founder_number is null then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'cap_reached', v_created_at, v_rule_version)
    on conflict (user_id) do nothing;
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', true, 'notEligibleReason', 'cap_reached'
    );
  end if;

  begin
    insert into private.founder_seats
      (founder_number, user_id, source, registered_at, first_sync_evidence_at, granted_at, rule_version)
    values (v_founder_number, p_user_id, 'verified_sync', v_created_at, v_first_sync_at, now(), v_rule_version);
  exception
    when unique_violation then
      -- Non atteso sotto l'advisory lock: un solo retry, mai un loop illimitato.
      v_founder_number := private._next_founder_number();
      if v_founder_number is null then
        insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
        values (p_user_id, 'cap_reached', v_created_at, v_rule_version)
        on conflict (user_id) do nothing;
        return jsonb_build_object(
          'grantCreated', false, 'alreadyHadEligibleGrant', false,
          'grantKind', null, 'capReached', true, 'notEligibleReason', 'cap_reached'
        );
      end if;
      insert into private.founder_seats
        (founder_number, user_id, source, registered_at, first_sync_evidence_at, granted_at, rule_version)
      values (v_founder_number, p_user_id, 'verified_sync', v_created_at, v_first_sync_at, now(), v_rule_version);
  end;

  insert into public.user_roles (user_id, role, expires_at, note)
  values (p_user_id, 'pro', null, 'founder-launch')
  on conflict (user_id, role) do nothing;
  get diagnostics v_rows = row_count;

  return jsonb_build_object(
    'grantCreated', v_rows > 0, 'alreadyHadEligibleGrant', v_rows = 0,
    'grantKind', case when v_rows > 0 then 'founder-launch' else null end,
    'capReached', false, 'notEligibleReason', null
  );
end;
$$;

revoke all on schema private from public, anon, authenticated;
revoke all on function private.grant_founder_launch_core(uuid, uuid) from public, anon, authenticated;

-- claim_founder_grant_if_eligible() / _apply_founder_grant() /
-- handle_new_founder() — DELIBERATAMENTE NON TOCCATE (residuo gia'
-- dichiarato in Sprint P0.7, coordinamento con l'agente app: il primo e'
-- gia' verificato non sfruttabile via RLS su founder_grants, l'hardening e'
-- rimandato a un giro separato).
--
-- Dopo l'apply: rieseguire get_advisors(security) — verificare che nessuna
-- delle funzioni/tabelle di questo file risulti "SECURITY DEFINER senza
-- search_path fisso" e che private.grant_founder_launch_core /
-- private.founder_seats / private.founder_evaluations non risultino
-- raggiungibili da alcun ruolo pubblico. Verificare inoltre:
-- select count(distinct user_id) from public.user_roles where note =
-- 'founder-launch' PRIMA e DOPO l'apply (deve coincidere con
-- select count(*) from private.founder_seats where user_id is not null
-- DOPO l'apply — il backfill non deve alterare alcuna riga esistente).
