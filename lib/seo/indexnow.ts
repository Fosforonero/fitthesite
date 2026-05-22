/**
 * IndexNow helper — POST URL list to the IndexNow API endpoint.
 *
 * IndexNow lets Bing, Yandex, and other participating search engines learn
 * about new or updated pages instantly instead of waiting for a crawl.
 *
 * Key file: public/aed642d85d1553233bd5fdec165b1d94.txt
 * Key URL:  https://www.fitmesh.fit/aed642d85d1553233bd5fdec165b1d94.txt
 *
 * Usage (from a deploy hook, API route, or post-publish script):
 *   import { pingIndexNow } from "@/lib/seo/indexnow";
 *   await pingIndexNow(["https://www.fitmesh.fit/it/blog/new-post"]);
 *
 * Wiring: not auto-run anywhere yet — wire in a Vercel deploy hook or
 * Next.js API route once the site is fully public.
 */

const SITE_URL = "https://www.fitmesh.fit";
const INDEXNOW_KEY = "aed642d85d1553233bd5fdec165b1d94";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";

export interface IndexNowResult {
  ok: boolean;
  status?: number;
  error?: string;
}

/**
 * Ping IndexNow with a list of absolute URLs.
 * Returns `ok: true` on HTTP 200 or 202; logs and returns `ok: false` otherwise.
 */
export async function pingIndexNow(urls: string[]): Promise<IndexNowResult> {
  if (!urls.length) return { ok: true };

  const body = {
    host: new URL(SITE_URL).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    if (res.ok || res.status === 202) {
      return { ok: true, status: res.status };
    }
    return { ok: false, status: res.status, error: `Unexpected HTTP ${res.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
