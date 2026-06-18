import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { categoryLabel, tl } from "@/lib/blog/types";
import { getBlogPosts } from "@/lib/blog/payload-source";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";

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
      ? "Blog FitMesh — Sync wearable, Health Connect, privacy salute"
      : lc === "es"
        ? "Blog FitMesh — Sincronización de wearables, Health Connect, privacidad de salud"
        : lc === "de"
          ? "FitMesh Blog — Wearable-Synchronisierung, Health Connect, Gesundheits-Datenschutz"
          : lc === "pt"
            ? "Blog FitMesh — Sincronização de wearables, Health Connect, privacidade de saúde"
            : lc === "fr"
              ? "Blog FitMesh — Synchronisation wearable, Health Connect, confidentialité santé"
              : "FitMesh Blog — Wearable sync, Health Connect, health privacy";
  const description =
    lc === "it"
      ? "Guide oneste su sync wearable, Health Connect, esportazione dati Galaxy Watch / Fitbit / Garmin, GDPR e privacy. Niente hype, solo informazioni utili."
      : lc === "es"
        ? "Guías honestas sobre sincronización de wearables, Health Connect, exportación de datos de Galaxy Watch y Garmin, GDPR y privacidad. Sin hype, solo información útil."
        : lc === "de"
          ? "Ehrliche Ratgeber zu Wearable-Synchronisierung, Health Connect, Datenexport für Galaxy Watch und Garmin, DSGVO und Datenschutz. Kein Hype, nur nützliche Informationen."
          : lc === "pt"
            ? "Guias honestos sobre sincronização de wearables, Health Connect, exportação de dados do Galaxy Watch e Garmin, LGPD e privacidade. Sem hype, só informação útil."
            : lc === "fr"
              ? "Guides honnêtes sur la synchronisation de wearables, Health Connect, l'export de données Galaxy Watch et Garmin, le RGPD et la confidentialité. Sans hype, juste des informations utiles."
              : "Honest guides on wearable sync, Health Connect, Galaxy Watch / Fitbit / Garmin data export, GDPR and privacy. No hype, just useful information.";

  const path = `/${lc}/blog`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/blog`,
        en: `${SITE_URL}/en/blog`,
        es: `${SITE_URL}/es/blog`,
        de: `${SITE_URL}/de/blog`,
        pt: `${SITE_URL}/pt/blog`,
        fr: `${SITE_URL}/fr/blog`,
        "x-default": `${SITE_URL}/it/blog`,
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

const I18N = {
  it: {
    kicker: "Blog",
    heading: "Guide oneste sul sync dei wearable",
    headingAccent: "e i tuoi dati salute",
    lead: "Niente hype, niente recensioni-spot. Spieghiamo cosa funziona davvero nel 2026: Health Connect, esportazione dati, OAuth ufficiali, GDPR, scelta dell'ecosistema giusto.",
    pillarLabel: "Pilastro",
    readMin: (m: number) => `${m} min di lettura`,
    publishedOn: "Pubblicato il",
    explore: "Leggi →",
    sectionPillar: "Guide pilastro",
    sectionRecent: "Tutti gli articoli",
  },
  en: {
    kicker: "Blog",
    heading: "Honest guides on wearable sync",
    headingAccent: "and your health data",
    lead: "No hype, no spot-reviews. We explain what actually works in 2026: Health Connect, data export, official OAuths, GDPR, picking the right ecosystem.",
    pillarLabel: "Pillar",
    readMin: (m: number) => `${m} min read`,
    publishedOn: "Published on",
    explore: "Read →",
    sectionPillar: "Pillar guides",
    sectionRecent: "All articles",
  },
  es: {
    kicker: "Blog",
    heading: "Guías honestas sobre sincronización de wearables",
    headingAccent: "y tus datos de salud",
    lead: "Sin hype ni reseñas de relleno. Explicamos qué funciona de verdad en 2026: Health Connect, exportación de datos, autorizaciones oficiales, GDPR y cómo elegir el ecosistema adecuado.",
    pillarLabel: "Guía principal",
    readMin: (m: number) => `${m} min de lectura`,
    publishedOn: "Publicado el",
    explore: "Leer →",
    sectionPillar: "Guías principales",
    sectionRecent: "Todos los artículos",
  },
  de: {
    kicker: "Blog",
    heading: "Ehrliche Ratgeber zur Wearable-Synchronisierung",
    headingAccent: "und deine Gesundheitsdaten",
    lead: "Kein Hype, keine oberflächlichen Rezensionen. Wir erklären, was 2026 wirklich funktioniert: Health Connect, Datenexport, offizielle Autorisierungen, DSGVO und die Wahl des richtigen Ökosystems.",
    pillarLabel: "Hauptartikel",
    readMin: (m: number) => `${m} Min. Lesezeit`,
    publishedOn: "Veröffentlicht am",
    explore: "Lesen →",
    sectionPillar: "Hauptartikel",
    sectionRecent: "Alle Artikel",
  },
  pt: {
    kicker: "Blog",
    heading: "Guias honestos sobre sincronização de wearables",
    headingAccent: "e seus dados de saúde",
    lead: "Sem hype, sem resenhas superficiais. Explicamos o que realmente funciona em 2026: Health Connect, exportação de dados, autorizações oficiais, LGPD e como escolher o ecossistema certo.",
    pillarLabel: "Guia principal",
    readMin: (m: number) => `${m} min de leitura`,
    publishedOn: "Publicado em",
    explore: "Ler →",
    sectionPillar: "Guias principais",
    sectionRecent: "Todos os artigos",
  },
  fr: {
    kicker: "Blog",
    heading: "Guides honnêtes sur la synchronisation des wearables",
    headingAccent: "et vos données de santé",
    lead: "Sans hype ni critiques expéditives. Nous expliquons ce qui fonctionne vraiment en 2026 : Health Connect, export de données, autorisations officielles, RGPD et comment choisir le bon écosystème.",
    pillarLabel: "Guide pilier",
    readMin: (m: number) => `${m} min de lecture`,
    publishedOn: "Publié le",
    explore: "Lire →",
    sectionPillar: "Guides piliers",
    sectionRecent: "Tous les articles",
  },
};

function formatDate(iso: string, lc: Locale): string {
  const d = new Date(iso);
  const locale =
    lc === "it" ? "it-IT" :
    lc === "es" ? "es-ES" :
    lc === "de" ? "de-DE" :
    lc === "pt" ? "pt-BR" :
    lc === "fr" ? "fr-FR" :
    "en-US";
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const t = I18N[lc];

  const posts = await getBlogPosts();
  const pillars = posts.filter((p) => p.pillar);
  const others = posts.filter((p) => !p.pillar);

  // JSON-LD Blog schema con ItemList di tutti gli articoli.
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/${lc}/blog#blog`,
    name: "FitMesh Sync Blog",
    inLanguage:
      lc === "it" ? "it-IT" :
      lc === "es" ? "es-ES" :
      lc === "de" ? "de-DE" :
      lc === "pt" ? "pt-BR" :
      lc === "fr" ? "fr-FR" :
      "en-US",
    url: `${SITE_URL}/${lc}/blog`,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: tl(p.hero.title, lc),
      url: `${SITE_URL}/${lc}/blog/${localizedBlogSlug(p.slug, lc)}`,
      datePublished: p.publishedAt,
      dateModified: p.updatedAt,
      description: tl(p.metaDescription, lc),
    })),
  };

  return (
    <>
      <JsonLd data={itemListLd} />
      <Breadcrumbs
        items={[{ name: "Blog", path: `/${lc}/blog` }]}
        locale={lc}
      />

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12">
        <div
          aria-hidden
          className="halo-conic absolute left-1/2 top-0 -z-10 h-[420px] w-[680px] -translate-x-1/2 opacity-40 animate-float"
        />
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.kicker}
        </p>
        <h1 className="mt-4 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl">
          {t.heading}{" "}
          <span className="text-brand-gradient">{t.headingAccent}</span>
        </h1>
        <p className="mt-6 text-lg text-text-secondary max-w-2xl leading-relaxed">
          {t.lead}
        </p>
      </section>

      {/* PILLAR CARDS — più grandi */}
      {pillars.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary mb-6">
            {t.sectionPillar}
          </h2>
          <div className="grid gap-5 lg:grid-cols-2">
            {pillars.map((p) => (
              <Link
                key={p.slug}
                href={`/${lc}/blog/${localizedBlogSlug(p.slug, lc)}`}
                className="card-glass p-7 sm:p-8 group hover:-translate-y-0.5 transition-transform relative overflow-hidden"
              >
                <div
                  aria-hidden
                  className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-15 blur-3xl bg-brand-aqua"
                />
                <div className="relative">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-pill border border-brand-aqua/40 bg-brand-aqua/10 text-brand-aqua font-medium">
                      {t.pillarLabel}
                    </span>
                    <span className="text-text-muted">·</span>
                    <span className="text-text-muted">{categoryLabel(p.category, lc)}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-text-muted">{t.readMin(p.readMinutes)}</span>
                  </div>
                  <h3 className="mt-4 font-display text-2xl sm:text-3xl font-semibold tracking-tightest text-text-primary group-hover:text-brand-aqua transition">
                    {tl(p.hero.title, lc)}
                  </h3>
                  <p className="mt-3 text-text-secondary leading-relaxed line-clamp-3">
                    {tl(p.hero.subtitle, lc)}
                  </p>
                  <p className="mt-5 inline-flex items-center text-sm font-semibold text-brand-aqua">
                    {t.explore}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* RECENT GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary mb-6">
          {t.sectionRecent}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((p) => (
            <Link
              key={p.slug}
              href={`/${lc}/blog/${localizedBlogSlug(p.slug, lc)}`}
              className="card p-6 group hover:-translate-y-0.5 transition-transform flex flex-col"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="text-brand-aqua font-medium">
                  {categoryLabel(p.category, lc)}
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">{t.readMin(p.readMinutes)}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-text-primary group-hover:text-brand-aqua transition leading-snug">
                {tl(p.hero.title, lc)}
              </h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-3 flex-1">
                {tl(p.hero.subtitle, lc)}
              </p>
              <p className="mt-4 text-xs text-text-muted">
                {formatDate(p.publishedAt, lc)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
