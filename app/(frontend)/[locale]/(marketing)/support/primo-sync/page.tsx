import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { ogLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";

export const dynamic = "force-static";

const SUPPORTED_LOCALES = ["it", "en"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function generateStaticParams() {
  return [{ locale: "it" }, { locale: "en" }];
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    notFound();
  }
  const lc = locale as SupportedLocale;

  const title = lc === "it"
    ? "Primo Sync FitMesh: guida alla connessione per Android e iPhone"
    : "FitMesh First Sync: Setup Guide for Android and iPhone";

  const description = lc === "it"
    ? "Hub di supporto per il primo sync: come collegare Connessione Salute su Android o Apple Salute su iPhone per sincronizzare le tue metriche fitness."
    : "First sync support hub: how to connect Health Connect on Android or Apple Health on iPhone to sync your fitness metrics.";

  const canonicalUrl = `${SITE_URL}/${lc}/support/primo-sync`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        it: `${SITE_URL}/it/support/primo-sync`,
        en: `${SITE_URL}/en/support/primo-sync`,
        "x-default": `${SITE_URL}/it/support/primo-sync`,
      },
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
      alternateLocale: [ogLocale[lc === "it" ? "en" : "it"]],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PrimoSyncPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    notFound();
  }
  const lc = locale as SupportedLocale;

  const isIt = lc === "it";

  const breadcrumbsItems = [
    { name: isIt ? "Supporto" : "Support", path: `/${lc}/support` },
    { name: isIt ? "Primo Sync" : "First Sync", path: `/${lc}/support/primo-sync` },
  ];

  const faqs = isIt
    ? [
        {
          q: "Quanto tempo richiede la prima sincronizzazione?",
          a: "La durata dipende dal volume di dati storici registrati dall'orologio nell'archivio salute locale del telefono (Health Connect o Apple Salute) e dalla pianificazione del sistema operativo. Dopo aver concesso i permessi di lettura, l'app acquisisce le metriche disponibili senza bloccare l'uso del telefono.",
        },
        {
          q: "Devo aprire FitMesh ogni volta che voglio sincronizzare?",
          a: "Per verificare la sincronizzazione, apri FitMesh e usa il comando di sincronizzazione disponibile nell'app. Controlla poi i dati e lo stato mostrati. Le attività in background dipendono dalla piattaforma e dalla configurazione disponibile.",
        },
        {
          q: "Cosa fare se non vedo i dati dell'orologio in FitMesh?",
          a: "Assicurati che l'app del tuo orologio (ad esempio Samsung Health) abbia già trasferito i dati nell'archivio centrale del telefono (Health Connect su Android o Apple Salute su iPhone). Per Garmin Connect su Android o iOS, verifica nell'app Garmin che la condivisione verso Health Connect o Apple Salute sia abilitata e supportata per le metriche desiderate. FitMesh legge le metriche autorizzate direttamente da questo archivio locale protetto.",
        },
      ]
    : [
        {
          q: "How long does the first sync take?",
          a: "The duration depends on the volume of historical data recorded by your watch in the phone's local health repository (Health Connect or Apple Health) and operating system scheduling. Once read permissions are granted, the app ingests available metrics without blocking phone usage.",
        },
        {
          q: "Do I need to open FitMesh every time I want to sync?",
          a: "To check syncing, open FitMesh and use the sync control available in the app. Then check the displayed data and status. Background activity depends on the platform and available configuration.",
        },
        {
          q: "What should I do if my watch data does not show up in FitMesh?",
          a: "Verify that your watch's companion app (such as Samsung Health) has transferred its data to your phone's central repository (Health Connect on Android or Apple Health on iPhone). For Garmin Connect on Android or iOS, verify in the Garmin app that sharing to Health Connect or Apple Health is enabled and supported for your desired metrics. FitMesh reads authorized metrics directly from this secure local repository.",
        },
      ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: schemaLanguage(lc),
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: isIt ? "Guida Primo Sync FitMesh" : "FitMesh First Sync Guide",
    url: `${SITE_URL}/${lc}/support/primo-sync`,
    description: isIt
      ? "Hub di supporto per configurare il primo sync tra smartwatch, archivio salute e FitMesh."
      : "Support hub to configure your first sync between smartwatch, health storage, and FitMesh.",
    inLanguage: schemaLanguage(lc),
    isPartOf: {
      "@type": "WebSite",
      name: "FitMesh Sync",
      url: SITE_URL,
    },
  };

  return (
    <>
      <JsonLd data={webPageJsonLd} />
      <JsonLd data={faqJsonLd} />

      <main className="min-h-screen px-4 sm:px-6 py-12 max-w-5xl mx-auto">
        <Breadcrumbs items={breadcrumbsItems} locale={lc} />

        {/* Hero Section */}
        <header className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-brand-aqua/10 text-brand-aqua border border-brand-aqua/20 mb-4">
            <span>{isIt ? "Guida di Avvio" : "Getting Started"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary mb-6">
            {isIt ? "Configura il tuo primo sync" : "Configure your first sync"}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            {isIt
              ? "FitMesh sincronizza i tuoi dati salute e fitness direttamente dall'archivio sicuro del tuo smartphone. Seleziona la tua piattaforma per seguire le istruzioni dedicate."
              : "FitMesh synchronizes your health and fitness data directly from your smartphone's secure health storage. Select your platform below to follow the dedicated steps."}
          </p>
        </header>

        {/* Platform Selection Cards */}
        <section aria-labelledby="platform-heading" className="mb-20">
          <h2 id="platform-heading" className="sr-only">
            {isIt ? "Piattaforma del tuo smartphone" : "Smartphone platform"}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Android Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-white/[0.02] p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold tracking-wider uppercase text-emerald-400">
                    Android
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Health Connect
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-3">
                  {isIt ? "Connessione Salute" : "Health Connect"}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  {isIt
                    ? "Su Android FitMesh legge i dati da Health Connect: funziona con le app che ci scrivono, come Samsung Health."
                    : "On Android, FitMesh reads your data from Health Connect, so it works with apps that write to it, such as Samsung Health."}
                </p>
                <ul className="space-y-2.5 text-xs text-text-muted mb-8">
                  <li>• {isIt ? "Permessi granulari di lettura gestiti da te" : "Granular read permissions controlled by you"}</li>
                  <li>• {isIt ? "Compatibile con Android 9 e versioni successive" : "Compatible with Android 9 and later"}</li>
                  <li>• {isIt ? "Guida passo-passo con schermate autentiche" : "Step-by-step guide with verified screenshots"}</li>
                </ul>
              </div>
              <div>
                <Link
                  href={`/${lc}/support/health-connect`}
                  className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-medium text-sm transition border border-emerald-500/30"
                >
                  {isIt ? "Apri la guida per Android →" : "Open Android guide →"}
                </Link>
              </div>
            </div>

            {/* iPhone Card */}
            <div className="rounded-2xl border border-brand-aqua/30 bg-white/[0.02] p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-aqua/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold tracking-wider uppercase text-brand-aqua">
                    iPhone (iOS)
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-aqua/10 text-brand-aqua border border-brand-aqua/20">
                    Apple Health (HealthKit)
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-3">
                  {isIt ? "Apple Salute" : "Apple Health"}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  {isIt
                    ? "Su iPhone, FitMesh interagisce con Apple Salute per leggere le metriche fitness autorizzate. I dati sanitari restano nell'archivio salute locale del dispositivo e l'app sincronizza con il tuo account FitMesh solo le metriche che hai scelto di collegare."
                    : "On iPhone, FitMesh interacts with Apple Health to read authorized fitness metrics. Health data resides in your device's local health store, and the app syncs to your FitMesh account only the metrics you choose to connect."}
                </p>
                <ul className="space-y-2.5 text-xs text-text-muted mb-8">
                  <li>• {isIt ? "Integrazione nativa HealthKit per la lettura delle metriche" : "Native HealthKit integration for reading metrics"}</li>
                  <li>• {isIt ? "Autorizzazione gestita dal sistema operativo iOS" : "Authorization handled securely by iOS"}</li>
                  <li>• {isIt ? "Nessun account aggiuntivo richiesto per Apple Salute" : "No secondary account required for Apple Health"}</li>
                </ul>
              </div>
              <div>
                <Link
                  href={`/${lc}/support`}
                  className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-brand-aqua/20 text-brand-aqua hover:bg-brand-aqua/30 font-medium text-sm transition border border-brand-aqua/30"
                >
                  {isIt ? "Consulta le FAQ Apple Salute →" : "View Apple Health FAQs →"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Steps Universal Checklist */}
        <section aria-labelledby="steps-heading" className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-8 mb-20">
          <h2 id="steps-heading" className="text-xl font-bold text-text-primary mb-6">
            {isIt ? "I quattro passaggi del primo collegamento" : "Four steps to your first connection"}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-brand-aqua font-bold text-lg mb-2">01</div>
              <h3 className="font-semibold text-text-primary mb-1">
                {isIt ? "Installa l'app" : "Install the app"}
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                {isIt
                  ? "Scarica FitMesh Sync da Google Play o Apple App Store sul tuo smartphone."
                  : "Download FitMesh Sync from Google Play or Apple App Store on your smartphone."}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-brand-aqua font-bold text-lg mb-2">02</div>
              <h3 className="font-semibold text-text-primary mb-1">
                {isIt ? "Verifica l'orologio" : "Check companion app"}
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                {isIt
                  ? "Assicurati che l'app del tuo orologio stia registrando correttamente i dati in Connessione Salute o Apple Salute."
                  : "Make sure your watch's companion app is properly recording data to Health Connect or Apple Health."}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-brand-aqua font-bold text-lg mb-2">03</div>
              <h3 className="font-semibold text-text-primary mb-1">
                {isIt ? "Concedi i permessi" : "Grant permissions"}
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                {isIt
                  ? "All'apertura di FitMesh, attiva i permessi di lettura per le metriche che desideri sincronizzare con il tuo account."
                  : "When opening FitMesh, toggle read permissions for the metrics you wish to sync with your account."}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-brand-aqua font-bold text-lg mb-2">04</div>
              <h3 className="font-semibold text-text-primary mb-1">
                {isIt ? "Avvia il sync" : "Trigger first sync"}
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                {isIt
                  ? "Tocca il pulsante di sincronizzazione per confermare la lettura e verificare l'allineamento."
                  : "Tap the sync button to confirm reading and verify initial alignment."}
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="faq-heading" className="mb-20">
          <h2 id="faq-heading" className="text-2xl font-bold text-text-primary text-center mb-10">
            {isIt ? "Dubbi comuni sul primo sync" : "Common First Sync Questions"}
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="font-semibold text-text-primary text-base mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Navigation */}
        <footer className="text-center py-8 border-t border-white/[0.06]">
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <Link
              href={`/${lc}/pricing`}
              className="text-brand-aqua hover:underline underline-offset-4"
            >
              {isIt ? "Vedi Prezzi e Piani" : "View Pricing and Plans"}
            </Link>
            <span className="text-white/20" aria-hidden="true">•</span>
            <Link
              href={`/${lc}/support`}
              className="text-brand-aqua hover:underline underline-offset-4"
            >
              {isIt ? "Torna al Supporto" : "Back to Support"}
            </Link>
            <span className="text-white/20" aria-hidden="true">•</span>
            <a
              href="mailto:support@fitmesh.fit"
              className="text-text-secondary hover:text-text-primary transition"
            >
              support@fitmesh.fit
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
