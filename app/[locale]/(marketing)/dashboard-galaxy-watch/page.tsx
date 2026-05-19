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
        sub="Tutti i dati del tuo Galaxy Watch in un'unica dashboard personale — passi, FC media e zone, sonno con fasi, splits per km, VO₂ max, HRV notturna — accessibile da web e app, senza cloud opachi e senza pubblicità."
        painTitle="Dati frammentati, app pesanti, privacy a metà"
        painBody="I dati del tuo orologio sono spesso bloccati dentro app proprietarie che cambiano interfaccia ogni 6 mesi, vendono telemetria a terze parti e ti chiedono un account per ogni metrica. Tu vuoi solo vedere i tuoi numeri — pace, splits, recupero notturno — senza intermediari."
        pillars={[
          {
            icon: "🔒",
            title: "Privacy by design",
            body: "I tuoi dati salute restano in Europa, su server EU. Mai venduti, mai condivisi, mai usati per pubblicità. Solo tu li vedi.",
          },
          {
            icon: "📊",
            title: "Dashboard nativa premium",
            body: "FC intraday minuto-per-minuto, fasi del sonno, sforzo qualitativo per sessione, splits per km, cadenza, dislivello. Lo stesso livello delle piattaforme top, in interfaccia tua.",
          },
          {
            icon: "🔄",
            title: "Integrazione Galaxy Watch diretta",
            body: "Per Galaxy Watch leggiamo direttamente da Samsung Health: ottieni metriche che le app generiche non vedono — SpO₂ continua, HRV notturna, temperatura pelle, fasi sonno granulari.",
          },
          {
            icon: "💸",
            title: "Acquisto unico €3,99",
            body: "Niente abbonamento, niente rinnovo automatico. Paghi una volta, l'app è tua per sempre. I primi 100 founder hanno tutto gratis a vita.",
          },
        ]}
        howTitle="Come funziona"
        howBody="Il tuo Galaxy Watch raccoglie dati che Samsung Health archivia. FitMesh Sync li legge, li manda al nostro backend in EU e li mostra in dashboard. Niente social network, niente challenge forzate, niente notifiche pushy. Solo i tuoi numeri, organizzati come ti servono."
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
      sub="All your Galaxy Watch data in one personal dashboard — steps, HR zones, sleep stages, splits per km, VO₂ max, nightly HRV — accessible from web and app, without opaque clouds and without ads."
      painTitle="Fragmented data, heavy apps, half-baked privacy"
      painBody="Your watch's data is often locked inside proprietary apps that change UI every 6 months, sell telemetry to third parties, and demand an account for every metric. You just want to see your numbers — pace, splits, recovery — without middlemen."
      pillars={[
        {
          icon: "🔒",
          title: "Privacy by design",
          body: "Your health data stays in Europe, on EU servers. Never sold, never shared, never used for advertising. Only you see it.",
        },
        {
          icon: "📊",
          title: "Premium native dashboard",
          body: "Minute-by-minute HR, sleep stages, qualitative effort per session, splits per km, cadence, elevation. Same level as the top platforms, in our interface.",
        },
        {
          icon: "🔄",
          title: "Direct Galaxy Watch integration",
          body: "For Galaxy Watch we read directly from Samsung Health: you get metrics generic apps don't see — continuous SpO₂, nightly HRV, skin temperature, granular sleep stages.",
        },
        {
          icon: "💸",
          title: "One-time €3.99 purchase",
          body: "No subscription, no auto-renewal. Pay once, the app is yours forever. The first 100 founders get everything free for life.",
        },
      ]}
      howTitle="How it works"
      howBody="Your Galaxy Watch collects data that Samsung Health stores. FitMesh Sync reads it, sends it to our EU backend, and shows it in the dashboard. No social network, no forced challenges, no pushy notifications. Just your numbers, organized the way you need."
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
