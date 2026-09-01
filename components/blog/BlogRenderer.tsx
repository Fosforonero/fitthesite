import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import type { BlogSection } from "@/lib/blog/types";
import { tl, tll } from "@/lib/blog/types";
import type { Locale } from "@/lib/i18n";
import { CTA_PLACEMENTS, TARGET_TYPES } from "@/lib/analytics/cta";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { localizedBlogSlug, localizedLandingSlug } from "@/lib/blog/slug-i18n";
import { FITNESS_DATA_SYNC_COMPLETE_LOCALES } from "@/lib/content/static-page-locales";
import { blogLinkHrefSync } from "@/lib/blog/indexability";
import { landingLinkHref } from "@/lib/landing/indexability";
import { LANDING_PAGES_BY_SLUG } from "@/lib/landing/data";
import { providerLinkHref, providerModelLinkHref } from "@/lib/providers/indexability";
import { resolveLabsLocale } from "@/lib/labs/locale-redirect";
import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { PROVIDER_MODELS } from "@/lib/providers/models";

/**
 * Riscrive un href interno alla lingua corrente: normalizza il prefisso `/xx/`
 * e, per i link `/blog/<slug>` e `/lp/<slug>`, mappa lo slug canonico a quello
 * localizzato (i contenuti sono scritti con lo slug canonico IT). Evita il salto
 * via redirect 308 e mantiene i link coerenti per lingua. Link esterni invariati.
 *
 * Sprint P0.13: il fallback generico (ultima riga) fa uno swap cieco del
 * prefisso locale — corretto per route che esistono in TUTTE le locale (es.
 * `/beta`), ma produceva un 404 per `/fitness-data-sync`, che esiste SOLO in
 * FITNESS_DATA_SYNC_COMPLETE_LOCALES (it/en/de/es). Caso esplicito: fuori da
 * quel set, fallback su EN (sempre presente), stessa regola di
 * `blogLinkHref`/`providerLinkHref` altrove in questo sprint.
 *
 * MICRO-GATE P0.13A: i casi `/blog/<slug>` e `/lp/<slug>` sopra facevano lo
 * STESSO swap cieco (solo slug, mai indicizzabilità) — un crawl esaustivo ha
 * trovato centinaia di anchor in-content verso varianti noindex/redirect.
 * Ora usano `blogLinkHrefSync`/`landingLinkHref` (stessa SSOT del resto di
 * P0.13, variante sincrona per lo `/blog`: vedi commento su
 * `blogLinkHrefSync`). Ritorna `null` SOLO quando lo slug è noto e la
 * variante non è indicizzabile in nessuna locale (nemmeno EN, quasi mai) —
 * il chiamante deve rendere testo non cliccabile, mai un link a noindex.
 * Se lo slug non è verificabile qui (post CMS-only, `undefined`), ricade sul
 * comportamento precedente invece di nascondere un link legittimo.
 */
