import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import type { Locale } from "@/lib/i18n";

const SITE_URL = "https://www.fitmesh.fit";

export type Pillar = {
  icon: string;
  title: string;
  body: string;
};

export type Faq = {
  q: string;
  a: string;
};

export type StrengthsLandingProps = {
  locale: Locale;
  /** Path slug, es. "dashboard-galaxy-watch" (no leading slash) */
  slug: string;
  /** Microcategoria sopra l'H1, tipo "Galaxy Watch dashboard" */
  kicker: string;
  /** H1 con keyword target */
  h1: string;
  /** Sottotitolo descrittivo, max 2-3 righe */
  sub: string;
  /** Pain point per agganciare emotivamente */
  painTitle: string;
  painBody: string;
  /** 3-4 pilastri FitMesh */
  pillars: Pillar[];
  /** "Come funziona" short explainer */
  howTitle: string;
  howBody: string;
  /** FAQ con FAQPage schema (3-6 entries consigliate) */
  faqTitle: string;
  faqs: Faq[];
  /** CTA box finale */
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary?: { label: string; href: string };
  /** Breadcrumb crumb name (es. "Galaxy Watch dashboard") */
  crumbName: string;
};

/**
 * Landing SEO strengths-based — pagina riusabile per landing long-tail.
 *
 * Struttura: H1 con keyword + pain point + 3-4 pilastri + how it works +
 * FAQ con FAQPage JSON-LD + CTA al beta program.
 *
 * REGOLA BRAND: NON nominare competitor app (Health Sync, Samsung Health
 * app, Fitbit app, ecc.). OK menzionare hardware/OS (Galaxy Watch, Wear
 * OS, Pixel Watch) come integrazione target.
 */
export default function StrengthsLanding(props: StrengthsLandingProps) {
  const {
    locale,
    slug,
    kicker,
    h1,
    sub,
    painTitle,
    painBody,
    pillars,
    howTitle,
    howBody,
    faqTitle,
    faqs,
    ctaTitle,
    ctaBody,
    ctaPrimary,
    ctaSecondary,
    crumbName,
  } = props;

  const url = `${SITE_URL}/${locale}/${slug}`;
  const inLanguage = locale === "it" ? "it-IT" : "en-US";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: h1,
        description: sub,
        url,
        inLanguage,
        isPartOf: { "@id": `${SITE_URL}#website` },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs locale={locale} items={[{ name: crumbName, path: `/${locale}/${slug}` }]} />

      {/* Hero */}
      <header className="mt-8 mb-16 max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {kicker}
        </p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-text-primary leading-[1.1]">
          {h1}
        </h1>
        <p className="mt-5 text-lg text-text-secondary leading-relaxed">{sub}</p>
      </header>

      {/* Pain point */}
      <section className="mb-16">
        <div className="rounded-2xl border border-divider bg-bg-card/40 p-8">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            {painTitle}
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">{painBody}</p>
        </div>
      </section>

      {/* Pillars */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-semibold text-text-primary mb-6">
          {locale === "it" ? "Cosa ottieni" : "What you get"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="rounded-2xl border border-divider bg-bg-card/50 p-6"
            >
              <div className="text-2xl mb-3">{p.icon}</div>
              <h3 className="font-display font-semibold text-text-primary">{p.title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-semibold text-text-primary">
          {howTitle}
        </h2>
        <p className="mt-3 text-text-secondary leading-relaxed max-w-3xl">{howBody}</p>
        <div className="mt-5">
          <Link
            href={`/${locale}/devices`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill border border-divider text-text-primary hover:bg-white/5 transition text-sm"
          >
            {locale === "it" ? "Tutti i device supportati" : "All supported devices"}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-semibold text-text-primary mb-6">
          {faqTitle}
        </h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-divider bg-bg-card/40 p-5"
            >
              <summary className="flex cursor-pointer items-center justify-between font-medium text-text-primary">
                {f.q}
                <span className="text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-bg-card to-bg-secondary p-8 md:p-12">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-text-primary">
            {ctaTitle}
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed max-w-2xl">{ctaBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/beta`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
            >
              {ctaPrimary}
              <span aria-hidden>→</span>
            </Link>
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-pill border border-divider text-text-primary hover:bg-white/5 transition text-sm"
              >
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
