import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LegalPage, Section, List } from "@/components/legal/LegalLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationCompactRef } from "@/components/seo/OrganizationJsonLd";
import { authorCompactNode } from "@/lib/seo/entities";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { SITE_URL } from "@/lib/product-facts";
import { ogLocale, type Locale } from "@/lib/i18n";
import { SELF_HOST_COPY, t, tl, type TwoLocale } from "@/lib/content/self-host-copy";

/**
 * Sprint P0.11-A: /self-host esiste solo in IT/EN (vedi middleware.ts —
 * le altre 13 locale collassano su /en/self-host in un solo hop, mai
 * renderizzate qui). generateStaticParams limitato per coerenza col
 * routing reale: build non produce mai /de/self-host ecc. come pagina 200
 * a se stante.
 */
function resolveSelfHostLocale(locale: Locale): TwoLocale {
  return locale === "it" ? "it" : "en";
}

export function generateStaticParams() {
  return (["it", "en"] as const).map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lc = resolveSelfHostLocale(locale as Locale);
  const path = `/${lc}/self-host`;
  const title = t(SELF_HOST_COPY.metaTitle, lc);
  const description = t(SELF_HOST_COPY.metaDescription, lc);

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/self-host`,
        en: `${SITE_URL}/en/self-host`,
        // x-default -> EN: stesso pattern di /labs (P1.1), pubblico
        // tecnico/internazionale, pagina stabile 200 non una catena.
        "x-default": `${SITE_URL}/en/self-host`,
      },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function SelfHostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const requested = locale as Locale;
  const resolved = resolveSelfHostLocale(requested);

  // Difesa in profondita': il middleware (P0.11-A) gia' collassa le altre
  // 13 locale su /en/self-host prima che questa pagina venga raggiunta;
  // questo redirect copre il caso (non atteso in produzione) in cui la
  // pagina venga richiesta direttamente bypassando il middleware.
  if (resolved !== requested) {
    redirect(`/${resolved}/self-host`);
  }

  const lc = resolved;
  const path = `/${lc}/self-host`;
  const c = SELF_HOST_COPY;

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name: t(c.metaTitle, lc),
    description: t(c.metaDescription, lc),
    inLanguage: schemaLanguage(lc),
    isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "FitMesh Sync" },
    publisher: organizationCompactRef(),
    author: authorCompactNode(),
  };

  return (
    <>
      <JsonLd data={webPageLd} />
      <Breadcrumbs
        locale={lc}
        items={[{ name: t(c.breadcrumbSelfHost, lc), path }]}
      />

      <LegalPage kicker={t(c.kicker, lc)} title={t(c.h1, lc)} lastUpdated="">
        <p>{t(c.intro, lc)}</p>

        <Section title={t(c.statusHeading, lc)}>
          <ul className="space-y-2">
            {tl(c.statusPoints, lc).map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-aqua mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t(c.whatItIsNotHeading, lc)}>
          <ul className="space-y-2">
            {tl(c.whatItIsNotPoints, lc).map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-aqua mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t(c.dataHeading, lc)}>
          <p>
            {t(c.dataParagraph, lc)}{" "}
            <Link
              href={`/${lc}/privacy`}
              className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
            >
              {t(c.privacyPolicyLink, lc)}
            </Link>
            .
          </p>
        </Section>

        <p className="text-sm text-text-muted">{t(c.closingParagraph, lc)}</p>

        <p className="text-sm">
          {t(c.supportPrefix, lc)}
          <Link
            href={`/${lc}/support`}
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            {t(c.supportLink, lc)}
          </Link>
          {t(c.supportSuffix, lc)}
        </p>
      </LegalPage>
    </>
  );
}
