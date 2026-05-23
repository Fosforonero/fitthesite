# SEO Ops Pipeline — Architecture & Runbook

Automated daily/weekly SEO governance for fitmesh.fit.
Three specialized AI agents, human-review PR workflow for content.

## Architecture

```
[Vercel Cron daily 06:00 UTC] ──→ POST /api/internal/seo-ops/daily-check
                                       ↓
                                  SEOWatchAgent
                                       ├─ GSC API: queries with high impressions + CTR < 1%
                                       ├─ GSC API: ranking drops vs 7 days ago
                                       ├─ Broken links (HEAD each sitemap URL, count 4xx/5xx)
                                       ├─ Sitemap URL count / freshness
                                       ├─ Core Web Vitals via PageSpeed Insights API
                                       └─ Output: docs/seo/daily/YYYY-MM-DD.md
                                                + data/seo/snapshots/YYYY-MM-DD.json

[Vercel Cron Mon 06:00 UTC] ──→ POST /api/internal/seo-ops/weekly-content
                                       ↓
                                  SEOContentAgent
                                       ├─ Reads data/seo/goldmine-keywords.json
                                       ├─ Picks top 3 uncovered keywords by volume
                                       ├─ Generates 1500-word article per keyword (IT or EN)
                                       ├─ Opens GitHub PR tagged "seo-content-review"
                                       └─ Human review required before merge

[Manual / webhook] ──→ POST /api/internal/seo-ops/alert
                                       ↓
                                  SEOAlertAgent
                                       └─ Investigates issue, returns prioritized action plan
                                          + saves docs/seo/alerts/YYYY-MM-DDT...md
```

## Required Environment Variables

Set these in the Vercel dashboard (Settings → Environment Variables). Do NOT put them in `.env.local` or commit them.

| Variable | Description | How to get it |
|---|---|---|
| `CRON_SECRET` | Random 32-byte hex string. Authenticates Vercel cron calls. | `openssl rand -hex 32` |
| `SEO_OPS_ALERT_SECRET` | Separate secret for manual alert triggers. | `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | Claude API key. Probably already set. | https://console.anthropic.com |
| `GSC_SERVICE_ACCOUNT_JSON` | Google Search Console service account JSON (minified, single line). | See below |
| `GOOGLE_PSI_API_KEY` | PageSpeed Insights API key. Free tier (25k/day). | https://console.cloud.google.com → APIs → PageSpeed Insights API |
| `GITHUB_TOKEN` | Fine-grained PAT with Contents + Pull Requests write scope on fitthesite repo. | GitHub → Settings → Developer Settings → Fine-grained tokens |
| `GITHUB_REPO_OWNER` | GitHub org/user owning the fitthesite repo. Default: `FitMeshSync` | Set to your GitHub username/org |
| `GITHUB_REPO_NAME` | Repository name. Default: `fitthesite` | Set if different from default |

### Setting up Google Search Console API

1. Go to https://console.cloud.google.com
2. Create a project (or use an existing one)
3. Enable "Google Search Console API"
4. Create a Service Account → download JSON key
5. Go to Google Search Console → Settings → Users and permissions
6. Add the service account email as a "Restricted" user
7. Minify the JSON and paste as `GSC_SERVICE_ACCOUNT_JSON`

```bash
# Minify the service account JSON for Vercel
cat service-account.json | jq -c . | pbcopy
```

## How to Run Agents Manually

### Daily health check (curl)

```bash
curl -X POST https://www.fitmesh.fit/api/internal/seo-ops/daily-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Weekly content generation

```bash
curl -X POST https://www.fitmesh.fit/api/internal/seo-ops/weekly-content \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Alert agent (manual trigger)

```bash
curl -X POST https://www.fitmesh.fit/api/internal/seo-ops/alert \
  -H "Authorization: Bearer YOUR_SEO_OPS_ALERT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "issue": "Organic traffic dropped 40% overnight on /it/blog",
    "context": {
      "date": "2026-05-22",
      "pages_affected": ["/it/blog", "/it/integrations"],
      "gsc_note": "impressions stable but clicks dropped"
    }
  }'
```

### Local development (no credentials)

The agents gracefully degrade when credentials are missing:
- GSC/PSI checks are skipped, noted in the report
- GitHub PR falls back to saving files in `drafts/seo-content/YYYY-MM-DD/`
- Claude analysis is skipped if `ANTHROPIC_API_KEY` missing (template returned)

You can trigger routes locally with:
```bash
curl -X POST http://localhost:3000/api/internal/seo-ops/alert \
  -H "Content-Type: application/json" \
  -d '{"issue": "test alert"}'
