import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { organizationCompactRef } from "@/components/seo/OrganizationJsonLd";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { CTA_PLACEMENTS } from "@/lib/analytics/cta";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";
import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { providerLinkHref } from "@/lib/providers/indexability";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { FITNESS_DATA_SYNC_COMPLETE_LOCALES } from "@/lib/content/static-page-locales";
import {
  DETAILED_COMPATIBILITY,
  OTHER_PROVIDERS_COMPATIBILITY,
  FITNESS_DATA_SYNC_FAQ,
  tl,
  tll,
  type CompatibilityRow,
  type Localized,
  type LocalizedList,
} from "@/lib/content/fitness-data-sync-copy";

/**
 * Landing commerciale "fitness data sync" (sprint P0.2, Fase 3 + Fase 7).
 *
 * Route TOP-LEVEL (non /lp/[slug]): scelta deliberata per tenere questa
 * pagina commerciale fuori dal prefisso landing generico, per il cluster di
 * query "sync fitness data" / "combine fitness data" / "avoid duplicate
 * fitness data".
 *
 * Fase 7 (2026-07-12): contenuto tradotto it/en/de/es (vedi
 * lib/content/fitness-data-sync-copy.ts per il motivo della traduzione a
 * mano invece che via tools/local-translator). FITNESS_DATA_SYNC_COMPLETE_LOCALES
 * estesa a tutte e 4 le locale supportate da questa route (FDS_LOCALES),
 * quindi tutte e 4 sono ora indicizzabili (niente più noindex).
 *
 * Slug localizzati "pretty" (IT "sincronizzazione-dati-fitness", DE/ES
 * equivalenti) NON implementati in questo sprint: richiederebbero rewrite
 * dedicate in next.config.mjs + aggiornare canonical/hreflang per puntare
 * all'URL pretty invece che a quello letterale. Deferred: il contenuto
 * tradotto (leva SEO primaria) ha priorità sullo slug localizzato (leva
 * SEO secondaria) dato il tempo disponibile in questo sprint — vedi report
 * finale.
 *
 * Le altre 11 locale del sito NON sono in scope per questa pagina (sprint
 * esplicito: "Implementa inizialmente solo: EN; DE; ES; IT") → notFound().
 */

const FDS_LOCALES: readonly Locale[] = ["it", "en", "de", "es"];

const STATUS_LABEL: Record<CompatibilityRow["status"], Localized> = {
  live: { it: "Live", en: "Live", es: "Live", de: "Live" },
  "in-development": { it: "In sviluppo", en: "In development", es: "En desarrollo", de: "In Entwicklung" },
  roadmap: { it: "Roadmap", en: "Roadmap", es: "Roadmap", de: "Roadmap" },
  beta: { it: "Beta", en: "Beta", es: "Beta", de: "Beta" },
};

const STATUS_COLOR: Record<CompatibilityRow["status"], string> = {
  live: "#31E981",
  "in-development": "#38BDF8",
  roadmap: "#94A3B8",
  beta: "#F5A623",
};

const DIRECTION_LABEL: Record<CompatibilityRow["direction"], Localized> = {
  read: { it: "Lettura", en: "Read", es: "Lectura", de: "Lesen" },
  write: { it: "Scrittura", en: "Write", es: "Escritura", de: "Schreiben" },
  "read-write": {
    it: "Lettura + write-back",
    en: "Read + write-back",
    es: "Lectura + write-back",
    de: "Lesen + Write-back",
  },
  export: { it: "Export", en: "Export", es: "Exportación", de: "Export" },
};

const FIELD_LABEL = {
  connection: { it: "Connessione: ", en: "Connection: ", es: "Conexión: ", de: "Verbindung: " } satisfies Localized,
  dataTypes: { it: "Tipi di dati: ", en: "Data types: ", es: "Tipos de datos: ", de: "Datentypen: " } satisfies Localized,
  auth: { it: "Autenticazione: ", en: "Authentication: ", es: "Autenticación: ", de: "Authentifizierung: " } satisfies Localized,
  default: { it: "Default: ", en: "Default: ", es: "Predeterminado: ", de: "Standard: " } satisfies Localized,
  syncFrequency: { it: "Frequenza sync: ", en: "Sync frequency: ", es: "Frecuencia de sincronización: ", de: "Sync-Häufigkeit: " } satisfies Localized,
  limitations: { it: "Limitazioni: ", en: "Limitations: ", es: "Limitaciones: ", de: "Einschränkungen: " } satisfies Localized,
  lastVerified: { it: "Ultima verifica: ", en: "Last verified: ", es: "Última verificación: ", de: "Zuletzt überprüft: " } satisfies Localized,
  fullGuide: { it: "Guida completa →", en: "Full setup guide →", es: "Guía completa →", de: "Vollständige Anleitung →" } satisfies Localized,
};

function isTranslated(lc: Locale): boolean {
  return FITNESS_DATA_SYNC_COMPLETE_LOCALES.includes(lc);
}

export function generateStaticParams() {
  return FDS_LOCALES.map((locale) => ({ locale }));
}

function fdsLanguages(): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const l of FDS_LOCALES) {
    langs[l] = `${SITE_URL}/${l}/fitness-data-sync`;
  }
  langs["x-default"] = `${SITE_URL}/it/fitness-data-sync`;
  return langs;
}

