import type { Engine, Lang, Segment, Translated, EngineName } from "./types.ts";
import { Glossary } from "./glossary.ts";
import { TranslationMemory } from "./tm.ts";

export interface PipelineDeps {
  glossary: Glossary;
  tm: TranslationMemory;
  /** Motori in ordine di waterfall (es. [deepl, ollama]). La TM è sempre prima. */
  engines: Engine[];
  sourceLang: Lang;
  /** Budget caratteri DeepL residuo per questa run (0 = non usare DeepL). */
  deeplBudgetChars?: number;
}

/** Ogni quanti segmenti tradotti persistere la TM su disco (ripartibilita'). */
const SAVE_CHUNK = 20;

/**
 * Per ogni segmento × lingua: TM hit → primo motore disponibile (con budget) →
 * motore successivo → coda revisione (text=null). Le traduzioni nuove vanno
 * in TM come `machine`. Se un motore perde i segnaposto ⟦n⟧ la traduzione
 * viene scartata (placeholder/brand a rischio) e si passa al motore dopo.
 * La TM viene salvata ogni SAVE_CHUNK traduzioni: se il processo muore, il
 * re-run ritrova il lavoro in memoria e riparte (costo ~0 su cio' che c'e' gia').
 */
export async function translateSegments(
  segments: Segment[],
  langs: Lang[],
  deps: PipelineDeps,
): Promise<Translated[]> {
  const results: Translated[] = [];
  let deeplBudget = deps.deeplBudgetChars ?? 0;

  const avail = new Map<EngineName, boolean>();
  for (const e of deps.engines) avail.set(e.name, await e.available());

  for (const lang of langs) {
    const glossaryHint = deps.glossary.hintFor(lang);
    const pending: Segment[] = [];

    for (const seg of segments) {
      const hit = deps.tm.get(seg.source, lang);
      if (hit) {
        results.push({ id: seg.id, lang, source: seg.source, text: hit.text, engine: "tm", status: hit.status });
      } else {
        pending.push(seg);
      }
    }
    if (pending.length === 0) continue;

    // context DeepL a livello richiesta: solo se il lotto e' omogeneo (tutti i
    // segmenti con lo stesso contesto), altrimenti omesso. Plumbing per il
    // futuro raggruppamento per contesto.
    const ctxSet = new Set(pending.map((s) => s.context).filter((c): c is string => !!c));
    const batchContext = ctxSet.size === 1 ? [...ctxSet][0] : undefined;

    const masks = pending.map((s) => deps.glossary.mask(s.source));
    const done = new Array<string | null>(pending.length).fill(null);
    const usedBy = new Array<EngineName | null>(pending.length).fill(null);

    for (const engine of deps.engines) {
      if (!avail.get(engine.name)) continue;

      const idx: number[] = [];
      for (let i = 0; i < pending.length; i++) if (done[i] === null) idx.push(i);
      if (idx.length === 0) break;

      // budget DeepL: prende quanti segmenti entrano nel residuo
      let take = idx;
      if (engine.name === "deepl") {
        const fit: number[] = [];
        for (const i of idx) {
          const cost = masks[i].masked.length;
          if (deeplBudget - cost < 0) break;
          deeplBudget -= cost;
          fit.push(i);
        }
        take = fit;
        if (take.length === 0) continue;
      }

      // Chunk per salvataggio incrementale: traduci a blocchi di SAVE_CHUNK e
      // persisti la TM dopo ognuno, cosi' un'interruzione perde al massimo un blocco.
      for (let c = 0; c < take.length; c += SAVE_CHUNK) {
        const chunk = take.slice(c, c + SAVE_CHUNK);
        const masked = chunk.map((i) => masks[i].masked);
        let outBatch: (string | null)[];
        try {
          outBatch = await engine.translate(masked, lang, { sourceLang: deps.sourceLang, glossaryHint, context: batchContext });
        } catch {
          if (engine.name === "deepl") for (const i of chunk) deeplBudget += masks[i].masked.length;
          continue; // blocco fallito: gli item restano null → motore successivo o re-run
        }

        let wrote = false;
        for (let j = 0; j < chunk.length; j++) {
          const i = chunk[j];
          const raw = outBatch[j];
          if (
            raw == null ||
            raw.trim().length === 0 ||
            !deps.glossary.placeholdersIntact(raw, masks[i].tokens)
          ) {
            if (engine.name === "deepl") deeplBudget += masks[i].masked.length; // rimborsa i falliti
            continue;
          }
          const final = deps.glossary.unmask(raw, masks[i].tokens);
          done[i] = final;
          usedBy[i] = engine.name;
          deps.tm.set(pending[i].source, lang, final, "machine", engine.name);
          wrote = true;
        }
        if (wrote) deps.tm.save(); // salvataggio incrementale (ripartibile su re-run)
      }
    }

    for (let i = 0; i < pending.length; i++) {
      results.push({
        id: pending[i].id,
        lang,
        source: pending[i].source,
        text: done[i],
        engine: usedBy[i] ?? "none",
        status: "machine",
      });
    }
  }

  return results;
}
