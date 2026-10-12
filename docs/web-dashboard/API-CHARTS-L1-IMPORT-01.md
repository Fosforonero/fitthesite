# Local chart library import into L1

This is a review candidate, not a dashboard release or an activation.
Base: `f74f82e6d80b44056216d45dac91c375bd1c19be`.

The import includes the complete chart components, pure Measure adapter,
synthetic fixtures and 78 tests. It does not mount a new screen, change routes,
auth, SQL, feature flags, provider access or production configuration.
Do not merge the older Gemini prototype history to acquire these files.

## Integration contract

- `TrendChartsPanel` takes existing `TrendPoint` series and existing IT/EN copy.
  The caller must provide the locale, 7/30 period and explicit demo status.
- `toChartPoints` preserves input order and dates. It does not perform source
  fusion, deduplication, calendar filling or timezone conversion.
- Complete zero, partial zero, missing and invalid readings remain distinct.
  The adapter does not establish whether a sensor reading is a valid zero.
- At least three present days are needed to draw the panel, following the
  existing L1 minimum. An empty series never falls back to demonstration data.
- Partial heart-rate observations are not joined into complete-day segments.
- A 30-day plot scrolls inside its own keyboard-focusable region. The page
  must not scroll horizontally. Tables preserve the alternate data view.
- 90-day charts are not implemented. Do not silently substitute seven days.
- UI normalization validates rendering inputs but does not authorize data.

## Evidence and remaining gates

On this isolated base: 78 targeted tests passed; the ordinary full suite
collected 116 files and 2537 tests, with 2514 passed and 23 skipped. Typecheck
and governance passed. No release-mode PG17 suite was executed for this import.

Browser evidence comes from the separate synthetic Next.js development
prototype: IT/EN, 7/30 days, 1440/390/320 px, complete/empty/partial states,
36 cases. It is not evidence of a mounted L1 screen, real health data, browser
authentication, RLS or production behavior.

Before integration, reconfirm current main and L1, inspect the commit, mount
only in the permitted local prototype, measure both ordinary and release
counters on the actual combined tree, and rerun release/build/browser gates.
The counter-only follow-up is separate and must not be copied as a release
certificate. Supabase migration and any activation still require separate GO.

Cost and detailed provenance are in the private Codex report. Claude API
provided the adapter, normalizer and panel test proposal; Codex reviewed,
corrected and integrated them and the runtime fixes. Advisory AI review is
not a security, accessibility or legal certification.
