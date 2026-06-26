/**
 * Testimonials — sezione social-proof della homepage.
 *
 * GUARD: se `TESTIMONIALS` è vuoto ritorna `null` (sezione nascosta).
 * Popolare `lib/social-proof/data.ts` con citazioni REALI per attivarla.
 * Nessuno schema AggregateRating finché non esistono rating verificabili.
 */
import {
  TESTIMONIALS,
  TESTIMONIALS_COPY,
  PLAY_STORE_URL,
} from "@/lib/social-proof/data";
import { tl } from "@/lib/blog/types";
import type { Locale } from "@/lib/i18n";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < n ? "text-brand-green" : "text-text-muted/40"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function Testimonials({ locale }: { locale: Locale }) {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section
      className="max-w-6xl mx-auto px-4 sm:px-6 mt-28 sm:mt-36"
      data-reveal
      aria-label={tl(TESTIMONIALS_COPY.heading, locale)}
    >
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
          {tl(TESTIMONIALS_COPY.kicker, locale)}
        </p>
        <h2 className="mt-4 font-display text-display font-semibold tracking-tightest text-text-primary max-w-2xl text-balance">
          {tl(TESTIMONIALS_COPY.heading, locale)}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((tItem, i) => (
          <figure
            key={i}
            className="card p-7 flex flex-col"
            data-reveal
            style={{ "--reveal-delay": `${i * 100}ms` } as React.CSSProperties}
          >
            {typeof tItem.rating === "number" && <Stars n={tItem.rating} />}
            <blockquote className="mt-3 text-sm text-text-secondary leading-relaxed flex-1">
              “{tl(tItem.quote, locale)}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-[#050816] shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #21E6C1, #7CFF5B)",
                }}
                aria-hidden
              >
                {tItem.author.trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text-primary truncate">
                  {tItem.author}
                </span>
                <span className="block text-xs text-text-muted truncate">
                  {tl(tItem.role, locale)}
                  {tItem.source ? ` · ${tItem.source}` : ""}
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-8">
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 text-sm text-brand-aqua hover:text-brand-green transition"
        >
          {tl(TESTIMONIALS_COPY.reviewCta, locale)}
          <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