export function localizeInternalHref(href: string, locale: Locale): string | null {
  if (!href.startsWith("/")) return href;
  // MICRO-GATE P0.13A: prefisso locale OPZIONALE in tutti i pattern sotto
  // (`(?:[a-z]{2}\/)?`) — trovato dal crawl esaustivo del contenuto
  // in-content scritto SENZA alcun prefisso (es. "/blog/da-android-a-iphone-dati-fitness",
  // non "/it/blog/..."): il middleware lo intercetta e ridirige (308) verso
  // la locale rilevata. Prima la regex richiedeva sempre un prefisso di 2
  // lettere, quindi questi casi cadevano nel fallback generico in fondo,
  // che non matcha un href senza prefisso e lo ritorna invariato.
  const m = href.match(/^\/(?:[a-z]{2}\/)?(blog|lp)\/([^/?#]+)(.*)$/);
  if (m) {
    const [, kind, slug, rest] = m;
    if (kind === "blog") {
      const resolved = blogLinkHrefSync(slug, locale);
      if (resolved !== undefined) return resolved ? `${resolved}${rest}` : null;
      return `/${locale}/blog/${localizedBlogSlug(slug, locale)}${rest}`;
    }
    const lp = LANDING_PAGES_BY_SLUG[slug];
    if (lp) {
      const resolved = landingLinkHref(lp, locale);
      return resolved ? `${resolved}${rest}` : null;
    }
    return `/${locale}/lp/${localizedLandingSlug(slug, locale)}${rest}`;
  }
  const fds = href.match(/^\/(?:[a-z]{2}\/)?fitness-data-sync(.*)$/);
  if (fds) {
    const [, rest] = fds;
    const target = FITNESS_DATA_SYNC_COMPLETE_LOCALES.includes(locale) ? locale : "en";
    return `/${target}/fitness-data-sync${rest}`;
  }
  // MICRO-GATE P0.13A: /labs esiste solo it/en (resolveLabsLocale) — il
  // fallback generico in fondo riscriveva SEMPRE il prefisso sulla locale
  // corrente anche quando il content author aveva già dichiarato
  // esplicitamente "en" per una locale senza Labs (es. ctaHref.de =
  // "/en/labs/..."), producendo "/de/labs/..." che poi ridirige 307 a
  // singolo hop verso /en/labs/... — innocuo ma un redirect evitabile.
  const labs = href.match(/^\/(?:[a-z]{2}\/)?labs(\/.*)?$/);
  if (labs) {
    const [, rest] = labs;
    return `/${resolveLabsLocale(locale)}/labs${rest ?? ""}`;
  }
  // MICRO-GATE P0.13A: /delete-account vive FUORI da [locale]
  // (app/(frontend)/delete-account/page.tsx, pagina unica senza varianti
  // per lingua) — il contenuto la referenziava come "/it/delete-account" /
  // "/en/delete-account" (404 reale, trovato dal crawl esaustivo). Nessun
  // prefisso locale è mai corretto per questa route.
  if (/^\/(?:[a-z]{2}\/)?delete-account(\/.*)?$/.test(href)) {
    return href.replace(/^\/[a-z]{2}\//, "/");
  }
  // MICRO-GATE P0.13A: stesso swap cieco per /sync/<provider>[/<model>] —
  // trovato dal crawl esaustivo su landing page in-content (es.
  // /ko/lp/oura-ring-dongkihwa -> /ko/sync/oura, noindex in coreano).
  // Slug provider/modello NON localizzati (invariati per locale, a
  // differenza di blog/lp): solo indicizzabilità da verificare.
  //
  // Regex su QUALSIASI prefisso di 2 lettere (non solo it/en/es/de/pt/fr):
  // `ctaHref` è un oggetto per-locale (`Record<Locale, string>`, vedi case
  // "cta" sotto) — per le locale non-required il valore può arrivare qui
  // GIÀ con il proprio prefisso (es. "/ko/sync/oura" quando locale="ko"),
  // non necessariamente con un prefisso IT/EN-canonico da swap. La prima
  // versione di questo fix restava sul vecchio pattern ristretto e non
  // matchava mai per le locale extra-6, trovato dal secondo giro di crawl.
  const sync = href.match(/^\/(?:[a-z]{2}\/)?sync\/([^/?#]+)(?:\/([^/?#]+))?(.*)$/);
  if (sync) {
    const [, providerSlug, modelSlug, rest] = sync;
    const provider = PROVIDERS_BY_SLUG[providerSlug];
    if (provider) {
      if (modelSlug) {
        const model = (PROVIDER_MODELS[providerSlug] ?? []).find((mm) => mm.slug === modelSlug);
        if (model) {
          const resolved = providerModelLinkHref(provider, model, locale);
          return resolved ? `${resolved}${rest}` : null;
        }
      } else {
        const resolved = providerLinkHref(provider, locale);
        return resolved ? `${resolved}${rest}` : null;
      }
    }
    // MICRO-GATE P0.13A: a differenza del blog (CMS async, "non trovato qui"
    // può solo significare "non verificabile senza await"), PROVIDERS_BY_SLUG
    // è un registro statico e completo — uno slug assente qui non esiste
    // DAVVERO da nessuna parte. Trovato dal crawl esaustivo:
    // "/sync/health-connect" non è mai stato un provider (è un valore del
    // campo syncMechanism, non un'entità) — 3 landing page lo linkavano
    // incondizionatamente, 404 reale anche su main. Testo non cliccabile
    // invece di preservare un link morto.
    return null;
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
export function renderMarkdownInline(text: string, locale: Locale): ReactNode[] {
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
        const resolvedHref = localizeInternalHref(rawHref, locale);
        // MICRO-GATE P0.13A: null = variante non indicizzabile in nessuna
        // locale (nemmeno EN) — mai un link a noindex, testo non cliccabile
        // preserva il contenuto editoriale senza spingere il crawler lì.
        if (resolvedHref === null) {
          return <Fragment key={i}>{label}</Fragment>;
        }
        return (
          <Link
            key={i}
            href={resolvedHref}
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
            const isInternal = href !== null && href.startsWith("/");
            return (
              <aside
                key={i}
                data-cta-id={s.ctaId}
                data-cta-placement={s.ctaPlacement}
                className="my-10 rounded-card border border-divider bg-gradient-to-br from-brand-aqua/10 to-brand-green/5 p-6 sm:p-8"
              >
                <h4 className="font-display text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
                  {tl(s.title, locale)}
                </h4>
                <p className="mt-3 text-text-secondary leading-relaxed">
                  {renderMarkdownInline(tl(s.body, locale), locale)}
                </p>
                {/* MICRO-GATE P0.13A: href null = target /blog o /lp non
                    indicizzabile in nessuna locale (nemmeno EN) — bottone
                    nascosto, titolo/corpo del CTA restano (mai un bottone
                    che punti a noindex). */}
                {href !== null && (
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
                )}
              </aside>
            );
          }

          case "fitmesh-editorial-cta": {
            // P1.9 FASE 3. Stesso pattern di localizzazione href del blocco
            // "cta" sopra (fallback diretto su `it`, non su `tl()`, per non
            // rischiare un href EN quando la locale corrente manca il campo).
            const rawSecondaryHref = s.secondaryHref
              ? ((s.secondaryHref as Record<string, string | undefined>)[locale] ?? s.secondaryHref.it)
              : undefined;
            const secondaryHref = rawSecondaryHref ? localizeInternalHref(rawSecondaryHref, locale) : undefined;
            const benefits = s.benefits ? tll(s.benefits, locale) : [];
            const ctaPlacementValue =
              s.placement === "after_solution"
                ? CTA_PLACEMENTS.blogEditorialAfterSolution
                : CTA_PLACEMENTS.blogEditorialArticleEnd;
            return (
              <aside
                key={i}
                data-cta-content-cluster={s.contentCluster}
                data-cta-placement={ctaPlacementValue}
                className="my-10 rounded-card border border-divider bg-gradient-to-br from-brand-aqua/10 to-brand-green/5 p-6 sm:p-8"
              >
                <h4 className="font-display text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
                  {tl(s.title, locale)}
                </h4>
                <p className="mt-3 text-text-secondary leading-relaxed">
                  {renderMarkdownInline(tl(s.body, locale), locale)}
                </p>
                {benefits.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {benefits.slice(0, 3).map((b, bi) => (
                      <li key={bi} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span aria-hidden="true" className="mt-0.5 text-brand-green">
                          ✓
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <StoreButtonsRow locale={locale} ctaLocation={ctaPlacementValue} />
                  {secondaryHref !== null && secondaryHref !== undefined && s.secondaryLabel && (
                    <Link
                      href={secondaryHref}
                      data-cta-id={`${ctaPlacementValue}__secondary__${s.contentCluster}`}
                      data-cta-target-type={TARGET_TYPES.internalLanding}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-aqua hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua rounded-sm"
                    >
                      {tl(s.secondaryLabel, locale)}
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              </aside>
            );
          }

          case "flow-diagram":
            return (
              <figure key={i} className="my-8">
                {s.title && (
                  <figcaption className="mb-4 text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold">
                    {tl(s.title, locale)}
                  </figcaption>
                )}
                <div className="space-y-3">
                  {s.flows.map((flow, fi) => {
                    const steps = tll(flow.steps, locale);
                    return (
                      <ol
                        key={fi}
                        className="flex flex-wrap items-center gap-2 text-sm"
                      >
                        {steps.map((step, si) => (
                          <li key={si} className="flex items-center gap-2">
                            <span className="rounded-pill border border-divider bg-bg-card/60 px-3 py-1.5 text-text-secondary leading-tight">
                              {step}
                            </span>
                            {si < steps.length - 1 && (
                              <svg
                                aria-hidden
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                className="flex-none text-brand-aqua"
                              >
                                <path
                                  d="M2 8h10M8 3l5 5-5 5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </li>
                        ))}
                      </ol>
                    );
                  })}
                </div>
              </figure>
            );

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
