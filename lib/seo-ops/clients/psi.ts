/**
 * PageSpeed Insights (PSI) API client.
 *
 * Auth: API key via GOOGLE_PSI_API_KEY env var.
 * Free tier: 25,000 queries/day — ample for 5 pages/day.
 *
 * Returns null if credentials are not configured.
 */

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export interface PSIResult {
  url: string;
  strategy: "mobile" | "desktop";
  lcp?: number;   // Largest Contentful Paint (ms)
  cls?: number;   // Cumulative Layout Shift (score)
  fid?: number;   // First Input Delay (ms) — may be absent in newer CrUX
  ttfb?: number;  // Time to First Byte (ms)
  score?: number; // Performance score 0-100
  category?: "FAST" | "AVERAGE" | "SLOW";
}

export async function runPSI(
  url: string,
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PSIResult | null> {
  const apiKey = process.env.GOOGLE_PSI_API_KEY;
  if (!apiKey) return null;

  const endpoint = `${PSI_ENDPOINT}?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}&category=PERFORMANCE`;

  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.error(`[psi] HTTP ${res.status} for ${url}`);
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;

    const audits = data?.lighthouseResult?.audits ?? {};
    const categories = data?.lighthouseResult?.categories ?? {};
    const crux = data?.loadingExperience?.metrics ?? {};

    const lcp =
      crux?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ??
      audits?.["largest-contentful-paint"]?.numericValue;
    const cls =
      crux?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null
        ? crux.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
        : audits?.["cumulative-layout-shift"]?.numericValue;
    const fid =
      crux?.FIRST_INPUT_DELAY_MS?.percentile ??
      audits?.["max-potential-fid"]?.numericValue;
    const ttfb =
      crux?.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile ??
      audits?.["server-response-time"]?.numericValue;

    const score = Math.round(
      (categories?.performance?.score ?? 0) * 100
    );

    let category: PSIResult["category"] = undefined;
    const overallCat = data?.loadingExperience?.overall_category;
    if (overallCat === "FAST") category = "FAST";
    else if (overallCat === "AVERAGE") category = "AVERAGE";
    else if (overallCat === "SLOW") category = "SLOW";

    return { url, strategy, lcp, cls, fid, ttfb, score, category };
  } catch (err) {
    console.error(`[psi] error for ${url}:`, err);
    return null;
  }
}

/**
 * Check multiple URLs; returns only those with issues (score < 70 or category SLOW).
 */
export async function checkCWV(
  urls: string[],
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PSIResult[]> {
  const results: PSIResult[] = [];
  for (const url of urls) {
    const r = await runPSI(url, strategy);
    if (r) results.push(r);
    // Small delay to avoid rate limiting on free tier
    await new Promise((res) => setTimeout(res, 1000));
  }
  return results.filter(
    (r) => r.category === "SLOW" || (r.score !== undefined && r.score < 70)
  );
}
