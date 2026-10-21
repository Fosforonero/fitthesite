import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { ogLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";

export const dynamic = "force-static";

const SUPPORTED_LOCALES = ["it", "en"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function generateStaticParams() {
  return [{ locale: "it" }, { locale: "en" }];
}

function getPricingMeta(lc: SupportedLocale) {
  const isIt = lc === "it";
  const title = isIt
    ? "Prezzi FitMesh: acquisto unico e abbonamento"
    : "FitMesh Pricing: One-Time Purchase and Subscription";

  const description = isIt
    ? "FitMesh: prova gratuita di 14 giorni, poi acquisto unico a vita su iPhone e Android. Su Android anche abbonamento semestrale. Prezzi negli store."
    : "FitMesh: 14-day free trial, then a one-time lifetime purchase on iPhone and Android. Android also offers a 6-month subscription. See store prices.";

  return { title, description };
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    notFound();
  }
  const lc = locale as SupportedLocale;

  const { title, description } = getPricingMeta(lc);

  const canonicalUrl = `${SITE_URL}/${lc}/pricing`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        it: `${SITE_URL}/it/pricing`,
        en: `${SITE_URL}/en/pricing`,
        "x-default": `${SITE_URL}/it/pricing`,
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

export default async function PricingPage({
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
  const { description } = getPricingMeta(lc);

  const breadcrumbsItems = [
    { name: isIt ? "Prezzi" : "Pricing", path: `/${lc}/pricing` },
  ];

  const faqs = isIt
    ? [
        {
          q: "Posso provare FitMesh prima di pagare?",
          a: "Sì. Scaricare l'app è gratuito e include 14 giorni di prova Pro: per continuare a sincronizzare dopo la prova serve l'acquisto a vita (su Android puoi scegliere anche l'abbonamento semestrale). Nessun addebito durante la prova. La prova riguarda solo l'app.",
        },
        {
          q: "Cosa succede quando finiscono i 14 giorni di prova?",
          a: "Al termine della prova gratuita la sincronizzazione si ferma finché non scegli un'opzione. I dati già sincronizzati restano nel tuo account. Dall'app puoi sempre uscire o eliminare l'account. L'eliminazione dell'account resta sempre accessibile dall'app.",
        },
        {
          q: "Quali opzioni di acquisto ci sono su iPhone?",
          a: "Su iPhone è disponibile esclusivamente l'acquisto unico a vita (Lifetime) tramite Apple App Store. Non esiste alcun abbonamento ricorrente per iPhone.",
        },
        {
          q: "Quali opzioni di acquisto ci sono su Android?",
          a: "Su Android puoi scegliere tra l'acquisto unico a vita (Lifetime) oppure l'abbonamento semestrale (6 mesi con rinnovo automatico), entrambi gestiti in modo sicuro tramite Google Play.",
        },
        {
          q: "Perché il prezzo esatto è quello mostrato dallo store?",
          a: "FitMesh distribuisce l'app a livello globale tramite Google Play e Apple App Store. I prezzi effettivi, le imposte locali e la conversione valutaria sono calcolati direttamente dallo store del tuo paese e visualizzati in totale trasparenza prima della conferma.",
        },
        {
          q: "Chi ha ricevuto lo stato Founder deve pagare?",
          a: "No. Agli account a cui è stato effettivamente assegnato il beneficio Founder durante la fase iniziale viene mantenuto l'accesso a vita a FitMesh Pro senza costi aggiuntivi. Il programma Founder è chiuso e non è offerto a nuovi utenti.",
        },
      ]
    : [
        {
          q: "Can I try FitMesh before purchasing?",
          a: "Yes. Downloading the app is free and includes a 14-day Pro trial: continuing to sync after the trial requires a lifetime purchase (on Android you can also choose the 6-month subscription). You won't be charged during the trial. The trial covers the app only.",
        },
        {
          q: "What happens when the 14-day trial ends?",
          a: "When the free trial ends, syncing pauses until you choose an option. Data already synced stays in your account. From the app you can always sign out or delete your account. Account deletion remains available from the app at any time.",
        },
        {
          q: "What purchase options are available on iPhone?",
          a: "On iPhone, FitMesh Pro is available exclusively as a one-time lifetime purchase via Apple App Store. There is no recurring subscription on iOS.",
        },
        {
          q: "What purchase options are available on Android?",
          a: "On Android, you can choose between a one-time lifetime purchase or a 6-month auto-renewing subscription, both securely processed by Google Play.",
        },
        {
          q: "Why are exact prices determined by your local store?",
          a: "FitMesh is available globally through Google Play and Apple App Store. Local taxes, regional currency conversion, and applicable tier pricing are applied directly by your platform store in your country before purchase confirmation.",
        },
        {
          q: "Do accounts with Founder status need to pay?",
          a: "No. Accounts to which the Founder benefit was actually granted during the early phase retain their lifetime FitMesh Pro access at no extra charge. The Founder program is closed and is not available for new users.",
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
    name: isIt ? "Prezzi di FitMesh" : "FitMesh pricing",
    url: `${SITE_URL}/${lc}/pricing`,
    description,
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
            <span>{isIt ? "Trasparenza Commerciale" : "Transparent Pricing"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary mb-3">
            {isIt ? "Prezzi di FitMesh" : "FitMesh pricing"}
          </h1>
          <p className="text-xl font-medium text-brand-aqua mb-4">
            {isIt ? "L'app si scarica gratis" : "The app is free to download"}
          </p>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            {isIt
              ? "Inizia con 14 giorni di prova Pro per sincronizzare i tuoi dati salute e fitness. Nessun addebito durante la prova. La prova riguarda solo l'app. Per continuare a sincronizzare scegli l'opzione più adatta al tuo telefono sullo store ufficiale."
              : "Start with a 14-day Pro trial to sync your health and fitness data. You won't be charged during the trial. The trial covers the app only. To continue syncing after the trial, choose the option that fits your phone best on the official store."}
          </p>
          <div className="flex justify-center">
            <StoreButtonsRow locale={lc} />
          </div>
        </header>

        {/* Pricing Cards */}
        <section aria-labelledby="plans-heading" className="mb-20">
          <h2 id="plans-heading" className="sr-only">
            {isIt ? "Opzioni di acquisto per piattaforma" : "Purchase options by platform"}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Card Android */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold tracking-wider uppercase text-emerald-400">
                    Android
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-text-muted border border-white/10">
                    Google Play
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">
                  {isIt ? "FitMesh Pro per Android" : "FitMesh Pro for Android"}
                </h3>
                <p className="text-sm text-text-secondary mb-6">
                  {isIt
                    ? "Acquisto unico a vita oppure abbonamento semestrale flessibile."
                    : "One-time lifetime purchase or flexible 6-month subscription."}
                </p>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    {isIt ? "Tariffe e Valuta" : "Rates and Currency"}
                  </div>
                  <div className="text-base font-semibold text-text-primary">
                    {isIt
                      ? "Prezzo indicato da Google Play"
                      : "Price set by Google Play"}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {isIt
                      ? "Visualizzato nell'app prima della conferma, nella valuta locale del tuo paese."
                      : "Displayed in the app before confirmation, in your country's local currency."}
                  </p>
                </div>

                <ul className="space-y-3 text-sm text-text-secondary mb-8">
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-aqua font-bold" aria-hidden="true">✓</span>
                    <span>{isIt ? "14 giorni di prova Pro inclusi" : "14-day Pro trial included"}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-aqua font-bold" aria-hidden="true">✓</span>
                    <span>{isIt ? "Scelta tra acquisto a vita o abbonamento semestrale" : "Choice between lifetime unlock or 6-month subscription"}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-aqua font-bold" aria-hidden="true">✓</span>
                    <span>{isIt ? "Sincronizzazione tramite Connessione Salute (Health Connect)" : "Sync via Health Connect"}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-aqua font-bold" aria-hidden="true">✓</span>
                    <span>{isIt ? "Disdici quando vuoi da Google Play." : "Cancel anytime in Google Play."}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-aqua font-bold" aria-hidden="true">✓</span>
                    <span>{isIt ? "Eliminazione dell'account sempre gratuita." : "Account deletion is always free."}</span>
                  </li>
                </ul>
              </div>

              <div>
                <Link
                  href={`/${lc}/support/health-connect`}
                  className="block text-center text-xs text-text-muted hover:text-text-primary transition underline underline-offset-4"
                >
                  {isIt
                    ? "Consulta la guida di configurazione Health Connect →"
                    : "View the Health Connect setup guide →"}
                </Link>
              </div>
            </div>

            {/* Card iPhone */}
            <div className="rounded-2xl border border-brand-aqua/30 bg-white/[0.02] p-8 flex flex-col justify-between relative overflow-hidden shadow-[0_0_30px_rgba(33,230,193,0.05)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-aqua/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold tracking-wider uppercase text-brand-aqua">
                    iPhone (iOS)
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-aqua/10 text-brand-aqua border border-brand-aqua/20">
                    App Store
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">
                  {isIt ? "FitMesh Pro per iPhone" : "FitMesh Pro for iPhone"}
                </h3>
                <p className="text-sm text-text-secondary mb-6">
                  {isIt
                    ? "Solo acquisto unico a vita. Nessun abbonamento ricorrente."
                    : "One-time lifetime purchase only. No recurring subscription."}
                </p>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    {isIt ? "Tariffe e Valuta" : "Rates and Currency"}
                  </div>
                  <div className="text-base font-semibold text-text-primary">
                    {isIt
                      ? "Prezzo indicato da Apple App Store"
                      : "Price set by Apple App Store"}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {isIt
                      ? "Visualizzato nell'app prima della conferma, nella valuta locale del tuo account Apple."
                      : "Displayed in the app before confirmation, in your Apple account local currency."}
                  </p>
                </div>

                <ul className="space-y-3 text-sm text-text-secondary mb-8">
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-aqua font-bold" aria-hidden="true">✓</span>
                    <span>{isIt ? "14 giorni di prova Pro inclusi" : "14-day Pro trial included"}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-aqua font-bold" aria-hidden="true">✓</span>
                    <span>{isIt ? "Sblocco a vita con acquisto una tantum (nessun rinnovo)" : "Lifetime unlock with single payment (no recurring fee)"}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-aqua font-bold" aria-hidden="true">✓</span>
                    <span>{isIt ? "Sincronizzazione tramite Apple Salute (HealthKit)" : "Synchronization with Apple Health (HealthKit)"}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-aqua font-bold" aria-hidden="true">✓</span>
                    <span>{isIt ? "Nessun abbonamento da gestire o disdire" : "No subscription to manage or cancel"}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-aqua font-bold" aria-hidden="true">✓</span>
                    <span>{isIt ? "Eliminazione dell'account sempre gratuita." : "Account deletion is always free."}</span>
                  </li>
                </ul>
              </div>

              <div>
                <Link
                  href={`/${lc}/support/primo-sync`}
                  className="block text-center text-xs text-text-muted hover:text-text-primary transition underline underline-offset-4"
                >
                  {isIt
                    ? "Inizia con la guida al primo sync →"
                    : "Get started with the first sync guide →"}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-text-muted">
            <p>
              {isIt
                ? "Il prezzo finale, con le imposte applicabili, è quello mostrato dallo store."
                : "The final price, with any applicable taxes, is the one shown by the store."}
            </p>
          </div>
        </section>

        {/* Product Truth & Commitments Banner */}
        <section aria-labelledby="guarantees-heading" className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-8 mb-20">
          <h2 id="guarantees-heading" className="text-xl font-bold text-text-primary mb-4">
            {isIt ? "Cosa è incluso" : "What's included"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-text-secondary">
            <div>
              <h3 className="font-semibold text-text-primary mb-1">
                {isIt ? "Nessun vincolo a fine prova" : "No lock-in after trial"}
              </h3>
              <p className="leading-relaxed">
                {isIt
                  ? "Al termine dei 14 giorni la sincronizzazione si ferma finché non scegli un'opzione, senza alcun addebito a sorpresa. I dati già sincronizzati restano nel tuo account. Dall'app puoi sempre uscire o eliminare l'account."
                  : "When the 14 days end, syncing pauses until you choose an option, with no surprise charges. Data already synced stays in your account. From the app you can always sign out or delete your account."}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary mb-1">
                {isIt ? "Applicazione mobile e privacy" : "Mobile application and privacy"}
              </h3>
              <p className="leading-relaxed">
                {isIt
                  ? "I dati sanitari risiedono nell'archivio salute locale del dispositivo (Connessione Salute o Apple Salute). L'app sincronizza con il tuo account FitMesh solo le metriche che hai scelto di collegare. Non vendiamo i tuoi dati sanitari e non inseriamo annunci pubblicitari o tracker commerciali."
                  : "Health data resides in your device's local health storage (Health Connect or Apple Health). The app syncs to your FitMesh account only the metrics you choose to connect. We never sell your health metrics and include zero ads or commercial trackers."}
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section aria-labelledby="faq-heading" className="mb-20">
          <h2 id="faq-heading" className="text-2xl font-bold text-text-primary text-center mb-10">
            {isIt ? "Domande frequenti sui prezzi" : "Frequently Asked Questions"}
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

        {/* Contact and Support Hub Link */}
        <footer className="text-center py-8 border-t border-white/[0.06]">
          <p className="text-sm text-text-muted mb-4">
            {isIt
              ? "Hai altre domande sulla configurazione o sui pagamenti?"
              : "Have more questions about setup or payments?"}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <Link
              href={`/${lc}/support`}
              className="text-brand-aqua hover:underline underline-offset-4"
            >
              {isIt ? "Centro Supporto" : "Support Center"}
            </Link>
            <span className="text-white/20" aria-hidden="true">•</span>
            <Link
              href={`/${lc}/support/primo-sync`}
              className="text-brand-aqua hover:underline underline-offset-4"
            >
              {isIt ? "Guida Primo Sync" : "First Sync Guide"}
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
