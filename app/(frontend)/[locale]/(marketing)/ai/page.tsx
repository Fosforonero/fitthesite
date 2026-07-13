/**
 * /[locale]/ai — Landing dedicata alla feature "Condividi con AI".
 *
 * Tagline "Use your favorite AI assistant with your own health data."
 * tenuta letteralmente in EN su tutte le lingue (slogan globale, non
 * tradotto), coerente con la card gemella in homepage e con lo store
 * listing. Copy completa IT+EN, fallback EN per le altre 9 lingue del
 * sito (stesso pattern di /famiglia).
 *
 * L'app NON è un'AI (regola AI Act): il disclaimer vive nella sezione
 * "cosa fa / non fa" e nella prima FAQ, non va mai rimosso o ammorbidito.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import TrustBadges from "@/components/TrustBadges";
import { locales, type Locale, ogLocale, localeAlternates } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";

const TAGLINE = "Use your favorite AI assistant with your own health data.";

const COPY = {
  it: {
    crumb: "Assistente AI",
    hero_kicker: "Condividi con AI",
    hero_sub:
      "FitMesh non ti chiude in un assistente proprietario: prepara un riepilogo chiaro dei tuoi dati di salute, pronto da condividere con l'assistente che preferisci, che sia ChatGPT, Claude, Gemini o qualsiasi altro.",
    cta_secondary: "Come funziona",
    why_kicker: "La filosofia FitMesh",
    why_h2: "Due regole, zero vincoli.",
    why_items: [
      {
        title: "Bring your own wearable.",
        body: "Galaxy Watch, Wear OS, anello smart, Health Connect: FitMesh unisce i dati di qualsiasi dispositivo tu scelga, oggi o in futuro.",
      },
      {
        title: "Bring your own AI.",
        body: "Non ti serviamo un chatbot proprietario. Generiamo un riepilogo pulito dei tuoi dati e sei tu a decidere con chi parlarne: l'assistente che già usi e di cui ti fidi.",
      },
    ],
    how_kicker: "Come funziona",
    how_h2: "Tre passaggi, zero numeri copiati a mano.",
    how_steps: [
      {
        title: "FitMesh prepara il riepilogo",
        body: "Passi, sonno, battito, recupero e trend recenti vengono condensati in un testo chiaro, pronto da incollare.",
      },
      {
        title: "Scegli il tuo assistente",
        body: "Copia il riepilogo e incollalo in ChatGPT, Claude, Gemini o in qualsiasi assistente tu preferisca usare.",
      },
      {
        title: "Fai le domande che vuoi",
        body: "Chiedi spiegazioni, confronti nel tempo, consigli pratici. Sei tu al comando della conversazione, non l'app.",
      },
    ],
    what_kicker: "Cosa fa, cosa non fa",
    what_h2: "Non è un'intelligenza artificiale. È un traduttore dei tuoi dati.",
    what_columns: [
      {
        color: "brand-aqua" as const,
        title: "FitMesh fa questo",
        items: [
          "Legge i tuoi dati salute dal dispositivo collegato",
          "Li organizza in un riepilogo leggibile",
          "Ti lascia scegliere dove incollarlo",
        ],
      },
      {
        color: "brand-green" as const,
        title: "FitMesh non fa questo",
        items: [
          "Non è un assistente AI",
          "Non dà diagnosi né consigli medici",
          "Non invia i tuoi dati a nessuna AI senza una tua azione",
        ],
      },
    ],
    faq_kicker: "Domande frequenti",
    faq_h2: "Prima di iniziare",
    faqs: [
      {
        q: "FitMesh è un'intelligenza artificiale?",
        a: "No. FitMesh prepara un riepilogo dei tuoi dati, ma il ragionamento e i consigli arrivano dall'assistente AI che scegli tu. L'app non genera contenuti né dà diagnosi.",
      },
      {
        q: "Quale assistente AI devo usare?",
        a: "Quello che preferisci: ChatGPT, Claude, Gemini o qualunque altro. FitMesh non ha un partner esclusivo.",
      },
      {
        q: "I miei dati vengono inviati automaticamente a un'AI?",
        a: "No. Il riepilogo viene generato solo quando lo richiedi tu, e sei tu a incollarlo dove vuoi. Nessun invio automatico.",
      },
    ],
    final_cta_h2: TAGLINE,
    final_cta_body: "Nessun vincolo. Nessun account AI da creare. Solo i tuoi dati, pronti quando vuoi.",
  },
  en: {
    crumb: "AI Assistant",
    hero_kicker: "Share with AI",
    hero_sub:
      "FitMesh doesn't lock you into a proprietary assistant: it prepares a clear summary of your health data, ready to share with whichever assistant you prefer, ChatGPT, Claude, Gemini, or anything else.",
    cta_secondary: "How it works",
    why_kicker: "The FitMesh philosophy",
    why_h2: "Two rules, zero lock-in.",
    why_items: [
      {
        title: "Bring your own wearable.",
        body: "Galaxy Watch, Wear OS, a smart ring, Health Connect: FitMesh brings together data from whatever device you choose, today or down the line.",
      },
      {
        title: "Bring your own AI.",
        body: "We don't ship you a proprietary chatbot. We generate a clean summary of your data, and you decide who to talk to about it: the assistant you already use and trust.",
      },
    ],
    how_kicker: "How it works",
    how_h2: "Three steps, no manual copy-pasting of numbers.",
    how_steps: [
      {
        title: "FitMesh prepares the summary",
        body: "Steps, sleep, heart rate, recovery and recent trends are condensed into a clear, ready-to-paste text.",
      },
      {
        title: "Choose your assistant",
        body: "Copy the summary and paste it into ChatGPT, Claude, Gemini, or whichever assistant you prefer to use.",
      },
      {
        title: "Ask whatever you want",
        body: "Ask for explanations, comparisons over time, practical advice. You're in charge of the conversation, not the app.",
      },
    ],
    what_kicker: "What it does, what it doesn't",
    what_h2: "It's not an AI. It's a translator for your data.",
    what_columns: [
      {
        color: "brand-aqua" as const,
        title: "FitMesh does this",
        items: [
          "Reads your health data from the connected device",
          "Organizes it into a readable summary",
          "Lets you choose where to paste it",
        ],
      },
      {
        color: "brand-green" as const,
        title: "FitMesh does not do this",
        items: [
          "Is not an AI assistant itself",
          "Does not give diagnoses or medical advice",
          "Does not send your data to any AI without your action",
        ],
      },
    ],
    faq_kicker: "FAQ",
    faq_h2: "Before you start",
    faqs: [
      {
        q: "Is FitMesh an AI?",
        a: "No. FitMesh prepares a summary of your data, but the reasoning and advice come from whichever AI assistant you choose. The app doesn't generate content or give diagnoses.",
      },
      {
        q: "Which AI assistant should I use?",
        a: "Whichever you prefer: ChatGPT, Claude, Gemini, or anything else. FitMesh has no exclusive partner.",
      },
      {
        q: "Is my data automatically sent to an AI?",
        a: "No. The summary is only generated when you ask for it, and you're the one who pastes it wherever you want. Nothing is sent automatically.",
      },
    ],
    final_cta_h2: TAGLINE,
    final_cta_body: "No lock-in. No AI account to create. Just your data, ready whenever you are.",
  },
} as const;

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
      ? "Condividi con AI — Usa il tuo assistente preferito | FitMesh Sync"
      : "Share with AI — Use your favorite assistant | FitMesh Sync";
  const description =
    lc === "it"
      ? "FitMesh prepara un riepilogo dei tuoi dati di salute, pronto da incollare in ChatGPT, Claude, Gemini o l'assistente AI che preferisci. Non è un'AI: sei sempre tu a decidere."
      : "FitMesh prepares a summary of your health data, ready to paste into ChatGPT, Claude, Gemini, or whichever AI assistant you prefer. It's not an AI itself, you're always in control.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${lc}/ai`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/ai`),
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${lc}/ai`,
      siteName: "FitMesh Sync",
      title,
      description,
      locale: ogLocale[lc],
    },
  };
}

export default async function AiLanding({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const path = `/${lc}/ai`;

  const copyKey = (lc in COPY ? lc : "en") as keyof typeof COPY;
  const t = COPY[copyKey];

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name: lc === "it" ? "Condividi con AI — FitMesh Sync" : "Share with AI — FitMesh Sync",
    description: t.hero_sub,
    inLanguage: schemaLanguage(lc),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <article className="relative">
      <JsonLd data={webPageLd} />
      <JsonLd data={faqLd} />
      <Breadcrumbs items={[{ name: t.crumb, path }]} locale={lc} />

      {/* HERO */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 text-center">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-aqua font-semibold">
          {t.hero_kicker}
        </p>
        <h1 className="mt-4 font-display text-display-lg sm:text-display-xl font-semibold tracking-tightest text-text-primary text-balance">
          {TAGLINE}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          {t.hero_sub}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <StoreButtonsRow locale={lc} />
          <a
            href="#how"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-pill btn-ghost text-sm"
          >
            {t.cta_secondary} <span aria-hidden>↓</span>
          </a>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.why_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.why_h2}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {t.why_items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7"
            >
              <h3 className="font-display text-xl font-semibold text-text-primary">
                {it.title}
              </h3>
              <p className="mt-4 text-text-secondary leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.how_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.how_h2}
        </h2>
        <ol className="mt-12 space-y-6">
          {t.how_steps.map((s, i) => (
            <li
              key={s.title}
              className="flex gap-5 items-start rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-7"
            >
              <span className="shrink-0 w-10 h-10 rounded-full bg-brand-aqua/15 border border-brand-aqua/30 flex items-center justify-center font-display font-bold text-brand-aqua">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-text-primary">
                  {s.title}
                </h3>
                <p className="mt-2 text-text-secondary leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* WHAT IT DOES / DOESN'T — disclaimer AI Act */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.what_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.what_h2}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {t.what_columns.map((col) => (
            <div
              key={col.title}
              className={`rounded-2xl border bg-white/[0.02] p-7 ${
                col.color === "brand-aqua" ? "border-brand-aqua/30" : "border-brand-green/30"
              }`}
            >
              <h3
                className={`font-display text-lg font-bold ${
                  col.color === "brand-aqua" ? "text-brand-aqua" : "text-brand-green"
                }`}
              >
                {col.title}
              </h3>
              <ul className="mt-5 space-y-2.5 text-text-secondary">
                {col.items.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                        col.color === "brand-aqua" ? "bg-brand-aqua" : "bg-brand-green"
                      }`}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        <TrustBadges locale={lc === "it" ? "it" : "en"} />
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.faq_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.faq_h2}
        </h2>
        <dl className="mt-10 space-y-4">
          {t.faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-colors hover:border-brand-aqua/30"
            >
              <summary className="cursor-pointer list-none font-display font-semibold text-text-primary flex items-start gap-3">
                <span className="flex-1">{f.q}</span>
                <span
                  aria-hidden
                  className="shrink-0 mt-1 text-brand-aqua transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-text-secondary leading-relaxed">{f.a}</p>
            </details>
          ))}
        </dl>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.final_cta_h2}
        </h2>
        <p className="mt-5 text-text-secondary leading-relaxed">{t.final_cta_body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <StoreButtonsRow locale={lc} />
        </div>
      </section>
    </article>
  );
}
