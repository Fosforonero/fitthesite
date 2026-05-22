/**
 * Google Search Console API client.
 *
 * Auth: Service Account JSON (env var GSC_SERVICE_ACCOUNT_JSON).
 * The service account must have "Read-only" permission on the GSC property.
 *
 * Scopes: https://www.googleapis.com/auth/webmasters.readonly
 *
 * If GSC_SERVICE_ACCOUNT_JSON is not set, all functions return null
 * (caller must handle graceful degradation).
 */
import { google } from "googleapis";

const SITE_URL = "https://www.fitmesh.fit/";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

function getAuth() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  let sa: Record<string, unknown>;
  try {
    sa = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.error("[gsc] GSC_SERVICE_ACCOUNT_JSON is not valid JSON");
    return null;
  }

  return new google.auth.GoogleAuth({
    credentials: sa,
    scopes: [SCOPE],
  });
}

export interface GSCRow {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

/**
 * Fetch query-level data for a date range.
 * Returns null if credentials are missing.
 */
export async function fetchGSCQueries(
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
  rowLimit = 100
): Promise<GSCRow[] | null> {
  const auth = getAuth();
  if (!auth) return null;

  const wmt = google.webmasters({ version: "v3", auth });

  try {
    const res = await wmt.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit,
        startRow: 0,
      },
    });

    const rows = res.data.rows ?? [];
    return rows.map((r) => ({
      query: (r.keys?.[0] as string) ?? "",
      impressions: r.impressions ?? 0,
      clicks: r.clicks ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));
  } catch (err) {
    console.error("[gsc] fetchGSCQueries error:", err);
    return null;
  }
}

/**
 * Find queries with impressions > threshold AND ctr < ctrThreshold.
 */
export function findLowCTRQueries(
  rows: GSCRow[],
  impressionThreshold = 100,
  ctrThreshold = 0.01
) {
  return rows.filter(
    (r) => r.impressions > impressionThreshold && r.ctr < ctrThreshold
  );
}
