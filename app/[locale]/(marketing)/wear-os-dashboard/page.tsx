import type { Metadata } from "next";

import StrengthsLanding from "@/components/landings/StrengthsLanding";
import { locales, type Locale } from "@/lib/i18n";

const SITE_URL = "https://www.fitmesh.fit";
const SLUG = "wear-os-dashboard";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const titles: Record<Locale, string> = {
    it: "Dashboard personale per Wear OS — FitMesh Sync",
    en: "Personal dashboard for Wear OS — FitMesh Sync",
  };
  const desc: Record<Locale, string> = {
    it: "Una dashboard premium per smartwatch Wear OS: Pixel Watch, OnePlus Watch, Mobvoi TicWatch. Passi, sonno, battito, allenamenti via Health Connect — privacy-first, niente cloud opachi.",
    en: "A premium dashboard for Wear OS smartwatches: Pixel Watch, OnePlus Watch, Mobvoi TicWatch. Steps, sleep, heart rate, workouts via Health Connect — privacy-first, no opaque clouds.",
  };
  return {
    title: titles[lc],
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/${SLUG}`,
      languages: {
        it: `${SITE_URL}/it/${SLUG}`,
        en: `${SITE_URL}/en/${SLUG}`,
        "x-default": `${SITE_URL}/it/${SLUG}`,
      },
    },
    openGraph: {
      title: titles[lc],
      description: desc[lc],
      url: `${SITE_URL}/${lc}/${SLUG}`,
      type: "website",
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const isIt = lc === "it";

  if (isIt) {
    return (
      <StrengthsLanding
        locale={lc}
        slug={SLUG}
        kicker="Wear OS dashboard"
        h1="Una dashboard premium per il tuo smartwatch Wear OS."
        sub="Pixel Watch, OnePlus Watch, Mobvoi TicWatch e tutti gli altri Wear OS: i tuoi dati salute in una dashboard personale unica — privacy-first, multi-device, niente account social obbligatori."
        painTitle="L'ecosistema Wear OS è frammentato — i tuoi dati lo seguono"
        painBody="Ogni brand Wear OS ha la sua app companion che scrive (a volte) su Health Connect. I dati sono lì ma servono 3 app diverse per vederli, con grafici poveri e UI che cambiano. FitMesh raccoglie tutto in un'unica dashboard senza dover scegliere un solo brand."
        pillars={[
          {
            icon: "🌐",
            title: "Multi-source via Health Connect",
            body: "Qualsiasi orologio Wear OS che scrive su Health Connect è automaticamente leggibile da FitMesh. Cambi orologio? La dashboard continua a funzionare con la nuova sorgente, storico incluso.",
          },
          {
            icon: "🔒",
            title: "Privacy by design",
            body: "I tuoi dati non passano da cloud di terze parti. Vanno direttamente dal telefono al nostro backend in EU. Mai venduti, mai condivisi.",
          },
          {
            icon: "📊",
            title: "Grafici intraday + sleep stages",
            body: "FC ora-per-ora, fasi del sonno, sforzo qualitativo per sessione calcolato sulla tua FC max stimata, splits per km. Stesso dettaglio delle piattaforme premium.",
          },
          {
            icon: "🚀",
            title: "Veloce e leggero",
            body: "Sync in background efficiente (≈1-2% batteria/giorno). App nativa ottimizzata: apertura <1s, swipe fluido tra giorni e periodi.",
          },
        ]}
        howTitle="Come funziona"
        howBody="Health Connect è l'hub salute di Google su Android. Quando il tuo smartwatch Wear OS sincronizza dati (passi, FC, sonno, sessioni di allenamento), li scrive su Health Connect. FitMesh Sync li legge da lì, li invia al backend EU e li mostra in dashboard. Niente integrazioni separate per brand, niente account multipli."
        faqTitle="Domande frequenti"
        faqs={[
          {
            q: "Quali smartwatch Wear OS sono supportati?",
            a: "Tutti i dispositivi Wear OS 3+ che scrivono su Health Connect: Pixel Watch 1/2/3, OnePlus Watch 2, Mobvoi TicWatch Pro 5, Mobvoi TicWatch Atlas, e altri. Vedi la pagina Device supportati per la lista completa con dettaglio metriche.",
          },
          {
            q: "Funziona anche se l'orologio non scrive su Health Connect?",
            a: "L'app companion del tuo orologio deve scrivere su Health Connect — è la condizione necessaria. La maggior parte dei brand Wear OS moderni lo fa. Per orologi più vecchi o esotici, controlla la pagina Device.",
          },
          {
            q: "Posso usare contemporaneamente Galaxy Watch + Pixel Watch?",
            a: "Sì. FitMesh dedupla automaticamente i record sovrapposti dei due dispositivi e ti permette di scegliere quale sorgente preferire per metrica (es. passi da Pixel, sonno da Galaxy).",
          },
          {
            q: "Cosa succede se cambio smartwatch?",
            a: "Lo storico precedente resta. I nuovi dati vengono dalla nuova sorgente. Niente migrazione, niente import manuale — funziona automaticamente perché tutto passa da Health Connect.",
          },
          {
            q: "Devo lasciare l'app Google Fit installata?",
            a: "No. FitMesh legge direttamente da Health Connect, non da Google Fit. Se vuoi puoi disinstallare Google Fit (Health Connect è separato e nativo Android dal 14 in poi).",
          },
        ]}
        ctaTitle="Provalo in beta — gratis a vita per i primi 100"
        ctaBody="Stiamo aprendo l'accesso a 100 founder. Tutte le feature sbloccate, niente paywall mai. Se hai un Pixel Watch o qualsiasi Wear OS, sei tra i primi a poter testare."
        ctaPrimary="Diventa founder"
        ctaSecondary={{ label: "Vedi i device supportati", href: `/${lc}/devices` }}
        crumbName="Wear OS dashboard"
      />
    );
  }

  return (
    <StrengthsLanding
      locale={lc}
      slug={SLUG}
      kicker="Wear OS dashboard"
      h1="A premium dashboard for your Wear OS smartwatch."
      sub="Pixel Watch, OnePlus Watch, Mobvoi TicWatch and every other Wear OS: your health data in one personal dashboard — privacy-first, multi-device, no mandatory social accounts."
      painTitle="The Wear OS ecosystem is fragmented — your data shouldn't follow"
      painBody="Every Wear OS brand has its own companion app that (sometimes) writes to Health Connect. Data is there but you need 3 different apps to see it, with poor charts and shifting UIs. FitMesh aggregates everything into a single dashboard without forcing you to pick one brand."
      pillars={[
        {
          icon: "🌐",
          title: "Multi-source via Health Connect",
          body: "Any Wear OS watch that writes to Health Connect is automatically readable by FitMesh. Swap watches? The dashboard keeps working with the new source, history included.",
        },
        {
          icon: "🔒",
          title: "Privacy by design",
          body: "Your data doesn't pass through third-party clouds. It goes straight from phone to our EU backend. Never sold, never shared.",
        },
        {
          icon: "📊",
          title: "Intraday charts + sleep stages",
          body: "Hour-by-hour HR, sleep stages, qualitative session effort computed against your estimated max HR, splits per km. Premium-platform detail.",
        },
        {
          icon: "🚀",
          title: "Fast and lightweight",
          body: "Efficient background sync (≈1-2% battery/day). Native app optimized: <1s open time, fluid swipe between days and periods.",
        },
      ]}
      howTitle="How it works"
      howBody="Health Connect is Google's health data hub on Android. When your Wear OS watch syncs data (steps, HR, sleep, training sessions), it writes to Health Connect. FitMesh Sync reads from there, sends data to the EU backend, and visualizes it in the dashboard. No per-brand integrations, no multiple accounts."
      faqTitle="FAQ"
      faqs={[
        {
          q: "Which Wear OS smartwatches are supported?",
          a: "All Wear OS 3+ devices that write to Health Connect: Pixel Watch 1/2/3, OnePlus Watch 2, Mobvoi TicWatch Pro 5, Mobvoi TicWatch Atlas, and others. See the Supported devices page for the full list with metric details.",
        },
        {
          q: "Does it work if my watch doesn't write to Health Connect?",
          a: "The companion app must write to Health Connect — that's the necessary condition. Most modern Wear OS brands do. For older or exotic watches, check the Devices page.",
        },
        {
          q: "Can I use both Galaxy Watch + Pixel Watch?",
          a: "Yes. FitMesh automatically dedupes overlapping records from the two devices and lets you pick the preferred source per metric (e.g. steps from Pixel, sleep from Galaxy).",
        },
        {
          q: "What happens if I switch smartwatches?",
          a: "Past history stays. New data comes from the new source. No migration, no manual import — it works automatically because everything goes through Health Connect.",
        },
        {
          q: "Do I need to keep Google Fit installed?",
          a: "No. FitMesh reads directly from Health Connect, not from Google Fit. You can uninstall Google Fit if you want (Health Connect is separate and native to Android 14+).",
        },
      ]}
      ctaTitle="Try it in beta — free for life for the first 100"
      ctaBody="We're opening access to 100 founders. All features unlocked, no paywall ever. If you have a Pixel Watch or any Wear OS, you're among the first to test."
      ctaPrimary="Become a founder"
      ctaSecondary={{ label: "See supported devices", href: `/${lc}/devices` }}
      crumbName="Wear OS dashboard"
    />
  );
}
