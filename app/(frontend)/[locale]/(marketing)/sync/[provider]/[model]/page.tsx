import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, type ReactNode } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { PROVIDER_MODELS, type ProviderModel, PLATFORM_FEATURE_LABELS } from "@/lib/providers/models";
import { providerPlatforms } from "@/lib/providers/platforms";
import {
  isProviderModelVariantIndexable,
  providerModelLinkHref,
  providerModelLanguages,
  providerLinkHref,
} from "@/lib/providers/indexability";
import { tl } from "@/lib/blog/types";
import { SITE_URL, PLAY_STORE_URL as PLAY_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { toMetaDescription } from "@/lib/seo/meta-description";

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
  // Variante per provider con syncMechanism "direct-ble" (oggi: colmi-ring),
  // che non passa da Health Connect — vedi lib/providers/data.ts.
  titleSuffixBle: {
    it: "con FitMesh — guida Bluetooth diretto",
    en: "with FitMesh — direct Bluetooth guide",
    es: "con FitMesh — guía Bluetooth directo",
    de: "mit FitMesh — direkte Bluetooth-Anleitung",
    pt: "com FitMesh — guia Bluetooth direto",
    fr: "avec FitMesh — guide Bluetooth direct",
    pl: "z FitMesh — przewodnik Bluetooth",
    tr: "FitMesh ile — doğrudan Bluetooth kılavuzu",
    nl: "met FitMesh — directe Bluetooth-handleiding",
    ja: "とFitMesh — 直接Bluetooth接続ガイド",
    ko: "과 FitMesh — 직접 블루투스 가이드",
  },
  titleSuffixBridge: {
    it: "con FitMesh: guida Health Connect e Apple Health",
    en: "with FitMesh: Health Connect & Apple Health guide",
    es: "con FitMesh: guía Health Connect y Apple Health",
    de: "mit FitMesh: Health Connect und Apple Health Anleitung",
    pt: "com FitMesh: guia Health Connect e Apple Health",
    fr: "avec FitMesh: guide Health Connect et Apple Health",
    pl: "z FitMesh: przewodnik Health Connect i Apple Health",
    tr: "FitMesh ile: Health Connect ve Apple Health kılavuzu",
    nl: "met FitMesh: Health Connect en Apple Health handleiding",
    ja: "とFitMesh: Health ConnectおよびApple Healthガイド",
    ko: "과 FitMesh: Health Connect 및 Apple Health 가이드",
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
  hcFeaturesTitleBle: {
    it: "Dati letti via Bluetooth diretto",
    en: "Data read via direct Bluetooth",
    es: "Datos leídos por Bluetooth directo",
    de: "Über direktes Bluetooth gelesene Daten",
    pt: "Dados lidos via Bluetooth direto",
    fr: "Données lues via Bluetooth direct",
    pl: "Dane odczytywane przez bezpośredni Bluetooth",
    tr: "Doğrudan Bluetooth ile okunan veriler",
    nl: "Gegevens gelezen via directe Bluetooth",
    ja: "直接Bluetooth経由で読み取られるデータ",
    ko: "직접 블루투스로 읽는 데이터",
  },
  hcFeaturesTitleBridge: {
    it: "Dati supportati via Health Connect e Apple Health",
    en: "Supported data via Health Connect and Apple Health",
    es: "Datos compatibles vía Health Connect y Apple Health",
    de: "Unterstützte Daten über Health Connect und Apple Health",
    pt: "Dados suportados via Health Connect e Apple Health",
    fr: "Données prises en charge via Health Connect et Apple Health",
    pl: "Dane obsługiwane przez Health Connect i Apple Health",
    tr: "Health Connect ve Apple Health aracılığıyla desteklenen veriler",
    nl: "Ondersteunde gegevens via Health Connect en Apple Health",
    ja: "Health ConnectおよびApple Health経由でサポートされるデータ",
    ko: "Health Connect 및 Apple Health를 통해 지원되는 데이터",
  },
  androidPlatformTitle: {
    it: "Dati supportati su Android (Health Connect)",
    en: "Supported data on Android (Health Connect)",
    es: "Datos compatibles en Android (Health Connect)",
    de: "Unterstützte Daten auf Android (Health Connect)",
    pt: "Dados suportados no Android (Health Connect)",
    fr: "Données prises en charge sur Android (Health Connect)",
    pl: "Obsługiwane dane na Androidzie (Health Connect)",
    tr: "Android'de desteklenen veriler (Health Connect)",
    nl: "Ondersteunde gegevens op Android (Health Connect)",
    ja: "Androidで対応しているデータ（Health Connect）",
    ko: "Android에서 지원되는 데이터 (Health Connect)",
    sv: "Data som stöds på Android (Health Connect)",
    da: "Understøttede data på Android (Health Connect)",
    no: "Støttede data på Android (Health Connect)",
    fi: "Tuetut tiedot Androidissa (Health Connect)",
  },
  iosPlatformTitle: {
    it: "Dati supportati su iPhone (Apple Health)",
    en: "Supported data on iPhone (Apple Health)",
    es: "Datos compatibles en iPhone (Apple Health)",
    de: "Unterstützte Daten auf dem iPhone (Apple Health)",
    pt: "Dados suportados no iPhone (Apple Health)",
    fr: "Données prises en charge sur iPhone (Apple Health)",
    pl: "Obsługiwane dane na iPhonie (Apple Health)",
    tr: "iPhone'da desteklenen veriler (Apple Health)",
    nl: "Ondersteunde gegevens op iPhone (Apple Health)",
    ja: "iPhoneで対応しているデータ（Apple Health）",
    ko: "iPhone에서 지원되는 데이터 (Apple Health)",
    sv: "Data som stöds på iPhone (Apple Health)",
    da: "Understøttede data på iPhone (Apple Health)",
    no: "Støttede data på iPhone (Apple Health)",
    fi: "Tuetut tiedot iPhonessa (Apple Health)",
  },
  iosAbsenceNote: {
    it: "Nota: L'elenco ufficiale dei dati esportati da Oura verso Apple Health non include un record autonomo di distanza o frequenza cardiaca a riposo.",
    en: "Note: Official Oura documentation for Apple Health does not list a standalone record for distance or resting heart rate.",
    es: "Nota: El listado oficial de datos exportados por Oura a Apple Health no incluye un registro autónomo de distancia o frecuencia en reposo.",
    de: "Hinweis: Die offizielle Oura-Dokumentation für Apple Health führt keinen eigenständigen Datensatz für Distanz oder Ruhepuls auf.",
    pt: "Nota: A lista oficial de dados exportados pela Oura para o Apple Health não inclui um registro autônomo de distância ou frequência em repouso.",
    fr: "Remarque : La documentation officielle Oura pour Apple Health n'inclut pas d'enregistrement autonome pour la distance ou la fréquence au repos.",
    pl: "Uwaga: Oficjalny wykaz danych eksportowanych przez Oura do Apple Health nie zawiera autonomicznego rekordu dystansu ani tętna spoczynkowego.",
    tr: "Not: Oura'nın resmi Apple Health veri listesinde bağımsız mesafe veya dinlenme kalp hızı kaydı yer almaz.",
    nl: "Opmerking: De officiële Oura-documentatie voor Apple Health bevat geen zelfstandig record voor afstand of rusthartslag.",
    ja: "注記: Oura公式のApple Healthドキュメントには距離や安静時心拍数の個別レコードは記載されていません。",
    ko: "참고: Oura의 공식 Apple Health 데이터 목록에는 거리 또는 안정 시 심박수에 대한 독립 레코드가 포함되어 있지 않습니다.",
    sv: "Obs: Officiell Oura-dokumentation för Apple Health innehåller inget fristående rekord för distans eller vilopuls.",
    da: "Bemærk: Officiel Oura-dokumentation for Apple Health indeholder ikke en særskilt registrering for distance eller hvilepuls.",
    no: "Merk: Offisiell Oura-dokumentasjon for Apple Health inneholder ikke en egen registrering for distanse eller hvilepuls.",
    fi: "Huomautus: Ouran virallinen Apple Health -dokumentaatio ei sisällä erillistä tietuetta matkalle tai leposykkeelle.",
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
  ctaBodyBle: {
    it: "FitMesh si collega direttamente via Bluetooth — incluso il tuo",
    en: "FitMesh connects directly via Bluetooth — including your",
    es: "FitMesh se conecta directamente por Bluetooth — incluido tu",
    de: "FitMesh verbindet sich direkt per Bluetooth — einschließlich deines",
    pt: "FitMesh se conecta diretamente via Bluetooth — incluindo seu",
    fr: "FitMesh se connecte directement en Bluetooth — y compris votre",
    pl: "FitMesh łączy się bezpośrednio przez Bluetooth — w tym Twój",
    tr: "FitMesh doğrudan Bluetooth ile bağlanır — dahil",
    nl: "FitMesh maakt rechtstreeks via Bluetooth verbinding — inclusief je",
    ja: "FitMeshはBluetoothで直接接続します（",
    ko: "FitMesh는 블루투스로 직접 연결됩니다 —",
  },
  ctaBodyBridge: {
    it: "FitMesh legge i tuoi dati via Health Connect su Android e Apple Health su iPhone, incluso il tuo",
    en: "FitMesh reads your data via Health Connect on Android and Apple Health on iPhone, including your",
    es: "FitMesh lee tus datos vía Health Connect en Android y Apple Health en iPhone, incluido tu",
    de: "FitMesh liest deine Daten über Health Connect auf Android und Apple Health auf dem iPhone, einschließlich deines",
    pt: "FitMesh lê seus dados via Health Connect no Android e Apple Health no iPhone, incluindo seu",
    fr: "FitMesh lit vos données via Health Connect sur Android et Apple Health sur iPhone, y compris votre",
    pl: "FitMesh odczytuje Twoje dane przez Health Connect na Androidzie i Apple Health na iPhonie, w tym Twój",
    tr: "FitMesh, Android'de Health Connect ve iPhone'da Apple Health üzerinden verilerinizi okur; dahil",
    nl: "FitMesh leest je gegevens via Health Connect op Android en Apple Health op iPhone, inclusief je",
    ja: "FitMeshはAndroidのHealth ConnectおよびiPhoneのApple Health経由でデータを読み取ります（",
    ko: "FitMesh는 Android의 Health Connect 및 iPhone의 Apple Health를 통해 데이터를 읽습니다. ",
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

/**
 * Come `t()`, ma sceglie fra una stringa "Health Connect", BLE o bridge di sistema in base a `provider.syncMechanism`.
 */
function tSync(
  baseKey: keyof typeof UI,
  bleKey: keyof typeof UI,
  bridgeKey: keyof typeof UI,
  lc: Locale,
  provider: { syncMechanism?: "health-connect" | "direct-ble" | "healthkit" | "system-bridge" },
): string {
  if (provider.syncMechanism === "direct-ble") return t(bleKey, lc);
  if (provider.syncMechanism === "system-bridge") return t(bridgeKey, lc);
  return t(baseKey, lc);
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

  const title = `${t("titlePrefix", lc)} ${m.name} ${tSync("titleSuffix", "titleSuffixBle", "titleSuffixBridge", lc, p)}`;
  const description = toMetaDescription(
    m.description[lc] ?? m.description["en"] ?? "",
  );
  const path = `/${lc}/sync/${p.slug}/${m.slug}`;

  return {
    title,
    description,
    // Check reale per-campo (description/FAQ), non solo "è un locale nordico":
    // vedi lib/providers/indexability.ts (gemello di lib/blog/indexability.ts).
    robots: isProviderModelVariantIndexable(m, lc)
      ? undefined
      : { index: false, follow: true },
    alternates: {
      canonical: `${SITE_URL}${path}`,
      // Sprint P0.13: hreflang filtrato su isProviderModelVariantIndexable —
      // stessa fonte di verità di robots/sitemap (vedi provider/page.tsx).
      languages: providerModelLanguages(p, m),
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
  // MICRO-GATE P0.13A: breadcrumb + "back to provider" linkavano
  // incondizionatamente `/${lc}/sync/${p.slug}` — la pagina modello può
  // essere indicizzabile mentre il provider padre non lo è nella stessa
  // locale (es. pl/galaxy-watch), trovato dal crawl esaustivo. mai null:
  // providerLinkHref ricade su EN se lc non è indicizzabile.
  const providerHref = providerLinkHref(p, lc) ?? `/en/sync/${p.slug}`;
  // Sprint P0.13: providerModelLinkHref applica lc-diretto → EN-fallback →
  // nascondi, stessa regola di blogLinkHref/providerLinkHref.
  const otherModels = models
    .filter((x) => x.slug !== modelSlug)
    .map((om) => ({ model: om, href: providerModelLinkHref(p, om, lc) }))
    .filter((x): x is { model: ProviderModel; href: string } => x.href !== null)
    .slice(0, 4);
  const pageUrl = `${SITE_URL}/${lc}/sync/${p.slug}/${m.slug}`;
  const isLive = p.status === "live" || p.status === "live-basic" || p.status === "live-bridge" || p.status === "beta";

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

  // P0.16-B: era SoftwareApplication — required aggregateRating/review per
  // il rich result Software App, che nessuno store da' oggi in modo
  // pubblico, stabile e onestamente sitewide (vedi guardrail). Rimosso
  // finche' non esiste un dato reale: WebPage rappresenta correttamente
  // cio' che questa pagina e' davvero.
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `FitMesh Sync — ${m.name}`,
    description: desc,
    inLanguage: schemaLanguage(lc),
    url: pageUrl,
    // P0.16-B punto 4: collegamento semantico semplice verso il prodotto,
    // invece di un secondo SoftwareApplication incompleto.
    isPartOf: { "@id": `${SITE_URL}#website` },
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
              { name: p.name, path: providerHref },
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
            <span className="text-accent-primary">
              {p.syncMechanism === "direct-ble"
                ? "Bluetooth"
                : p.syncMechanism === "system-bridge"
                ? "Health Connect / Apple Health"
                : p.syncMechanism === "healthkit"
                ? "Apple Health"
                : "Health Connect"}
            </span>{" "}
            sync guide {new Date().getFullYear()}
          </h1>

          <p className="text-text-secondary text-lg max-w-2xl mb-8 leading-relaxed">
            {desc}
          </p>

          {isLive && (
            <StoreButtonsRow locale={lc} platforms={providerPlatforms(p)} />
          )}
        </section>

        {/* HC / Platform Features */}
        <section className="max-w-5xl mx-auto px-4 pb-12">
          {m.platformFeatures ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                {tSync("hcFeaturesTitle", "hcFeaturesTitleBle", "hcFeaturesTitleBridge", lc, p)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {m.platformFeatures.android && (
                  <div className="bg-bg-secondary rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3DDC84]" aria-hidden="true" />
                      <h3 className="font-semibold text-base text-text-primary">
                        {t("androidPlatformTitle", lc)}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {m.platformFeatures.android.map((featKey) => (
                        <li key={featKey} className="flex items-center gap-2 text-sm text-text-secondary">
                          <span className="text-accent-primary">✓</span>
                          <span>{PLATFORM_FEATURE_LABELS[featKey]?.[lc] ?? PLATFORM_FEATURE_LABELS[featKey]?.en}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {m.platformFeatures.ios && (
                  <div className="bg-bg-secondary rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-white" aria-hidden="true" />
                        <h3 className="font-semibold text-base text-text-primary">
                          {t("iosPlatformTitle", lc)}
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {m.platformFeatures.ios.map((featKey) => (
                          <li key={featKey} className="flex items-center gap-2 text-sm text-text-secondary">
                            <span className="text-accent-primary">✓</span>
                            <span>{PLATFORM_FEATURE_LABELS[featKey]?.[lc] ?? PLATFORM_FEATURE_LABELS[featKey]?.en}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {p.slug === "oura" && (
                      <p className="mt-4 pt-3 border-t border-white/10 text-xs text-text-tertiary leading-relaxed">
                        {t("iosAbsenceNote", lc)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {tSync("hcFeaturesTitle", "hcFeaturesTitleBle", "hcFeaturesTitleBridge", lc, p)}
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
            </div>
          )}
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
              {otherModels.map(({ model: om, href }) => (
                <Link
                  key={om.slug}
                  href={href}
                  prefetch={false}
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
            href={providerHref}
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
              {tSync("ctaBody", "ctaBodyBle", "ctaBodyBridge", lc, p)} {m.name}.
            </p>
            {isLive ? (
              <div className="flex justify-center">
                <StoreButtonsRow
                  locale={lc}
                  platforms={providerPlatforms(p)}
                  className="justify-center"
                />
              </div>
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
