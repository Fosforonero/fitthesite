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
    <main className="relative overflow-hidden bg-bg pb-32 pt-24 text-text-primary md:pt-32">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t.metaTitle,
          description: t.metaDesc,
          url: `${SITE_URL}/${lc}/beta`,
        }}
      />

      {/* Glow background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-gradient-to-b from-accent/10 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -left-32 top-40 -z-10 h-96 w-96 rounded-full bg-accent-2/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-80 -z-10 h-96 w-96 rounded-full bg-accent-3/20 blur-3xl" />

      <div className="mx-auto max-w-3xl px-6">
        <Breadcrumbs
          locale={lc}
          items={[{ name: "Beta", path: `/${lc}/beta` }]}
        />

        {/* Hero */}
        <header className="mb-16 mt-8 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-accent">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            {t.kicker}
          </div>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            {t.h1_a}{" "}
            <span className="bg-gradient-to-r from-accent-2 via-accent to-accent-3 bg-clip-text text-transparent">
              {t.h1_b}
            </span>
            {t.h1_c && <> {t.h1_c}</>}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary md:text-xl">
            {t.sub}
          </p>
        </header>

        {/* Perks */}
        <section className="mb-16 grid gap-4 sm:grid-cols-3">
          {t.perks.map((perk) => (
            <div
              key={perk.title}
              className="rounded-2xl border border-bg-elevated bg-bg-elevated/40 p-5"
            >
              <div className="mb-2 text-2xl">{perk.emoji}</div>
              <h3 className="mb-1 font-semibold text-text-primary">{perk.title}</h3>
              <p className="text-sm text-text-secondary">{perk.desc}</p>
            </div>
          ))}
        </section>

        {/* Form */}
        <section className="rounded-3xl border border-bg-elevated bg-bg-elevated/30 p-8 md:p-10">
          <h2 className="mb-2 text-2xl font-bold text-text-primary">{t.formTitle}</h2>
          <p className="mb-8 text-text-secondary">{t.formSub}</p>
          <BetaSignupForm locale={lc} />
        </section>

        {/* What happens next */}
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-text-primary">{t.nextTitle}</h2>
          <ol className="space-y-4">
            {t.nextSteps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-sm font-bold text-accent">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{step.title}</h3>
                  <p className="text-sm text-text-secondary">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-text-primary">{t.faqTitle}</h2>
          <div className="space-y-4">
            {t.faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-bg-elevated bg-bg-elevated/30 p-5"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium text-text-primary">
                  {faq.q}
                  <span className="text-accent transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
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
      a: "Significa che quando aprirò i pagamenti (€3,99 acquisto unico, €0,99/6 mesi), il tuo account avrà un flag founder=true e non vedrà mai un paywall. Anche le feature Pro future (es. sync iOS, family monitoring) saranno incluse senza limiti né scadenza.",
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
      a: "Niente di strano. I dati di salute restano sul tuo telefono + un mirror cifrato sul nostro backend (Supabase, Frankfurt UE) accessibile solo a te tramite il tuo login. Mai venduti, mai usati per AI training, mai condivisi con terzi. Privacy Policy completa: fitmesh.fit/it/privacy",
    },
    {
      q: "Posso disiscrivermi?",
      a: "Sì, in qualsiasi momento, scrivendo a mat.pizzi@gmail.com. Cancello l'account + tutti i dati entro 48h.",
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
      a: "When I open payments (€3.99 one-time, €0.99/6mo), your account gets a founder=true flag and never sees a paywall. Future Pro features (e.g. iOS sync, family monitoring) are included with no limits or expiry.",
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
      a: "Nothing weird. Health data stays on your phone + an encrypted mirror on our backend (Supabase, Frankfurt EU) accessible only to you via your login. Never sold, never used for AI training, never shared with third parties. Full Privacy Policy: fitmesh.fit/en/privacy",
    },
    {
      q: "Can I unsubscribe?",
      a: "Yes, anytime, by writing to mat.pizzi@gmail.com. I delete the account + all data within 48h.",
    },
  ],
};
