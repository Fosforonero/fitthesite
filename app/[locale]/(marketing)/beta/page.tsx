import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BetaSignupForm from "@/components/BetaSignupForm";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import TrustBadges from "@/components/TrustBadges";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { locales, type Locale, ogLocale } from "@/lib/i18n";

const SITE_URL = "https://www.fitmesh.fit";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  const title =
    lc === "it"
      ? "FitMesh Sync Founder — 1 anno di Pro gratis ai primi 1000"
      : "FitMesh Sync Founder — 1 year of Pro free for the first 1000";
  const description =
    lc === "it"
      ? "Scarica FitMesh Sync da Google Play e crea l'account: i primi 1000 ricevono un anno di Pro completo in regalo, attivato automaticamente. Più accesso prioritario alla versione iOS."
      : "Download FitMesh Sync on Google Play and create your account: the first 1000 get a full year of Pro free, activated automatically. Plus priority access to the iOS version.";

  const path = `/${lc}/beta`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/beta`,
        en: `${SITE_URL}/en/beta`,
        "x-default": `${SITE_URL}/it/beta`,
      },
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
    robots: { index: true, follow: true },
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

  const t = lc === "it" ? IT : EN;

  return (
    // <div> e non <main>: il layout (marketing)/layout.tsx wrappa gia' i
    // children in un <main>. Nesting di landmark rompe WCAG e da'
    // comportamenti incerti agli screen reader iOS/Android.
    <div className="relative overflow-hidden pb-32 pt-20 text-text-primary md:pt-28">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t.metaTitle,
          description: t.metaDesc,
          url: `${SITE_URL}/${lc}/beta`,
        }}
      />

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
            <StoreButtonsRow locale={lc} />
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
            {lc === "it" ? "Processo" : "Process"}
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

        {/* Form — riposizionato: lista d'attesa iOS (i founder hanno priorità) */}
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
      </div>
    </div>
  );
}

const IT = {
  metaTitle: "FitMesh Sync Founder — 1 anno di Pro gratis ai primi 1000",
  metaDesc:
    "Scarica l'app, crea l'account: i primi 1000 ricevono un anno di Pro completo, attivato automaticamente. Più accesso prioritario a iOS.",
  kicker: "Founder · 1000 posti",
  h1_a: "Diventa uno dei primi",
  h1_b: "1000 founder",
  h1_c: "di FitMesh Sync",
  sub:
    "Nessuna selezione, nessuna attesa: scarichi l'app, crei l'account e un anno di Pro completo si attiva da solo. Vale per i primi 1000 account registrati.",
  ctaNote: "Niente carta, niente abbonamento: alla scadenza non paghi nulla.",
  perks: [
    {
      emoji: "🎁",
      title: "1 anno di Pro gratis",
      desc: "Si attiva automaticamente alla registrazione. Storico illimitato, Mesh Famiglia, tutte le feature Pro incluse.",
    },
    {
      emoji: "⚡",
      title: "Primo su iOS",
      desc: "Android è già live. I founder ricevono l'accesso alla versione iOS non appena esce, prima di chiunque altro.",
    },
    {
      emoji: "🛠️",
      title: "Voce diretta",
      desc: "Tu suggerisci, io ascolto. Le feature più richieste dai founder hanno priorità nella roadmap.",
    },
  ],
  formTitle: "Vuoi FitMesh anche su iPhone?",
  formSub:
    "Lascia l'email e ti avviso al lancio iOS — i founder hanno accesso prioritario alla prima build.",
  nextTitle: "Come funziona",
  nextSteps: [
    {
      title: "Scarichi l'app da Google Play",
      desc: "FitMesh Sync è live. Nessuna richiesta da compilare, nessuna approvazione da aspettare.",
    },
    {
      title: "Crei l'account",
      desc: "Email o Google Sign-In. Se sei tra i primi 1000, il Pro si attiva da solo: nella schermata Pro vedi \"Founder · Pro fino al [data]\".",
    },
    {
      title: "Un anno di Pro completo, senza vincoli",
      desc: "Niente carta, niente rinnovo automatico. Alla scadenza scegli tu: resti sul piano gratuito o passi a Pro (€1,19/6 mesi).",
    },
    {
      title: "Mi mandi feedback quando vuoi",
      desc: "Bug o idee? Scrivimi. Le release seguenti includono le richieste dei founder.",
    },
  ],
  faqTitle: "Domande frequenti",
  faqs: [
    {
      q: "Cosa include l'anno di Pro gratis?",
      a: "Tutto quello che include Pro: storico illimitato (oltre i 14 giorni del piano free), Mesh Famiglia, esportazione dati completa e tutte le feature Pro che usciranno durante l'anno. Per 12 mesi dalla registrazione.",
    },
    {
      q: "Come so se sono tra i primi 1000?",
      a: "Il contatore in homepage mostra i posti rimasti in tempo reale. In ogni caso lo vedi subito nell'app: se il grant è attivo, la schermata Pro mostra \"Founder · Pro fino al [data]\".",
    },
    {
      q: "Cosa succede alla scadenza dell'anno?",
      a: "Nessun addebito: non chiediamo la carta. L'account passa semplicemente al piano gratuito (ultimi 14 giorni di storico). Se vuoi continuare con Pro: €1,19 ogni 6 mesi o acquisto unico (€3,99 su Android · €4,99 su iPhone).",
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
      a: "Sì, in qualsiasi momento, direttamente dall'app o scrivendo a privacy@fitmesh.fit. Cancelliamo account e dati entro 48h, come previsto dal GDPR.",
    },
  ],
};

const EN = {
  metaTitle: "FitMesh Sync Founder — 1 year of Pro free for the first 1000",
  metaDesc:
    "Download the app, create your account: the first 1000 get a full year of Pro, activated automatically. Plus priority iOS access.",
  kicker: "Founder · 1000 seats",
  h1_a: "Become one of the first",
  h1_b: "1000 founders",
  h1_c: "of FitMesh Sync",
  sub:
    "No selection, no waiting: download the app, create your account, and a full year of Pro activates by itself. Valid for the first 1000 registered accounts.",
  ctaNote: "No card, no subscription: when the year ends you pay nothing.",
  perks: [
    {
      emoji: "🎁",
      title: "1 year of Pro free",
      desc: "Activates automatically at sign-up. Unlimited history, Family Mesh, every Pro feature included.",
    },
    {
      emoji: "⚡",
      title: "First on iOS",
      desc: "Android is already live. Founders get iOS access the moment it launches, before anyone else.",
    },
    {
      emoji: "🛠️",
      title: "Direct voice",
      desc: "You suggest, I listen. Founder-requested features take priority in the roadmap.",
    },
  ],
  formTitle: "Want FitMesh on iPhone too?",
  formSub:
    "Leave your email and I'll ping you at iOS launch — founders get priority access to the first build.",
  nextTitle: "How it works",
  nextSteps: [
    {
      title: "Download the app from Google Play",
      desc: "FitMesh Sync is live. No application to fill in, no approval to wait for.",
    },
    {
      title: "Create your account",
      desc: "Email or Google Sign-In. If you're among the first 1000, Pro activates by itself: the Pro screen shows \"Founder · Pro until [date]\".",
    },
    {
      title: "A full year of Pro, no strings",
      desc: "No card, no auto-renewal. When it expires you choose: stay on the free plan or go Pro (€1.19/6 months).",
    },
    {
      title: "Send feedback whenever you like",
      desc: "Bugs or ideas? Write me. Following releases ship founder requests.",
    },
  ],
  faqTitle: "FAQ",
  faqs: [
    {
      q: "What does the free Pro year include?",
      a: "Everything Pro includes: unlimited history (beyond the free plan's 14 days), Family Mesh, full data export, and every Pro feature shipped during the year. For 12 months from sign-up.",
    },
    {
      q: "How do I know if I'm in the first 1000?",
      a: "The homepage counter shows remaining seats in real time. Either way you'll see it in the app: if the grant is active, the Pro screen shows \"Founder · Pro until [date]\".",
    },
    {
      q: "What happens when the year ends?",
      a: "No charge: we never ask for a card. Your account simply moves to the free plan (last 14 days of history). To keep Pro: €1.19 every 6 months or one-time (€3.99 on Android · €4.99 on iPhone).",
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
      a: "Yes, anytime, directly from the app or by writing to privacy@fitmesh.fit. We delete the account and all data within 48h, as required by GDPR.",
    },
  ],
};
