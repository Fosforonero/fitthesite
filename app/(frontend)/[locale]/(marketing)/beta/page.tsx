import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BetaSignupForm from "@/components/BetaSignupForm";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import TrustBadges from "@/components/TrustBadges";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { MobileApplicationJsonLd } from "@/components/seo/MobileApplicationJsonLd";
import { locales, type Locale, ogLocale, localeAlternates } from "@/lib/i18n";
import { PRICING } from "@/lib/pricing";
import { SITE_URL } from "@/lib/product-facts";
import { BetaFounderGate } from "@/components/founder/BetaFounderGate";
import { founderEligibilityStatement } from "@/lib/founder/historical-note";

type BetaCopy = typeof IT;
type BetaClosedCopy = {
  kicker: string;
  h1: string;
  sub: string;
  bullets: { title: string; desc: string }[];
  faqTitle: string;
  faqs: { q: string; a: string }[];
};

/** Fallback en per le locale non compilate qui sotto, stesso pattern di `t` nel componente. */
function tliClosed(l: Record<string, BetaClosedCopy>, lc: Locale): BetaClosedCopy {
  return l[lc] ?? l.en;
}

/**
 * Sprint P0.10H — H1 NEUTRO per il fallback pre-hydration: stesso vocabolario
 * gia' usato per il `kicker` di BETA_CLOSED_COPY (es. "Programma Founder"),
 * solo recombinato col brand. Mai "aperto" ne' "concluso" — la regola di
 * idoneita' vera e propria vive in founderEligibilityStatement() sotto.
 * Stessa copertura di locale di BETA_CLOSED_COPY (9 dirette + fallback en).
 */
