import type { Metadata } from "next";

import StrengthsLanding from "@/components/landings/StrengthsLanding";
import { locales, type Locale } from "@/lib/i18n";

const SITE_URL = "https://www.fitmesh.fit";
const SLUG = "dashboard-galaxy-watch";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const titles: Record<Locale, string> = {
    it: "Dashboard personale per Galaxy Watch — FitMesh Sync",
    en: "Personal dashboard for Galaxy Watch — FitMesh Sync",
  };
  const desc: Record<Locale, string> = {
    it: "Una dashboard premium privacy-first per il tuo Galaxy Watch 4/5/6/7/Ultra. Passi, sonno, battito, allenamenti, VO₂ max — sincronizzati e visualizzati su web e app, senza cloud opachi.",
    en: "A privacy-first premium dashboard for your Galaxy Watch 4/5/6/7/Ultra. Steps, sleep, heart rate, workouts, VO₂ max — synced and visualized on web and app, without opaque clouds.",
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
        kicker="Galaxy Watch dashboard"
        h1="La dashboard premium per il tuo Galaxy Watch."
        sub="Tutti i dati del tuo Galaxy Watch in un'unica dashboard personale — passi, sonno, battito, sforzo, VO₂ max — accessibile da web e app, senza cloud opachi e senza pubblicità."
        painTitle="Dati frammentati, app pesanti, privacy a metà"
        painBody="I dati del tuo orologio sono spesso bloccati dentro app proprietarie che cambiano interfaccia ogni 6 mesi, vendono telemetria a terze parti e ti chiedono un account per ogni metrica. Tu vuoi solo vedere i tuoi numeri, senza intermediari."
        pillars={[
          {
            icon: "🔒",
            title: "Privacy-first",
            body: "I tuoi dati salute vivono sul tuo server (o su Supabase Postgres EU se preferisci). Niente cloud opachi, niente vendita di telemetria, niente tracker pubblicitari.",
          },
          {
            icon: "📊",
            title: "Dashboard nativa premium",
            body: "Grafici intraday del battito, fasi del sonno, sforzo qualitativo per workout, splits per km. Stesso livello di dettaglio delle app top, in interfaccia tua.",
          },
          {
            icon: "🔄",
            title: "Integrazione Samsung Health diretta",
            body: "FitMesh legge sia da Samsung Health SDK sia da Health Connect. Per Galaxy Watch ottieni il massimo: SpO₂, HRV notturna, temperatura pelle, fasi sonno complete.",
          },
          {
            icon: "💸",
            title: "Acquisto unico €3,99",
            body: "Niente abbonamento, niente rinnovo automatico. Paghi una volta, l'app è tua per sempre. I primi 100 founder hanno tutto gratis a vita.",
          },
        ]}
        howTitle="Come funziona"
        howBody="FitMesh Sync legge i dati del tuo Galaxy Watch dal Samsung Health Data SDK (integrazione nativa) o da Health Connect (l'hub di salute Android). I dati vengono sincronizzati sul tuo server e visualizzati nella dashboard. Niente di più — niente social network, niente challenge forzate, niente notifiche pushy. Solo i tuoi numeri."
        faqTitle="Domande frequenti"
        faqs={[
          {
            q: "Quali modelli di Galaxy Watch sono supportati?",
            a: "Galaxy Watch 4, 5, 6, 7 e Ultra, oltre alla Galaxy Fit3. Tutti i modelli che usano Samsung Health come companion app sono supportati.",
          },
          {
            q: "Devo installare app aggiuntive sull'orologio?",
            a: "No. FitMesh Sync è solo sul telefono. Si occupa di leggere dai dati che Samsung Health già raccoglie dal tuo orologio e li mostra nella nostra dashboard.",
          },
          {
            q: "Posso scegliere quali metriche sincronizzare?",
            a: "Sì. Nelle impostazioni puoi attivare/disattivare singole categorie (passi, battito, sonno, SpO₂, HRV, workout, calorie, distanza). Solo quelle attive vengono inviate.",
          },
          {
            q: "Posso usarlo offline?",
            a: "L'app raccoglie i dati anche senza rete e li sincronizza quando torni online. La dashboard web richiede connessione attiva.",
          },
          {
            q: "Funziona con Galaxy Watch più vecchi (Gear S3, Sport)?",
            a: "I modelli pre-Watch4 (Tizen OS) hanno integrazione limitata con Samsung Health moderno. Funzionano i dati base (passi, calorie) ma metriche avanzate come SpO₂ e HRV potrebbero non essere disponibili.",
          },
        ]}
        ctaTitle="Provalo prima del lancio pubblico"
        ctaBody="100 founder ricevono FitMesh Sync gratis a vita — tutte le feature, niente paywall, anche per quelle che usciranno in futuro."
        ctaPrimary="Diventa founder"
        ctaSecondary={{ label: "Vedi i device supportati", href: `/${lc}/devices` }}
        crumbName="Galaxy Watch dashboard"
      />
    );
  }

  return (
    <StrengthsLanding
      locale={lc}
      slug={SLUG}
      kicker="Galaxy Watch dashboard"
      h1="The premium dashboard for your Galaxy Watch."
      sub="All your Galaxy Watch data in one personal dashboard — steps, sleep, heart rate, effort, VO₂ max — accessible from web and app, without opaque clouds and without ads."
      painTitle="Fragmented data, heavy apps, half-baked privacy"
      painBody="Your watch's data is often locked inside proprietary apps that change UI every 6 months, sell telemetry to third parties, and demand an account for every metric. You just want to see your numbers — without middlemen."
      pillars={[
        {
          icon: "🔒",
          title: "Privacy-first",
          body: "Your health data lives on your server (or on Supabase Postgres EU if you prefer). No opaque clouds, no telemetry selling, no ad trackers.",
        },
        {
          icon: "📊",
          title: "Premium native dashboard",
          body: "Intraday heart rate charts, sleep stages, qualitative effort per workout, splits per km. Same detail level as top apps, in our interface.",
        },
        {
          icon: "🔄",
          title: "Direct Samsung Health integration",
          body: "FitMesh reads from both Samsung Health Data SDK and Health Connect. For Galaxy Watch you get the most: SpO₂, nightly HRV, skin temperature, full sleep stages.",
        },
        {
          icon: "💸",
          title: "One-time €3.99 purchase",
          body: "No subscription, no auto-renewal. Pay once, the app is yours forever. The first 100 founders get everything free for life.",
        },
      ]}
      howTitle="How it works"
      howBody="FitMesh Sync reads your Galaxy Watch data from the Samsung Health Data SDK (native integration) or from Health Connect (Android's health hub). Data is synced to your server and visualized in the dashboard. Nothing more — no social network, no forced challenges, no pushy notifications. Just your numbers."
      faqTitle="FAQ"
      faqs={[
        {
          q: "Which Galaxy Watch models are supported?",
          a: "Galaxy Watch 4, 5, 6, 7 and Ultra, plus Galaxy Fit3. All models that use Samsung Health as their companion app are supported.",
        },
        {
          q: "Do I need to install extra apps on the watch?",
          a: "No. FitMesh Sync runs only on the phone. It reads from the data Samsung Health already collects from your watch and displays it in our dashboard.",
        },
        {
          q: "Can I choose which metrics to sync?",
          a: "Yes. In settings you can toggle individual categories (steps, heart rate, sleep, SpO₂, HRV, workouts, calories, distance). Only the active ones are sent.",
        },
        {
          q: "Can I use it offline?",
          a: "The app collects data even without network and syncs when you're back online. The web dashboard needs an active connection.",
        },
        {
          q: "Does it work with older Galaxy Watches (Gear S3, Sport)?",
          a: "Pre-Watch4 models (Tizen OS) have limited integration with modern Samsung Health. Basic data (steps, calories) works but advanced metrics like SpO₂ and HRV may not be available.",
        },
      ]}
      ctaTitle="Try it before public launch"
      ctaBody="100 founders get FitMesh Sync free for life — every feature, no paywall, including features that ship in the future."
      ctaPrimary="Become a founder"
      ctaSecondary={{ label: "See supported devices", href: `/${lc}/devices` }}
      crumbName="Galaxy Watch dashboard"
    />
  );
}
