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
      canonical: `${SITE_URL}/${lc}/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      url: `${SITE_URL}/${lc}/blog/${slug}`,
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
      className="mt-10 mb-4 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary"
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      {...props}
      className="mt-8 mb-3 font-display text-xl font-semibold text-text-primary"
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} className="my-4 text-text-secondary leading-relaxed" />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="my-4 ml-6 space-y-2 text-text-secondary list-disc" />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="my-4 ml-6 space-y-2 text-text-secondary list-decimal" />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li {...props} className="leading-relaxed" />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      className="text-accent hover:text-brand-aqua underline underline-offset-4"
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      {...props}
      className="px-1.5 py-0.5 rounded bg-bg-secondary/60 text-brand-aqua text-[0.9em]"
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      {...props}
      className="my-5 p-4 rounded-xl bg-bg-secondary/60 border border-divider text-sm text-text-primary overflow-x-auto"
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      {...props}
      className="my-5 pl-5 border-l-2 border-accent/40 text-text-secondary italic"
    />
  ),
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
  const backLabel = lc === "it" ? "← Torna al blog" : "← Back to blog";
  const ctaTitle = lc === "it" ? "Vuoi provare FitMesh Sync?" : "Want to try FitMesh Sync?";
  const ctaBody = lc === "it"
    ? "100 founder ricevono l'app gratis a vita — beta privata aperta ora."
    : "100 founders get the app free for life — private beta open now.";
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
    mainEntityOfPage: `${SITE_URL}/${lc}/blog/${slug}`,
  };

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        locale={lc}
        items={[
          { name: "Blog", path: `/${lc}/blog` },
          { name: post.title, path: `/${lc}/blog/${slug}` },
        ]}
      />

      <header className="mt-8 mb-10">
        <p className="text-xs text-text-muted flex items-center gap-3">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString(lc === "it" ? "it-IT" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} {minutesLabel}</span>
          {post.author && (
            <>
              <span aria-hidden>·</span>
              <span>{post.author}</span>
            </>
          )}
        </p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-text-primary leading-[1.1]">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-text-secondary leading-relaxed">
          {post.description}
        </p>
      </header>

      <div className="prose-fitmesh">
        <MDXRemote source={post.content} components={MDX_COMPONENTS} />
      </div>

      {/* CTA box finale */}
      <section className="mt-16">
        <div className="rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-bg-card to-bg-secondary p-8">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            {ctaTitle}
          </h2>
          <p className="mt-2 text-text-secondary">{ctaBody}</p>
          <Link
            href={`/${lc}/beta`}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-pill btn-cta text-sm font-semibold"
          >
            {ctaCta}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <div className="mt-12">
        <Link
          href={`/${lc}/blog`}
          className="text-text-secondary hover:text-text-primary text-sm transition"
        >
          {backLabel}
        </Link>
      </div>
    </article>
  );
}
