import { join } from "node:path";
import type { Lang, EngineName } from "./core/types.ts";
import { LOCTRON_ROOT, SITE_ROOT, PARENT_ROOT } from "./paths.ts";

export type AdapterKind = "jsonDict" | "arb";

export interface ProjectConfig {
  key: string;
  sourceLang: Lang;
  targetLangs: Lang[];
  adapter: AdapterKind;
  /** Cartella che contiene i file di traduzione (assoluta). */
  sourceDir: string;
  /** File sorgente/template (es. "en.json" o "app_it.arb"). */
  templateFile: string;
  /** Pattern del file per lingua: "$lang" viene sostituito col codice locale. */
  filePattern: string;
  /** Dove scrivere le preview (non sovrascrive i file reali). */
  outDir: string;
}

/** Configurazione condivisa tra tutti i progetti (motori + memoria + glossario). */
export const shared = {
  engineOrder: ["deepl", "ollama"] as EngineName[],
  glossaryPath: join(LOCTRON_ROOT, "data", "glossary.json"),
  tmPath: join(LOCTRON_ROOT, ".tm", "memory.json"),
  deepl: { safetyMarginChars: 5000 },
  ollama: {
    url: process.env.OLLAMA_URL ?? "http://localhost:11434",
    model: process.env.OLLAMA_MODEL ?? "qwen3:14b",
  },
};

/** Progetti gestiti. Aggiungerne uno = aggiungere una voce qui (+ eventuale adapter). */
export const projects: Record<string, ProjectConfig> = {
  // Sito marketing: dizionari JSON, sorgente inglese.
  site: {
    key: "site",
    sourceLang: "en",
    targetLangs: ["sv", "da", "no", "fi"],
    adapter: "jsonDict",
    sourceDir: join(SITE_ROOT, "lib", "dictionaries"),
    templateFile: "en.json",
    filePattern: "$lang.json",
    outDir: join(LOCTRON_ROOT, ".preview", "site"),
  },
  // App Flutter: file ARB, sorgente italiano (template app_it.arb). Bokmål = nb.
  app: {
    key: "app",
    sourceLang: "it",
    targetLangs: ["sv", "da", "nb", "fi"],
    adapter: "arb",
    sourceDir: join(PARENT_ROOT, "AppFitmesh", "flutter_app", "lib", "l10n"),
    templateFile: "app_it.arb",
    filePattern: "app_$lang.arb",
    outDir: join(LOCTRON_ROOT, ".preview", "app"),
  },
};
