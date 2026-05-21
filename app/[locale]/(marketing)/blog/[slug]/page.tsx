import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { BlogRenderer } from "@/components/blog/BlogRenderer";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import {
  BLOG_POSTS,
  BLOG_POSTS_BY_SLUG,
  categoryLabel,
  relatedPosts,
} from "@/lib/blog/data";

const SITE_URL = "https://www.fitmesh.fit";
const AUTHOR_NAME = "FitMesh Sync";

export function generateStaticParams() {
  return BLOG_POSTS.flatMap((p) =>
    locales.map((locale) => ({ locale, slug: p.slug })),
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
  const post = BLOG_POSTS_BY_SLUG[slug];
  if (!post) return {};

  const path = `/${lc}/blog/${post.slug}`;
  const title = post.hero.title[lc];
  const description = post.metaDescription[lc];
  const keywords = [
    post.primaryKeyword[lc],
    ...post.secondaryKeywords[lc],
  ].join(", ");

  return {
    title: `${title} — FitMesh Blog`,
    description,
    keywords,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/blog/${post.slug}`,
        en: `${SITE_URL}/en/blog/${post.slug}`,
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
      authors: [AUTHOR_NAME],
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
    faqHeading: "Domande frequenti",
    relatedHeading: "Continua a leggere",
    disclaimerHeading: "Disclaimer",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync è un prodotto indipendente. ${brands.join(", ")}${brands.length > 1 ? " sono marchi" : " è un marchio"} dei rispettivi proprietari. Questo articolo non implica affiliazione né sponsorizzazione.`,
  },
  en: {
    backToBlog: "← All articles",
    pillarLabel: "Pillar",
    readMin: (m: number) => `${m} min read`,
    publishedOn: "Published",
    updated: "Updated",
    faqHeading: "Frequently asked questions",
    relatedHeading: "Keep reading",
    disclaimerHeading: "Disclaimer",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync is an independent product. ${brands.join(", ")} ${brands.length > 1 ? "are trademarks" : "is a trademark"} of their respective owners. This article implies no affiliation or sponsorship.`,
  },
} as const;

function formatDate(iso: string, lc: Locale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(lc === "it" ? "it-IT" : "en-US", {
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
  const post = BLOG_POSTS_BY_SLUG[slug];
  if (!post) notFound();
  const t = I18N[lc];

  const path = `/${lc}/blog/${post.slug}`;
  const ldType = post.ldType ?? "BlogPosting";

  // JSON-LD Article/BlogPosting
  const articleLd = {
    "@context": "https://schema.org",
    "@type": ldType,
    "@id": `${SITE_URL}${path}#article`,
    headline: post.hero.title[lc],
    description: post.metaDescription[lc],
    inLanguage: lc === "it" ? "it-IT" : "en-US",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    url: `${SITE_URL}${path}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${path}` },
    author: {
      "@type": "Organization",
      name: AUTHOR_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: AUTHOR_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-square.png`,
      },
    },
    keywords: [post.primaryKeyword[lc], ...post.secondaryKeywords[lc]].join(", "),
    articleSection: categoryLabel(post.category, lc),
  };

  const faqLd =
    post.faq && post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((f) => ({
            "@type": "Question",
            name: f.q[lc],
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a[lc],
            },
          })),
        }
      : null;

  const related = relatedPosts(post.related);

  return (
    <>
      <JsonLd data={articleLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <Breadcrumbs
        items={[
          { name: "Blog", path: `/${lc}/blog` },
          { name: post.hero.title[lc], path },
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
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            {post.pillar && (
              <span className="px-2 py-0.5 rounded-pill border border-brand-aqua/40 bg-brand-aqua/10 text-brand-aqua font-medium">
                {t.pillarLabel}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-pill border border-divider bg-bg-secondary/40 text-text-secondary">
              {categoryLabel(post.category, lc)}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">{t.readMin(post.readMinutes)}</span>
          </div>
          <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {post.hero.kicker[lc]}
          </p>
          <h1 className="mt-3 font-display text-display-xl font-semibold tracking-tightest text-text-primary leading-[1.1]">
            {post.hero.title[lc]}
          </h1>
          <p className="mt-5 text-lg text-text-secondary leading-relaxed">
            {post.hero.subtitle[lc]}
          </p>
          <p className="mt-6 text-xs text-text-muted">
            {t.publishedOn} {formatDate(post.publishedAt, lc)}
            {post.updatedAt !== post.publishedAt && (
              <>
                {" · "}
                {t.updated} {formatDate(post.updatedAt, lc)}
              </>
            )}
          </p>
        </header>

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
                    <span>{f.q[lc]}</span>
                    <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                    {f.a[lc]}
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
                    {r.hero.title[lc]}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {r.hero.subtitle[lc]}
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