# Note: no auth required when secrets not configured (dev mode)
```

## How to Read Daily Reports

Reports are saved to `docs/seo/daily/YYYY-MM-DD.md`.

Structure:
```
# SEO Daily Report — 2026-05-22

Alerts: N (X critical, Y warnings)

> Skipped checks: gsc, psi (credentials not configured)

## Summary          ← AI-generated analysis
## Broken Links     ← with suggested fixes
## Low-CTR Queries  ← with title/meta suggestions
## Ranking Drops    ← with likely causes
## CWV Issues       ← with fix suggestions
---
## Raw Data         ← the actual numbers fed to Claude
```

**Severity levels:**
- `critical` — requires action today (many broken links, massive ranking drops)
- `warning` — investigate this week
- `info` — awareness only, monitor trend

## How to Review Weekly Content PRs

1. PR appears with title `[seo-content-review] N nuovi articoli goldmine — YYYY-MM-DD`
2. Check the review checklist in the PR body
3. For each article file in `content/blog/[locale]/[slug].md`:
   - Verify factual accuracy (especially health data claims)
   - Check the FitMesh Sync mentions are natural
   - Validate JSON-LD schema at https://validator.schema.org
   - Verify word count is ~1500
4. Make any edits directly in the PR branch
5. **Merge only when satisfied** — the merge updates `goldmine-keywords.json` too
6. After merge, manually trigger IndexNow if not automated:
   ```bash
   # Wire to pingIndexNow() from lib/seo/indexnow.ts
   ```

## Keyword Pool Management

The keyword pool lives in `data/seo/goldmine-keywords.json`.

To add new keywords:
```json
{
  "query": "your search query here",
  "volume_estimate": 10000,
  "difficulty": "low",
  "locale": "it",
  "covered": false
}
```

- `difficulty`: `low` (DA <30 sites ranking), `medium`, `high`
- `locale`: `it` or `en`
- `covered`: automatically set to `true` after article published

To mark a keyword as manually covered:
```json
{
  "covered": true,
  "covered_slug": "my-existing-slug",
  "covered_date": "2026-05-22"
}
```

## How to Trigger Alert Agent

Via curl (see above) or via any webhook-capable tool (Zapier, n8n, GitHub Actions).

Example GitHub Actions trigger on deploys:
```yaml
- name: SEO alert on deploy failure
  if: failure()
  run: |
    curl -X POST ${{ secrets.SITE_URL }}/api/internal/seo-ops/alert \
      -H "Authorization: Bearer ${{ secrets.SEO_OPS_ALERT_SECRET }}" \
      -H "Content-Type: application/json" \
      -d '{"issue": "Deploy failed — site may be down", "context": {"run_id": "${{ github.run_id }}"}}'
```

## File Structure

```
fitthesite/
├── vercel.json                        ← Cron schedule config
├── data/seo/
│   ├── goldmine-keywords.json         ← Keyword pool (committed, updated via PR)
│   └── snapshots/YYYY-MM-DD.json      ← Weekly GSC ranking snapshots
├── docs/seo/
│   ├── daily/YYYY-MM-DD.md            ← Daily health reports
│   ├── alerts/YYYY-MM-DDT...md        ← Alert investigation reports
│   └── SEO-OPS-README.md              ← This file
├── lib/seo-ops/
│   ├── types.ts
│   ├── agents/
│   │   ├── watch.ts                   ← SEOWatchAgent
│   │   ├── content.ts                 ← SEOContentAgent
│   │   └── alert.ts                   ← SEOAlertAgent
│   ├── clients/
│   │   ├── anthropic.ts               ← Claude SDK wrapper
│   │   ├── gsc.ts                     ← Google Search Console API
│   │   ├── psi.ts                     ← PageSpeed Insights API
│   │   └── github.ts                  ← Octokit PR creator
│   └── helpers/
│       ├── sitemap-crawler.ts         ← Sitemap XML fetcher/parser
│       ├── broken-links.ts            ← Parallel HEAD checker
│       └── keyword-pool.ts            ← JSON pool reader/writer
└── app/api/internal/seo-ops/
    ├── daily-check/route.ts
    ├── weekly-content/route.ts
    └── alert/route.ts
