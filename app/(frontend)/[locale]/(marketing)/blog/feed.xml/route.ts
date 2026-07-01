/**
 * RSS 2.0 feed del blog, uno per lingua: /{locale}/blog/feed.xml
 * Segnale di freschezza per Google, feed reader e discovery per i motori AI.
 * Statico (prerenderizzato al build come sitemap.ts).
 */
import { getBlogPosts } from "@/lib/blog/payload-source";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { locales, type Locale } from "@/lib/i18n";
import { tl } from "@/lib/blog/types";
import { coverSrc } from "@/lib/blog/covers";

export const dynamic = "force-static";

const SITE_URL = "https://www.fitmesh.fit";

const CHANNEL_DESC: Partial<Record<string, string>> = {
  it: "Guide e novita' su come unificare i dati dei tuoi wearable in un'unica dashboard, privacy-first.",
  en: "Guides and news on unifying your wearable health data into one private dashboard.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const lc = (locales.includes(locale as Locale) ? locale : "en") as Locale;

  const posts = [...(await getBlogPosts())].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const self = `${SITE_URL}/${lc}/blog/feed.xml`;
  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/${lc}/blog/${localizedBlogSlug(p.slug, lc)}`;
      const img = `${SITE_URL}${coverSrc(p)}`;
      return `    <item>
      <title>${esc(tl(p.hero.title, lc))}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description>${esc(tl(p.metaDescription, lc))}</description>
      <enclosure url="${img}" type="image/webp" />
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FitMesh Sync Blog</title>
    <link>${SITE_URL}/${lc}/blog</link>
    <description>${esc(CHANNEL_DESC[lc] ?? CHANNEL_DESC.en!)}</description>
    <language>${lc}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
