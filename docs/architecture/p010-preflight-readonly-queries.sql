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
-- 1. Snapshot migration history — COMPLETA, non solo la coda (Sprint P0.10E
--    Fase 0: "confrontare tutta la history locale/remota, non soltanto le
--    sei migration RC2"). Eseguire SENZA limit, poi confrontare riga per
--    riga con `ls supabase/migrations/` di questo branch.
-- ============================================================================
select version, name
from supabase_migrations.schema_migrations
order by version asc;
-- Stato noto a oggi (2026-07-28, da esecuzione precedente di Matteo,
-- confermata fino alla coda): ultima versione vista = 20260722145516
-- (workouts_fuzzy_merge_and_race_lock). Le 6 versioni Sprint 189-RC2 subito
-- precedenti risultavano REGISTRATE con timestamp diversi da quelli usati
-- nei nomi file locali originari, ma contenuto normalizzato identico -
-- GIA' RICONCILIATO rinominando i 6 file locali (commit f43a2c1) per farli
-- coincidere esattamente con le versioni remote. 20260728090000 (Founder),
-- 20260728100000 (hardening grant_b2c_trial) e 20260728110000 (entitlement
-- contract) sono le uniche attese come NON ANCORA applicate.
--
-- Questa query da sola pero' NON basta per la Fase 0: mostra solo cosa e'
-- REGISTRATO come applicato, non se il file locale con quella stessa
-- versione ha contenuto identico a quanto realmente eseguito (il caso RC2
-- lo ha dimostrato: stesso contenuto, timestamp diverso, scoperto solo
-- confrontando manualmente). Se possibile, preferire
-- `supabase migration list --linked` invece di questa query: quel comando
-- del CLI confronta Local/Remote fianco a fianco e segnala da solo
-- eventuali divergenze, senza bisogno di un diff manuale come quello fatto
-- per i 6 file RC2. NON eseguire `supabase db push` o qualunque comando che
-- applicherebbe TUTTE le migration pending in un colpo solo: l'obiettivo e'
-- applicare ISOLATAMENTE le 3 migration di questo sprint, mai un push
-- cieco dell'intera coda.

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

-- ============================================================================
-- 14. Sprint P0.10E addendum — le 3 riserve NON passano mai da
--     grant_founder_launch_core (verificato leggendo il testo della
--     migration: founder_grants viene letta SOLO per contare
--     v_reserved_pending, mai per assegnare un founder_number a un
--     `applied_user_id` — quel binding, se avviene, avviene altrove).
--     Chi lo fa e' claim_founder_grant_if_eligible() / _apply_founder_grant()
--     — funzioni MAI create da alcuna migration in questo repo (drift di
--     schema non tracciato, come lo schema `private` stesso). Senza il loro
--     corpo reale non e' possibile confermare che rispettino
--     auth.users.created_at >= cutoff -> mai Founder. QUESTO E' IL BLOCCO
--     PIU' IMPORTANTE DI QUESTO PREFLIGHT: eseguire prima di qualunque GO.
-- ============================================================================
-- ATTENZIONE, QUESTA E' LA QUERY PIU' IMPORTANTE DELL'INTERO PREFLIGHT.
-- Evidenza gia' raccolta (docs/architecture/founder-p0-grant-design-v3.md,
-- branch feat/p11-founder-close-fase0, "Stato live confermato 19-20/07"):
-- il contratto JSON live di questa funzione e'
--   {"eligible": true,  "reason": "granted"}
--   {"eligible": false, "reason": "not_in_allowlist"}
-- cioe' l'UNICO motivo di rifiuto documentato e' "email non in allowlist".
-- Nessun controllo di data. Se il corpo reale lo conferma, un account
-- creato DOPO il cutoff che usa una delle 3 email riservate otterrebbe
-- Founder scavalcando 20260728090000 -> conflitto di specifica, NO-GO,
-- decisione a Matteo (vedi p010-founder-pre-apply-checklist.md).
-- Cercare esplicitamente nel corpo restituito: 'created_at', '2026-07-31',
-- 'cutoff', 'founder_cutoff'. Se non compaiono, il bypass e' confermato.
select pg_get_functiondef(oid) as claim_founder_grant_if_eligible_body,
       p.prosecdef as security_definer,
       r.rolname as owner,
       p.proconfig as search_path_setting
