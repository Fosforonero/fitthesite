-- ─────────────────────────────────────────────────────────
-- Migration — HRV historical correction: reclassify ambiguous iOS rows
-- Sprint 187B Phase 2 review, Gap 4 + closure item 2 (private backup).
--
-- ⚠️ REVIEW ONLY — DO NOT APPLY. Not run from this session (no DB access;
-- would also violate the agreed rollout order regardless). Bounded, sourced
-- from a READ-ONLY aggregate audit — see counts below, current as of the
-- audit date, NOT re-verified live from this session.
--
-- ─────────────────────────────────────────────────────────
-- PREREQUISITE — must NOT run before this is true
-- ─────────────────────────────────────────────────────────
-- This migration must be the LAST step of the HRV rollout, applied only
-- after:
--   1. 20260711120000_fitness_metrics_hrv_sdnn.sql is applied (hrv_sdnn
--      column exists).
--   2. The backend route deploy (schema.ts/route.ts, this branch — includes
--      the legacy-iOS server-side normalization, closure item 1) is live
--      and confirmed writing hrv_sdnn for HealthKit/Apple Health rows on
--      BOTH old and new app versions (normalizedHrv() covers old clients
--      too, so this no longer depends on the mobile 187 build being out).
--   3. One legacy-shaped and one 187-shaped iOS payload have been verified
--      end to end against the deployed route.
-- Reclassifying HISTORY before the write path is confirmed live would
-- immediately start accumulating new ambiguous hrv_rmssd rows from iOS
-- again — the correction would be re-needed within days.
--
-- ─────────────────────────────────────────────────────────
-- PROBLEM
-- ─────────────────────────────────────────────────────────
-- Before this sprint, iOS (HealthKit/Apple Health) SDNN samples were
-- written into hrv_rmssd (the only column that existed), indistinguishable
-- from genuine RMSSD rows from Health Connect/Oura/Suunto. A read-only
-- aggregate audit (source IN ('healthkit','apple_health') AND hrv_rmssd IS
-- NOT NULL) found:
--   - source = 'healthkit':     67 rows, 6 distinct users
--   - source = 'apple_health':  14 rows, 1 distinct user
-- These counts are a point-in-time snapshot from the audit — re-run the
-- "PRE-CHECK" query below before applying to get current, authoritative
-- numbers (more rows likely exist by application time from ongoing sync
-- on old app versions still in the field).
--
-- Scope discipline: ONLY source IN ('healthkit','apple_health') rows are
-- touched. Health Connect/Oura/Suunto/ring rows (genuine RMSSD) are never
-- read or written by this migration — the WHERE clause below is the only
-- thing that makes this migration safe, do not loosen it. Must match
-- IOS_HRV_SOURCES in fitthesite/app/api/v1/sync/schema.ts exactly.
--
-- ─────────────────────────────────────────────────────────
-- PRIVATE SCHEMA — backup holds real HRV values, must never be Data-API
-- reachable. `public` schema tables are exposed by PostgREST by default;
-- `private` is NOT in Supabase's exposed-schema list, and every grant
-- below is revoked explicitly as defense in depth (belt and suspenders,
-- not "it's fine because nobody granted it yet"). Precedent: `private`
-- schema already exists in this project, created by
-- 20260522120007_anonymize_left_members_cron.sql — reused, not
-- redefined.
-- ─────────────────────────────────────────────────────────
create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

-- ─────────────────────────────────────────────────────────
-- STEP 0 — PRE-CHECK (read-only, run and record output before proceeding)
-- ─────────────────────────────────────────────────────────
select
  source,
  count(*) as rows_with_hrv_rmssd,
  count(*) filter (where hrv_sdnn is not null) as rows_already_have_sdnn,
  count(distinct user_id) as distinct_users
from public.fitness_metrics
where source in ('healthkit', 'apple_health')
  and hrv_rmssd is not null
group by source
order by source;

-- Expect exactly 2 rows (healthkit, apple_health) close to the audit
-- counts above (67/14 pre-existing + whatever synced since). If
-- rows_already_have_sdnn > 0 for either source, those specific rows
-- (dual-valued: a genuine SDNN sample already landed correctly post-fix,
-- AND an old ambiguous hrv_rmssd value from before) are EXCLUDED from the
-- copy (`where hrv_sdnn is null` in STEP 2) — their hrv_rmssd is nulled in
-- STEP 3 regardless, since it's still an ambiguous historical value, but
-- nothing overwrites their already-correct hrv_sdnn.

