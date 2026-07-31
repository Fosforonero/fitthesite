import type { Metadata } from "next";
import Link from "next/link";
import { CTA_PLACEMENTS } from "@/lib/analytics/cta";
import { getDictionary, locales, type Locale } from "@/lib/i18n";
import HeroVisual from "@/components/HeroVisual";
import MockupShowcase from "@/components/MockupShowcase";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import TrustBadges from "@/components/TrustBadges";
import { JsonLd } from "@/components/seo/JsonLd";
import { MobileApplicationJsonLd } from "@/components/seo/MobileApplicationJsonLd";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import { WebSiteJsonLd } from "@/components/seo/WebSiteJsonLd";
import { PROVIDERS, statusLabel } from "@/lib/providers/data";
import { getBlogPostsBySlug } from "@/lib/blog/payload-source";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { tl, tll } from "@/lib/blog/types";
import { p } from "@/lib/pricing";
import { PRICING_SECTION } from "@/lib/pricing-section";
import Testimonials from "@/components/Testimonials";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";

/**
 * Below-the-fold marketing copy on this page (How it works, Integrations
 * teaser, Privacy bullets, Final CTA) is written as inline `lc === "it" ? ... :
 * lc === "es" ? ... : "<english>"` ternaries — it only ever branches it/es/en,
 * every other locale silently falls back to English body text under a
 * localized URL (self-canonicalized → duplicate content). Gate those locales
 * out of the index until real translations land; title/description are
 * untouched here since they already cover all 15 locales via the parent
 * `[locale]/layout.tsx` generateMetadata.
 */
import { HOME_COMPLETE_LOCALES as COMPLETE_BODY_LOCALES } from "@/lib/content/static-page-locales";
import { HOMEPAGE_COPY, tli } from "@/lib/content/homepage-copy";
import { LABS_TEASER_COPY } from "@/lib/content/labs-teaser-copy";
import { liveLabsTools, localizedLabsSlug, lt as labsLt } from "@/lib/labs/registry";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    robots: COMPLETE_BODY_LOCALES.includes(lc) ? undefined : { index: false, follow: false },
  };
}

const KPI_COLORS = ["#21E6C1", "#7CFF5B", "#1DA1FF", "#A78BFA", "#FFB547", "#FF5C7A"];

