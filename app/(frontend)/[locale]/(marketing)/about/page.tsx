import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { IosAwareText } from "@/components/IosAwareText";
import { locales, type Locale, ogLocale, localeAlternates } from "@/lib/i18n";
import { PRICE_LIFETIME_ANDROID_RAW, PRICING } from "@/lib/pricing";

const SITE_URL = "https://www.fitmesh.fit";

/**
 * Il body copy sotto viene da `lib/content/about-copy.ts` via `tl(...)`, oggi
 * compilato solo per it/en/es/de/pt/fr: qualunque altro locale (pl/tr/nl/ja/
 * ko/sv/da/no/fi) cade silenziosamente sul ramo `en`. Senza gate, quei 9
 * locali indicizzerebbero contenuto inglese sotto un URL non-inglese,
 * autocanonicalizzato → duplicate content in Search Console.
 */
import { ABOUT_TRANSLATED_LOCALES } from "@/lib/content/static-page-locales";
import { ABOUT_COPY } from "@/lib/content/about-copy";
import { tl } from "@/lib/blog/types";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  const title = tl(ABOUT_COPY.metaTitle, lc);
  const description = tl(ABOUT_COPY.metaDescription, lc);

  const path = `/${lc}/about`;
  return {
    title,
    description,
    robots: ABOUT_TRANSLATED_LOCALES.includes(lc) ? undefined : { index: false, follow: false },
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/about`),
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
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const path = `/${lc}/about`;

  // Precio para el locale actual
  const lifetimeBothShort =
    lc === "it"
      ? PRICING.lifetimeBothShort.it
      : lc === "es"
      ? "€3,99 Android · €4,99 iPhone"
      : PRICING.lifetimeBothShort.en;

  // AboutPage JSON-LD per knowledge graph
  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: tl(ABOUT_COPY.jsonLdName, lc),
    url: `${SITE_URL}${path}`,
    inLanguage:
      lc === "it"
        ? "it-IT"
        : lc === "es"
        ? "es-ES"
        : lc === "de"
        ? "de-DE"
        : lc === "pt"
        ? "pt-BR"
        : lc === "fr"
        ? "fr-FR"
        : "en-US",
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "FitMesh Sync",
      applicationCategory: "HealthApplication",
      operatingSystem: "ANDROID",
      offers: { "@type": "Offer", price: PRICE_LIFETIME_ANDROID_RAW, priceCurrency: "EUR" },
    },
  };

  return (
    <>
      <JsonLd data={aboutLd} />
      <Breadcrumbs
        items={[
          {
            name: tl(ABOUT_COPY.kicker, lc),
            path,
          },
        ]}
        locale={lc}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16">
        {/* Hero */}
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {tl(ABOUT_COPY.kicker, lc)}
        </p>
        <h1 className="mt-3 font-display text-display-lg font-semibold tracking-tightest text-text-primary">
          {tl(ABOUT_COPY.heroTitlePrefix, lc)}
          <span className="text-brand-gradient">
            {tl(ABOUT_COPY.heroTitleAccent, lc)}
          </span>
        </h1>
        <p className="mt-5 text-text-secondary text-lg leading-relaxed">
          {tl(ABOUT_COPY.heroDescription, lc)}
        </p>

        {/* ─── Cosa fa ─── */}
        <h2
          id="features"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {tl(ABOUT_COPY.featuresHeading, lc)}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {tl(ABOUT_COPY.featuresIntro, lc)}
        </p>
        <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-text-secondary">
          {ABOUT_COPY.featureItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-success mt-0.5 flex-shrink-0">✓</span>
              <span>{tl(item, lc)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-text-secondary leading-relaxed">
          {tl(ABOUT_COPY.serverChoice, lc)}
        </p>

        {/* ─── Dispositivi supportati ─── */}
        <h2
          id="devices"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {tl(ABOUT_COPY.devicesHeading, lc)}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {tl(ABOUT_COPY.devicesIntro, lc)}
        </p>
        <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
          {[
            {
              h: tl(ABOUT_COPY.nativelySupported, lc),
              items: [
                "Samsung Galaxy Watch 4 / 5 / 6 / 7 / Ultra",
                "Pixel Watch 1 / 2 / 3 + qualsiasi Wear OS",
                "Xiaomi Mi Band 7+ / Xiaomi Watch S/Active",
                "Fitbit (via app Fitbit → Health Connect)",
                "Garmin Forerunner/Fenix/Venu (via Garmin Connect)",
                "Polar Vantage/Grit X (via Polar Flow)",
                "Withings Body+/ScanWatch (via Health Mate)",
              ],
              color: "#31E981",
            },
            {
              h: tl(ABOUT_COPY.comingWithOauth, lc),
              items: [
                "Strava (Q3 2026)",
                "Oura Ring Gen 3/4 (Q4 2026)",
                tl(ABOUT_COPY.fitbitHistoricalGps, lc),
                "Garmin Body Battery + Training Load (Q3 2026)",
              ],
              color: "#21E6C1",
            },
          ].map((group) => (
            <div
              key={group.h}
              className="rounded-card border border-divider bg-bg-card p-5"
            >
              <p
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: group.color }}
              >
                {group.h}
              </p>
              <ul className="mt-3 space-y-1.5 text-text-secondary">
                {group.items.map((i) => (
                  <li key={i}>· {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-text-muted">
          {tl(ABOUT_COPY.upToDateListPrefix, lc)}
          <Link
            href={`/${lc}/integrations`}
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            /integrations
          </Link>
          .
        </p>

        {/* ─── Privacy ─── */}
        <h2
          id="privacy"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {tl(ABOUT_COPY.privacyHeading, lc)}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {tl(ABOUT_COPY.privacyBody1, lc)}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {tl(ABOUT_COPY.privacyBody2, lc)}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {tl(ABOUT_COPY.deleteAccountPrefix, lc)}
          <a
            href="mailto:privacy@fitmesh.fit"
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            privacy@fitmesh.fit
          </a>
          {tl(ABOUT_COPY.deleteAccountSuffix, lc)}
          <Link
            href={`/${lc}/privacy`}
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            {tl(ABOUT_COPY.privacyPolicyLink, lc)}
          </Link>
          .
        </p>

        {/* ─── Prezzo ─── */}
        <h2
          id="pricing"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {tl(ABOUT_COPY.pricingHeading, lc)}
        </h2>
        <div className="mt-6 rounded-card border border-brand-aqua/30 bg-gradient-to-br from-brand-aqua/5 to-bg-card p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {tl(ABOUT_COPY.oneTimePurchase, lc)}
          </p>
          <p className="mt-2 font-display text-display font-bold text-text-primary">
            {lifetimeBothShort}
          </p>
          <p className="mt-2 text-text-secondary leading-relaxed">
            {tl(ABOUT_COPY.lifetimeUnlockDesc, lc)}
          </p>
          <p className="mt-3 text-sm text-text-muted">
            {tl(ABOUT_COPY.trialDesc, lc)}
          </p>
        </div>

        {/* ─── Famiglia / caregiver ─── */}
        <h2
          id="family"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {tl(ABOUT_COPY.familyHeading, lc)}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {tl(ABOUT_COPY.familyBody, lc)}
        </p>

        {/* ─── Chi sviluppa ─── */}
        <h2
          id="team"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {tl(ABOUT_COPY.teamHeading, lc)}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {tl(ABOUT_COPY.teamBody1, lc)}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {tl(ABOUT_COPY.teamBody2, lc)}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {tl(ABOUT_COPY.contactPrefix, lc)}
          <a
            href="mailto:hello@fitmesh.fit"
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            hello@fitmesh.fit
          </a>
          {tl(ABOUT_COPY.contactSuffix, lc)}
        </p>

        {/* ─── CTA finale ─── */}
        <div className="mt-16 rounded-card border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-6 sm:p-8 text-center">
          <h3 className="font-display text-2xl font-semibold text-text-primary">
            {tl(ABOUT_COPY.readyToTry, lc)}
          </h3>
          <p className="mt-3 text-text-secondary max-w-md mx-auto">
            <IosAwareText
              live={tl(ABOUT_COPY.availableLive, lc)}
              coming={tl(ABOUT_COPY.availableComing, lc)}
            />
          </p>
          <div className="mt-6 flex justify-center">
            <StoreButtonsRow locale={lc} className="justify-center" />
          </div>
        </div>
      </article>
    </>
  );
}
