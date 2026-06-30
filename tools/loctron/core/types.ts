// Tipi condivisi del motore di traduzione "loctron".

export type Lang = string; // "en", "sv", "da", "no", "fi", ...
export type Status = "machine" | "reviewed" | "locked";
export type EngineName = "deepl" | "ollama" | "manual";
export type ResultEngine = EngineName | "tm" | "none";

export interface Segment {
  /** id stabile, es. "dict:hero.heading_1" o "blog:slug:body:3". */
  id: string;
  /** testo sorgente (lingua sorgente, di solito EN). */
  source: string;
  /** suggerimento di contesto per la MT (es. "ui", "article body"). */
  context?: string;
}

export interface TmEntry {
  text: string;
  status: Status;
  engine: EngineName;
  updatedAt: string; // ISO
}

export interface Translated {
  id: string;
  lang: Lang;
  source: string;
  /** null = da rivedere (motore fallito o nessun motore disponibile). */
  text: string | null;
  engine: ResultEngine;
  status: Status;
}

export interface TranslateCtx {
  sourceLang: Lang;
  glossaryHint: string;
}

export interface Engine {
  readonly name: EngineName;
  available(): Promise<boolean>;
  /**
   * Traduce un batch verso UNA lingua target. Ritorna un array della stessa
   * lunghezza (null sui singoli falliti). Riceve testi già "mascherati" (DNT).
   */
  translate(texts: string[], target: Lang, ctx: TranslateCtx): Promise<(string | null)[]>;
}
