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
            body: "Il backend gira in region EU (Frankfurt). I tuoi dati salute non lasciano mai l'Europa. Compliance GDPR scritta nel codice, non in un policy PDF.",
          },
          {
            icon: "🚫",
            title: "Zero telemetria, zero tracker",
            body: "Niente Google Analytics su pagine app, niente Facebook Pixel, niente Hotjar. Cookie banner solo strict-necessary di default. L'app non manda crash report a terzi.",
          },
          {
            icon: "🔐",
            title: "Tu sei l'unico proprietario",
            body: "Esporti tutti i tuoi dati in JSON quando vuoi (GDPR art. 20). Cancelli tutto in 48h (art. 17). Niente lock-in, mai.",
          },
          {
            icon: "🛡️",
            title: "Isolamento a livello DB",
            body: "Solo tu vedi i tuoi record. La separazione tra utenti è garantita a livello database, non solo applicazione — anche un bug nell'app non può esporre dati di altri.",
          },
        ]}
        howTitle="Come proteggiamo i tuoi dati"
        howBody="I dati vengono letti dal tuo smartwatch via Health Connect e inviati direttamente al backend FitMesh in EU su connessione cifrata. Sono accessibili solo a te, sempre. Niente intermediari, niente warehouse di terzi, niente integrazioni pubblicitarie. Cancellazione completa in 48h, export in qualsiasi momento."
        faqTitle="Domande frequenti su privacy"
        faqs={[
          {
            q: "Dove sono salvati i miei dati?",
            a: "Su server EU (Frankfurt). I dati salute non lasciano mai l'Unione Europea. Backup automatici giornalieri nella stessa region, retention 7 giorni.",
          },
          {
            q: "Vendete o condividete i miei dati?",
            a: "Mai. Non vendiamo dati a broker, assicurazioni, ricercatori o pubblicitari. Non li aggreghiamo per benchmark venduti. L'unico fornitore tecnico che li tocca è il provider di hosting cloud (EU), strettamente per archiviazione.",
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
          body: "Backend runs in the EU region (Frankfurt). Your health data never leaves Europe. GDPR compliance written in code, not in a policy PDF.",
        },
        {
          icon: "🚫",
          title: "Zero telemetry, zero trackers",
          body: "No Google Analytics on app pages, no Facebook Pixel, no Hotjar. Cookie banner defaults to strict-necessary only. The app doesn't send crash reports to third parties.",
        },
        {
          icon: "🔐",
          title: "You're the only owner",
          body: "Export all your data as JSON whenever (GDPR art. 20). Delete everything within 48h (art. 17). No lock-in, ever.",
        },
        {
          icon: "🛡️",
          title: "DB-level isolation",
          body: "Only you see your records. User separation is guaranteed at the database level, not just the application — even a bug in the app can't expose other users' data.",
        },
      ]}
      howTitle="How we protect your data"
      howBody="Data is read from your smartwatch via Health Connect and sent directly to the FitMesh backend in the EU over an encrypted connection. Accessible only by you, always. No middlemen, no third-party warehouses, no advertising integrations. Full deletion in 48h, export at any time."
      faqTitle="Privacy FAQ"
      faqs={[
        {
          q: "Where is my data stored?",
          a: "On EU servers (Frankfurt). Health data never leaves the EU. Automatic daily backups in the same region, 7-day retention.",
        },
        {
          q: "Do you sell or share my data?",
          a: "Never. We don't sell data to brokers, insurers, researchers or advertisers. We don't aggregate for sold benchmarks. The only technical vendor that touches them is the cloud hosting provider (EU), strictly for storage.",
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
