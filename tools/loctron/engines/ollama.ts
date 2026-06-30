import type { Engine, Lang, TranslateCtx } from "../core/types.ts";

const NAME: Record<string, string> = {
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian Bokmål",
  nb: "Norwegian Bokmål",
  fi: "Finnish",
  en: "English",
  it: "Italian",
};

/** Adapter Ollama locale (default qwen3:14b). Batch piccoli per stare nel contesto del modello. */
export class OllamaEngine implements Engine {
  readonly name = "ollama";
  private url: string;
  private model: string;

  constructor(url: string, model: string) {
    this.url = url;
    this.model = model;
  }

  async available(): Promise<boolean> {
    try {
      const r = await fetch(`${this.url}/api/tags`);
      return r.ok;
    } catch {
      return false;
    }
  }

  async translate(texts: string[], target: Lang, ctx: TranslateCtx): Promise<(string | null)[]> {
    const out: (string | null)[] = new Array(texts.length).fill(null);
    if (texts.length === 0) return out;
    const langName = NAME[target] ?? target;
    const srcName = NAME[ctx.sourceLang] ?? ctx.sourceLang;
    const BATCH = 10;
    for (let i = 0; i < texts.length; i += BATCH) {
      const batch = texts.slice(i, i + BATCH);
      const numbered = batch.map((t, j) => `${j + 1}=${t}`).join("\n");
      const prompt =
        `You are a professional native ${langName} translator for a privacy-first wearable health app. ` +
        `Translate each numbered line from ${srcName} into natural, fluent ${langName}. ` +
        `Keep tokens like ⟦0⟧ EXACTLY unchanged. No em-dash. No commentary. ` +
        (ctx.glossaryHint ? `Use these terms: ${ctx.glossaryHint}. ` : "") +
        `Return ONLY lines "N=translation" with the same numbers.\n\n${numbered}\n/no_think`;
      let resp = "";
      try {
        const r = await fetch(`${this.url}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            stream: false,
            keep_alive: "15m",
            options: { temperature: 0.2, num_predict: 1800 },
            prompt,
          }),
        });
        if (!r.ok) continue;
        const d = (await r.json()) as { response?: string };
        resp = (d.response ?? "").replace(/<think>[\s\S]*?<\/think>/g, "");
      } catch {
        continue;
      }
      for (const line of resp.split("\n")) {
        const m = line.match(/^\s*(\d+)\s*=\s*(.+?)\s*$/);
        if (!m) continue;
        const idx = i + Number(m[1]) - 1;
        if (idx >= i && idx < i + batch.length) out[idx] = m[2].trim();
      }
    }
    return out;
  }
}
