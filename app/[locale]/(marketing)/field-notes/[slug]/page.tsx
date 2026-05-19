import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPost, listAllSlugs } from "@/lib/blog/loader";
import { locales, type Locale } from "@/lib/i18n";

const SITE_URL = "https://www.fitmesh.fit";

export async function generateStaticParams() {
  const all = await listAllSlugs();
  return all.map((p) => ({ locale: p.locale, slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> },
): Promise<Metadata> {
  const { locale, slug } = await params;
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const post = await getPost(slug, lc);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `${SITE_URL}/${lc}/field-notes/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      url: `${SITE_URL}/${lc}/field-notes/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

const MDX_COMPONENTS = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      {...props}
      className="mt-14 mb-5 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary leading-snug scroll-mt-24"
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      {...props}
      className="mt-10 mb-3 font-display text-xl sm:text-2xl font-semibold text-text-primary leading-snug scroll-mt-24"
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} className="my-5 text-text-secondary leading-[1.75] text-[17px]" />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="my-5 ml-6 space-y-2.5 text-text-secondary leading-[1.7] list-disc text-[17px] marker:text-accent/60" />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="my-5 ml-6 space-y-2.5 text-text-secondary leading-[1.7] list-decimal text-[17px] marker:text-accent" />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li {...props} className="pl-1" />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      className="text-accent hover:text-brand-aqua underline underline-offset-4 decoration-accent/40 hover:decoration-brand-aqua transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong {...props} className="font-semibold text-text-primary" />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      {...props}
      className="px-1.5 py-0.5 rounded-md bg-bg-secondary/60 text-brand-aqua text-[0.9em] font-mono"
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      {...props}
      className="my-6 p-5 rounded-2xl bg-bg-secondary/60 border border-divider text-sm text-text-primary overflow-x-auto leading-relaxed"
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      {...props}
      className="my-7 pl-6 border-l-2 border-accent/40 text-text-secondary italic text-[17px] leading-relaxed"
    />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-7 overflow-x-auto rounded-2xl border border-divider">
      <table {...props} className="w-full text-sm" />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead {...props} className="bg-bg-secondary/60 text-text-muted text-[11px] uppercase tracking-[0.12em]" />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th {...props} className="text-left px-4 py-3 font-medium" />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td {...props} className="px-4 py-3 align-top text-text-secondary border-t border-divider" />
  ),
  hr: () => <hr className="my-12 border-divider/60" />,
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const post = await getPost(slug, lc);
  if (!post) notFound();

  const minutesLabel = lc === "it" ? "min di lettura" : "min read";
  const backLabel = lc === "it" ? "Torna a Field Notes" : "Back to Field Notes";
  const ctaTitle = lc === "it" ? "Vuoi provare FitMesh Sync?" : "Want to try FitMesh Sync?";
  const ctaBody = lc === "it"
    ? "100 founder ricevono l'app gratis a vita. Beta privata aperta ora."
    : "100 founders get the app free for life. Private beta open now.";
  const ctaCta = lc === "it" ? "Entra in beta" : "Join the beta";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: lc === "it" ? "it-IT" : "en-US",
    author: post.author
      ? { "@type": "Person", name: post.author }
      : { "@type": "Organization", name: "FitMesh Sync", url: SITE_URL },
    publisher: { "@id": `${SITE_URL}#organization` },
    mainEntityOfPage: `${SITE_URL}/${lc}/field-notes/${slug}`,
  };

  return (
    <article className="relative overflow-hidden">
      <JsonLd data={jsonLd} />

      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-0 w-[500px] h-[500px] rounded-full bg-brand-aqua/8 blur-[120px]" />
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-32">
        <Breadcrumbs
          locale={lc}
          items={[
            { name: "Field Notes", path: `/${lc}/field-notes` },
            { name: post.title, path: `/${lc}/field-notes/${slug}` },
          ]}
        />

        <header className="mt-12 mb-12 sm:mb-16">
          <div className="flex items-center gap-3 text-xs text-text-muted tabular-nums">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString(lc === "it" ? "it-IT" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden className="text-text-muted/40">·</span>
            <span>{post.readingMinutes} {minutesLabel}</span>
            {post.author && (
              <>
                <span aria-hidden className="text-text-muted/40">·</span>
                <span>{post.author}</span>
              </>
            )}
          </div>
          <h1 className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tighter text-text-primary leading-[1.1]">
            {post.title}
          </h1>
          <p className="mt-5 text-lg text-text-secondary leading-relaxed">
            {post.description}
          </p>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex px-2.5 py-0.5 rounded-full border border-divider text-[11px] text-text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </header>

        <hr className="my-8 sm:my-10 border-divider/60" />

        {/* Content — generous reading rhythm. First-letter dropcap su primo paragrafo via class CSS injection. */}
        <div className="fitmesh-prose">
          <style>{`
            .fitmesh-prose > p:first-of-type::first-letter {
              float: left;
              font-family: var(--font-grotesk), Georgia, serif;
              font-size: 3.5em;
              line-height: 0.9;
              padding: 0.1em 0.1em 0 0;
              color: var(--accent, #21e6c1);
              font-weight: 600;
            }
            @media (max-width: 640px) {
              .fitmesh-prose > p:first-of-type::first-letter {
                font-size: 2.8em;
              }
            }
          `}</style>
          <MDXRemote source={post.content} components={MDX_COMPONENTS} />
        </div>

        {/* CTA finale */}
        <section className="mt-20">
          <div className="relative rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/12 via-bg-card to-bg-secondary p-8 sm:p-10 overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl"
            />
            <div className="relative">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
                {ctaTitle}
              </h2>
              <p className="mt-3 text-text-secondary leading-relaxed text-base sm:text-lg">{ctaBody}</p>
              <Link
                href={`/${lc}/beta`}
                className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-full btn-cta text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card transition"
              >
                {ctaCta}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        <nav className="mt-16">
          <Link
            href={`/${lc}/field-notes`}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            <span aria-hidden>←</span>
            {backLabel}
          </Link>
        </nav>
      </div>
    </article>
  );
}
