import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import {
  PROVIDERS,
  PROVIDERS_BY_SLUG,
  type Provider,
} from "@/lib/providers/data";
import { getBlogPostsBySlug } from "@/lib/blog/payload-source";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { tl, tll, categoryLabel as blogCategoryLabel } from "@/lib/blog/types";
import { PRICE_LIFETIME_ANDROID_RAW } from "@/lib/pricing";

const SITE_URL = "https://www.fitmesh.fit";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";
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
    { it: string; en: string; es: string; de: string; pt: string; fr: string; color: string }
  > = {
    live: {
      it: "Disponibile ora",
      en: "Available now",
      es: "Disponible ahora",
      de: "Jetzt verfügbar",
      pt: "Disponível agora",
      fr: "Disponible maintenant",
      color: "#31E981",
    },
    "live-basic": {
      it: "Funziona via Health Connect",
      en: "Works via Health Connect",
      es: "Funciona via Health Connect",
      de: "Funktioniert über Health Connect",
      pt: "Funciona via Health Connect",
      fr: "Fonctionne via Health Connect",
      color: "#21E6C1",
    },
    beta: { it: "Beta", en: "Beta", es: "Beta", de: "Beta", pt: "Beta", fr: "Beta", color: "#FFB547" },
    "roadmap-q3": {
      it: "In arrivo Q3 2026",
      en: "Coming Q3 2026",
      es: "Próximamente Q3 2026",
      de: "Kommt Q3 2026",
      pt: "Em breve Q3 2026",
      fr: "Bientôt T3 2026",
      color: "#38BDF8",
    },
    "roadmap-q4": {
      it: "In arrivo Q4 2026",
      en: "Coming Q4 2026",
      es: "Próximamente Q4 2026",
      de: "Kommt Q4 2026",
      pt: "Em breve Q4 2026",
      fr: "Bientôt T4 2026",
      color: "#A78BFA",
    },
    "coming-soon": {
      it: "In arrivo",
      en: "Coming soon",
      es: "Próximamente",
      de: "Demnächst",
      pt: "Em breve",
      fr: "Bientôt disponible",
      color: "#7CFF5B",
    },
  };
  const entry = map[status];
  return { text: entry[lc] ?? entry.en, color: entry.color };
}

