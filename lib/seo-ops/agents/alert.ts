/**
 * SEOAlertAgent — on-demand emergency SEO investigation.
 *
 * Run via: POST /api/internal/seo-ops/alert (manual trigger / webhook)
 *
 * Flow:
 *   1. Receive issue description + optional context
 *   2. Call Claude with emergency-responder system prompt
 *   3. Parse structured response (severity, cause, actions)
 *   4. Save report to docs/seo/alerts/
 *   5. Return AlertResult
 *
 * Graceful degradation: if ANTHROPIC_API_KEY missing, returns a template.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { callClaude } from "../clients/anthropic";
import type { AlertResult, AlertSeverity } from "../types";

const ALERTS_DIR = path.join(process.cwd(), "docs", "seo", "alerts");

function isoTimestamp(d = new Date()): string {
  return d.toISOString().replace(/:/g, "-").replace(/\.\d+Z$/, "Z");
}

function isoDate(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

const SYSTEM_PROMPT = `You are an SEO emergency responder for FitMesh Sync (fitmesh.fit), a health data sync Android app.

The user has reported an SEO issue. Your job:
1. Assess the severity (P0 = site down / massive traffic drop, P1 = significant ranking loss, P2 = minor issue)
2. Identify the most likely cause(s)
3. Propose IMMEDIATE actions (things to do in the next 24 hours)
4. Propose follow-up actions (things to do in the next week)

RESPONSE FORMAT — output ONLY valid JSON, no markdown wrapper, no preamble:

{
  "severity": "P0" | "P1" | "P2",
  "likely_cause": "One-paragraph explanation of the most likely cause",
  "immediate_actions": [
    "Action 1 — specific, actionable, with expected outcome",
    "Action 2",
    ...
  ],
  "follow_up_actions": [
    "Action 1",
    ...
  ],
  "analysis": "Detailed markdown analysis (2-4 paragraphs). Include relevant SEO context, potential algorithm updates, competitor movements if relevant."
}`;

interface ClaudeAlertResponse {
  severity: AlertSeverity;
  likely_cause: string;
  immediate_actions: string[];
  follow_up_actions: string[];
  analysis: string;
}

function parseClaudeResponse(raw: string): ClaudeAlertResponse {
  // Strip potential markdown code fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  try {
    return JSON.parse(cleaned) as ClaudeAlertResponse;
  } catch {
    // Fallback if JSON parsing fails
    return {
      severity: "P1",
      likely_cause: "Unable to parse Claude response. Raw output appended below.",
      immediate_actions: ["Review the raw Claude output below", "Investigate manually"],
      follow_up_actions: ["Re-run alert agent once issue is clearer"],
      analysis: raw,
    };
  }
}

export async function runSEOAlertAgent(
  issue: string,
  context?: unknown
): Promise<AlertResult> {
  const timestamp = isoTimestamp();
  const date = isoDate();
  const issueSlug = slugify(issue);
  const reportFilename = `${date}T${timestamp.split("T")[1]?.split(".")[0] ?? "00-00-00"}-${issueSlug}.md`;
  const reportPath = path.join(ALERTS_DIR, reportFilename);

  const userMessage = [
    `REPORTED ISSUE: ${issue}`,
    context
      ? `\nADDITIONAL CONTEXT:\n${typeof context === "string" ? context : JSON.stringify(context, null, 2)}`
      : "",
    `\nSite: https://www.fitmesh.fit`,
    `Timestamp: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  let parsed: ClaudeAlertResponse;

  try {
    const rawResponse = await callClaude(SYSTEM_PROMPT, userMessage, 2048);
    parsed = parseClaudeResponse(rawResponse);
  } catch (err) {
    console.error("[alert] Claude call failed:", err);
    // Return a template when API is unavailable
    parsed = {
      severity: "P1",
      likely_cause: "Claude API unavailable — manual investigation required.",
      immediate_actions: [
        "Check Vercel deployment logs for errors",
        "Verify GSC for manual actions / penalties",
        "Check if issue is algorithm-related (check SEO news)",
      ],
      follow_up_actions: [
        "Set up ANTHROPIC_API_KEY env var for automated analysis",
        "Re-run alert agent once API is available",
      ],
      analysis: `Claude API call failed: ${err instanceof Error ? err.message : String(err)}\n\nIssue reported: ${issue}`,
    };
  }

  // Build report markdown
  const report = `# SEO Alert Report — ${date}

**Severity:** ${parsed.severity}
**Reported:** ${new Date().toISOString()}
**Issue:** ${issue}

## Likely Cause

${parsed.likely_cause}

## Immediate Actions (next 24h)

${parsed.immediate_actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## Follow-up Actions (next 7 days)

${parsed.follow_up_actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## Detailed Analysis

${parsed.analysis}

---

## Original Report

**Issue:** ${issue}

${context ? `**Context:**\n\`\`\`json\n${typeof context === "string" ? context : JSON.stringify(context, null, 2)}\n\`\`\`` : ""}

*Generated by SEOAlertAgent at ${new Date().toISOString()}*
`;

  // Save report
  try {
    await mkdir(ALERTS_DIR, { recursive: true });
    await writeFile(reportPath, report, "utf-8");
  } catch (err) {
    console.error("[alert] Failed to save report:", err);
  }

  return {
    ok: true,
    report,
    report_path: reportPath,
    severity: parsed.severity,
    likely_cause: parsed.likely_cause,
    immediate_actions: parsed.immediate_actions,
    follow_up_actions: parsed.follow_up_actions,
  };
}