const NEUTRAL_H1: Record<string, string> = {
  it: "Programma Founder FitMesh",
  es: "Programa Founder de FitMesh",
  de: "FitMesh Founder-Programm",
  pt: "Programa Founder FitMesh",
  fr: "Programme Founder FitMesh",
  nl: "FitMesh Founder-programma",
  ja: "FitMesh ファウンダープログラム",
  ko: "FitMesh 파운더 프로그램",
  en: "FitMesh Founder Program",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Sprint P0.10J — hotfix metadata: titolo neutro condiviso fra
 * `generateMetadata()` e il JSON-LD `WebPage` sotto (unica fonte, invece di
 * due ternari paralleli). Riusa lo stesso vocabolario di `NEUTRAL_H1` sopra
 * (mai "aperto" ne' "concluso"), con suffisso brand per il <title> SEO.
 */
function betaMetaTitle(lc: Locale): string {
  // NEUTRAL_H1 include gia' il brand ("Programma Founder FitMesh" ecc.) —
  // nessun suffisso aggiuntivo, altrimenti "FitMesh" comparirebbe due volte.
  return NEUTRAL_H1[lc] ?? NEUTRAL_H1.en;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  // Sprint P0.10J — hotfix: la description precedente (ternario per-locale)
  // affermava senza data che i primi 1000 ottengono un grant istantaneo alla
  // sola registrazione — nessun vincolo di cutoff, nessun requisito di prima
  // sync, quindi falsa/fuorviante sia prima sia (soprattutto) dopo il
  // 31/07/2026, e mai gated da BetaFounderGate (la metadata di Next.js viene
  // generata al build, non ha una variante client-side). Sostituita con
  // `founderEligibilityStatement()`, l'UNICA fonte di verità invariante
  // (Sprint P0.10G, vedi lib/founder/historical-note.ts): stessa frase
  // esatta, vera sia prima sia dopo il cutoff, già tradotta a mano in tutte
  // e 15 le locale (copre anche pl/tr/sv/da/no/fi, che prima ricadevano
  // silenziosamente sul ternario inglese).
  const title = betaMetaTitle(lc);
  const description = founderEligibilityStatement(lc);

  const path = `/${lc}/beta`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/beta`),
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    // Sprint P0.10: /beta diventa archivio informativo del programma
    // Founder concluso — noindex (non e' piu' un target di acquisizione),
    // follow (i link interni/esterni restano validi da seguire).
    robots: { index: false, follow: true },
  };
}

export default async function BetaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;

  const t = lc === "it" ? IT : lc === "es" ? ES : lc === "de" ? DE : lc === "pt" ? PT : lc === "fr" ? FR : lc === "nl" ? NL : lc === "ja" ? JA : lc === "ko" ? KO : EN;
  const closed = tliClosed(BETA_CLOSED_COPY, lc);

  return (
    // <div> e non <main>: il layout (marketing)/layout.tsx wrappa gia' i
    // children in un <main>. Nesting di landmark rompe WCAG e da'
    // comportamenti incerti agli screen reader iOS/Android.
    <div className="relative overflow-hidden pb-32 pt-20 text-text-primary md:pt-28">
      {/*
       * Sprint P0.10J — hotfix: prima usava `t.metaTitle`/`t.metaDesc` (9
       * oggetti per-locale con un claim di grant istantaneo alla sola
       * registrazione, non datato, la stessa classe di errore gia' corretta
       * nel commento di lib/founder/historical-note.ts), renderizzato SEMPRE
       * perche' questo JsonLd sta fuori dal componente BetaFounderGate qui sotto.
       * Sostituito con la stessa coppia neutra usata in generateMetadata():
       * vera sia prima sia dopo il cutoff, nessuna Offer/price/availability
       * aggiunta qui (resta in MobileApplicationJsonLd, gia' solo download
       * gratuito).
       */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: betaMetaTitle(lc),
          description: founderEligibilityStatement(lc),
          url: `${SITE_URL}/${lc}/beta`,
        }}
      />
      <MobileApplicationJsonLd locale={lc} />

      {/* Page-local atmospheric layers (sopra al MarketingBackdrop globale) */}
      <div
        aria-hidden
        className="halo-conic pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[720px] -translate-x-1/2 opacity-70 animate-float"
      />

      <div className="mx-auto max-w-3xl px-6">
        <Breadcrumbs
          locale={lc}
          items={[{ name: "Founder", path: `/${lc}/beta` }]}
        />

        {/*
         * Sprint P0.10 / corretto in P0.10H: questa pagina resta STATICA
         * (nessun force-dynamic, nessuna decisione temporale lato server).
         * L'HTML iniziale mostra SEMPRE il fallback NEUTRO (visibile anche a
         * crawler/client senza JS) — mai l'affermazione "aperto" ne' quella
         * "concluso", perche' un sito statico non cambia da solo tra un
         * deploy e l'altro: prima di P0.10H questo fallback era invece il
         * corpo "concluso" (BETA_CLOSED_COPY), falso ogni volta che l'ultimo
         * deploy avveniva prima del vero cutoff (bug verificato live il
         * 2026-07-29, due giorni prima del cutoff). Solo dopo l'hydration,
         * leggendo l'orologio del browser, BetaFounderGate sostituisce il
         * neutro con lo stato REALE: aperto (form + CTA) prima del cutoff,
         * archivio storico chiuso (senza form) al cutoff e dopo. Zero
         * richieste di rete in ogni stato.
         */}
        <BetaFounderGate
          pending={<FounderPendingBody lc={lc} />}
          open={<FounderOpenBody t={t} lc={lc} />}
          closed={<FounderClosedBody closed={closed} lc={lc} />}
        />
      </div>
    </div>
  );
}

function FounderOpenBody({ t, lc }: { t: BetaCopy; lc: Locale }) {
  return (
    <>
        {/* Hero */}
        <header className="mb-16 mt-8 text-center" data-reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent backdrop-blur-sm">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            {t.kicker}
          </div>
          <h1 className="font-display text-balance text-4xl font-semibold leading-[1.05] tracking-tightest md:text-5xl lg:text-display-xl">
            {t.h1_a}{" "}
            <span className="text-brand-gradient">
              {t.h1_b}
            </span>
            {t.h1_c && <> {t.h1_c}</>}
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">
            {t.sub}
          </p>

          {/* CTA primaria: il founder si attiva scaricando l'app, non con un form */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <StoreButtonsRow locale={lc} ctaLocation="beta_archive" />
          </div>
          <p className="mt-4 text-xs text-text-muted">{t.ctaNote}</p>
        </header>

        {/* Perks */}
        <section className="mb-16 grid gap-4 sm:grid-cols-3" data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties}>
          {t.perks.map((perk, i) => {
            const color = ["#7CFF5B", "#21E6C1", "#1DA1FF"][i];
            return (
              <div
                key={perk.title}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  aria-hidden
                  className="absolute -top-16 -right-12 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ background: color }}
                />
                <div
                  className="mb-4 inline-flex items-center justify-center w-11 h-11 rounded-2xl text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${color}22, ${color}08)`,
                    boxShadow: `inset 0 0 0 1px ${color}33`,
                  }}
                >
                  {perk.emoji}
                </div>
                <h3 className="relative font-display text-lg font-semibold text-text-primary">{perk.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-text-secondary">{perk.desc}</p>
              </div>
            );
          })}
        </section>

        {/* What happens next */}
        <section className="mb-20" data-reveal>
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
            {lc === "it" ? "Processo" : lc === "es" ? "Proceso" : lc === "de" ? "Ablauf" : lc === "pt" ? "Processo" : lc === "fr" ? "Processus" : lc === "nl" ? "Proces" : lc === "ja" ? "プロセス" : lc === "ko" ? "절차" : "Process"}
          </p>
          <h2 className="mt-3 mb-8 font-display text-display font-semibold tracking-tightest text-text-primary">{t.nextTitle}</h2>
          <ol className="space-y-3">
            {t.nextSteps.map((step, i) => (
              <li
                key={step.title}
                className="group flex gap-5 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 hover:bg-white/[0.03] hover:border-white/[0.1] transition-all"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-display text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(33,230,193,0.18), rgba(124,255,91,0.08))",
                    boxShadow: "inset 0 0 0 1px rgba(33,230,193,0.30)",
                    color: "#21E6C1",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-text-primary">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Form iscrizione beta/founder */}
        <section
          className="card-glass p-8 md:p-10 relative overflow-hidden"
          data-reveal
        >
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, #21E6C1 0%, transparent 70%)" }}
          />
          <div className="relative">
            <h2 className="font-display text-2xl font-semibold text-text-primary tracking-tight">{t.formTitle}</h2>
            <p className="mt-2 mb-8 text-text-secondary">{t.formSub}</p>
            <BetaSignupForm locale={lc} />
          </div>
        </section>

        {/* Trust badges — rinforza affidabilita' subito sotto il form. */}
        <section className="mt-6">
          <TrustBadges locale={lc} variant="compact" />
        </section>

        {/* FAQ */}
        <section className="mt-20" data-reveal>
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
            FAQ
          </p>
          <h2 className="mt-3 mb-8 font-display text-display font-semibold tracking-tightest text-text-primary">{t.faqTitle}</h2>
          <div className="space-y-3">
            {t.faqs.map((faq) => (
              <details
                key={faq.q}
                className="group card p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-text-primary">
                  {faq.q}
                  <span className="text-brand-aqua text-xl leading-none transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
    </>
  );
}

/**
 * Sprint P0.10H — fallback NEUTRO: l'UNICO contenuto mostrato prima che
 * BetaFounderGate verifichi il vero stato lato client (quindi anche a
 * crawler/unfurler/screen reader senza JS, e al primissimo frame di ogni
 * browser). Non afferma ne' "aperto" ne' "concluso" — riporta solo la
 * REGOLA di idoneita' (founderEligibilityStatement), invariante rispetto al
 * cutoff. Niente form, niente CTA, niente contatore/progress bar, zero
 * richieste di rete: e' prosa statica pura.
 */
function FounderPendingBody({ lc }: { lc: Locale }) {
  const h1 = NEUTRAL_H1[lc] ?? NEUTRAL_H1.en;
  const kicker = tliClosed(BETA_CLOSED_COPY, lc).kicker;
  return (
    <header className="mb-16 mt-8 text-center" data-reveal>
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted backdrop-blur-sm">
        {kicker}
      </div>
      <h1 className="font-display text-balance text-4xl font-semibold leading-[1.05] tracking-tightest md:text-5xl lg:text-display-xl">
        {h1}
      </h1>
      <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">
        {founderEligibilityStatement(lc)}
      </p>
    </header>
  );
}

/**
 * Sprint P0.10 / corretto in P0.10H — archivio storico: mostrato SOLO dopo
 * che l'hydration ha confermato che il cutoff e' passato (mai piu' come
 * fallback SSR: prima di P0.10H questo era anche il default pre-hydration,
 * bug che affermava "programma concluso" mentre era ancora aperto — vedi
 * FounderPendingBody sopra). Deliberatamente piu' corto della variante
 * founder: la pagina diventa un archivio informativo, non un mirror 1:1
 * della landing promozionale (niente form, niente step di iscrizione,
 * niente FAQ sui wearable gia' coperte altrove sul sito).
 */
function FounderClosedBody({ closed, lc }: { closed: BetaClosedCopy; lc: Locale }) {
  const colors = ["#7CFF5B", "#21E6C1", "#1DA1FF"];
  return (
    <>
      <header className="mb-16 mt-8 text-center" data-reveal>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted backdrop-blur-sm">
          {closed.kicker}
        </div>
        <h1 className="font-display text-balance text-4xl font-semibold leading-[1.05] tracking-tightest md:text-5xl lg:text-display-xl">
          {closed.h1}
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">
          {closed.sub}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <StoreButtonsRow locale={lc} ctaLocation="beta_archive" />
        </div>
      </header>

      <section className="mb-16 grid gap-4 sm:grid-cols-3" data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties}>
        {closed.bullets.map((bullet, i) => (
          <div
            key={bullet.title}
            className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300"
          >
            <div
              aria-hidden
              className="absolute -top-16 -right-12 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
              style={{ background: colors[i] }}
            />
            <h3 className="relative font-display text-lg font-semibold text-text-primary">{bullet.title}</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-text-secondary">{bullet.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <TrustBadges locale={lc} variant="compact" />
      </section>

      <section className="mt-20" data-reveal>
        <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">FAQ</p>
        <h2 className="mt-3 mb-8 font-display text-display font-semibold tracking-tightest text-text-primary">{closed.faqTitle}</h2>
        <div className="space-y-3">
          {closed.faqs.map((faq) => (
            <details key={faq.q} className="group card p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-text-primary">
                {faq.q}
                <span className="text-brand-aqua text-xl leading-none transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

const IT = {
  kicker: "Founder · 1000 posti",
  h1_a: "Diventa uno dei primi",
  h1_b: "1000 founder",
  h1_c: "di FitMesh Sync",
  sub:
    "Nessuna selezione, nessuna attesa: scarichi l'app, crei l'account e il Pro a vita si attiva da solo. Vale per i primi 1000 account registrati.",
  ctaNote: "Niente carta, niente abbonamento: il Pro è tuo per sempre.",
  perks: [
    {
      emoji: "🎁",
      title: "Pro a vita gratis",
      desc: "Si attiva automaticamente alla registrazione. Storico illimitato, Mesh Famiglia, tutte le feature Pro incluse — per sempre.",
    },
    {
      emoji: "⚡",
      title: "Anche su iOS",
      desc: "L'app iOS è già live sull'App Store in tutti i Paesi supportati, incluse le storefront dell'Unione Europea. Il Pro Founder vale su entrambe le piattaforme.",
    },
    {
      emoji: "🛠️",
      title: "Voce diretta",
      desc: "Tu suggerisci, io ascolto. Le feature più richieste dai founder hanno priorità nella roadmap.",
    },
  ],
  formTitle: "Diventa founder",
  formSub:
    "L'app iOS è già live sull'App Store in tutti i Paesi supportati, incluse le storefront dell'Unione Europea. Lascia l'email per essere avvisato di novità e aggiornamenti sul programma founder.",
  nextTitle: "Come funziona",
  nextSteps: [
    {
      title: "Scarichi l'app da Google Play",
      desc: "FitMesh Sync è live. Nessuna richiesta da compilare, nessuna approvazione da aspettare.",
    },
    {
      title: "Crei l'account",
      desc: "Email o Google Sign-In. Se sei tra i primi 1000, il Pro si attiva da solo: nella schermata Pro vedi \"Founder · Pro · Lifetime\".",
    },
    {
      title: "Pro a vita, senza vincoli",
      desc: "Niente carta, niente scadenza, niente rinnovo automatico. Il Pro Founder è permanente.",
    },
    {
      title: "Mi mandi feedback quando vuoi",
      desc: "Bug o idee? Scrivimi. Le release seguenti includono le richieste dei founder.",
    },
  ],
  faqTitle: "Domande frequenti",
  faqs: [
    {
      q: "Cosa include il Pro a vita gratis?",
      a: "Tutto quello che include Pro: storico illimitato (oltre quello della prova di 14 giorni), Mesh Famiglia, esportazione dati completa e tutte le feature Pro future. Senza scadenza.",
    },
    {
      q: "Come so se sono tra i primi 1000?",
      a: "Controlla la schermata Pro nell'app. Se il beneficio Founder è stato assegnato al tuo account, vedrai \"Founder · Pro · Lifetime\". Il sito non mostra più un contatore pubblico finché il conteggio non sarà riconciliato e verificato.",
    },
    {
      q: "Il Pro Founder ha una scadenza?",
      a: "No. Il Pro Founder è a vita — nessuna data di scadenza, nessun rinnovo da gestire. È permanente finché esiste FitMesh.",
    },
    {
      q: "E i primi 100 beta tester?",
      a: "Chi è entrato nella closed beta mantiene il Pro a vita, come promesso. Il programma founder da 1000 posti è il passo successivo, legato al lancio pubblico.",
    },
    {
      q: "Quali wearable supporta?",
      a: "Tutti i dispositivi compatibili con Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (via Health Connect), Garmin (via Connect), Polar, e qualsiasi altro che scriva su Health Connect. Per Samsung Galaxy Watch c'è anche il path diretto Samsung Health.",
    },
    {
      q: "Cosa fate con i miei dati?",
      a: "I tuoi dati salute sono protetti, conservati su server europei e accessibili solo a te tramite il tuo account. Non vengono mai venduti né condivisi con terzi. Dettagli completi: fitmesh.fit/it/privacy",
    },
    {
      q: "Posso cancellare l'account?",
      a: "Sì, in qualsiasi momento, direttamente dall'app o scrivendo a privacy@fitmesh.fit. Cancelliamo account e dati entro 48h: è il nostro obiettivo operativo interno.",
    },
  ],
};

const ES = {
  kicker: "Founder · 1000 plazas",
  h1_a: "Sé uno de los primeros",
  h1_b: "1000 founders",
  h1_c: "de FitMesh Sync",
  sub:
    "Sin selección, sin espera: descarga la app, crea tu cuenta y el Pro vitalicio se activa solo. Válido para las primeras 1000 cuentas registradas.",
  ctaNote: "Sin tarjeta, sin suscripción: el Pro es tuyo para siempre.",
  perks: [
    {
      emoji: "🎁",
      title: "Pro vitalicio gratis",
      desc: "Se activa automáticamente al registrarte. Historial ilimitado, Mesh Familia, todas las funciones Pro incluidas — para siempre.",
    },
    {
      emoji: "⚡",
      title: "También en iOS",
      desc: "La app iOS ya está disponible en la App Store en todos los países compatibles, incluidas todas las tiendas de la Unión Europea. El Pro Founder es válido en ambas plataformas.",
    },
    {
      emoji: "🛠️",
      title: "Voz directa",
      desc: "Tú sugieres, yo escucho. Las funciones más solicitadas por los founders tienen prioridad en la hoja de ruta.",
    },
  ],
  formTitle: "¿Quieres FitMesh también en iPhone?",
  formSub:
    "La app iOS ya está disponible en la App Store en todos los países compatibles, incluidas todas las tiendas de la Unión Europea. Deja tu email y te aviso en cuanto esté disponible también en tu país.",
  nextTitle: "Cómo funciona",
  nextSteps: [
    {
      title: "Descarga la app desde Google Play",
      desc: "FitMesh Sync ya está disponible. Sin formularios que rellenar, sin aprobaciones que esperar.",
    },
    {
      title: "Crea tu cuenta",
      desc: "Con email o Google Sign-In. Si estás entre los primeros 1000, el Pro se activa solo: en la pantalla Pro verás \"Founder · Pro · Lifetime\".",
    },
    {
      title: "Pro vitalicio, sin compromisos",
      desc: "Sin tarjeta, sin vencimiento, sin renovación automática. El Pro Founder es permanente.",
    },
    {
      title: "Envíame tu opinión cuando quieras",
      desc: "¿Un error o una idea? Escríbeme. Las siguientes versiones incorporan las peticiones de los founders.",
    },
  ],
  faqTitle: "Preguntas frecuentes",
  faqs: [
    {
      q: "¿Qué incluye el Pro vitalicio gratis?",
      a: "Todo lo que incluye Pro: historial ilimitado (más allá del que ofrece la prueba de 14 días), Mesh Familia, exportación completa de datos y todas las funciones Pro futuras. Sin vencimiento.",
    },
    {
      q: "¿Cómo sé si estoy entre los primeros 1000?",
      a: "Consulta la pantalla Pro en la app. Si el beneficio Founder se ha asignado a tu cuenta, verás \"Founder · Pro · Lifetime\". El sitio ya no muestra un contador público hasta que el recuento esté conciliado y verificado.",
    },
    {
      q: "¿El Pro Founder tiene fecha de vencimiento?",
      a: "No. El Pro Founder es permanente — sin fecha de vencimiento, sin renovaciones. Es tuyo mientras exista FitMesh.",
    },
    {
      q: "¿Y los primeros 100 beta testers?",
      a: "Los miembros de la beta cerrada mantienen Pro de por vida, como se prometió. El programa founder de 1000 plazas es el siguiente paso, vinculado al lanzamiento público.",
    },
    {
      q: "¿Qué wearables son compatibles?",
      a: "Todos los dispositivos compatibles con Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (vía Health Connect), Garmin (vía Connect), Polar y cualquier otro que escriba en Health Connect. Para Samsung Galaxy Watch también existe la integración directa con Samsung Health.",
    },
    {
      q: "¿Qué hacéis con mis datos?",
      a: "Tus datos de salud no son un producto. Se almacenan en servidores europeos y solo tú puedes acceder a ellos a través de tu cuenta. Nunca se venden ni se comparten con terceros. Más detalles en: fitmesh.fit/es/privacy",
    },
    {
      q: "¿Puedo eliminar mi cuenta?",
      a: "Sí, en cualquier momento, directamente desde la app o escribiendo a privacy@fitmesh.fit. Eliminamos la cuenta y todos los datos en un plazo de 48h: es nuestro objetivo operativo interno.",
    },
  ],
};

const EN = {
  kicker: "Founder · 1000 seats",
  h1_a: "Become one of the first",
  h1_b: "1000 founders",
  h1_c: "of FitMesh Sync",
  sub:
    "No selection, no waiting: download the app, create your account, and lifetime Pro activates by itself. Valid for the first 1000 registered accounts.",
  ctaNote: "No card, no subscription: Pro is yours for life.",
  perks: [
    {
      emoji: "🎁",
      title: "Lifetime Pro free",
      desc: "Activates automatically at sign-up. Unlimited history, Family Mesh, every Pro feature included — forever.",
    },
    {
      emoji: "⚡",
      title: "Also on iOS",
      desc: "The iOS app is live on the App Store in all supported countries, including all European Union storefronts. Founder Pro works on both platforms.",
    },
    {
      emoji: "🛠️",
      title: "Direct voice",
      desc: "You suggest, I listen. Founder-requested features take priority in the roadmap.",
    },
  ],
  formTitle: "Become a founder",
  formSub:
    "The iOS app is live on the App Store in all supported countries, including all European Union storefronts. Leave your email to be notified about founder program news and updates.",
  nextTitle: "How it works",
  nextSteps: [
    {
      title: "Download the app from Google Play",
      desc: "FitMesh Sync is live. No application to fill in, no approval to wait for.",
    },
    {
      title: "Create your account",
      desc: "Email or Google Sign-In. If you're among the first 1000, Pro activates by itself: the Pro screen shows \"Founder · Pro · Lifetime\".",
    },
    {
      title: "Pro for life, no strings",
      desc: "No card, no expiry, no auto-renewal. Founder Pro is permanent.",
    },
    {
      title: "Send feedback whenever you like",
      desc: "Bugs or ideas? Write me. Following releases ship founder requests.",
    },
  ],
  faqTitle: "FAQ",
  faqs: [
    {
      q: "What does the free lifetime Pro include?",
      a: "Everything Pro includes: unlimited history (beyond what the 14-day trial covers), Family Mesh, full data export, and every future Pro feature. No expiry.",
    },
    {
      q: "How do I know if I'm in the first 1000?",
      a: "Check the Pro screen in the app. If the Founder benefit has been assigned to your account, you will see \"Founder · Pro · Lifetime\". The website no longer shows a public counter until the count has been reconciled and verified.",
    },
    {
      q: "Does Founder Pro ever expire?",
      a: "No. Founder Pro is permanent — no expiry date, no renewal to manage. It's yours for as long as FitMesh exists.",
    },
    {
      q: "What about the first 100 beta testers?",
      a: "Closed-beta members keep Pro for life, as promised. The 1000-seat founder program is the next step, tied to the public launch.",
    },
    {
      q: "Which wearables are supported?",
      a: "Any device compatible with Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (via Health Connect), Garmin (via Connect), Polar, and any other that writes to Health Connect. For Samsung Galaxy Watch there's also a direct Samsung Health path.",
    },
    {
      q: "What do you do with my data?",
      a: "Your health data is protected, stored on European servers, and accessible only to you via your account. Never sold or shared with third parties. Full details: fitmesh.fit/en/privacy",
    },
    {
      q: "Can I delete my account?",
      a: "Yes, anytime, directly from the app or by writing to privacy@fitmesh.fit. We delete the account and all data within 48h: that's our internal operational target.",
    },
  ],
};

const DE = {
  kicker: "Founder · 1000 Plätze",
  h1_a: "Werde einer der ersten",
  h1_b: "1000 Founder",
  h1_c: "von FitMesh Sync",
  sub:
    "Keine Auswahl, keine Wartezeit: Lade die App herunter, erstelle dein Konto und Lifetime-Pro aktiviert sich automatisch. Gilt für die ersten 1000 registrierten Konten.",
  ctaNote: "Keine Kreditkarte, kein Abonnement: Pro gehört dir für immer.",
  perks: [
    {
      emoji: "🎁",
      title: "Lifetime-Pro kostenlos",
      desc: "Aktiviert sich automatisch bei der Registrierung. Unbegrenzter Verlauf, Mesh Familie, alle Pro-Funktionen inklusive — für immer.",
    },
    {
      emoji: "⚡",
      title: "Auch auf iOS",
      desc: "Die iOS-App ist bereits im App Store in allen unterstützten Ländern live, einschließlich aller Storefronts der Europäischen Union. Der Founder-Pro gilt auf beiden Plattformen.",
    },
    {
      emoji: "🛠️",
      title: "Direkte Stimme",
      desc: "Du schlägst vor, ich höre zu. Von Foundern gewünschte Funktionen haben Priorität auf der Roadmap.",
    },
  ],
  formTitle: "FitMesh auch auf dem iPhone?",
  formSub:
    "Die iOS-App ist bereits im App Store in allen unterstützten Ländern live, einschließlich aller Storefronts der Europäischen Union. Hinterlasse deine E-Mail-Adresse und ich benachrichtige dich, sobald sie auch in deinem Land verfügbar ist.",
  nextTitle: "So funktioniert es",
  nextSteps: [
    {
      title: "Lade die App bei Google Play herunter",
      desc: "FitMesh Sync ist verfügbar. Kein Formular ausfüllen, keine Genehmigung abwarten.",
    },
    {
      title: "Erstelle dein Konto",
      desc: "Mit E-Mail oder Google Sign-In. Wenn du zu den ersten 1000 gehörst, aktiviert sich Pro automatisch: Im Pro-Bildschirm siehst du \"Founder · Pro · Lifetime\".",
    },
    {
      title: "Lifetime-Pro, ohne Bedingungen",
      desc: "Keine Kreditkarte, kein Ablaufdatum, keine automatische Verlängerung. Founder Pro ist dauerhaft.",
    },
    {
      title: "Schick mir Feedback, wann immer du möchtest",
      desc: "Fehler oder Ideen? Schreib mir. Folgende Releases berücksichtigen die Wünsche der Founder.",
    },
  ],
  faqTitle: "Häufige Fragen",
  faqs: [
    {
      q: "Was ist im kostenlosen Lifetime-Pro enthalten?",
      a: "Alles, was Pro beinhaltet: unbegrenzter Verlauf (über den der 14-tägigen Testphase hinaus), Mesh Familie, vollständiger Datenexport und alle zukünftigen Pro-Funktionen. Ohne Ablaufdatum.",
    },
    {
      q: "Woher weiß ich, ob ich zu den ersten 1000 gehöre?",
      a: "Sieh im Pro-Bildschirm der App nach. Wenn der Founder-Vorteil deinem Konto zugewiesen wurde, siehst du \"Founder · Pro · Lifetime\". Die Website zeigt keinen öffentlichen Zähler mehr an, bis die Zählung abgeglichen und verifiziert ist.",
    },
    {
      q: "Läuft Founder Pro irgendwann ab?",
      a: "Nein. Founder Pro ist dauerhaft — kein Ablaufdatum, keine Verlängerungen. Es gehört dir, solange es FitMesh gibt.",
    },
    {
      q: "Und die ersten 100 Beta-Tester?",
      a: "Mitglieder der geschlossenen Beta behalten Pro auf Lebenszeit, wie versprochen. Das Founder-Programm mit 1000 Plätzen ist der nächste Schritt, verbunden mit dem öffentlichen Launch.",
    },
    {
      q: "Welche Wearables werden unterstützt?",
      a: "Alle mit Health Connect kompatiblen Geräte (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (über Health Connect), Garmin (über Connect), Polar und alle anderen, die Daten in Health Connect schreiben. Für Samsung Galaxy Watch gibt es zusätzlich den direkten Samsung Health-Pfad.",
    },
    {
      q: "Was macht ihr mit meinen Daten?",
      a: "Deine Gesundheitsdaten sind kein Produkt. Sie werden auf europäischen Servern gespeichert und sind nur über dein Konto für dich zugänglich. Sie werden niemals verkauft oder an Dritte weitergegeben. Alle Details: fitmesh.fit/de/privacy",
    },
    {
      q: "Kann ich mein Konto löschen?",
      a: "Ja, jederzeit, direkt in der App oder per E-Mail an privacy@fitmesh.fit. Wir löschen Konto und alle Daten innerhalb von 48 Stunden: das ist unser internes Betriebsziel.",
    },
  ],
};

const PT = {
  kicker: "Founder · 1000 vagas",
  h1_a: "Seja um dos primeiros",
  h1_b: "1000 founders",
  h1_c: "do FitMesh Sync",
  sub:
    "Sem seleção, sem espera: baixe o app, crie sua conta e o Pro vitalício é ativado automaticamente. Válido para as primeiras 1000 contas registradas.",
  ctaNote: "Sem cartão, sem assinatura: o Pro é seu para sempre.",
  perks: [
    {
      emoji: "🎁",
      title: "Pro vitalício grátis",
      desc: "Ativado automaticamente no cadastro. Histórico ilimitado, Mesh Família, todas as funcionalidades Pro incluídas — para sempre.",
    },
    {
      emoji: "⚡",
      title: "Também no iOS",
      desc: "O app iOS já está ao vivo na App Store em todos os países compatíveis, incluindo todas as lojas da União Europeia. O Pro Founder vale nas duas plataformas.",
    },
    {
      emoji: "🛠️",
      title: "Voz direta",
      desc: "Você sugere, eu escuto. As funcionalidades mais pedidas pelos founders têm prioridade no roadmap.",
    },
  ],
  formTitle: "Quer o FitMesh também no iPhone?",
  formSub:
    "O app iOS já está ao vivo na App Store em todos os países compatíveis, incluindo todas as lojas da União Europeia. Deixe seu e-mail e eu aviso assim que estiver disponível também no seu país.",
  nextTitle: "Como funciona",
  nextSteps: [
    {
      title: "Baixe o app no Google Play",
      desc: "O FitMesh Sync já está disponível. Sem formulários para preencher, sem aprovações para aguardar.",
    },
    {
      title: "Crie sua conta",
      desc: "Com e-mail ou Google Sign-In. Se você estiver entre os primeiros 1000, o Pro é ativado automaticamente: na tela Pro você verá \"Founder · Pro · Lifetime\".",
    },
    {
      title: "Pro vitalício, sem compromisso",
      desc: "Sem cartão, sem vencimento, sem renovação automática. O Pro Founder é permanente.",
    },
    {
      title: "Me envie feedback quando quiser",
      desc: "Bugs ou ideias? Me escreva. As próximas versões incluem as solicitações dos founders.",
    },
  ],
  faqTitle: "Perguntas frequentes",
  faqs: [
    {
      q: "O que inclui o Pro vitalício grátis?",
      a: "Tudo o que o Pro inclui: histórico ilimitado (além do que a avaliação de 14 dias oferece), Mesh Família, exportação completa de dados e todas as funcionalidades Pro futuras. Sem vencimento.",
    },
    {
      q: "Como sei se estou entre os primeiros 1000?",
      a: "Verifique a tela Pro no app. Se o benefício Founder foi atribuído à sua conta, você verá \"Founder · Pro · Lifetime\". O site não exibe mais um contador público até que a contagem seja reconciliada e verificada.",
    },
    {
      q: "O Pro Founder tem prazo de validade?",
      a: "Não. O Pro Founder é permanente — sem data de vencimento, sem renovações. É seu enquanto o FitMesh existir.",
    },
    {
      q: "E os primeiros 100 beta testers?",
      a: "Os membros da beta fechada mantêm o Pro vitalício, como prometido. O programa founder de 1000 vagas é o próximo passo, vinculado ao lançamento público.",
    },
    {
      q: "Quais wearables são compatíveis?",
      a: "Todos os dispositivos compatíveis com Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (via Health Connect), Garmin (via Connect), Polar e qualquer outro que grave dados no Health Connect. Para o Samsung Galaxy Watch há também a integração direta com o Samsung Health.",
    },
    {
      q: "O que vocês fazem com os meus dados?",
      a: "Seus dados de saúde não são um produto. São armazenados em servidores europeus e acessíveis apenas por você através da sua conta. Nunca são vendidos nem compartilhados com terceiros. Detalhes completos: fitmesh.fit/pt/privacy",
    },
    {
      q: "Posso excluir minha conta?",
      a: "Sim, a qualquer momento, diretamente pelo app ou escrevendo para privacy@fitmesh.fit. Excluímos a conta e todos os dados em até 48h: é a nossa meta operacional interna.",
    },
  ],
};

const FR = {
  kicker: "Founder · 1000 places",
  h1_a: "Devenez l'un des premiers",
  h1_b: "1000 founders",
  h1_c: "de FitMesh Sync",
  sub:
    "Pas de sélection, pas d'attente: téléchargez l'app, créez votre compte et le Pro à vie s'active tout seul. Valable pour les 1000 premiers comptes inscrits.",
  ctaNote: "Sans carte, sans abonnement: le Pro est à vous pour toujours.",
  perks: [
    {
      emoji: "🎁",
      title: "Pro à vie gratuit",
      desc: "S'active automatiquement à l'inscription. Historique illimité, Mesh Famille, toutes les fonctionnalités Pro incluses — pour toujours.",
    },
    {
      emoji: "⚡",
      title: "Aussi sur iOS",
      desc: "L'app iOS est déjà disponible sur l'App Store dans tous les pays pris en charge, y compris dans toutes les boutiques de l'Union européenne. Le Pro Founder est valable sur les deux plateformes.",
    },
    {
      emoji: "🛠️",
      title: "Voix directe",
      desc: "Vous suggérez, j'écoute. Les fonctionnalités les plus demandées par les founders sont prioritaires dans la feuille de route.",
    },
  ],
  formTitle: "Vous voulez FitMesh sur iPhone aussi?",
  formSub:
    "L'app iOS est déjà disponible sur l'App Store dans tous les pays pris en charge, y compris dans toutes les boutiques de l'Union européenne. Laissez votre e-mail et je vous préviens dès qu'elle sera disponible aussi dans votre pays.",
  nextTitle: "Comment ça marche",
  nextSteps: [
    {
      title: "Téléchargez l'app depuis Google Play",
      desc: "FitMesh Sync est disponible. Pas de formulaire à remplir, pas d'approbation à attendre.",
    },
    {
      title: "Créez votre compte",
      desc: "Avec e-mail ou Google Sign-In. Si vous faites partie des 1000 premiers, Pro s'active tout seul: l'écran Pro affiche \"Founder · Pro · Lifetime\".",
    },
    {
      title: "Pro à vie, sans engagement",
      desc: "Pas de carte, pas d'expiration, pas de renouvellement automatique. Le Pro Founder est permanent.",
    },
    {
      title: "Envoyez-moi vos retours quand vous voulez",
      desc: "Bugs ou idées? Écrivez-moi. Les versions suivantes intègrent les demandes des founders.",
    },
  ],
  faqTitle: "Questions fréquentes",
  faqs: [
    {
      q: "Que comprend le Pro à vie gratuit?",
      a: "Tout ce que comprend Pro: historique illimité (au-delà de ce que couvre l'essai de 14 jours), Mesh Famille, export complet des données et toutes les fonctionnalités Pro futures. Sans expiration.",
    },
    {
      q: "Comment savoir si je fais partie des 1000 premiers?",
      a: "Vérifiez l'écran Pro dans l'app. Si l'avantage Founder a été attribué à votre compte, vous verrez \"Founder · Pro · Lifetime\". Le site n'affiche plus de compteur public tant que le décompte n'a pas été réconcilié et vérifié.",
    },
    {
      q: "Le Pro Founder expire-t-il un jour?",
      a: "Non. Le Pro Founder est permanent — aucune date d'expiration, aucun renouvellement. Il vous appartient tant que FitMesh existe.",
    },
    {
      q: "Et les 100 premiers beta testeurs?",
      a: "Les membres de la bêta fermée conservent Pro à vie, comme promis. Le programme founder de 1000 places est l'étape suivante, liée au lancement public.",
    },
    {
      q: "Quels wearables sont compatibles?",
      a: "Tous les appareils compatibles avec Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (via Health Connect), Garmin (via Connect), Polar et tout autre appareil qui écrit dans Health Connect. Pour Samsung Galaxy Watch, il existe aussi une intégration directe avec Samsung Health.",
    },
    {
      q: "Que faites-vous de mes données?",
      a: "Vos données de santé ne sont pas un produit. Elles sont stockées sur des serveurs européens et accessibles uniquement par vous via votre compte. Elles ne sont jamais vendues ni partagées avec des tiers. Tous les détails: fitmesh.fit/fr/privacy",
    },
    {
      q: "Puis-je supprimer mon compte?",
      a: "Oui, à tout moment, directement depuis l'app ou en écrivant à privacy@fitmesh.fit. Nous supprimons le compte et toutes les données dans les 48h: c'est notre objectif opérationnel interne.",
    },
  ],
};

const NL = {
  kicker: "Founder · 1000 plaatsen",
  h1_a: "Word een van de eerste",
  h1_b: "1000 founders",
  h1_c: "van FitMesh Sync",
  sub:
    "Geen selectie, geen wachttijd: download de app, maak je account aan en Pro voor altijd activeert zich vanzelf. Geldig voor de eerste 1000 geregistreerde accounts.",
  ctaNote: "Geen kaart, geen abonnement: Pro is voor altijd van jou.",
  perks: [
    {
      emoji: "🎁",
      title: "Pro voor altijd gratis",
      desc: "Activeert automatisch bij registratie. Onbeperkte geschiedenis, Mesh Familie, alle Pro-functies inbegrepen — voor altijd.",
    },
    {
      emoji: "⚡",
      title: "Ook op iOS",
      desc: "De iOS-app is al live in de App Store in alle ondersteunde landen, inclusief alle winkels van de Europese Unie. De Founder Pro geldt op beide platforms.",
    },
    {
      emoji: "🛠️",
      title: "Directe inbreng",
      desc: "Jij stelt voor, ik luister. Door founders gevraagde functies krijgen prioriteit op de roadmap.",
    },
  ],
  formTitle: "Wil je FitMesh ook op je iPhone?",
  formSub:
    "De iOS-app is al live in de App Store in alle ondersteunde landen, inclusief alle winkels van de Europese Unie. Laat je e-mailadres achter en ik laat het je weten zodra hij ook in jouw land beschikbaar is.",
  nextTitle: "Hoe het werkt",
  nextSteps: [
    {
      title: "Download de app via Google Play",
      desc: "FitMesh Sync is live. Geen formulier invullen, geen goedkeuring afwachten.",
    },
    {
      title: "Maak je account aan",
      desc: "Via e-mail of Google Sign-In. Als je bij de eerste 1000 hoort, activeert Pro zich vanzelf: het Pro-scherm toont \"Founder · Pro · Lifetime\".",
    },
    {
      title: "Pro voor altijd, zonder verplichtingen",
      desc: "Geen kaart, geen vervaldatum, geen automatische verlenging. Founder Pro is permanent.",
    },
    {
      title: "Stuur feedback wanneer je wilt",
      desc: "Bugs of ideeën? Schrijf me. Volgende releases bevatten founder-verzoeken.",
    },
  ],
  faqTitle: "Veelgestelde vragen",
  faqs: [
    {
      q: "Wat bevat het gratis Pro voor altijd?",
      a: "Alles wat Pro omvat: onbeperkte geschiedenis (verder dan wat de proefperiode van 14 dagen biedt), Mesh Familie, volledige gegevensexport en alle toekomstige Pro-functies. Zonder vervaldatum.",
    },
    {
      q: "Hoe weet ik of ik bij de eerste 1000 hoor?",
      a: "Kijk naar het Pro-scherm in de app. Als het Founder-voordeel aan jouw account is toegekend, zie je \"Founder · Pro · Lifetime\". De site toont geen publieke teller meer totdat de telling is gecontroleerd en geverifieerd.",
    },
    {
      q: "Verloopt Founder Pro ooit?",
      a: "Nee. Founder Pro is permanent — geen vervaldatum, geen verlengingen. Het is van jou zolang FitMesh bestaat.",
    },
    {
      q: "En de eerste 100 bèta-testers?",
      a: "Leden van de gesloten bèta behouden Pro voor het leven, zoals beloofd. Het founder-programma met 1000 plaatsen is de volgende stap, verbonden aan de publieke lancering.",
    },
    {
      q: "Welke wearables worden ondersteund?",
      a: "Alle apparaten die compatibel zijn met Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (via Health Connect), Garmin (via Connect), Polar en alle anderen die naar Health Connect schrijven. Voor Samsung Galaxy Watch is er ook een directe Samsung Health-integratie.",
    },
    {
      q: "Wat doen jullie met mijn gegevens?",
      a: "Je gezondheidsgegevens zijn beschermd, opgeslagen op Europese servers en alleen toegankelijk voor jou via je account. Ze worden nooit verkocht of gedeeld met derden. Alle details: fitmesh.fit/nl/privacy",
    },
    {
      q: "Kan ik mijn account verwijderen?",
      a: "Ja, op elk moment, rechtstreeks vanuit de app of door te schrijven naar privacy@fitmesh.fit. We verwijderen het account en alle gegevens binnen 48 uur: dat is ons interne operationele doel.",
    },
  ],
};

const JA = {
  kicker: "Founder · 1000席",
  h1_a: "最初の",
  h1_b: "1000人のFounder",
  h1_c: "になろう",
  sub:
    "選考なし、待機なし：アプリをダウンロードしてアカウントを作成するだけで、永久Proが自動的に有効になります。先着1000名のアカウントに適用されます。",
  ctaNote: "カード不要、サブスクリプション不要：Proは永久にあなたのものです。",
  perks: [
    {
      emoji: "🎁",
      title: "Pro永久無料",
      desc: "登録時に自動的に有効化。無制限の履歴、ファミリーメッシュ、すべてのPro機能が含まれます—永久に。",
    },
    {
      emoji: "⚡",
      title: "iOSでも利用可能",
      desc: "iOSアプリはすでに対応するすべての国・地域のApp Storeで公開中で、EU域内を含め利用可能です。Founder Proは両プラットフォームで有効です。",
    },
    {
      emoji: "🛠️",
      title: "直接の声",
      desc: "あなたが提案し、私が聞きます。Founderのリクエストがロードマップで優先されます。",
    },
  ],
  formTitle: "iPhoneでもFitMeshを使いたいですか？",
  formSub:
    "iOSアプリはすでに対応するすべての国・地域のApp Storeで公開中で、EU域内を含め利用可能です。メールアドレスを登録すると、お住まいの国でも利用可能になり次第お知らせします。",
  nextTitle: "仕組み",
  nextSteps: [
    {
      title: "Google Playからアプリをダウンロード",
      desc: "FitMesh Syncは公開中。申請書記入不要、承認待ち不要。",
    },
    {
      title: "アカウントを作成する",
      desc: "メールまたはGoogle Sign-In。先着1000名に含まれる場合、Proが自動的に有効になります：Proの画面に「Founder · Pro · Lifetime」と表示されます。",
    },
    {
      title: "永久Pro、縛りなし",
      desc: "カード不要、有効期限なし、自動更新なし。FounderのProは永久です。",
    },
    {
      title: "いつでもフィードバックをお送りください",
      desc: "バグやアイデア？ご連絡ください。次のリリースにFounderのリクエストを反映します。",
    },
  ],
  faqTitle: "よくある質問",
  faqs: [
    {
      q: "無料の永久Proには何が含まれますか？",
      a: "Proのすべて：14日間の無料体験を超えた無制限の履歴、ファミリーメッシュ、完全なデータエクスポート、そして将来リリースされるすべてのPro機能。有効期限なし。",
    },
    {
      q: "先着1000名に入っているか確認する方法は？",
      a: "アプリのPro画面を確認してください。Founder特典があなたのアカウントに付与されている場合、「Founder · Pro · Lifetime」と表示されます。サイトでは、集計が照合・検証されるまで公開カウンターを表示しなくなりました。",
    },
    {
      q: "Founder Proに有効期限はありますか？",
      a: "いいえ。Founder Proは永久です—有効期限なし、更新不要。FitMeshが存在する限り、あなたのものです。",
    },
    {
      q: "最初の100名のベータテスターはどうなりますか？",
      a: "クローズドベータのメンバーは、約束通り永久にProを維持します。1000席のFounderプログラムは、公開ローンチに連動した次のステップです。",
    },
    {
      q: "対応しているウェアラブルは？",
      a: "Health Connect対応のすべてのデバイス（Android 8以上）：Galaxy Watch 4/5/6/7/Ultra、Google Pixel Watch、Fitbit（Health Connect経由）、Garmin（Connect経由）、Polar、その他Health Connectに書き込む機器。Samsung Galaxy WatchはSamsung Healthの直接パスも利用できます。",
    },
    {
      q: "データはどのように扱われますか？",
      a: "健康データは欧州のサーバーに保管され、アカウントを通じてお客様のみがアクセスできます。第三者への販売・共有は一切ありません。詳細：fitmesh.fit/ja/privacy",
    },
    {
      q: "アカウントを削除できますか？",
      a: "はい、いつでも、アプリから直接またはprivacy@fitmesh.fitへのメールで可能です。社内の運用目標として、アカウントとすべてのデータを48時間以内に削除します。",
    },
  ],
};

const KO = {
  kicker: "Founder · 1000석",
  h1_a: "처음",
  h1_b: "1000명의 Founder",
  h1_c: "가 되어보세요",
  sub:
    "선발 없음, 대기 없음: 앱을 다운로드하고 계정을 생성하면 평생 Pro가 자동으로 활성화됩니다. 먼저 등록한 1000개 계정에 적용됩니다.",
  ctaNote: "카드 없음, 구독 없음: Pro는 영원히 당신의 것입니다.",
  perks: [
    {
      emoji: "🎁",
      title: "평생 Pro 무료",
      desc: "가입 시 자동 활성화. 무제한 기록, 패밀리 메시, 모든 Pro 기능 포함 — 영구적으로.",
    },
    {
      emoji: "⚡",
      title: "iOS에서도 이용 가능",
      desc: "iOS 앱은 이미 지원되는 모든 국가의 App Store에 출시되어 있으며, EU 지역을 포함하여 이용 가능합니다. Founder Pro는 두 플랫폼 모두에서 유효합니다.",
    },
    {
      emoji: "🛠️",
      title: "직접적인 목소리",
      desc: "제안하시면 반영됩니다. Founder가 요청한 기능이 로드맵에서 우선순위를 갖습니다.",
    },
  ],
  formTitle: "iPhone에서도 FitMesh를 원하시나요?",
  formSub:
    "iOS 앱은 이미 지원되는 모든 국가의 App Store에 출시되어 있으며, EU 지역을 포함하여 이용 가능합니다. 이메일을 남겨주시면 거주 국가에서도 이용 가능해지는 즉시 알려드립니다.",
  nextTitle: "이용 방법",
  nextSteps: [
    {
      title: "Google Play에서 앱 다운로드",
      desc: "FitMesh Sync가 출시되었습니다. 신청서 작성 불필요, 승인 대기 불필요.",
    },
    {
      title: "계정 생성",
      desc: "이메일 또는 Google Sign-In. 처음 1000명 안에 포함된다면 Pro가 자동으로 활성화됩니다: Pro 화면에 \"Founder · Pro · Lifetime\"이 표시됩니다.",
    },
    {
      title: "평생 Pro, 조건 없음",
      desc: "카드 없음, 만료일 없음, 자동 갱신 없음. Founder Pro는 영구적입니다.",
    },
    {
      title: "언제든지 피드백 보내기",
      desc: "버그나 아이디어? 연락해 주세요. 다음 릴리스에 Founder의 요청을 반영합니다.",
    },
  ],
  faqTitle: "자주 묻는 질문",
  faqs: [
    {
      q: "무료 평생 Pro에는 무엇이 포함되나요?",
      a: "Pro의 모든 것: 14일 무료 체험을 넘어서는 무제한 기록, 패밀리 메시, 전체 데이터 내보내기, 그리고 향후 출시되는 모든 Pro 기능. 만료일 없음.",
    },
    {
      q: "처음 1000명에 포함되었는지 어떻게 알 수 있나요?",
      a: "앱의 Pro 화면을 확인하세요. Founder 혜택이 계정에 부여되었다면 \"Founder · Pro · Lifetime\"이 표시됩니다. 집계가 검증되고 확인될 때까지 웹사이트에는 더 이상 공개 카운터가 표시되지 않습니다.",
    },
    {
      q: "Founder Pro는 만료되나요?",
      a: "아니요. Founder Pro는 영구적입니다 — 만료일 없음, 갱신 불필요. FitMesh가 존재하는 한 당신의 것입니다.",
    },
    {
      q: "처음 100명의 베타 테스터는요?",
      a: "약속대로 클로즈드 베타 멤버는 영구 Pro를 유지합니다. 1000석 Founder 프로그램은 공개 출시와 연계된 다음 단계입니다.",
    },
    {
      q: "어떤 웨어러블을 지원하나요?",
      a: "Health Connect와 호환되는 모든 기기 (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (Health Connect 경유), Garmin (Connect 경유), Polar, 그리고 Health Connect에 데이터를 쓰는 모든 기기. Samsung Galaxy Watch는 Samsung Health 직접 연동도 지원합니다.",
    },
    {
      q: "제 데이터는 어떻게 사용되나요?",
      a: "건강 데이터는 유럽 서버에 보관되며 계정을 통해 본인만 접근할 수 있습니다. 제3자에게 판매하거나 공유하지 않습니다. 자세한 내용: fitmesh.fit/ko/privacy",
    },
    {
      q: "계정을 삭제할 수 있나요?",
      a: "네, 언제든지 앱에서 직접 또는 privacy@fitmesh.fit으로 이메일을 보내시면 됩니다. 48시간 이내 삭제는 저희의 내부 운영 목표입니다.",
    },
  ],
};

/**
 * Sprint P0.10 — copy dell'archivio evergreen post-cutoff (31/07/2026
 * 22:00 UTC, FOUNDER_END_AT in lib/founder/program-window.ts). Stesse 8
 * locale compilate sopra (it/es/de/pt/fr/nl/ja/ko) + fallback en per le
 * altre, via tliClosed(). Deliberatamente piu' corta della copy IT/ES/...
 * sopra: niente step di iscrizione, niente form, FAQ ridotta a 2 domande
 * sullo stato del programma (le FAQ generiche su wearable/privacy/
 * cancellazione restano coperte altrove sul sito, non duplicate qui).
 */
const BETA_CLOSED_COPY: Record<string, BetaClosedCopy> = {
  it: {
    kicker: "Programma Founder",
    h1: "Il programma Founder è concluso",
    sub: "Le prime 1000 registrazioni hanno ricevuto Pro a vita gratis. Chi si è registrato in tempo mantiene il proprio Pro per sempre.",
    bullets: [
      { title: "Founder esistenti", desc: "Pro a vita, nessuna azione richiesta." },
      { title: "Nuovi account", desc: "Prova Pro gratuita di 14 giorni." },
      { title: "Dopo la prova", desc: "Abbonamento o sblocco a vita per continuare con Pro." },
    ],
    faqTitle: "Domande frequenti",
    faqs: [
      {
        q: "Posso ancora diventare Founder?",
        a: "No, il programma Founder si è chiuso il 31 luglio 2026. I nuovi account seguono la prova gratuita di 14 giorni e poi i piani a pagamento.",
      },
      {
        q: "Ero già Founder: il mio Pro a vita è ancora valido?",
        a: "Sì. Se hai ricevuto il Pro a vita da Founder prima della chiusura del programma, resta valido per sempre: non serve fare nulla.",
      },
    ],
  },
  es: {
    kicker: "Programa Founder",
    h1: "El programa Founder ha terminado",
    sub: "Las primeras 1000 cuentas recibieron Pro de por vida gratis. Quien se registró a tiempo conserva su Pro para siempre.",
    bullets: [
      { title: "Founders existentes", desc: "Pro de por vida, no se requiere ninguna acción." },
      { title: "Cuentas nuevas", desc: "Prueba gratuita de Pro de 14 días." },
      { title: "Después de la prueba", desc: "Suscripción o desbloqueo de por vida para seguir con Pro." },
    ],
    faqTitle: "Preguntas frecuentes",
    faqs: [
      {
        q: "¿Todavía puedo hacerme Founder?",
        a: "No, el programa Founder se cerró el 31 de julio de 2026. Las cuentas nuevas tienen la prueba gratuita estándar de 14 días y luego los planes de pago.",
      },
      {
        q: "Ya era Founder: ¿mi Pro de por vida sigue siendo válido?",
        a: "Sí. Si recibiste el Pro de por vida como Founder antes del cierre del programa, sigue siendo válido para siempre: no necesitas hacer nada.",
      },
    ],
  },
  de: {
    kicker: "Founder-Programm",
    h1: "Das Founder-Programm ist beendet",
    sub: "Die ersten 1000 Konten haben lebenslanges Pro gratis erhalten. Wer sich rechtzeitig registriert hat, behält sein Pro für immer.",
    bullets: [
      { title: "Bestehende Founder", desc: "Lebenslanges Pro, keine Aktion nötig." },
      { title: "Neue Konten", desc: "Kostenlose 14-tägige Pro-Testphase." },
      { title: "Nach der Testphase", desc: "Abo oder lebenslange Freischaltung, um Pro zu behalten." },
    ],
    faqTitle: "Häufige Fragen",
    faqs: [
      {
        q: "Kann ich noch Founder werden?",
        a: "Nein, das Founder-Programm wurde am 31. Juli 2026 geschlossen. Neue Konten erhalten die reguläre 14-tägige kostenlose Testphase und danach die kostenpflichtigen Pläne.",
      },
      {
        q: "Ich war bereits Founder: ist mein lebenslanges Pro noch gültig?",
        a: "Ja. Wenn du das lebenslange Pro als Founder vor dem Ende des Programms erhalten hast, bleibt es für immer gültig: du musst nichts tun.",
      },
    ],
  },
  pt: {
    kicker: "Programa Founder",
    h1: "O programa Founder terminou",
    sub: "As primeiras 1000 contas receberam Pro vitalício grátis. Quem se registou a tempo mantém o Pro para sempre.",
    bullets: [
      { title: "Founders existentes", desc: "Pro vitalício, sem necessidade de qualquer ação." },
      { title: "Novas contas", desc: "Teste gratuito de Pro de 14 dias." },
      { title: "Depois do teste", desc: "Assinatura ou desbloqueio vitalício para continuar com o Pro." },
    ],
    faqTitle: "Perguntas frequentes",
    faqs: [
      {
        q: "Ainda posso tornar-me Founder?",
        a: "Não, o programa Founder terminou a 31 de julho de 2026. As novas contas têm o teste gratuito padrão de 14 dias e depois os planos pagos.",
      },
      {
        q: "Já era Founder: o meu Pro vitalício continua válido?",
        a: "Sim. Se recebeste o Pro vitalício como Founder antes do encerramento do programa, continua válido para sempre: não precisas de fazer nada.",
      },
    ],
  },
  fr: {
    kicker: "Programme Founder",
    h1: "Le programme Founder est terminé",
    sub: "Les 1000 premiers comptes ont reçu le Pro à vie gratuitement. Toute personne inscrite à temps conserve son Pro pour toujours.",
    bullets: [
      { title: "Founders existants", desc: "Pro à vie, aucune action requise." },
      { title: "Nouveaux comptes", desc: "Essai gratuit de Pro de 14 jours." },
      { title: "Après l'essai", desc: "Abonnement ou déblocage à vie pour continuer avec Pro." },
    ],
    faqTitle: "Questions fréquentes",
    faqs: [
      {
        q: "Puis-je encore devenir Founder ?",
        a: "Non, le programme Founder s'est terminé le 31 juillet 2026. Les nouveaux comptes bénéficient de l'essai gratuit standard de 14 jours, puis des formules payantes.",
      },
      {
        q: "J'étais déjà Founder : mon Pro à vie est-il toujours valable ?",
        a: "Oui. Si vous avez reçu le Pro à vie en tant que Founder avant la fin du programme, il reste valable pour toujours : aucune action n'est nécessaire.",
      },
    ],
  },
  nl: {
    kicker: "Founder-programma",
    h1: "Het Founder-programma is beëindigd",
    sub: "De eerste 1000 accounts kregen Pro voor altijd gratis. Wie op tijd was, houdt zijn Pro voor altijd.",
    bullets: [
      { title: "Bestaande founders", desc: "Pro voor altijd, geen actie nodig." },
      { title: "Nieuwe accounts", desc: "Gratis proefperiode van 14 dagen voor Pro." },
      { title: "Na de proefperiode", desc: "Abonnement of levenslange ontgrendeling om Pro te behouden." },
    ],
    faqTitle: "Veelgestelde vragen",
    faqs: [
      {
        q: "Kan ik nog founder worden?",
        a: "Nee, het Founder-programma is op 31 juli 2026 gesloten. Nieuwe accounts krijgen de standaard gratis proefperiode van 14 dagen en daarna de betaalde abonnementen.",
      },
      {
        q: "Ik was al founder: is mijn Pro voor altijd nog geldig?",
        a: "Ja. Als je als founder Pro voor altijd hebt gekregen vóór de sluiting van het programma, blijft dit voor altijd geldig: je hoeft niets te doen.",
      },
    ],
  },
  ja: {
    kicker: "ファウンダープログラム",
    h1: "ファウンダープログラムは終了しました",
    sub: "先着1000アカウントにPro永久ライセンスが無料で付与されました。期限内に登録した方はProを永久にご利用いただけます。",
    bullets: [
      { title: "既存のファウンダー", desc: "Pro永久ライセンス、追加の操作は不要です。" },
      { title: "新規アカウント", desc: "14日間の無料Proトライアル。" },
      { title: "トライアル終了後", desc: "サブスクリプションまたは買い切りでProを継続。" },
    ],
    faqTitle: "よくある質問",
    faqs: [
      {
        q: "まだファウンダーになれますか？",
        a: "いいえ、ファウンダープログラムは2026年7月31日に終了しました。新規アカウントは通常の14日間無料トライアルの後、有料プランに移行します。",
      },
      {
        q: "すでにファウンダーでした。永久Proライセンスは有効ですか？",
        a: "はい。プログラム終了前にファウンダーとして永久Proライセンスを受け取った場合、そのライセンスは永久に有効です。特別な操作は必要ありません。",
      },
    ],
  },
  ko: {
    kicker: "파운더 프로그램",
    h1: "파운더 프로그램이 종료되었습니다",
    sub: "처음 1000개 계정은 평생 Pro를 무료로 받았습니다. 기한 내에 등록한 분은 Pro를 영구적으로 유지합니다.",
    bullets: [
      { title: "기존 파운더", desc: "평생 Pro, 추가 조치가 필요하지 않습니다." },
      { title: "신규 계정", desc: "14일 무료 Pro 체험." },
      { title: "체험 종료 후", desc: "구독 또는 평생 잠금 해제로 Pro를 계속 이용." },
    ],
    faqTitle: "자주 묻는 질문",
    faqs: [
      {
        q: "아직 파운더가 될 수 있나요?",
        a: "아니요, 파운더 프로그램은 2026년 7월 31일에 종료되었습니다. 신규 계정은 표준 14일 무료 체험 후 유료 요금제를 이용합니다.",
      },
      {
        q: "이미 파운더였는데, 평생 Pro가 계속 유효한가요?",
        a: "네. 프로그램 종료 전에 파운더로 평생 Pro를 받았다면 영구히 유효합니다. 별도 조치가 필요하지 않습니다.",
      },
    ],
  },
  en: {
    kicker: "Founder program",
    h1: "The Founder program has ended",
    sub: "The first 1,000 sign-ups received lifetime Pro for free. Anyone who registered in time keeps their Pro forever.",
    bullets: [
      { title: "Existing founders", desc: "Lifetime Pro, no action needed." },
      { title: "New accounts", desc: "A free 14-day Pro trial." },
      { title: "After the trial", desc: "Subscribe or unlock lifetime to keep Pro." },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      {
        q: "Can I still become a Founder?",
        a: "No, the Founder program closed on July 31, 2026. New accounts get the standard 14-day free trial, then paid plans.",
      },
      {
        q: "I was already a Founder: is my lifetime Pro still valid?",
        a: "Yes. If you received lifetime Pro as a Founder before the program closed, it remains valid forever: no action needed.",
      },
    ],
  },
};
