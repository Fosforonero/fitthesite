import type { Segment, Lang } from "../core/types.ts";
import type { ProjectConfig } from "../config.ts";
import { JsonDictAdapter } from "./jsonDict.ts";
import { ArbAdapter } from "./arb.ts";

/** Contratto di un adapter sorgente: estrae i segmenti e ricostruisce il file tradotto. */
export interface SourceAdapter {
  /** Segmenti traducibili dal template; `manual` = id da fare a mano (es. ICU plural/select). */
  extract(): { segments: Segment[]; manual: string[] };
  /** Contenuto del file per la lingua, usando le traduzioni (id → testo). */
  build(lang: Lang, byId: Map<string, string>): string;
  /** Percorso di output per la lingua (dentro outDir del progetto). */
  outPath(lang: Lang): string;
}

export function makeAdapter(p: ProjectConfig): SourceAdapter {
  switch (p.adapter) {
    case "jsonDict":
      return new JsonDictAdapter(p);
    case "arb":
      return new ArbAdapter(p);
    default:
      throw new Error(`adapter sconosciuto: ${p.adapter}`);
  }
}
