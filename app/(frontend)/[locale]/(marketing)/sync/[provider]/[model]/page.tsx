import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, type ReactNode } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { locales, type Locale, ogLocale, localeAlternates, UNTRANSLATED_CONTENT_LOCALES } from "@/lib/i18n";
import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { PROVIDER_MODELS } from "@/lib/providers/models";
import { tl } from "@/lib/blog/types";
import { PRICE_LIFETIME_ANDROID_RAW } from "@/lib/pricing";

const SITE_URL = "https://www.fitmesh.fit";
const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";

function renderInlineBold(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// ── i18n strings ──────────────────────────────────────────────────────────────

const UI = {
  titlePrefix: {
    it: "Sincronizza",
    en: "Sync",
    es: "Sincroniza",
    de: "Synchronisiere",
    pt: "Sincronize",
    fr: "Synchronisez",
    pl: "Synchronizuj",
    tr: "Senkronize et",
    nl: "Synchroniseer",
    ja: "同期する",
    ko: "동기화",
  },
  titleSuffix: {
    it: "con FitMesh — guida Health Connect",
    en: "with FitMesh — Health Connect guide",
    es: "con FitMesh — guía Health Connect",
    de: "mit FitMesh — Health Connect Anleitung",
    pt: "com FitMesh — guia Health Connect",
    fr: "avec FitMesh — guide Health Connect",
    pl: "z FitMesh — przewodnik Health Connect",
    tr: "FitMesh ile — Health Connect kılavuzu",
    nl: "met FitMesh — Health Connect handleiding",
    ja: "とFitMesh — Health Connectガイド",
    ko: "과 FitMesh — Health Connect 가이드",
  },
  hcFeaturesTitle: {
    it: "Dati scritti su Health Connect",
    en: "Data written to Health Connect",
    es: "Datos escritos en Health Connect",
    de: "In Health Connect geschriebene Daten",
    pt: "Dados gravados no Health Connect",
    fr: "Données écrites dans Health Connect",
    pl: "Dane zapisane w Health Connect",
    tr: "Health Connect'e yazılan veriler",
    nl: "Gegevens geschreven naar Health Connect",
    ja: "Health Connectに書き込まれるデータ",
    ko: "Health Connect에 기록되는 데이터",
  },
  faqTitle: {
    it: "Domande frequenti",
    en: "Frequently asked questions",
    es: "Preguntas frecuentes",
    de: "Häufig gestellte Fragen",
    pt: "Perguntas frequentes",
    fr: "Questions fréquentes",
    pl: "Często zadawane pytania",
    tr: "Sık sorulan sorular",
    nl: "Veelgestelde vragen",
    ja: "よくある質問",
    ko: "자주 묻는 질문",
  },
  backToProvider: {
    it: "Tutte le integrazioni",
    en: "All integrations",
    es: "Todas las integraciones",
    de: "Alle Integrationen",
    pt: "Todas as integrações",
    fr: "Toutes les intégrations",
    pl: "Wszystkie integracje",
    tr: "Tüm entegrasyonlar",
    nl: "Alle integraties",
    ja: "すべての連携",
    ko: "모든 통합",
  },
  otherModels: {
    it: "Altri modelli",
    en: "Other models",
    es: "Otros modelos",
    de: "Andere Modelle",
    pt: "Outros modelos",
    fr: "Autres modèles",
    pl: "Inne modele",
    tr: "Diğer modeller",
    nl: "Andere modellen",
    ja: "他のモデル",
    ko: "다른 모델",
  },
  releaseYear: {
    it: "Anno",
    en: "Released",
    es: "Año",
    de: "Erschienen",
    pt: "Ano",
    fr: "Sorti en",
    pl: "Rok",
    tr: "Yıl",
    nl: "Jaar",
    ja: "発売年",
    ko: "출시 연도",
  },
  ctaTitle: {
    it: "Leggi i tuoi dati in un'unica dashboard",
    en: "See all your health data in one place",
    es: "Ve todos tus datos de salud en un solo lugar",
    de: "Alle Gesundheitsdaten an einem Ort sehen",
    pt: "Veja todos os seus dados de saúde em um lugar",
    fr: "Voir toutes vos données de santé au même endroit",
    pl: "Zobacz wszystkie swoje dane zdrowotne w jednym miejscu",
    tr: "Tüm sağlık verilerinizi tek bir yerde görün",
    nl: "Zie al je gezondheidsgegevens op één plek",
    ja: "すべての健康データを一か所で確認",
    ko: "모든 건강 데이터를 한 곳에서 확인",
  },
  ctaBody: {
    it: "FitMesh legge i tuoi dati da Health Connect — incluso il tuo",
    en: "FitMesh reads your data from Health Connect — including your",
    es: "FitMesh lee tus datos de Health Connect — incluido tu",
    de: "FitMesh liest deine Daten von Health Connect — einschließlich deines",
    pt: "FitMesh lê seus dados do Health Connect — incluindo seu",
    fr: "FitMesh lit vos données de Health Connect — y compris votre",
    pl: "FitMesh odczytuje Twoje dane z Health Connect — w tym Twój",
    tr: "FitMesh, Health Connect'ten verilerinizi okur — dahil",
    nl: "FitMesh leest je gegevens van Health Connect — inclusief je",
    ja: "FitMeshはHealth Connectからデータを読み取ります（",
    ko: "FitMesh는 Health Connect에서 데이터를 읽습니다 —",
  },
  ctaLabel: {
    it: "Inizia gratis",
    en: "Get started free",
    es: "Empieza gratis",
    de: "Kostenlos starten",
    pt: "Comece grátis",
    fr: "Commencer gratuitement",
    pl: "Zacznij bezpłatnie",
    tr: "Ücretsiz başlayın",
    nl: "Gratis beginnen",
    ja: "無料で始める",
    ko: "무료로 시작하기",
  },
} as const;

function t(key: keyof typeof UI, lc: Locale): string {
  const map = UI[key] as Record<string, string>;
  return map[lc] ?? map["en"];
}

// ── Static generation ─────────────────────────────────────────────────────────

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    Object.entries(PROVIDER_MODELS).flatMap(([providerSlug, models]) =>
      models.map((m) => ({ locale, provider: providerSlug, model: m.slug })),
    ),
  );
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; provider: string; model: string }>;
}): Promise<Metadata> {
  const { locale, provider: providerSlug, model: modelSlug } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  const p = PROVIDERS_BY_SLUG[providerSlug];
  const models = PROVIDER_MODELS[providerSlug] ?? [];
  const m = models.find((x) => x.slug === modelSlug);
  if (!p || !m) return {};

  const title = `${t("titlePrefix", lc)} ${m.name} ${t("titleSuffix", lc)}`;
  const description = (m.description[lc] ?? m.description["en"] ?? "").slice(0, 160);
  const path = `/${lc}/sync/${p.slug}/${m.slug}`;

  return {
    title,
    description,
    robots: UNTRANSLATED_CONTENT_LOCALES.has(lc)
      ? { index: false, follow: true }
      : undefined,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: localeAlternates(
        (l) => `${SITE_URL}/${l}/sync/${p.slug}/${m.slug}`,
      ),
    },
    openGraph: {
      type: "article",
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ModelPage({
  params,
}: {
  params: Promise<{ locale: string; provider: string; model: string }>;
}) {
  const { locale, provider: providerSlug, model: modelSlug } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;

  const p = PROVIDERS_BY_SLUG[providerSlug];
  const models = PROVIDER_MODELS[providerSlug] ?? [];
  const m = models.find((x) => x.slug === modelSlug);
  if (!p || !m) notFound();

  const desc = m.description[lc] ?? m.description["en"] ?? "";
  const otherModels = models.filter((x) => x.slug !== modelSlug).slice(0, 4);
  const pageUrl = `${SITE_URL}/${lc}/sync/${p.slug}/${m.slug}`;
  const isLive = p.status === "live" || p.status === "live-basic" || p.status === "beta";

  // JSON-LD: SoftwareApplication + FAQPage
  const faqSchema = m.faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: m.faq.map((qa) => ({
          "@type": "Question",
          name: qa.q[lc] ?? qa.q["en"],
          acceptedAnswer: {
            "@type": "Answer",
            text: qa.a[lc] ?? qa.a["en"],
          },
        })),
      }
    : null;

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `FitMesh Sync — ${m.name}`,
    applicationCategory: "HealthApplication",
    operatingSystem: "ANDROID",
    description: desc,
    inLanguage: lc,
    url: pageUrl,
    offers: {
      "@type": "Offer",
      price: String(PRICE_LIFETIME_ANDROID_RAW),
      priceCurrency: "EUR",
    },
    downloadUrl: PLAY_URL,
  };

  return (
    <>
      <JsonLd data={appSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <div className="min-h-screen bg-bg-primary text-text-primary">
        {/* Breadcrumbs */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumbs
            items={[
              {
                name: lc === "it" ? "Integrazioni" : lc === "es" ? "Integraciones" : lc === "de" ? "Integrationen" : lc === "pt" ? "Integrações" : lc === "fr" ? "Intégrations" : lc === "pl" ? "Integracje" : lc === "tr" ? "Entegrasyonlar" : lc === "nl" ? "Integraties" : lc === "ja" ? "連携" : lc === "ko" ? "통합" : "Integrations",
                path: `/${lc}/integrations`,
              },
              { name: p.name, path: `/${lc}/sync/${p.slug}` },
              { name: m.name, path: `/${lc}/sync/${p.slug}/${m.slug}` },
            ]}
            locale={lc}
          />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            {/* Provider monogram */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: p.brandColor }}
            >
              {p.initial}
            </div>
            <span className="text-text-secondary text-sm">{p.name}</span>
            <span className="text-text-tertiary text-sm">·</span>
            <span className="text-text-secondary text-sm">
              {t("releaseYear", lc)} {m.releaseYear}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            {m.name}{" "}
            <span className="text-accent-primary">Health Connect</span>{" "}
            sync guide {new Date().getFullYear()}
          </h1>

          <p className="text-text-secondary text-lg max-w-2xl mb-8 leading-relaxed">
            {desc}
          </p>

          {isLive && (
            <StoreButtonsRow locale={lc} />
          )}
        </section>

        {/* HC Features */}
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-semibold mb-4">
            {t("hcFeaturesTitle", lc)}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {m.hcFeatures.map((feat) => (
              <li
                key={feat}
                className="flex items-center gap-2 bg-bg-secondary rounded-lg px-4 py-3 text-sm"
              >
                <span className="text-accent-primary">✓</span>
                <span>{renderInlineBold(feat)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        {m.faq.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pb-12">
            <h2 className="text-xl font-semibold mb-6">
              {t("faqTitle", lc)}
            </h2>
            <div className="space-y-4">
              {m.faq.map((qa, i) => (
                <details
                  key={i}
                  className="group bg-bg-secondary rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium select-none list-none">
                    <span>{qa.q[lc] ?? qa.q["en"]}</span>
                    <span className="text-text-tertiary text-lg group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-4 text-text-secondary text-sm leading-relaxed">
                    {qa.a[lc] ?? qa.a["en"]}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Other models */}
        {otherModels.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pb-12">
            <h2 className="text-xl font-semibold mb-4">
              {t("otherModels", lc)} — {p.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {otherModels.map((om) => (
                <Link
                  key={om.slug}
                  href={`/${lc}/sync/${p.slug}/${om.slug}`}
                  className="bg-bg-secondary hover:bg-bg-tertiary rounded-xl px-4 py-3 transition-colors"
                >
                  <div className="font-medium text-sm">{om.name}</div>
                  <div className="text-text-tertiary text-xs mt-0.5">
                    {om.releaseYear}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to provider */}
        <section className="max-w-5xl mx-auto px-4 pb-6">
          <Link
            href={`/${lc}/sync/${p.slug}`}
            className="text-accent-primary text-sm hover:underline"
          >
            ← {t("backToProvider", lc)} {p.name}
          </Link>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="bg-bg-secondary rounded-2xl px-8 py-10 text-center">
            <h2 className="text-2xl font-bold mb-3">{t("ctaTitle", lc)}</h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              {t("ctaBody", lc)} {m.name}.
            </p>
            {isLive ? (
              <a
                href={PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent-primary text-black font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                {t("ctaLabel", lc)}
              </a>
            ) : (
              <a
                href="mailto:waitlist@fitmesh.fit"
                className="inline-flex items-center gap-2 bg-bg-tertiary text-text-primary font-semibold px-6 py-3 rounded-xl hover:bg-bg-quaternary transition-colors"
              >
                {t("ctaLabel", lc)}
              </a>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
