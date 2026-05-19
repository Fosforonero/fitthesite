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
  slug: string;
  kicker: string;
  h1: string;
  sub: string;
  painTitle: string;
  painBody: string;
  pillars: Pillar[];
  howTitle: string;
  howBody: string;
  faqTitle: string;
  faqs: Faq[];
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary?: { label: string; href: string };
  crumbName: string;
};

/**
 * Landing SEO strengths-based — riusabile per landing long-tail.
 * Layout editoriale + generous whitespace + ambient gradient + a11y.
 *
 * REGOLA BRAND: no menzioni competitor app. OK hardware/OS names.
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
    <>
      <JsonLd data={jsonLd} />

      <style>{`
        @keyframes fm-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fm-fade-up { animation: fm-fade-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .fm-fade-up[data-delay="1"] { animation-delay: 80ms; }
        .fm-fade-up[data-delay="2"] { animation-delay: 160ms; }
        .fm-fade-up[data-delay="3"] { animation-delay: 240ms; }
        @media (prefers-reduced-motion: reduce) {
          .fm-fade-up { animation: none; }
        }
      `}</style>

      <article className="relative overflow-hidden">
        {/* Ambient atmosphere — radial gradients in background, sotto contenuto */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -right-40 w-[600px] h-[600px] rounded-full bg-accent/8 blur-[120px]" />
          <div className="absolute top-[600px] -left-40 w-[500px] h-[500px] rounded-full bg-brand-aqua/8 blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-32">
          <Breadcrumbs locale={locale} items={[{ name: crumbName, path: `/${locale}/${slug}` }]} />

          {/* Hero */}
          <header className="mt-12 sm:mt-16 mb-24 sm:mb-32 max-w-4xl">
            <p
              className="fm-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-divider bg-bg-secondary/40 text-[11px] uppercase tracking-[0.18em] text-brand-aqua font-semibold"
            >
              <span aria-hidden className="w-1 h-1 rounded-full bg-brand-aqua" />
              {kicker}
            </p>

            <h1
              className="fm-fade-up mt-6 font-display text-[2.25rem] sm:text-5xl lg:text-6xl font-semibold tracking-tighter text-text-primary leading-[1.05]"
              data-delay="1"
            >
              {h1}
            </h1>

            <p
              className="fm-fade-up mt-7 text-lg sm:text-xl text-text-secondary leading-relaxed max-w-3xl"
              data-delay="2"
            >
              {sub}
            </p>
          </header>

          {/* Pain point — editorial pull quote style */}
          <section className="mb-24 sm:mb-32 max-w-3xl">
            <div className="relative rounded-3xl border border-divider bg-bg-card/40 backdrop-blur-sm p-8 sm:p-12">
              <div
                aria-hidden
                className="absolute top-6 left-6 text-5xl text-accent/30 font-serif leading-none select-none"
              >
                &ldquo;
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-text-primary leading-snug pl-8">
                {painTitle}
              </h2>
              <p className="mt-4 text-text-secondary leading-relaxed pl-8 max-w-2xl">
                {painBody}
              </p>
            </div>
          </section>

          {/* Pillars */}
          <section className="mb-24 sm:mb-32">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-text-primary mb-10">
              {locale === "it" ? "Cosa ottieni" : "What you get"}
            </h2>
            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
              {pillars.map((p, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl border border-divider bg-bg-card/40 backdrop-blur-sm p-7 sm:p-8 transition-all duration-300 hover:border-accent/40 hover:bg-bg-card/60 hover:-translate-y-0.5"
                >
                  <div className="text-3xl mb-4" aria-hidden>{p.icon}</div>
                  <h3 className="font-display text-lg font-semibold text-text-primary leading-snug">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[15px] text-text-secondary leading-relaxed">
                    {p.body}
                  </p>
                  {/* Subtle hover indicator */}
                  <div
                    aria-hidden
                    className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* How it works — short editorial section */}
          <section className="mb-24 sm:mb-32 max-w-3xl">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-text-primary mb-6">
              {howTitle}
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">{howBody}</p>
            <Link
              href={`/${locale}/devices`}
              className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-divider text-text-primary hover:border-accent/50 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition text-sm font-medium"
            >
              {locale === "it" ? "Tutti i device supportati" : "All supported devices"}
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </section>

          {/* FAQ */}
          <section className="mb-24 sm:mb-32 max-w-3xl">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-text-primary mb-8">
              {faqTitle}
            </h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border border-divider bg-bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-accent/30 open:border-accent/30 open:bg-bg-card/60"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 p-6 font-medium text-text-primary text-[15px] leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset rounded-2xl">
                    <span>{f.q}</span>
                    <span
                      aria-hidden
                      className="shrink-0 w-6 h-6 inline-flex items-center justify-center rounded-full border border-divider text-accent text-sm transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-[15px] leading-relaxed text-text-secondary">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* CTA — dramatic close */}
          <section>
            <div className="relative rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/12 via-bg-card to-bg-secondary p-10 sm:p-14 overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl"
              />
              <div className="relative max-w-2xl">
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-text-primary leading-tight">
                  {ctaTitle}
                </h2>
                <p className="mt-4 text-text-secondary leading-relaxed text-lg">{ctaBody}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/${locale}/beta`}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full btn-cta text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card transition"
                  >
                    {ctaPrimary}
                    <span aria-hidden>→</span>
                  </Link>
                  {ctaSecondary && (
                    <Link
                      href={ctaSecondary.href}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-divider text-text-primary hover:border-accent/50 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card transition text-base"
                    >
                      {ctaSecondary.label}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
