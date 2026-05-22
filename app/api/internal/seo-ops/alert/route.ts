/**
 * POST /api/internal/seo-ops/alert
 *
 * Manual trigger for on-demand SEO emergency investigation.
 *
 * Auth: Authorization: Bearer ${SEO_OPS_ALERT_SECRET}
 * (separate from CRON_SECRET to allow admin/dev triggers without exposing cron key)
 *
 * Body: { issue: string, context?: object }
 * Returns: { ok, severity, likely_cause, immediate_actions, follow_up_actions, report_path }
 */
import { jsonError, jsonOk } from "@/lib/api/auth-helpers";
import { runSEOAlertAgent } from "@/lib/seo-ops/agents/alert";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 1 minute — single Claude call

interface AlertRequestBody {
  issue: string;
  context?: unknown;
}

function verifyAlertSecret(req: Request): boolean {
  const secret = process.env.SEO_OPS_ALERT_SECRET;
  if (!secret) {
    console.warn("[seo-alert] SEO_OPS_ALERT_SECRET not set — skipping auth (dev mode)");
    return true;
  }
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(req: Request): Promise<Response> {
  if (!verifyAlertSecret(req)) {
    return jsonError(401, "unauthorized");
  }

  let body: AlertRequestBody;
  try {
    body = (await req.json()) as AlertRequestBody;
  } catch {
    return jsonError(400, "invalid_json");
  }

  if (!body.issue || typeof body.issue !== "string") {
    return jsonError(400, "missing_issue", "Body must include { issue: string }");
  }

  if (body.issue.length > 2000) {
    return jsonError(400, "issue_too_long", "issue must be <= 2000 characters");
  }

  try {
    const result = await runSEOAlertAgent(body.issue, body.context);
    return jsonOk({
      ok: result.ok,
      severity: result.severity,
      likely_cause: result.likely_cause,
      immediate_actions: result.immediate_actions,
      follow_up_actions: result.follow_up_actions,
      report_path: result.report_path,
      report: result.report,
    });
  } catch (err) {
    console.error("[seo-alert] SEOAlertAgent crashed:", err);
    return jsonError(500, "alert_agent_failed", err instanceof Error ? err.message : String(err));
  }
}
