import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { createHash } from "node:crypto";
import type { Lang, Status, EngineName, TmEntry } from "./types.ts";

type Store = Record<string, Partial<Record<Lang, TmEntry>>>;

/**
 * Memoria di traduzione: store JSON indicizzato per hash del sorgente.
 * Una stringa tradotta una volta non si ritraduce; le correzioni umane
 * (status `reviewed`/`locked`) restano e vengono riusate ovunque.
 */
export class TranslationMemory {
  private path: string;
  private store: Store;

  constructor(path: string) {
    this.path = path;
    this.store = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Store) : {};
  }

  private key(source: string): string {
    return createHash("sha1").update(source).digest("hex").slice(0, 16);
  }

  get(source: string, lang: Lang): TmEntry | undefined {
    return this.store[this.key(source)]?.[lang];
  }

  set(source: string, lang: Lang, text: string, status: Status, engine: EngineName): void {
    const k = this.key(source);
    (this.store[k] ??= {})[lang] = { text, status, engine, updatedAt: new Date().toISOString() };
  }

  /** Aggiorna lo stato di una voce esistente (es. da `machine` a `reviewed`). */
  promote(source: string, lang: Lang, status: Status, text?: string): boolean {
    const e = this.get(source, lang);
    if (!e) return false;
    e.status = status;
    if (text !== undefined) e.text = text;
    e.updatedAt = new Date().toISOString();
    return true;
  }

  save(): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.store, null, 2));
  }

  stats(): { sources: number; byLang: Record<string, Record<Status, number>> } {
    const byLang: Record<string, Record<Status, number>> = {};
    for (const langs of Object.values(this.store)) {
      for (const [lang, e] of Object.entries(langs)) {
        if (!e) continue;
        (byLang[lang] ??= { machine: 0, reviewed: 0, locked: 0 })[e.status]++;
      }
    }
    return { sources: Object.keys(this.store).length, byLang };
  }
}
