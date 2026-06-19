import { NextResponse } from "next/server";
import { pingIndexNow } from "@/lib/seo/indexnow";
import { getBlogPosts } from "@/lib/blog/payload-source";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.fitmesh.fit";
const LOCALES = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko"] as const;

export async function GET(req: Request) {
  // Fail-closed: senza CRON_SECRET configurato l'endpoint resta inaccessibile.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "cron_misconfigured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const urls: string[] = [];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Blog posts updated in the last 7 days — ping both IT and EN URLs
  // (BlogPost is bilingual: same slug served under /it/ and /en/)
  for (const post of await getBlogPosts()) {
    const updated = new Date(post.updatedAt ?? post.publishedAt).getTime();
    if (updated > sevenDaysAgo) {
      for (const locale of LOCALES) {
        urls.push(`${SITE_URL}/${locale}/blog/${localizedBlogSlug(post.slug, locale)}`);
      }
    }
  }

  // Core pages always included (homepage + integrations, both locales)
  for (const locale of LOCALES) {
    urls.push(`${SITE_URL}/${locale}`);
    urls.push(`${SITE_URL}/${locale}/integrations`);
  }

  if (urls.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "no_urls_to_ping" });
  }

  const result = await pingIndexNow(urls);
  return NextResponse.json({ total: urls.length, ...result });
}
