# Capability promotion checklist: "in development" → "live"

Referenced from `tools/check-llms-consistency.ts` (guardrail sections 7d and 8)
and `/fitness-data-sync`. Applies to any product capability described on the
site — not just the destinations below.

The definitive criterion is **reachable and completable by a real user**, not
"the code exists". A feature passing `flutter analyze` and its test suite is
necessary but not sufficient — that verifies the code doesn't crash, not that
the capability actually works end to end for a user.

## The 9 gates

A capability may only be described as "live" on the site once ALL of these
are true, in the SAME commit that flips the site copy:

1. The function is reachable from the UI (a real screen, not just a service
   method with zero call sites).
2. Authentication completes (OAuth flow, PAT entry, native permission grant —
   whichever applies) without a dead end or silent failure.
3. The real operation succeeds against the real external service (not a
   mock, not a dry run).
4. The result is visible in the destination service itself (the workout
   shows up in Strava/TrainingPeaks/RideWithGPS, the file appears in Google
   Drive), confirmed by looking at that service, not just at FitMesh's own
   logs.
5. Retry and error handling are in place for the realistic failure modes
   (expired token, rate limit, network drop, destination-side rejection).
6. No loop or duplicate: writing back doesn't cause FitMesh to re-ingest its
   own write as new data, and re-sending doesn't create duplicate entries on
   the destination.
7. Tested on a physical device, not only in a sandboxed/CI environment.
8. The build/store version that contains the fix is identified (version +
   build number, and which store track it shipped to).
9. Product facts, the compatibility matrix, `/llms.txt`, and the guardrail
   (`tools/check-llms-consistency.ts`) are all updated in that same commit —
   never leave the site ahead of what's actually verified.

## Current status (2026-07-12)

Implemented in app code this sprint, all still gated at "in development"
because none has cleared gates 3–8 yet:

| Destination | Gate reached | Blocking gate |
|---|---|---|
| Strava write (re-auth + `activity:write` upload) | 1 (UI wired) | 2 (re-auth flow unverified on device) |
| TrainingPeaks (PAT save + TCX dispatch) | 1 (UI wired) | 3 (no confirmed successful send) |
| RideWithGPS (TCX dispatch) | 1 (UI wired) | 3 (no confirmed successful send) |
| Google Drive export | 1 (UI wired) | 4 (no confirmed file visible in Drive) |

Already live and verified, not subject to this checklist's open items:

- Strava read (OAuth, `read`/`activity:read_all`/`profile:read_all` scopes).
- Health Connect write-back (Android) — opt-in, off by default, exports once
  per toggle activation.
- Apple Health write-back (iOS) — opt-in, off by default, re-exports after
  every successful sync.
- Workout export via the native share sheet (GPX/TCX, Pro feature).

Do not promote any row above out of "in development" without a device test
confirming gates 3–8, updating this table, and updating
`lib/content/fitness-data-sync-copy.ts` + the guardrail's
`UNVERIFIED_DESTINATIONS` list in the same commit.
