import type { Metadata } from "next";
import { locales, type Locale, getDictionary } from "@/lib/i18n";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const SITE_URL = "https://www.fitmesh.fit";

const FAQ_IT = [
  {
    q: "L'app non mostra dati. Cosa devo fare?",
    a: "Verifica nell'ordine: (1) Health Connect è installato dal Play Store? (2) Hai concesso il permesso «Lettura dati in background» dentro Health Connect? (3) Premi «Sincronizza Ora» nelle impostazioni. Se persiste, scrivici allegando uno screenshot del pannello «Stato».",
  },
  { q: "Quanto consuma di batteria?", a: "Circa 1-2% al giorno con sync ogni 30 minuti. È sotto la soglia di rilevamento di Android come «app che drena la batteria». Se vedi consumi anomali, probabilmente Health Connect stesso sta indicizzando — non FitMesh Sync." },
  { q: "Funziona offline?", a: "L'app raccoglie e mette in coda i dati anche senza rete. Appena torni online, sincronizza automaticamente tutto l'arretrato. La dashboard web invece richiede connessione internet attiva." },
  { q: "Posso usare un server privato?", a: "Sì, su richiesta. Per esigenze enterprise (RSA, cliniche, studi medici, gruppi famiglia con dati segregati) configuriamo un server dedicato con il tuo dominio, backup gestiti e SLA dedicato. Scrivi a sales@fitmesh.fit indicando volume utenti previsto e requisiti di conservazione dati." },
  { q: "Quanto costa FitMesh Sync?", a: "€3,99 una tantum. Acquisto unico via Google Play Billing — niente abbonamento, niente rinnovi automatici, niente sorprese in fattura." },
  { q: "Ho cambiato telefono. Perdo i miei dati?", a: "No. I dati sono sul server, non sul telefono. Reinstalla l'app, fai login (o inserisci il tuo device ID precedente nelle impostazioni se hai un account avanzato) e ritrovi tutto." },
  { q: "Supporto iOS?", a: "In sviluppo. iOS arriverà nel 2026 con la stessa architettura: app nativa SwiftUI che legge da Apple HealthKit. Iscriviti via hello@fitmesh.fit per essere avvisato." },
];

const FAQ_EN = [
  {
    q: "The app shows no data. What do I do?",
    a: "Check in order: (1) Is Health Connect installed from the Play Store? (2) Did you grant «Read data in background» permission inside Health Connect? (3) Tap «Sync now» in settings. If the issue persists, email us with a screenshot of the «Status» panel.",
  },
  { q: "How much battery does it use?", a: "About 1-2% per day with 30-minute sync intervals. Below Android's threshold for «battery draining apps». If you see abnormal drain, Health Connect itself is likely indexing — not FitMesh Sync." },
  { q: "Does it work offline?", a: "The app collects and queues data even without network. As soon as you're back online, it syncs all the backlog automatically. The web dashboard, however, requires an active internet connection." },
  { q: "Can I have my own private server?", a: "Yes, on request. For enterprise needs (nursing homes, clinics, medical practices, family groups with segregated data) we deploy a dedicated server with your domain, managed backups and a dedicated SLA. Email sales@fitmesh.fit with expected user volume and data retention requirements." },
  { q: "How much does FitMesh Sync cost?", a: "€3.99 one-time. Single purchase via Google Play Billing — no subscription, no auto-renewals, no billing surprises." },
  { q: "I switched phones. Do I lose my data?", a: "No. Data is on the server, not the phone. Reinstall the app, log in (or enter your previous device ID in settings if you have an advanced account) and you get everything back." },
  { q: "iOS support?", a: "In development. iOS will arrive in 2026 with the same architecture: native SwiftUI app reading from Apple HealthKit. Subscribe via hello@fitmesh.fit to be notified." },
];

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = { it: "Supporto", en: "Support" };
  const desc: Record<Locale, string> = {
    it: "FAQ, troubleshooting e contatti per FitMesh Sync. Risposte rapide ai problemi più comuni.",
    en: "FAQ, troubleshooting and contacts for FitMesh Sync. Quick answers to the most common questions.",
  };
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    title: titles[lc],
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/support`,
      languages: {
        it: `${SITE_URL}/it/support`,
        en: `${SITE_URL}/en/support`,
        "x-default": `${SITE_URL}/it/support`,
      },
    },
  };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);
  const faqs = lc === "en" ? FAQ_EN : FAQ_IT;

  // Structured data — FAQPage for Google rich result
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lc === "it" ? "it-IT" : "en-US",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const subtitle = lc === "en"
    ? "The answers to the most common issues. If you can't find what you're looking for,"
    : "Le risposte ai problemi più comuni. Se non trovi quello che cerchi,";

  const writeUsLabel = lc === "en"
    ? "write to support@fitmesh.fit"
    : "scrivici a support@fitmesh.fit";

  const moreQuestionsHeading = lc === "en" ? "Have another question?" : "Hai un'altra domanda?";
  const moreQuestionsDesc = lc === "en"
    ? "Drop us a line. We respond personally within 48 hours (usually much sooner)."
    : "Scrivici. Rispondiamo personalmente entro 48 ore (di solito molto prima).";

  const ctaPrimary = lc === "en"
    ? "Email support@fitmesh.fit"
    : "Scrivi a support@fitmesh.fit";

  const crumbName = lc === "en" ? "Support" : "Supporto";
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumbs items={[{ name: crumbName, path: `/${lc}/support` }]} locale={lc} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.nav.support}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.legal.support_title}
        </h1>
        <p className="mt-3 text-text-secondary">
          {subtitle}{" "}
          <a
            href="mailto:support@fitmesh.fit"
            className="text-brand-aqua hover:text-brand-blue underline underline-offset-4"
          >
            {writeUsLabel}
          </a>
          .
        </p>
      </header>

      <section className="space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-[14px] border border-divider bg-bg-card/50 p-5 open:bg-bg-elevated/80 transition"
          >
            <summary className="cursor-pointer list-none flex items-start justify-between gap-3 text-text-primary font-medium">
              <span>{faq.q}</span>
              <span aria-hidden className="mt-1 text-text-muted group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-text-secondary text-sm leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </section>

      <section className="mt-16">
        <div className="rounded-[14px] border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-8">
          <h2 className="font-display text-2xl font-semibold text-text-primary">
            {moreQuestionsHeading}
          </h2>
          <p className="mt-3 text-text-secondary">{moreQuestionsDesc}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="mailto:support@fitmesh.fit?subject=FitMesh%20Sync"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill btn-cta text-sm"
            >
              {ctaPrimary}
            </a>
            <a
              href="mailto:hello@fitmesh.fit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill border border-divider text-text-primary hover:bg-white/5 transition"
            >
              hello@fitmesh.fit
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
