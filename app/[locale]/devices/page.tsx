import type { Metadata } from "next";
import Link from "next/link";
import { locales, type Locale, getDictionary } from "@/lib/i18n";

const SITE_URL = "https://www.fitmesh.fit";

type Tier = "full" | "core" | "bridge";

type DeviceRow = {
  brand: string;
  models: string;
  app: string;
  tier: Tier;
  notes_it: string;
  notes_en: string;
};

// Master compatibility list. Update this when adding new tested devices.
// Tier semantics:
//   "full"   = all metrics including SpO2, HRV, skin temp, sleep stages, intraday HR
//   "core"   = steps, HR avg, sleep duration, calories, distance via Health Connect
//   "bridge" = requires a community bridge app (Gadgetbridge) — best-effort
const DEVICES: DeviceRow[] = [
  // ── Tier 1: full support via direct SDK ──
  {
    brand: "Samsung",
    models: "Galaxy Watch 4 / 5 / 6 / 7 / Ultra, Galaxy Fit3",
    app: "Samsung Health",
    tier: "full",
    notes_it: "Supporto completo via Samsung Health Data SDK + Health Connect: SpO₂, HRV notturna, temperatura pelle, fasi del sonno, battito intraday.",
    notes_en: "Full support via Samsung Health Data SDK + Health Connect: SpO₂, nightly HRV, skin temperature, sleep stages, intraday heart rate.",
  },
  // ── Tier 2: core metrics via Health Connect ──
  {
    brand: "Xiaomi",
    models: "Watch S1 / S2 / S3, Watch 2 Pro, Redmi Watch 4 / 5",
    app: "Mi Fitness",
    tier: "core",
    notes_it: "Passi, battito medio, sonno, calorie, distanza tramite Health Connect. SpO₂ e HRV non esposti dall'app Mi Fitness.",
    notes_en: "Steps, average heart rate, sleep, calories, distance via Health Connect. SpO₂ and HRV are not exposed by the Mi Fitness app.",
  },
  {
    brand: "Xiaomi",
    models: "Smart Band 8 / 9 / 9 Pro",
    app: "Mi Fitness",
    tier: "core",
    notes_it: "Metriche di base tramite Health Connect. Battito intraday non sempre disponibile.",
    notes_en: "Core metrics via Health Connect. Intraday heart rate not always available.",
  },
  {
    brand: "Amazfit / Zepp",
    models: "GTR / GTS series, T-Rex, Bip 5 / 6, Active 2, Helio Ring",
    app: "Zepp App",
    tier: "core",
    notes_it: "Integrazione ufficiale con Health Connect dalla Zepp App. Concedere lettura nei permessi.",
    notes_en: "Official Health Connect integration in the Zepp App. Grant read permission in settings.",
  },
  {
    brand: "Huawei / Honor",
    models: "Watch GT 3 / 4 / 5, Band 8 / 9 (con servizio HMS)",
    app: "Huawei Health",
    tier: "core",
    notes_it: "Supportato tramite il bridge Huawei Health → Health Connect (disponibile solo su alcune regioni).",
    notes_en: "Supported via the Huawei Health → Health Connect bridge (available in select regions only).",
  },
  {
    brand: "Garmin",
    models: "Forerunner, Fenix, Vivoactive, Venu series",
    app: "Garmin Connect",
    tier: "core",
    notes_it: "Garmin Connect espone passi, sonno e battito a Health Connect. VO₂ max e zone HR non ancora esportati.",
    notes_en: "Garmin Connect exposes steps, sleep and heart rate to Health Connect. VO₂ max and HR zones not yet exported.",
  },
  {
    brand: "Fitbit / Google",
    models: "Versa 4, Sense 2, Charge 6, Pixel Watch 1 / 2 / 3",
    app: "Fitbit",
    tier: "core",
    notes_it: "Pixel Watch e dispositivi Fitbit recenti scrivono su Health Connect. Account Google richiesto.",
    notes_en: "Pixel Watch and recent Fitbit devices write to Health Connect. Google account required.",
  },
  {
    brand: "Polar",
    models: "Vantage, Pacer, Ignite series",
    app: "Polar Flow",
    tier: "core",
    notes_it: "Polar Flow scrive su Health Connect i dati di allenamento e sonno.",
    notes_en: "Polar Flow writes training and sleep data to Health Connect.",
  },
  {
    brand: "Suunto",
    models: "Vertical, Race / Race S, Run, 9 Peak Pro, 5 Peak",
    app: "Suunto",
    tier: "core",
    notes_it: "Integrazione Health Connect ufficiale dall'app Suunto: passi, sonno, allenamenti, battito. Concedi i permessi di scrittura in Suunto → Impostazioni → Health Connect.",
    notes_en: "Official Health Connect integration in the Suunto app: steps, sleep, workouts, heart rate. Grant write permissions in Suunto → Settings → Health Connect.",
  },
  {
    brand: "Coros",
    models: "Pace 3, Apex 2 / 2 Pro, Vertix 2",
    app: "Coros",
    tier: "core",
    notes_it: "App Coros con supporto Health Connect: passi, sonno, attività. Resting HR e SpO₂ disponibili su modelli premium.",
    notes_en: "Coros app with Health Connect support: steps, sleep, activity. Resting HR and SpO₂ available on premium models.",
  },
  {
    brand: "Oura",
    models: "Ring Gen 3 / Gen 4",
    app: "Oura",
    tier: "core",
    notes_it: "Anello Oura sincronizza sonno, HRV, temperatura corporea e readiness via Health Connect.",
    notes_en: "Oura ring syncs sleep, HRV, body temperature and readiness via Health Connect.",
  },
  {
    brand: "Withings",
    models: "ScanWatch, Steel HR, Pulse, body scales",
    app: "Withings Health Mate",
    tier: "core",
    notes_it: "Bilance e orologi Withings sincronizzano peso, sonno e attività su Health Connect.",
    notes_en: "Withings scales and watches sync weight, sleep and activity to Health Connect.",
  },
  // ── Tier 3: community bridge ──
  {
    brand: "Xiaomi (vecchi)",
    models: "Mi Band 1 / 2 / 3 / 4 / 5 / 6",
    app: "Gadgetbridge (community)",
    tier: "bridge",
    notes_it: "Le Mi Band vecchie non parlano direttamente con Health Connect. Soluzione community: Gadgetbridge (app open-source).",
    notes_en: "Older Mi Bands do not talk to Health Connect directly. Community solution: Gadgetbridge (open-source app).",
  },
];

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const titles: Record<Locale, string> = {
    it: "Device supportati — FitMesh Sync",
    en: "Supported devices — FitMesh Sync",
  };
  const desc: Record<Locale, string> = {
    it: "Quali smartwatch e fitness band funzionano con FitMesh Sync. Samsung, Xiaomi, Amazfit, Huawei, Garmin, Fitbit e Pixel Watch supportati tramite Health Connect.",
    en: "Which smartwatches and fitness bands work with FitMesh Sync. Samsung, Xiaomi, Amazfit, Huawei, Garmin, Fitbit and Pixel Watch supported via Health Connect.",
  };
  return {
    title: titles[lc],
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/devices`,
      languages: {
        it: `${SITE_URL}/it/devices`,
        en: `${SITE_URL}/en/devices`,
        "x-default": `${SITE_URL}/it/devices`,
      },
    },
    openGraph: {
      title: titles[lc],
      description: desc[lc],
      url: `${SITE_URL}/${lc}/devices`,
      type: "website",
    },
  };
}

export default async function DevicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);
  const isIt = lc === "it";

  // ── i18n copy (inline, mirrors support page pattern) ──
  const copy = isIt
    ? {
        kicker: "Compatibilità",
        h1: "Tutti gli smartwatch che parlano Health Connect funzionano con FitMesh Sync.",
        sub: "Samsung Galaxy Watch ha integrazione nativa con SDK dedicata. Tutti gli altri orologi maggiori (Xiaomi, Amazfit, Huawei, Garmin, Fitbit, Pixel Watch, Polar, Withings) sincronizzano tramite Health Connect, l'hub salute di Google. Per le Mi Band vecchie esiste un bridge open-source.",
        howItWorksTitle: "Come funziona",
        howItWorksBody: "Health Connect è l'hub di salute di Android. Qualsiasi app che scrive lì — Mi Fitness, Zepp, Huawei Health, Garmin Connect, Fitbit, Polar Flow — viene letta automaticamente da FitMesh Sync. Niente integrazioni separate, niente account social, niente dati che escono dal tuo telefono fino a quando non li mandi tu sul tuo server.",
        tableTitle: "Tabella di compatibilità",
        tierFull: "Supporto completo",
        tierCore: "Metriche di base",
        tierBridge: "Richiede bridge community",
        thBrand: "Brand",
        thModels: "Modelli",
        thApp: "App richiesta",
        thNotes: "Note",
        setupTitle: "Configurazione per brand",
        setupXiaomiTitle: "Xiaomi (Mi Watch, Smart Band 8/9, Redmi Watch)",
        setupXiaomiSteps: [
          "Installa Mi Fitness dal Play Store e abbina il tuo dispositivo.",
          "Installa Health Connect (se non già presente sul telefono).",
          "Apri Mi Fitness → Profilo → Privacy → Health Connect → Autorizza.",
          "Concedi i permessi di lettura nel pannello Health Connect.",
          "Apri FitMesh Sync → Sincronizza Ora.",
        ],
        setupAmazfitTitle: "Amazfit / Zepp (GTR, Bip, T-Rex, Active)",
        setupAmazfitSteps: [
          "Installa Zepp App dal Play Store e abbina il tuo dispositivo.",
          "Apri Zepp App → Profilo → Impostazioni → Permessi → Health Connect.",
          "Concedi i permessi di lettura nel pannello Health Connect.",
          "Apri FitMesh Sync → Sincronizza Ora.",
        ],
        setupGalaxyTitle: "Samsung Galaxy Watch (4 / 5 / 6 / 7 / Ultra)",
        setupGalaxySteps: [
          "Assicurati che Samsung Health sia aggiornata all'ultima versione.",
          "Indossa l'orologio per almeno 30 minuti — Samsung Health raccoglie i dati.",
          "Apri FitMesh Sync → Collega Samsung Health → autorizza le richieste.",
          "Concedi anche il permesso «Lettura dati in background» dentro Health Connect.",
        ],
        bridgeTitle: "Bridge per Mi Band vecchie (1–6)",
        bridgeBody: "Le Mi Band dalla 1 alla 6 non scrivono dati su Health Connect e Mi Fitness non le supporta più. La community ha sviluppato",
        bridgeName: " Gadgetbridge",
        bridgeBody2: ", un'app open-source che si connette direttamente alla band via Bluetooth e può esportare verso Health Connect. È una soluzione community: noi non possiamo garantire stabilità o continuità del supporto. Installazione manuale tramite F-Droid.",
        bridgeCta: "Visita il sito Gadgetbridge",
        notListedTitle: "Il tuo orologio non è in lista?",
        notListedBody: "Se il tuo smartwatch ha un'app companion che supporta Health Connect, molto probabilmente funziona. Scrivici il modello e proveremo insieme:",
        notListedCta: "Scrivi a support@fitmesh.fit",
      }
    : {
        kicker: "Compatibility",
        h1: "Every smartwatch that speaks Health Connect works with FitMesh Sync.",
        sub: "Samsung Galaxy Watch has native integration via a dedicated SDK. All other major brands (Xiaomi, Amazfit, Huawei, Garmin, Fitbit, Pixel Watch, Polar, Withings) sync through Health Connect, Google's health data hub. For older Mi Bands an open-source bridge is available.",
        howItWorksTitle: "How it works",
        howItWorksBody: "Health Connect is Android's central health data hub. Any companion app that writes there — Mi Fitness, Zepp, Huawei Health, Garmin Connect, Fitbit, Polar Flow — is automatically read by FitMesh Sync. No separate integrations, no social accounts, no data leaving your phone until you decide to send it to your own server.",
        tableTitle: "Compatibility table",
        tierFull: "Full support",
        tierCore: "Core metrics",
        tierBridge: "Community bridge required",
        thBrand: "Brand",
        thModels: "Models",
        thApp: "Companion app",
        thNotes: "Notes",
        setupTitle: "Brand-specific setup",
        setupXiaomiTitle: "Xiaomi (Mi Watch, Smart Band 8/9, Redmi Watch)",
        setupXiaomiSteps: [
          "Install Mi Fitness from the Play Store and pair your device.",
          "Install Health Connect (if not already on your phone).",
          "Open Mi Fitness → Profile → Privacy → Health Connect → Authorize.",
          "Grant read permissions in the Health Connect panel.",
          "Open FitMesh Sync → Sync Now.",
        ],
        setupAmazfitTitle: "Amazfit / Zepp (GTR, Bip, T-Rex, Active)",
        setupAmazfitSteps: [
          "Install the Zepp App from the Play Store and pair your device.",
          "Open Zepp App → Profile → Settings → Permissions → Health Connect.",
          "Grant read permissions in the Health Connect panel.",
          "Open FitMesh Sync → Sync Now.",
        ],
        setupGalaxyTitle: "Samsung Galaxy Watch (4 / 5 / 6 / 7 / Ultra)",
        setupGalaxySteps: [
          "Make sure Samsung Health is updated to the latest version.",
          "Wear the watch for at least 30 minutes — Samsung Health collects data.",
          "Open FitMesh Sync → Connect Samsung Health → authorize the requests.",
          "Also grant the «Read data in background» permission inside Health Connect.",
        ],
        bridgeTitle: "Bridge for older Mi Bands (1–6)",
        bridgeBody: "Mi Bands 1 through 6 do not write data to Health Connect and Mi Fitness no longer supports them. The community has built",
        bridgeName: " Gadgetbridge",
        bridgeBody2: ", an open-source app that connects directly to the band over Bluetooth and can export to Health Connect. This is a community solution: we cannot guarantee stability or long-term support. Manual installation via F-Droid.",
        bridgeCta: "Visit Gadgetbridge",
        notListedTitle: "Your watch is not on the list?",
        notListedBody: "If your smartwatch has a companion app with Health Connect support, it most likely works. Tell us the model and we'll figure it out together:",
        notListedCta: "Email support@fitmesh.fit",
      };

  const tierLabel: Record<Tier, string> = {
    full: copy.tierFull,
    core: copy.tierCore,
    bridge: copy.tierBridge,
  };

  // Tier visual styling
  const tierBadge: Record<Tier, string> = {
    full: "bg-brand-green/15 text-brand-green border-brand-green/30",
    core: "bg-brand-aqua/15 text-brand-aqua border-brand-aqua/30",
    bridge: "bg-text-muted/15 text-text-secondary border-divider",
  };

  // Structured data: ItemList + each device as an item.
  // This is genuinely useful for SEO ("which smartwatches work with FitMesh") long-tail queries.
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isIt ? "Device supportati da FitMesh Sync" : "Devices supported by FitMesh Sync",
    inLanguage: isIt ? "it-IT" : "en-US",
    itemListElement: DEVICES.map((d, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Product",
        name: `${d.brand} — ${d.models}`,
        description: isIt ? d.notes_it : d.notes_en,
        brand: { "@type": "Brand", name: d.brand },
      },
    })),
  };

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <header className="mb-12 max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {copy.kicker}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-text-primary leading-[1.1]">
          {copy.h1}
        </h1>
        <p className="mt-4 text-text-secondary leading-relaxed">{copy.sub}</p>
      </header>

      {/* ── How it works ── */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-semibold text-text-primary">
          {copy.howItWorksTitle}
        </h2>
        <p className="mt-3 text-text-secondary leading-relaxed max-w-3xl">
          {copy.howItWorksBody}
        </p>
      </section>

      {/* ── Compatibility table ── */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-semibold text-text-primary mb-6">
          {copy.tableTitle}
        </h2>

        {/* Tier legend */}
        <div className="flex flex-wrap gap-2 mb-6 text-xs">
          {(["full", "core", "bridge"] as Tier[]).map((tier) => (
            <span
              key={tier}
              className={`inline-flex items-center px-2.5 py-1 rounded-pill border ${tierBadge[tier]}`}
            >
              {tierLabel[tier]}
            </span>
          ))}
        </div>

        {/* Desktop: real table; Mobile: cards */}
        <div className="hidden md:block overflow-x-auto rounded-[14px] border border-divider">
          <table className="w-full text-sm">
            <thead className="bg-bg-card/60 text-text-muted text-[11px] uppercase tracking-[0.12em]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{copy.thBrand}</th>
                <th className="text-left px-4 py-3 font-medium">{copy.thModels}</th>
                <th className="text-left px-4 py-3 font-medium">{copy.thApp}</th>
                <th className="text-left px-4 py-3 font-medium">{copy.thNotes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {DEVICES.map((d, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-text-primary">{d.brand}</div>
                    <span
                      className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-pill border text-[10px] ${tierBadge[d.tier]}`}
                    >
                      {tierLabel[d.tier]}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top text-text-secondary">{d.models}</td>
                  <td className="px-4 py-4 align-top text-text-secondary">{d.app}</td>
                  <td className="px-4 py-4 align-top text-text-secondary text-[13px] leading-relaxed">
                    {isIt ? d.notes_it : d.notes_en}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {DEVICES.map((d, i) => (
            <div
              key={i}
              className="rounded-[14px] border border-divider bg-bg-card/50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-text-primary">{d.brand}</h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-pill border text-[10px] shrink-0 ${tierBadge[d.tier]}`}
                >
                  {tierLabel[d.tier]}
                </span>
              </div>
              <p className="mt-1.5 text-text-secondary text-sm">{d.models}</p>
              <p className="mt-2 text-text-muted text-xs">
                <span className="uppercase tracking-wider">{copy.thApp}: </span>
                {d.app}
              </p>
              <p className="mt-2.5 text-text-secondary text-[13px] leading-relaxed">
                {isIt ? d.notes_it : d.notes_en}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Brand-specific setup ── */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-semibold text-text-primary mb-6">
          {copy.setupTitle}
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: copy.setupGalaxyTitle, steps: copy.setupGalaxySteps, accent: "brand-green" },
            { title: copy.setupXiaomiTitle, steps: copy.setupXiaomiSteps, accent: "brand-aqua" },
            { title: copy.setupAmazfitTitle, steps: copy.setupAmazfitSteps, accent: "brand-blue" },
          ].map((card, i) => (
            <div
              key={i}
              className="rounded-[14px] border border-divider bg-bg-card/50 p-5"
            >
              <h3 className="font-medium text-text-primary text-sm leading-snug">
                {card.title}
              </h3>
              <ol className="mt-3 space-y-2 text-text-secondary text-[13px] leading-relaxed list-decimal list-inside">
                {card.steps.map((step, j) => (
                  <li key={j}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gadgetbridge bridge ── */}
      <section className="mb-16">
        <div className="rounded-[14px] border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-8">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            {copy.bridgeTitle}
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">
            {copy.bridgeBody}
            <strong className="text-text-primary">{copy.bridgeName}</strong>
            {copy.bridgeBody2}
          </p>
          <div className="mt-5">
            <a
              href="https://gadgetbridge.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-pill border border-divider text-text-primary hover:bg-white/5 transition text-sm"
            >
              {copy.bridgeCta}
              <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Not listed? ── */}
      <section>
        <div className="rounded-[14px] border border-divider bg-bg-card/40 p-8">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            {copy.notListedTitle}
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">{copy.notListedBody}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="mailto:support@fitmesh.fit?subject=Device%20compatibility"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill btn-cta text-sm"
            >
              {copy.notListedCta}
            </a>
            <Link
              href={`/${lc}/support`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill border border-divider text-text-primary hover:bg-white/5 transition text-sm"
            >
              {t.nav.support}
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
