import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { CTA_PLACEMENTS } from "@/lib/analytics/cta";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import {
  PROVIDERS,
  PROVIDERS_BY_SLUG,
  type Provider,
} from "@/lib/providers/data";
import {
  isProviderVariantIndexable,
  providerLinkHref,
  providerLanguages,
} from "@/lib/providers/indexability";
import { getBlogPostsBySlug } from "@/lib/blog/payload-source";
import { BlogSources } from "@/components/blog/BlogSources";
import { FITNESS_DATA_SYNC_COMPLETE_LOCALES } from "@/lib/content/static-page-locales";
import { blogLinkHref } from "@/lib/blog/indexability";
import { tl, tll, categoryLabel as blogCategoryLabel, type BlogPost } from "@/lib/blog/types";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { toMetaDescription } from "@/lib/seo/meta-description";

const WAITLIST_EMAIL = "waitlist@fitmesh.fit";

/**
 * Render minimale `**bold**` markdown → <strong>. No HTML injection: usa solo
 * componenti React, mai dangerouslySetInnerHTML. Input controllato da data.ts.
 */
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

/** Localised status label with es fallback. */
function statusLabel(
  status: Provider["status"],
  lc: Locale,
): { text: string; color: string } {
  const map: Record<
    Provider["status"],
    { it: string; en: string; es: string; de: string; pt: string; fr: string; nl: string; ja: string; ko: string; color: string }
  > = {
    live: {
      it: "Disponibile ora",
      en: "Available now",
      es: "Disponible ahora",
      de: "Jetzt verfügbar",
      pt: "Disponível agora",
      fr: "Disponible maintenant",
      nl: "Nu beschikbaar",
      ja: "今すぐ利用可能",
      ko: "지금 이용 가능",
      color: "#31E981",
    },
    "live-basic": {
      it: "Funziona via Health Connect",
      en: "Works via Health Connect",
      es: "Funciona via Health Connect",
      de: "Funktioniert über Health Connect",
      pt: "Funciona via Health Connect",
      fr: "Fonctionne via Health Connect",
      nl: "Werkt via Health Connect",
      ja: "Health Connect経由で動作",
      ko: "Health Connect 경유 작동",
      color: "#21E6C1",
    },
    beta: { it: "Beta", en: "Beta", es: "Beta", de: "Beta", pt: "Beta", fr: "Beta", nl: "Beta", ja: "Beta", ko: "Beta", color: "#FFB547" },
    // P1.9 FASE 2: stessa aggiunta di lib/providers/data.ts:statusLabel —
    // le due mappe sono duplicate (debito noto, non risolto qui: fuori
    // scope unificarle in questo giro), tenute allineate a mano.
    "limited-beta": { it: "Accesso limitato", en: "Limited access", es: "Acceso limitado", de: "Eingeschränkter Zugang", pt: "Acesso limitado", fr: "Accès limité", nl: "Beperkte toegang", ja: "限定アクセス", ko: "제한된 접근", color: "#FFB547" },
    "roadmap-q3": {
      it: "In arrivo Q3 2026",
      en: "Coming Q3 2026",
      es: "Próximamente Q3 2026",
      de: "Kommt Q3 2026",
      pt: "Em breve Q3 2026",
      fr: "Bientôt T3 2026",
      nl: "Binnenkort Q3 2026",
      ja: "Q3 2026に登場",
      ko: "Q3 2026 출시 예정",
      color: "#38BDF8",
    },
    "roadmap-q4": {
      it: "In arrivo Q4 2026",
      en: "Coming Q4 2026",
      es: "Próximamente Q4 2026",
      de: "Kommt Q4 2026",
      pt: "Em breve Q4 2026",
      fr: "Bientôt T4 2026",
      nl: "Binnenkort Q4 2026",
      ja: "Q4 2026に登場",
      ko: "Q4 2026 출시 예정",
      color: "#A78BFA",
    },
    "coming-soon": {
      it: "In arrivo",
      en: "Coming soon",
      es: "Próximamente",
      de: "Demnächst",
      pt: "Em breve",
      fr: "Bientôt disponible",
      nl: "Binnenkort beschikbaar",
      ja: "近日公開",
      ko: "곧 출시",
      color: "#7CFF5B",
    },
  };
  const entry = map[status];
  return { text: (entry as Record<string, string>)[lc] ?? entry.en, color: entry.color };
}

/** Localised category label with es fallback. */
function categoryLabel(
  category: Provider["category"],
  lc: Locale,
): string {
  const map: Record<
    Provider["category"],
    { it: string; en: string; es: string; de: string; pt: string; fr: string; nl: string; ja: string; ko: string }
  > = {
    smartwatch: { it: "Smartwatch", en: "Smartwatch", es: "Smartwatch", de: "Smartwatch", pt: "Smartwatch", fr: "Montre connectée", nl: "Smartwatch", ja: "スマートウォッチ", ko: "스마트워치" },
    "fitness-platform": {
      it: "Piattaforma fitness",
      en: "Fitness platform",
      es: "Plataforma de fitness",
      de: "Fitness-Plattform",
      pt: "Plataforma de fitness",
      fr: "Plateforme fitness",
      nl: "Fitnessplatform",
      ja: "フィットネスプラットフォーム",
      ko: "피트니스 플랫폼",
    },
    "health-platform": {
      it: "Piattaforma salute",
      en: "Health platform",
      es: "Plataforma de salud",
      de: "Gesundheitsplattform",
      pt: "Plataforma de saúde",
      fr: "Plateforme santé",
      nl: "Gezondheidsplatform",
      ja: "ヘルスプラットフォーム",
      ko: "건강 플랫폼",
    },
    wearable: { it: "Wearable", en: "Wearable", es: "Wearable", de: "Wearable", pt: "Wearable", fr: "Wearable", nl: "Wearable", ja: "ウェアラブル", ko: "웨어러블" },
    "phone-only": { it: "Solo telefono", en: "Phone-only", es: "Solo teléfono", de: "Nur Smartphone", pt: "Somente telefone", fr: "Téléphone uniquement", nl: "Alleen smartphone", ja: "スマートフォンのみ", ko: "스마트폰 전용" },
  };
  return (map[category] as Record<string, string>)[lc] ?? map[category].en;
}

