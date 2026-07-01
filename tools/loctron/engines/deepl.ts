import type { Engine, Lang, TranslateCtx } from "../core/types.ts";

// DeepL usa NB per il norvegese Bokmål. EN come target richiede variante.
const TARGET: Record<string, string> = { sv: "SV", da: "DA", no: "NB", nb: "NB", fi: "FI", en: "EN-GB" };
const SOURCE: Record<string, string> = { en: "EN", it: "IT", sv: "SV", da: "DA", no: "NB", nb: "NB", fi: "FI" };

/** Adapter DeepL via HTTP (zero dipendenze). Free vs Pro dedotto dal suffisso ":fx" della key. */
export class DeepLEngine implements Engine {
  readonly name = "deepl";
  private key: string;
  private host: string;

  constructor() {
    this.key = process.env.DEEPL_API_KEY ?? "";
    this.host = this.key.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
  }

  async available(): Promise<boolean> {
    return this.key.length > 0;
  }

  /** Caratteri consumati / limite del mese corrente. null se manca la key. */
  async usage(): Promise<{ count: number; limit: number } | null> {
    if (!this.key) return null;
    const r = await fetch(`${this.host}/v2/usage`, { headers: this.authHeaders() });
    if (!r.ok) throw new Error(`DeepL /usage HTTP ${r.status}`);
    const d = (await r.json()) as { character_count: number; character_limit: number };
    return { count: d.character_count, limit: d.character_limit };
  }

  async translate(texts: string[], target: Lang, ctx: TranslateCtx): Promise<(string | null)[]> {
    if (!this.key || texts.length === 0) return texts.map(() => null);
    const tl = TARGET[target] ?? target.toUpperCase();
    const sl = SOURCE[ctx.sourceLang] ?? ctx.sourceLang.toUpperCase();
    const out: (string | null)[] = [];
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    for (let i = 0; i < texts.length; i += 50) {
      const batch = texts.slice(i, i + 50);
      const body = new URLSearchParams();
      for (const t of batch) body.append("text", t);
      body.set("source_lang", sl);
      body.set("target_lang", tl);
      body.set("preserve_formatting", "1");
      let got: string[] | null = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const r = await fetch(`${this.host}/v2/translate`, {
          method: "POST",
          headers: { ...this.authHeaders(), "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        if (r.status === 429) {
          await sleep(800 * (attempt + 1)); // rate-limit: backoff e riprova
          continue;
        }
        if (r.status === 456) throw new Error("DeepL quota mensile esaurita (456)");
        if (!r.ok) break;
        const d = (await r.json()) as { translations: { text: string }[] };
        got = d.translations.map((t) => t.text);
        break;
      }
      if (got) for (const t of got) out.push(t);
      else for (let k = 0; k < batch.length; k++) out.push(null);
      await sleep(120); // pacing gentile tra i batch
    }
    return out;
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `DeepL-Auth-Key ${this.key}` };
  }
}
