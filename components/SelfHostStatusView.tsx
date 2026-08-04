"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Section } from "@/components/legal/LegalLayout";
import Logo from "@/components/Logo";
import { SELF_HOST_COPY, t, tl, type TwoLocale } from "@/lib/content/self-host-copy";

/**
 * Contenuto di /self-host (bare, nessun prefisso locale). Client component
 * perché offre un toggle EN/IT senza cambiare URL — stessa tecnica di
 * components/DeleteAccountView.tsx per lo stesso motivo: la route resta
 * unica e non localizzata (la stringa letterale compilata nell'app punta
 * qui). Il default lato server è inglese; il toggle aggiorna anche
 * `document.documentElement.lang`.
 *
 * Oltre al toggle, due link diretti verso le versioni complete e
 * indicizzabili... salvo che /it/self-host e /en/self-host sono anch'esse
 * noindex (addendum pre-merge): i link servono per condividere un URL
 * language-locked, non per SEO.
 */
export function SelfHostStatusView() {
  const [lang, setLang] = useState<TwoLocale>("en");
  const c = SELF_HOST_COPY;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <Link href={`/${lang}`} className="inline-block">
          <Logo variant="horizontal" size={36} />
        </Link>
      </div>

      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {t(c.kicker, lang)}
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
            {t(c.h1, lang)}
          </h1>
          <p className="mt-3 text-sm text-text-muted">{t(c.lastUpdated, lang)}</p>
        </div>
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "it" : "en")}
          className="shrink-0 rounded-pill border border-divider px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-brand-aqua/50 transition"
        >
          {t(c.toggleLabel, lang)}
        </button>
      </header>

      <p className="text-text-secondary leading-relaxed mb-10">{t(c.intro, lang)}</p>

      <div className="space-y-10 text-text-secondary leading-relaxed">
        <Section title={t(c.statusHeading, lang)}>
          <ul className="space-y-2">
            {tl(c.statusPoints, lang).map((point) => (
              <li key={point} className="flex gap-2">
                <span className="text-brand-aqua mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t(c.whatItIsNotHeading, lang)}>
          <ul className="space-y-2">
            {tl(c.whatItIsNotPoints, lang).map((point) => (
              <li key={point} className="flex gap-2">
                <span className="text-brand-aqua mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t(c.dataHeading, lang)}>
          <p>
            {t(c.dataParagraph, lang)}{" "}
            <Link
              href={`/${lang}/privacy`}
              className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
            >
              {t(c.privacyPolicyLink, lang)}
            </Link>
            .
          </p>
        </Section>

        <p className="text-sm text-text-muted">{t(c.closingParagraph, lang)}</p>

        <p className="text-sm">
          {t(c.supportPrefix, lang)}
          <Link
            href={`/${lang}/support`}
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            {t(c.supportLink, lang)}
          </Link>
          {t(c.supportSuffix, lang)}
        </p>

        <p className="text-sm text-text-muted">
          {t(c.permalinkPrefix, lang)}
          <Link href="/it/self-host" className="text-brand-aqua hover:text-brand-green underline underline-offset-4">
            Italiano
          </Link>
          {" · "}
          <Link href="/en/self-host" className="text-brand-aqua hover:text-brand-green underline underline-offset-4">
            English
          </Link>
        </p>
      </div>
    </article>
  );
}