```

## IndexNow

### What it is

IndexNow is a push-notification protocol for search engines: instead of waiting for Bing, Yandex, Naver, or Seznam to crawl the site on their schedule, we tell them immediately when a page is created or updated. They index it faster — often within minutes.

**Google does NOT officially participate in IndexNow** (they use their own crawl signals + Search Console). However, IndexNow aggregates signals across all participating engines, and Google has stated they observe these aggregate patterns. Indirect benefit is possible; direct Google indexing requires the Search Console URL Inspection API or sitemap freshness.

### Key file

The API key file is committed at `public/aed642d85d1553233bd5fdec165b1d94.txt` and served at:

```
https://www.fitmesh.fit/aed642d85d1553233bd5fdec165b1d94.txt
```

The same key is hardcoded in `lib/seo/indexnow.ts`. Do not change or delete the public file.

### How it works

**Automatic (Vercel Cron — daily at 06:30 UTC):**

```
[Vercel Cron daily 06:30 UTC] ──→ GET /api/cron/indexnow-daily
                                       ↓
                                  Builds URL list:
                                  - All blog posts updated in last 7 days (IT + EN)
                                  - Core pages: homepage + /integrations (IT + EN, always)
                                       ↓
                                  POST https://api.indexnow.org/IndexNow
                                       ↓
                                  Returns { ok, total, status }
```

Auth: `CRON_SECRET` header (same as other crons). If `CRON_SECRET` is unset (local dev), no auth required.

**Manual trigger (ad-hoc ping):**

```
POST /api/internal/seo-ops/indexnow-ping
Authorization: Bearer SEO_OPS_ALERT_SECRET
Content-Type: application/json

{ "urls": ["https://www.fitmesh.fit/it/blog/my-new-post", ...] }
```

Auth: `SEO_OPS_ALERT_SECRET`. Max 10,000 URLs per call (IndexNow API limit).

### Test manuale (curl)

```bash
# Manual ping for specific URLs
curl -X POST https://www.fitmesh.fit/api/internal/seo-ops/indexnow-ping \
  -H "Authorization: Bearer YOUR_SEO_OPS_ALERT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.fitmesh.fit/it/blog/guida-sync-wearable-2026",
      "https://www.fitmesh.fit/en/blog/guida-sync-wearable-2026"
    ]
  }'

# Expected response: { "ok": true, "status": 200 } or { "ok": true, "status": 202 }
```

```bash
# Trigger the daily cron manually (local dev — no auth needed if CRON_SECRET unset)
curl http://localhost:3000/api/cron/indexnow-daily

# In production:
curl https://www.fitmesh.fit/api/cron/indexnow-daily \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### IndexNow HTTP status codes

| Status | Meaning |
|---|---|
| 200 | OK — URLs accepted |
| 202 | Accepted — queued for processing |
| 400 | Bad request — malformed body or empty URL list |
| 403 | Forbidden — API key invalid or key file not accessible |
| 422 | Unprocessable — URLs don't match the declared host |

### When to trigger manually

- After merging a SEO content PR (weekly-content creates articles that need immediate indexing)
- After fixing a broken URL or redirect
- After publishing a major page update outside the 7-day window

### Google Search Console note

Google ignores IndexNow. To accelerate Google indexing of specific pages, use the GSC URL Inspection API manually via the Search Console UI, or wait for the sitemap to be re-crawled (Googlebot typically re-crawls the sitemap within 24–48h of a new deploy).

## Known Limitations

1. **Vercel filesystem is read-only** — `docs/seo/` reports are written in development only. In production, consider writing to Supabase Storage or logging to Vercel instead. The snapshots (`data/seo/snapshots/`) are also ephemeral in serverless.

2. **Vercel Hobby plan** doesn't support crons. Requires Pro plan.

3. **PSI rate limiting** — Free tier (25k/day) is fine for 5 pages, but avoid triggering weekly-content + daily-check simultaneously.

4. **GitHub PAT rotation** — Fine-grained PATs expire. Set a reminder to rotate `GITHUB_TOKEN` before expiry.

5. **Keyword pool divergence** — In production, `markKeywordsCovered()` returns a JSON string for the GitHub PR commit. The local `goldmine-keywords.json` is NOT mutated at runtime (filesystem is read-only on Vercel serverless). The PR commit updates it in the repo.

6. **maxDuration** — Routes set `maxDuration = 300` (5 min). Vercel Hobby limits to 10s. Pro limits to 300s for serverless. Upgrade plan if needed.
