/**
 * SEOWatchAgent — daily site health check.
 *
 * Run via: POST /api/internal/seo-ops/daily-check (Vercel Cron 06:00 UTC)
 *
 * Checks:
 *   1. Sitemap freshness + URL crawl
 *   2. Broken links (HEAD request each sitemap URL)
 *   3. GSC: low-CTR queries (impressions > 100, ctr < 1%)
 *   4. GSC: ranking drops vs last-week snapshot
 *   5. PSI: Core Web Vitals on top 5 pages
 *
 * Graceful degradation: if GSC or PSI credentials are missing, those
 * checks are skipped and the report contains TODO notes.
 *
 * Output:
 *   - Markdown report saved to docs/seo/daily/YYYY-MM-DD.md
 *   - Snapshot saved to data/seo/snapshots/YYYY-MM-DD.json
 *   - WatchResult returned to the API route
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { callClaude } from "../clients/anthropic";
import { fetchGSCQueries, findLowCTRQueries, type GSCRow } from "../clients/gsc";
import { checkCWV, type PSIResult } from "../clients/psi";
import { checkLinks, filterBroken } from "../helpers/broken-links";
import { fetchSitemapUrls } from "../helpers/sitemap-crawler";
import type { RankingSnapshot, WatchAlert, WatchResult } from "../types";

const SITE_URL = "https://www.fitmesh.fit";
const DOCS_DIR = path.join(process.cwd(), "docs", "seo", "daily");
const SNAPSHOTS_DIR = path.join(process.cwd(), "data", "seo", "snapshots");

// Top pages to check CWV on (used when GSC data unavailable)
const FALLBACK_TOP_PAGES = [
  `${SITE_URL}/`,
  `${SITE_URL}/it/`,
  `${SITE_URL}/en/`,
  `${SITE_URL}/it/integrations`,
  `${SITE_URL}/it/blog`,
];

function isoDate(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

async function loadSnapshot(date: string): Promise<RankingSnapshot | null> {
  const file = path.join(SNAPSHOTS_DIR, `${date}.json`);
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as RankingSnapshot;
  } catch {
    return null;
  }
}

async function saveSnapshot(rows: GSCRow[], date: string): Promise<void> {
  await mkdir(SNAPSHOTS_DIR, { recursive: true });
  const snapshot: RankingSnapshot = {
    date,
    queries: rows.map((r) => ({
      query: r.query,
      position: r.position,
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
    })),
  };
  await writeFile(
    path.join(SNAPSHOTS_DIR, `${date}.json`),
    JSON.stringify(snapshot, null, 2),
    "utf-8"
  );
}

function findRankingDrops(
  current: GSCRow[],
  snapshot: RankingSnapshot,
  dropThreshold = 5
) {
  const snapshotMap = new Map(snapshot.queries.map((q) => [q.query, q.position]));
  return current
    .filter((r) => {
      const prev = snapshotMap.get(r.query);
      return prev !== undefined && r.position - prev > dropThreshold;
    })
    .map((r) => ({
      query: r.query,
      positionNow: r.position,
      positionWeekAgo: snapshotMap.get(r.query)!,
      delta: r.position - snapshotMap.get(r.query)!,
    }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 10);
}

function buildRawDataDump(opts: {
  date: string;
  sitemapUrls: string[];
  brokenLinks: ReturnType<typeof filterBroken>;
  lowCTR: ReturnType<typeof findLowCTRQueries>;
  rankingDrops: ReturnType<typeof findRankingDrops>;
  cwvIssues: PSIResult[];
  skipped: string[];
}): string {
  return `
# SEO Daily Check — ${opts.date}

## Sitemap
Total URLs found: ${opts.sitemapUrls.length}

## Broken Links (${opts.brokenLinks.length} found)
${opts.brokenLinks.length === 0 ? "None" : opts.brokenLinks.map((l) => `- ${l.url} → HTTP ${l.status}${l.error ? ` (${l.error})` : ""}`).join("\n")}

## Low-CTR Queries (impressions > 100, CTR < 1%)
${opts.lowCTR.length === 0 ? opts.skipped.includes("gsc") ? "⚠️ GSC credentials not configured — skipped" : "None" : opts.lowCTR.slice(0, 20).map((q) => `- "${q.query}": ${q.impressions} impressions, ${(q.ctr * 100).toFixed(2)}% CTR, pos ${q.position.toFixed(1)}`).join("\n")}

## Ranking Drops (position dropped > 5 vs 7 days ago)
${opts.rankingDrops.length === 0 ? opts.skipped.includes("gsc") ? "⚠️ GSC credentials not configured — skipped" : "None" : opts.rankingDrops.map((d) => `- "${d.query}": ${d.positionWeekAgo.toFixed(1)} → ${d.positionNow.toFixed(1)} (Δ+${d.delta.toFixed(1)})`).join("\n")}

## Core Web Vitals Issues (PSI)
${opts.cwvIssues.length === 0 ? opts.skipped.includes("psi") ? "⚠️ PSI credentials not configured — skipped" : "No issues detected" : opts.cwvIssues.map((c) => `- ${c.url}: score=${c.score}, LCP=${c.lcp}ms, CLS=${c.cls}, category=${c.category}`).join("\n")}

## Skipped checks
${opts.skipped.length === 0 ? "All checks ran" : opts.skipped.join(", ")}
  `.trim();
}

export async function runSEOWatchAgent(): Promise<WatchResult> {
  const today = isoDate();
  const skipped: string[] = [];
  const alerts: WatchAlert[] = [];

  // ── 1. Sitemap + broken links ──────────────────────────────────────────────
  let sitemapUrls: string[] = [];
  let brokenLinks: ReturnType<typeof filterBroken> = [];

  try {
    sitemapUrls = await fetchSitemapUrls();
    if (sitemapUrls.length === 0) {
      alerts.push({
        severity: "warning",
        type: "sitemap",
        message: "Sitemap returned 0 URLs — possibly offline or malformed",
      });
    }

    const linkResults = await checkLinks(sitemapUrls.slice(0, 200)); // cap at 200
    brokenLinks = filterBroken(linkResults);

    if (brokenLinks.length > 0) {
      alerts.push({
        severity: brokenLinks.length > 5 ? "critical" : "warning",
        type: "broken_links",
        message: `${brokenLinks.length} broken link(s) detected`,
        details: brokenLinks,
      });
    }
  } catch (err) {
    console.error("[watch] sitemap/broken-links check failed:", err);
    alerts.push({
      severity: "warning",
      type: "sitemap",
      message: `Sitemap check failed: ${err instanceof Error ? err.message : String(err)}`,
    });
    skipped.push("broken-links");
  }

  // ── 2. GSC: low CTR + ranking drops ───────────────────────────────────────
  let lowCTR: ReturnType<typeof findLowCTRQueries> = [];
  let rankingDrops: ReturnType<typeof findRankingDrops> = [];
  let currentRows: GSCRow[] = [];

  const hasGSC = !!process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!hasGSC) {
    skipped.push("gsc");
    console.info("[watch] GSC_SERVICE_ACCOUNT_JSON not set — skipping GSC checks");
  } else {
    try {
      const sevenDaysAgo = daysAgo(7);
      const yesterday = daysAgo(1);
      currentRows = (await fetchGSCQueries(sevenDaysAgo, yesterday, 500)) ?? [];

      lowCTR = findLowCTRQueries(currentRows, 100, 0.01);
      if (lowCTR.length > 0) {
        alerts.push({
          severity: "info",
          type: "low_ctr",
          message: `${lowCTR.length} queries with impressions > 100 and CTR < 1%`,
          details: lowCTR.slice(0, 5),
        });
      }

      // Compare to last week's snapshot
      const lastWeekDate = daysAgo(7);
      const lastWeekSnapshot = await loadSnapshot(lastWeekDate);
      if (lastWeekSnapshot) {
        rankingDrops = findRankingDrops(currentRows, lastWeekSnapshot);
        if (rankingDrops.length > 0) {
          alerts.push({
            severity: rankingDrops.some((d) => d.delta > 15) ? "critical" : "warning",
            type: "ranking_drop",
            message: `${rankingDrops.length} queries dropped > 5 positions vs last week`,
            details: rankingDrops.slice(0, 5),
          });
        }
      }

      // Save today's snapshot for next week's comparison
      await saveSnapshot(currentRows, today);
    } catch (err) {
      console.error("[watch] GSC check failed:", err);
      skipped.push("gsc");
    }
  }

  // ── 3. PSI: Core Web Vitals ────────────────────────────────────────────────
  let cwvIssues: PSIResult[] = [];
  const hasPSI = !!process.env.GOOGLE_PSI_API_KEY;

  if (!hasPSI) {
    skipped.push("psi");
    console.info("[watch] GOOGLE_PSI_API_KEY not set — skipping PSI checks");
  } else {
    try {
      // Use top 5 pages from GSC data or fallback list
      const topPages =
        currentRows.length > 0
          ? [...new Set(currentRows.slice(0, 20).map((r) => `${SITE_URL}/${r.query.split("/")[0]}`))]
              .slice(0, 5)
          : FALLBACK_TOP_PAGES.slice(0, 5);

      cwvIssues = await checkCWV(topPages);
      if (cwvIssues.length > 0) {
        alerts.push({
          severity: "warning",
          type: "cwv",
          message: `${cwvIssues.length} page(s) with poor Core Web Vitals`,
          details: cwvIssues,
        });
      }
    } catch (err) {
      console.error("[watch] PSI check failed:", err);
      skipped.push("psi");
    }
  }

  // ── 4. Claude analysis ─────────────────────────────────────────────────────
  const rawDump = buildRawDataDump({
    date: today,
    sitemapUrls,
    brokenLinks,
    lowCTR,
    rankingDrops,
    cwvIssues,
    skipped,
  });

  let aiInsights = "";
  try {
    aiInsights = await callClaude(
      `You are an SEO analyst for FitMesh Sync (fitmesh.fit), a health data sync app for Android.
Your task: analyze the raw daily SEO check data and produce a concise, actionable markdown report.

Rules:
- Distinguish between noise (minor fluctuations) and truly actionable signals
- For broken links: list each with suggested fix
- For low-CTR queries: suggest title/meta improvements with specific examples
- For ranking drops: identify likely causes (algorithm update, competitor content, page change)
- For CWV issues: suggest specific fixes per metric
- Be direct and prioritized — most critical issues first
- Format output as clean markdown (no extra preamble, start with ## Summary)`,
      rawDump,
      2048
    );
  } catch (err) {
    console.error("[watch] Claude analysis failed:", err);
    aiInsights = `## AI Analysis Unavailable\n\nClaude API call failed: ${err instanceof Error ? err.message : String(err)}\n\nRaw data is appended below.`;
  }

  // ── 5. Build and save report ───────────────────────────────────────────────
  const reportLines: string[] = [
    `# SEO Daily Report — ${today}`,
    "",
    `**Generated:** ${new Date().toISOString()}`,
    `**Alerts:** ${alerts.length} (${alerts.filter((a) => a.severity === "critical").length} critical, ${alerts.filter((a) => a.severity === "warning").length} warnings)`,
    "",
  ];

  if (skipped.length > 0) {
    reportLines.push(
      `> ⚠️ Skipped checks: ${skipped.join(", ")} (credentials not configured)`,
      ""
    );
  }

  reportLines.push(aiInsights, "", "---", "", "## Raw Data", "", "```", rawDump, "```");

  const report = reportLines.join("\n");
  const reportPath = path.join(DOCS_DIR, `${today}.md`);

  try {
    await mkdir(DOCS_DIR, { recursive: true });
    await writeFile(reportPath, report, "utf-8");
  } catch (err) {
    console.error("[watch] Failed to save report:", err);
  }

  return {
    ok: true,
    date: today,
    report_path: reportPath,
    alerts,
    stats: {
      urls_checked: sitemapUrls.length,
      broken_links: brokenLinks.length,
      low_ctr_queries: lowCTR.length,
      ranking_drops: rankingDrops.length,
      cwv_issues: cwvIssues.length,
    },
    skipped: skipped.length > 0 ? skipped : undefined,
  };
}
