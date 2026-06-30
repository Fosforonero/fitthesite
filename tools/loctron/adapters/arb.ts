import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Segment, Lang } from "../core/types.ts";
import type { ProjectConfig } from "../config.ts";
import type { SourceAdapter } from "./index.ts";

type Arb = Record<string, unknown>;

// ICU plural/select/gender: struttura complessa, la lasciamo alla traduzione manuale.
const ICU_COMPLEX = /\{\s*\w+\s*,\s*(plural|select|gender)\b/;

/**
 * Adapter per file ARB Flutter. Salta le chiavi di metadati `@key` e `@@locale`.
 * I placeholder ICU semplici (`{nome}`) sono protetti dal glossario (mascheramento).
 * Le chiavi non tradotte vengono OMESSE dal file di output: Flutter fa fallback
 * automatico al template, quindi una traduzione parziale è sicura.
 */
export class ArbAdapter implements SourceAdapter {
  private p: ProjectConfig;
  private base: Arb;
  private order: string[];

  constructor(p: ProjectConfig) {
    this.p = p;
    this.base = JSON.parse(readFileSync(join(p.sourceDir, p.templateFile), "utf8")) as Arb;
    this.order = Object.keys(this.base).filter((k) => !k.startsWith("@"));
  }

  extract(): { segments: Segment[]; manual: string[] } {
    const segments: Segment[] = [];
    const manual: string[] = [];
    for (const key of this.order) {
      const val = this.base[key];
      if (typeof val !== "string") continue;
      if (ICU_COMPLEX.test(val)) {
        manual.push(key);
        continue;
      }
      const meta = this.base[`@${key}`] as { description?: string } | undefined;
      segments.push({ id: key, source: val, context: meta?.description ?? "app ui" });
    }
    return { segments, manual };
  }

  build(lang: Lang, byId: Map<string, string>): string {
    const out: Arb = { "@@locale": lang };
    for (const key of this.order) {
      const t = byId.get(key);
      if (t != null) out[key] = t;
    }
    return JSON.stringify(out, null, 2) + "\n";
  }

  outPath(lang: Lang): string {
    return join(this.p.outDir, this.p.filePattern.replace("$lang", lang));
  }
}
