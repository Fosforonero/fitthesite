import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { BlogRenderer } from "@/components/blog/BlogRenderer";
import { ArticleMeta } from "@/components/blog/ArticleMeta";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { categoryLabel, tl, tll } from "@/lib/blog/types";
import {
  getBlogPostBySlug,
  getBlogSlugs,
  getRelatedPosts,
} from "@/lib/blog/payload-source";

const SITE_URL = "https://www.fitmesh.fit";

/**
 * Author info — Person Matteo Pizzi.
 *
 * E-E-A-T (Experience-Expertise-Authoritativeness-Trustworthiness) e' un
 * fattore SEO critico per i topic YMYL ("Your Money or Your Life") come
 * salute/fitness. Google penalizza articoli salute con `author: Organization`
 * generico; preferisce `author: Person` con bio reale + social profili
 * verificati (sameAs).
 *
 * Per cambiare autore (es. ospiti): override `post.authorOverride` nel
 * blog data model (TODO se serve).
 */
const AUTHOR = {
  name: "Matteo Pizzi",
  jobTitle: "Founder & Solo Dev, FitMesh Sync · Fosforonero",
  bioIt:
    "Sviluppatore software italiano. Ho costruito FitMesh Sync per riempire il vuoto tra il mio smartwatch e una vera dashboard personale. Privacy-first, indie, server EU.",
  bioEn:
    "Italian software developer. I built FitMesh Sync to fill the gap between my smartwatch and a real personal dashboard. Privacy-first, indie, EU servers.",
  bioEs:
    "Desarrollador de software italiano. Construí FitMesh Sync para cubrir el espacio entre mi smartwatch y un panel personal real. Privacidad ante todo, indie, servidores en la UE.",
  url: `${SITE_URL}/it/about`,
  // sameAs: profili pubblici per verifica autorevolezza. Vuoto = aggiungi
  // LinkedIn/Twitter quando disponibili (Matteo ha LinkedIn personale?).
  sameAs: [
    "https://www.fosforonero.com",
  ],
};
// Publisher Organization name (per JSON-LD Article.publisher).
const PUBLISHER_NAME = "FitMesh Sync";

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.flatMap((slug) =>
    locales.map((locale) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  const path = `/${lc}/blog/${post.slug}`;
  const title = tl(post.hero.title, lc);
  const description = tl(post.metaDescription, lc);
  const secondaryKw = tll(
    { it: post.secondaryKeywords.it, en: post.secondaryKeywords.en },
    lc,
  );
  const keywords = [tl(post.primaryKeyword, lc), ...secondaryKw].join(", ");

  // Brand suffix corto (10c) per stare entro 65c totali raccomandati Bing/Google.
  // Vedi fitmesh-growth SKILL → publishing pipeline step 1 (title length guardrail).
  return {
    title: `${title} · FitMesh`,
    description,
    keywords,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/blog/${post.slug}`,
        en: `${SITE_URL}/en/blog/${post.slug}`,
        es: `${SITE_URL}/es/blog/${post.slug}`,
        "x-default": `${SITE_URL}/it/blog/${post.slug}`,
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
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [AUTHOR.name],
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
    backToBlog: "← Tutti gli articoli",
    pillarLabel: "Pilastro",
    readMin: (m: number) => `${m} min di lettura`,
    publishedOn: "Pubblicato",
    updated: "Aggiornato",
    metaCategory: "Categoria",
    metaReadTime: "Lettura",
    metaDate: "Data",
    metaShare: "Condividi",
    metaCopied: "Copiato!",
    tldrLabel: "In breve",
    faqHeading: "Domande frequenti",
    relatedHeading: "Continua a leggere",
    disclaimerHeading: "Disclaimer",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync è un prodotto indipendente. ${brands.join(", ")}${brands.length > 1 ? " sono marchi" : " è un marchio"} dei rispettivi proprietari. Questo articolo non implica affiliazione né sponsorizzazione.`,
    medicalDisclaimerHeading: "Avviso medico",
    medicalDisclaimer:
      "Le informazioni in questo articolo hanno scopo informativo e non sostituiscono il parere del tuo medico, farmacista o professionista sanitario. FitMesh Sync è un'app fitness/wellness, non un dispositivo medico, e non diagnostica né cura patologie. In caso di sintomi, dubbi clinici o decisioni terapeutiche consulta sempre il tuo medico di base.",
  },
  en: {
    backToBlog: "← All articles",
    pillarLabel: "Pillar",
    readMin: (m: number) => `${m} min read`,
    publishedOn: "Published",
    updated: "Updated",
    metaCategory: "Category",
    metaReadTime: "Reading time",
    metaDate: "Date",
    metaShare: "Share",
    metaCopied: "Copied!",
    tldrLabel: "TL;DR",
    faqHeading: "Frequently asked questions",
    relatedHeading: "Keep reading",
    disclaimerHeading: "Disclaimer",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync is an independent product. ${brands.join(", ")} ${brands.length > 1 ? "are trademarks" : "is a trademark"} of their respective owners. This article implies no affiliation or sponsorship.`,
    medicalDisclaimerHeading: "Medical disclaimer",
    medicalDisclaimer:
      "The information in this article is for informational purposes only and does not replace advice from your physician, pharmacist or healthcare professional. FitMesh Sync is a fitness/wellness app, not a medical device, and does not diagnose or treat any conditions. For symptoms, clinical questions or treatment decisions always consult your primary care physician.",
  },
  es: {
    backToBlog: "← Todos los artículos",
    pillarLabel: "Artículo principal",
    readMin: (m: number) => `${m} min de lectura`,
    publishedOn: "Publicado",
    updated: "Actualizado",
    metaCategory: "Categoría",
    metaReadTime: "Tiempo de lectura",
    metaDate: "Fecha",
    metaShare: "Compartir",
    metaCopied: "¡Copiado!",
    tldrLabel: "En resumen",
    faqHeading: "Preguntas frecuentes",
    relatedHeading: "Sigue leyendo",
    disclaimerHeading: "Aviso legal",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync es un producto independiente. ${brands.join(", ")} ${brands.length > 1 ? "son marcas comerciales" : "es una marca comercial"} de sus respectivos propietarios. Este artículo no implica ninguna afiliación ni patrocinio.`,
    medicalDisclaimerHeading: "Aviso de salud",
    medicalDisclaimer:
      "La información de este artículo tiene fines informativos y no reemplaza el consejo de tu médico, farmacéutico u otro profesional de la salud. FitMesh Sync es una app de fitness y bienestar, no un dispositivo médico, y no diagnostica ni trata enfermedades. Ante síntomas, dudas clínicas o decisiones de tratamiento, consulta siempre a tu médico.",
  },
} as const;

function formatDate(iso: string, lc: Locale): string {
  const d = new Date(iso);
  const bcp47 = lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : "en-US";
  return d.toLocaleDateString(bcp47, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogArticle({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();
  const t = I18N[lc];

  const path = `/${lc}/blog/${post.slug}`;
  const ldType = post.ldType ?? "BlogPosting";

  // JSON-LD Article/BlogPosting
  const articleLd = {
    "@context": "https://schema.org",
    "@type": ldType,
    "@id": `${SITE_URL}${path}#article`,
    headline: tl(post.hero.title, lc),
    description: tl(post.metaDescription, lc),
    inLanguage: lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : "en-US",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    url: `${SITE_URL}${path}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${path}` },
    // E-E-A-T critical su YMYL: author Person con bio + sameAs.
    // Google penalizza articoli salute con author=Organization generico.
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/it/about#matteo-pizzi`,
      name: AUTHOR.name,
      jobTitle: AUTHOR.jobTitle,
      description:
        lc === "it" ? AUTHOR.bioIt : lc === "es" ? AUTHOR.bioEs : AUTHOR.bioEn,
      url: AUTHOR.url,
      sameAs: AUTHOR.sameAs,
    },
    publisher: {
      "@type": "Organization",
      name: PUBLISHER_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-square.png`,
      },
    },
    keywords: [
      tl(post.primaryKeyword, lc),
      ...tll({ it: post.secondaryKeywords.it, en: post.secondaryKeywords.en }, lc),
    ].join(", "),
    articleSection: categoryLabel(post.category, lc),
  };

  const faqLd =
    post.faq && post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((f) => ({
            "@type": "Question",
            name: tl(f.q, lc),
            acceptedAnswer: {
              "@type": "Answer",
              text: tl(f.a, lc),
            },
          })),
        }
      : null;

  const related = await getRelatedPosts(post.related);

  return (
    <>
      <JsonLd data={articleLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <Breadcrumbs
        items={[
          { name: "Blog", path: `/${lc}/blog` },
          { name: tl(post.hero.title, lc), path },
        ]}
        locale={lc}
      />

      {/* HEADER */}
      <article>
        <header className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8">
          <div
            aria-hidden
            className="halo-conic absolute left-1/2 top-0 -z-10 h-[320px] w-[520px] -translate-x-1/2 opacity-30"
          />
          <Link
            href={`/${lc}/blog`}
            className="inline-flex items-center text-sm text-text-muted hover:text-brand-aqua transition"
          >
            {t.backToBlog}
          </Link>
          {post.pillar && (
            <div className="mt-6">
              <span className="px-2 py-0.5 rounded-pill border border-brand-aqua/40 bg-brand-aqua/10 text-brand-aqua font-medium text-xs">
                {t.pillarLabel}
              </span>
            </div>
          )}
          <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {tl(post.hero.kicker, lc)}
          </p>
          <h1 className="mt-3 font-display text-display-xl font-semibold tracking-tightest text-text-primary leading-[1.1]">
            {tl(post.hero.title, lc)}
          </h1>
          <p className="mt-5 text-lg text-text-secondary leading-relaxed">
            {tl(post.hero.subtitle, lc)}
          </p>
          <ArticleMeta
            shareLabel={t.metaShare}
            copiedLabel={t.metaCopied}
            items={[
              {
                icon: "category",
                label: t.metaCategory,
                value: categoryLabel(post.category, lc),
              },
              {
                icon: "date",
                label: t.metaDate,
                value: formatDate(post.publishedAt, lc),
              },
              {
                icon: "clock",
                label: t.metaReadTime,
                value: t.readMin(post.readMinutes),
              },
            ]}
          />
        </header>

        {/* TL;DR — il succo in 10 secondi, stile Claude. Solo se presente. */}
        {post.tldr && tll(post.tldr, lc).length > 0 && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="rounded-card border border-brand-aqua/30 bg-gradient-to-br from-brand-aqua/[0.07] to-bg-card p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
                {t.tldrLabel}
              </p>
              <ul className="mt-3 space-y-2">
                {tll(post.tldr, lc).map((point, i) => (
                  <li key={i} className="flex gap-2.5 text-text-secondary leading-relaxed">
                    <span aria-hidden className="text-brand-aqua mt-1.5 flex-none">
                      <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden>
                        <circle cx="3" cy="3" r="3" fill="currentColor" />
                      </svg>
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* BODY */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <BlogRenderer sections={post.body} locale={lc} />
        </div>

        {/* FAQ */}
        {post.faq && post.faq.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 pb-12">
            <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
              {t.faqHeading}
            </h2>
            <div className="mt-6 space-y-4">
              {post.faq.map((f, i) => (
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

        {/* DISCLAIMER brand */}
        {post.brandsMentioned && post.brandsMentioned.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
            <div className="rounded-card border border-divider bg-bg-card/40 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold">
                {t.disclaimerHeading}
              </p>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                {t.disclaimer(post.brandsMentioned)}
              </p>
            </div>
          </section>
        )}

        {/* MEDICAL DISCLAIMER (YMYL). Sempre visibile, anche se l'articolo non
           menziona brand. Richiesto da E-E-A-T Google su topic salute. */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
          <div className="rounded-card border border-warning/30 bg-warning/[0.04] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-warning font-semibold flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
                <path d="M12 2L2 22h20L12 2z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <circle cx="12" cy="17" r="1" />
              </svg>
              {t.medicalDisclaimerHeading}
            </p>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              {t.medicalDisclaimer}
            </p>
          </div>
        </section>

        {/* AUTHOR BIO CARD — E-E-A-T (YMYL salute). Aiuta Google e i lettori
           a capire chi scrive: nome, ruolo, link About. */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-8">
          <div className="rounded-card border border-divider bg-bg-card/40 p-5 sm:p-6 flex gap-4 items-start">
            <div className="shrink-0 w-12 h-12 rounded-full bg-brand-aqua/15 border border-brand-aqua/30 flex items-center justify-center text-brand-aqua font-display font-bold text-lg">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold">
                {lc === "it" ? "Scritto da" : lc === "es" ? "Escrito por" : "Written by"}
              </p>
              <p className="mt-1 font-display font-bold text-text-primary">
                {AUTHOR.name}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">{AUTHOR.jobTitle}</p>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                {lc === "it" ? AUTHOR.bioIt : lc === "es" ? AUTHOR.bioEs : AUTHOR.bioEn}
              </p>
              <Link
                href={`/${lc}/about`}
                className="mt-3 inline-flex items-center gap-1 text-xs text-brand-aqua hover:text-brand-green transition font-medium"
              >
                {lc === "it"
                  ? "Di più sul progetto"
                  : lc === "es"
                    ? "Más sobre el proyecto"
                    : "More about the project"}{" "}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
            <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
              {t.relatedHeading}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((r) => (
                <Link
                  key={r.slug}
                  href={`/${lc}/blog/${r.slug}`}
                  className="card p-5 group hover:-translate-y-0.5 transition-transform"
                >
                  <p className="text-xs text-brand-aqua font-medium">
                    {categoryLabel(r.category, lc)}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-text-primary group-hover:text-brand-aqua transition leading-snug">
                    {tl(r.hero.title, lc)}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {tl(r.hero.subtitle, lc)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
