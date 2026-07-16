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
 */
export interface LiveLabsTool {
  key: string;
  status: "live";
  slug: LabsText;
  name: LabsText;
  shortDescription: LabsText;
  /** Categoria per raggruppamento futuro sull'indice (non ancora usata per filtri). */
  category: "cardio" | "sleep" | "activity";
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
    category: "cardio",
  },
  {
    key: "sleep-efficiency",
    status: "coming-soon",
    name: { it: "Efficienza del sonno", en: "Sleep Efficiency" },
    shortDescription: {
      it: "Calcolo dell'efficienza del sonno da tempo a letto e tempo dormito.",
      en: "Sleep efficiency calculation from time in bed and time asleep.",
    },
    category: "sleep",
  },
  {
    key: "heart-rate-zones",
    status: "coming-soon",
    name: { it: "Zone di frequenza cardiaca", en: "Heart Rate Zones" },
    shortDescription: {
      it: "Calcolo delle zone di frequenza cardiaca con i metodi più diffusi.",
      en: "Heart rate zone calculation using the most common methods.",
    },
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
