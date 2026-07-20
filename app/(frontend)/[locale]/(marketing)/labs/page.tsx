import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";
import { organizationCompactRef } from "@/components/seo/OrganizationJsonLd";
import { authorCompactNode } from "@/lib/seo/entities";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  LABS_LOCALES,
  liveLabsTools,
  plannedLabsTools,
  localizedLabsSlug,
  lt,
  ltl,
} from "@/lib/labs/registry";
import { resolveLabsLocale } from "@/lib/labs/locale-redirect";
import { LABS_INDEX_CONTENT } from "@/lib/labs/index-content";
import { LabsBreadcrumbNav, LabsHero, LabsProseSection } from "@/components/labs/LabsChrome";

export function generateStaticParams() {
  return (LABS_LOCALES as readonly ("it" | "en")[]).map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lc = resolveLabsLocale(locale as Locale);
  const c = LABS_INDEX_CONTENT;
  const path = `/${lc}/labs`;
  const title = lt(c.metaTitle, lc);
  const description = lt(c.metaDescription, lc);

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/labs`,
        en: `${SITE_URL}/en/labs`,
        // P1.1 Fase 1: x-default punta all'inglese (pagina stabile 200,
        // non una catena di redirect) - non all'italiano come nel resto
        // del sito, perché Labs è pensato per un pubblico internazionale.
        "x-default": `${SITE_URL}/en/labs`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      type: "website",
      images: [{ url: `${SITE_URL}${path}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LabsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const requested = locale as Locale;
  const resolved = resolveLabsLocale(requested);

  if (resolved !== requested) {
    redirect(`/${resolved}/labs`);
  }

  const c = LABS_INDEX_CONTENT;
  const lc = resolved;
  const path = `/${lc}/labs`;
  const live = liveLabsTools();
  const planned = plannedLabsTools();

  // P1.1 Fase 10: CollectionPage (non WebPage) + ItemList dei soli tool
  // live: un tool "coming-soon" non ha slug/URL (vedi registry.ts), quindi
  // non può comparire qui: l'ItemList resta sempre composta solo da pagine
  // realmente raggiungibili.
  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}${path}#collectionpage`,
    url: `${SITE_URL}${path}`,
    name: lt(c.metaTitle, lc),
    description: lt(c.metaDescription, lc),
    inLanguage: schemaLanguage(lc),
    publisher: organizationCompactRef(),
    author: authorCompactNode(),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: live.map((tool, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/${lc}/labs/${localizedLabsSlug(tool, lc)}`,
        name: lt(tool.name, lc),
      })),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: lt(c.breadcrumbHome, lc), item: `${SITE_URL}/${lc}` },
      { "@type": "ListItem", position: 2, name: lt(c.breadcrumbLabs, lc) },
    ],
  };

  return (
    <>
      <JsonLd data={collectionPageLd} />
      <JsonLd data={breadcrumbLd} />

      <LabsBreadcrumbNav
        items={[
          { name: lt(c.breadcrumbHome, lc), href: `/${lc}` },
          { name: lt(c.breadcrumbLabs, lc) },
        ]}
      />

      <LabsHero kicker={lt(c.heroKicker, lc)} title={lt(c.heroTitle, lc)} subtitle={lt(c.heroSubtitle, lc)} />

      <LabsProseSection heading={lt(c.missionHeading, lc)}>
        {ltl(c.missionParagraphs, lc).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </LabsProseSection>

      <LabsProseSection heading={lt(c.privacyHeading, lc)}>
        {ltl(c.privacyParagraphs, lc).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </LabsProseSection>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {lt(c.liveToolsHeading, lc)}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {live.map((tool) => (
            <Link
              key={tool.key}
              href={`/${lc}/labs/${localizedLabsSlug(tool, lc)}`}
              className="block h-full rounded-card border border-brand-aqua/25 bg-gradient-to-br from-brand-aqua/[0.06] via-bg-card to-bg-card p-5 hover:border-brand-aqua/40 transition"
            >
              <p className="font-medium text-text-primary">{lt(tool.name, lc)}</p>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {lt(tool.shortDescription, lc)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {planned.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {lt(c.comingSoonHeading, lc)}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {planned.map((tool) => (
              <div
                key={tool.key}
                className="h-full rounded-card border border-divider bg-bg-card/30 p-5 opacity-70"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-text-primary">{lt(tool.name, lc)}</p>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-pill border border-divider text-text-muted">
                    {lt(c.comingSoonBadge, lc)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {lt(tool.shortDescription, lc)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="h-16" />
    </>
  );
}
