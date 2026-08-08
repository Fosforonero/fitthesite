import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import {
  localizedLandingSlug,
  canonicalFromLandingUrl,
} from "@/lib/blog/slug-i18n";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { BlogRenderer, localizeInternalHref } from "@/components/blog/BlogRenderer";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { tl } from "@/lib/blog/types";
import { LANDING_PAGES, LANDING_PAGES_BY_SLUG, type LandingPage } from "@/lib/landing/data";
import { isLandingVariantIndexable } from "@/lib/landing/indexability";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";

export function generateStaticParams() {
  return LANDING_PAGES.flatMap((p) =>
    locales.map((locale) => ({ locale, slug: localizedLandingSlug(p.slug, locale) })),
  );
}

/** hreflang alternates: ogni lingua indicizzabile → slug landing localizzato; x-default = IT. */
function landingLanguages(lp: LandingPage): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const l of locales) {
    if (!isLandingVariantIndexable(lp, l)) continue;
    langs[l] = `${SITE_URL}/${l}/lp/${localizedLandingSlug(lp.slug, l)}`;
  }
  langs["x-default"] = `${SITE_URL}/it/lp/${lp.slug}`;
  return langs;
}

/** Risolve lo slug d'URL landing (localizzato) → landing + eventuale redirect 308. */
function resolveLanding(urlSlug: string, lc: Locale) {
  const canonical = canonicalFromLandingUrl(urlSlug, lc);
  if (canonical && LANDING_PAGES_BY_SLUG[canonical]) {
    return { lp: LANDING_PAGES_BY_SLUG[canonical], redirectTo: null as string | null };
  }
  const lp = LANDING_PAGES_BY_SLUG[urlSlug];
  if (!lp) return { lp: null, redirectTo: null as string | null };
  const correct = localizedLandingSlug(urlSlug, lc);
  return { lp, redirectTo: correct !== urlSlug ? `/${lc}/lp/${correct}` : null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;
  const { lp } = resolveLanding(slug, lc);
  if (!lp) return {};

  const path = `/${lc}/lp/${localizedLandingSlug(lp.slug, lc)}`;
  const title = tl(lp.hero.title, lc);
  const description = tl(lp.metaDescription, lc);
  const secKw = (lp.secondaryKeywords as Record<string, string[] | undefined>)[lc] ?? lp.secondaryKeywords.en;

  return {
    title: `${title} — FitMesh Sync`,
    description,
    keywords: [tl(lp.primaryKeyword, lc), ...secKw].join(", "),
    robots: isLandingVariantIndexable(lp, lc)
      ? undefined
      : { index: false, follow: true },
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: landingLanguages(lp),
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

const I18N: Record<Locale, {
  faqHeading: string;
  disclaimerHeading: string;
  disclaimer: (brands: string[]) => string;
  finalCtaHeading: string;
  finalCtaSubheading: string;
}> = {
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
  es: {
    faqHeading: "Preguntas frecuentes",
    disclaimerHeading: "Aviso legal",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync es un producto independiente. ${brands.join(", ")} ${brands.length > 1 ? "son marcas registradas" : "es una marca registrada"} de sus respectivos propietarios. Esta página no implica afiliación ni patrocinio.`,
    finalCtaHeading: "¿Listo para empezar?",
    finalCtaSubheading: "Descarga FitMesh Sync en tu teléfono Android. El panel web está incluido.",
  },
  de: {
    faqHeading: "Häufig gestellte Fragen",
    disclaimerHeading: "Haftungsausschluss",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync ist ein unabhängiges Produkt. ${brands.join(", ")} ${brands.length > 1 ? "sind Marken" : "ist eine Marke"} der jeweiligen Eigentümer. Diese Seite impliziert keine Zugehörigkeit oder Unterstützung.`,
    finalCtaHeading: "Bereit loszulegen?",
    finalCtaSubheading: "Lade FitMesh Sync auf dein Android-Telefon herunter. Das Web-Dashboard ist inklusive.",
  },
  pt: {
    faqHeading: "Perguntas frequentes",
    disclaimerHeading: "Aviso legal",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync é um produto independente. ${brands.join(", ")} ${brands.length > 1 ? "são marcas registradas" : "é uma marca registrada"} de seus respectivos proprietários. Esta página não implica afiliação ou patrocínio.`,
    finalCtaHeading: "Pronto para começar?",
    finalCtaSubheading: "Baixe FitMesh Sync no seu celular Android. O painel web está incluído.",
  },
  fr: {
    faqHeading: "Questions fréquentes",
    disclaimerHeading: "Avis de non-responsabilité",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync est un produit indépendant. ${brands.join(", ")} ${brands.length > 1 ? "sont des marques" : "est une marque"} de leurs propriétaires respectifs. Cette page n'implique aucune affiliation ni parrainage.`,
    finalCtaHeading: "Prêt à commencer ?",
    finalCtaSubheading: "Téléchargez FitMesh Sync sur votre téléphone Android. Le tableau de bord web est inclus.",
  },
  pl: {
    faqHeading: "Najczęściej zadawane pytania",
    disclaimerHeading: "Zastrzeżenie prawne",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync jest niezależnym produktem. ${brands.join(", ")} ${brands.length > 1 ? "to znaki towarowe" : "jest znakiem towarowym"} ich odpowiednich właścicieli. Ta strona nie sugeruje żadnej afiliacji ani sponsoringu.`,
    finalCtaHeading: "Gotowy, żeby zacząć?",
    finalCtaSubheading: "Pobierz FitMesh Sync na swój telefon z Androidem. Panel webowy jest wliczony w cenę.",
  },
  tr: {
    faqHeading: "Sık sorulan sorular",
    disclaimerHeading: "Yasal uyarı",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync bağımsız bir üründür. ${brands.join(", ")} ${brands.length > 1 ? "ilgili sahiplerinin ticari markalarıdır" : "ilgili sahibinin ticari markasıdır"}. Bu sayfa hiçbir ortaklık veya sponsorluk ilişkisi ima etmez.`,
    finalCtaHeading: "Başlamaya hazır mısın?",
    finalCtaSubheading: "FitMesh Sync'i Android telefonuna indir. Web panosu dahildir.",
  },
  nl: {
    faqHeading: "Veelgestelde vragen",
    disclaimerHeading: "Disclaimer",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync is een onafhankelijk product. ${brands.join(", ")} ${brands.length > 1 ? "zijn handelsmerken" : "is een handelsmerk"} van hun respectieve eigenaren. Deze pagina impliceert geen affiliatie of sponsoring.`,
    finalCtaHeading: "Klaar om te beginnen?",
    finalCtaSubheading: "Download FitMesh Sync op je Android-telefoon. Het webdashboard is inbegrepen.",
  },
  ja: {
    faqHeading: "よくある質問",
    disclaimerHeading: "免責事項",
    disclaimer: (brands: string[]) =>
      `FitMesh Syncは独立した製品です。${brands.join("、")}は各所有者の商標です。このページはいかなる提携またはスポンサーも示唆しません。`,
    finalCtaHeading: "始める準備はできていますか？",
    finalCtaSubheading: "AndroidスマートフォンにFitMesh Syncをダウンロードしてください。Webダッシュボードが含まれています。",
  },
  ko: {
    faqHeading: "자주 묻는 질문",
    disclaimerHeading: "면책 조항",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync는 독립 제품입니다. ${brands.join(", ")}은(는) 각 소유자의 상표입니다. 이 페이지는 어떠한 제휴나 후원도 암시하지 않습니다.`,
    finalCtaHeading: "시작할 준비가 됐나요?",
    finalCtaSubheading: "Android 스마트폰에 FitMesh Sync를 다운로드하세요. 웹 대시보드가 포함되어 있습니다.",
  },
  sv: {
    faqHeading: "Vanliga frågor",
    disclaimerHeading: "Friskrivning",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync är en oberoende produkt. ${brands.join(", ")} ${brands.length > 1 ? "är varumärken" : "är ett varumärke"} som tillhör respektive ägare. Den här sidan innebär ingen anknytning eller sponsring.`,
    finalCtaHeading: "Redo att börja?",
    finalCtaSubheading: "Ladda ned FitMesh Sync på din Android-telefon. Webbpanelen ingår.",
  },
  da: {
    faqHeading: "Ofte stillede spørgsmål",
    disclaimerHeading: "Ansvarsfraskrivelse",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync er et uafhængigt produkt. ${brands.join(", ")} ${brands.length > 1 ? "er varemærker" : "er et varemærke"} tilhørende deres respektive ejere. Denne side indebærer ingen tilknytning eller sponsorering.`,
    finalCtaHeading: "Klar til at starte?",
    finalCtaSubheading: "Download FitMesh Sync på din Android-telefon. Webdashboardet er inkluderet.",
  },
  no: {
    faqHeading: "Vanlige spørsmål",
    disclaimerHeading: "Ansvarsfraskrivelse",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync er et uavhengig produkt. ${brands.join(", ")} ${brands.length > 1 ? "er varemerker" : "er et varemerke"} som tilhører sine respektive eiere. Denne siden innebærer ingen tilknytning eller sponsing.`,
    finalCtaHeading: "Klar til å starte?",
    finalCtaSubheading: "Last ned FitMesh Sync på Android-telefonen din. Nettdashbordet er inkludert.",
  },
  fi: {
    faqHeading: "Usein kysytyt kysymykset",
    disclaimerHeading: "Vastuuvapauslauseke",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync on riippumaton tuote. ${brands.join(", ")} ${brands.length > 1 ? "ovat omistajiensa tavaramerkkejä" : "on omistajansa tavaramerkki"}. Tämä sivu ei tarkoita kumppanuutta tai sponsorointia.`,
    finalCtaHeading: "Valmis aloittamaan?",
    finalCtaSubheading: "Lataa FitMesh Sync Android-puhelimeesi. Verkkokäyttöliittymä sisältyy.",
  },
};

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const { lp, redirectTo } = resolveLanding(slug, lc);
  if (redirectTo) permanentRedirect(redirectTo);
  if (!lp) notFound();
  const t = I18N[lc];

  const path = `/${lc}/lp/${localizedLandingSlug(lp.slug, lc)}`;

  // JSON-LD: WebPage (la pagina è una landing, non un articolo editoriale)
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    name: tl(lp.hero.title, lc),
    description: tl(lp.metaDescription, lc),
    url: `${SITE_URL}${path}`,
    inLanguage: schemaLanguage(lc),
    datePublished: lp.publishedAt,
    dateModified: lp.updatedAt,
  };

  const faqLd =
    lp.faq && lp.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: lp.faq.map((f) => ({
            "@type": "Question",
            name: tl(f.q, lc),
            acceptedAnswer: {
              "@type": "Answer",
              text: tl(f.a, lc),
            },
          })),
        }
      : null;

  const primaryHref = tl(lp.hero.primaryCta.href, lc);
  // MICRO-GATE P0.13A: secondaryCta.href è un campo Localized hardcoded per
  // locale (es. "/ko/sync/oura") su lp.hero, un percorso di rendering
  // SEPARATO dal body (che passa da BlogRenderer) — non passava da nessun
  // controllo di indicizzabilità. Trovato dal crawl esaustivo. Riusa
  // localizeInternalHref (stessa SSOT di /blog, /lp, /sync, /fitness-data-sync
  // altrove in questo sprint) sul valore già per-locale: se il target non è
  // indicizzabile in nessuna variante, torna null e il bottone si nasconde.
  const secondaryHrefRaw = lp.hero.secondaryCta ? tl(lp.hero.secondaryCta.href, lc) : undefined;
  const secondaryHref = secondaryHrefRaw ? localizeInternalHref(secondaryHrefRaw, lc) : undefined;

  return (
    <>
      <JsonLd data={webPageLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <Breadcrumbs
        items={[{ name: tl(lp.hero.title, lc), path }]}
        locale={lc}
      />

      {/* HERO con CTA evidenti */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10">
        <div
          aria-hidden
          className="halo-conic absolute left-1/2 top-0 -z-10 h-[420px] w-[680px] -translate-x-1/2 opacity-40 animate-float"
        />
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {tl(lp.hero.kicker, lc)}
        </p>
        <h1 className="mt-4 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl leading-[1.1]">
          {tl(lp.hero.title, lc)}
        </h1>
        <p className="mt-6 text-lg text-text-secondary max-w-2xl leading-relaxed">
          {tl(lp.hero.subtitle, lc)}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={primaryHref}
            className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
          >
            {tl(lp.hero.primaryCta.label, lc)}
          </Link>
          {secondaryHref && lp.hero.secondaryCta && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center px-6 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
            >
              {tl(lp.hero.secondaryCta.label, lc)}
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
                  <span>{tl(f.q, lc)}</span>
                  <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                  {tl(f.a, lc)}
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