from pg_proc p
join pg_roles r on r.oid = p.proowner
where p.proname = 'claim_founder_grant_if_eligible' and p.pronamespace = 'public'::regnamespace;

select pg_get_functiondef(oid) as apply_founder_grant_body,
       p.prosecdef as security_definer,
       r.rolname as owner
from pg_proc p
join pg_roles r on r.oid = p.proowner
where p.proname = '_apply_founder_grant';
-- Se questa query non trova nulla, il nome esatto potrebbe essere diverso
-- (drift non tracciato = nome non garantito): eseguire anche
--   select proname, pronamespace::regnamespace from pg_proc
--   where proname ilike '%founder%' and pronamespace not in ('private'::regnamespace, 'pg_catalog'::regnamespace);
-- per un elenco completo di TUTTE le funzioni Founder realmente esistenti,
-- comprese quelle mai viste da nessuna migration in git.

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_name in ('claim_founder_grant_if_eligible', '_apply_founder_grant');
-- Se anon/authenticated/PUBLIC compaiono qui E il corpo sopra non verifica
-- esplicitamente auth.users.created_at contro il cutoff, esiste un
-- percorso per cui un account creato DOPO il cutoff potrebbe ottenere
-- Founder tramite una delle 3 email riservate — conflitto di specifica,
-- fermarsi con NO-GO senza decidere autonomamente (istruzione esplicita
-- di Matteo, Sprint P0.10E Fase 2).

