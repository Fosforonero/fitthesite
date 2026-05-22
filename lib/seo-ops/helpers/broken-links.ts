/**
 * Broken-link checker — HEAD-requests N URLs in parallel, returns failures.
 *
 * Uses HEAD to avoid downloading page bodies. Falls back to GET if HEAD
 * returns 405 (Method Not Allowed).
 *
 * Concurrency is limited to avoid hammering the server.
 */

export interface LinkCheckResult {
  url: string;
  status: number;
  ok: boolean;
  error?: string;
}

async function checkOne(url: string): Promise<LinkCheckResult> {
  try {
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "FitMeshSEOBot/1.0" },
      signal: AbortSignal.timeout(10_000),
    });

    // Some servers don't support HEAD — fall back to GET
    if (headRes.status === 405) {
      const getRes = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "FitMeshSEOBot/1.0" },
        signal: AbortSignal.timeout(10_000),
      });
      return {
        url,
        status: getRes.status,
        ok: getRes.ok,
      };
    }

    return {
      url,
      status: headRes.status,
      ok: headRes.ok,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Check a list of URLs for broken links (4xx, 5xx, or network errors).
 *
 * @param urls        URLs to check
 * @param concurrency Max parallel requests (default: 5)
 * @returns           All results, including successful ones
 */
export async function checkLinks(
  urls: string[],
  concurrency = 5
): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = [];
  const chunks: string[][] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    chunks.push(urls.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const batch = await Promise.all(chunk.map(checkOne));
    results.push(...batch);
    // Small delay between batches to be polite
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  return results;
}

/**
 * Returns only the broken entries (non-2xx or error).
 */
export function filterBroken(results: LinkCheckResult[]): LinkCheckResult[] {
  return results.filter((r) => !r.ok);
}