const META_TITLE: Localized = {
  it: "Sincronizza i dati fitness tra app e wearable | FitMesh",
  en: "Sync Fitness Data Across Apps and Wearables | FitMesh",
  es: "Sincroniza datos de fitness entre apps y wearables | FitMesh",
  de: "Fitnessdaten zwischen Apps und Wearables synchronisieren | FitMesh",
};
const META_DESCRIPTION: Localized = {
  it: "Combina i dati fitness da Health Connect, Apple Health e wearable connessi in un'unica dashboard. Vedi esattamente cosa è live, cosa è read-only e cosa è ancora in sviluppo prima di farci affidamento.",
  en: "Combine fitness data from Health Connect, Apple Health and connected wearables into one dashboard. See exactly what's live, what's read-only, and what's still in development before you rely on it.",
  es: "Combina datos de fitness de Health Connect, Apple Health y wearables conectados en un solo panel. Ve exactamente qué está en vivo, qué es solo lectura y qué sigue en desarrollo antes de confiar en ello.",
  de: "Kombiniere Fitnessdaten aus Health Connect, Apple Health und verbundenen Wearables in einem Dashboard. Sieh genau, was live ist, was nur lesend funktioniert und was sich noch in Entwicklung befindet, bevor du dich darauf verlässt.",
};
const META_KEYWORDS: Record<Locale, string> = {
  it: "sincronizzare dati fitness, sincronizzazione dati fitness, sync wearable, dashboard dati fitness, combinare dati da più dispositivi, evitare dati fitness duplicati",
  en: "sync fitness data, fitness data sync, sync wearable data, fitness data dashboard, combine fitness data from multiple devices, avoid duplicate fitness data",
  es: "sincronizar datos de fitness, sincronización de datos de fitness, sincronizar datos de wearable, panel de datos de fitness, combinar datos de varios dispositivos, evitar datos de fitness duplicados",
  de: "Fitnessdaten synchronisieren, Fitnessdaten-Synchronisierung, Wearable-Daten synchronisieren, Fitnessdaten-Dashboard, Daten mehrerer Geräte kombinieren, doppelte Fitnessdaten vermeiden",
} as Record<Locale, string>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;
  if (!FDS_LOCALES.includes(lc)) return {};

  const path = `/${lc}/fitness-data-sync`;
  const title = tl(META_TITLE, lc);
  const description = tl(META_DESCRIPTION, lc);

  return {
    title,
    description,
    keywords: META_KEYWORDS[lc] ?? META_KEYWORDS.en,
    robots: isTranslated(lc) ? undefined : { index: false, follow: true },
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: fdsLanguages(),
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
      alternateLocale: FDS_LOCALES.filter((l) => l !== lc).map((l) => ogLocale[l]),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function StatusBadge({ status, lc }: { status: CompatibilityRow["status"]; lc: Locale }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: STATUS_COLOR[status], border: `1px solid ${STATUS_COLOR[status]}55` }}
    >
      {tl(STATUS_LABEL[status], lc)}
    </span>
  );
}