const FEATURE_ICONS = [
  // steps & distance — foot/path glyph
  (c: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 3v18M19 3v18" opacity="0.25" />
      <path d="M9 6c-1.5 2-1.5 5 0 7M15 11c1.5 2 1.5 5 0 7" />
      <circle cx="9" cy="14" r="2" />
      <circle cx="15" cy="19" r="2" />
    </svg>
  ),
  // heart rate — pulse line
  (c: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12h3l2-5 4 10 2-5h7" />
    </svg>
  ),
  // sleep — moon + zzz
  (c: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
      <path d="M16 5h3l-3 3h3" opacity="0.6" />
    </svg>
  ),
  // calories — flame
  (c: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 1.5 1 2.5 2 2.5-1-2 0-5 1-8.5z" />
    </svg>
  ),
  // dashboard — grid + spark
  (c: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </svg>
  ),
  // caregiver — people + heart
  (c: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M19 13c1.5-1.5 1.5-4 0-5.5s-3.5-1.5-5 0c-1.5-1.5-3.5-1.5-5 0" opacity="0.5" />
    </svg>
  ),
];

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);
  const postsBySlug = await getBlogPostsBySlug();

  // Curated subset (live + headline) for the inline ticker
  const tickerProviders = [
    ...PROVIDERS,
    ...PROVIDERS, // duplicate for seamless marquee
  ];

  // JSON-LD WebPage specifico per la home: linka esplicitamente l'@graph
  // (Org + WebSite + MobileApp) del layout via @id reference, e dichiara
  // primaryImageOfPage + isPartOf per knowledge graph cleaner.
  const homeLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/${lc}#webpage`,
    url: `${SITE_URL}/${lc}`,
    name: lc === "it"
      ? "FitMesh Sync — Sincronizza il tuo smartwatch a una dashboard personale"
      : lc === "es"
      ? "FitMesh Sync — Sincroniza tu smartwatch en un panel personal"
      : "FitMesh Sync — Sync your smartwatch to a personal dashboard",
    description: lc === "it"
      ? "FitMesh Sync unisce Galaxy Watch, Wear OS, Health Connect e provider cloud in una dashboard globale privacy-first: passi, battito, sonno, recupero e trend."
      : lc === "es"
      ? "FitMesh Sync reúne Galaxy Watch, Wear OS, Health Connect y proveedores en la nube en un panel global centrado en la privacidad: pasos, frecuencia cardíaca, sueño, recuperación y tendencias."
      : "FitMesh Sync brings Galaxy Watch, Wear OS, Health Connect and cloud providers into one privacy-first global dashboard: steps, heart rate, sleep, recovery and trends.",
    inLanguage: schemaLanguage(lc),
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: { "@id": `${SITE_URL}#mobile-app` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${SITE_URL}/opengraph-image`,
    },
    breadcrumb: { "@id": `${SITE_URL}/${lc}#breadcrumb` },
  };
  const homeBreadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}/${lc}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: lc === "it" ? "Home" : "Home",
        item: `${SITE_URL}/${lc}`,
      },
    ],
  };

  return (
    <>
      <OrganizationJsonLd locale={lc} />
      <WebSiteJsonLd locale={lc} />
      <JsonLd data={homeLd} />
      <JsonLd data={homeBreadcrumbLd} />
      <MobileApplicationJsonLd locale={lc} />
      {/* ════════════════════════════════════════════════════════════════
       *  HERO
       *  Composizione asimmetrica: testo 7 colonne a sinistra, visual 5
       *  a destra. Sopra: badge "live", sotto: store + ghost CTA, sotto
       *  ancora: micro social-proof row (Android + iOS, wearable, eu).
       *  ════════════════════════════════════════════════════════════ */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-24 pb-16 sm:pb-24">
        {/* Conic halo decoration behind the title */}
        <div
          aria-hidden
          className="halo-conic absolute left-0 right-0 top-0 mx-auto h-[420px] w-[640px] max-w-[90%] -z-10 opacity-60 animate-float"
        />

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left: text & CTAs */}
          <div className="lg:col-span-7" data-reveal style={{ "--reveal-delay": "0ms" } as React.CSSProperties}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border border-white/10 bg-white/[0.03] text-[11px] text-text-secondary backdrop-blur-sm">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-green" />
              </span>
              <span className="tracking-wide">{t.hero.badge}</span>
            </div>

            <h1 className="mt-7 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl text-balance">
              {t.hero.heading_1}
              <br className="hidden sm:inline" />{" "}
              <span className="text-brand-gradient">{t.hero.heading_accent}</span>
            </h1>

            <p className="mt-5 text-base text-text-secondary max-w-2xl leading-relaxed">
              {tl(HOMEPAGE_COPY.leadSentence, lc)}
            </p>

            <p className="mt-7 text-lg sm:text-xl text-text-secondary max-w-xl leading-relaxed">
              {t.hero.description}
            </p>

            <div id="download" className="mt-9 flex flex-wrap items-center gap-3">
              <StoreButtonsRow locale={lc} ctaLocation={CTA_PLACEMENTS.homepageHero} />
            </div>

            <p className="mt-5 text-xs text-text-muted">{t.hero.pricing}</p>

            {/* Trust strip — 3 tiny metrics inline */}
            <ul className="mt-10 grid grid-cols-3 max-w-md gap-6 text-left">
              <li>
                <p className="font-display text-2xl font-semibold text-text-primary tracking-tightest">
                  Android + iOS
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-text-muted leading-tight">
                  {tl(HOMEPAGE_COPY.platformsAvailableLabel, lc)}
                </p>
              </li>
              <li>
                <p className="font-display text-2xl font-semibold text-text-primary tracking-tightest">
                  {PROVIDERS.length}+
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-text-muted leading-tight">
                  {tl(HOMEPAGE_COPY.wearablesSupportedLabel, lc)}
                </p>
              </li>
              <li>
                <p className="font-display text-2xl font-semibold text-text-primary tracking-tightest">
                  🇪🇺
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-text-muted leading-tight">
                  {tl(HOMEPAGE_COPY.euServersLabel, lc)}
                </p>
              </li>
            </ul>
          </div>

          {/* Right: phone mockup */}
          <div className="lg:col-span-5" data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties}>
            <HeroVisual locale={lc === "it" ? "it" : "en"} />
          </div>
        </div>
      </section>

      {/* Trust signals (E-E-A-T): Made in Italy · EU servers · GDPR · Indie. */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <TrustBadges locale={lc === "it" ? "it" : "en"} />
      </section>

      {/* ════════════════════════════════════════════════════════════════
       *  LOGO CLOUD — marquee infinito dei provider supportati.
       *  Niente loghi reali (rischio TM); usiamo i monogrammi colorati
       *  consistenti col resto del sito. Effetto "ecosistema vivo".
       *  ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-y border-white/[0.05] bg-white/[0.015] py-8" data-reveal>
        <p className="text-center text-[10px] uppercase tracking-[0.28em] text-text-muted font-semibold mb-6">
          {tl(HOMEPAGE_COPY.worksWithKicker, lc)}
        </p>
        <div
          className="relative flex gap-10 sm:gap-14 animate-marquee whitespace-nowrap"
          style={{ width: "max-content" }}
        >
          {tickerProviders.map((p, i) => (
            <div
              key={`${p.slug}-${i}`}
              className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity"
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center font-display text-xs font-bold text-white flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${p.brandColor}, ${p.brandColor}b0)`,
                  boxShadow: `0 4px 14px -6px ${p.brandColor}aa`,
                }}
              >
                {p.initial}
              </span>
              <span className="font-display text-sm font-medium text-text-secondary tracking-tight">
                {p.name}
              </span>
            </div>
          ))}
        </div>
        {/* Fade gutter on both sides for elegance */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg to-transparent" />
      </section>

      {/* ════════════════════════════════════════════════════════════════
       *  SHOWCASE — mockup app reali (multi-device, famiglia, insights),
       *  stessi componenti React di /mockups/<screen> scalati via CSS.
       *  ════════════════════════════════════════════════════════════ */}
      <MockupShowcase
        locale={lc}
        kicker={t.showcase.kicker}
        heading={t.showcase.heading}
        sub={t.showcase.sub}
        captions={t.showcase.captions}
      />

      {/* ════════════════════════════════════════════════════════════════
       *  FEATURES — Bento-ish grid (asimmetria controllata)
       *  Prima card span 2 colonne con visual decorativo, le altre 5
       *  riempiono la griglia in modo equilibrato.
       *  ════════════════════════════════════════════════════════════ */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32">
        <div className="max-w-2xl" data-reveal>
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
            {t.features.kicker}
          </p>
          <h2 className="mt-4 font-display text-display font-semibold tracking-tightest text-text-primary text-balance">
            {t.features.heading}
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f: { title: string; desc: string }, i: number) => {
            const color = KPI_COLORS[i % KPI_COLORS.length];
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            const isHero = i === 0;
            return (
              <article
                key={f.title}
                data-reveal
                style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
                className={`group relative card p-7 overflow-hidden hover:-translate-y-1 transition-all duration-300 ${
                  isHero ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                {/* Hover spotlight that follows the colour */}
                <div
                  aria-hidden
                  className="absolute -top-24 -right-20 w-56 h-56 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ background: color }}
                />

                <div
                  className="relative inline-flex items-center justify-center w-11 h-11 rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${color}22, ${color}08)`,
                    boxShadow: `inset 0 0 0 1px ${color}33`,
                  }}
                >
                  <span className="w-5 h-5 inline-block" style={{ color }}>
                    {Icon(color)}
                  </span>
                </div>

                <h3 className="relative mt-5 font-display text-lg font-semibold text-text-primary tracking-tight">
                  {f.title}
                </h3>
                <p className="relative mt-2 text-sm text-text-secondary leading-relaxed">
                  {f.desc}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
       *  HOW IT WORKS — 3 step orizzontali con linea che connette
       *  ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-28 sm:mt-36" data-reveal>
        <div className="max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
            {tl(HOMEPAGE_COPY.howItWorksKicker, lc)}
          </p>
          <h2 className="mt-4 font-display text-display font-semibold tracking-tightest text-text-primary text-balance">
            {tl(HOMEPAGE_COPY.howItWorksHeading, lc)}
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {tli(HOMEPAGE_COPY.steps, lc).map((s, i) => (
            <div key={i} className="relative card-glass p-7 hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center gap-3">
                <span
                  className="font-display text-2xl font-bold tracking-tightest"
                  style={{
                    background:
                      "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 50%, #1DA1FF 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  0{i + 1}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-semibold">
                  {tl(HOMEPAGE_COPY.stepLabel, lc)}
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-text-primary">{s.t}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
       *  INTEGRATIONS PREVIEW — drives SEO to /sync/[provider]
       *  ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-28 sm:mt-36" data-reveal>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
              {tl(HOMEPAGE_COPY.integrationsKicker, lc)}
            </p>
            <h2 className="mt-4 font-display text-display font-semibold tracking-tightest text-text-primary max-w-2xl text-balance">
              {tl(HOMEPAGE_COPY.integrationsHeading, lc)}
            </h2>
            <Link
              href={`/${lc}/fitness-data-sync`}
              className="group mt-3 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-aqua transition"
            >
              {tl(HOMEPAGE_COPY.integrationsDashboardTeaser, lc)}
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <Link
            href={`/${lc}/integrations`}
            className="group inline-flex items-center gap-1.5 text-sm text-brand-aqua hover:text-brand-green transition"
          >
            {tl(HOMEPAGE_COPY.seeAll, lc)}
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {PROVIDERS.map((p) => {
            const st = statusLabel(p.status, lc);
            return (
              <Link
                key={p.slug}
                href={`/${lc}/sync/${p.slug}`}
                className="group card p-4 hover:-translate-y-1 transition-all flex flex-col items-center text-center gap-2 relative overflow-hidden"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(140px 80px at 50% 0%, ${p.brandColor}22, transparent 70%)`,
                  }}
                />
                <span
                  className="relative w-12 h-12 rounded-full flex items-center justify-center font-display text-base font-bold text-white transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${p.brandColor}, ${p.brandColor}cc)`,
                    boxShadow: `0 6px 16px -8px ${p.brandColor}88`,
                  }}
                >
                  {p.initial}
                </span>
                <p className="relative text-xs font-medium text-text-primary leading-tight">
                  {p.name}
                </p>
                <span
                  className="relative text-[9px] uppercase tracking-wider font-semibold"
                  style={{ color: st.color }}
                >
                  {st.text}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
       *  FITMESH LABS — sezione statica, P1.1 Fase 2.2. Nessuna richiesta
       *  di rete: solo link verso le pagine tool reali (liveLabsTools()),
       *  mai una card verso un tool "coming-soon" (niente URL vuoti).
       *  ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-28 sm:mt-36" data-reveal>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand-aqua">
              {tl(LABS_TEASER_COPY.kicker, lc)}
            </p>
            <h2 className="mt-2 font-display text-display font-semibold tracking-tightest text-text-primary">
              {tl(LABS_TEASER_COPY.heading, lc)}
            </h2>
            <p className="mt-2 text-text-secondary max-w-xl">{tl(LABS_TEASER_COPY.subheading, lc)}</p>
          </div>
          <Link
            href={`/${lc === "it" ? "it" : "en"}/labs`}
            className="shrink-0 text-sm text-brand-aqua hover:underline"
          >
            {tl(LABS_TEASER_COPY.ctaLabel, lc)} →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {liveLabsTools().map((tool) => {
            const toolLocale = lc === "it" ? "it" : "en";
            return (
              <Link
                key={tool.key}
                href={`/${toolLocale}/labs/${localizedLabsSlug(tool, toolLocale)}`}
                className="block h-full rounded-card border border-brand-aqua/25 bg-gradient-to-br from-brand-aqua/[0.06] via-bg-card to-bg-card p-5 hover:border-brand-aqua/40 transition"
              >
                <p className="font-medium text-text-primary">
                  <span aria-hidden className="mr-2">{tool.icon}</span>
                  {labsLt(tool.name, toolLocale)}
                </p>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {labsLt(tool.shortDescription, toolLocale)}
                </p>
              </Link>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-text-muted">{tl(LABS_TEASER_COPY.privacyNote, lc)}</p>
      </section>

      {/* ════════════════════════════════════════════════════════════════
       *  PRIVACY MANIFESTO — bordo grigio, halo brand, copy + 3 punti
       *  ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-28 sm:mt-36" data-reveal>
        <div className="card-glass p-10 sm:p-14 relative overflow-hidden">
          <div
            aria-hidden
            className="halo-conic absolute -top-24 -right-24 w-[420px] h-[420px] opacity-50 animate-float"
          />

          <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
                {t.privacy_block.kicker}
              </p>
              <h2 className="mt-4 font-display text-display font-semibold tracking-tightest text-text-primary text-balance">
                {t.privacy_block.heading}
              </h2>
              <p className="mt-5 text-text-secondary text-lg leading-relaxed">
                {t.privacy_block.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/${lc}/privacy`}
                  className="inline-flex px-5 py-2.5 rounded-pill btn-ghost text-sm"
                >
                  {t.privacy_block.cta}
                </Link>
                <a
                  href="mailto:privacy@fitmesh.fit"
                  className="inline-flex px-5 py-2.5 rounded-pill text-sm text-text-secondary hover:text-text-primary transition"
                >
                  privacy@fitmesh.fit
                </a>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-3">
              {tli(HOMEPAGE_COPY.privacyPoints, lc).map((p) => (
                <li
                  key={p.t}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex gap-4"
                >
                  <span
                    className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(33,230,193,0.18), rgba(124,255,91,0.10))",
                      boxShadow: "inset 0 0 0 1px rgba(33,230,193,0.30)",
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#21E6C1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-text-primary">{p.t}</p>
                    <p className="mt-1 text-sm text-text-secondary leading-relaxed">{p.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
       *  BRING YOUR OWN AI — manifesto gemello del privacy block: stessa
       *  card-glass, stesso halo, 2 colonne (pitch + link /ai | checklist).
       *  Tagline in EN non tradotta di proposito (slogan globale).
       *  ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-28 sm:mt-36" data-reveal>
        <div className="card-glass p-10 sm:p-14 relative overflow-hidden">
          <div
            aria-hidden
            className="halo-conic absolute -top-24 -left-24 w-[420px] h-[420px] opacity-50 animate-float"
          />

          <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
                {lc === "it" ? "La tua AI, le tue regole" : lc === "es" ? "Tu IA, tus reglas" : "Your AI, your rules"}
              </p>
              <h2 className="mt-4 font-display text-display-xl font-semibold tracking-tightest text-text-primary text-balance">
                Use your favorite AI assistant with your own health data.
              </h2>
              <p className="mt-5 text-text-secondary text-lg leading-relaxed">
                {lc === "it"
                  ? "FitMesh non ti chiude in un assistente proprietario. Prepara un riepilogo pulito dei tuoi dati e sei tu a scegliere con chi condividerlo: ChatGPT, Claude, Gemini o quello che preferisci."
                  : lc === "es"
                  ? "FitMesh no te encierra en un asistente propio. Prepara un resumen claro de tus datos y tú eliges con quién compartirlo: ChatGPT, Claude, Gemini o el que prefieras."
                  : "FitMesh doesn't lock you into a proprietary assistant. It prepares a clean summary of your data, and you choose who to share it with: ChatGPT, Claude, Gemini, or whatever you use."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/${lc}/ai`}
                  className="inline-flex px-5 py-2.5 rounded-pill btn-ghost text-sm"
                >
                  {lc === "it" ? "Scopri come funziona" : lc === "es" ? "Descubre cómo funciona" : "See how it works"}
                </Link>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-3">
              {[
                {
                  t: "Bring your own wearable.",
                  d: lc === "it"
                    ? "Galaxy Watch, Wear OS, anello smart, Health Connect: colleghi quello che hai già."
                    : lc === "es"
                    ? "Galaxy Watch, Wear OS, anillo inteligente, Health Connect: conectas lo que ya tienes."
                    : "Galaxy Watch, Wear OS, a smart ring, Health Connect: connect whatever you already own.",
                },
                {
                  t: "Bring your own AI.",
                  d: lc === "it"
                    ? "Nessun chatbot proprietario. Il riepilogo è tuo, l'assistente lo scegli tu."
                    : lc === "es"
                    ? "Sin chatbot propio. El resumen es tuyo, el asistente lo eliges tú."
                    : "No proprietary chatbot. The summary is yours, you pick the assistant.",
                },
              ].map((it) => (
                <li
                  key={it.t}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex gap-4"
                >
                  <span
                    className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(29,161,255,0.18), rgba(167,139,250,0.10))",
                      boxShadow: "inset 0 0 0 1px rgba(29,161,255,0.30)",
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#1DA1FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-text-primary">{it.t}</p>
                    <p className="mt-1 text-sm text-text-secondary leading-relaxed">{it.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
       *  PRICING — Free / Pro / Prova 14gg
       *  ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-28 sm:mt-36" data-reveal>
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
            {tl(PRICING_SECTION.kicker, lc)}
          </p>
          <h2 className="mt-4 font-display text-display font-semibold tracking-tightest text-text-primary max-w-2xl text-balance">
            {tl(PRICING_SECTION.heading, lc)}
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl leading-relaxed">
            {tl(PRICING_SECTION.subhead, lc)}
          </p>
          {(lc === "it" || lc === "en") && (
            <Link
              href={`/${lc}/blog/fitmesh-gratis-prezzo-founder`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-aqua hover:text-brand-green transition"
            >
              {lc === "it" ? "Guida completa ai prezzi" : "Full pricing guide"}
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
        <div className="grid gap-5 md:grid-cols-2 items-stretch max-w-3xl">
          {/*
           * 31/07 (Matteo, review visiva post-deploy): la vecchia card "Free"
           * (freeName/freeTagline/freeLabel/freeFeatures) e questa erano la
           * STESSA offerta — 14 giorni di prova Pro, poi si sceglie un piano
           * — solo con stili e feature-list diverse: due card ridondanti
           * l'una accanto all'altra. Rimossa la prima, resta solo questa
           * (evidenziata, badge "Consigliato"). freeName/freeTagline/
           * freeFeatures/freeLabel rimossi da lib/pricing-section.ts (zero
           * altri consumer, grep verificato).
           */}
          <div className="relative card p-7 flex flex-col h-full border-brand-aqua/30 bg-brand-aqua/[0.06]">
            <span className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.18em] font-semibold text-[#050816] bg-brand-aqua rounded-pill px-2.5 py-1">
              {tl(PRICING_SECTION.recommendedBadge, lc)}
            </span>
            <h3 className="font-display text-lg font-semibold text-text-primary">{tl(HOMEPAGE_COPY.trialName, lc)}</h3>
            <p className="mt-1 text-sm text-text-muted">{tl(HOMEPAGE_COPY.trialTagline, lc)}</p>
            <p className="mt-4 font-display text-3xl font-semibold tracking-tightest text-brand-aqua">{tl(PRICING_SECTION.trialPeriodLabel, lc)}</p>
            <ul className="mt-5 space-y-2.5 flex-1">
              {tll(PRICING_SECTION.trialFeatures, lc).map((f) => (
                <li key={f} className="flex gap-2 text-sm text-text-secondary">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="#21E6C1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 13l4 4L19 7" /></svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {/* Fase 7: CTA "Prova 14 giorni" — e' la conversione del funnel
                  post-Founder. */}
              <StoreButtonsRow locale={lc} ctaLocation={CTA_PLACEMENTS.homepagePricingTrial} />
            </div>
          </div>
          {/* Pro */}
          <div className="card p-7 flex flex-col">
            <h3 className="font-display text-lg font-semibold text-text-primary">{tl(PRICING_SECTION.proName, lc)}</h3>
            <p className="mt-1 text-sm text-text-muted">{tl(PRICING_SECTION.proTagline, lc)}</p>
            <p className="mt-4 font-display text-3xl font-semibold tracking-tightest text-text-primary">{p("lifetimeBothShort", lc)}</p>
            <p className="mt-1 text-xs text-text-muted">
              {`${tl(HOMEPAGE_COPY.orLabel, lc)} ${p("subSixMonthsLabel", lc)}`}
            </p>
            <ul className="mt-5 space-y-2.5 flex-1">
              {tll(PRICING_SECTION.proFeatures, lc).map((f) => (
                <li key={f} className="flex gap-2 text-sm text-text-secondary">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="#21E6C1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 13l4 4L19 7" /></svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
       *  APPROFONDISCI — pillar + top article (internal linking SEO)
       *  ════════════════════════════════════════════════════════════ */}
      {(() => {
        const featuredSlugs = [
          "guida-sync-wearable-2026",
          "scegliere-smartwatch-dati-2026",
          "fitmesh-gratis-prezzo-founder",
        ];
        const featured = featuredSlugs
          .map((s) => postsBySlug[s])
          .filter((p): p is NonNullable<typeof p> => p !== undefined);
        if (featured.length === 0) return null;
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-28 sm:mt-36" data-reveal>
            <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
                  {tl(HOMEPAGE_COPY.readMoreKicker, lc)}
                </p>
                <h2 className="mt-4 font-display text-display font-semibold tracking-tightest text-text-primary max-w-2xl text-balance">
                  {tl(HOMEPAGE_COPY.readMoreHeading, lc)}
                </h2>
              </div>
              <Link
                href={`/${lc}/blog`}
                className="group inline-flex items-center gap-1.5 text-sm text-brand-aqua hover:text-brand-green transition"
              >
                {tl(HOMEPAGE_COPY.allArticles, lc)}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {featured.map((post, i) => (
                <Link
                  key={post.slug}
                  href={`/${lc}/blog/${localizedBlogSlug(post.slug, lc)}`}
                  className="card-glass p-7 group hover:-translate-y-0.5 transition-transform flex flex-col"
                  data-reveal
                  style={{ "--reveal-delay": `${i * 100}ms` } as React.CSSProperties}
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold">
                    {post.pillar ? tl(HOMEPAGE_COPY.mainGuideLabel, lc) : tl(HOMEPAGE_COPY.guideLabel, lc)}
                    {" · "}
                    {post.readMinutes} min
                  </p>
                  <h3 className="mt-3 font-display text-lg font-semibold text-text-primary group-hover:text-brand-aqua transition leading-snug">
                    {tl(post.hero.title, lc)}
                  </h3>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-3 flex-1">
                    {tl(post.hero.subtitle, lc)}
                  </p>
                  <span className="mt-4 text-xs text-brand-aqua font-medium inline-flex items-center gap-1">
                    {tl(HOMEPAGE_COPY.readLabel, lc)} →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Social proof — nascosta finché lib/social-proof/data.ts è vuoto */}
      <Testimonials locale={lc} />

      {/* ════════════════════════════════════════════════════════════════
       *  FINAL CTA — full-width spotlight
       *  ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-28 sm:mt-36 mb-20" data-reveal>
        <div className="relative card-glass p-10 sm:p-16 text-center overflow-hidden">
          <div
            aria-hidden
            className="halo-conic absolute inset-x-0 -top-32 mx-auto h-[460px] w-[640px] max-w-[95%] opacity-70 animate-float"
          />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
              Android + iOS
            </p>
            <h2 className="mt-4 font-display text-display-lg font-semibold tracking-tightest text-text-primary text-balance">
              {t.final_cta.heading}
            </h2>
            <p className="mt-5 text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
              {t.final_cta.description}
            </p>
            <div className="mt-9 flex flex-wrap justify-center items-center gap-3">
              <StoreButtonsRow locale={lc} className="justify-center" ctaLocation={CTA_PLACEMENTS.homepageFinalCta} />
            </div>
            <p className="mt-6 text-xs text-text-muted">
              {`${tl(HOMEPAGE_COPY.trialTagline, lc)}. ${p("fromLifetime", lc)}.`}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
