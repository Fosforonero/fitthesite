import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { listPosts } from "@/lib/blog/loader";
import { locales, type Locale } from "@/lib/i18n";

const SITE_URL = "https://www.fitmesh.fit";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const titles: Record<Locale, string> = {
    it: "Blog FitMesh Sync — guide, divulgazione e tecnica",
    en: "FitMesh Sync Blog — guides, deep dives and technical posts",
  };
  const desc: Record<Locale, string> = {
    it: "Articoli tecnico-divulgativi su salute digitale, smartwatch, sincronizzazione dati e privacy. Pubblicati dal team FitMesh.",
    en: "Technical and educational posts on digital health, smartwatches, data sync and privacy. Published by the FitMesh team.",
  };
  return {
    title: titles[lc],
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/blog`,
      languages: {
        it: `${SITE_URL}/it/blog`,
        en: `${SITE_URL}/en/blog`,
        "x-default": `${SITE_URL}/it/blog`,
      },
    },
    openGraph: {
      title: titles[lc],
      description: desc[lc],
      url: `${SITE_URL}/${lc}/blog`,
      type: "website",
    },
  };
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const posts = await listPosts(lc);

  const heading = lc === "it" ? "Blog" : "Blog";
  const sub = lc === "it"
    ? "Articoli tecnico-divulgativi su salute digitale, smartwatch e privacy."
    : "Technical and educational posts on digital health, smartwatches and privacy.";
  const emptyMsg = lc === "it"
    ? "Ancora niente articoli in questa lingua. Torna presto."
    : "No posts in this language yet. Come back soon.";
  const minutesLabel = lc === "it" ? "min di lettura" : "min read";

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumbs locale={lc} items={[{ name: heading, path: `/${lc}/blog` }]} />

      <header className="mt-8 mb-12">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {heading}
        </p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {heading}
        </h1>
        <p className="mt-3 text-text-secondary">{sub}</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-text-muted">{emptyMsg}</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((p) => (
            <li
              key={p.slug}
              className="rounded-2xl border border-divider bg-bg-card/40 p-6 hover:border-accent/30 transition"
            >
              <Link href={`/${lc}/blog/${p.slug}`} className="block">
                <p className="text-xs text-text-muted flex items-center gap-3">
                  <time dateTime={p.date}>
                    {new Date(p.date).toLocaleDateString(lc === "it" ? "it-IT" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span aria-hidden>·</span>
                  <span>{p.readingMinutes} {minutesLabel}</span>
                </p>
                <h2 className="mt-2 font-display text-xl sm:text-2xl font-semibold text-text-primary hover:text-accent transition leading-snug">
                  {p.title}
                </h2>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {p.description}
                </p>
                {p.tags && p.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex px-2 py-0.5 rounded-pill border border-divider text-[10px] text-text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
