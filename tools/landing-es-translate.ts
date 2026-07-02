/**
 * Completa lo SPAGNOLO mancante sulle 13 landing page via Ollama (locale, gratis).
 * Estrae i campi con `en` ma senza `es` (landingEsMissing), traduce en->es col
 * motore loctron (Ollama qwen3 + glossario/DNT), scrive `lib/landing/es-overlay.json`.
 * Ripartibile: la TM salva, ri-eseguire salta cio' che e' gia' in memoria/overlay.
 *
 *   docker run --rm -e OLLAMA_URL=http://host.docker.internal:11434 \
 *     -v "$PWD":/work -v "$PWD/fitthesite/node_modules":/work/fitthesite-f1/node_modules:ro \
 *     -w /work/fitthesite-f1 node:22 npx -y tsx tools/landing-es-translate.ts [--coverage]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

import { LANDING_PAGES } from "@/lib/landing/data";
import { walkLanding, landingEsMissing, type EsOverlay } from "@/lib/landing/es-overlay";

import { Glossary } from "./loctron/core/glossary.ts";
import { TranslationMemory } from "./loctron/core/tm.ts";
import { OllamaEngine } from "./loctron/engines/ollama.ts";
import { translateSegments } from "./loctron/core/pipeline.ts";
import type { Segment, Engine } from "./loctron/core/types.ts";

const SEP = " ";
const OVERLAY = "lib/landing/es-overlay.json";
const GLOSSARY = "tools/loctron/data/glossary.json";
const TM = "tools/loctron/.tm/landing-es.json";

async function main(): Promise<void> {
  if (process.argv.includes("--coverage")) {
    let total = 0;
    let missing = 0;
    for (const lp of LANDING_PAGES) {
      total += walkLanding(lp).length;
      const m = landingEsMissing(lp).length;
      missing += m;
      if (m > 0) console.log(`${lp.slug}: ${m} campi senza es`);
    }
    console.log(`TOT campi traducibili: ${total}, senza spagnolo: ${missing}`);
    return;
  }

  const glossary = Glossary.load(GLOSSARY);
  const tm = new TranslationMemory(TM);
  const ollama = new OllamaEngine(
    process.env.OLLAMA_URL ?? "http://localhost:11434",
    process.env.OLLAMA_MODEL ?? "qwen3:14b",
  );
  const engines: Engine[] = [ollama];

  // Segmenti dai campi senza es. id = slug SEP path [SEP i].
  const segments: Segment[] = [];
  const listLen = new Map<string, number>();
  for (const lp of LANDING_PAGES) {
    for (const e of landingEsMissing(lp)) {
      const base = `${lp.slug}${SEP}${e.path}`;
      if (e.kind === "loc") {
        const s = e.node.en ?? e.node.it;
        if (s && s.trim()) segments.push({ id: base, source: s, context: "landing" });
      } else {
        const arr = e.node.en ?? e.node.it;
        listLen.set(base, arr.length);
        arr.forEach((s, i) => {
          if (s && s.trim()) segments.push({ id: `${base}${SEP}${i}`, source: s, context: "landing" });
        });
      }
    }
  }
  console.log(`Segmenti spagnolo da tradurre: ${segments.length}`);
  if (segments.length === 0) {
    console.log("Niente da fare: spagnolo gia' completo.");
    return;
  }

  const res = await translateSegments(segments, ["es"], {
    glossary,
    tm,
    engines,
    sourceLang: "en",
    deeplBudgetChars: 0,
  });
  tm.save();

  const overlay: EsOverlay = existsSync(OVERLAY)
    ? (JSON.parse(readFileSync(OVERLAY, "utf8")) as EsOverlay)
    : {};
  const listBuf = new Map<string, string[]>();
  let ok = 0;
  let miss = 0;
  for (const r of res) {
    if (r.text == null) {
      miss++;
      continue;
    }
    const parts = r.id.split(SEP);
    if (parts.length === 2) {
      (overlay[parts[0]] ??= {})[parts[1]] = r.text;
      ok++;
    } else {
      const base = `${parts[0]}${SEP}${parts[1]}`;
      const i = Number(parts[2]);
      let a = listBuf.get(base);
      if (!a) {
        a = [];
        listBuf.set(base, a);
      }
      a[i] = r.text;
    }
  }
  // liste: solo se complete
  for (const [base, arr] of listBuf) {
    const [slug, path] = base.split(SEP);
    const len = listLen.get(base) ?? 0;
    let complete = arr.length === len;
    for (let i = 0; i < len; i++) if (arr[i] == null) complete = false;
    if (!complete) continue;
    (overlay[slug] ??= {})[path] = arr;
  }
  writeFileSync(OVERLAY, JSON.stringify(overlay, null, 2) + "\n");
  console.log(`Overlay es aggiornato: ${OVERLAY}. loc ok ${ok}, liste ${listBuf.size}, da rivedere ${miss}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
