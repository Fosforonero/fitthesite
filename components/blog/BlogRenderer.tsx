import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import type { BlogSection } from "@/lib/blog/types";
import { tl, tll } from "@/lib/blog/types";
import type { Locale } from "@/lib/i18n";
import { localizedBlogSlug, localizedLandingSlug } from "@/lib/blog/slug-i18n";

/**
 * Riscrive un href interno alla lingua corrente: normalizza il prefisso `/xx/`
 * e, per i link `/blog/<slug>` e `/lp/<slug>`, mappa lo slug canonico a quello
 * localizzato (i contenuti sono scritti con lo slug canonico IT). Evita il salto
 * via redirect 308 e mantiene i link coerenti per lingua. Link esterni invariati.
 */
function localizeInternalHref(href: string, locale: Locale): string {
  if (!href.startsWith("/")) return href;
  const m = href.match(/^\/(?:it|en|es|de|pt|fr)\/(blog|lp)\/([^/?#]+)(.*)$/);
  if (m) {
    const [, kind, slug, rest] = m;
    const localized =
      kind === "blog"
        ? localizedBlogSlug(slug, locale)
        : localizedLandingSlug(slug, locale);
    return `/${locale}/${kind}/${localized}${rest}`;
  }
  return href.replace(/^\/(it|en|es|de|pt|fr)(?=\/|$)/, `/${locale}`);
}

/**
 * Renderer pattern-matching esaustivo su `BlogSection`. Mai estendere senza
 * aggiungere il nuovo variant qui sotto, altrimenti TS si lamenta del `never`.
 *
 * Supportato in stringhe: solo light-markdown controllato (bold e link inline)
 * via renderMarkdownInline. NO HTML raw, NO innerHTML — solo React nodes.
 */

/**
 * Render `**bold**` e `[label](href)` light-markdown safe.
 * Pattern derivato da `sync/[provider]/page.tsx` esteso con link inline.
 * Link relativi vengono renderizzati con Next.js Link, link esterni come anchor.
 */
function renderMarkdownInline(text: string, locale: Locale): ReactNode[] {
  // Pattern combinato: cattura **bold** OPPURE [label](href)
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-text-primary font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, rawHref] = linkMatch;
      const isInternal = rawHref.startsWith("/");
      if (isInternal) {
        return (
          <Link
            key={i}
            href={localizeInternalHref(rawHref, locale)}
            className="text-brand-aqua hover:text-brand-green underline-offset-2 hover:underline transition"
          >
            {label}
          </Link>
        );
      }
      return (
        <a
          key={i}
          href={rawHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-aqua hover:text-brand-green underline-offset-2 hover:underline transition"
        >
          {label}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function CalloutBox({
  variant,
  title,
  body,
  locale,
}: {
  variant: "info" | "warning" | "tip";
  title?: string;
  body: string;
  locale: Locale;
}) {
  const palette: Record<typeof variant, { border: string; bg: string; accent: string; label: string }> = {
    info: {
      border: "border-brand-aqua/30",
      bg: "from-brand-aqua/5",
      accent: "text-brand-aqua",
      label: "i",
    },
    warning: {
      border: "border-[#FFB547]/30",
      bg: "from-[#FFB547]/5",
      accent: "text-[#FFB547]",
      label: "!",
    },
    tip: {
      border: "border-brand-green/30",
      bg: "from-brand-green/5",
      accent: "text-brand-green",
      label: "★",
    },
  };
  const p = palette[variant];
  return (
    <aside
      className={`my-8 rounded-card border ${p.border} bg-gradient-to-br ${p.bg} to-bg-card p-5 sm:p-6`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex-none w-7 h-7 rounded-full bg-bg-card/60 ${p.accent} font-bold text-sm flex items-center justify-center`}
          aria-hidden
        >
          {p.label}
        </span>
        <div className="flex-1">
          {title && (
            <p className={`font-display text-base font-semibold ${p.accent} mb-1`}>
              {title}
            </p>
          )}
          <p className="text-sm text-text-secondary leading-relaxed">
            {renderMarkdownInline(body, locale)}
          </p>
        </div>
      </div>
    </aside>
  );
}

export function BlogRenderer({
  sections,
  locale,
}: {
  sections: BlogSection[];
  locale: Locale;
}) {
  return (
    <div className="prose-blog max-w-none">
      {sections.map((s, i) => {
        switch (s.type) {
          case "heading":
            if (s.level === 2) {
              return (
                <h2
                  key={i}
                  className="mt-12 mb-4 font-display text-display font-semibold tracking-tightest text-text-primary scroll-mt-24"
                >
                  {tl(s.text, locale)}
                </h2>
              );
            }
            return (
              <h3
                key={i}
                className="mt-8 mb-3 font-display text-2xl font-semibold tracking-tight text-text-primary scroll-mt-24"
              >
                {tl(s.text, locale)}
              </h3>
            );

          case "paragraph":
            return (
              <p
                key={i}
                className="my-5 text-text-secondary leading-relaxed text-base sm:text-[17px]"
              >
                {renderMarkdownInline(tl(s.text, locale), locale)}
              </p>
            );

          case "list": {
            const items = tll(s.items, locale);
            if (s.ordered) {
              return (
                <ol key={i} className="my-5 space-y-2 list-decimal pl-5 marker:text-brand-aqua">
                  {items.map((it, j) => (
                    <li key={j} className="text-text-secondary leading-relaxed pl-1">
                      {renderMarkdownInline(it, locale)}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <ul key={i} className="my-5 space-y-2.5">
                {items.map((it, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-3 text-text-secondary leading-relaxed"
                  >
                    <span aria-hidden className="text-brand-aqua mt-1.5 flex-none">
                      •
                    </span>
                    <span className="flex-1">{renderMarkdownInline(it, locale)}</span>
                  </li>
                ))}
              </ul>
            );
          }

          case "callout":
            return (
              <CalloutBox
                key={i}
                variant={s.variant}
                title={s.title ? tl(s.title, locale) : undefined}
                body={tl(s.body, locale)}
                locale={locale}
              />
            );

          case "table":
            return (
              <figure key={i} className="my-8 -mx-4 sm:mx-0 overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-divider">
                      {tll(s.headers, locale).map((h, j) => (
                        <th
                          key={j}
                          className="text-left py-3 px-3 sm:px-4 font-semibold text-text-primary text-[13px] uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((row, j) => (
                      <tr
                        key={j}
                        className="border-b border-divider/50 hover:bg-white/[0.02]"
                      >
                        {tll(row, locale).map((cell, k) => (
                          <td
                            key={k}
                            className="py-3 px-3 sm:px-4 text-text-secondary leading-relaxed align-top"
                          >
                            {renderMarkdownInline(cell, locale)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {s.caption && (
                  <figcaption className="mt-3 text-xs text-text-muted px-4 sm:px-0">
                    {tl(s.caption, locale)}
                  </figcaption>
                )}
              </figure>
            );

          case "comparison":
            return (
              <div key={i} className="my-8 grid gap-4 lg:grid-cols-2">
                <div className="rounded-card border border-divider bg-bg-card/60 p-6">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
                    A
                  </p>
                  <h4 className="mt-2 font-display text-lg font-semibold text-text-primary">
                    {tl(s.aTitle, locale)}
                  </h4>
                  <ul className="mt-4 space-y-2 text-sm">
                    {tll(s.aItems, locale).map((it, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-text-secondary leading-relaxed"
                      >
                        <span className="text-brand-aqua mt-0.5">•</span>
                        <span>{renderMarkdownInline(it, locale)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-card border border-divider bg-bg-card/60 p-6">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-brand-green font-semibold">
                    B
                  </p>
                  <h4 className="mt-2 font-display text-lg font-semibold text-text-primary">
                    {tl(s.bTitle, locale)}
                  </h4>
                  <ul className="mt-4 space-y-2 text-sm">
                    {tll(s.bItems, locale).map((it, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-text-secondary leading-relaxed"
                      >
                        <span className="text-brand-green mt-0.5">•</span>
                        <span>{renderMarkdownInline(it, locale)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );

          case "cta": {
            // ctaHref only guarantees it/en. Localizza all'attuale lingua: prefisso
            // /xx/ + slug localizzato per i link /blog e /lp (evita il redirect 308).
            const rawHref = (s.ctaHref as Record<string, string | undefined>)[locale] ?? s.ctaHref.it;
            const href = localizeInternalHref(rawHref, locale);
            const isInternal = href.startsWith("/");
            return (
              <aside
                key={i}
                className="my-10 rounded-card border border-divider bg-gradient-to-br from-brand-aqua/10 to-brand-green/5 p-6 sm:p-8"
              >
                <h4 className="font-display text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
                  {tl(s.title, locale)}
                </h4>
                <p className="mt-3 text-text-secondary leading-relaxed">
                  {renderMarkdownInline(tl(s.body, locale), locale)}
                </p>
                <div className="mt-5">
                  {isInternal ? (
                    <Link
                      href={href}
                      className="inline-flex items-center px-5 py-2.5 rounded-pill btn-cta text-sm font-semibold"
                    >
                      {tl(s.ctaLabel, locale)}
                    </Link>
                  ) : (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-5 py-2.5 rounded-pill btn-cta text-sm font-semibold"
                    >
                      {tl(s.ctaLabel, locale)}
                    </a>
                  )}
                </div>
              </aside>
            );
          }

          case "image": {
            const alt = tl(s.alt, locale);
            const caption = s.caption ? tl(s.caption, locale) : null;
            return (
              <figure key={i} className="my-8">
                {/* eslint-disable-next-line @next/next/no-img-element -- <img> voluto: no next/image per non pagare l'ottimizzazione Vercel (come le cover) */}
                <img
                  src={s.src}
                  alt={alt}
                  width={s.width}
                  height={s.height}
                  loading="lazy"
                  decoding="async"
                  className={`rounded-card border border-divider bg-bg-card ${
                    s.narrow ? "mx-auto block max-w-[360px] w-full" : "w-full"
                  }`}
                />
                {caption && (
                  <figcaption className="mt-2 text-center text-sm text-text-secondary">
                    {renderMarkdownInline(caption, locale)}
                  </figcaption>
                )}
              </figure>
            );
          }

          default: {
            // Exhaustiveness check: TS si lamenta se manca un variant.
            const _exhaustive: never = s;
            return _exhaustive;
          }
        }
      })}
    </div>
  );
}
