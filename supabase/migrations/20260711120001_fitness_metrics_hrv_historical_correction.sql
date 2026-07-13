-- ─────────────────────────────────────────────────────────
-- Migration — HRV historical correction: reclassify ambiguous iOS rows
-- Sprint 187B Phase 2 review, Gap 4.
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
--   2. The backend route deploy (schema.ts/route.ts, this branch) is live
--      and confirmed writing hrv_sdnn for new HealthKit/Apple Health rows
--      (i.e. NEW rows from iOS sources no longer land in hrv_rmssd).
--   3. The mobile 187 build with hrv_sdnn support is out and syncing.
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
-- thing that makes this migration safe, do not loosen it.
--
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
-- Snapshot of every row this migration will touch, BEFORE any write.
-- Precise rollback source of truth — do not attempt to reverse the
-- transformation heuristically (e.g. "copy hrv_sdnn back to hrv_rmssd"),
-- that would incorrectly touch rows that had hrv_sdnn already populated
-- and were correctly excluded from STEP 2's copy.
create table if not exists public.fitness_metrics_hrv_correction_backup_20260711 as
select id, source, hrv_rmssd as original_hrv_rmssd, hrv_sdnn as original_hrv_sdnn
from public.fitness_metrics
where source in ('healthkit', 'apple_health')
  and hrv_rmssd is not null;

-- Sanity: row count here must match STEP 0's rows_with_hrv_rmssd sum.
select count(*) from public.fitness_metrics_hrv_correction_backup_20260711;

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
  and id in (select id from public.fitness_metrics_hrv_correction_backup_20260711);

-- ─────────────────────────────────────────────────────────
-- STEP 4 — POST-CHECK (read-only, compare against STEP 0 + backup)
-- ─────────────────────────────────────────────────────────
select
  source,
  count(*) filter (where hrv_rmssd is not null) as still_has_hrv_rmssd,
  count(*) filter (where hrv_sdnn is not null) as now_has_hrv_sdnn
from public.fitness_metrics
where source in ('healthkit', 'apple_health')
group by source
order by source;
-- Expect: still_has_hrv_rmssd = 0 for both sources (every backed-up row
-- was nulled). now_has_hrv_sdnn = STEP 0's rows_with_hrv_rmssd count
-- (every backed-up row now has a value in hrv_sdnn, either freshly copied
-- in STEP 2 or already there pre-migration).

select count(*) from public.fitness_metrics_hrv_correction_backup_20260711;
-- Must equal the sum of now_has_hrv_sdnn above — confirms no row was
-- missed or double-touched.

-- ─────────────────────────────────────────────────────────
-- ROLLBACK — restores exact pre-migration state from the STEP 1 backup
-- ─────────────────────────────────────────────────────────
-- update public.fitness_metrics fm
-- set hrv_rmssd = b.original_hrv_rmssd,
--     hrv_sdnn = b.original_hrv_sdnn
-- from public.fitness_metrics_hrv_correction_backup_20260711 b
-- where fm.id = b.id;
--
-- Keep the backup table after a successful migration (do not drop it in
-- this file) — it is the only rollback path and costs 81 rows of storage
-- as of the audit. Drop manually, explicitly, only after Matteo confirms
-- the correction is final and no rollback will be needed (suggest: after
-- one full release cycle with no reported HRV regressions).
