import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BetaSignupForm from "@/components/BetaSignupForm";
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
      ? "FitMesh Sync Beta — 100 founder gratis per sempre"
      : "FitMesh Sync Beta — 100 founders, free forever";
  const description =
    lc === "it"
      ? "Diventa uno dei primi 100 founder di FitMesh Sync. Ricevi l'app prima del lancio pubblico, sblocchi tutte le feature gratis a vita, ci aiuti a renderla migliore."
      : "Become one of the first 100 founders of FitMesh Sync. Get the app before public launch, all features unlocked free forever, and help us make it better.";

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
          items={[{ name: "Beta", path: `/${lc}/beta` }]}
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

        {/* Form — promosso a card-glass per essere il focus */}
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

        {/* What happens next */}
        <section className="mt-20" data-reveal>
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
  metaTitle: "FitMesh Sync Beta — 100 founder gratis per sempre",
  metaDesc:
    "Diventa uno dei primi 100 founder di FitMesh Sync. App prima del lancio + tutte le feature gratis a vita.",
  kicker: "Beta privata · 100 posti",
  h1_a: "Diventa uno dei primi",
  h1_b: "100 founder",
  h1_c: "di FitMesh Sync",
  sub:
    "Accesso anticipato all'app, tutte le feature sbloccate per sempre, e il tuo nome nella lista dei pionieri che hanno reso FitMesh quello che diventerà.",
  perks: [
    {
      emoji: "🎁",
      title: "Free for life",
      desc: "Mai più paywall. Tutte le feature presenti e future incluse, anche €3,99 Pro.",
    },
    {
      emoji: "⚡",
      title: "Accesso anticipato",
      desc: "Hai l'app prima di tutti, mesi prima del lancio pubblico sul Play Store.",
    },
    {
      emoji: "🛠️",
      title: "Voce diretta",
      desc: "Tu suggerisci, io ascolto. Le feature più richieste dai founder hanno priorità.",
    },
  ],
  formTitle: "Richiedi un posto founder",
  formSub: "Compila i campi qui sotto. Ti contatto entro 48h se ti includo nei 100.",
  nextTitle: "Cosa succede dopo",
  nextSteps: [
    {
      title: "Ti rispondo via email entro 48h",
      desc: "Conferma se sei tra i 100 (o se la lista è piena ti metto in lista d'attesa).",
    },
    {
      title: "Aggiungo la tua email Google alla lista Closed Beta",
      desc: "Riceverai un link Play Store per installare FitMesh Sync. Funziona solo con la tua email Google.",
    },
    {
      title: "Installi l'app, ti registri, sblocchi tutto",
      desc: "Al primo login l'app riconosce che sei founder e disabilita il paywall a vita.",
    },
    {
      title: "Usi l'app e mi mandi feedback",
      desc: "Quando trovi bug o hai idee, mi scrivi (email/Telegram). Le release seguenti includono le tue richieste.",
    },
  ],
  faqTitle: "Domande frequenti",
  faqs: [
    {
      q: "Cosa significa esattamente 'gratis per sempre'?",
      a: "Significa che quando aprirò i pagamenti (€3,99 acquisto unico, €1,19/6 mesi), il tuo account avrà un flag founder=true e non vedrà mai un paywall. Anche le feature Pro future (es. sync iOS, family monitoring) saranno incluse senza limiti né scadenza.",
    },
    {
      q: "Perché ti serve la mia email Google e non solo quella di contatto?",
      a: "Google Play Closed Testing funziona per email-allowlist: solo le email aggiunte alla lista 'tester' possono installare l'app. Se la tua email personale è diversa dall'account Google del telefono, ho bisogno di entrambe.",
    },
    {
      q: "Quando esce la Beta?",
      a: "L'AAB è già pronto e questa settimana lo carico su Google Play Closed Testing. Da quel momento aggiungo i founder a batch, man mano che approvo le richieste.",
    },
    {
      q: "E se non vengo selezionato?",
      a: "Ti metto in lista d'attesa. Se un founder esce dalla beta o se passiamo a Open Testing (illimitato), sei tra i primi a essere chiamato. In ogni caso al lancio pubblico hai diritto a uno sconto founder.",
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
      q: "Posso disiscrivermi?",
      a: "Sì, in qualsiasi momento, scrivendo a privacy@fitmesh.fit. Cancelliamo l'account e tutti i dati entro 48h, come previsto dal GDPR.",
    },
  ],
};

const EN = {
  metaTitle: "FitMesh Sync Beta — 100 founders, free forever",
  metaDesc:
    "Become one of the first 100 founders of FitMesh Sync. Early access + all features free for life.",
  kicker: "Private beta · 100 spots",
  h1_a: "Become one of the first",
  h1_b: "100 founders",
  h1_c: "of FitMesh Sync",
  sub:
    "Early access to the app, all features unlocked forever, and your name on the list of pioneers who shaped what FitMesh will become.",
  perks: [
    {
      emoji: "🎁",
      title: "Free for life",
      desc: "No more paywall. All current and future features included, even €3.99 Pro.",
    },
    {
      emoji: "⚡",
      title: "Early access",
      desc: "Get the app before anyone, months before public launch on the Play Store.",
    },
    {
      emoji: "🛠️",
      title: "Direct voice",
      desc: "You suggest, I listen. Founder-requested features take priority in the roadmap.",
    },
  ],
  formTitle: "Claim a founder spot",
  formSub: "Fill in the form below. I'll get back to you within 48h if you make the 100.",
  nextTitle: "What happens next",
  nextSteps: [
    {
      title: "I'll email you within 48h",
      desc: "Confirms whether you made the 100 (or puts you on the waiting list if full).",
    },
    {
      title: "I add your Google email to the Closed Beta list",
      desc: "You'll get a Play Store link to install FitMesh Sync. Works only with your Google email.",
    },
    {
      title: "You install the app, sign up, unlock everything",
      desc: "On first login the app detects you're a founder and disables paywall for life.",
    },
    {
      title: "You use the app and send feedback",
      desc: "When you find bugs or have ideas, write me (email/Telegram). Next releases ship your requests.",
    },
  ],
  faqTitle: "FAQ",
  faqs: [
    {
      q: "What does 'free forever' actually mean?",
      a: "When I open payments (€3.99 one-time, €1.19/6mo), your account gets a founder=true flag and never sees a paywall. Future Pro features (e.g. iOS sync, family monitoring) are included with no limits or expiry.",
    },
    {
      q: "Why do you need my Google email separately from the contact email?",
      a: "Google Play Closed Testing works as an email-allowlist: only emails added to the 'tester' list can install the app. If your personal email differs from your phone's Google account, I need both.",
    },
    {
      q: "When does the Beta launch?",
      a: "The AAB is ready and this week I'm uploading it to Google Play Closed Testing. From there I add founders in batches as I approve requests.",
    },
    {
      q: "What if I'm not selected?",
      a: "I put you on the waiting list. If a founder drops off or we move to Open Testing (unlimited), you're first in line. Either way at public launch you'll get a founder discount.",
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
      q: "Can I unsubscribe?",
      a: "Yes, anytime, by writing to privacy@fitmesh.fit. We delete the account and all data within 48h, as required by GDPR.",
    },
  ],
};