-- Ri-verifica handle_new_founder() (questa e' TRACCIATA da una migration
-- in git, 20260610120002 — ma la produzione potrebbe averla modificata
-- fuori banda come founder_grants/schema private: non assumere che
-- coincida con git senza controllare). Attesa: RETURNS TRIGGER (Postgres
-- rifiuta l'invocazione diretta via RPC anche se EXECUTE fosse concesso a
-- PUBLIC — verificare comunque che il trigger on_profile_created_founder
-- risulti assente, gia' controllato al punto 9).
select pg_get_functiondef('public.handle_new_founder()'::regprocedure) as handle_new_founder_body_live;

-- ============================================================================
-- 15. Sprint P0.10E addendum — grant_b2c_trial(): audit corretto (non e' B2B/
--     gym, e' il trial B2C 7gg legacy in b2c_subscriptions). L'agente app ha
--     confermato zero caller in Flutter/Kotlin/Swift/backend/git history: il
--     trial reale e' applicativo, 14gg da auth.users.created_at, non passa
--     mai da questa funzione. Verificare comunque runtime/ACL reali prima
--     dell'hardening (migration separata 20260728100000, gia' preparata,
--     NON ancora applicata).
-- ============================================================================
select pg_get_functiondef('public.grant_b2c_trial()'::regprocedure) as grant_b2c_trial_body_live;

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_name = 'grant_b2c_trial';
-- Se questa NON mostra piu' anon/authenticated dopo l'apply di
-- 20260728100000, l'hardening ha funzionato. PRIMA dell'apply, atteso che
-- li mostri ancora (coerente con l'advisor P0.10D: "ancora eseguibile da
-- PUBLIC/anon/authenticated").

-- Uso runtime recente, senza PII: SOLO conteggio e ultima data, mai
-- user_id/email.
select count(*) as trial_rows_total,
       count(*) filter (where state = 'active') as trial_rows_active,
       max(created_at) as most_recent_trial_row_created_at
from public.b2c_subscriptions
where billing_source = 'trial';
-- Se most_recent_trial_row_created_at e' recente (giorni, non mesi), il
-- codice "orfano lato app" viene comunque invocato da qualcosa (un client
-- vecchio ancora installato, un cron, un test manuale) — da investigare
-- PRIMA di considerare l'hardening a rischio zero, anche se la conferma
-- app dice "nessun caller mobile trovato".

-- Idempotenza/ripetibilita' (risposta strutturale, gia' letta dal corpo in
-- git): `insert ... on conflict (user_id) do nothing` su una PK
-- (user_id) — una seconda chiamata per lo stesso utente non inserisce
-- nulla e ritorna false. Non e' quindi possibile riottenere o estendere i
-- 7 giorni chiamandola piu' volte. Resta pero' possibile ottenere le 7
-- giorni UNA VOLTA senza mai essere passati dal vero trial applicativo, se
-- authenticated ha ancora EXECUTE — da qui l'hardening, non perche' sia
-- "abusabile ripetutamente" (non lo e').

-- ============================================================================
-- 16. Sprint P0.10E addendum — valori REALI di user_roles.note per role='pro'
--     (mai vincolati da un CHECK constraint, mai creati da una migration in
--     git per i valori 'grandfather-prelaunch'/'beta-tester...' — servono
--     per confermare/correggere il match `note ilike '%grandfather%'` usato
--     da public.get_entitlement_status(), migration 20260728110000).
-- ============================================================================
select note, count(*)
from public.user_roles
where role = 'pro'
group by note
order by count(*) desc;
-- Se compare un valore che dovrebbe essere "grandfather" ma non contiene
-- letteralmente quella parola (es. 'pre-lancio', 'early-access'), il
-- pattern ilike '%grandfather%' in get_entitlement_status va corretto
-- PRIMA di applicare 20260728110000 — altrimenti quegli utenti finiscono
-- nel bucket 'lifetime' invece di 'grandfather' (esito comunque permanente
-- e non-Founder, non un bug di sicurezza, ma non fedele al contratto).

-- ============================================================================
-- 17. Sprint P0.10E-B/C/D/E addendum — verifiche prima di applicare la
--     migration riserve corretta (20260729120000).
--
-- 17a e 17c: PASS, confermati da Matteo il 2026-07-29 via lettura diretta:
--   - owner di claim_founder_grant_if_eligible/_apply_founder_grant/
--     handle_new_founder/grant_founder_launch_core: postgres per tutte e
--     quattro;
--   - public.b2c_subscriptions: owner postgres, e postgres ha
--     SELECT/INSERT/UPDATE/DELETE (non solo UPDATE per il FOR UPDATE del
--     wrapper — anche INSERT, ora necessario perche' la barriera atomica
--     P0.10E-D dentro _apply_founder_grant fa un INSERT reale, non solo
--     un UPDATE).
-- Le query sotto restano nel file come RIPETIZIONE da eseguire nel
-- dry-run immediatamente prima dell'apply (i privilegi potrebbero
-- cambiare fra oggi e l'apply — non assumere che PASS oggi significhi
-- PASS per sempre), non piu' come blocco aperto.
-- ============================================================================

select p.proname,
       pg_get_userbyid(p.proowner) as owner,
       p.pronamespace::regnamespace as schema
from pg_proc p
where p.proname = 'claim_founder_grant_if_eligible'
  and p.pronamespace = 'public'::regnamespace;

select tableowner
from pg_tables
where schemaname = 'public' and tablename = 'b2c_subscriptions';

select has_table_privilege('postgres', 'public.b2c_subscriptions', 'SELECT') as postgres_can_select,
       has_table_privilege('postgres', 'public.b2c_subscriptions', 'INSERT') as postgres_can_insert,
       has_table_privilege('postgres', 'public.b2c_subscriptions', 'UPDATE') as postgres_can_update;
-- Atteso: tutti e tre true. Se uno risulta false rispetto a oggi
-- (2026-07-29), FERMARSI: la migration fallirebbe con un errore esplicito
-- di permesso negato su OGNI claim pre-cutoff/in-finestra, non solo le 3
-- riserve — fail loud, non un bypass di sicurezza, ma un'interruzione del
-- servizio.

-- 17b. BLOCCO 3 — RISOLTO in ENTRAMBE le direzioni in Sprint P0.10E-D
-- (precheck nel wrapper + barriera atomica whitelist dentro
-- _apply_founder_grant, riscritta), CONVENZIONE DI VALORI CORRETTA in
-- Sprint P0.10E-E dopo che Matteo ha letto il corpo live per intero e
-- ispezionato le 18 righe founder_grant reali: la convenzione dedotta per
-- analogia in P0.10E-D (fitmesh_founder_grant/founder-<user_id>/
-- 9999-12-31, nessun raw_payload) NON corrispondeva a NESSUNA delle 18
-- righe live. La versione P0.10E-E usa invece esattamente: external_
-- product_id='lifetime_founder', external_subscription_id=
-- 'founder_grant_'||founder_number, active_until='2099-12-31 23:59:59+00',
-- raw_payload completo (founder_number/grant_email/granted_at/
-- source='rpc_claim'). Ripristina anche l'allowlist reale (SELECT ... FOR
-- UPDATE su founder_grants, null-check) che P0.10E-D aveva perso senza
-- saperlo. Vedi la migration e il checklist per il dettaglio completo.
--
-- La DDL reale di b2c_subscriptions NON e' piu' un'incognita da verificare
-- qui: e' gia' TRACCIATA in questo stesso repo,
-- supabase/migrations/20260514120004_init_b2c_subs.sql (trovata in review
-- avversariale su P0.10E-D, dopo che la prima bozza della barriera atomica
-- falliva "null value in column external_product_id" contro di essa — un
-- errore di processo, non solo di codice, non cercare la DDL altrove prima
-- di scrivere codice che la assume). Colonne NOT NULL rilevanti:
-- external_product_id, external_subscription_id, active_until (nessun
-- default), auto_renewing (default true, valore corretto per un grant
-- founder e' false). CHECK live su billing_source include 'founder_grant'
-- (assente nella migration TRACCIATA — aggiunto da un ALTER non tracciato
-- in produzione, confermato indirettamente dalle 18 righe reali con questo
-- valore). UNIQUE(billing_source, external_subscription_id) oltre al PK su
-- user_id — la barriera in _apply_founder_grant gestisce ENTRAMBI gli
-- indici (blocco BEGIN/EXCEPTION WHEN unique_violation), ma da P0.10E-E
-- distingue quale vincolo e' stato violato via GET STACKED DIAGNOSTICS +
-- CONSTRAINT_NAME (solo b2c_subscriptions_pkey e
-- b2c_subscriptions_billing_source_external_subscription_id_key sono
-- trattati come "riga gia' esistente" — qualunque altro vincolo fa RAISE,
-- non e' piu' un blanket WHEN unique_violation come in P0.10E-D).
--
-- Questa query resta utile per CONFERMARE (non piu' per progettare un fix)
-- che nessun ALTER successivo abbia cambiato ulteriormente lo schema
-- rispetto a quanto appena descritto:
select pg_get_functiondef('public._apply_founder_grant(uuid, text)'::regprocedure) as apply_founder_grant_full_body;
-- Il corpo live va confrontato con l'MD5 5c7649b942f04234c31d3c7961c4c6a0
-- (gia' verificato da Matteo) — se non corrisponde piu' al momento
-- dell'apply, il guard nella migration stessa abortisce comunque prima di
-- qualunque modifica: questa query e' per capire PERCHE', non per
-- sbloccare l'apply.

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'b2c_subscriptions'
order by ordinal_position;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.b2c_subscriptions'::regclass;
-- Cercare in particolare: che billing_source ammetta ancora 'founder_grant'
-- (whitelist della barriera atomica lo assume), che le colonne NOT NULL
-- elencate sopra siano ancora tali con gli stessi nomi, e che
-- UNIQUE(billing_source, external_subscription_id) esista ancora accanto
-- al PK su user_id.
