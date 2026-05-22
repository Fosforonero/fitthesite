/**
 * Sitemap crawler — fetches sitemap.xml and returns the list of URLs.
 *
 * Handles:
 *   - Simple <urlset> sitemaps
 *   - Sitemap index files (<sitemapindex>) — one level of nesting
 *
 * Uses fast-xml-parser for robust XML parsing.
 */
import { XMLParser } from "fast-xml-parser";

const SITE_SITEMAP = "https://www.fitmesh.fit/sitemap.xml";

const parser = new XMLParser({ ignoreAttributes: false });

async function fetchXML(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "FitMeshSEOBot/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`[sitemap] HTTP ${res.status} for ${url}`);
      return null;
    }
    return res.text();
  } catch (err) {
    console.warn(`[sitemap] fetch error for ${url}:`, err);
    return null;
  }
}

function extractUrls(parsed: Record<string, unknown>): string[] {
  // urlset > url > loc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const urlset = (parsed as any)?.urlset?.url;
  if (!urlset) return [];
  const items = Array.isArray(urlset) ? urlset : [urlset];
  return items
    .map((u: { loc?: string }) => u?.loc)
    .filter((u): u is string => typeof u === "string");
}

function extractSitemapUrls(parsed: Record<string, unknown>): string[] {
  // sitemapindex > sitemap > loc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sitemapIndex = (parsed as any)?.sitemapindex?.sitemap;
  if (!sitemapIndex) return [];
  const items = Array.isArray(sitemapIndex) ? sitemapIndex : [sitemapIndex];
  return items
    .map((s: { loc?: string }) => s?.loc)
    .filter((s): s is string => typeof s === "string");
}

/**
 * Fetch and parse the sitemap, returning all content URLs.
 * Returns empty array on error (graceful degradation).
 */
export async function fetchSitemapUrls(
  sitemapUrl = SITE_SITEMAP
): Promise<string[]> {
  const xml = await fetchXML(sitemapUrl);
  if (!xml) return [];

  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xml) as Record<string, unknown>;
  } catch (err) {
    console.error("[sitemap] XML parse error:", err);
    return [];
  }

  // Check if it's a sitemap index
  const childSitemaps = extractSitemapUrls(parsed);
  if (childSitemaps.length > 0) {
    const all: string[] = [];
    for (const childUrl of childSitemaps) {
      const childXml = await fetchXML(childUrl);
      if (!childXml) continue;
      try {
        const childParsed = parser.parse(childXml) as Record<string, unknown>;
        all.push(...extractUrls(childParsed));
      } catch {
        console.warn(`[sitemap] failed to parse child sitemap: ${childUrl}`);
      }
    }
    return all;
  }

  return extractUrls(parsed);
}
