# Vercel Fluid CPU audit — 2026-07-24

Baseline captured **before** any P0.9 code change, on branch `perf/p09-vercel-fluid-cpu`
(`git worktree` at exactly PR #24's head, `56f0dc991f2280ac9a04c2bbbdf9c2a1a3afac41`).
Project: `fitmesh-site` (`prj_EnVqXdZjhqQk3mgLL64EuvbFWLxz`, team `team_ie82ajVy8XYOlt3dR5pfKvaA`),
domains `fitmesh.fit` / `www.fitmesh.fit`.

## 1. Plan and billing cycle

**Not accessible via the connected Vercel MCP tools.** The available tools
(`get_project`, `list_deployments`, `get_runtime_logs`, `get_runtime_errors`,
`get_web_analytics`, `get_deployment_build_logs`, agent-run tooling) expose
project metadata, deployments, runtime logs/errors and web analytics —
none of them expose plan tier, billing cycle, or a dedicated "Active CPU /
Provisioned Memory" usage metric. `get_project` returned only: framework
(`nextjs`), Node version (`24.x`), domains, and latest deployment — no
plan/billing fields. There is no Vercel Usage/Billing MCP connector in
this session. **This data needs to come from Matteo directly** (Vercel
dashboard → Usage, or Settings → Billing), if it's needed beyond what the
runtime-log evidence below already demonstrates.

## 2. Active CPU / Provisioned Memory / invocations (last 30 days)

Not directly exposed either (no dedicated CPU-time metric in the runtime
logs API). What IS available and used as a proxy — `get_runtime_logs`
grouped by `source` over the **last 7 days** (the tool's window, not 30 —
see caveat above; this is the closest verifiable substitute):

| source | count (7d) |
|---|---|
| middleware | 446 |
| function | 411 |
| cache | 34 |
| redirect | 9 |

**Reading this**: only 34 of ~900 logged events were served from cache.
Every marketing page render is a `function` invocation, and middleware
runs on nearly every request (446, essentially 1:1 with total traffic) —
this is the direct, load-bearing evidence for both FASE 1 (pages render
dynamically instead of being served from the CDN) and FASE 2 (the
middleware itself is invoked almost unconditionally).

By status code (7d, `get_runtime_logs` grouped by `statusCode`):

| statusCode | count |
|---|---|
| 200 | 415 |
| 307 | 11 |
| 500 | 9 |
| 308 | 7 |
| 404 | 6 |
| 405 | 4 |
| 301 | 2 |
| 401 | 1 |

(The 9× `500` are outside this sprint's scope — not investigated here,
noted for awareness only.)

By route (7d, `get_runtime_logs` grouped by `route`, top 24 of 42 distinct):

| route | count |
|---|---|
| `/[locale]/blog/[slug]` | 112 |
| `/api/v1/sync` | 109 |
| `/[locale]` | 24 |
| `/[locale]/sync/[provider]` | 22 |
| `/[locale]/integrations` | 16 |
| `/robots.txt` | 14 |
| `/[locale]/labs` | 14 |
| `/[locale]/blog` | 13 |
| `/[locale]/roadmap` | 13 |
| `/[locale]/beta` | 12 |
| `/[locale]/privacy` | 12 |
| `/[locale]/support` | 11 |
| `/[locale]/cookies` | 10 |
| `/api/v1/posts/stats` | 8 |
| `/` | 6 |
| `/api/apple-app-site-association` | 4 |
| `/api/cron/sync-trigger` | 4 |
| `/[locale]/sync/[provider]/[model]` | 4 |
| `/[locale]/terms` | 3 |
| `/[locale]/about` | 3 |
| `/[locale]/press` | 3 |
| `/[locale]/lp/[slug]` | 3 |
| `/[locale]/fitness-data-sync` | 3 |

`/[locale]/blog/[slug]` alone is the single largest function-invocation
route in the whole project over this window, ahead of the sync API
itself — a marketing content route, not a route that has any reason to
be dynamic. `/api/v1/posts/stats` (8 invocations) is FASE 3's target.

**Web Analytics**: queried, returned `404 Not Found — Web Analytics not
found`. Not enabled for this project, so no independent visitor/pageview
count to cross-reference invocation-to-visit ratio. Documented as
inaccessible, not assumed.

## 3. Breakdown by project / route / Routing Middleware

Covered above (route + source breakdown). No separate "Routing
Middleware" line item is exposed distinctly from the `middleware` source
count in `get_runtime_logs` — the 446/7d figure IS that breakdown.

## 4. Connector access limits (explicit)

- No Vercel Usage/Billing API connector available in this session.
- `get_web_analytics` returns 404 (not enabled for this project).
- `get_runtime_logs` has no CPU-time or memory dimension, only counts —
  cannot compute Active CPU-seconds or Provisioned Memory from it.
- Runtime log window used was 7 days (tool default/cap for this query
  shape), not the 30 days the brief asked for — the 30-day figure would
  need the Vercel dashboard directly.

## 5. Public headers — production, before any fix

Captured via `curl -sD -` against `https://www.fitmesh.fit` (real production,
2026-07-24, ~21:52 UTC). All Labs URLs resolved to their real localized
slugs first (`calcolatore-hrv-rmssd`, `calcolatore-efficienza-sonno`) since
the plain `/it/labs/hrv` guess 404s.

| URL | HTTP | Cache-Control | x-vercel-cache |
|---|---|---|---|
| `/it` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/en` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/it/blog/fitbit-data-not-syncing-android` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/en/blog/health-connect-vs-samsung-health` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/it/labs` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/it/labs/calcolatore-hrv-rmssd` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/it/labs/calcolatore-efficienza-sonno` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/it/about` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/it/integrations` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/it/sync/galaxy-watch` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | MISS |
| `/sitemap.xml` | 200 | `public, max-age=0, must-revalidate` | **HIT** (age 68810s) |
| `/llms.txt` | 200 | `public, max-age=3600` | **HIT** (age 65228s) |

Exactly the expected baseline from the brief: every marketing/content page
is `private, no-cache, no-store` + `MISS`. `sitemap.xml`/`llms.txt` (route
handlers, unaffected by the layout tree) are already cached correctly —
useful as an in-repo control group proving the CDN/edge cache path itself
works fine when a route isn't forced dynamic.

Note: both Labs calculator pages (`generateStaticParams()` present in
`app/(frontend)/[locale]/(marketing)/labs/[tool]/page.tsx`) STILL serve
`MISS`/`private` despite explicitly requesting static generation — direct
evidence that the taint comes from *above* the page (the root layout),
not from anything in these specific pages.

## 6. Three consecutive requests, same article

`https://www.fitmesh.fit/it/blog/fitbit-data-not-syncing-android`, three
back-to-back requests:

| # | Cache-Control | x-vercel-cache | age | x-vercel-id (unique per request) |
|---|---|---|---|---|
| 1 | `private, no-cache, no-store, ...` | MISS | 0 | `fra1::iad1::c44fr-...` |
| 2 | `private, no-cache, no-store, ...` | MISS | 0 | `fra1::iad1::hgf22-...` |
| 3 | `private, no-cache, no-store, ...` | MISS | 0 | `fra1::iad1::44pvf-...` |

Every request is a fresh `MISS` with `age: 0` and a distinct `x-vercel-id`
— the exact same URL, requested three times in a row, invokes the
serverless function three times. Zero CDN caching for this route today.

## 7. `.next/prerender-manifest.json` — before

Built from this exact commit (`56f0dc9`) in
`mcr.microsoft.com/playwright:v1.60.0-noble` via `pnpm build`, **before any
P0.9 edit** (webpack compile finished, locking in the pre-fix source,
before any layout file was touched).

- 1584 entries in `routes` (truly prerendered/static), 17 templates in
  `dynamicRoutes`.
- Every single one of the 10 FASE 6 acceptance-list marketing pages is
  **absent** from `routes`: `/it`, `/en`, `/it/blog/fitbit-data-not-syncing-android`,
  `/en/blog/health-connect-vs-samsung-health`, `/it/labs`, `/en/labs`,
  `/it/labs/calcolatore-hrv-rmssd`, `/it/labs/calcolatore-efficienza-sonno`,
  `/it/about`, `/it/integrations`, `/it/sync/galaxy-watch` — **zero of
  eleven** prerendered.
- What IS prerendered under `/[locale]/*` today is exclusively metadata
  route handlers that don't go through the page layout tree at all:
  `opengraph-image-*.tsx` generators (about, integrations, beta, blog,
  famiglia, ai, press, novita, sync/[provider]) and `blog/feed.xml`. This
  is the control group: these ARE static because they never touch
  `app/(frontend)/layout.tsx`'s `headers()` call, confirming the taint is
  specifically the root layout, not something inherent to `[locale]`
  routing or to Next.js's handling of this content.

Raw manifest archived for the PR at `/tmp/prerender-manifest-BEFORE.json`
during this session (not committed — regenerable from the pre-P0.9 commit
`56f0dc9` at any time via `pnpm build`).

## 8. `.next/prerender-manifest.json` — after (FASE 1–3 applied)

Same build environment, same commit tree except this branch's changes.

| | BEFORE | AFTER |
|---|---|---|
| Static routes (`routes`) | 1584 | **3561** (+1977, +125%) |
| Dynamic route templates (`dynamicRoutes`) | 17 | 39 |

All 11 FASE 6 acceptance-list pages now appear in `routes`:
`/it`, `/en`, `/it/blog/fitbit-data-not-syncing-android`,
`/en/blog/health-connect-vs-samsung-health`, `/it/labs`, `/en/labs`,
`/it/labs/calcolatore-hrv-rmssd`, `/it/labs/calcolatore-efficienza-sonno`,
`/it/about`, `/it/integrations`, `/it/sync/galaxy-watch` — **eleven of
eleven**, verified both by direct manifest inspection and by
`tools/check-vercel-fluid-cpu.ts` (control #7).

Verified no private route leaked into static output (control #8): `/it/app`,
`/it/admin` and their sub-pages are **absent** from `routes` — confirmed
against the raw manifest directly, not just the build summary table. Note:
the build's own human-readable route table shows these with a `●` (SSG)
marker, which is misleading at a glance — `app/(frontend)/[locale]/app/page.tsx`
declares `export const dynamic = 'force-dynamic'` and reads the real
authenticated user server-side (`supabase.auth.getUser()`, renders
`{user.email}`), and this was already true before P0.9 (confirmed identical
`●` marker in the BEFORE build table too — pre-existing Next.js build-table
display quirk, not a P0.9 regression, not an actual caching behavior: the
manifest is the ground truth, the table symbol is not).

## 9. FASE 4 — route matrix (static / dynamic, after FASE 1–3)

**Methodology note**: the human-readable route table `pnpm build` prints
(`○`/`●`/`ƒ` symbols) is **not reliable ground truth** for "is this served
statically" — discovered while auditing this exact table:
`/[locale]/app/*` and `/[locale]/admin/*` show `●` (SSG) in both the
BEFORE and AFTER build tables despite `app/(frontend)/[locale]/app/page.tsx`
explicitly declaring `export const dynamic = 'force-dynamic'` and rendering
the real authenticated user's email server-side. Checked directly against
`.next/prerender-manifest.json` (the actual artifact Vercel uses): neither
route is present in `routes`, in either build — the table symbol reflects
whether `generateStaticParams()` exists somewhere in the chain, not the
actual caching outcome. This matrix is built from the **manifest diff** and
direct source inspection (`force-dynamic` grep), not the table symbols.

### Newly static after P0.9 (present in AFTER `.next/prerender-manifest.json` `routes`, absent from BEFORE)

1977 routes total. By template:

| Template | Count |
|---|---|
| `/[locale]/blog/...` (index + articles + feed.xml) | 960 |
| `/[locale]/sync/[provider]` (+ `/[model]`) | 615 |
| `/[locale]/lp/[slug]` | 180 |
| `/[locale]/cookies`, `/about`, `/roadmap`, `/privacy`, `/support`, `/ai`, `/famiglia`, `/beta`, `/terms`, `/press`, `/imprint`, `/integrations`, `/novita` | 15 each (195 total) |
| `/[locale]/labs` (+ 2 calculator tools) | 6 |
| `/[locale]/fitness-data-sync` | 4 |
| `/[locale]` (all 15 homepages) | 15 |
| `/oauth/strava-callback`, `/delete-account` | 1 each |

### Confirmed still dynamic — by design, unaffected by this sprint

Every file below still declares `export const dynamic = 'force-dynamic'`
explicitly (grepped directly, not inferred):

- `/[locale]/app`, `/[locale]/app/devices`, `/[locale]/app/export`,
  `/[locale]/app/settings` + `/[locale]/app/layout.tsx` — private
  dashboard, reads the authenticated user server-side.
- `/[locale]/admin`, `/[locale]/admin/beta` + `/[locale]/admin/layout.tsx`
  — admin area.
- `/[locale]/auth/login` — reads auth state.
- `/[locale]/famiglia/join/[code]` — invite-code lookup, anti-enumeration
  rate-limited at the middleware.
- All `/api/cron/*` (2), `/api/v1/*/webhook/*` (7), `/api/v1/oauth/*/exchange`
  and `/*/refresh` (18) — cron/webhook/OAuth-token endpoints, correctly
  dynamic by nature (POST bodies, external provider payloads, secrets).

Matches the brief's own expected whitelist exactly:
`/[locale]/app/*`, `/[locale]/admin/*`, auth/callback where needed,
`famiglia/join/[code]`, sync/auth/billing/OAuth/webhook APIs, cron.

### Middleware coverage — before / after

| | Before | After |
|---|---|---|
| Matcher shape | One catch-all excluding only static assets/`_next`/`mockups`/`.well-known`/`oauth` | Six explicit positive entries (root, unprefixed deep-link incl. nb/nn, `/[locale]/app\|admin`, 3 rate-limited API paths, `famiglia/join` with/without locale) |
| Production invocations (7d, `get_runtime_logs` source=middleware) | 446 | Not yet measurable — not deployed. Structurally, the 15 locale prefixes (the bulk of marketing traffic) no longer match any matcher entry at all. |

### posts/stats invocations — before / after

| | Before | After |
|---|---|---|
| Automatic calls per article open | 1–2 (POST view or GET, occasionally +1 POST on share) | **0** (verified via Playwright, see FASE 3 commit) |
| Route bundle imports | `lib/blog/data.ts` → all ~63 posts' full content, just to build a `Set` of valid slugs | None (no Payload/Supabase/blog-data import) |
| Response | Real Supabase read/RPC | Static 410, `Cache-Control: public, max-age=31536000, immutable` |
