-- Sprint P0.10D — Preflight produzione READ-ONLY per la migration
-- 20260728090000_founder_launch_cutoff_and_window.sql.
--
-- QUESTO FILE NON E' MAI STATO ESEGUITO CONTRO PRODUZIONE: nessun accesso
-- Supabase autenticato disponibile da questa sessione (MCP Supabase non
-- autorizzato, ambiente non-interattivo, nessuna credenziale nel repo).
-- Da eseguire manualmente (SQL editor Supabase o `psql` con connection
-- string reale) da chi ha accesso, poi incollare l'output di nuovo qui
-- perche' io possa confrontarlo con le assunzioni della migration e dare
-- un GO/NO-GO basato su dati reali invece che su quanto atteso.
--
-- Interamente SELECT/lettura di catalogo — zero INSERT/UPDATE/DELETE/DDL.
-- Sicuro da eseguire quante volte serve, in qualunque ordine.

-- ============================================================================
-- 1. Snapshot migration history
-- ============================================================================
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 20;
-- Atteso: l'ultima versione applicata e' 20260720120247. Qualunque versione
-- successiva non presente in supabase/migrations/ di questo branch e' un
-- segnale di STOP immediato (un'altra sessione ha applicato qualcosa di
-- non tracciato qui).

-- ============================================================================
-- 2. DDL reale di public.founder_grants
-- ============================================================================
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'founder_grants'
order by ordinal_position;

select conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.founder_grants'::regclass;

select polname, permissive, roles, cmd,
       pg_get_expr(qual, polrelid) as using_expr,
       pg_get_expr(with_check, polrelid) as with_check_expr
from pg_policy
where polrelid = 'public.founder_grants'::regclass;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'founder_grants'
order by grantee, privilege_type;
-- Atteso: email text PK, founder_number integer not null unique,
-- applied_user_id uuid nullable FK auth.users, applied_at timestamptz
-- nullable. RLS attiva, nessuna policy per anon/authenticated. Se la
-- forma reale diverge (nomi colonna, tipo, nullability), la migration
-- CREATE TABLE IF NOT EXISTS resta comunque un no-op — ma i controlli piu'
-- sotto (§7, §12) vanno ricalcolati sulla forma VERA, non su quella attesa.

-- ============================================================================
-- 3. DDL/ACL/owner di private.grant_founder_launch_core (baseline pre-apply)
-- ============================================================================
select pg_get_functiondef('private.grant_founder_launch_core(uuid, uuid)'::regprocedure) as current_live_body;
-- SALVARE questo output testuale da qualche parte PRIMA di applicare: e' il
-- corpo esatto che un rollback di emergenza deve poter ripristinare
-- verbatim (dovrebbe coincidere con supabase/migrations/20260720120247_*.sql
-- gia' in git — se non coincide, quel file non riflette piu' la realta' e
-- va aggiornato PRIMA di considerare qualunque apply).

select p.proname, r.rolname as owner, p.prosecdef as security_definer,
       p.proconfig as search_path_setting
