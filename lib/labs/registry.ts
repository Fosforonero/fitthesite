/**
 * FitMesh Labs: registry tipizzato degli strumenti.
 *
 * Fonte di verità unica per: quali tool sono live (hanno una pagina reale),
 * quali sono "in preparazione" (mostrati come card sull'indice ma SENZA
 * alcuna route/URL: niente pagine vuote indicizzabili), gli slug
 * localizzati per lingua, e i metadata minimi condivisi fra `/labs` e
 * `/labs/[tool]`.
 *
 * Solo italiano e inglese in questo sprint (P1.0): `LABS_LOCALES` è la
 * fonte di verità sia per `generateStaticParams` sia per `indexableLocales`
 * in `app/sitemap.ts`, così i due non possono contraddirsi: stesso pattern
 * di `lib/content/static-page-locales.ts`.
 */

import type { Locale } from "@/lib/i18n";

export const LABS_LOCALES: readonly Locale[] = ["it", "en"];

export function isLabsLocale(lc: string): lc is "it" | "en" {
  return LABS_LOCALES.includes(lc as Locale);
}

/** Testo localizzato SOLO it/en: deliberatamente più piccolo di `Localized` (15 lingue) del resto del sito. */
export type LabsText = { it: string; en: string };
export type LabsTextList = { it: string[]; en: string[] };

export function lt(text: LabsText, lc: "it" | "en"): string {
  return text[lc];
}
export function ltl(list: LabsTextList, lc: "it" | "en"): string[] {
  return list[lc];
}

/**
 * Tool "live": ha una route reale sotto `/labs/[slug localizzato]`.
 * Il campo `slug` è per-locale perché lo sprint richiede URL localizzati
 * diversi (`/it/labs/calcolatore-hrv-rmssd` vs `/en/labs/hrv-rmssd-calculator`),
 * stesso pattern di `localizedBlogSlug`/`localizedLandingSlug`.
 *
 * `lastRevised` e `methodologyVersion` sono qui (non duplicati nel content
 * file per-tool) perché il registry deve restare l'unica fonte di verità
 * P1.1 Fase 1.3: i content file (es. lib/labs/hrv/content.ts) le
 * IMPORTANO da qui via `liveLabsToolByKey`, non le ridichiarano.
 *
 * `relatedKeys` è opzionale: se assente, `relatedLabsTools()` mostra tutti
 * gli altri tool live (comportamento storico, corretto finché c'è un solo
 * tool live). Con 2+ tool live va valorizzato con una relazione curata.
 */
export interface LiveLabsTool {
  key: string;
  status: "live";
  slug: LabsText;
  name: LabsText;
  shortDescription: LabsText;
  /** Emoji usata su card indice e blocchi "tool correlati". */
  icon: string;
  /** Categoria per raggruppamento futuro sull'indice (non ancora usata per filtri). */
  category: "cardio" | "sleep" | "activity";
  /** ISO date (YYYY-MM-DD) dell'ultima revisione tecnico-editoriale del contenuto. */
  lastRevised: string;
  /** Versione della metodologia di calcolo (bump quando cambia la formula/i criteri). */
  methodologyVersion: string;
  /** Chiavi di altri tool live correlati, in ordine di rilevanza. */
  relatedKeys?: readonly string[];
}

/**
 * Tool "in preparazione": NESSUNO slug, NESSUNA route. Mostrato come card
 * disabilitata sull'indice, non genera mai un URL: vedi requisito Fase 2
 * "senza generare URL indicizzabili vuoti".
 */
export interface PlannedLabsTool {
  key: string;
  status: "coming-soon";
  name: LabsText;
  shortDescription: LabsText;
  icon: string;
  category: "cardio" | "sleep" | "activity";
}

export type LabsTool = LiveLabsTool | PlannedLabsTool;

