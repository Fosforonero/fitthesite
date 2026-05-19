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

  const heading = "Blog";
  const kicker = lc === "it" ? "Pensieri & guide" : "Thoughts & guides";
  const sub = lc === "it"
    ? "Articoli tecnico-divulgativi su salute digitale, smartwatch e privacy."
    : "Technical and educational posts on digital health, smartwatches and privacy.";
  const emptyMsg = lc === "it"
    ? "Ancora niente articoli in questa lingua. Torna presto."
    : "No posts in this language yet. Come back soon.";
  const minutesLabel = lc === "it" ? "min di lettura" : "min read";

  return (
    <article className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-40 w-[500px] h-[500px] rounded-full bg-brand-aqua/8 blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-32">
        <Breadcrumbs locale={lc} items={[{ name: heading, path: `/${lc}/blog` }]} />

        <header className="mt-12 sm:mt-16 mb-20 max-w-3xl">
          <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-divider bg-bg-secondary/40 text-[11px] uppercase tracking-[0.18em] text-brand-aqua font-semibold">
            <span aria-hidden className="w-1 h-1 rounded-full bg-brand-aqua" />
            {kicker}
          </p>
          <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tighter text-text-primary leading-[1.05]">
            {heading}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-text-secondary leading-relaxed max-w-2xl">
            {sub}
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-text-muted text-lg">{emptyMsg}</p>
        ) : (
          <ul className="space-y-5 sm:space-y-6">
            {posts.map((p, idx) => (
              <li key={p.slug}>
                <Link
                  href={`/${lc}/blog/${p.slug}`}
                  className="group block rounded-3xl border border-divider bg-bg-card/40 backdrop-blur-sm p-7 sm:p-9 transition-all duration-300 hover:border-accent/40 hover:bg-bg-card/60 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  <div className="flex items-center gap-3 text-xs text-text-muted tabular-nums">
                    <time dateTime={p.date}>
                      {new Date(p.date).toLocaleDateString(lc === "it" ? "it-IT" : "en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <span aria-hidden className="text-text-muted/40">·</span>
                    <span>{p.readingMinutes} {minutesLabel}</span>
                    {idx === 0 && (
                      <>
                        <span aria-hidden className="text-text-muted/40">·</span>
                        <span className="inline-flex items-center gap-1.5 text-accent">
                          <span aria-hidden className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                          {lc === "it" ? "Nuovo" : "New"}
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="mt-4 font-display text-2xl sm:text-3xl font-semibold text-text-primary group-hover:text-accent transition-colors leading-tight tracking-tight">
                    {p.title}
                  </h2>
                  <p className="mt-3 text-[15px] sm:text-base text-text-secondary leading-relaxed max-w-2xl">
                    {p.description}
                  </p>
                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex px-2.5 py-0.5 rounded-full border border-divider text-[11px] text-text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {lc === "it" ? "Leggi" : "Read"}
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
