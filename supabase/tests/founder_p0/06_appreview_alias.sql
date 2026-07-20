-- Copre la migration 20260720094500_founder_launch_exclude_review_email_alias.sql:
-- l'account App Review canonico in produzione e' review@fitmesh.fit (non
-- appreview.demo@fitmesh.fit, mai esistito con quel nome in produzione —
-- vedi il commento della migration). Entrambi restano esclusi dal grant,
-- case-insensitive; il ruolo pro gia' presente di review@fitmesh.fit non
-- va mai toccato.
--
-- Richiede, in ordine, sullo stesso container: 01_schema.sql, 02_functions.sql
-- (o la migration P0 originale), poi la migration
-- 20260720094500_founder_launch_exclude_review_email_alias.sql, poi
-- 03_tests.sql (definisce test.assert/test.mkuser/test.mkdevice), poi questo
-- file.
\set ON_ERROR_STOP 0
\pset pager off

-- Simula lo stato reale di produzione: review@fitmesh.fit ha gia' pro:founder-launch
-- (concesso dal vecchio trigger prima del 15/07).
select test.mkuser('review@fitmesh.fit') as u_review \gset
select test.mkdevice(:'u_review'::uuid, 'review-iphone16-jsmith-001') as d_review \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u_review'::uuid, :'d_review'::uuid);
insert into public.user_roles(user_id, role, note) values (:'u_review'::uuid, 'pro', 'founder-launch');

\echo '=== TEST A: review@fitmesh.fit gia pro -> stesso ordine gia usato per i grandfather .invalid (esclusione prima del fast-path), MA il ruolo resta intatto e mai duplicato ==='
select test.assert(
  (private.grant_founder_launch_core(:'u_review'::uuid, :'d_review'::uuid) ->> 'notEligibleReason') = 'excluded_account',
  'TEST A1 review@fitmesh.fit: la chiamata riporta excluded_account (stesso ordine gia in uso per .invalid), MAI grantCreated'
);
select test.assert(
  (select count(*) from public.user_roles where user_id = :'u_review'::uuid and role = 'pro') = 1,
  'TEST A2 review@fitmesh.fit ha ESATTAMENTE 1 riga pro dopo la chiamata (ruolo non toccato/duplicato/rimosso)'
);

-- Simula il caso ipotetico: review@fitmesh.fit perde il ruolo e risincronizza da zero.
delete from public.user_roles where user_id = :'u_review'::uuid;
\echo '=== TEST B: review@fitmesh.fit SENZA ruolo pro -> escluso, mai un nuovo grant ==='
select test.assert(
  private.grant_founder_launch_core(:'u_review'::uuid, :'d_review'::uuid) = jsonb_build_object(
    'grantCreated', false, 'alreadyHadEligibleGrant', false,
    'grantKind', null, 'capReached', false, 'notEligibleReason', 'excluded_account'
  ),
  'TEST B review@fitmesh.fit senza ruolo pregresso -> excluded_account (mai grantCreated)'
);
select test.assert(
  (select count(*) from public.user_roles where user_id = :'u_review'::uuid and role = 'pro') = 0,
  'TEST B2 nessun ruolo pro creato per review@fitmesh.fit'
);

\echo '=== TEST C: alias storico appreview.demo@fitmesh.fit -> escluso ==='
select test.mkuser('appreview.demo@fitmesh.fit') as u_alias \gset
select test.mkdevice(:'u_alias'::uuid, 'alias-device') as d_alias \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u_alias'::uuid, :'d_alias'::uuid);
select test.assert(
  (private.grant_founder_launch_core(:'u_alias'::uuid, :'d_alias'::uuid) ->> 'notEligibleReason') = 'excluded_account',
  'TEST C appreview.demo@fitmesh.fit (alias storico) -> excluded_account'
);

\echo '=== TEST D: case-insensitive su entrambi ==='
select test.mkuser('Review@FitMesh.Fit') as u_case1 \gset
select test.mkdevice(:'u_case1'::uuid, 'case1-device') as d_case1 \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u_case1'::uuid, :'d_case1'::uuid);
select test.assert(
  (private.grant_founder_launch_core(:'u_case1'::uuid, :'d_case1'::uuid) ->> 'notEligibleReason') = 'excluded_account',
  'TEST D1 Review@FitMesh.Fit (case diverso) -> excluded_account'
);
select test.mkuser('APPREVIEW.DEMO@FITMESH.FIT') as u_case2 \gset
select test.mkdevice(:'u_case2'::uuid, 'case2-device') as d_case2 \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u_case2'::uuid, :'d_case2'::uuid);
select test.assert(
  (private.grant_founder_launch_core(:'u_case2'::uuid, :'d_case2'::uuid) ->> 'notEligibleReason') = 'excluded_account',
  'TEST D2 APPREVIEW.DEMO@FITMESH.FIT (maiuscolo) -> excluded_account'
);

\echo '=== TEST E: nessuna regressione, un utente normale eleggibile riceve ancora il grant ==='
select test.mkuser('utente.normale@example.com') as u_normal \gset
select test.mkdevice(:'u_normal'::uuid, 'normal-device') as d_normal \gset
insert into public.fitness_metrics(user_id, device_id) values (:'u_normal'::uuid, :'d_normal'::uuid);
select test.assert(
  (private.grant_founder_launch_core(:'u_normal'::uuid, :'d_normal'::uuid) ->> 'grantCreated')::boolean = true,
  'TEST E utente normale riceve ancora il grant (nessuna regressione)'
);
