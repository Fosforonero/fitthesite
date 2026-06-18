import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { tl } from "@/lib/blog/types";
import {
  PROVIDERS,
  categoryLabel,
  statusLabel,
  type ProviderCategory,
} from "@/lib/providers/data";

const SITE_URL = "https://www.fitmesh.fit";

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
              : "All FitMesh Sync integrations: Galaxy Watch, Wear OS, Mi Band, Fitbit, Garmin, Strava, Polar, Oura, Withings. Live status and roadmap.";

  const path = `/${lc}/integrations`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/integrations`,
        en: `${SITE_URL}/en/integrations`,
        es: `${SITE_URL}/es/integrations`,
        de: `${SITE_URL}/de/integrations`,
        pt: `${SITE_URL}/pt/integrations`,
        fr: `${SITE_URL}/fr/integrations`,
        "x-default": `${SITE_URL}/it/integrations`,
      },
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
  const t = (it: string, en: string, es?: string, de?: string, pt?: string, fr?: string) =>
    lc === "it" ? it : lc === "es" ? (es ?? en) : lc === "de" ? (de ?? en) : lc === "pt" ? (pt ?? en) : lc === "fr" ? (fr ?? en) : en;
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
    name: t("Integrazioni FitMesh Sync", "FitMesh Sync Integrations", "Integraciones FitMesh Sync", "FitMesh Sync Integrationen", "Integrações FitMesh Sync", "Intégrations FitMesh Sync"),
    url: `${SITE_URL}/${lc}/integrations`,
    inLanguage: lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : lc === "de" ? "de-DE" : lc === "pt" ? "pt-BR" : lc === "fr" ? "fr-FR" : "en-US",
    hasPart: PROVIDERS.map((p) => ({
      "@type": "SoftwareApplication",
      name: `FitMesh Sync — ${p.name}`,
      url: `${SITE_URL}/${lc}/sync/${p.slug}`,
      applicationCategory: "HealthApplication",
      operatingSystem: "ANDROID",
    })),
  };

  return (
    <>
      <JsonLd data={collectionLd} />
      <Breadcrumbs
        items={[{ name: t("Integrazioni", "Integrations", "Integraciones", "Integrationen", "Integrações", "Intégrations"), path: `/${lc}/integrations` }]}
        locale={lc}
      />

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16" data-reveal>
        <div
          aria-hidden
          className="halo-conic absolute left-1/2 top-0 -z-10 h-[400px] w-[640px] -translate-x-1/2 opacity-50 animate-float"
        />
        <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
          {t("Integrazioni", "Integrations", "Integraciones", "Integrationen", "Integrações", "Intégrations")}
        </p>
        <h1 className="mt-4 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl text-balance">
          {t(
            "Uno smartwatch, una piattaforma. ",
            "One watch, one platform. ",
            "Un smartwatch, una plataforma. ",
            "Eine Smartwatch, eine Plattform. ",
            "Um smartwatch, uma plataforma. ",
            "Une montre connectée, une plateforme. ",
          )}
          <span className="text-brand-gradient">
            {t(
              "Tutti i tuoi dati salute insieme.",
              "All your health data together.",
              "Todos tus datos de salud, juntos.",
              "Alle deine Gesundheitsdaten an einem Ort.",
              "Todos os seus dados de saúde reunidos.",
              "Toutes vos données de santé au même endroit.",
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
          )}
        </p>

        {/* Inline stats row */}
        <ul className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-left">
          <li>
            <p className="font-display text-3xl font-semibold text-text-primary tracking-tightest">
              {liveCount}<span className="text-brand-green">·</span>
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-text-muted leading-tight">
              {t("Live oggi", "Live today", "Disponibles hoy", "Jetzt live", "Disponíveis hoje", "Disponibles aujourd'hui")}
            </p>
          </li>
          <li>
            <p className="font-display text-3xl font-semibold text-text-primary tracking-tightest">
              {roadmapCount}+
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-text-muted leading-tight">
              {t("In roadmap", "In roadmap", "En hoja de ruta", "In der Roadmap", "No roadmap", "Dans la feuille de route")}
            </p>
          </li>
          <li>
            <p className="font-display text-3xl font-semibold text-text-primary tracking-tightest">
              {PROVIDERS.length}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-text-muted leading-tight">
              {t("Totale supportate", "Total supported", "Total compatibles")}
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
              return (
                <Link
                  key={p.slug}
                  href={`/${lc}/sync/${p.slug}`}
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
            {t("Bonus", "Bonus", "Bonus")}
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-text-primary max-w-2xl">
            {t(
              "Hai un altro brand? Probabilmente funziona già.",
              "Got another brand? It likely already works.",
              "¿Tienes otra marca? Probablemente ya funciona.",
            )}
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl leading-relaxed">
            {t(
              "Qualsiasi app o smartwatch che scriva su Health Connect è automaticamente leggibile da FitMesh: Huawei Health, Mobvoi, OnePlus Health, Zepp / Amazfit (modelli moderni), Coros, Withings (parziale), Garmin Connect (parziale), Polar Flow (parziale). Le integrazioni OAuth dedicate aggiungono dati avanzati (Training Load, Body Battery, GPS track) che Health Connect non espone.",
              "Any app or smartwatch that writes to Health Connect is automatically readable by FitMesh: Huawei Health, Mobvoi, OnePlus Health, Zepp / Amazfit (modern models), Coros, Withings (partial), Garmin Connect (partial), Polar Flow (partial). Dedicated OAuth integrations add the advanced data (Training Load, Body Battery, GPS tracks) that Health Connect doesn't expose.",
              "Cualquier app o smartwatch que escriba en Health Connect es compatible automáticamente con FitMesh: Huawei Health, Mobvoi, OnePlus Health, Zepp / Amazfit (modelos modernos), Coros, Withings (parcial), Garmin Connect (parcial), Polar Flow (parcial). Las integraciones OAuth dedicadas añaden datos avanzados (Training Load, Body Battery, rutas GPS) que Health Connect no expone.",
            )}
          </p>
          <Link
            href={`/${lc}/blog/${localizedBlogSlug("guida-sync-wearable-2026", lc)}`}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-brand-aqua hover:text-brand-green transition group"
          >
            {t(
              "Approfondisci nella guida completa al sync wearable",
              "Read the complete guide to wearable sync",
              "Lee la guía completa de sincronización de wearables",
            )}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-20 text-center">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {t("Manca la tua integrazione?", "Missing your integration?", "¿Falta tu integración?")}
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">
          {t(
            "Scrivici quale integrazione ti serve: diamo priorità a quelle più richieste.",
            "Tell us which integration you need: we prioritize the most requested ones.",
            "Cuéntanos qué integración necesitas: damos prioridad a las más solicitadas.",
          )}
        </p>
        <div className="mt-8 flex justify-center">
          <a
            href="mailto:hello@fitmesh.fit?subject=Integration%20request"
            className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
          >
            {t("Richiedi un'integrazione", "Request an integration", "Solicitar una integración")}
          </a>
        </div>
      </section>
    </>
  );
}
