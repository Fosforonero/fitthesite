import { readFileSync } from "node:fs";
import type { Lang } from "./types.ts";

export interface GlossaryData {
  doNotTranslate: string[];
  terms: Record<string, Partial<Record<Lang, string>>>;
}

/** Glossario + lista do-not-translate + mascheramento dei token non traducibili. */
export class Glossary {
  private data: GlossaryData;

  constructor(data: GlossaryData) {
    this.data = data;
  }

  static load(path: string): Glossary {
    return new Glossary(JSON.parse(readFileSync(path, "utf8")) as GlossaryData);
  }

  /**
   * Maschera ciò che NON va tradotto, sostituendolo con segnaposto ⟦n⟧ che i
   * motori devono lasciare intatti: interpolazioni (`${...}`, `{{...}}`),
   * placeholder ICU semplici (`{nome}`), URL, email, e i termini DNT (brand…).
   */
  mask(text: string): { masked: string; tokens: string[] } {
    const tokens: string[] = [];
    let masked = text;
    const protect = (re: RegExp) => {
      masked = masked.replace(re, (m) => {
        const i = tokens.length;
        tokens.push(m);
        return `⟦${i}⟧`;
      });
    };
    protect(/\$\{[^}]+\}/g); // ${...}
    protect(/\{\{[^}]+\}\}/g); // {{...}}
    protect(/\{[A-Za-z_]\w*\}/g); // {placeholder} ICU semplice (no virgole = no plural/select)
    protect(/https?:\/\/\S+/g);
    protect(/[\w.+-]+@[\w.-]+\.\w+/g);
    // termini DNT, dal più lungo al più corto per evitare match parziali
    for (const term of [...this.data.doNotTranslate].sort((a, b) => b.length - a.length)) {
      protect(new RegExp(escapeRe(term), "g"));
    }
    return { masked, tokens };
  }

  unmask(text: string, tokens: string[]): string {
    return text.replace(/⟦(\d+)⟧/g, (_, i) => tokens[Number(i)] ?? `⟦${i}⟧`);
  }

  /** True se tutti i segnaposto ⟦n⟧ sono ancora presenti (il motore non li ha persi). */
  placeholdersIntact(masked: string, tokens: string[]): boolean {
    for (let i = 0; i < tokens.length; i++) if (!masked.includes(`⟦${i}⟧`)) return false;
    return true;
  }

  /** Stringa glossario per il prompt Ollama, nella lingua data. */
  hintFor(lang: Lang): string {
    const pairs: string[] = [];
    for (const [src, map] of Object.entries(this.data.terms)) {
      const t = map[lang];
      if (t) pairs.push(`${src} = ${t}`);
    }
    return pairs.join("; ");
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
