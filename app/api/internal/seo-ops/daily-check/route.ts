/**
 * POST /api/internal/seo-ops/daily-check
 *
 * Vercel Cron trigger (06:00 UTC daily) that runs SEOWatchAgent.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Vercel automatically passes this header when CRON_SECRET is set in env.
 *
 * Returns: { ok, report_path, alerts, stats, skipped? }
 */
import { jsonError, jsonOk } from "@/lib/api/auth-helpers";
import { runSEOWatchAgent } from "@/lib/seo-ops/agents/watch";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 5 minutes — sitemap crawl + PSI calls can be slow

function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // If CRON_SECRET not configured, allow through (dev mode)
    console.warn("[daily-check] CRON_SECRET not set — skipping auth (dev mode)");
    return true;
  }
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(req: Request): Promise<Response> {
  if (!verifyCronSecret(req)) {
    return jsonError(401, "unauthorized_cron");
  }

  try {
    const result = await runSEOWatchAgent();
    return jsonOk({
      ok: result.ok,
      report_path: result.report_path,
      alerts: result.alerts,
      stats: result.stats,
      skipped: result.skipped,
    });
  } catch (err) {
    console.error("[daily-check] SEOWatchAgent crashed:", err);
    return jsonError(500, "watch_agent_failed", err instanceof Error ? err.message : String(err));
  }
}

// Also support GET for Vercel cron (Vercel sends GET for cron routes by convention)
export async function GET(req: Request): Promise<Response> {
  return POST(req);
}
