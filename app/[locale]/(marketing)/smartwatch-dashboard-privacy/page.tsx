import type { Metadata } from "next";

import StrengthsLanding from "@/components/landings/StrengthsLanding";
import { locales, type Locale } from "@/lib/i18n";

const SITE_URL = "https://www.fitmesh.fit";
const SLUG = "smartwatch-dashboard-privacy";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const titles: Record<Locale, string> = {
    it: "Dashboard salute privacy-first per smartwatch — FitMesh Sync",
    en: "Privacy-first health dashboard for smartwatches — FitMesh Sync",
  };
  const desc: Record<Locale, string> = {
    it: "Una dashboard personale per i dati del tuo smartwatch, costruita sulla privacy. Niente cloud opachi, server EU, niente vendita di telemetria, niente pubblicità. GDPR compliance by design.",
    en: "A personal dashboard for your smartwatch data, built around privacy. No opaque clouds, EU servers, no telemetry selling, no ads. GDPR compliant by design.",
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
        kicker="Privacy health dashboard"
        h1="I dati salute del tuo smartwatch — solo tuoi."
        sub="Una dashboard personale per visualizzare passi, sonno, battito, sforzo e VO₂ max. Costruita sulla privacy: server EU, niente cloud opachi, niente telemetria venduta, niente tracker pubblicitari. Solo i tuoi numeri."
        painTitle="I tracker tradizionali vendono i tuoi dati salute"
        painBody="Molte app di salute popolari raccolgono dati sensibili (battito, sonno, peso, ciclo) e li vendono a broker pubblicitari, partner assicurativi e ricercatori esterni — spesso aggregati ma a volte identificabili. Tu vuoi tracking serio della tua salute, non finire in un dataset venduto."
        pillars={[
          {
            icon: "🇪🇺",
            title: "Server EU, GDPR by design",
            body: "Il backend gira su Supabase Postgres region EU (Frankfurt). I tuoi dati salute non lasciano mai l'Europa. RGPD compliance non è un dipartimento legale: è codice.",
          },
          {
            icon: "🚫",
            title: "Zero telemetria, zero tracker",
            body: "Niente Google Analytics su pagine app, niente Facebook Pixel, niente Hotjar. Cookie banner offre solo strict-necessary by default. L'app native non manda crash report a terzi.",
          },
          {
            icon: "🔐",
            title: "Tu sei l'unico proprietario",
            body: "Esporti tutti i tuoi dati in JSON quando vuoi (RGPD art.20 portability). Cancelli tutto in 48h (art.17 right to be forgotten). Niente lock-in.",
          },
          {
            icon: "🏥",
            title: "Self-hosted disponibile",
            body: "Se sei medico, RSA o gruppo famiglia con esigenze enterprise, deploy on-premise sul tuo server con il tuo dominio. SLA dedicato, backup gestiti. Scrivi a sales@fitmesh.fit.",
          },
        ]}
        howTitle="Come proteggiamo i tuoi dati"
        howBody="I dati vengono letti dal tuo smartwatch via Health Connect (Android) e mandati direttamente al backend FitMesh su Supabase (Postgres EU) via HTTPS con Bearer JWT. La RLS (Row-Level Security) di Postgres garantisce che solo tu possa leggere i tuoi record. Niente intermediari, niente ETL su data warehouse di terzi, niente backup esposti. La password keystore è in clear sul tuo telefono (Android Keystore hardware-backed) — non sui nostri server."
        faqTitle="Domande frequenti su privacy"
        faqs={[
          {
            q: "Dove sono salvati i miei dati?",
            a: "Su Supabase Postgres in region eu-central-1 (Frankfurt). I dati di salute non lasciano mai l'Unione Europea. Backup automatici nello stesso region, retention 7 giorni.",
          },
          {
            q: "Vendete o condividete i miei dati?",
            a: "Mai. Non vendiamo dati a broker, assicurazioni, ricercatori o pubblicitari. Non li aggreghiamo per benchmark venduti. Non li condividiamo con terzi (eccetto Supabase come hosting tecnico).",
          },
          {
            q: "Come faccio a cancellare i miei dati?",
            a: "Dall'app: Impostazioni → Account → Elimina account. Cancellazione hard entro 48h (RGPD art.17). Riceverai email di conferma quando completata.",
          },
          {
            q: "Posso esportare i miei dati?",
            a: "Sì, dall'app: Impostazioni → Privacy → Esporta dati. Ricevi un JSON completo di tutti i record (metriche, profilo, log sync). RGPD art.20 data portability.",
          },
          {
            q: "Usate tracking pubblicitario sul sito?",
            a: "Sul sito marketing usiamo solo Google Analytics 4 con Consent Mode v2 (cookie analytics opt-in esplicito). Sulle pagine app private (/app/*, /admin/*) zero tracking di alcun tipo.",
          },
          {
            q: "C'è un Privacy Policy completo?",
            a: "Sì: fitmesh.fit/it/privacy — leggibile in 5 minuti, niente legalese, dettagliato sulle basi giuridiche (RGPD art.6 consenso + legittimo interesse limitato a sicurezza).",
          },
        ]}
        ctaTitle="Tracking serio + privacy seria — gratis a vita per i primi 100"
        ctaBody="100 founder ricevono FitMesh Sync gratis a vita. Le feature ci sono tutte: dashboard premium, multi-source, export GDPR. La privacy è uguale per founder e utenti paganti — è il fondamento del progetto."
        ctaPrimary="Diventa founder"
        ctaSecondary={{ label: "Leggi la Privacy Policy", href: `/${lc}/privacy` }}
        crumbName="Privacy health dashboard"
      />
    );
  }

  return (
    <StrengthsLanding
      locale={lc}
      slug={SLUG}
      kicker="Privacy health dashboard"
      h1="Your smartwatch health data — yours only."
      sub="A personal dashboard to view steps, sleep, heart rate, effort and VO₂ max. Built around privacy: EU servers, no opaque clouds, no telemetry selling, no ad trackers. Just your numbers."
      painTitle="Traditional trackers sell your health data"
      painBody="Many popular health apps collect sensitive data (heart rate, sleep, weight, cycle) and sell it to ad brokers, insurance partners and external researchers — often aggregated but sometimes identifiable. You want serious health tracking, not to end up in a sold dataset."
      pillars={[
        {
          icon: "🇪🇺",
          title: "EU servers, GDPR by design",
          body: "Backend runs on Supabase Postgres EU region (Frankfurt). Your health data never leaves Europe. GDPR compliance isn't a legal department: it's code.",
        },
        {
          icon: "🚫",
          title: "Zero telemetry, zero trackers",
          body: "No Google Analytics on app pages, no Facebook Pixel, no Hotjar. Cookie banner defaults to strict-necessary only. Native app doesn't send crash reports to third parties.",
        },
        {
          icon: "🔐",
          title: "You're the only owner",
          body: "Export all your data as JSON whenever (GDPR art.20 portability). Delete everything in 48h (art.17 right to be forgotten). No lock-in.",
        },
        {
          icon: "🏥",
          title: "Self-hosted available",
          body: "If you're a doctor, nursing home or family group with enterprise needs, deploy on-premise on your server with your domain. Dedicated SLA, managed backups. Email sales@fitmesh.fit.",
        },
      ]}
      howTitle="How we protect your data"
      howBody="Data is read from your smartwatch via Health Connect (Android) and sent directly to the FitMesh backend on Supabase (EU Postgres) via HTTPS with Bearer JWT. Postgres RLS (Row-Level Security) guarantees only you can read your records. No middlemen, no ETL to third-party data warehouses, no exposed backups. Your keystore password is in clear on your phone (hardware-backed Android Keystore) — never on our servers."
      faqTitle="Privacy FAQ"
      faqs={[
        {
          q: "Where is my data stored?",
          a: "On Supabase Postgres in region eu-central-1 (Frankfurt). Health data never leaves the EU. Automatic backups in the same region, 7-day retention.",
        },
        {
          q: "Do you sell or share my data?",
          a: "Never. We don't sell data to brokers, insurers, researchers or advertisers. We don't aggregate for sold benchmarks. We don't share with third parties (except Supabase as technical hosting).",
        },
        {
          q: "How do I delete my data?",
          a: "From the app: Settings → Account → Delete account. Hard deletion within 48h (GDPR art.17). You get a confirmation email when complete.",
        },
        {
          q: "Can I export my data?",
          a: "Yes, from the app: Settings → Privacy → Export data. You get a full JSON of all records (metrics, profile, sync logs). GDPR art.20 data portability.",
        },
        {
          q: "Do you use ad tracking on the website?",
          a: "On the marketing site we only use Google Analytics 4 with Consent Mode v2 (explicit opt-in for analytics cookies). On private app pages (/app/*, /admin/*) zero tracking of any kind.",
        },
        {
          q: "Is there a full Privacy Policy?",
          a: "Yes: fitmesh.fit/en/privacy — readable in 5 minutes, no legalese, detailed on legal bases (GDPR art.6 consent + limited legitimate interest for security).",
        },
      ]}
      ctaTitle="Serious tracking + serious privacy — free for life for the first 100"
      ctaBody="100 founders get FitMesh Sync free for life. All features included: premium dashboard, multi-source, GDPR export. Privacy is the same for founders and paying users — it's the foundation of the project."
      ctaPrimary="Become a founder"
      ctaSecondary={{ label: "Read the Privacy Policy", href: `/${lc}/privacy` }}
      crumbName="Privacy health dashboard"
    />
  );
}
