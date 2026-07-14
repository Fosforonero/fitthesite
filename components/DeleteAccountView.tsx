"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Section, List } from "@/components/legal/LegalLayout";
import { DELETE_ACCOUNT_COPY, DELETE_ACCOUNT_EMAIL_SUBJECT } from "@/lib/content/delete-account-copy";
import { TRADER, TRADER_ADDRESS_LINE } from "@/lib/legal/trader";
import Logo from "@/components/Logo";

/**
 * Contenuto di /delete-account. Client component perche' offre un toggle
 * EN/IT senza cambiare URL (la route resta unica e non localizzata, come
 * richiesto da Google Play/App Store per la pagina di cancellazione
 * account). Il default lato server e' inglese (vedi page.tsx +
 * middleware.ts `detectLocale`); il toggle aggiorna anche
 * `document.documentElement.lang` cosi' l'attributo resta corretto anche
 * dopo lo switch lato client.
 */
export function DeleteAccountView() {
  const [lang, setLang] = useState<"en" | "it">("en");
  const t = DELETE_ACCOUNT_COPY[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const mailtoHref = `mailto:${TRADER.privacyEmail}?subject=${encodeURIComponent(DELETE_ACCOUNT_EMAIL_SUBJECT)}`;

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
            {t.kicker}
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
            {t.h1}
          </h1>
          <p className="mt-3 text-sm text-text-muted">{t.lastUpdated}</p>
        </div>
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "it" : "en")}
          className="shrink-0 rounded-pill border border-divider px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-brand-aqua/50 transition"
        >
          {t.toggleLabel}
        </button>
      </header>

      <p className="text-text-secondary leading-relaxed mb-10">{t.intro}</p>

      <div className="space-y-10 text-text-secondary leading-relaxed">
        <Section title={t.howTitle}>
          <div className="rounded-card border border-divider bg-bg-secondary p-5">
            <p className="font-semibold text-text-primary text-sm">{t.howAppTitle}</p>
            <p className="mt-2 text-sm">{t.howAppBody}</p>
          </div>
          <div className="rounded-card border border-divider bg-bg-secondary p-5 mt-4">
            <p className="font-semibold text-text-primary text-sm">{t.howEmailTitle}</p>
            <p className="mt-2 text-sm">{t.howEmailBody}</p>
            <a
              href={mailtoHref}
              className="mt-4 inline-flex items-center gap-2 rounded-pill bg-error px-5 py-2.5 text-sm font-semibold text-bg-dark hover:opacity-90 transition"
            >
              {t.emailButtonLabel}
            </a>
          </div>
        </Section>

        <Section title={t.identityTitle}>
          <p>{t.identityBody}</p>
        </Section>

        <Section title={t.dataOnlyTitle}>
          <p>{t.dataOnlyBody}</p>
        </Section>

        <Section title={t.whatDeletedTitle}>
          <p>{t.whatDeletedIntro}</p>
          <ul className="space-y-2 mt-3">
            {t.whatDeletedItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-brand-aqua mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.whatKeptTitle}>
          <p>{t.whatKeptBody}</p>
        </Section>

        <Section title={t.backupsTitle}>
          <p>{t.backupsBody}</p>
          <Link
            href={`/${lang}/privacy`}
            className="inline-block mt-2 text-sm text-brand-aqua hover:text-brand-green transition underline decoration-brand-aqua/40 underline-offset-2"
          >
            {t.backupsLinkLabel}
          </Link>
        </Section>

        <Section title={t.externalTitle}>
          <p>{t.externalBody}</p>
        </Section>

        <Section title={t.purchasesTitle}>
          <p>{t.purchasesBody}</p>
        </Section>

        <Section title={t.timelineTitle}>
          <p>{t.timelineBody}</p>
        </Section>

        <Section title={t.faqTitle}>
          <List items={t.faq.map((f) => [f.q, f.a] as [string, string])} />
        </Section>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pt-2">
          <Link href={`/${lang}`} className="text-brand-aqua hover:text-brand-green transition">
            {lang === "it" ? "Home" : "Home"}
          </Link>
          <Link href={`/${lang}/privacy`} className="text-brand-aqua hover:text-brand-green transition">
            {t.privacyLinkLabel}
          </Link>
          <Link href={`/${lang}/terms`} className="text-brand-aqua hover:text-brand-green transition">
            {lang === "it" ? "Termini di servizio" : "Terms of service"}
          </Link>
          <Link href={`/${lang}/support`} className="text-brand-aqua hover:text-brand-green transition">
            {t.supportLinkLabel}
          </Link>
        </div>

        <hr className="border-divider" />
        <p className="text-xs text-text-muted">
          {TRADER.legalName} · {TRADER_ADDRESS_LINE} ·{" "}
          <a href={`mailto:${TRADER.privacyEmail}`} className="hover:text-text-secondary transition">
            {TRADER.privacyEmail}
          </a>
        </p>
        <p className="text-xs text-text-muted">
          {lang === "it" ? "Un progetto di" : "A project by"}{" "}
          <a
            href={TRADER.brandUrl}
            target="_blank"
            rel="noopener"
            className="font-medium text-text-secondary hover:text-text-primary transition underline decoration-text-muted/40 underline-offset-2"
          >
            Fosforonero
          </a>
        </p>
      </div>
    </article>
  );
}