/** Localised category label with es fallback. */
function categoryLabel(
  category: Provider["category"],
  lc: Locale,
): string {
  const map: Record<
    Provider["category"],
    { it: string; en: string; es: string; de: string; pt: string; fr: string }
  > = {
    smartwatch: { it: "Smartwatch", en: "Smartwatch", es: "Smartwatch", de: "Smartwatch", pt: "Smartwatch", fr: "Montre connectée" },
    "fitness-platform": {
      it: "Piattaforma fitness",
      en: "Fitness platform",
      es: "Plataforma de fitness",
      de: "Fitness-Plattform",
      pt: "Plataforma de fitness",
      fr: "Plateforme fitness",
    },
    "health-platform": {
      it: "Piattaforma salute",
      en: "Health platform",
      es: "Plataforma de salud",
      de: "Gesundheitsplattform",
      pt: "Plataforma de saúde",
      fr: "Plateforme santé",
    },
    wearable: { it: "Wearable", en: "Wearable", es: "Wearable", de: "Wearable", pt: "Wearable", fr: "Wearable" },
    "phone-only": { it: "Solo telefono", en: "Phone-only", es: "Solo teléfono", de: "Nur Smartphone", pt: "Somente telefone", fr: "Téléphone uniquement" },
  };
  return map[category][lc] ?? map[category].en;
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
        : `Sync ${p.name} to FitMesh Sync`;
  const description = tl(p.tagline, lc);

  const path = `/${lc}/sync/${p.slug}`;
  return {
    title,
    description,
    keywords: tll(p.seoKeywords, lc).join(", "),
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/sync/${p.slug}`,
        en: `${SITE_URL}/en/sync/${p.slug}`,
        es: `${SITE_URL}/es/sync/${p.slug}`,
        "x-default": `${SITE_URL}/it/sync/${p.slug}`,
      },
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

  // "isLive" = CTA primaria è Play Store. Sia `live` (nativo) sia `live-basic`
  // (via HC) sono usabili oggi → entrambi mostrano il bottone Play Store.
  const isLive = p.status === "live" || p.status === "live-basic";
  const isLiveBasic = p.status === "live-basic";
  const status = statusLabel(p.status, lc);
  const category = categoryLabel(p.category, lc);

  /** Helper per stringhe inline con tre locale. */
  const t = (it: string, en: string, es: string) =>
    lc === "it" ? it : lc === "es" ? es : en;

  // ── JSON-LD ──────────────────────────────────────────────────────────
  const path = `/${lc}/sync/${p.slug}`;
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `FitMesh Sync — ${p.name}`,
    applicationCategory: "HealthApplication",
    operatingSystem: "ANDROID",
    description: tl(p.longDesc, lc),
    url: `${SITE_URL}${path}`,
    inLanguage: lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : "en-US",
    offers: { "@type": "Offer", price: PRICE_LIFETIME_ANDROID_RAW, priceCurrency: "EUR" },
    downloadUrl: PLAY_URL,
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
          ),
          description: tl(p.longDesc, lc),
          inLanguage: lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : "en-US",
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
  const relatedProviders = PROVIDERS.filter(
    (x) => x.slug !== p.slug && x.category === p.category,
  ).slice(0, 3);

  const waitlistSubject = encodeURIComponent(
    `Waitlist ${p.name} — FitMesh Sync`,
  );
  const waitlistBody = encodeURIComponent(
    t(
      `Ciao!\n\nVoglio essere avvisato/a quando l'integrazione con ${p.name} sarà disponibile.\n\nLa mia email:\n`,
      `Hi!\n\nPlease notify me when the ${p.name} integration becomes available.\n\nMy email:\n`,
      `Hola!\n\nQuiero que me avisen cuando la integración con ${p.name} esté disponible.\n\nMi correo:\n`,
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
            name: t("Integrazioni", "Integrations", "Integraciones"),
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
              {t(`Sincronizza ${p.name}`, `Sync ${p.name}`, `Sincroniza ${p.name}`)}{" "}
              <span className="text-brand-gradient">
                {t("alla tua dashboard", "to your dashboard", "con tu panel")}
              </span>
            </h1>

            <p className="mt-6 text-lg text-text-secondary max-w-xl leading-relaxed">
              {tl(p.longDesc, lc)}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {isLive ? (
                <StoreButtonsRow locale={lc} />
              ) : (
                <a
                  href={waitlistHref}
                  className="inline-flex items-center px-5 py-3 rounded-pill btn-cta text-sm font-semibold"
                >
                  {t("Avvisami al lancio", "Get notified at launch", "Avísame cuando esté disponible")}
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
                  )}
                </Link>
              )}
            </div>

            <p className="mt-5 text-xs text-text-muted max-w-md">
              {t(
                "FitMesh Sync è un prodotto indipendente. I marchi citati appartengono ai rispettivi proprietari e questa pagina non implica affiliazione o sponsorizzazione.",
                "FitMesh Sync is an independent product. Trademarks belong to their respective owners; this page implies no affiliation or sponsorship.",
                "FitMesh Sync es un producto independiente. Las marcas mencionadas pertenecen a sus respectivos propietarios y esta página no implica ninguna afiliación ni patrocinio.",
              )}
            </p>
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
                  className="absolute inset-0 -m-3 rounded-full opacity-60 animate-pulse"
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

      {/* DATA TYPES GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {t("Dati supportati", "Supported data", "Datos disponibles")}
        </h2>
        <p className="mt-2 text-text-secondary max-w-2xl">
          {t(
            "I tipi di dato che FitMesh può leggere da questa integrazione. Pallino verde = supportato, grigio = non disponibile da questa fonte.",
            "The data types FitMesh can read from this integration. Green dot = supported, grey = not available from this source.",
            "Los tipos de datos que FitMesh puede leer de esta integración. Punto verde = disponible, gris = no disponible desde esta fuente.",
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
                  {t("Funziona oggi", "Works today", "Funciona hoy")}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-text-primary">
                  {t(
                    "Via Health Connect, senza configurazione extra",
                    "Via Health Connect, no extra setup",
                    "Via Health Connect, sin configuración adicional",
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
                  )}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-text-primary">
                  {t(
                    "Cosa aggiungerà l'integrazione diretta",
                    "What the direct integration will add",
                    "Qué agregará la integración directa",
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
                  )}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TECH NOTE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <div className="rounded-card border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {t("Nota tecnica", "Technical note", "Nota técnica")}
          </p>
          <p className="mt-3 text-text-secondary leading-relaxed">{tl(p.techNote, lc)}</p>
        </div>
      </section>

      {/* SETUP GUIDE (optional) */}
      {p.setupGuide && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {t(
              `Come collegare ${p.name}`,
              `How to connect ${p.name}`,
              `Cómo conectar ${p.name}`,
            )}
          </h2>

          <h3 className="mt-8 text-lg font-semibold text-text-primary">
            {t("Setup in 5 minuti", "5-minute setup", "Configuración en 5 minutos")}
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
            {t("Cosa viene sincronizzato", "What gets synced", "Qué se sincroniza")}
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
            {t("Risoluzione problemi", "Troubleshooting", "Solución de problemas")}
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
              {t("Note tecniche", "Technical notes", "Notas técnicas")}
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
            {t("Domande frequenti", "Frequently asked questions", "Preguntas frecuentes")}
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

      {/* APPROFONDISCI — internal linking ai blog post correlati */}
      {p.relatedBlogSlugs && p.relatedBlogSlugs.length > 0 && (() => {
        const relatedPosts = p.relatedBlogSlugs
          .map((s) => postsBySlug[s])
          .filter((post): post is NonNullable<typeof post> => post !== undefined);
        if (relatedPosts.length === 0) return null;
        return (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12">
            <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
              {t("Approfondisci", "Read more", "Saber más")}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {relatedPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/${lc}/blog/${localizedBlogSlug(post.slug, lc)}`}
                  className="card p-6 hover:-translate-y-0.5 transition-transform group"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
                    {post.pillar
                      ? t("Pilastro · ", "Pillar · ", "Referencia · ")
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
                    {post.readMinutes} {t("min di lettura", "min read", "min de lectura")}
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
            {t("Anche queste integrazioni", "Related integrations", "Integraciones relacionadas")}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {relatedProviders.map((r) => (
              <Link
                key={r.slug}
                href={`/${lc}/sync/${r.slug}`}
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
            ? t("Pronto a iniziare?", "Ready to start?", "¿Listo para empezar?")
            : t("Vuoi essere avvisato?", "Want to be notified?", "¿Quieres que te avisemos?")}
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">
          {isLive
            ? t(
                "Scarica FitMesh Sync, autorizza Health Connect, e in 30 secondi i tuoi dati sono live.",
                "Download FitMesh Sync, grant Health Connect permissions, and your data is live in 30 seconds.",
                "Descarga FitMesh Sync, autoriza Health Connect y en 30 segundos tus datos estarán disponibles.",
              )
            : t(
                `Lascia la tua email e ti avvisiamo non appena l'integrazione ${p.name} sarà disponibile. Niente newsletter, niente spam: solo l'annuncio.`,
                `Drop your email and we'll notify you as soon as the ${p.name} integration lands. No newsletter, no spam: just the announcement.`,
                `Deja tu correo y te avisaremos en cuanto la integración con ${p.name} esté disponible. Sin boletines, sin spam: solo el aviso.`,
              )}
        </p>
        <div className="mt-8 flex justify-center">
          {isLive ? (
            <StoreButtonsRow locale={lc} className="justify-center" />
          ) : (
            <a
              href={waitlistHref}
              className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
            >
              {t("Avvisami al lancio", "Get notified at launch", "Avísame cuando esté disponible")}
            </a>
          )}
        </div>
      </section>
    </>
  );
}
