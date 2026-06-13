/**
 * /[locale]/press — Press / media kit page.
 *
 * Pagina pubblica, indicizzata. Contiene:
 *   - Tagline + descrizione breve copia-incolla-ready
 *   - 3 paragrafi (mini / standard / long) per uso giornalistico
 *   - Key facts (founding, tech, market)
 *   - Founder bio
 *   - Asset download (logo, screenshot, icon)
 *   - Contact press
 *   - Quote/testimonial gateway (vuoto ora, popolato con il tempo)
 *
 * Per il giornalista: tutto in 1 page, copy/paste senza email.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import TrustBadges from "@/components/TrustBadges";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { PRICING } from "@/lib/pricing";

const SITE_URL = "https://www.fitmesh.fit";

const COPY = {
  it: {
    kicker: "Press & Media kit",
    h1: "FitMesh Sync: risorse per giornalisti, blogger, creator",
    sub:
      "Tutto quello che ti serve per scrivere o parlare di FitMesh Sync. Copia-incolla, scarica gli asset, niente email obbligatoria.",

    contactTitle: "Contatto stampa diretto",
    contactBody:
      "Per interviste, demo guidate, asset alta risoluzione o domande tecniche:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, founder, sviluppatore unico",

    taglineTitle: "Tagline (1 riga)",
    tagline:
      "FitMesh Sync è la dashboard premium privacy-first per i dati di tutti gli smartwatch della famiglia, costruita in Italia da uno sviluppatore indipendente.",

    blurbsTitle: "Descrizione breve (50, 100, 200 parole)",
    blurb50: {
      title: "50 parole",
      body:
        "FitMesh Sync è un'app Android che unifica i dati di salute di Galaxy Watch, Mi Band, Polar, Garmin, Fitbit e altri wearable in una dashboard premium. Privacy-first, server in UE, sviluppata in Italia. Funziona via Health Connect senza tracker o broker dati. In beta privata da maggio 2026.",
    },
    blurb100: {
      title: "100 parole",
      body:
        "FitMesh Sync è un'app Android sviluppata in Italia da Matteo Pizzi (Fosforonero) per unificare in una sola dashboard premium i dati di salute provenienti da tutti gli smartwatch e fitness band sul mercato. Lavora come destinazione di Health Connect, quindi è compatibile out-of-the-box con Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei e Oura, senza bisogno di OAuth per ognuno. Privacy-first: server EU, GDPR, zero broker dati. Disponibile in beta privata da maggio 2026; in roadmap la versione iOS e la funzione Mesh Famiglia per il caregiving familiare.",
    },
    blurb200: {
      title: "200 parole (profilo completo)",
      body:
        "FitMesh Sync nasce in Italia nel 2026 dalla frustrazione di uno sviluppatore (Matteo Pizzi, studio Fosforonero) che possiede un Galaxy Watch, la moglie usa una Mi Band, la madre un Withings. Ogni brand chiude i propri dati nella propria app. Nessuno offre una vista unificata premium. FitMesh risolve esattamente questo: leggendo da Health Connect (lo standard Android che dal 2024 raccoglie i dati di praticamente tutti i wearable), aggrega passi, frequenza cardiaca, sonno, calorie, workout e altre metriche in una dashboard nativa Flutter pensata per la lettura quotidiana, non per il sysadmin. Privacy-first dal primo commit: server europei (Supabase Francoforte), GDPR-compliance reale, zero broker dati, zero tracker. La differenziazione strategica rispetto alle bridge app cloud-to-cloud del settore è che FitMesh non è un router silenzioso di dati: è una destinazione. I dati sono archiviati, visualizzati con grafici curati, e nel medio termine condivisibili tra membri famiglia (Mesh Famiglia, in roadmap) per scenari caregiver. L'app è in beta privata con 100 posti founder a vita gratis; iOS arriva nel 2027.",
    },

    keyFactsTitle: "Key facts",
    keyFacts: [
      { label: "Lancio", value: "Beta privata maggio 2026 · Public Q3 2026" },
      { label: "Piattaforme", value: "Android (iOS 2027)" },
      { label: "Country", value: "Italia · server UE (Francoforte)" },
      { label: "Tecnologie", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearable supportati", value: "9+ brand via Health Connect, espandibili" },
      { label: "Pricing", value: `Free tier + Pro ${PRICING.fromLifetime.it} una tantum (Android ${PRICING.lifetimeAndroid.it} · iPhone ${PRICING.lifetimeIos.it}) o ${PRICING.subSixMonthsLabel.it}` },
      { label: "Posti founder", value: "100 a vita gratis (beta)" },
      { label: "Team", value: "Indie / solo dev (Fosforonero, Matteo Pizzi)" },
      { label: "Categoria Play Store", value: "Health & Fitness" },
    ],

    founderTitle: "Founder",
    founderName: "Matteo Pizzi",
    founderRole: "Founder & Solo Dev · Fosforonero",
    founderBio:
      "Sviluppatore software italiano, ha costruito FitMesh Sync per riempire il vuoto fra wearable e dashboard personale. Tutta l'app, il backend e il sito sono sviluppati e mantenuti da lui. Approccio privacy-first e indie-first.",

    assetsTitle: "Asset scaricabili",
    assets: [
      {
        label: "Logo / icona quadrata (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph image (1200×630, dinamica)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "Per screenshot in-app, mockup, video o materiali brand custom scrivi a press@fitmesh.fit, rispondiamo entro 24h.",

    storyAnglesTitle: "Angoli editoriali interessanti",
    storyAngles: [
      "Indie dev italiano costruisce un'alternativa europea privacy-first ai walled garden di Samsung/Apple/Google Fit",
      "Come Health Connect ha cambiato l'ecosistema wearable Android dal 2024, e cosa significa per consumer e dev",
      "Caregiver tech: monitorare la salute di genitori anziani senza GPS né app invasive (la roadmap Mesh Famiglia)",
      "Beta program founder a vita gratis: alternativa all'hype subscription anche su app fitness",
      "Sviluppare un'app salute in Italia: GDPR, server EU, sovranità dati come differenziatore",
    ],

    trademarkNote:
      "FitMesh Sync è marchio di Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit e altri brand citati sono marchi dei rispettivi proprietari; il loro uso in questa pagina e nel materiale FitMesh non implica affiliazione o sponsorizzazione.",

    sitemapNote:
      "Hai bisogno di link specifici? Trovi tutto a fitmesh.fit (home, /it/famiglia per il caso d'uso caregiver, /it/blog per gli articoli tecnici, /it/about per la storia del progetto).",
  },
  en: {
    kicker: "Press & Media kit",
    h1: "FitMesh Sync: resources for journalists, bloggers, creators",
    sub:
      "Everything you need to write or talk about FitMesh Sync. Copy-paste ready, asset downloads, no email required.",

    contactTitle: "Direct press contact",
    contactBody:
      "For interviews, guided demos, high-res assets or technical questions:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, founder, solo developer",

    taglineTitle: "Tagline (1 line)",
    tagline:
      "FitMesh Sync is the privacy-first premium dashboard for all your family's smartwatch data, built in Italy by an independent developer.",

    blurbsTitle: "Short description (50, 100, 200 words)",
    blurb50: {
      title: "50 words",
      body:
        "FitMesh Sync is an Android app that unifies health data from Galaxy Watch, Mi Band, Polar, Garmin, Fitbit and other wearables into one premium dashboard. Privacy-first, EU servers, built in Italy. Runs on Health Connect with no trackers or data brokers. In private beta since May 2026.",
    },
    blurb100: {
      title: "100 words",
      body:
        "FitMesh Sync is an Android app developed in Italy by Matteo Pizzi (Fosforonero) to unify in a single premium dashboard the health data coming from every smartwatch and fitness band on the market. It works as a Health Connect destination, compatible out-of-the-box with Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei and Oura, without requiring per-brand OAuth. Privacy-first: EU servers, GDPR, no data brokers. Available in private beta since May 2026; iOS version and Family Mesh feature for family caregiving are in the roadmap.",
    },
    blurb200: {
      title: "200 words (full profile)",
      body:
        "FitMesh Sync was born in Italy in 2026 from the frustration of one developer (Matteo Pizzi, studio Fosforonero) who owns a Galaxy Watch, his wife uses a Mi Band, his mother a Withings. Every brand locks its own data inside its own app. Nobody offers a unified premium view. FitMesh solves exactly this: by reading from Health Connect (the Android standard that since 2024 collects data from virtually all wearables), it aggregates steps, heart rate, sleep, calories, workouts and other metrics into a native Flutter dashboard designed for daily reading, not for sysadmins. Privacy-first from the first commit: European servers (Supabase Frankfurt), real GDPR compliance, no data brokers, no trackers. The strategic differentiation versus cloud-to-cloud bridge apps in the category is that FitMesh is not a silent data router: it is a destination. Data is stored, visualized with curated charts, and in the medium term shared between family members (Family Mesh, roadmap) for caregiver scenarios. The app is in private beta with 100 lifetime-free founder seats; iOS is coming in 2027.",
    },

    keyFactsTitle: "Key facts",
    keyFacts: [
      { label: "Launch", value: "Private beta May 2026 · Public Q3 2026" },
      { label: "Platforms", value: "Android (iOS 2027)" },
      { label: "Country", value: "Italy · EU servers (Frankfurt)" },
      { label: "Tech stack", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearables supported", value: "9+ brands via Health Connect, expandable" },
      { label: "Pricing", value: `Free tier + Pro ${PRICING.fromLifetime.en} one-time (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) or ${PRICING.subSixMonthsLabel.en}` },
      { label: "Founder seats", value: "100 lifetime-free (beta)" },
      { label: "Team", value: "Indie / solo dev (Fosforonero, Matteo Pizzi)" },
      { label: "Play Store category", value: "Health & Fitness" },
    ],

    founderTitle: "Founder",
    founderName: "Matteo Pizzi",
    founderRole: "Founder & Solo Dev · Fosforonero",
    founderBio:
      "Italian software developer, built FitMesh Sync to fill the gap between wearables and personal dashboard. The whole app, backend and site are developed and maintained by him. Privacy-first and indie-first approach.",

    assetsTitle: "Downloadable assets",
    assets: [
      {
        label: "Logo / square icon (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph image (1200×630, dynamic)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "For in-app screenshots, mockups, video or custom brand materials write to press@fitmesh.fit, we reply within 24h.",

    storyAnglesTitle: "Interesting editorial angles",
    storyAngles: [
      "Italian indie dev builds a privacy-first European alternative to Samsung/Apple/Google Fit walled gardens",
      "How Health Connect changed the Android wearable ecosystem since 2024, and what it means for consumers and devs",
      "Caregiver tech: monitoring aging parents' health without GPS or invasive apps (the Family Mesh roadmap)",
      "Lifetime-free founder beta program: an alternative to subscription hype, even in fitness apps",
      "Building a health app in Italy: GDPR, EU servers, data sovereignty as a differentiator",
    ],

    trademarkNote:
      "FitMesh Sync is a trademark of Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit and other brands mentioned are trademarks of their respective owners; their use on this page and in FitMesh materials does not imply affiliation or sponsorship.",

    sitemapNote:
      "Need specific links? You can find everything at fitmesh.fit (home, /en/famiglia for the caregiver use case, /en/blog for technical articles, /en/about for the project story).",
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

  const title = lc === "it"
    ? "Press & Media Kit — FitMesh Sync"
    : "Press & Media Kit — FitMesh Sync";
  const description = lc === "it"
    ? "Risorse per giornalisti, blogger e creator che scrivono di FitMesh Sync: tagline, descrizioni copia-incolla, asset, founder bio, contatto stampa diretto."
    : "Resources for journalists, bloggers and creators writing about FitMesh Sync: tagline, copy-paste descriptions, assets, founder bio, direct press contact.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${lc}/press`,
      languages: {
        it: `${SITE_URL}/it/press`,
        en: `${SITE_URL}/en/press`,
        "x-default": `${SITE_URL}/it/press`,
      },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${lc}/press`,
      siteName: "FitMesh Sync",
      title,
      description,
      locale: ogLocale[lc],
    },
  };
}

export default async function PressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const t = COPY[lc];
  const path = `/${lc}/press`;
  const crumbName = lc === "it" ? "Press" : "Press";

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name: lc === "it" ? "Press & Media Kit — FitMesh Sync" : "Press & Media Kit — FitMesh Sync",
    inLanguage: lc === "it" ? "it-IT" : "en-US",
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: { "@id": `${SITE_URL}#organization` },
  };

  return (
    <article className="relative">
      <JsonLd data={webPageLd} />
      <Breadcrumbs items={[{ name: crumbName, path }]} locale={lc} />

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-12 sm:pt-16 sm:pb-16">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-aqua font-semibold">
          {t.kicker}
        </p>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl lg:text-display-xl font-semibold tracking-tightest text-text-primary text-balance">
          {t.h1}
        </h1>
        <p className="mt-6 text-lg text-text-secondary leading-relaxed">
          {t.sub}
        </p>
      </section>

      {/* CONTACT */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border border-brand-aqua/30 bg-brand-aqua/[0.04] p-6 sm:p-7">
          <h2 className="font-display text-xl font-bold text-text-primary">
            {t.contactTitle}
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">{t.contactBody}</p>
          <p className="mt-4">
            <a
              href={`mailto:${t.contactEmail}`}
              className="text-brand-aqua font-mono text-lg font-semibold hover:text-brand-green transition"
            >
              {t.contactEmail}
            </a>
            <span className="ml-2 text-text-muted text-sm">
              ({lc === "it" ? "oppure" : "or"}{" "}
              <a
                href={`mailto:${t.contactAltEmail}`}
                className="text-text-secondary underline hover:text-text-primary"
              >
                {t.contactAltEmail}
              </a>
              )
            </span>
          </p>
          <p className="mt-2 text-sm text-text-muted">{t.contactPersonLine}</p>
        </div>
      </section>

      {/* TAGLINE */}
      <Block title={t.taglineTitle}>
        <CopyBox text={t.tagline} />
      </Block>

      {/* BLURBS */}
      <Block title={t.blurbsTitle}>
        <div className="space-y-5">
          <NamedCopyBox title={t.blurb50.title} text={t.blurb50.body} />
          <NamedCopyBox title={t.blurb100.title} text={t.blurb100.body} />
          <NamedCopyBox title={t.blurb200.title} text={t.blurb200.body} />
        </div>
      </Block>

      {/* KEY FACTS */}
      <Block title={t.keyFactsTitle}>
        <dl className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {t.keyFacts.map((kf) => (
            <div
              key={kf.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <dt className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold">
                {kf.label}
              </dt>
              <dd className="mt-1 text-sm text-text-primary font-medium">
                {kf.value}
              </dd>
            </div>
          ))}
        </dl>
      </Block>

      {/* FOUNDER */}
      <Block title={t.founderTitle}>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex gap-5 items-start">
          <div className="shrink-0 w-14 h-14 rounded-full bg-brand-aqua/15 border border-brand-aqua/30 flex items-center justify-center text-brand-aqua font-display font-bold text-2xl">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-text-primary text-lg">
              {t.founderName}
            </p>
            <p className="text-xs text-text-muted">{t.founderRole}</p>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              {t.founderBio}
            </p>
            <p className="mt-3 text-xs">
              <a
                href="https://www.fosforonero.com"
                target="_blank"
                rel="noopener"
                className="text-brand-aqua hover:text-brand-green underline"
              >
                fosforonero.com
              </a>
            </p>
          </div>
        </div>
      </Block>

      {/* ASSETS */}
      <Block title={t.assetsTitle}>
        <ul className="space-y-2">
          {t.assets.map((a) => (
            <li key={a.label}>
              <a
                href={a.href}
                download
                className="inline-flex items-center gap-2 text-sm text-brand-aqua hover:text-brand-green transition"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {a.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-text-muted">{t.assetsNote}</p>
      </Block>

      {/* STORY ANGLES */}
      <Block title={t.storyAnglesTitle}>
        <ul className="space-y-2.5">
          {t.storyAngles.map((angle) => (
            <li
              key={angle}
              className="flex gap-2.5 text-sm text-text-secondary leading-relaxed"
            >
              <span className="text-brand-aqua mt-0.5 shrink-0">→</span>
              <span>{angle}</span>
            </li>
          ))}
        </ul>
      </Block>

      {/* TRUST */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
        <TrustBadges locale={lc} />
      </section>

      {/* TRADEMARK + SITEMAP NOTE */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-card border border-divider bg-bg-card/40 p-5 space-y-3">
          <p className="text-xs text-text-muted leading-relaxed">
            {t.trademarkNote}
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            {t.sitemapNote}
          </p>
          <p className="text-xs text-text-muted">
            <Link href={`/${lc}/about`} className="text-text-secondary underline hover:text-text-primary">
              {lc === "it" ? "Più sul progetto →" : "More about the project →"}
            </Link>
          </p>
        </div>
      </section>
    </article>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
      <h2 className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function CopyBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-sm text-text-primary leading-relaxed selection:bg-brand-aqua/30">
        {text}
      </p>
      <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-text-muted">
        {/* Hint: l'utente seleziona testo, copia con Cmd/Ctrl+C. */}
        ↑ {/* selectable */}
      </p>
    </div>
  );
}

function NamedCopyBox({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold mb-2">
        {title}
      </p>
      <p className="text-sm text-text-primary leading-relaxed selection:bg-brand-aqua/30">
        {text}
      </p>
    </div>
  );
}
