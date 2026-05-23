/**
 * POST /api/internal/seo-ops/weekly-content
 *
 * Vercel Cron trigger (06:00 UTC every Monday) that runs SEOContentAgent.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 *
 * Returns: { ok, prs_created, drafts_count, skipped? }
 */
import { jsonError, jsonOk } from "@/lib/api/auth-helpers";
import { runSEOContentAgent } from "@/lib/seo-ops/agents/content";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 5 minutes — 3x Claude calls + GitHub API

function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[weekly-content] CRON_SECRET not set — skipping auth (dev mode)");
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
    const result = await runSEOContentAgent();
    return jsonOk({
      ok: result.ok,
      prs_created: result.prs_created,
      drafts_count: result.drafts.length,
      pr_url: result.pr_url,
      skipped: result.skipped,
      error: result.error,
    });
  } catch (err) {
    console.error("[weekly-content] SEOContentAgent crashed:", err);
    return jsonError(500, "content_agent_failed", err instanceof Error ? err.message : String(err));
  }
}

export async function GET(req: Request): Promise<Response> {
  return POST(req);
}
