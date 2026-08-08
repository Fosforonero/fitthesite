import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { locales, type Locale, ogLocale, localeAlternates } from "@/lib/i18n";
import { tl } from "@/lib/blog/types";
import { getBlogPostBySlug } from "@/lib/blog/payload-source";
import { blogLinkHref } from "@/lib/blog/indexability";
import { providerLinkHref } from "@/lib/providers/indexability";
import { FITNESS_DATA_SYNC_COMPLETE_LOCALES } from "@/lib/content/static-page-locales";
import {
  PROVIDERS,
  categoryLabel,
  statusLabel,
  type ProviderCategory,
} from "@/lib/providers/data";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";

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

  const title =
    lc === "it"
      ? "Integrazioni — FitMesh Sync"
      : lc === "es"
        ? "Integraciones — FitMesh Sync"
        : lc === "de"
          ? "Integrationen — FitMesh Sync"
          : lc === "pt"
            ? "Integrações — FitMesh Sync"
            : lc === "fr"
              ? "Intégrations — FitMesh Sync"
              : lc === "nl"
                ? "Integraties — FitMesh Sync"
                : lc === "ja"
                  ? "連携 — FitMesh Sync"
                  : lc === "ko"
                    ? "연동 — FitMesh Sync"
                    : "Integrations — FitMesh Sync";
  const description =
    lc === "it"
      ? "Tutte le integrazioni di FitMesh Sync: Galaxy Watch, Wear OS, Mi Band, Fitbit, Garmin, Strava, Polar, Oura, Withings. Stato live e roadmap aggiornata."
      : lc === "es"
        ? "Todas las integraciones de FitMesh Sync: Galaxy Watch, Wear OS, Mi Band, Fitbit, Garmin, Strava, Polar, Oura, Withings. Estado actual y hoja de ruta."
        : lc === "de"
          ? "Alle Integrationen von FitMesh Sync: Galaxy Watch, Wear OS, Mi Band, Fitbit, Garmin, Strava, Polar, Oura, Withings. Aktueller Status und Roadmap."
          : lc === "pt"
            ? "Todas as integrações do FitMesh Sync: Galaxy Watch, Wear OS, Mi Band, Fitbit, Garmin, Strava, Polar, Oura, Withings. Status atual e roteiro de novidades."
            : lc === "fr"
              ? "Toutes les intégrations de FitMesh Sync : Galaxy Watch, Wear OS, Mi Band, Fitbit, Garmin, Strava, Polar, Oura, Withings. Statut en direct et feuille de route."
              : lc === "nl"
                ? "Alle integraties van FitMesh Sync: Galaxy Watch, Wear OS, Mi Band, Fitbit, Garmin, Strava, Polar, Oura, Withings. Live status en roadmap."
                : lc === "ja"
                  ? "FitMesh Syncのすべての連携：Galaxy Watch、Wear OS、Mi Band、Fitbit、Garmin、Strava、Polar、Oura、Withings。ライブステータスとロードマップ。"
                  : lc === "ko"
                    ? "FitMesh Sync의 모든 연동: Galaxy Watch, Wear OS, Mi Band, Fitbit, Garmin, Strava, Polar, Oura, Withings. 실시간 상태 및 로드맵."
                    : "All FitMesh Sync integrations: Galaxy Watch, Wear OS, Mi Band, Fitbit, Garmin, Strava, Polar, Oura, Withings. Live status and roadmap.";

  const path = `/${lc}/integrations`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/integrations`),
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

const CATEGORY_ORDER: ProviderCategory[] = [
  "smartwatch",
  "wearable",
  "fitness-platform",
  "health-platform",
  "phone-only",
];

export default async function IntegrationsHub({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const t = (it: string, en: string, es?: string, de?: string, pt?: string, fr?: string, nl?: string, ja?: string, ko?: string) =>
    lc === "it" ? it : lc === "es" ? (es ?? en) : lc === "de" ? (de ?? en) : lc === "pt" ? (pt ?? en) : lc === "fr" ? (fr ?? en) : lc === "nl" ? (nl ?? en) : lc === "ja" ? (ja ?? en) : lc === "ko" ? (ko ?? en) : en;
  // Sprint P0.13 (MICRO-GATE P0.13A): entrambi i link sotto erano hardcoded
  // (localizedBlogSlug + template literal diretto), trovati dal crawl
  // esaustivo con centinaia di anchor verso varianti noindex/404. Stesso
  // pattern lc-diretto→EN-fallback→nascondi già usato altrove in P0.13.
  const guidaPost = await getBlogPostBySlug("guida-sync-wearable-2026");
  const guidaHref = guidaPost ? blogLinkHref(guidaPost, lc) : null;
  const fitnessDataSyncHref = FITNESS_DATA_SYNC_COMPLETE_LOCALES.includes(lc)
    ? `/${lc}/fitness-data-sync`
    : "/en/fitness-data-sync";
  // Group providers by category, in canonical order
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    label: categoryLabel(category, lc),
    items: PROVIDERS.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0);

  const liveCount = PROVIDERS.filter(
    (p) => p.status === "live" || p.status === "live-basic",
  ).length;
  const roadmapCount = PROVIDERS.filter((p) =>
    p.status.startsWith("roadmap"),
  ).length;

  // CollectionPage JSON-LD listing every integration
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("Integrazioni FitMesh Sync", "FitMesh Sync Integrations", "Integraciones FitMesh Sync", "FitMesh Sync Integrationen", "Integrações FitMesh Sync", "Intégrations FitMesh Sync", "FitMesh Sync Integraties", "FitMesh Sync 連携", "FitMesh Sync 연동"),
    url: `${SITE_URL}/${lc}/integrations`,
    inLanguage: schemaLanguage(lc),
    hasPart: PROVIDERS.map((p) => ({
      "@type": "SoftwareApplication",
      name: `FitMesh Sync — ${p.name}`,
      url: `${SITE_URL}/${lc}/sync/${p.slug}`,
      applicationCategory: "HealthApplication",
      operatingSystem: (p.platforms ?? ["android"])
        .map((plat) => (plat === "ios" ? "IOS" : "ANDROID"))
        .join(", "),
    })),
  };

  return (
    <>
      <JsonLd data={collectionLd} />
      <Breadcrumbs
        items={[{ name: t("Integrazioni", "Integrations", "Integraciones", "Integrationen", "Integrações", "Intégrations", "Integraties", "連携", "연동"), path: `/${lc}/integrations` }]}
        locale={lc}
      />

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16" data-reveal>
        <div
          aria-hidden
          className="halo-conic absolute left-1/2 top-0 -z-10 h-[400px] w-[640px] -translate-x-1/2 opacity-50 animate-float"
        />
        <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
          {t("Integrazioni", "Integrations", "Integraciones", "Integrationen", "Integrações", "Intégrations", "Integraties", "連携", "연동")}
        </p>
        <h1 className="mt-4 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl text-balance">
          {t(
            "Uno smartwatch, una piattaforma. ",
            "One watch, one platform. ",
            "Un smartwatch, una plataforma. ",
            "Eine Smartwatch, eine Plattform. ",
            "Um smartwatch, uma plataforma. ",
            "Une montre connectée, une plateforme. ",
            "Één smartwatch, één platform. ",
            "ひとつのスマートウォッチ、ひとつのプラットフォーム。",
            "하나의 스마트워치, 하나의 플랫폼. ",
          )}
          <span className="text-brand-gradient">
            {t(
              "Tutti i tuoi dati salute insieme.",
              "All your health data together.",
              "Todos tus datos de salud, juntos.",
              "Alle deine Gesundheitsdaten an einem Ort.",
              "Todos os seus dados de saúde reunidos.",
              "Toutes vos données de santé au même endroit.",
              "Al je gezondheidsdata op één plek.",
              "すべての健康データをひとつに。",
              "모든 건강 데이터를 한곳에.",
            )}
          </span>
        </h1>
        <p className="mt-7 text-lg text-text-secondary max-w-2xl leading-relaxed">
          {t(
            `FitMesh Sync supporta nativamente ${liveCount} sorgenti via Health Connect e ne aggiungerà altre ${roadmapCount} via OAuth ufficiale. Lista completa con stato aggiornato.`,
            `FitMesh Sync natively supports ${liveCount} sources via Health Connect and ${roadmapCount} more are coming via official OAuth. Complete list with current status.`,
            `FitMesh Sync es compatible de forma nativa con ${liveCount} fuentes a través de Health Connect y añadirá ${roadmapCount} más por OAuth oficial. Lista completa con el estado actual.`,
            `FitMesh Sync unterstützt nativ ${liveCount} Quellen über Health Connect und ${roadmapCount} weitere kommen per offizieller OAuth-Anbindung. Vollständige Liste mit aktuellem Status.`,
            `FitMesh Sync é compatível nativamente com ${liveCount} fontes via Health Connect e mais ${roadmapCount} chegarão via OAuth oficial. Lista completa com o status atual.`,
            `FitMesh Sync prend en charge nativement ${liveCount} sources via Health Connect et ${roadmapCount} autres sont en cours d'intégration via OAuth officiel. Liste complète avec le statut actuel.`,
            `FitMesh Sync ondersteunt native ${liveCount} bronnen via Health Connect en ${roadmapCount} meer komen via officiële OAuth. Volledige lijst met actuele status.`,
            `FitMesh SyncはHealth Connect経由で${liveCount}のソースをネイティブにサポートし、公式OAuth経由でさらに${roadmapCount}を追加予定です。最新ステータス付きの完全リスト。`,
            `FitMesh Sync는 Health Connect를 통해 ${liveCount}개 소스를 기본 지원하며 공식 OAuth를 통해 ${roadmapCount}개가 추가될 예정입니다. 현재 상태가 포함된 전체 목록.`,
          )}
        </p>

        {/* Inline stats row */}
        <ul className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-left">
          <li>
            <p className="font-display text-3xl font-semibold text-text-primary tracking-tightest">
              {liveCount}<span className="text-brand-green">·</span>
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-text-muted leading-tight">
              {t("Live oggi", "Live today", "Disponibles hoy", "Jetzt live", "Disponíveis hoje", "Disponibles aujourd'hui", "Nu live", "現在利用可能", "지금 이용 가능")}
            </p>
          </li>
          <li>
            <p className="font-display text-3xl font-semibold text-text-primary tracking-tightest">
              {roadmapCount}+
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-text-muted leading-tight">
              {t("In roadmap", "In roadmap", "En hoja de ruta", "In der Roadmap", "No roadmap", "Dans la feuille de route", "In de roadmap", "ロードマップ予定", "로드맵 예정")}
            </p>
          </li>
          <li>
            <p className="font-display text-3xl font-semibold text-text-primary tracking-tightest">
              {PROVIDERS.length}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-text-muted leading-tight">
              {t("Totale supportate", "Total supported", "Total compatibles", "Gesamt unterstützt", "Total compatíveis", "Total pris en charge", "Totaal ondersteund", "合計対応数", "총 지원 수")}
            </p>
          </li>
        </ul>
      </section>

      {/* GROUPED LIST */}
      {grouped.map((group, gi) => (
        <section
          key={group.category}
          className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-12"
          data-reveal
          style={{ "--reveal-delay": `${gi * 80}ms` } as React.CSSProperties}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-block h-px flex-1 max-w-[60px]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(33,230,193,0.5), transparent)",
              }}
            />
            <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
              {group.label}
            </h2>
            <span className="text-xs text-text-muted font-mono">
              {String(group.items.length).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((p) => {
              const status = statusLabel(p.status, lc);
              // Sprint P0.13: providerLinkHref — lc-diretto → EN-fallback →
              // nascondi la card (mai un link verso una pagina noindex).
              const href = providerLinkHref(p, lc);
              if (!href) return null;
              return (
                <Link
                  key={p.slug}
                  href={href}
                  prefetch={false}
                  className="group relative card p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300"
                >
                  <div
                    aria-hidden
                    className="absolute -top-20 -right-16 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-25 transition-opacity duration-500"
                    style={{ background: p.brandColor }}
                  />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg font-bold text-white flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${p.brandColor}, ${p.brandColor}cc)`,
                          boxShadow: `0 8px 20px -10px ${p.brandColor}88`,
                        }}
                      >
                        {p.initial}
                      </span>
                      <div>
                        <p className="font-display text-base font-semibold text-text-primary">
                          {p.name}
                        </p>
                        <p className="text-xs text-text-muted">{p.vendor}</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-pill flex-shrink-0"
                      style={{
                        background: `${status.color}15`,
                        color: status.color,
                      }}
                    >
                      {status.text}
                    </span>
                  </div>
                  <p className="relative mt-4 text-sm text-text-secondary leading-relaxed">
                    {tl(p.tagline, lc)}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {/* HEALTH CONNECT NOTE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <div className="rounded-card border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-8 sm:p-12">
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {t("Bonus", "Bonus", "Bonus", "Bonus", "Bônus", "Bonus", "Bonus", "ボーナス", "보너스")}
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-text-primary max-w-2xl">
            {t(
              "Hai un altro brand? Probabilmente funziona già.",
              "Got another brand? It likely already works.",
              "¿Tienes otra marca? Probablemente ya funciona.",
              "Hast du eine andere Marke? Es funktioniert wahrscheinlich bereits.",
              "Tem outra marca? Provavelmente já funciona.",
              "Vous avez une autre marque ? Ça fonctionne probablement déjà.",
              "Heb je een ander merk? Het werkt waarschijnlijk al.",
              "別のブランドをお持ちですか？おそらくすでに動作します。",
              "다른 브랜드를 갖고 계신가요? 아마 이미 작동할 겁니다.",
            )}
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl leading-relaxed">
            {t(
              "Qualsiasi app o smartwatch che scriva su Health Connect è automaticamente leggibile da FitMesh: Huawei Health, Mobvoi, OnePlus Health, Zepp / Amazfit (modelli moderni), Coros, Withings (parziale), Garmin Connect (parziale), Polar Flow (parziale). Le integrazioni OAuth dedicate aggiungono dati avanzati (Training Load, Body Battery, GPS track) che Health Connect non espone.",
              "Any app or smartwatch that writes to Health Connect is automatically readable by FitMesh: Huawei Health, Mobvoi, OnePlus Health, Zepp / Amazfit (modern models), Coros, Withings (partial), Garmin Connect (partial), Polar Flow (partial). Dedicated OAuth integrations add the advanced data (Training Load, Body Battery, GPS tracks) that Health Connect doesn't expose.",
              "Cualquier app o smartwatch que escriba en Health Connect es compatible automáticamente con FitMesh: Huawei Health, Mobvoi, OnePlus Health, Zepp / Amazfit (modelos modernos), Coros, Withings (parcial), Garmin Connect (parcial), Polar Flow (parcial). Las integraciones OAuth dedicadas añaden datos avanzados (Training Load, Body Battery, rutas GPS) que Health Connect no expone.",
              undefined,
              undefined,
              undefined,
              "Elke app of smartwatch die naar Health Connect schrijft, is automatisch leesbaar door FitMesh: Huawei Health, Mobvoi, OnePlus Health, Zepp / Amazfit (moderne modellen), Coros, Withings (gedeeltelijk), Garmin Connect (gedeeltelijk), Polar Flow (gedeeltelijk). Speciale OAuth-integraties voegen geavanceerde data toe (Training Load, Body Battery, GPS-tracks) die Health Connect niet blootstelt.",
              "Health Connectに書き込むアプリやスマートウォッチはFitMeshで自動的に読み取れます：Huawei Health、Mobvoi、OnePlus Health、Zepp / Amazfit（最新モデル）、Coros、Withings（一部）、Garmin Connect（一部）、Polar Flow（一部）。専用OAuth連携はHealth Connectが公開しない高度なデータ（Training Load、Body Battery、GPSトラック）を追加します。",
              "Health Connect에 데이터를 쓰는 모든 앱이나 스마트워치는 FitMesh에서 자동으로 읽을 수 있습니다: Huawei Health, Mobvoi, OnePlus Health, Zepp / Amazfit (최신 모델), Coros, Withings (일부), Garmin Connect (일부), Polar Flow (일부). 전용 OAuth 연동은 Health Connect가 제공하지 않는 고급 데이터(Training Load, Body Battery, GPS 트랙)를 추가합니다.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {guidaHref && (
              <Link
                href={guidaHref}
                className="inline-flex items-center gap-1.5 text-sm text-brand-aqua hover:text-brand-green transition group"
              >
                {t(
                  "Approfondisci nella guida completa al sync wearable",
                  "Read the complete guide to wearable sync",
                  "Lee la guía completa de sincronización de wearables",
                  undefined,
                  undefined,
                  undefined,
                  "Lees de complete gids voor wearable sync",
                  "ウェアラブルsyncの完全ガイドを読む",
                  "웨어러블 동기화 전체 가이드 읽기",
                )}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            )}
            <Link
              href={fitnessDataSyncHref}
              className="inline-flex items-center gap-1.5 text-sm text-brand-aqua hover:text-brand-green transition group"
            >
              {t(
                "Vedi cosa è live, read-only o ancora in sviluppo",
                "See what's live, read-only, or still in development",
                "Mira qué está en vivo, es solo lectura o sigue en desarrollo",
                undefined,
                undefined,
                undefined,
                "Bekijk wat live, alleen-lezen of nog in ontwikkeling is",
                "何がライブで、読み取り専用で、まだ開発中かを確認",
                "무엇이 라이브인지, 읽기 전용인지, 아직 개발 중인지 확인하기",
              )}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-20 text-center">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {t("Manca la tua integrazione?", "Missing your integration?", "¿Falta tu integración?", "Fehlt deine Integration?", "Falta a sua integração?", "Votre intégration manque ?", "Mist jouw integratie?", "連携が見つかりませんか？", "연동이 없나요?")}
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">
          {t(
            "Scrivici quale integrazione ti serve: diamo priorità a quelle più richieste.",
            "Tell us which integration you need: we prioritize the most requested ones.",
            "Cuéntanos qué integración necesitas: damos prioridad a las más solicitadas.",
            "Schreib uns, welche Integration du brauchst: Wir priorisieren die meistgefragten.",
            "Diga-nos qual integração você precisa: priorizamos as mais solicitadas.",
            "Dites-nous quelle intégration vous souhaitez : nous priorisons les plus demandées.",
            "Laat ons weten welke integratie je nodig hebt: wij geven prioriteit aan de meest gevraagde.",
            "必要な連携をお知らせください：最もリクエストの多いものを優先します。",
            "필요한 연동을 알려주세요: 가장 많이 요청된 것을 우선 개발합니다.",
          )}
        </p>
        <div className="mt-8 flex justify-center">
          <a
            href="mailto:hello@fitmesh.fit?subject=Integration%20request"
            className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
          >
            {t("Richiedi un'integrazione", "Request an integration", "Solicitar una integración", "Integration anfragen", "Solicitar uma integração", "Demander une intégration", "Integratie aanvragen", "連携をリクエスト", "연동 요청")}
          </a>
        </div>
      </section>
    </>
  );
}