-- ─────────────────────────────────────────────────────────
-- STEP 1 — BACKUP (required before STEP 2/3 — this is how rollback works)
-- ─────────────────────────────────────────────────────────
-- Snapshot of every row this migration will touch, BEFORE any write. Only
-- id/source/original HRV fields — no user_id, no other columns: `id` alone
-- is enough to restore into fitness_metrics, and the backup shouldn't
-- carry any more sensitive surface than it needs to. Precise rollback
-- source of truth — do not attempt to reverse the transformation
-- heuristically (e.g. "copy hrv_sdnn back to hrv_rmssd"), that would
-- incorrectly touch rows that had hrv_sdnn already populated and were
-- correctly excluded from STEP 2's copy.
--
-- Plain CREATE TABLE, deliberately NOT "if not exists": if this table
-- already exists, STOP and investigate (a prior run was interrupted after
-- STEP 1 but before completion, or this migration is being re-run by
-- mistake) — do not silently reuse a possibly-partial backup as if it
-- were complete. Drop it explicitly first only after confirming what it
-- contains and that discarding it is safe.
create table private.fitness_metrics_hrv_correction_backup_20260711 as
select id, source, hrv_rmssd as original_hrv_rmssd, hrv_sdnn as original_hrv_sdnn
from public.fitness_metrics
where source in ('healthkit', 'apple_health')
  and hrv_rmssd is not null;

revoke all on private.fitness_metrics_hrv_correction_backup_20260711 from public;
revoke all on private.fitness_metrics_hrv_correction_backup_20260711 from anon;
revoke all on private.fitness_metrics_hrv_correction_backup_20260711 from authenticated;

-- Sanity: row count here must match STEP 0's rows_with_hrv_rmssd sum.
select count(*) from private.fitness_metrics_hrv_correction_backup_20260711;

-- ─────────────────────────────────────────────────────────
-- STEP 2 — copy hrv_rmssd -> hrv_sdnn, ONLY where hrv_sdnn is currently null
-- ─────────────────────────────────────────────────────────
update public.fitness_metrics
set hrv_sdnn = hrv_rmssd
where source in ('healthkit', 'apple_health')
  and hrv_rmssd is not null
  and hrv_sdnn is null;

-- ─────────────────────────────────────────────────────────
-- STEP 3 — null the now-reclassified hrv_rmssd on every touched row
-- ─────────────────────────────────────────────────────────
-- Kept as a separate statement from STEP 2 for auditability, not because
-- combining them would be unsafe (a single `SET hrv_sdnn = coalesce(
-- hrv_sdnn, hrv_rmssd), hrv_rmssd = null` would read the same pre-update
-- row values in Postgres). Two steps means STEP 2's row count and STEP 3's
-- row count are each independently checkable against STEP 0/STEP 1 before
-- moving on — STEP 3 is the one that actually erases data, worth isolating
-- for review. Selects by id from the STEP 1 backup, not by re-deriving the
-- condition, so it is unaffected by whatever STEP 2 just changed.
update public.fitness_metrics
set hrv_rmssd = null
where source in ('healthkit', 'apple_health')
  and id in (select id from private.fitness_metrics_hrv_correction_backup_20260711);

-- ─────────────────────────────────────────────────────────
-- STEP 4 — POST-CHECK (read-only, scoped to the exact backed-up ids —
-- NEVER an aggregate/total comparison, which would be thrown off by any
-- unrelated row that happens to have hrv_sdnn set for another reason)
-- ─────────────────────────────────────────────────────────
select
  count(*) as backup_row_count,
  count(*) filter (
    where fm.hrv_rmssd is not null
  ) as backed_up_rows_still_with_hrv_rmssd,
  count(*) filter (
    where fm.hrv_sdnn is not null
  ) as backed_up_rows_now_with_hrv_sdnn
from private.fitness_metrics_hrv_correction_backup_20260711 b
join public.fitness_metrics fm on fm.id = b.id;

-- Expect: backed_up_rows_still_with_hrv_rmssd = 0 (every backed-up row was
-- nulled) and backed_up_rows_now_with_hrv_sdnn = backup_row_count (every
-- backed-up row now has a value in hrv_sdnn, either freshly copied in
-- STEP 2 or already there pre-migration). If the join returns FEWER rows
-- than backup_row_count on its own (missing join matches), a backed-up row
-- was deleted between STEP 1 and STEP 4 — investigate before trusting the
-- other two counts.

-- ─────────────────────────────────────────────────────────
-- ROLLBACK — restores exact pre-migration state from the STEP 1 backup
-- ─────────────────────────────────────────────────────────
-- update public.fitness_metrics fm
-- set hrv_rmssd = b.original_hrv_rmssd,
--     hrv_sdnn = b.original_hrv_sdnn
-- from private.fitness_metrics_hrv_correction_backup_20260711 b
-- where fm.id = b.id;
--
-- Keep the backup table after a successful migration (do not drop it in
-- this file) — it is the only rollback path and costs 81 rows of storage
-- as of the audit. Drop manually, explicitly, only after Matteo confirms
-- the correction is final and no rollback will be needed (suggest: after
-- one full release cycle with no reported HRV regressions).