export const LABS_TOOLS: readonly LabsTool[] = [
  {
    key: "hrv-rmssd",
    status: "live",
    slug: { it: "calcolatore-hrv-rmssd", en: "hrv-rmssd-calculator" },
    name: { it: "Calcolatore HRV (RMSSD)", en: "HRV Calculator (RMSSD)" },
    shortDescription: {
      it: "Calcola RMSSD, deviazione standard e frequenza cardiaca derivata dal RR medio, da una serie di intervalli RR/IBI, interamente nel browser.",
      en: "Calculate RMSSD, standard deviation, and heart rate derived from mean RR, from a series of RR/IBI intervals, entirely in your browser.",
    },
    icon: "❤️",
    category: "cardio",
    lastRevised: "2026-07-17",
    methodologyVersion: "1.1",
    relatedKeys: ["sleep-efficiency"],
  },
  {
    key: "sleep-efficiency",
    status: "live",
    slug: { it: "calcolatore-efficienza-sonno", en: "sleep-efficiency-calculator" },
    name: { it: "Calcolatore efficienza del sonno", en: "Sleep Efficiency Calculator" },
    shortDescription: {
      it: "Calcola l'efficienza del sonno da tempo a letto e tempo dormito (modalità semplice o avanzata), interamente nel browser.",
      en: "Calculate sleep efficiency from time in bed and time asleep (simple or advanced mode), entirely in your browser.",
    },
    icon: "🌙",
    category: "sleep",
    lastRevised: "2026-07-17",
    methodologyVersion: "1.0",
    relatedKeys: ["hrv-rmssd"],
  },
  {
    key: "heart-rate-zones",
    status: "coming-soon",
    name: { it: "Zone di frequenza cardiaca", en: "Heart Rate Zones" },
    shortDescription: {
      it: "Calcolo delle zone di frequenza cardiaca con i metodi più diffusi.",
      en: "Heart rate zone calculation using the most common methods.",
    },
    icon: "🎯",
    category: "activity",
  },
] as const;

export function liveLabsTools(): LiveLabsTool[] {
  return LABS_TOOLS.filter((t): t is LiveLabsTool => t.status === "live");
}

export function plannedLabsTools(): PlannedLabsTool[] {
  return LABS_TOOLS.filter((t): t is PlannedLabsTool => t.status === "coming-soon");
}

/** Slug localizzato di un tool live per una data lingua (per link/sitemap). */
export function localizedLabsSlug(tool: LiveLabsTool, lc: "it" | "en"): string {
  return tool.slug[lc];
}

/**
 * Risolve uno slug in arrivo dall'URL (`/labs/[tool]`) al tool corrispondente
 * per quella lingua. Ritorna `undefined` se non esiste: mai un fallback
 * silenzioso a un'altra lingua o a un altro tool.
 */
export function labsToolByLocalizedSlug(
  slug: string,
  lc: "it" | "en",
): LiveLabsTool | undefined {
  return liveLabsTools().find((t) => t.slug[lc] === slug);
}

/**
 * Metadata di un tool live per key. Lancia se la key non esiste: è un errore
 * di programmazione (content file che referenzia una key sbagliata), non un
 * caso da gestire silenziosamente con un fallback.
 */
export function liveLabsToolByKey(key: string): LiveLabsTool {
  const found = liveLabsTools().find((t) => t.key === key);
  if (!found) throw new Error(`liveLabsToolByKey: nessun tool live con key "${key}"`);
  return found;
}

/**
 * Tool correlati per un dato tool: usa `relatedKeys` se presente (relazione
 * curata, in ordine), altrimenti tutti gli altri tool live (fallback storico
 * per quando c'è un solo altro tool o nessuna relazione esplicita).
 */
export function relatedLabsTools(tool: LiveLabsTool): LiveLabsTool[] {
  if (tool.relatedKeys && tool.relatedKeys.length > 0) {
    return tool.relatedKeys
      .map((k) => liveLabsTools().find((t) => t.key === k))
      .filter((t): t is LiveLabsTool => t !== undefined);
  }
  return liveLabsTools().filter((t) => t.key !== tool.key);
}

/** Tutte le combinazioni {locale, slug} per generateStaticParams: solo it/en, solo tool live. */
export function allLabsStaticParams(): Array<{ locale: "it" | "en"; tool: string }> {
  const out: Array<{ locale: "it" | "en"; tool: string }> = [];
  for (const lc of LABS_LOCALES as readonly ("it" | "en")[]) {
    for (const tool of liveLabsTools()) {
      out.push({ locale: lc, tool: tool.slug[lc] });
    }
  }
  return out;
}