from pg_proc p
join pg_roles r on r.oid = p.proowner
where p.pronamespace = 'private'::regnamespace;

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_name = 'grant_founder_launch_core';
-- Atteso: nessuna riga per anon/authenticated/public (nessun ruolo pubblico
-- puo' chiamarla direttamente).

-- ============================================================================
-- 4. DDL di record_first_sync_transition
-- ============================================================================
select pg_get_functiondef('public.record_first_sync_transition(text, text, text, text)'::regprocedure) as current_live_body;

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_name = 'record_first_sync_transition';
-- Atteso: authenticated ha EXECUTE, anon NO (revocato da 20260714123833).
-- Verificare che il corpo chiami davvero private.grant_founder_launch_core
-- (il contratto che questa migration estende in place).

-- ============================================================================
-- 5. Conteggio user_roles Founder
-- ============================================================================
select count(*) as rows_total,
       count(distinct user_id) as distinct_users
from public.user_roles
where role = 'pro' and note = 'founder-launch';
-- Se rows_total != distinct_users, esiste piu' di una riga (user_id, role)
-- per lo stesso utente con la stessa nota — non dovrebbe essere possibile
-- (PK/unique su (user_id, role)), ma verificarlo comunque prima di fidarsi
-- del conteggio "Founder attuali".

-- ============================================================================
-- 6. Conteggio founder_grants applicati e riservati
-- ============================================================================
select
  count(*) as total,
  count(*) filter (where applied_user_id is not null) as applied,
  count(*) filter (where applied_user_id is null) as reserved_pending
from public.founder_grants;
-- Assunzione della migration/report P0.10A: ~21 totali, 3 riservati.
-- USARE IL NUMERO VERO qui per ricalcolare il cap residuo (1000 - ledger -
-- reserved_pending), non quello assunto.

-- ============================================================================
-- 7. Controllo collisioni founder_number
-- ============================================================================
-- 7a. Duplicati DENTRO founder_grants stessa (non dovrebbe essere possibile
--     con UNIQUE, ma verificarlo a costo zero).
select founder_number, count(*)
from public.founder_grants
group by founder_number
having count(*) > 1;

-- 7b. Il backfill assegna founder_number IN ORDINE a partire da 1 alle righe
--     legacy_autogrant, saltando i numeri gia' in founder_grants — questa
--     query mostra se qualche numero "libero" secondo founder_grants e' in
--     realta' gia' preso da un conteggio di controllo indipendente (nessuna
--     tabella private.founder_seats esiste ancora in produzione, quindi
--     l'unica fonte di verita' PRE-apply e' founder_grants stessa).
select gs as would_be_candidate
from generate_series(1, 20) gs
where gs not in (select coalesce(founder_number, -1) from public.founder_grants)
order by gs
limit 5;
-- Solo informativo: mostra i primi numeri che l'allocatore userebbe per i
-- primi utenti legacy_autogrant nel backfill.

-- ============================================================================
-- 8. Utenti Founder presenti in una fonte ma assenti nelle altre
-- ============================================================================
-- 8a. In user_roles(founder-launch) ma SENZA una riga applicata in
--     founder_grants corrispondente (percorso "legacy_autogrant" atteso dal
--     backfill).
select ur.user_id, u.email, u.created_at
from public.user_roles ur
join auth.users u on u.id = ur.user_id
where ur.role = 'pro' and ur.note = 'founder-launch'
  and not exists (
    select 1 from public.founder_grants fg where fg.applied_user_id = ur.user_id
  )
order by u.created_at;

-- 8b. In founder_grants (applicati) ma SENZA la riga corrispondente in
--     user_roles(founder-launch) — anomalia: un grant "applicato" secondo
--     l'allowlist ma senza il ruolo pro effettivo. Se questa query
--     restituisce righe, e' un problema di integrita' PRE-esistente da
--     investigare PRIMA dell'apply (il backfill lo inserirebbe comunque nel
--     ledger, ma vale la pena capire perche' e' successo).
select fg.email, fg.founder_number, fg.applied_user_id, fg.applied_at
from public.founder_grants fg
where fg.applied_user_id is not null
  and not exists (
    select 1 from public.user_roles ur
    where ur.user_id = fg.applied_user_id and ur.role = 'pro' and ur.note = 'founder-launch'
  );

-- ============================================================================
-- 9. Trigger su auth.users e public.devices
-- ============================================================================
select tgname, tgrelid::regclass as table_name, tgenabled, pg_get_triggerdef(oid)
from pg_trigger
where tgrelid in ('auth.users'::regclass, 'public.devices'::regclass, 'public.profiles'::regclass)
  and not tgisinternal;
-- Attesi: nessun trigger 'trg_anonymize_founder_seat_before_user_delete' su
-- auth.users (la migration lo crea); nessun 'on_profile_created_founder' su
-- profiles (guardia anti-regressione della migration — se esiste, la
-- migration fallisce volutamente con errore esplicito). Su devices: nessun
-- trigger e' atteso dalla migration Founder — se ne esiste uno non
-- documentato qui, verificare che non interferisca con la scrittura di
-- first_sync_at fatta da record_first_sync_transition.

-- ============================================================================
-- 10. Schema private: esistenza, owner, privilegi
-- ============================================================================
select schema_name, schema_owner
from information_schema.schemata
where schema_name = 'private';

select grantee, privilege_type
from information_schema.role_usage_grants
where object_schema = 'private' and object_name = 'private' and object_type = 'SCHEMA';

-- Se lo schema NON esiste ancora, la migration lo crea (create schema if
-- not exists) — non un errore, solo un dato da confermare prima di
-- applicare (conferma che il gap "schema private non tracciato da nessuna
-- migration in git" e' reale e non un refuso di sessioni precedenti).

-- ============================================================================
-- 11. Security advisor / performance advisor
-- ============================================================================
-- NON eseguibile via SQL puro: e' una funzionalita' Supabase Dashboard
-- (Database -> Advisors) o Management API (get_advisors), non una query.
-- Da eseguire manualmente PRIMA e DOPO l'apply, stesso protocollo gia'
-- usato per 20260720055513 (commit 827e12c, Sprint P0.7 §6). Verificare
-- che nessuna funzione/tabella di questa migration compaia come nuovo
-- finding (in particolare "SECURITY DEFINER senza search_path fisso",
-- "RLS enabled senza policy").

-- ============================================================================
-- 12. Stima esatta delle righe che il backfill inserirebbe (dry-run, SELECT puro)
-- ============================================================================
-- Riproduce ESATTAMENTE la logica del backfill della migration (Passo A:
-- legacy_allowlist, Passo B: legacy_autogrant) senza scrivere nulla.
with legacy_allowlist as (
  select fg.applied_user_id as user_id, fg.founder_number, u.created_at as registered_at
  from public.founder_grants fg
  join auth.users u on u.id = fg.applied_user_id
  where fg.applied_user_id is not null
),
legacy_autogrant as (
  select ur.user_id, u.created_at as registered_at
  from public.user_roles ur
  join auth.users u on u.id = ur.user_id
  where ur.role = 'pro' and ur.note = 'founder-launch'
    and not exists (select 1 from legacy_allowlist la where la.user_id = ur.user_id)
)
select
  (select count(*) from legacy_allowlist) as legacy_allowlist_rows,
  (select count(*) from legacy_autogrant) as legacy_autogrant_rows,
  (select count(*) from legacy_allowlist) + (select count(*) from legacy_autogrant) as backfill_total_rows;
-- Questo e' il numero ESATTO di righe che private.founder_seats avrebbe
-- subito dopo l'apply, prima di qualunque nuovo grant organico. Deve
-- coincidere con quanto stampato da `raise notice` durante l'apply reale
-- (il backfill lo logga) — se non coincide, qualcosa e' cambiato tra la
-- lettura di questo snapshot e il momento dell'apply (altro traffico
-- concorrente), non necessariamente un errore ma da annotare nel report
-- post-apply.

-- ============================================================================
-- 13. Verifica che la migration non modifichi ruoli/entitlement esistenti
-- ============================================================================
-- Non una query — verificato leggendo il testo della migration stessa
-- (supabase/migrations/20260728090000_founder_launch_cutoff_and_window.sql):
-- l'unica scrittura su public.user_roles e' un `insert ... on conflict
-- (user_id, role) do nothing` dentro grant_founder_launch_core (mai
-- raggiunta per un utente gia' pro, per costruzione del fast-path) — zero
-- UPDATE, zero DELETE su user_roles o founder_grants in tutto il file.
-- Query di CONFERMA indipendente (conta righe PRIMA dell'apply, da
-- ripetere identica DOPO — deve risultare invariata):
select count(*) as user_roles_founder_launch_before
from public.user_roles where role = 'pro' and note = 'founder-launch';

select count(*) as founder_grants_before
from public.founder_grants;
