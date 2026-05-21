import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { BlogRenderer } from "@/components/blog/BlogRenderer";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { LANDING_PAGES, LANDING_PAGES_BY_SLUG } from "@/lib/landing/data";

const SITE_URL = "https://www.fitmesh.fit";

export function generateStaticParams() {
  return LANDING_PAGES.flatMap((p) =>
    locales.map((locale) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;
  const lp = LANDING_PAGES_BY_SLUG[slug];
  if (!lp) return {};

  const path = `/${lc}/lp/${lp.slug}`;
  const title = lp.hero.title[lc];
  const description = lp.metaDescription[lc];

  return {
    title: `${title} — FitMesh Sync`,
    description,
    keywords: [lp.primaryKeyword[lc], ...lp.secondaryKeywords[lc]].join(", "),
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/lp/${lp.slug}`,
        en: `${SITE_URL}/en/lp/${lp.slug}`,
        "x-default": `${SITE_URL}/it/lp/${lp.slug}`,
      },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
      alternateLocale: locales.filter((l) => l !== lc).map((l) => ogLocale[l]),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const I18N = {
  it: {
    faqHeading: "Domande frequenti",
    disclaimerHeading: "Disclaimer",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync è un prodotto indipendente. ${brands.join(", ")}${brands.length > 1 ? " sono marchi" : " è un marchio"} dei rispettivi proprietari. Questa pagina non implica affiliazione né sponsorizzazione.`,
    finalCtaHeading: "Pronto a iniziare?",
    finalCtaSubheading: "Scarica FitMesh Sync sul telefono Android. La dashboard web è inclusa.",
  },
  en: {
    faqHeading: "Frequently asked questions",
    disclaimerHeading: "Disclaimer",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync is an independent product. ${brands.join(", ")} ${brands.length > 1 ? "are trademarks" : "is a trademark"} of their respective owners. This page implies no affiliation or sponsorship.`,
    finalCtaHeading: "Ready to start?",
    finalCtaSubheading: "Download FitMesh Sync on your Android phone. The web dashboard is included.",
  },
} as const;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const lp = LANDING_PAGES_BY_SLUG[slug];
  if (!lp) notFound();
  const t = I18N[lc];

  const path = `/${lc}/lp/${lp.slug}`;

  // JSON-LD: WebPage (la pagina è una landing, non un articolo editoriale)
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    name: lp.hero.title[lc],
    description: lp.metaDescription[lc],
    url: `${SITE_URL}${path}`,
    inLanguage: lc === "it" ? "it-IT" : "en-US",
    datePublished: lp.publishedAt,
    dateModified: lp.updatedAt,
    isPartOf: { "@id": `${SITE_URL}#website` },
  };

  const faqLd =
    lp.faq && lp.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: lp.faq.map((f) => ({
            "@type": "Question",
            name: f.q[lc],
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a[lc],
            },
          })),
        }
      : null;

  const primaryHref = lp.hero.primaryCta.href[lc];
  const secondaryHref = lp.hero.secondaryCta?.href[lc];

  return (
    <>
      <JsonLd data={webPageLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <Breadcrumbs
        items={[{ name: lp.hero.title[lc], path }]}
        locale={lc}
      />

      {/* HERO con CTA evidenti */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10">
        <div
          aria-hidden
          className="halo-conic absolute left-1/2 top-0 -z-10 h-[420px] w-[680px] -translate-x-1/2 opacity-40 animate-float"
        />
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {lp.hero.kicker[lc]}
        </p>
        <h1 className="mt-4 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl leading-[1.1]">
          {lp.hero.title[lc]}
        </h1>
        <p className="mt-6 text-lg text-text-secondary max-w-2xl leading-relaxed">
          {lp.hero.subtitle[lc]}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={primaryHref}
            className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
          >
            {lp.hero.primaryCta.label[lc]}
          </Link>
          {secondaryHref && lp.hero.secondaryCta && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center px-6 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
            >
              {lp.hero.secondaryCta.label[lc]}
            </Link>
          )}
        </div>
      </section>

      {/* BODY */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <BlogRenderer sections={lp.body} locale={lc} />
      </section>

      {/* FAQ */}
      {lp.faq && lp.faq.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 pb-12">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {t.faqHeading}
          </h2>
          <div className="mt-6 space-y-4">
            {lp.faq.map((f, i) => (
              <details
                key={i}
                className="card p-5 group [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="cursor-pointer flex items-start justify-between gap-4 text-text-primary font-medium">
                  <span>{f.q[lc]}</span>
                  <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                  {f.a[lc]}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* FINAL CTA con StoreButtons */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20 text-center">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {t.finalCtaHeading}
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">
          {t.finalCtaSubheading}
        </p>
        <div className="mt-8 flex justify-center">
          <StoreButtonsRow locale={lc} className="justify-center" />
        </div>
      </section>

      {/* DISCLAIMER brand */}
      {lp.brandsMentioned && lp.brandsMentioned.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <div className="rounded-card border border-divider bg-bg-card/40 p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold">
              {t.disclaimerHeading}
            </p>
            <p className="mt-2 text-xs text-text-muted leading-relaxed">
              {t.disclaimer(lp.brandsMentioned)}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