// MICRO-GATE P0.13A: `row.detailHref` è salvato SENZA prefisso locale
// (es. "/sync/strava", vedi lib/content/fitness-data-sync-copy.ts) — il
// Link lo renderizzava letteralmente così, un URL senza locale che il
// middleware ridirige (308) verso la locale rilevata. Trovato dal crawl
// esaustivo. Aggiunge il prefisso corretto + verifica indicizzabilità
// (stesso helper di provider/page.tsx altrove in questo sprint).
function resolveDetailHref(detailHref: string | undefined, lc: Locale): string | null {
  if (!detailHref) return null;
  const slug = detailHref.replace(/^\/sync\//, "");
  const provider = PROVIDERS_BY_SLUG[slug];
  if (!provider) return null;
  return providerLinkHref(provider, lc);
}

function CompatibilityCard({ row, lc }: { row: CompatibilityRow; lc: Locale }) {
  const detailHref = resolveDetailHref(row.detailHref, lc);
  return (
    <details className="card p-5 group [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary">{row.source}</span>
            <StatusBadge status={row.status} lc={lc} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {tl(row.platform, lc)} · {tl(DIRECTION_LABEL[row.direction], lc)}
          </p>
        </div>
        <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform shrink-0">
          +
        </span>
      </summary>
      <div className="mt-4 space-y-2 text-sm text-text-secondary leading-relaxed">
        <p><span className="text-text-muted">{tl(FIELD_LABEL.connection, lc)}</span>{tl(row.connectionMethod, lc)}</p>
        <p><span className="text-text-muted">{tl(FIELD_LABEL.dataTypes, lc)}</span>{tl(row.dataTypes, lc)}</p>
        <p><span className="text-text-muted">{tl(FIELD_LABEL.auth, lc)}</span>{tl(row.authMethod, lc)}</p>
        <p><span className="text-text-muted">{tl(FIELD_LABEL.default, lc)}</span>{tl(row.defaultState, lc)}</p>
        <p><span className="text-text-muted">{tl(FIELD_LABEL.syncFrequency, lc)}</span>{tl(row.syncFrequency, lc)}</p>
        <p><span className="text-text-muted">{tl(FIELD_LABEL.limitations, lc)}</span>{tl(row.limitations, lc)}</p>
        <p className="text-xs text-text-muted">{tl(FIELD_LABEL.lastVerified, lc)}{row.lastVerified}</p>
        {detailHref && (
          <p className="pt-1">
            <Link href={detailHref} className="text-brand-aqua hover:text-brand-green underline underline-offset-4">
              {tl(FIELD_LABEL.fullGuide, lc)}
            </Link>
          </p>
        )}
      </div>
    </details>
  );
}

// ── Copy statica della pagina (Localized: it/en/es/de) ─────────────────────
const KICKER: Localized = { it: "Fitness data sync", en: "Fitness data sync", es: "Fitness data sync", de: "Fitness data sync" };
const H1: Localized = {
  it: "Sincronizza tutti i tuoi dati fitness in un'unica dashboard",
  en: "Sync all your fitness data into one dashboard",
  es: "Sincroniza todos tus datos de fitness en un solo panel",
  de: "Synchronisiere all deine Fitnessdaten in einem Dashboard",
};
const HERO_INTRO: Localized = {
  it: "FitMesh combina i dati dei wearable supportati in un'unica dashboard e può opzionalmente scrivere dati selezionati o allenamenti verso destinazioni supportate. Legge da Health Connect (Android), Apple Health più una connessione Bluetooth diretta all'anello Colmi (iOS), e una lista crescente di provider connessi, poi deduplica le metriche sovrapposte invece di contarle due volte. Non è un bridge universale che sincronizza ogni app fitness con ogni altra: controlla la tabella di compatibilità sotto per vedere cosa è davvero live per la fonte o destinazione che ti interessa.",
  en: "FitMesh combines supported wearable data in one dashboard and can optionally write selected data or workouts to supported destinations. It reads from Health Connect (Android), Apple Health plus a direct Bluetooth connection to the Colmi ring (iOS), and a growing list of connected providers, then deduplicates overlapping metrics instead of double-counting them. It is not a universal bridge that syncs every fitness app to every other fitness app: check the compatibility table below for what's actually live for the source or destination you care about.",
  es: "FitMesh combina los datos de los wearables compatibles en un solo panel y puede escribir opcionalmente datos seleccionados o entrenamientos hacia destinos compatibles. Lee desde Health Connect (Android), Apple Health más una conexión Bluetooth directa al anillo Colmi (iOS), y una lista creciente de proveedores conectados, luego deduplica las métricas superpuestas en lugar de contarlas dos veces. No es un bridge universal que sincroniza cada app de fitness con cualquier otra: consulta la tabla de compatibilidad más abajo para ver qué está realmente en vivo para la fuente o destino que te interesa.",
  de: "FitMesh kombiniert Daten unterstützter Wearables in einem Dashboard und kann optional ausgewählte Daten oder Workouts an unterstützte Ziele schreiben. Es liest aus Health Connect (Android), Apple Health plus einer direkten Bluetooth-Verbindung zum Colmi-Ring (iOS) und einer wachsenden Liste verbundener Anbieter und dedupliziert dann überlappende Metriken, statt sie doppelt zu zählen. Es ist keine universelle Bridge, die jede Fitness-App mit jeder anderen synchronisiert: Prüfe die Kompatibilitätstabelle unten, was für die Quelle oder das Ziel, das dich interessiert, tatsächlich live ist.",
};
const CTA_COMPATIBILITY: Localized = {
  it: "Vedi cosa è davvero supportato",
  en: "See what's actually supported",
  es: "Ve qué está realmente compatible",
  de: "Sieh, was wirklich unterstützt wird",
};
const CTA_INTEGRATIONS: Localized = {
  it: "Sfoglia tutte le integrazioni",
  en: "Browse all integrations",
  es: "Explora todas las integraciones",
  de: "Alle Integrationen durchsuchen",
};
const PROBLEM_TITLE: Localized = {
  it: "I tuoi dati fitness sono sparsi tra le app",
  en: "Your fitness data is scattered across apps",
  es: "Tus datos de fitness están dispersos entre apps",
  de: "Deine Fitnessdaten sind über Apps verstreut",
};
const PROBLEM_BODY: Localized = {
  it: "Uno smartwatch riporta i passi a un'app, un anello riporta sonno e frequenza cardiaca a un'altra, una piattaforma di allenamento tiene lo storico degli allenamenti, e nessuna di queste parla con le altre di default. Controllare cinque app per rispondere a \"come ho dormito e quanto ho allenato duro questa settimana\" non è un problema di dati, è un problema di dashboard. In più, lo stesso conteggio di passi o la stessa lettura di frequenza cardiaca vengono spesso riportati due volte, una dal telefono e una dall'orologio, il che gonfia i totali se niente li deduplica.",
  en: "A smartwatch reports steps to one app, a ring reports sleep and heart rate to another, a training platform holds your workout history, and none of them talk to each other by default. Checking five apps to answer \"how did I sleep, and how hard did I train this week\" isn't a data problem, it's a dashboard problem. On top of that, the same step count or heart-rate reading often gets reported twice, once by your phone and once by your watch, which inflates totals if nothing deduplicates them.",
  es: "Un smartwatch reporta pasos a una app, un anillo reporta sueño y frecuencia cardíaca a otra, una plataforma de entrenamiento guarda tu historial de entrenamientos, y ninguna de ellas se comunica con las demás por defecto. Revisar cinco apps para responder \"cómo dormí y qué tan duro entrené esta semana\" no es un problema de datos, es un problema de panel. Además, el mismo conteo de pasos o la misma lectura de frecuencia cardíaca a menudo se reporta dos veces, una vez por tu teléfono y otra por tu reloj, lo que infla los totales si nada los deduplica.",
  de: "Eine Smartwatch meldet Schritte an eine App, ein Ring meldet Schlaf und Herzfrequenz an eine andere, eine Trainingsplattform speichert deine Trainingshistorie, und keine spricht standardmäßig mit den anderen. Fünf Apps zu prüfen, um \"wie habe ich geschlafen und wie hart habe ich diese Woche trainiert\" zu beantworten, ist kein Datenproblem, sondern ein Dashboard-Problem. Hinzu kommt, dass dieselbe Schrittzahl oder Herzfrequenzmessung oft doppelt gemeldet wird, einmal vom Telefon und einmal von der Uhr, was die Summen aufbläht, wenn nichts dedupliziert.",
};
const DEFINITION_TITLE: Localized = {
  it: "Cos'è il fitness data sync?",
  en: "What is fitness data sync?",
  es: "¿Qué es la sincronización de datos de fitness?",
  de: "Was ist Fitnessdaten-Synchronisierung?",
};
const DEFINITION_BODY: Localized = {
  it: "Il fitness data sync copre tre cose diverse che le persone di solito intendono con questo termine: spostare dati da un'app specifica a un'altra (un bridge), dare a ogni app un posto condiviso per leggere e scrivere dati di salute sullo stesso dispositivo (un health hub di piattaforma, come Health Connect su Android o Apple Health su iOS), o leggere da più fonti e mostrarle insieme in un'unica vista indipendente (una dashboard). Risolvono problemi diversi e nessuno dei tre sostituisce completamente gli altri.",
  en: "Fitness data sync covers three different things people usually mean by it: moving data from one specific app to another (a bridge), giving every app a shared place to read and write health data on the same device (a platform health hub, like Health Connect on Android or Apple Health on iOS), or reading from multiple sources and showing them together in one independent view (a dashboard). They solve different problems and none of them fully replaces the others.",
  es: "La sincronización de datos de fitness cubre tres cosas distintas que la gente suele referir con este término: mover datos de una app específica a otra (un bridge), dar a cada app un lugar compartido para leer y escribir datos de salud en el mismo dispositivo (un hub de salud a nivel de sistema, como Health Connect en Android o Apple Health en iOS), o leer de varias fuentes y mostrarlas juntas en una vista independiente (un panel). Resuelven problemas distintos y ninguno reemplaza completamente a los otros.",
  de: "Fitnessdaten-Synchronisierung umfasst drei verschiedene Dinge, die Menschen damit meinen: Daten von einer bestimmten App zu einer anderen verschieben (eine Bridge), jeder App einen gemeinsamen Ort zum Lesen und Schreiben von Gesundheitsdaten auf demselben Gerät geben (ein plattformweiter Health-Hub wie Health Connect auf Android oder Apple Health auf iOS), oder aus mehreren Quellen lesen und sie zusammen in einer unabhängigen Ansicht zeigen (ein Dashboard). Sie lösen unterschiedliche Probleme, und keines ersetzt die anderen vollständig.",
};
const COMPARISON_TITLE: Localized = {
  it: "Health hub, bridge app o dashboard indipendente?",
  en: "Health hub, bridge app, or independent dashboard?",
  es: "¿Hub de salud, bridge app o panel independiente?",
  de: "Health-Hub, Bridge-App oder unabhängiges Dashboard?",
};
const HUB_TITLE: Localized = { it: "Health hub", en: "Health hub", es: "Hub de salud", de: "Health-Hub" };
const HUB_BODY: Localized = {
  it: "Integrato nel sistema operativo (Health Connect, Apple Health). Le app leggono e scrivono lì direttamente. Nessuna dashboard propria, e vede solo ciò che c'è su quel dispositivo.",
  en: "Built into the OS (Health Connect, Apple Health). Apps read and write to it directly. No dashboard of its own, and it only sees what's on that one device.",
  es: "Integrado en el sistema operativo (Health Connect, Apple Health). Las apps leen y escriben ahí directamente. No tiene panel propio, y solo ve lo que hay en ese dispositivo.",
  de: "Ins Betriebssystem integriert (Health Connect, Apple Health). Apps lesen und schreiben dort direkt. Kein eigenes Dashboard, und es sieht nur, was auf diesem einen Gerät ist.",
};
const BRIDGE_TITLE: Localized = { it: "Bridge app", en: "Bridge app", es: "Bridge app", de: "Bridge-App" };
const BRIDGE_BODY: Localized = {
  it: "Sposta dati da una fonte specifica a una destinazione specifica, di solito per un caso d'uso ristretto e ben definito. Non pensata per darti una visione d'insieme.",
  en: "Moves data from one specific source to one specific destination, usually for a narrow, well-defined use case. Not built to show you an overview.",
  es: "Mueve datos de una fuente específica a un destino específico, normalmente para un caso de uso concreto y bien definido. No está pensada para darte una visión general.",
  de: "Verschiebt Daten von einer bestimmten Quelle zu einem bestimmten Ziel, meist für einen engen, klar definierten Anwendungsfall. Nicht dafür gebaut, dir einen Überblick zu geben.",
};
const DASHBOARD_TITLE: Localized = { it: "Dashboard indipendente", en: "Independent dashboard", es: "Panel independiente", de: "Unabhängiges Dashboard" };
const DASHBOARD_BODY: Localized = {
  it: "Legge da più fonti connesse contemporaneamente, deduplica i dati sovrapposti e li mostra insieme. Questo è ciò che è FitMesh. Non promette di scrivere ovunque possa farlo una bridge app.",
  en: "Reads from multiple connected sources at once, deduplicates overlapping data, and shows it together. This is what FitMesh is. It doesn't promise to write everywhere a bridge app might.",
  es: "Lee de varias fuentes conectadas a la vez, deduplica los datos superpuestos y los muestra juntos. Esto es lo que es FitMesh. No promete escribir en todas partes donde podría hacerlo una bridge app.",
  de: "Liest gleichzeitig aus mehreren verbundenen Quellen, dedupliziert überlappende Daten und zeigt sie zusammen. Das ist FitMesh. Es verspricht nicht, überall zu schreiben, wo eine Bridge-App das könnte.",
};
const HOW_TITLE: Localized = { it: "Come funziona FitMesh", en: "How FitMesh works", es: "Cómo funciona FitMesh", de: "So funktioniert FitMesh" };
const HOW_BODY: Localized = {
  it: "Il flusso tipico è: il tuo wearable o la sua app companion scrive dati su un archivio salute di piattaforma (Health Connect su Android) oppure FitMesh li legge direttamente (Apple Health e l'anello Colmi su iOS, o un provider connesso via OAuth come Strava). FitMesh legge da ogni fonte che hai connesso, risolve le sovrapposizioni tra loro e mostra il risultato in un'unica dashboard. Se attivi l'opzione, FitMesh può scrivere il suo risultato deduplicato indietro su Health Connect o Apple Health, oppure esportare singoli allenamenti verso una piattaforma di allenamento, solo per le destinazioni specifiche elencate come supportate nella tabella sotto.",
  en: "The typical flow is: your wearable or its companion app writes data to a platform health store (Health Connect on Android) or FitMesh reads it directly (Apple Health and the Colmi ring on iOS, or an OAuth-connected provider like Strava). FitMesh reads from every source you've connected, resolves overlaps between them, and shows the result in one dashboard. If you opt in, FitMesh can write its deduplicated result back to Health Connect or Apple Health, or export individual workouts to a training platform, only for the specific destinations listed as supporting that in the table below.",
  es: "El flujo típico es: tu wearable o su app complementaria escribe datos en un almacén de salud de la plataforma (Health Connect en Android) o FitMesh los lee directamente (Apple Health y el anillo Colmi en iOS, o un proveedor conectado por OAuth como Strava). FitMesh lee de cada fuente que hayas conectado, resuelve las superposiciones entre ellas y muestra el resultado en un solo panel. Si activas la opción, FitMesh puede escribir su resultado deduplicado de vuelta en Health Connect o Apple Health, o exportar entrenamientos individuales a una plataforma de entrenamiento, solo para los destinos específicos indicados como compatibles en la tabla de abajo.",
  de: "Der typische Ablauf: Dein Wearable oder seine Companion-App schreibt Daten in einen plattformweiten Gesundheitsspeicher (Health Connect auf Android) oder FitMesh liest sie direkt (Apple Health und der Colmi-Ring auf iOS oder ein OAuth-verbundener Anbieter wie Strava). FitMesh liest aus jeder verbundenen Quelle, löst Überschneidungen zwischen ihnen auf und zeigt das Ergebnis in einem Dashboard. Wenn du zustimmst, kann FitMesh sein dedupliziertes Ergebnis zurück in Health Connect oder Apple Health schreiben oder einzelne Workouts an eine Trainingsplattform exportieren, nur für die spezifischen Ziele, die in der Tabelle unten als unterstützt aufgeführt sind.",
};
const HOW_STEPS: LocalizedList = {
  it: [
    "Wearable o app companion (Samsung Health, Garmin Connect, Strava, ...)",
    "Health Connect (Android) o Apple Health / Bluetooth diretto (iOS)",
    "FitMesh legge, deduplica e fonde i dati",
    "Dashboard, e opzionalmente: write-back o export, solo dove supportato",
  ],
  en: [
    "Wearable or companion app (Samsung Health, Garmin Connect, Strava, ...)",
    "Health Connect (Android) or Apple Health / direct Bluetooth (iOS)",
    "FitMesh reads, deduplicates, and fuses the data",
    "Dashboard, and optionally: write-back or export, only where supported",
  ],
  es: [
    "Wearable o app complementaria (Samsung Health, Garmin Connect, Strava, ...)",
    "Health Connect (Android) o Apple Health / Bluetooth directo (iOS)",
    "FitMesh lee, deduplica y fusiona los datos",
    "Panel, y opcionalmente: write-back o export, solo donde esté disponible",
  ],
  de: [
    "Wearable oder Companion-App (Samsung Health, Garmin Connect, Strava, ...)",
    "Health Connect (Android) oder Apple Health / direktes Bluetooth (iOS)",
    "FitMesh liest, dedupliziert und fusioniert die Daten",
    "Dashboard, und optional: Write-back oder Export, nur wo unterstützt",
  ],
};
const MATRIX_TITLE: Localized = { it: "Matrice di compatibilità", en: "Compatibility matrix", es: "Matriz de compatibilidad", de: "Kompatibilitätsmatrix" };
const MATRIX_INTRO: Localized = {
  it: "Ogni riga sotto è verificata contro il codice reale dell'app, non solo contro le sue affermazioni di marketing, incluso se la funzione è raggiungibile da una schermata UI reale, non solo implementata nel backend. \"In sviluppo\" significa che il codice esiste ma non è ancora collegato a nulla che un utente possa toccare. \"Roadmap\" significa che non è ancora costruito.",
  en: "Every row below is verified against the app's actual code, not just its marketing claims, including whether the feature is reachable from a real UI screen, not only implemented in the backend. \"In development\" means the code exists but isn't connected to anything a user can tap yet. \"Roadmap\" means it isn't built.",
  es: "Cada fila de abajo está verificada contra el código real de la app, no solo contra sus afirmaciones de marketing, incluyendo si la función es alcanzable desde una pantalla real de la interfaz, no solo implementada en el backend. \"En desarrollo\" significa que el código existe pero todavía no está conectado a nada que un usuario pueda tocar. \"Roadmap\" significa que no está construido.",
  de: "Jede Zeile unten ist gegen den tatsächlichen Code der App verifiziert, nicht nur gegen ihre Marketingaussagen, einschließlich ob die Funktion von einem echten UI-Bildschirm aus erreichbar ist, nicht nur im Backend implementiert. \"In Entwicklung\" bedeutet, der Code existiert, ist aber noch mit nichts verbunden, was ein Nutzer antippen kann. \"Roadmap\" bedeutet, es ist noch nicht gebaut.",
};
const MATRIX_CORE_LABEL: Localized = { it: "Integrazioni principali", en: "Core integrations", es: "Integraciones principales", de: "Kernintegrationen" };
const MATRIX_OTHER_LABEL: Localized = {
  it: "Altri provider (via Health Connect o connessione diretta)",
  en: "Other providers (via Health Connect or direct connection)",
  es: "Otros proveedores (vía Health Connect o conexión directa)",
  de: "Weitere Anbieter (über Health Connect oder direkte Verbindung)",
};
const MATRIX_FOOTER_PREFIX: Localized = {
  it: " fonti elencate, tutte verificate l'ultima volta il 2026-07-12. Vedi ",
  en: " sources listed, all last verified 2026-07-12. See ",
  es: " fuentes listadas, todas verificadas por última vez el 2026-07-12. Consulta ",
  de: " Quellen aufgeführt, alle zuletzt am 2026-07-12 überprüft. Siehe ",
};
const MATRIX_FOOTER_SUFFIX: Localized = {
  it: " per la lista sempre aggiornata.",
  en: " for the always-current list.",
  es: " para la lista siempre actualizada.",
  de: " für die stets aktuelle Liste.",
};
const LOOP_TITLE: Localized = {
  it: "Come FitMesh previene i loop di sync",
  en: "How FitMesh prevents sync loops",
  es: "Cómo FitMesh previene los bucles de sincronización",
  de: "Wie FitMesh Sync-Loops verhindert",
};
const LOOP_INTRO: Localized = {
  it: "Scrivere dati fusi indietro in un archivio salute crea un rischio ovvio: se FitMesh poi rilegge quegli stessi dati al sync successivo, potrebbe contarli due volte o creare un loop infinito. FitMesh evita questo con alcune regole concrete:",
  en: "Writing fused data back into a health store creates an obvious risk: if FitMesh then reads that same data back on its next sync, it could double-count it or loop indefinitely. FitMesh avoids this with a few concrete rules:",
  es: "Escribir datos fusionados de vuelta en un almacén de salud crea un riesgo obvio: si FitMesh luego lee esos mismos datos en su siguiente sincronización, podría contarlos dos veces o generar un bucle indefinido. FitMesh evita esto con algunas reglas concretas:",
  de: "Das Zurückschreiben fusionierter Daten in einen Gesundheitsspeicher birgt ein offensichtliches Risiko: Wenn FitMesh dieselben Daten bei der nächsten Synchronisierung wieder liest, könnte es sie doppelt zählen oder in eine Endlosschleife geraten. FitMesh vermeidet dies mit einigen konkreten Regeln:",
};
const LOOP_RULES: LocalizedList = {
  it: [
    "Il write-back è disattivato di default. Lo attivi esplicitamente in Impostazioni, separatamente per Health Connect e Apple Health.",
    "Ogni record scritto da FitMesh è taggato con il proprio identificatore di fonte, e la lettura successiva di FitMesh filtra i record con quel tag, così non ri-ingerisce mai le proprie scritture come se fossero una nuova fonte esterna.",
    "Quando più fonti reali riportano la stessa metrica per lo stesso periodo, FitMesh applica regole di fusione per metrica (sceglie la fonte più completa, riempie i buchi dalle altre) invece di sommare ogni fonte insieme.",
    "L'export cross-app (inviare un singolo allenamento a una piattaforma di allenamento) è un'azione monodirezionale attivata dall'utente, non un loop in background: nulla di ciò che FitMesh esporta viene riletto indietro.",
  ],
  en: [
    "Write-back is off by default. You turn it on explicitly in Settings for Health Connect and Apple Health separately.",
    "Every record FitMesh writes is tagged with its own source identifier, and FitMesh's own read pass filters out records carrying that tag, so it never re-ingests its own writes as if they were a new external source.",
    "When multiple real sources report the same metric for the same period, FitMesh applies per-metric fusion rules (pick the more complete source, fill gaps from others) instead of summing every source together.",
    "Cross-app export (sending an individual workout to a training platform) is a one-way, user-triggered action, not a background loop: nothing FitMesh exports gets read back in.",
  ],
  es: [
    "El write-back está desactivado por defecto. Lo activas explícitamente en Ajustes, por separado para Health Connect y Apple Health.",
    "Cada registro que FitMesh escribe está etiquetado con su propio identificador de fuente, y la propia lectura de FitMesh filtra los registros con esa etiqueta, por lo que nunca vuelve a ingerir sus propias escrituras como si fueran una nueva fuente externa.",
    "Cuando varias fuentes reales reportan la misma métrica para el mismo período, FitMesh aplica reglas de fusión por métrica (elige la fuente más completa, rellena los huecos con las demás) en lugar de sumar todas las fuentes juntas.",
    "El export entre apps (enviar un entrenamiento individual a una plataforma de entrenamiento) es una acción unidireccional activada por el usuario, no un bucle en segundo plano: nada de lo que FitMesh exporta se vuelve a leer.",
  ],
  de: [
    "Write-back ist standardmäßig deaktiviert. Du aktivierst es explizit in den Einstellungen, separat für Health Connect und Apple Health.",
    "Jeder von FitMesh geschriebene Datensatz wird mit einer eigenen Quellenkennung markiert, und FitMeshs eigener Lesevorgang filtert Datensätze mit dieser Markierung heraus, sodass es seine eigenen Schreibvorgänge nie erneut als neue externe Quelle aufnimmt.",
    "Wenn mehrere echte Quellen dieselbe Metrik für denselben Zeitraum melden, wendet FitMesh Fusionsregeln pro Metrik an (wählt die vollständigere Quelle, füllt Lücken aus anderen), statt alle Quellen zu addieren.",
    "Cross-App-Export (das Senden eines einzelnen Workouts an eine Trainingsplattform) ist eine einseitige, vom Nutzer ausgelöste Aktion, kein Hintergrund-Loop: Nichts, was FitMesh exportiert, wird wieder eingelesen.",
  ],
};
const PLATFORM_TITLE: Localized = {
  it: "Android, iPhone e la dashboard web",
  en: "Android, iPhone, and the web dashboard",
  es: "Android, iPhone y el panel web",
  de: "Android, iPhone und das Web-Dashboard",
};
const PLATFORM_BODY_1: Localized = {
  it: "Su Android, FitMesh legge da Health Connect, alimentato da qualsiasi app companion tu abbia già installato. Su iPhone, FitMesh legge da Apple Health e può anche connettersi direttamente all'anello Colmi via Bluetooth, senza bisogno di Apple Health come intermediario per quel dispositivo specifico. La dashboard stessa è disponibile sul web oltre che sulle app mobile, così puoi controllare i tuoi dati senza aprire il telefono.",
  en: "On Android, FitMesh reads from Health Connect, which is fed by whatever companion apps you already have installed. On iPhone, FitMesh reads from Apple Health and can also connect directly to the Colmi ring over Bluetooth, without needing Apple Health as an intermediary for that specific device. The dashboard itself is available on the web in addition to the mobile apps, so you can check your data without opening your phone.",
  es: "En Android, FitMesh lee desde Health Connect, alimentado por las apps complementarias que ya tengas instaladas. En iPhone, FitMesh lee desde Apple Health y también puede conectarse directamente al anillo Colmi por Bluetooth, sin necesitar Apple Health como intermediario para ese dispositivo específico. El panel en sí está disponible en la web además de en las apps móviles, para que puedas consultar tus datos sin abrir el teléfono.",
  de: "Auf Android liest FitMesh aus Health Connect, das von den bereits installierten Companion-Apps gespeist wird. Auf dem iPhone liest FitMesh aus Apple Health und kann sich auch direkt über Bluetooth mit dem Colmi-Ring verbinden, ohne Apple Health als Vermittler für dieses spezifische Gerät zu benötigen. Das Dashboard selbst ist zusätzlich zu den mobilen Apps auch im Web verfügbar, sodass du deine Daten prüfen kannst, ohne dein Telefon zu öffnen.",
};
const PLATFORM_BODY_2: Localized = {
  it: "Anche il write-back si comporta diversamente per piattaforma. Su Android, attivare il write-back di Health Connect esporta una volta in quel momento; non continua a esportare automaticamente man mano che arrivano nuovi dati, devi disattivare e riattivare l'interruttore per ri-esportare. Su iOS, una volta attivato il write-back di Apple Health, FitMesh ri-esporta dopo ogni sync riuscito.",
  en: "Write-back also behaves differently per platform. On Android, turning on Health Connect write-back exports once at that moment; it doesn't keep exporting automatically as new data comes in, you need to toggle it off and on again to re-export. On iOS, once you turn on Apple Health write-back, FitMesh re-exports after every successful sync.",
  es: "El write-back también se comporta de forma diferente según la plataforma. En Android, activar el write-back de Health Connect exporta una vez en ese momento; no sigue exportando automáticamente a medida que llegan nuevos datos, necesitas desactivar y volver a activar el interruptor para volver a exportar. En iOS, una vez que activas el write-back de Apple Health, FitMesh vuelve a exportar después de cada sincronización exitosa.",
  de: "Auch das Write-back verhält sich je nach Plattform unterschiedlich. Auf Android exportiert das Aktivieren des Health-Connect-Write-backs einmal in diesem Moment; es exportiert nicht automatisch weiter, wenn neue Daten eintreffen, du musst den Schalter aus- und wieder einschalten, um erneut zu exportieren. Auf iOS exportiert FitMesh nach jeder erfolgreichen Synchronisierung erneut, sobald du das Apple-Health-Write-back aktiviert hast.",
};
const PRIVACY_TITLE: Localized = {
  it: "Privacy, storage ed export",
  en: "Privacy, storage, and export",
  es: "Privacidad, almacenamiento y exportación",
  de: "Datenschutz, Speicherung und Export",
};
const PRIVACY_BODY: Localized = {
  it: "I tuoi dati sono conservati su server UE. Controlli ogni interruttore di write-back individualmente, e puoi esportare i tuoi allenamenti come file GPX o TCX in qualsiasi momento (funzione Pro) tramite il foglio di condivisione nativo, per tenere una copia tua fuori da FitMesh. Salvare gli export direttamente su Google Drive è in sviluppo.",
  en: "Your data is stored on EU servers. You control every write-back toggle individually, and you can export your own workouts as GPX or TCX files at any time (a Pro feature) via the native share sheet, to keep your own copy outside FitMesh. Saving exports directly to Google Drive is in development.",
  es: "Tus datos se almacenan en servidores de la UE. Controlas cada interruptor de write-back individualmente, y puedes exportar tus propios entrenamientos como archivos GPX o TCX en cualquier momento (función Pro) mediante la hoja de compartir nativa, para tener tu propia copia fuera de FitMesh. Guardar exportaciones directamente en Google Drive está en desarrollo.",
  de: "Deine Daten werden auf EU-Servern gespeichert. Du steuerst jeden Write-back-Schalter einzeln, und du kannst deine eigenen Workouts jederzeit als GPX- oder TCX-Dateien exportieren (eine Pro-Funktion) über das native Freigabeblatt, um eine eigene Kopie außerhalb von FitMesh zu behalten. Das direkte Speichern von Exporten in Google Drive ist in Entwicklung.",
};
const DOESNT_TITLE: Localized = {
  it: "Cosa FitMesh non fa",
  en: "What FitMesh doesn't do",
  es: "Qué no hace FitMesh",
  de: "Was FitMesh nicht tut",
};
const DOESNT_ITEMS: LocalizedList = {
  it: [
    "Non sincronizza ogni app fitness con ogni altra. Controlla la tabella di compatibilità per la fonte o destinazione specifica di cui hai bisogno.",
    "Inviare allenamenti a Strava, TrainingPeaks o RideWithGPS è ancora in sviluppo, non disponibile oggi. Salvare gli export direttamente su Google Drive è anch'esso in sviluppo; usa il foglio di condivisione nel frattempo.",
    "Il write-back verso Health Connect e Apple Health non copre ogni metrica (nessuna scrittura HRV su nessuna delle due piattaforme, nessuna scrittura del peso su Android).",
    "Il timing del write-back differisce per piattaforma: Health Connect (Android) esporta una volta per attivazione dell'interruttore, non continuamente; Apple Health (iOS) ri-esporta dopo ogni sync riuscito.",
    "L'export in formato FIT non è disponibile (licenza); GPX e TCX sì.",
  ],
  en: [
    "It doesn't sync every fitness app to every other fitness app. Check the compatibility table for the specific source or destination you need.",
    "Sending workouts to Strava, TrainingPeaks or RideWithGPS is still in development, not available today. Saving exports directly to Google Drive is also in development; use the share sheet instead.",
    "Write-back to Health Connect and Apple Health doesn't cover every metric (no HRV write on either platform, no weight write on Android).",
    "Write-back timing differs by platform: Health Connect (Android) exports once per toggle activation, not continuously; Apple Health (iOS) re-exports after every successful sync.",
    "FIT file export isn't available (licensing); GPX and TCX are.",
  ],
  es: [
    "No sincroniza cada app de fitness con cualquier otra. Consulta la tabla de compatibilidad para la fuente o destino específico que necesitas.",
    "Enviar entrenamientos a Strava, TrainingPeaks o RideWithGPS todavía está en desarrollo, no disponible hoy. Guardar exportaciones directamente en Google Drive también está en desarrollo; usa la hoja de compartir mientras tanto.",
    "El write-back hacia Health Connect y Apple Health no cubre todas las métricas (sin escritura de HRV en ninguna de las dos plataformas, sin escritura de peso en Android).",
    "El momento del write-back difiere según la plataforma: Health Connect (Android) exporta una vez por activación del interruptor, no continuamente; Apple Health (iOS) vuelve a exportar después de cada sincronización exitosa.",
    "La exportación en formato FIT no está disponible (licencia); GPX y TCX sí.",
  ],
  de: [
    "Es synchronisiert nicht jede Fitness-App mit jeder anderen. Prüfe die Kompatibilitätstabelle für die spezifische Quelle oder das Ziel, das du brauchst.",
    "Das Senden von Workouts an Strava, TrainingPeaks oder RideWithGPS ist noch in Entwicklung, heute nicht verfügbar. Das direkte Speichern von Exporten in Google Drive ist ebenfalls in Entwicklung; nutze stattdessen das Freigabeblatt.",
    "Write-back zu Health Connect und Apple Health deckt nicht jede Metrik ab (kein HRV-Schreiben auf beiden Plattformen, kein Gewichts-Schreiben auf Android).",
    "Das Write-back-Timing unterscheidet sich je nach Plattform: Health Connect (Android) exportiert einmal pro Schalteraktivierung, nicht fortlaufend; Apple Health (iOS) exportiert nach jeder erfolgreichen Synchronisierung erneut.",
    "FIT-Datei-Export ist nicht verfügbar (Lizenzierung); GPX und TCX schon.",
  ],
};
const SETUP_TITLE: Localized = { it: "Per iniziare", en: "Getting started", es: "Primeros pasos", de: "Erste Schritte" };
const SETUP_STEPS: LocalizedList = {
  it: [
    "Scarica FitMesh e accedi.",
    "Concedi il permesso a Health Connect (Android) o Apple Health (iOS) quando richiesto.",
    "Connetti eventuali provider aggiuntivi che usi (Strava, Garmin e altri) dalle Impostazioni.",
    "Opzionalmente attiva il write-back verso Health Connect o Apple Health una volta soddisfatto di ciò che mostra la dashboard.",
  ],
  en: [
    "Download FitMesh and sign in.",
    "Grant Health Connect (Android) or Apple Health (iOS) permission when prompted.",
    "Connect any additional providers you use (Strava, Garmin, and others) from Settings.",
    "Optionally turn on write-back to Health Connect or Apple Health once you're happy with what the dashboard shows.",
  ],
  es: [
    "Descarga FitMesh e inicia sesión.",
    "Concede el permiso de Health Connect (Android) o Apple Health (iOS) cuando se te solicite.",
    "Conecta cualquier proveedor adicional que uses (Strava, Garmin y otros) desde Ajustes.",
    "Opcionalmente activa el write-back hacia Health Connect o Apple Health una vez que estés satisfecho con lo que muestra el panel.",
  ],
  de: [
    "Lade FitMesh herunter und melde dich an.",
    "Erteile bei Aufforderung die Berechtigung für Health Connect (Android) oder Apple Health (iOS).",
    "Verbinde alle weiteren von dir genutzten Anbieter (Strava, Garmin und andere) über die Einstellungen.",
    "Aktiviere optional das Write-back zu Health Connect oder Apple Health, sobald du mit der Dashboard-Anzeige zufrieden bist.",
  ],
};
const FAQ_TITLE: Localized = {
  it: "Domande frequenti",
  en: "Frequently asked questions",
  es: "Preguntas frecuentes",
  de: "Häufig gestellte Fragen",
};
const FINAL_CTA_TITLE: Localized = {
  it: "Pronto a vedere i tuoi dati in un unico posto?",
  en: "Ready to see your data in one place?",
  es: "¿Listo para ver tus datos en un solo lugar?",
  de: "Bereit, deine Daten an einem Ort zu sehen?",
};
const FINAL_CTA_BODY: Localized = {
  it: "Scarica FitMesh, connetti le fonti che usi, e vedi esattamente cosa è live prima di farci affidamento.",
  en: "Download FitMesh, connect the sources you use, and see exactly what's live before you rely on it.",
  es: "Descarga FitMesh, conecta las fuentes que usas, y ve exactamente qué está en vivo antes de confiar en ello.",
  de: "Lade FitMesh herunter, verbinde die Quellen, die du nutzt, und sieh genau, was live ist, bevor du dich darauf verlässt.",
};
const BREADCRUMB_LABEL: Localized = {
  it: "Sincronizzazione dati fitness",
  en: "Fitness data sync",
  es: "Sincronización de datos de fitness",
  de: "Fitnessdaten-Synchronisierung",
};

export default async function FitnessDataSyncPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  if (!FDS_LOCALES.includes(lc)) notFound();

  const path = `/${lc}/fitness-data-sync`;

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    name: tl(META_TITLE, lc),
    description: tl(META_DESCRIPTION, lc),
    url: `${SITE_URL}${path}`,
    inLanguage: schemaLanguage(lc),
    publisher: organizationCompactRef(),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FITNESS_DATA_SYNC_FAQ.map((f) => ({
      "@type": "Question",
      name: tl(f.q, lc),
      acceptedAnswer: { "@type": "Answer", text: tl(f.a, lc) },
    })),
  };

  const allRows = [...DETAILED_COMPATIBILITY, ...OTHER_PROVIDERS_COMPATIBILITY];

  return (
    <>
      <JsonLd data={webPageLd} />
      <JsonLd data={faqLd} />
      <Breadcrumbs items={[{ name: tl(BREADCRUMB_LABEL, lc), path }]} locale={lc} />

      {/* HERO */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-8">
        <div
          aria-hidden
          className="halo-conic absolute left-1/2 top-0 -z-10 h-[420px] w-[680px] -translate-x-1/2 opacity-40 animate-float"
        />
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {tl(KICKER, lc)}
        </p>
        <h1 className="mt-4 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl leading-[1.1]">
          {tl(H1, lc)}
        </h1>

        {/* Risposta diretta, citabile fuori contesto (GEO) */}
        <p className="mt-6 text-lg text-text-secondary max-w-2xl leading-relaxed">
          {tl(HERO_INTRO, lc)}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="#compatibility"
            className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
          >
            {tl(CTA_COMPATIBILITY, lc)}
          </Link>
          <Link
            href={`/${lc}/integrations`}
            className="inline-flex items-center px-6 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
          >
            {tl(CTA_INTEGRATIONS, lc)}
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-14">
        {/* Il problema */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {tl(PROBLEM_TITLE, lc)}
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">{tl(PROBLEM_BODY, lc)}</p>
        </div>

        {/* Definizione "fitness data sync" */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {tl(DEFINITION_TITLE, lc)}
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">{tl(DEFINITION_BODY, lc)}</p>
        </div>

        {/* Health hub vs bridge vs dashboard */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {tl(COMPARISON_TITLE, lc)}
          </h2>
          <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
            <div className="card p-5">
              <p className="font-semibold text-text-primary">{tl(HUB_TITLE, lc)}</p>
              <p className="mt-2 text-text-secondary leading-relaxed">{tl(HUB_BODY, lc)}</p>
            </div>
            <div className="card p-5">
              <p className="font-semibold text-text-primary">{tl(BRIDGE_TITLE, lc)}</p>
              <p className="mt-2 text-text-secondary leading-relaxed">{tl(BRIDGE_BODY, lc)}</p>
            </div>
            <div className="card p-5">
              <p className="font-semibold text-text-primary">{tl(DASHBOARD_TITLE, lc)}</p>
              <p className="mt-2 text-text-secondary leading-relaxed">{tl(DASHBOARD_BODY, lc)}</p>
            </div>
          </div>
        </div>

        {/* Come funziona FitMesh + diagramma testuale accessibile */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {tl(HOW_TITLE, lc)}
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">{tl(HOW_BODY, lc)}</p>
          <ol className="mt-6 space-y-3">
            {tll(HOW_STEPS, lc).map((step, i) => (
              <li key={step} className="flex gap-4 items-start">
                <span className="w-7 h-7 rounded-full bg-brand-aqua/15 text-brand-aqua text-sm font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-text-secondary leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Matrice compatibilità */}
        <div id="compatibility" className="scroll-mt-20">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {tl(MATRIX_TITLE, lc)}
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">{tl(MATRIX_INTRO, lc)}</p>
          <p className="mt-6 text-xs uppercase tracking-wider text-text-muted font-semibold">
            {tl(MATRIX_CORE_LABEL, lc)}
          </p>
          <div className="mt-3 space-y-3">
            {DETAILED_COMPATIBILITY.map((row) => (
              <CompatibilityCard key={row.source} row={row} lc={lc} />
            ))}
          </div>
          <p className="mt-8 text-xs uppercase tracking-wider text-text-muted font-semibold">
            {tl(MATRIX_OTHER_LABEL, lc)}
          </p>
          <div className="mt-3 space-y-3">
            {OTHER_PROVIDERS_COMPATIBILITY.map((row) => (
              <CompatibilityCard key={row.source} row={row} lc={lc} />
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted">
            {allRows.length}
            {tl(MATRIX_FOOTER_PREFIX, lc)}
            <Link href={`/${lc}/integrations`} className="text-brand-aqua hover:text-brand-green underline underline-offset-4">
              /integrations
            </Link>
            {tl(MATRIX_FOOTER_SUFFIX, lc)}
          </p>
        </div>

        {/* Come FitMesh previene i loop di sync */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {tl(LOOP_TITLE, lc)}
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">{tl(LOOP_INTRO, lc)}</p>
          <ul className="mt-4 space-y-2 text-text-secondary text-sm leading-relaxed list-disc list-inside">
            {tll(LOOP_RULES, lc).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        {/* Android vs iPhone vs web */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {tl(PLATFORM_TITLE, lc)}
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">{tl(PLATFORM_BODY_1, lc)}</p>
          <p className="mt-4 text-text-secondary leading-relaxed">{tl(PLATFORM_BODY_2, lc)}</p>
        </div>

        {/* Privacy, storage, export */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {tl(PRIVACY_TITLE, lc)}
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">{tl(PRIVACY_BODY, lc)}</p>
        </div>

        {/* Limiti dichiarati */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {tl(DOESNT_TITLE, lc)}
          </h2>
          <ul className="mt-4 space-y-2 text-text-secondary text-sm leading-relaxed list-disc list-inside">
            {tll(DOESNT_ITEMS, lc).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Setup */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            {tl(SETUP_TITLE, lc)}
          </h2>
          <ol className="mt-4 space-y-3">
            {tll(SETUP_STEPS, lc).map((step, i) => (
              <li key={step} className="flex gap-4 items-start">
                <span className="w-7 h-7 rounded-full bg-brand-aqua/15 text-brand-aqua text-sm font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-text-secondary leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 mt-4 pb-12">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {tl(FAQ_TITLE, lc)}
        </h2>
        <div className="mt-6 space-y-4">
          {FITNESS_DATA_SYNC_FAQ.map((f) => (
            <details key={tl(f.q, lc)} className="card p-5 group [&_summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer flex items-start justify-between gap-4 text-text-primary font-medium">
                <span>{tl(f.q, lc)}</span>
                <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">{tl(f.a, lc)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA finale */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20 text-center">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {tl(FINAL_CTA_TITLE, lc)}
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">{tl(FINAL_CTA_BODY, lc)}</p>
        <div className="mt-8 flex justify-center">
          <StoreButtonsRow locale={lc} className="justify-center" ctaLocation={CTA_PLACEMENTS.fitnessDataSync} />
        </div>
      </section>
    </>
  );
}
