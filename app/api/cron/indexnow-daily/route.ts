import { NextResponse } from "next/server";
import { pingIndexNow } from "@/lib/seo/indexnow";
import { getBlogPosts } from "@/lib/blog/payload-source";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { localizedLandingSlug } from "@/lib/blog/slug-i18n";
import { LANDING_PAGES } from "@/lib/landing/data";
import { PROVIDERS } from "@/lib/providers/data";
import { PROVIDER_MODELS } from "@/lib/providers/models";

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

  // Blog posts updated in the last 7 days
  for (const post of await getBlogPosts()) {
    const updated = new Date(post.updatedAt ?? post.publishedAt).getTime();
    if (updated > sevenDaysAgo) {
      for (const locale of LOCALES) {
        urls.push(`${SITE_URL}/${locale}/blog/${localizedBlogSlug(post.slug, locale)}`);
      }
    }
  }

  // Landing pages updated in the last 7 days
  for (const lp of LANDING_PAGES) {
    const updated = new Date(lp.updatedAt).getTime();
    if (updated > sevenDaysAgo) {
      for (const locale of LOCALES) {
        urls.push(`${SITE_URL}/${locale}/lp/${localizedLandingSlug(lp.slug, locale)}`);
      }
    }
  }

  // Provider pages — sempre incluse (17 × 11 = 187 URL, cambiano mensilmente)
  for (const p of PROVIDERS) {
    for (const locale of LOCALES) {
      urls.push(`${SITE_URL}/${locale}/sync/${p.slug}`);
    }
  }

  // Device model pages — sempre incluse (24 × 11 = 264 URL, specs stabili)
  for (const [providerSlug, models] of Object.entries(PROVIDER_MODELS)) {
    for (const m of models) {
      for (const locale of LOCALES) {
        urls.push(`${SITE_URL}/${locale}/sync/${providerSlug}/${m.slug}`);
      }
    }
  }

  // Core pages always included (homepage + integrations)
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