/** Blocco 12 FASE 5: stessa funzione di formatDate del blog post page. */
function formatDate(iso: string, lc: Locale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(schemaLanguage(lc), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function generateStaticParams() {
  return PROVIDERS.flatMap((p) =>
    locales.map((locale) => ({ locale, provider: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; provider: string }>;
}): Promise<Metadata> {
  const { locale, provider } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;
  const p = PROVIDERS_BY_SLUG[provider];
  if (!p) return {};

  // Title compatto (≤65c) per Bing/Google. Description copre il claim
  // "dashboard salute personale" più descrittivo. Vedi fitmesh-growth SKILL.
  const title =
    lc === "it"
      ? `Sincronizza ${p.name} a FitMesh Sync`
      : lc === "es"
        ? `Sincroniza ${p.name} con FitMesh Sync`
        : lc === "de"
          ? `${p.name} mit FitMesh Sync synchronisieren`
          : lc === "nl"
            ? `Synchroniseer ${p.name} met FitMesh Sync`
            : lc === "ja"
              ? `${p.name}をFitMesh Syncと同期する`
              : lc === "ko"
                ? `${p.name}을 FitMesh Sync와 동기화`
                : `Sync ${p.name} to FitMesh Sync`;
  // La tagline (58-113 caratteri su molte integrazioni) è adatta alle card,
  // ma Bing la segnala come meta description troppo corta. La longDesc è
  // unica per provider e viene ridotta a uno snippet leggibile <=160c.
  const description = toMetaDescription(tl(p.longDesc, lc));

  const path = `/${lc}/sync/${p.slug}`;
  return {
    title,
    description,
    keywords: tll(p.seoKeywords, lc).join(", "),
    // Check reale per-campo (tagline/longDesc/FAQ): non solo "è un locale nordico",
    // ma "questo provider ha DAVVERO title/description/FAQ tradotti per lc, non
    // il fallback EN sotto una chiave locale diversa". Vedi lib/providers/indexability.ts.
    robots: isProviderVariantIndexable(p, lc)
      ? undefined
      : { index: false, follow: true },
    alternates: {
      canonical: `${SITE_URL}${path}`,
      // Sprint P0.13: hreflang filtrato sulla stessa fonte di verità di
      // robots/sitemap (isProviderVariantIndexable), non più il generico
      // localeAlternates() che emetteva hreflang anche verso noindex — gap
      // documentato in docs/seo/p012-fase3-sitemap-hreflang-gap.md.
      languages: providerLanguages(p),
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
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProviderLanding({
  params,
}: {
  params: Promise<{ locale: string; provider: string }>;
}) {
  const { locale, provider } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const p = PROVIDERS_BY_SLUG[provider];
  if (!p) notFound();
  const postsBySlug = await getBlogPostsBySlug();
  // MICRO-GATE P0.13A: era `/${lc}/fitness-data-sync` incondizionato — 404
  // per le 11 locale fuori FITNESS_DATA_SYNC_COMPLETE_LOCALES (trovato dal
  // crawl esaustivo, stesso fix già in integrations/homepage/BlogRenderer).
  const fitnessDataSyncHref = FITNESS_DATA_SYNC_COMPLETE_LOCALES.includes(lc)
    ? `/${lc}/fitness-data-sync`
    : "/en/fitness-data-sync";

  // "isLive" = CTA primaria è Play Store. Sia `live` (nativo) sia `live-basic`
  // (via HC) sono usabili oggi → entrambi mostrano il bottone Play Store.
  const isLive = p.status === "live" || p.status === "live-basic";
  const isLiveBasic = p.status === "live-basic";
  const status = statusLabel(p.status, lc);
  const category = categoryLabel(p.category, lc);

  /** Helper per stringhe inline con supporto nl/ja/ko. */
  const t = (it: string, en: string, es: string, nl?: string, ja?: string, ko?: string) =>
    lc === "it" ? it : lc === "es" ? es : lc === "nl" ? (nl ?? en) : lc === "ja" ? (ja ?? en) : lc === "ko" ? (ko ?? en) : en;

  // MICRO-GATE P0.15-C: la legenda a 3 stati e l'etichetta di stato per pill
  // devono essere localizzate nelle 11 locale indicizzabili, non un fallback
  // EN silenzioso come `t()` sopra (che copre solo it/es/nl/ja/ko, tutto il
  // resto — incluse de/pt/fr/pl/tr — ricade su `en`). Le 4 locale nordiche
  // (sv/da/no/fi) restano su EN: sono noindex per questo provider, fuori
  // scope (nessuna entry esiste per queste lingue, invariato da P0.15).
  const DATATYPE_LEGEND: Record<string, string> = {
    it: "I tipi di dato che FitMesh può leggere da questa integrazione. Verde = disponibile e confermato dalla fonte ufficiale. Ambra = FitMesh sa leggerlo se l'app companion lo scrive su Health Connect, ma nessuna fonte pubblica conferma che questa fonte lo faccia sempre. Grigio = non disponibile da questa fonte.",
    en: "The data types FitMesh can read from this integration. Green = available and confirmed by the official source. Amber = FitMesh can read it if the companion app writes it to Health Connect, but no public source confirms this specific source always does. Grey = not available from this source.",
    es: "Los tipos de datos que FitMesh puede leer de esta integración. Verde = disponible y confirmado por la fuente oficial. Ámbar = FitMesh puede leerlo si la app complementaria lo escribe en Health Connect, pero ninguna fuente pública confirma que esta fuente lo haga siempre. Gris = no disponible desde esta fuente.",
    de: "Die Datentypen, die FitMesh aus dieser Integration lesen kann. Grün = verfügbar und von der offiziellen Quelle bestätigt. Bernstein = FitMesh kann es lesen, wenn die Companion-App es in Health Connect schreibt, aber keine öffentliche Quelle bestätigt, dass diese Quelle das immer tut. Grau = von dieser Quelle nicht verfügbar.",
    pt: "Os tipos de dados que o FitMesh pode ler desta integração. Verde = disponível e confirmado pela fonte oficial. Âmbar = o FitMesh consegue ler se a app companion o gravar no Health Connect, mas nenhuma fonte pública confirma que esta fonte o faça sempre. Cinzento = não disponível a partir desta fonte.",
    fr: "Les types de données que FitMesh peut lire depuis cette intégration. Vert = disponible et confirmé par la source officielle. Ambre = FitMesh peut le lire si l'application companion l'écrit dans Health Connect, mais aucune source publique ne confirme que cette source le fait toujours. Gris = non disponible depuis cette source.",
    pl: "Typy danych, które FitMesh może odczytać z tej integracji. Zielony = dostępne i potwierdzone przez oficjalne źródło. Bursztynowy = FitMesh może to odczytać, jeśli aplikacja towarzysząca zapisuje to w Health Connect, ale żadne publiczne źródło nie potwierdza, że to źródło robi to zawsze. Szary = niedostępne z tego źródła.",
    tr: "FitMesh'in bu entegrasyondan okuyabildiği veri türleri. Yeşil = mevcut ve resmi kaynak tarafından doğrulanmış. Kehribar = eşlik uygulaması bunu Health Connect'e yazarsa FitMesh okuyabilir, ancak hiçbir kamuya açık kaynak bu kaynağın bunu her zaman yaptığını doğrulamaz. Gri = bu kaynaktan mevcut değil.",
    nl: "De gegevenstypen die FitMesh van deze integratie kan lezen. Groen = beschikbaar en bevestigd door de officiële bron. Amber = FitMesh kan het lezen als de companion-app het naar Health Connect schrijft, maar geen enkele publieke bron bevestigt dat deze bron dat altijd doet. Grijs = niet beschikbaar vanuit deze bron.",
    ja: "この連携からFitMeshが読み取れるデータタイプ。緑 = 公式ソースにより確認済みで利用可能。アンバー = コンパニオンアプリがHealth Connectに書き込めばFitMeshは読み取れますが、このソースが常にそうすることを確認できる公開情報はありません。グレー = この連携からは利用不可。",
    ko: "이 연동에서 FitMesh가 읽을 수 있는 데이터 유형. 녹색 = 공식 소스로 확인되어 사용 가능. 호박색 = 컴패니언 앱이 Health Connect에 기록하면 FitMesh가 읽을 수 있지만, 이 소스가 항상 그렇게 한다는 공개 확인은 없습니다. 회색 = 이 소스에서는 사용할 수 없음.",
  };
  const dataTypeLegend = DATATYPE_LEGEND[lc] ?? DATATYPE_LEGEND.en;

  const DATATYPE_STATUS_LABEL: Record<string, { verified: string; conditional: string; unsupported: string }> = {
    it: { verified: "Verificato", conditional: "Condizionale", unsupported: "Non supportato" },
    en: { verified: "Verified", conditional: "Conditional", unsupported: "Not supported" },
    es: { verified: "Verificado", conditional: "Condicional", unsupported: "No compatible" },
    de: { verified: "Verifiziert", conditional: "Bedingt", unsupported: "Nicht unterstützt" },
    pt: { verified: "Verificado", conditional: "Condicional", unsupported: "Não suportado" },
    fr: { verified: "Vérifié", conditional: "Conditionnel", unsupported: "Non pris en charge" },
    pl: { verified: "Zweryfikowano", conditional: "Warunkowo", unsupported: "Nieobsługiwane" },
    tr: { verified: "Doğrulandı", conditional: "Koşullu", unsupported: "Desteklenmiyor" },
    nl: { verified: "Geverifieerd", conditional: "Voorwaardelijk", unsupported: "Niet ondersteund" },
    ja: { verified: "確認済み", conditional: "条件付き", unsupported: "非対応" },
    ko: { verified: "확인됨", conditional: "조건부", unsupported: "지원되지 않음" },
  };
  const dataTypeStatusLabel = DATATYPE_STATUS_LABEL[lc] ?? DATATYPE_STATUS_LABEL.en;

  // ── JSON-LD ──────────────────────────────────────────────────────────
  // P0.16-B: era SoftwareApplication — required aggregateRating/review per
  // il rich result Software App (documentazione ufficiale Google), che
  // nessuno store da' oggi in modo pubblico, stabile e onestamente
  // sitewide (vedi guardrail). Rimosso finche' non esiste un dato reale:
  // WebPage rappresenta correttamente cio' che questa pagina e' davvero
  // (una pagina informativa sulla sincronizzazione con questo provider),
  // senza dichiarare un tipo "applicazione" incompleto.
  const path = `/${lc}/sync/${p.slug}`;
  const platforms = p.platforms ?? ["android"];
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `FitMesh Sync — ${p.name}`,
    description: tl(p.longDesc, lc),
    url: `${SITE_URL}${path}`,
    inLanguage: schemaLanguage(lc),
  };

  const faqLd =
    p.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: p.faqs.map((f) => ({
            "@type": "Question",
            name: tl(f.q, lc),
            acceptedAnswer: {
              "@type": "Answer",
              text: tl(f.a, lc),
            },
          })),
        }
      : null;

  // HowTo JSON-LD — emitted only when a setup guide with steps exists.
  // Makes the page eligible for Google HowTo rich results on setup-intent queries.
  const howToSteps = p.setupGuide ? tll(p.setupGuide.steps, lc) : [];
  const howToLd =
    p.setupGuide && howToSteps.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: t(
            `Come connettere ${p.name} a FitMesh Sync`,
            `How to connect ${p.name} to FitMesh Sync`,
            `Cómo conectar ${p.name} con FitMesh Sync`,
            `${p.name} verbinden met FitMesh Sync`,
            `${p.name}をFitMesh Syncに接続する方法`,
            `${p.name}을 FitMesh Sync에 연결하는 방법`,
          ),
          description: tl(p.longDesc, lc),
          inLanguage: schemaLanguage(lc),
          step: howToSteps.map((stepText, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            // Strip inline bold markdown (**text**) for plain-text schema output.
            name: stepText.replace(/\*\*([^*]+)\*\*/g, "$1").slice(0, 80),
            text: stepText.replace(/\*\*([^*]+)\*\*/g, "$1"),
          })),
        }
      : null;

  // ── UI ───────────────────────────────────────────────────────────────
  // Sprint P0.13: providerLinkHref applica lc-diretto → EN-fallback → nascondi,
  // stessa regola di blogLinkHref sopra.
  const relatedProviders = PROVIDERS.filter(
    (x) => x.slug !== p.slug && x.category === p.category,
  )
    .map((r) => ({ provider: r, href: providerLinkHref(r, lc) }))
    .filter((x): x is { provider: Provider; href: string } => x.href !== null)
    .slice(0, 3);

  const waitlistSubject = encodeURIComponent(
    `Waitlist ${p.name} — FitMesh Sync`,
  );
  const waitlistBody = encodeURIComponent(
    t(
      `Ciao!\n\nVoglio essere avvisato/a quando l'integrazione con ${p.name} sarà disponibile.\n\nLa mia email:\n`,
      `Hi!\n\nPlease notify me when the ${p.name} integration becomes available.\n\nMy email:\n`,
      `Hola!\n\nQuiero que me avisen cuando la integración con ${p.name} esté disponible.\n\nMi correo:\n`,
      `Hallo!\n\nIk wil een melding ontvangen wanneer de ${p.name}-integratie beschikbaar is.\n\nMijn e-mail:\n`,
      `こんにちは！\n\n${p.name}の連携が利用可能になったら通知してください。\n\nメールアドレス：\n`,
      `안녕하세요!\n\n${p.name} 연동이 출시되면 알려주세요.\n\n이메일:\n`,
    ),
  );
  const waitlistHref = `mailto:${WAITLIST_EMAIL}?subject=${waitlistSubject}&body=${waitlistBody}`;

  return (
    <>
      <JsonLd data={softwareLd} />
      {faqLd && <JsonLd data={faqLd} />}
      {howToLd && <JsonLd data={howToLd} />}
      <Breadcrumbs
        items={[
          {
            name: t("Integrazioni", "Integrations", "Integraciones", "Integraties", "連携", "연동"),
            path: `/${lc}/integrations`,
          },
          { name: p.name, path },
        ]}
        locale={lc}
      />

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16">
        <div
          aria-hidden
          className="halo-conic absolute left-1/2 top-0 -z-10 h-[420px] w-[680px] -translate-x-1/2 opacity-50 animate-float"
        />
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7" data-reveal>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-pill border text-xs font-medium"
                style={{
                  borderColor: `${status.color}55`,
                  background: `${status.color}11`,
                  color: status.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: status.color, boxShadow: `0 0 8px ${status.color}` }}
                />
                {status.text}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-pill border border-divider bg-bg-secondary/40 text-xs text-text-secondary">
                {category}
              </span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-muted">{p.vendor}</span>
            </div>

            <h1 className="mt-5 font-display text-display-xl font-semibold tracking-tightest text-text-primary">
              {t(`Sincronizza ${p.name}`, `Sync ${p.name}`, `Sincroniza ${p.name}`, `Synchroniseer ${p.name}`, `${p.name}を同期する`, `${p.name} 동기화`)}{" "}
              <span className="text-brand-gradient">
                {t("alla tua dashboard", "to your dashboard", "con tu panel", "naar je dashboard", "ダッシュボードへ", "대시보드로")}
              </span>
            </h1>

            <p className="mt-6 text-lg text-text-secondary max-w-xl leading-relaxed">
              {tl(p.longDesc, lc)}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {isLive ? (
                <StoreButtonsRow locale={lc} ctaLocation={CTA_PLACEMENTS.syncProviderHero} />
              ) : (
                <a
                  href={waitlistHref}
                  className="inline-flex items-center px-5 py-3 rounded-pill btn-cta text-sm font-semibold"
                >
                  {t("Avvisami al lancio", "Get notified at launch", "Avísame cuando esté disponible", "Meld me aan bij lancering", "ローンチ時に通知", "출시 시 알림 받기")}
                </a>
              )}
              {isLiveBasic && (
                <a
                  href={waitlistHref}
                  className="inline-flex items-center px-5 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
                >
                  {t(
                    "Avvisami per i dati avanzati",
                    "Notify me for advanced data",
                    "Avísame para los datos avanzados",
                    "Meld me voor geavanceerde data",
                    "高度なデータの通知を受け取る",
                    "고급 데이터 알림 받기",
                  )}
                </a>
              )}
              {!isLiveBasic && (
                <Link
                  href={`/${lc}/integrations`}
                  className="inline-flex items-center px-5 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
                >
                  {t(
                    "Vedi tutte le integrazioni",
                    "See all integrations",
                    "Ver todas las integraciones",
                    "Bekijk alle integraties",
                    "すべての連携を見る",
                    "모든 연동 보기",
                  )}
                </Link>
              )}
            </div>

            <p className="mt-5 text-xs text-text-muted max-w-md">
              {t(
                "FitMesh Sync è un prodotto indipendente. I marchi citati appartengono ai rispettivi proprietari e questa pagina non implica affiliazione o sponsorizzazione.",
                "FitMesh Sync is an independent product. Trademarks belong to their respective owners; this page implies no affiliation or sponsorship.",
                "FitMesh Sync es un producto independiente. Las marcas mencionadas pertenecen a sus respectivos propietarios y esta página no implica ninguna afiliación ni patrocinio.",
                "FitMesh Sync is een onafhankelijk product. Handelsmerken zijn eigendom van hun respectieve eigenaars; deze pagina impliceert geen aansluiting of sponsoring.",
                "FitMesh Syncは独立した製品です。記載の商標は各社に帰属し、このページはいかなる提携や後援も意味しません。",
                "FitMesh Sync는 독립적인 제품입니다. 상표는 해당 소유자에게 귀속되며 이 페이지는 어떠한 제휴나 후원도 의미하지 않습니다.",
              )}
            </p>
            <Link
              href={fitnessDataSyncHref}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-aqua transition"
            >
              {t(
                "Come si confronta con le altre architetture di sync",
                "How this compares to other sync architectures",
                "Cómo se compara con otras arquitecturas de sincronización",
                "Hoe dit zich verhoudt tot andere sync-architecturen",
                "他の同期アーキテクチャとの比較",
                "다른 동기화 아키텍처와의 비교",
              )}
            </Link>
          </div>

          {/* Provider monogram card */}
          <div className="lg:col-span-5" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
            <div className="card-glass p-10 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-28 -right-28 w-80 h-80 rounded-full opacity-30 blur-3xl"
                style={{ background: p.brandColor }}
              />
              <div
                aria-hidden
                className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full opacity-20 blur-3xl"
                style={{ background: p.brandColor }}
              />
              {/* Animated ring around the monogram */}
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 -m-3 rounded-full opacity-60 animate-pulse motion-reduce:animate-none"
                  style={{
                    background: `conic-gradient(from 0deg, ${p.brandColor}00, ${p.brandColor}66, ${p.brandColor}00)`,
                    filter: "blur(6px)",
                  }}
                />
                <div
                  className="relative w-28 h-28 rounded-full flex items-center justify-center font-display text-5xl font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${p.brandColor}, ${p.brandColor}cc)`,
                    boxShadow: `0 16px 40px -16px ${p.brandColor}88, inset 0 1px 0 rgba(255,255,255,0.25)`,
                  }}
                >
                  {p.initial}
                </div>
              </div>
              <p className="mt-7 font-display text-2xl font-semibold text-text-primary relative tracking-tight">
                {p.name}
              </p>
              <p className="mt-1 text-sm text-text-muted relative">{p.vendor}</p>
            </div>
          </div>
        </div>
      </section>

      {/* DATA TYPES GRID — estratto in variabile: FASE 5 P1.8C lo riposiziona
          dopo "percorso dati" SOLO per i provider col nuovo template
          (editorialTemplateV2). Per tutti gli altri resta esattamente qui,
          posizione e markup invariati. */}
      {(() => {
        const dataTypesSection = (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
            <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
              {t("Dati supportati", "Supported data", "Datos disponibles", "Ondersteunde gegevens", "サポートされているデータ", "지원 데이터")}
            </h2>
            <p className="mt-2 text-text-secondary max-w-2xl">
              {t(
                "I tipi di dato che FitMesh può leggere da questa integrazione. Pallino verde = supportato, grigio = non disponibile da questa fonte.",
                "The data types FitMesh can read from this integration. Green dot = supported, grey = not available from this source.",
                "Los tipos de datos que FitMesh puede leer de esta integración. Punto verde = disponible, gris = no disponible desde esta fuente.",
                "De gegevenstypen die FitMesh van deze integratie kan lezen. Groene stip = ondersteund, grijs = niet beschikbaar.",
                "この連携からFitMeshが読み取れるデータタイプ。緑の点 = 対応、グレー = この連携からは利用不可。",
                "이 연동에서 FitMesh가 읽을 수 있는 데이터 유형. 녹색 점 = 지원, 회색 = 이 소스에서 불가.",
              )}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {p.dataTypes.map((d) => (
                <div
                  key={d.key}
                  className={`card p-4 flex items-center gap-3 ${
                    d.supported ? "" : "opacity-50"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      background: d.supported ? "#31E981" : "#556078",
                      boxShadow: d.supported ? "0 0 10px #31E98155" : "none",
                    }}
                  />
                  <span className="text-sm text-text-primary">{tl(d.label, lc)}</span>
                </div>
              ))}
            </div>
          </section>
        );
        return !p.editorialTemplateV2 ? dataTypesSection : null;
      })()}

      {/* ═══ FASE 5 P1.8C — blocchi 2-4 del nuovo modello editoriale, pilota
          Pixel Watch/Wear OS (gated su editorialTemplateV2, opzionali). ═══ */}
      {p.editorialTemplateV2 && (
        <>
          {/* Blocco 2: verdetto "funziona se... / non ti serve se..." */}
          {p.verdict && (
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-card border border-divider bg-gradient-to-br from-success/5 to-bg-card p-6">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-success font-semibold">
                    {t("Funziona se", "Works if", "Funciona si", "Werkt als", "こんな場合に機能します", "이런 경우 작동합니다")}
                  </p>
                  <p className="mt-3 text-text-secondary leading-relaxed">{tl(p.verdict.worksIf, lc)}</p>
                </div>
                <div className="rounded-card border border-divider bg-bg-card/60 p-6">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold">
                    {t("Probabilmente non ti serve se", "You probably don't need it if", "Probablemente no lo necesitas si", "Je hebt het waarschijnlijk niet nodig als", "こんな場合はおそらく不要です", "이런 경우 필요하지 않을 수 있습니다")}
                  </p>
                  <p className="mt-3 text-text-secondary leading-relaxed">{tl(p.verdict.skipIf, lc)}</p>
                </div>
              </div>
            </section>
          )}

          {/* Blocco 3: requisiti */}
          {p.requirements && (
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-8">
              <h2 className="font-display text-xl font-semibold tracking-tightest text-text-primary">
                {t("Requisiti", "Requirements", "Requisitos", "Vereisten", "必要条件", "요구 사항")}
              </h2>
              <ul className="mt-4 space-y-2">
                {tll(p.requirements, lc).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-text-secondary">
                    <span className="text-brand-aqua mt-1">•</span>
                    <span>{renderInlineBold(r)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Blocco 4: percorso dati */}
          {p.dataPath && (
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-8">
              <h2 className="font-display text-xl font-semibold tracking-tightest text-text-primary">
                {t("Percorso dei dati", "Data path", "Recorrido de los datos", "Datapad", "データの経路", "데이터 경로")}
              </h2>
              <p className="mt-3 text-text-secondary leading-relaxed">{tl(p.dataPath.intro, lc)}</p>
              <ol className="mt-5 space-y-3">
                {tll(p.dataPath.steps, lc).map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex-none w-7 h-7 rounded-full bg-brand-aqua/15 text-brand-aqua text-sm font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed text-text-secondary">{renderInlineBold(step)}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      {/* DATA TYPES GRID — nuova posizione (blocco 5), solo per editorialTemplateV2 */}
      {(() => {
        if (!p.editorialTemplateV2) return null;
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
            <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
              {t("Dati supportati", "Supported data", "Datos disponibles", "Ondersteunde gegevens", "サポートされているデータ", "지원 데이터")}
            </h2>
            <p className="mt-2 text-text-secondary max-w-2xl">{dataTypeLegend}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {p.dataTypes.map((d) => {
                const metricLabel = tl(d.label, lc);
                const statusKey = d.status === "conditional" ? "conditional" : d.supported ? "verified" : "unsupported";
                const statusText = dataTypeStatusLabel[statusKey];
                return (
                  <div
                    key={d.key}
                    role="group"
                    aria-label={`${metricLabel} — ${statusText}`}
                    className={`card p-4 flex items-center gap-3 ${d.supported ? "" : "opacity-50"}`}
                  >
                    {/* Il colore non e' l'unico veicolo dello stato: il nome
                        accessibile del gruppo lo dichiara per esteso
                        ("[metrica] — [stato]"), il pallino e' decorativo. */}
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        background: d.status === "conditional" ? "#FFB547" : d.supported ? "#31E981" : "#556078",
                        boxShadow: d.status === "conditional" ? "0 0 10px #FFB54755" : d.supported ? "0 0 10px #31E98155" : "none",
                      }}
                    />
                    <span className="text-sm text-text-primary">
                      {metricLabel}
                      {statusKey !== "verified" && (
                        <span aria-hidden="true" className="block text-[10px] uppercase tracking-wide text-text-muted">
                          {statusText}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* CTA contestuale "dopo la matrice" (analytics FASE 7 + CTA
                platform-aware FASE 5): questo blocco descrive il percorso
                Android/Health Connect, quindi nasconde il pulsante App
                Store quando il provider e' Android-only — non tocca
                hero/CTA finale (componente condiviso con gli altri 17
                provider, "non cambiare le altre landing senza un audit
                specifico"). */}
            {isLive && (
              <div className="mt-8">
                <StoreButtonsRow
                  locale={lc}
                  iosDisabled={!platforms.includes("ios")}
                  ctaLocation={CTA_PLACEMENTS.syncProviderMidMatrix}
                />
              </div>
            )}
          </section>
        );
      })()}

      {p.editorialTemplateV2 && (
        <>
          {/* Blocco 6: valore concreto di FitMesh (casi d'uso) */}
          {p.useCases && (
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-8">
              <h2 className="font-display text-xl font-semibold tracking-tightest text-text-primary">
                {t("A cosa serve davvero", "What it's actually good for", "Para qué sirve realmente", "Waar het echt goed voor is", "実際に役立つこと", "실제로 유용한 점")}
              </h2>
              <ul className="mt-4 space-y-2">
                {tll(p.useCases, lc).map((u, i) => (
                  <li key={i} className="flex items-start gap-2 text-text-secondary">
                    <span className="text-brand-aqua mt-1">•</span>
                    <span>{renderInlineBold(u)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Blocco 7: screenshot reale — SOLO se un asset vero e' stato fornito. */}
          {p.screenshot && (
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.screenshot.src}
                alt={tl(p.screenshot.alt, lc)}
                className="rounded-card border border-divider w-full h-auto"
              />
            </section>
          )}

          {/* Blocco 8: limiti onesti */}
          {p.limitations && (
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-8">
              <h2 className="font-display text-xl font-semibold tracking-tightest text-text-primary">
                {t("Limiti", "Limitations", "Límites", "Beperkingen", "制限事項", "제한 사항")}
              </h2>
              <ul className="mt-4 space-y-2">
                {tll(p.limitations, lc).map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-text-secondary">
                    <span className="text-text-muted mt-1">•</span>
                    <span>{renderInlineBold(l)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* LIVE-BASIC: cosa funziona oggi / cosa aggiungerà OAuth */}
      {isLiveBasic && p.viaHC && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Cosa funziona OGGI */}
            <div className="rounded-card border border-divider bg-gradient-to-br from-success/5 to-bg-card p-6 sm:p-8 relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl bg-success"
              />
              <div className="relative">
                <p className="text-[10px] uppercase tracking-[0.22em] text-success font-semibold">
                  {t("Funziona oggi", "Works today", "Funciona hoy", "Werkt vandaag", "今日から動作", "오늘 작동")}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-text-primary">
                  {t(
                    "Via Health Connect, senza configurazione extra",
                    "Via Health Connect, no extra setup",
                    "Via Health Connect, sin configuración adicional",
                    "Via Health Connect, geen extra instelling",
                    "Health Connect経由、追加設定不要",
                    "Health Connect 경유, 추가 설정 없음",
                  )}
                </h2>
                <ul className="mt-5 space-y-2">
                  {tll(p.viaHC.worksNow, lc).map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cosa AGGIUNGERÀ l'OAuth */}
            <div className="rounded-card border border-divider bg-gradient-to-br from-brand-aqua/5 to-bg-card p-6 sm:p-8 relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl bg-brand-aqua"
              />
              <div className="relative">
                <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
                  {t(
                    `OAuth ufficiale — ${tl(p.viaHC.oauthEta, lc)}`,
                    `Official OAuth — ${tl(p.viaHC.oauthEta, lc)}`,
                    `OAuth oficial: ${tl(p.viaHC.oauthEta, lc)}`,
                    `Officiële OAuth — ${tl(p.viaHC.oauthEta, lc)}`,
                    `公式OAuth — ${tl(p.viaHC.oauthEta, lc)}`,
                    `공식 OAuth — ${tl(p.viaHC.oauthEta, lc)}`,
                  )}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-text-primary">
                  {t(
                    "Cosa aggiungerà l'integrazione diretta",
                    "What the direct integration will add",
                    "Qué agregará la integración directa",
                    "Wat de directe integratie toevoegt",
                    "直接連携が追加するもの",
                    "직접 연동이 추가하는 항목",
                  )}
                </h2>
                <ul className="mt-5 space-y-2">
                  {tll(p.viaHC.oauthAdds, lc).map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <span className="text-brand-aqua mt-0.5 flex-shrink-0">+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={waitlistHref}
                  className="mt-6 inline-flex items-center text-xs text-brand-aqua hover:text-brand-green transition"
                >
                  {t(
                    "Avvisami quando disponibile →",
                    "Notify me when available →",
                    "Avísame cuando esté disponible →",
                    "Meld me wanneer beschikbaar →",
                    "利用可能になったら通知 →",
                    "이용 가능 시 알림 받기 →",
                  )}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TECH NOTE — nascosta per editorialTemplateV2: il contenuto e'
          gia' coperto (in modo piu' strutturato) dal blocco 4 "percorso
          dati" sopra. Mostrarla anche qui duplicherebbe la stessa
          informazione, contro la regola FASE 5 "ogni sezione deve
          aggiungere un'informazione distinta". p.techNote resta popolato
          (non e' un campo morto: e' comunque letto altrove se in futuro
          serve), semplicemente non renderizzato qui per questi 2 provider. */}
      {!p.editorialTemplateV2 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <div className="rounded-card border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
              {t("Nota tecnica", "Technical note", "Nota técnica", "Technische opmerking", "技術的なメモ", "기술 참고 사항")}
            </p>
            <p className="mt-3 text-text-secondary leading-relaxed">{tl(p.techNote, lc)}</p>
          </div>
        </section>
      )}

      {/* SETUP GUIDE (optional) */}
      {p.setupGuide && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {t(
              `Come collegare ${p.name}`,
              `How to connect ${p.name}`,
              `Cómo conectar ${p.name}`,
              `${p.name} verbinden`,
              `${p.name}の接続方法`,
              `${p.name} 연결 방법`,
            )}
          </h2>

          <h3 className="mt-8 text-lg font-semibold text-text-primary">
            {/* P1.8C: era "Setup in 5 minuti" — tempo assoluto non sostenuto
                (bug di verita' gia' esistente su OGNI provider, non solo
                Pixel/Wear OS). Vedi docs/seo/p18c-pixel-watch-wear-os-fact-ledger.md
                Fase 4: nessuna fonte lo sostiene, e per pixel-watch era in
                contraddizione interna con la stessa pagina (techNote
                dichiara 15-30 min di latenza dati). Corretto qui, una volta
                sola per tutti i provider — non e' il nuovo modello
                editoriale FASE 5 (quello resta pilota Pixel/Wear OS). */}
            {t("Come collegarlo", "How to connect it", "Cómo conectarlo", "Zo verbind je het", "接続方法", "연결 방법")}
          </h3>
          <ol className="mt-4 space-y-3 text-text-secondary">
            {tll(p.setupGuide.steps, lc).map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-none w-7 h-7 rounded-full bg-brand-aqua/15 text-brand-aqua text-sm font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{renderInlineBold(step)}</span>
              </li>
            ))}
          </ol>

          <h3 className="mt-10 text-lg font-semibold text-text-primary">
            {t("Cosa viene sincronizzato", "What gets synced", "Qué se sincroniza", "Wat wordt gesynchroniseerd", "同期されるデータ", "동기화되는 항목")}
          </h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-text-secondary">
            {tll(p.setupGuide.syncedData, lc).map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-brand-aqua mt-1">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-10 text-lg font-semibold text-text-primary">
            {t("Risoluzione problemi", "Troubleshooting", "Solución de problemas", "Problemen oplossen", "トラブルシューティング", "문제 해결")}
          </h3>
          <div className="mt-4 space-y-3">
            {p.setupGuide.troubleshooting.map((tr, i) => (
              <details
                key={i}
                className="card p-5 group [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="cursor-pointer flex items-start justify-between gap-4 text-text-primary font-medium">
                  <span>{tl(tr.q, lc)}</span>
                  <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">{tl(tr.a, lc)}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 rounded-card border border-divider bg-bg-card/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
              {t("Note tecniche", "Technical notes", "Notas técnicas", "Technische opmerkingen", "技術的なメモ", "기술 참고 사항")}
            </p>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {tl(p.setupGuide.technicalNotes, lc)}
            </p>
          </div>
        </section>
      )}

      {/* FAQ */}
      {p.faqs.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {t("Domande frequenti", "Frequently asked questions", "Preguntas frecuentes", "Veelgestelde vragen", "よくある質問", "자주 묻는 질문")}
          </h2>
          <div className="mt-8 space-y-4">
            {p.faqs.map((f, i) => (
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
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">{tl(f.a, lc)}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Blocco 12 (FASE 5): fonti visibili + data di verifica. Riusa
          <BlogSources>, stessa logica di dominio-come-label del blog —
          niente titolo remoto inventato. Contiene anche il link
          fitness-data-sync obbligatorio da FASE 7 (#6): "landing
          Pixel/Wear OS -> fitness-data-sync nella locale corretta o
          fallback EN diretto" — fitnessDataSyncHref e' gia' calcolato in
          cima al componente con lo stesso fallback usato dall'hero. */}
      {p.editorialTemplateV2 && p.sourcesBlock && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-4">
          <p className="text-xs text-text-muted">
            {t(
              `Verificato il ${formatDate(p.sourcesBlock.verifiedOn, lc)}.`,
              `Verified on ${formatDate(p.sourcesBlock.verifiedOn, lc)}.`,
              `Verificado el ${formatDate(p.sourcesBlock.verifiedOn, lc)}.`,
              `Geverifieerd op ${formatDate(p.sourcesBlock.verifiedOn, lc)}.`,
              `${formatDate(p.sourcesBlock.verifiedOn, lc)}に確認済み。`,
              `${formatDate(p.sourcesBlock.verifiedOn, lc)}에 확인됨.`,
            )}{" "}
            <Link href={fitnessDataSyncHref} className="text-brand-aqua hover:text-brand-green underline-offset-2 hover:underline transition">
              {t(
                "Come si confronta con le altre architetture di sync →",
                "How this compares to other sync architectures →",
                "Cómo se compara con otras arquitecturas de sincronización →",
                "Hoe dit zich verhoudt tot andere sync-architecturen →",
                "他の同期アーキテクチャとの比較 →",
                "다른 동기화 아키텍처와의 비교 →",
              )}
            </Link>
          </p>
        </section>
      )}
      {p.editorialTemplateV2 && (
        <BlogSources sources={p.sourcesBlock?.sources} locale={lc} />
      )}

      {/* APPROFONDISCI — internal linking ai blog post correlati */}
      {p.relatedBlogSlugs && p.relatedBlogSlugs.length > 0 && (() => {
        // Sprint P0.13: blogLinkHref è l'unica fonte di verità per "posso
        // linkare questo post da qui nella locale corrente?" — stesso
        // helper usato in blog/[slug]/page.tsx per related/prev/next.
        const relatedPosts = p.relatedBlogSlugs
          .map((s) => postsBySlug[s])
          .filter((post): post is NonNullable<typeof post> => post !== undefined)
          .map((post) => ({ post, href: blogLinkHref(post, lc) }))
          .filter((x): x is { post: BlogPost; href: string } => x.href !== null);
        if (relatedPosts.length === 0) return null;
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
            <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
              {t("Approfondisci", "Read more", "Saber más")}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {relatedPosts.map(({ post, href }) => (
                <Link
                  key={post.slug}
                  href={href}
                  prefetch={false}
                  className="card p-6 hover:-translate-y-0.5 transition-transform group"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
                    {post.pillar
                      ? t("Guida principale · ", "Main guide · ", "Guía principal · ", "Hoofdgids · ", "柱 · ", "기둥 · ")
                      : ""}
                    {blogCategoryLabel(post.category, lc)}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-text-primary group-hover:text-brand-aqua transition">
                    {tl(post.hero.title, lc)}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-3">
                    {tl(post.hero.subtitle, lc)}
                  </p>
                  <p className="mt-3 text-xs text-text-muted">
                    {post.readMinutes} {t("min di lettura", "min read", "min de lectura", "min lezen", "分で読める", "분 읽기")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* RELATED */}
      {relatedProviders.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {t("Anche queste integrazioni", "Related integrations", "Integraciones relacionadas", "Gerelateerde integraties", "関連する連携", "관련 연동")}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {relatedProviders.map(({ provider: r, href }) => (
              <Link
                key={r.slug}
                href={href}
                prefetch={false}
                className="card p-5 hover:-translate-y-0.5 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center font-display text-base font-bold text-white"
                    style={{ background: r.brandColor }}
                  >
                    {r.initial}
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary">{r.name}</p>
                    <p className="text-xs text-text-muted">{statusLabel(r.status, lc).text}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20 text-center">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {isLive
            ? t("Pronto a iniziare?", "Ready to start?", "¿Listo para empezar?", "Klaar om te beginnen?", "始める準備はできましたか？", "시작할 준비가 되셨나요?")
            : t("Vuoi essere avvisato?", "Want to be notified?", "¿Quieres que te avisemos?", "Wil je een melding?", "通知を受け取りますか？", "알림을 받으시겠어요?")}
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">
          {/* P1.8C: era "...e in 30 secondi i tuoi dati sono live" — stesso
              bug di tempo assoluto non sostenuto del bottone hero sopra,
              corretto una volta per tutti i provider. */}
          {isLive
            ? t(
                "Scarica FitMesh Sync e autorizza Health Connect: i tuoi dati iniziano a comparire in dashboard al sync successivo.",
                "Download FitMesh Sync and authorize Health Connect: your data starts appearing on the dashboard at the next sync.",
                "Descarga FitMesh Sync y autoriza Health Connect: tus datos empiezan a aparecer en el panel en la siguiente sincronización.",
                "Download FitMesh Sync en geef Health Connect toestemming: je data verschijnt op het dashboard bij de volgende sync.",
                "FitMesh SyncをダウンロードしてHealth Connectを許可すると、次回の同期でデータがダッシュボードに表示されます。",
                "FitMesh Sync를 다운로드하고 Health Connect 권한을 허용하면 다음 동기화 시 데이터가 대시보드에 표시됩니다.",
              )
            : t(
                `Lascia la tua email e ti avvisiamo non appena l'integrazione ${p.name} sarà disponibile. Niente newsletter, niente spam: solo l'annuncio.`,
                `Drop your email and we'll notify you as soon as the ${p.name} integration lands. No newsletter, no spam: just the announcement.`,
                `Deja tu correo y te avisaremos en cuanto la integración con ${p.name} esté disponible. Sin boletines, sin spam: solo el aviso.`,
                `Laat je e-mailadres achter en we laten je weten zodra de ${p.name}-integratie beschikbaar is. Geen nieuwsbrief, geen spam: alleen de aankondiging.`,
                `メールアドレスを登録すると、${p.name}の連携が利用可能になり次第お知らせします。ニュースレターもスパムもなし：発表のみ。`,
                `이메일을 남겨주시면 ${p.name} 연동이 출시되는 즉시 알려드립니다. 뉴스레터 없음, 스팸 없음: 발표만 전달합니다.`,
              )}
        </p>
        <div className="mt-8 flex justify-center">
          {isLive ? (
            <StoreButtonsRow locale={lc} className="justify-center" ctaLocation={CTA_PLACEMENTS.syncProviderFinalCta} />
          ) : (
            <a
              href={waitlistHref}
              className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
            >
              {t("Avvisami al lancio", "Get notified at launch", "Avísame cuando esté disponible", "Meld me aan bij lancering", "ローンチ時に通知", "출시 시 알림 받기")}
            </a>
          )}
        </div>
      </section>
    </>
  );
}
