import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BetaSignupForm from "@/components/BetaSignupForm";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import TrustBadges from "@/components/TrustBadges";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { PRICING } from "@/lib/pricing";

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
      ? "FitMesh Sync Founder — 1 anno di Pro gratis ai primi 1000"
      : lc === "es"
      ? "FitMesh Sync Founder — 1 año de Pro gratis para los primeros 1000"
      : lc === "de"
      ? "FitMesh Sync Founder — 1 Jahr Pro kostenlos für die ersten 1000"
      : lc === "pt"
      ? "FitMesh Sync Founder — 1 ano de Pro grátis para os primeiros 1000"
      : lc === "fr"
      ? "FitMesh Sync Founder — 1 an de Pro gratuit pour les 1000 premiers"
      : "FitMesh Sync Founder — 1 year of Pro free for the first 1000";
  const description =
    lc === "it"
      ? "Scarica FitMesh Sync da Google Play e crea l'account: i primi 1000 ricevono un anno di Pro completo in regalo, attivato automaticamente. Più accesso prioritario alla versione iOS."
      : lc === "es"
      ? "Descarga FitMesh Sync en Google Play y crea tu cuenta: los primeros 1000 reciben un año completo de Pro gratis, activado automáticamente. Además, acceso prioritario a la versión iOS."
      : lc === "de"
      ? "Lade FitMesh Sync bei Google Play herunter und erstelle dein Konto: Die ersten 1000 erhalten automatisch ein volles Jahr Pro gratis. Plus: Prioritätszugang zur iOS-Version."
      : lc === "pt"
      ? "Baixe o FitMesh Sync no Google Play e crie sua conta: os primeiros 1000 recebem um ano completo de Pro grátis, ativado automaticamente. Mais acesso prioritário à versão iOS."
      : lc === "fr"
      ? "Téléchargez FitMesh Sync sur Google Play et créez votre compte: les 1000 premiers reçoivent un an complet de Pro gratuit, activé automatiquement. Plus un accès prioritaire à la version iOS."
      : "Download FitMesh Sync on Google Play and create your account: the first 1000 get a full year of Pro free, activated automatically. Plus priority access to the iOS version.";

  const path = `/${lc}/beta`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/beta`,
        en: `${SITE_URL}/en/beta`,
        es: `${SITE_URL}/es/beta`,
        de: `${SITE_URL}/de/beta`,
        pt: `${SITE_URL}/pt/beta`,
        fr: `${SITE_URL}/fr/beta`,
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

  const t = lc === "it" ? IT : lc === "es" ? ES : lc === "de" ? DE : lc === "pt" ? PT : lc === "fr" ? FR : EN;
  // Components not yet translated to ES fall back to EN
  const lcBilingual: "it" | "en" = lc === "it" ? "it" : "en";

  return (
    // <div> e non <main>: il layout (marketing)/layout.tsx wrappa gia' i
    // children in un <main>. Nesting di landmark rompe WCAG e da'
    // comportamenti incerti agli screen reader iOS/Android.
    <div className="relative overflow-hidden pb-32 pt-20 text-text-primary md:pt-28">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t.metaTitle,
          description: t.metaDesc,
          url: `${SITE_URL}/${lc}/beta`,
        }}
      />

      {/* Page-local atmospheric layers (sopra al MarketingBackdrop globale) */}
      <div
        aria-hidden
        className="halo-conic pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[720px] -translate-x-1/2 opacity-70 animate-float"
      />

      <div className="mx-auto max-w-3xl px-6">
        <Breadcrumbs
          locale={lcBilingual}
          items={[{ name: "Founder", path: `/${lc}/beta` }]}
        />

        {/* Hero */}
        <header className="mb-16 mt-8 text-center" data-reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent backdrop-blur-sm">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            {t.kicker}
          </div>
          <h1 className="font-display text-balance text-4xl font-semibold leading-[1.05] tracking-tightest md:text-5xl lg:text-display-xl">
            {t.h1_a}{" "}
            <span className="text-brand-gradient">
              {t.h1_b}
            </span>
            {t.h1_c && <> {t.h1_c}</>}
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">
            {t.sub}
          </p>

          {/* CTA primaria: il founder si attiva scaricando l'app, non con un form */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <StoreButtonsRow locale={lcBilingual} />
          </div>
          <p className="mt-4 text-xs text-text-muted">{t.ctaNote}</p>
        </header>

        {/* Perks */}
        <section className="mb-16 grid gap-4 sm:grid-cols-3" data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties}>
          {t.perks.map((perk, i) => {
            const color = ["#7CFF5B", "#21E6C1", "#1DA1FF"][i];
            return (
              <div
                key={perk.title}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  aria-hidden
                  className="absolute -top-16 -right-12 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ background: color }}
                />
                <div
                  className="mb-4 inline-flex items-center justify-center w-11 h-11 rounded-2xl text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${color}22, ${color}08)`,
                    boxShadow: `inset 0 0 0 1px ${color}33`,
                  }}
                >
                  {perk.emoji}
                </div>
                <h3 className="relative font-display text-lg font-semibold text-text-primary">{perk.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-text-secondary">{perk.desc}</p>
              </div>
            );
          })}
        </section>

        {/* What happens next */}
        <section className="mb-20" data-reveal>
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
            {lc === "it" ? "Processo" : lc === "es" ? "Proceso" : lc === "de" ? "Ablauf" : lc === "pt" ? "Processo" : lc === "fr" ? "Processus" : "Process"}
          </p>
          <h2 className="mt-3 mb-8 font-display text-display font-semibold tracking-tightest text-text-primary">{t.nextTitle}</h2>
          <ol className="space-y-3">
            {t.nextSteps.map((step, i) => (
              <li
                key={step.title}
                className="group flex gap-5 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 hover:bg-white/[0.03] hover:border-white/[0.1] transition-all"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-display text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(33,230,193,0.18), rgba(124,255,91,0.08))",
                    boxShadow: "inset 0 0 0 1px rgba(33,230,193,0.30)",
                    color: "#21E6C1",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-text-primary">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Form — riposizionato: lista d'attesa iOS (i founder hanno priorità) */}
        <section
          className="card-glass p-8 md:p-10 relative overflow-hidden"
          data-reveal
        >
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, #21E6C1 0%, transparent 70%)" }}
          />
          <div className="relative">
            <h2 className="font-display text-2xl font-semibold text-text-primary tracking-tight">{t.formTitle}</h2>
            <p className="mt-2 mb-8 text-text-secondary">{t.formSub}</p>
            <BetaSignupForm locale={lcBilingual} />
          </div>
        </section>

        {/* Trust badges — rinforza affidabilita' subito sotto il form. */}
        <section className="mt-6">
          <TrustBadges locale={lcBilingual} variant="compact" />
        </section>

        {/* FAQ */}
        <section className="mt-20" data-reveal>
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
            FAQ
          </p>
          <h2 className="mt-3 mb-8 font-display text-display font-semibold tracking-tightest text-text-primary">{t.faqTitle}</h2>
          <div className="space-y-3">
            {t.faqs.map((faq) => (
              <details
                key={faq.q}
                className="group card p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-text-primary">
                  {faq.q}
                  <span className="text-brand-aqua text-xl leading-none transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const IT = {
  metaTitle: "FitMesh Sync Founder — 1 anno di Pro gratis ai primi 1000",
  metaDesc:
    "Scarica l'app, crea l'account: i primi 1000 ricevono un anno di Pro completo, attivato automaticamente. Più accesso prioritario a iOS.",
  kicker: "Founder · 1000 posti",
  h1_a: "Diventa uno dei primi",
  h1_b: "1000 founder",
  h1_c: "di FitMesh Sync",
  sub:
    "Nessuna selezione, nessuna attesa: scarichi l'app, crei l'account e un anno di Pro completo si attiva da solo. Vale per i primi 1000 account registrati.",
  ctaNote: "Niente carta, niente abbonamento: alla scadenza non paghi nulla.",
  perks: [
    {
      emoji: "🎁",
      title: "1 anno di Pro gratis",
      desc: "Si attiva automaticamente alla registrazione. Storico illimitato, Mesh Famiglia, tutte le feature Pro incluse.",
    },
    {
      emoji: "⚡",
      title: "Primo su iOS",
      desc: "Android è già live. I founder ricevono l'accesso alla versione iOS non appena esce, prima di chiunque altro.",
    },
    {
      emoji: "🛠️",
      title: "Voce diretta",
      desc: "Tu suggerisci, io ascolto. Le feature più richieste dai founder hanno priorità nella roadmap.",
    },
  ],
  formTitle: "Vuoi FitMesh anche su iPhone?",
  formSub:
    "Lascia l'email e ti avviso al lancio iOS: i founder hanno accesso prioritario alla prima build.",
  nextTitle: "Come funziona",
  nextSteps: [
    {
      title: "Scarichi l'app da Google Play",
      desc: "FitMesh Sync è live. Nessuna richiesta da compilare, nessuna approvazione da aspettare.",
    },
    {
      title: "Crei l'account",
      desc: "Email o Google Sign-In. Se sei tra i primi 1000, il Pro si attiva da solo: nella schermata Pro vedi \"Founder · Pro fino al [data]\".",
    },
    {
      title: "Un anno di Pro completo, senza vincoli",
      desc: `Niente carta, niente rinnovo automatico. Alla scadenza scegli tu: resti sul piano gratuito o passi a Pro (${PRICING.subSixMonthsLabel.it}).`,
    },
    {
      title: "Mi mandi feedback quando vuoi",
      desc: "Bug o idee? Scrivimi. Le release seguenti includono le richieste dei founder.",
    },
  ],
  faqTitle: "Domande frequenti",
  faqs: [
    {
      q: "Cosa include l'anno di Pro gratis?",
      a: "Tutto quello che include Pro: storico illimitato (oltre i 14 giorni del piano free), Mesh Famiglia, esportazione dati completa e tutte le feature Pro che usciranno durante l'anno. Per 12 mesi dalla registrazione.",
    },
    {
      q: "Come so se sono tra i primi 1000?",
      a: "Il contatore in homepage mostra i posti rimasti in tempo reale. In ogni caso lo vedi subito nell'app: se il grant è attivo, la schermata Pro mostra \"Founder · Pro fino al [data]\".",
    },
    {
      q: "Cosa succede alla scadenza dell'anno?",
      a: `Nessun addebito: non chiediamo la carta. L'account passa semplicemente al piano gratuito (ultimi 14 giorni di storico). Se vuoi continuare con Pro: ${PRICING.subSixMonthsFull.it} o acquisto unico (${PRICING.lifetimeBoth.it}).`,
    },
    {
      q: "E i primi 100 beta tester?",
      a: "Chi è entrato nella closed beta mantiene il Pro a vita, come promesso. Il programma founder da 1000 posti è il passo successivo, legato al lancio pubblico.",
    },
    {
      q: "Quali wearable supporta?",
      a: "Tutti i dispositivi compatibili con Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (via Health Connect), Garmin (via Connect), Polar, e qualsiasi altro che scriva su Health Connect. Per Samsung Galaxy Watch c'è anche il path diretto Samsung Health.",
    },
    {
      q: "Cosa fate con i miei dati?",
      a: "I tuoi dati salute sono protetti, conservati su server europei e accessibili solo a te tramite il tuo account. Non vengono mai venduti né condivisi con terzi. Dettagli completi: fitmesh.fit/it/privacy",
    },
    {
      q: "Posso cancellare l'account?",
      a: "Sì, in qualsiasi momento, direttamente dall'app o scrivendo a privacy@fitmesh.fit. Cancelliamo account e dati entro 48h, come previsto dal GDPR.",
    },
  ],
};

const ES = {
  metaTitle: "FitMesh Sync Founder — 1 año de Pro gratis para los primeros 1000",
  metaDesc:
    "Descarga FitMesh Sync en Google Play y crea tu cuenta: los primeros 1000 reciben un año completo de Pro gratis, activado automáticamente. Además, acceso prioritario a la versión iOS.",
  kicker: "Founder · 1000 plazas",
  h1_a: "Sé uno de los primeros",
  h1_b: "1000 founders",
  h1_c: "de FitMesh Sync",
  sub:
    "Sin selección, sin espera: descarga la app, crea tu cuenta y un año de Pro completo se activa solo. Válido para las primeras 1000 cuentas registradas.",
  ctaNote: "Sin tarjeta, sin suscripción: cuando termina el año no pagas nada.",
  perks: [
    {
      emoji: "🎁",
      title: "1 año de Pro gratis",
      desc: "Se activa automáticamente al registrarte. Historial ilimitado, Mesh Familia, todas las funciones Pro incluidas.",
    },
    {
      emoji: "⚡",
      title: "Primero en iOS",
      desc: "Android ya está disponible. Los founders reciben acceso a la versión iOS en cuanto se lanza, antes que nadie.",
    },
    {
      emoji: "🛠️",
      title: "Voz directa",
      desc: "Tú sugieres, yo escucho. Las funciones más solicitadas por los founders tienen prioridad en la hoja de ruta.",
    },
  ],
  formTitle: "¿Quieres FitMesh también en iPhone?",
  formSub:
    "Deja tu email y te aviso cuando salga en iOS: los founders tienen acceso prioritario a la primera versión.",
  nextTitle: "Cómo funciona",
  nextSteps: [
    {
      title: "Descarga la app desde Google Play",
      desc: "FitMesh Sync ya está disponible. Sin formularios que rellenar, sin aprobaciones que esperar.",
    },
    {
      title: "Crea tu cuenta",
      desc: "Con email o Google Sign-In. Si estás entre los primeros 1000, el Pro se activa solo: en la pantalla Pro verás \"Founder · Pro hasta [fecha]\".",
    },
    {
      title: "Un año de Pro completo, sin compromisos",
      desc: `Sin tarjeta, sin renovación automática. Al vencer, tú decides: te quedas en el plan gratuito o pasas a Pro (${PRICING.subSixMonthsLabel.en}).`,
    },
    {
      title: "Envíame tu opinión cuando quieras",
      desc: "¿Un error o una idea? Escríbeme. Las siguientes versiones incorporan las peticiones de los founders.",
    },
  ],
  faqTitle: "Preguntas frecuentes",
  faqs: [
    {
      q: "¿Qué incluye el año de Pro gratis?",
      a: "Todo lo que incluye Pro: historial ilimitado (más allá de los 14 días del plan gratuito), Mesh Familia, exportación completa de datos y todas las funciones Pro que se publiquen durante el año. Durante 12 meses desde el registro.",
    },
    {
      q: "¿Cómo sé si estoy entre los primeros 1000?",
      a: "El contador en la página principal muestra las plazas restantes en tiempo real. De todos modos lo verás directamente en la app: si el acceso está activo, la pantalla Pro mostrará \"Founder · Pro hasta [fecha]\".",
    },
    {
      q: "¿Qué pasa cuando termina el año?",
      a: `Sin cargos: nunca pedimos la tarjeta. Tu cuenta pasa simplemente al plan gratuito (últimos 14 días de historial). Si quieres seguir con Pro: ${PRICING.subSixMonthsFull.en} o pago único (${PRICING.lifetimeBoth.en}).`,
    },
    {
      q: "¿Y los primeros 100 beta testers?",
      a: "Los miembros de la beta cerrada mantienen Pro de por vida, como se prometió. El programa founder de 1000 plazas es el siguiente paso, vinculado al lanzamiento público.",
    },
    {
      q: "¿Qué wearables son compatibles?",
      a: "Todos los dispositivos compatibles con Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (vía Health Connect), Garmin (vía Connect), Polar y cualquier otro que escriba en Health Connect. Para Samsung Galaxy Watch también existe la integración directa con Samsung Health.",
    },
    {
      q: "¿Qué hacéis con mis datos?",
      a: "Tus datos de salud no son un producto. Se almacenan en servidores europeos y solo tú puedes acceder a ellos a través de tu cuenta. Nunca se venden ni se comparten con terceros. Más detalles en: fitmesh.fit/es/privacy",
    },
    {
      q: "¿Puedo eliminar mi cuenta?",
      a: "Sí, en cualquier momento, directamente desde la app o escribiendo a privacy@fitmesh.fit. Eliminamos la cuenta y todos los datos en un plazo de 48h, conforme al GDPR.",
    },
  ],
};

const EN = {
  metaTitle: "FitMesh Sync Founder — 1 year of Pro free for the first 1000",
  metaDesc:
    "Download the app, create your account: the first 1000 get a full year of Pro, activated automatically. Plus priority iOS access.",
  kicker: "Founder · 1000 seats",
  h1_a: "Become one of the first",
  h1_b: "1000 founders",
  h1_c: "of FitMesh Sync",
  sub:
    "No selection, no waiting: download the app, create your account, and a full year of Pro activates by itself. Valid for the first 1000 registered accounts.",
  ctaNote: "No card, no subscription: when the year ends you pay nothing.",
  perks: [
    {
      emoji: "🎁",
      title: "1 year of Pro free",
      desc: "Activates automatically at sign-up. Unlimited history, Family Mesh, every Pro feature included.",
    },
    {
      emoji: "⚡",
      title: "First on iOS",
      desc: "Android is already live. Founders get iOS access the moment it launches, before anyone else.",
    },
    {
      emoji: "🛠️",
      title: "Direct voice",
      desc: "You suggest, I listen. Founder-requested features take priority in the roadmap.",
    },
  ],
  formTitle: "Want FitMesh on iPhone too?",
  formSub:
    "Leave your email and I'll ping you at iOS launch: founders get priority access to the first build.",
  nextTitle: "How it works",
  nextSteps: [
    {
      title: "Download the app from Google Play",
      desc: "FitMesh Sync is live. No application to fill in, no approval to wait for.",
    },
    {
      title: "Create your account",
      desc: "Email or Google Sign-In. If you're among the first 1000, Pro activates by itself: the Pro screen shows \"Founder · Pro until [date]\".",
    },
    {
      title: "A full year of Pro, no strings",
      desc: `No card, no auto-renewal. When it expires you choose: stay on the free plan or go Pro (${PRICING.subSixMonthsLabel.en}).`,
    },
    {
      title: "Send feedback whenever you like",
      desc: "Bugs or ideas? Write me. Following releases ship founder requests.",
    },
  ],
  faqTitle: "FAQ",
  faqs: [
    {
      q: "What does the free Pro year include?",
      a: "Everything Pro includes: unlimited history (beyond the free plan's 14 days), Family Mesh, full data export, and every Pro feature shipped during the year. For 12 months from sign-up.",
    },
    {
      q: "How do I know if I'm in the first 1000?",
      a: "The homepage counter shows remaining seats in real time. Either way you'll see it in the app: if the grant is active, the Pro screen shows \"Founder · Pro until [date]\".",
    },
    {
      q: "What happens when the year ends?",
      a: `No charge: we never ask for a card. Your account simply moves to the free plan (last 14 days of history). To keep Pro: ${PRICING.subSixMonthsFull.en} or one-time (${PRICING.lifetimeBoth.en}).`,
    },
    {
      q: "What about the first 100 beta testers?",
      a: "Closed-beta members keep Pro for life, as promised. The 1000-seat founder program is the next step, tied to the public launch.",
    },
    {
      q: "Which wearables are supported?",
      a: "Any device compatible with Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (via Health Connect), Garmin (via Connect), Polar, and any other that writes to Health Connect. For Samsung Galaxy Watch there's also a direct Samsung Health path.",
    },
    {
      q: "What do you do with my data?",
      a: "Your health data is protected, stored on European servers, and accessible only to you via your account. Never sold or shared with third parties. Full details: fitmesh.fit/en/privacy",
    },
    {
      q: "Can I delete my account?",
      a: "Yes, anytime, directly from the app or by writing to privacy@fitmesh.fit. We delete the account and all data within 48h, as required by GDPR.",
    },
  ],
};

const DE = {
  metaTitle: "FitMesh Sync Founder — 1 Jahr Pro kostenlos für die ersten 1000",
  metaDesc:
    "Lade FitMesh Sync bei Google Play herunter und erstelle dein Konto: Die ersten 1000 erhalten automatisch ein volles Jahr Pro gratis. Plus: Prioritätszugang zur iOS-Version.",
  kicker: "Founder · 1000 Plätze",
  h1_a: "Werde einer der ersten",
  h1_b: "1000 Founder",
  h1_c: "von FitMesh Sync",
  sub:
    "Keine Auswahl, keine Wartezeit: Lade die App herunter, erstelle dein Konto und ein volles Jahr Pro aktiviert sich automatisch. Gilt für die ersten 1000 registrierten Konten.",
  ctaNote: "Keine Kreditkarte, kein Abonnement: Nach Ablauf des Jahres zahlst du nichts.",
  perks: [
    {
      emoji: "🎁",
      title: "1 Jahr Pro kostenlos",
      desc: "Aktiviert sich automatisch bei der Registrierung. Unbegrenzter Verlauf, Mesh Familie, alle Pro-Funktionen inklusive.",
    },
    {
      emoji: "⚡",
      title: "Als Erster auf iOS",
      desc: "Android ist bereits verfügbar. Founder erhalten Zugang zur iOS-Version, sobald sie erscheint, vor allen anderen.",
    },
    {
      emoji: "🛠️",
      title: "Direkte Stimme",
      desc: "Du schlägst vor, ich höre zu. Von Foundern gewünschte Funktionen haben Priorität auf der Roadmap.",
    },
  ],
  formTitle: "FitMesh auch auf dem iPhone?",
  formSub:
    "Hinterlasse deine E-Mail-Adresse und ich benachrichtige dich beim iOS-Launch: Founder erhalten Prioritätszugang zum ersten Build.",
  nextTitle: "So funktioniert es",
  nextSteps: [
    {
      title: "Lade die App bei Google Play herunter",
      desc: "FitMesh Sync ist verfügbar. Kein Formular ausfüllen, keine Genehmigung abwarten.",
    },
    {
      title: "Erstelle dein Konto",
      desc: "Mit E-Mail oder Google Sign-In. Wenn du zu den ersten 1000 gehörst, aktiviert sich Pro automatisch: Im Pro-Bildschirm siehst du \"Founder · Pro bis [Datum]\".",
    },
    {
      title: "Ein volles Jahr Pro, ohne Bedingungen",
      desc: `Keine Kreditkarte, keine automatische Verlängerung. Nach Ablauf entscheidest du: Bleib im kostenlosen Plan oder wechsle zu Pro (${PRICING.subSixMonthsLabel.en}).`,
    },
    {
      title: "Schick mir Feedback, wann immer du möchtest",
      desc: "Fehler oder Ideen? Schreib mir. Folgende Releases berücksichtigen die Wünsche der Founder.",
    },
  ],
  faqTitle: "Häufige Fragen",
  faqs: [
    {
      q: "Was ist im kostenlosen Pro-Jahr enthalten?",
      a: "Alles, was Pro beinhaltet: unbegrenzter Verlauf (über die 14 Tage des kostenlosen Plans hinaus), Mesh Familie, vollständiger Datenexport und alle Pro-Funktionen, die im Laufe des Jahres erscheinen. Für 12 Monate ab der Registrierung.",
    },
    {
      q: "Woher weiß ich, ob ich zu den ersten 1000 gehöre?",
      a: "Der Zähler auf der Startseite zeigt die verbleibenden Plätze in Echtzeit. In jedem Fall siehst du es direkt in der App: Wenn der Zugang aktiv ist, zeigt der Pro-Bildschirm \"Founder · Pro bis [Datum]\".",
    },
    {
      q: "Was passiert nach Ablauf des Jahres?",
      a: `Keine Abbuchung: Wir fragen nie nach einer Kreditkarte. Dein Konto wechselt einfach zum kostenlosen Plan (letzten 14 Tage Verlauf). Für Pro weitermachen: ${PRICING.subSixMonthsFull.en} oder Einmalkauf (${PRICING.lifetimeBoth.en}).`,
    },
    {
      q: "Und die ersten 100 Beta-Tester?",
      a: "Mitglieder der geschlossenen Beta behalten Pro auf Lebenszeit, wie versprochen. Das Founder-Programm mit 1000 Plätzen ist der nächste Schritt, verbunden mit dem öffentlichen Launch.",
    },
    {
      q: "Welche Wearables werden unterstützt?",
      a: "Alle mit Health Connect kompatiblen Geräte (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (über Health Connect), Garmin (über Connect), Polar und alle anderen, die Daten in Health Connect schreiben. Für Samsung Galaxy Watch gibt es zusätzlich den direkten Samsung Health-Pfad.",
    },
    {
      q: "Was macht ihr mit meinen Daten?",
      a: "Deine Gesundheitsdaten sind kein Produkt. Sie werden auf europäischen Servern gespeichert und sind nur über dein Konto für dich zugänglich. Sie werden niemals verkauft oder an Dritte weitergegeben. Alle Details: fitmesh.fit/de/privacy",
    },
    {
      q: "Kann ich mein Konto löschen?",
      a: "Ja, jederzeit, direkt in der App oder per E-Mail an privacy@fitmesh.fit. Wir löschen Konto und alle Daten innerhalb von 48 Stunden, wie es die DSGVO vorschreibt.",
    },
  ],
};

const PT = {
  metaTitle: "FitMesh Sync Founder — 1 ano de Pro grátis para os primeiros 1000",
  metaDesc:
    "Baixe o FitMesh Sync no Google Play e crie sua conta: os primeiros 1000 recebem um ano completo de Pro grátis, ativado automaticamente. Mais acesso prioritário à versão iOS.",
  kicker: "Founder · 1000 vagas",
  h1_a: "Seja um dos primeiros",
  h1_b: "1000 founders",
  h1_c: "do FitMesh Sync",
  sub:
    "Sem seleção, sem espera: baixe o app, crie sua conta e um ano completo de Pro é ativado automaticamente. Válido para as primeiras 1000 contas registradas.",
  ctaNote: "Sem cartão, sem assinatura: quando o ano terminar, você não paga nada.",
  perks: [
    {
      emoji: "🎁",
      title: "1 ano de Pro grátis",
      desc: "Ativado automaticamente no cadastro. Histórico ilimitado, Mesh Família, todas as funcionalidades Pro incluídas.",
    },
    {
      emoji: "⚡",
      title: "Primeiro no iOS",
      desc: "O Android já está disponível. Os founders recebem acesso à versão iOS assim que ela for lançada, antes de qualquer pessoa.",
    },
    {
      emoji: "🛠️",
      title: "Voz direta",
      desc: "Você sugere, eu escuto. As funcionalidades mais pedidas pelos founders têm prioridade no roadmap.",
    },
  ],
  formTitle: "Quer o FitMesh também no iPhone?",
  formSub:
    "Deixe seu e-mail e eu aviso no lançamento do iOS: os founders têm acesso prioritário ao primeiro build.",
  nextTitle: "Como funciona",
  nextSteps: [
    {
      title: "Baixe o app no Google Play",
      desc: "O FitMesh Sync já está disponível. Sem formulários para preencher, sem aprovações para aguardar.",
    },
    {
      title: "Crie sua conta",
      desc: "Com e-mail ou Google Sign-In. Se você estiver entre os primeiros 1000, o Pro é ativado automaticamente: na tela Pro você verá \"Founder · Pro até [data]\".",
    },
    {
      title: "Um ano completo de Pro, sem compromisso",
      desc: `Sem cartão, sem renovação automática. Ao vencer, você decide: fica no plano gratuito ou passa para o Pro (${PRICING.subSixMonthsLabel.en}).`,
    },
    {
      title: "Me envie feedback quando quiser",
      desc: "Bugs ou ideias? Me escreva. As próximas versões incluem as solicitações dos founders.",
    },
  ],
  faqTitle: "Perguntas frequentes",
  faqs: [
    {
      q: "O que inclui o ano de Pro grátis?",
      a: "Tudo o que o Pro inclui: histórico ilimitado (além dos 14 dias do plano gratuito), Mesh Família, exportação completa de dados e todas as funcionalidades Pro lançadas durante o ano. Por 12 meses a partir do cadastro.",
    },
    {
      q: "Como sei se estou entre os primeiros 1000?",
      a: "O contador na página inicial mostra as vagas restantes em tempo real. De qualquer forma, você vê direto no app: se o acesso estiver ativo, a tela Pro mostra \"Founder · Pro até [data]\".",
    },
    {
      q: "O que acontece quando o ano termina?",
      a: `Sem cobranças: nunca pedimos cartão. Sua conta passa simplesmente para o plano gratuito (últimos 14 dias de histórico). Para continuar com Pro: ${PRICING.subSixMonthsFull.en} ou compra única (${PRICING.lifetimeBoth.en}).`,
    },
    {
      q: "E os primeiros 100 beta testers?",
      a: "Os membros da beta fechada mantêm o Pro vitalício, como prometido. O programa founder de 1000 vagas é o próximo passo, vinculado ao lançamento público.",
    },
    {
      q: "Quais wearables são compatíveis?",
      a: "Todos os dispositivos compatíveis com Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (via Health Connect), Garmin (via Connect), Polar e qualquer outro que grave dados no Health Connect. Para o Samsung Galaxy Watch há também a integração direta com o Samsung Health.",
    },
    {
      q: "O que vocês fazem com os meus dados?",
      a: "Seus dados de saúde não são um produto. São armazenados em servidores europeus e acessíveis apenas por você através da sua conta. Nunca são vendidos nem compartilhados com terceiros. Detalhes completos: fitmesh.fit/pt/privacy",
    },
    {
      q: "Posso excluir minha conta?",
      a: "Sim, a qualquer momento, diretamente pelo app ou escrevendo para privacy@fitmesh.fit. Excluímos a conta e todos os dados em até 48h, conforme exige o GDPR.",
    },
  ],
};

const FR = {
  metaTitle: "FitMesh Sync Founder — 1 an de Pro gratuit pour les 1000 premiers",
  metaDesc:
    "Téléchargez FitMesh Sync sur Google Play et créez votre compte: les 1000 premiers reçoivent un an complet de Pro gratuit, activé automatiquement. Plus un accès prioritaire à la version iOS.",
  kicker: "Founder · 1000 places",
  h1_a: "Devenez l'un des premiers",
  h1_b: "1000 founders",
  h1_c: "de FitMesh Sync",
  sub:
    "Pas de sélection, pas d'attente: téléchargez l'app, créez votre compte et un an complet de Pro s'active tout seul. Valable pour les 1000 premiers comptes inscrits.",
  ctaNote: "Sans carte, sans abonnement: à l'expiration vous ne payez rien.",
  perks: [
    {
      emoji: "🎁",
      title: "1 an de Pro gratuit",
      desc: "S'active automatiquement à l'inscription. Historique illimité, Mesh Famille, toutes les fonctionnalités Pro incluses.",
    },
    {
      emoji: "⚡",
      title: "Premier sur iOS",
      desc: "Android est déjà disponible. Les founders reçoivent l'accès à la version iOS dès son lancement, avant tout le monde.",
    },
    {
      emoji: "🛠️",
      title: "Voix directe",
      desc: "Vous suggérez, j'écoute. Les fonctionnalités les plus demandées par les founders sont prioritaires dans la feuille de route.",
    },
  ],
  formTitle: "Vous voulez FitMesh sur iPhone aussi?",
  formSub:
    "Laissez votre e-mail et je vous préviens au lancement iOS: les founders ont un accès prioritaire au premier build.",
  nextTitle: "Comment ça marche",
  nextSteps: [
    {
      title: "Téléchargez l'app depuis Google Play",
      desc: "FitMesh Sync est disponible. Pas de formulaire à remplir, pas d'approbation à attendre.",
    },
    {
      title: "Créez votre compte",
      desc: "Avec e-mail ou Google Sign-In. Si vous faites partie des 1000 premiers, Pro s'active tout seul: l'écran Pro affiche \"Founder · Pro jusqu'au [date]\".",
    },
    {
      title: "Un an complet de Pro, sans engagement",
      desc: `Pas de carte, pas de renouvellement automatique. À l'expiration, vous choisissez: restez sur le plan gratuit ou passez à Pro (${PRICING.subSixMonthsLabel.en}).`,
    },
    {
      title: "Envoyez-moi vos retours quand vous voulez",
      desc: "Bugs ou idées? Écrivez-moi. Les versions suivantes intègrent les demandes des founders.",
    },
  ],
  faqTitle: "Questions fréquentes",
  faqs: [
    {
      q: "Que comprend l'année Pro gratuite?",
      a: "Tout ce que comprend Pro: historique illimité (au-delà des 14 jours du plan gratuit), Mesh Famille, export complet des données et toutes les fonctionnalités Pro publiées durant l'année. Pour 12 mois à partir de l'inscription.",
    },
    {
      q: "Comment savoir si je fais partie des 1000 premiers?",
      a: "Le compteur sur la page d'accueil affiche les places restantes en temps réel. Dans tous les cas, vous le verrez dans l'app: si l'accès est actif, l'écran Pro affiche \"Founder · Pro jusqu'au [date]\".",
    },
    {
      q: "Que se passe-t-il à l'expiration de l'année?",
      a: `Aucun débit: nous ne demandons jamais de carte. Votre compte passe simplement au plan gratuit (14 derniers jours d'historique). Pour continuer avec Pro: ${PRICING.subSixMonthsFull.en} ou achat unique (${PRICING.lifetimeBoth.en}).`,
    },
    {
      q: "Et les 100 premiers beta testeurs?",
      a: "Les membres de la bêta fermée conservent Pro à vie, comme promis. Le programme founder de 1000 places est l'étape suivante, liée au lancement public.",
    },
    {
      q: "Quels wearables sont compatibles?",
      a: "Tous les appareils compatibles avec Health Connect (Android 8+): Galaxy Watch 4/5/6/7/Ultra, Google Pixel Watch, Fitbit (via Health Connect), Garmin (via Connect), Polar et tout autre appareil qui écrit dans Health Connect. Pour Samsung Galaxy Watch, il existe aussi une intégration directe avec Samsung Health.",
    },
    {
      q: "Que faites-vous de mes données?",
      a: "Vos données de santé ne sont pas un produit. Elles sont stockées sur des serveurs européens et accessibles uniquement par vous via votre compte. Elles ne sont jamais vendues ni partagées avec des tiers. Tous les détails: fitmesh.fit/fr/privacy",
    },
    {
      q: "Puis-je supprimer mon compte?",
      a: "Oui, à tout moment, directement depuis l'app ou en écrivant à privacy@fitmesh.fit. Nous supprimons le compte et toutes les données dans les 48h, conformément au RGPD.",
    },
  ],
};
