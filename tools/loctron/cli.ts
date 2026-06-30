import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { shared, projects } from "./config.ts";
import { Glossary } from "./core/glossary.ts";
import { TranslationMemory } from "./core/tm.ts";
import { DeepLEngine } from "./engines/deepl.ts";
import { OllamaEngine } from "./engines/ollama.ts";
import { translateSegments } from "./core/pipeline.ts";
import { makeAdapter } from "./adapters/index.ts";
import type { Engine } from "./core/types.ts";

const argv = process.argv.slice(2);
const cmd = argv[0] ?? "help";

function flag(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function deeplBudget(deepl: DeepLEngine): Promise<number> {
  const u = await deepl.usage().catch(() => null);
  if (!u) return 0;
  return Math.max(0, u.limit - u.count - shared.deepl.safetyMarginChars);
}

async function main(): Promise<void> {
  const glossary = Glossary.load(shared.glossaryPath);
  const tm = new TranslationMemory(shared.tmPath);
  const deepl = new DeepLEngine();
  const ollama = new OllamaEngine(shared.ollama.url, shared.ollama.model);
  const engines: Engine[] = shared.engineOrder.map((n) => (n === "deepl" ? deepl : ollama));

  if (cmd === "engines") {
    console.log(
      `deepl: ${(await deepl.available()) ? "key OK" : "no key"} | ollama: ${(await ollama.available()) ? "up" : "down"} (${shared.ollama.model})`,
    );
    return;
  }

  if (cmd === "usage") {
    const u = await deepl.usage().catch((e) => {
      console.error(String(e));
      return null;
    });
    if (!u) {
      console.log("DeepL: nessuna key (configura DEEPL_API_KEY) → il waterfall usa solo Ollama.");
      return;
    }
    console.log(
      `DeepL: ${u.count}/${u.limit} caratteri usati (${((100 * u.count) / u.limit).toFixed(1)}%). Residuo: ${u.limit - u.count}.`,
    );
    return;
  }

  if (cmd === "tm-stats") {
    console.log(JSON.stringify(tm.stats(), null, 2));
    return;
  }

  if (cmd === "demo") {
    const samples = [
      "Your wearable data in one private dashboard, stored on EU servers.",
      "Download",
      "Sync your Galaxy Watch and smart ring without jumping between apps.",
    ];
    const segs = samples.map((s, i) => ({ id: `demo:${i}`, source: s }));
    const budget = await deeplBudget(deepl);
    const res = await translateSegments(segs, ["sv", "da", "no", "fi"], {
      glossary,
      tm,
      engines,
      sourceLang: "en",
      deeplBudgetChars: budget,
    });
    tm.save();
    for (const r of res) console.log(`[${r.lang}] (${r.engine}) ${r.text ?? "<da rivedere>"}`);
    return;
  }

  if (cmd === "status" || cmd === "run") {
    const project = projects[argv[1] ?? ""];
    if (!project) {
      console.error(`progetto sconosciuto: "${argv[1] ?? ""}". Disponibili: ${Object.keys(projects).join(", ")}`);
      process.exit(1);
      return;
    }
    const adapter = makeAdapter(project);
    const { segments, manual } = adapter.extract();
    const onlyLang = flag("--lang");
    const langs = onlyLang ? [onlyLang] : project.targetLangs;

    if (cmd === "status") {
      console.log(`progetto ${project.key}: ${segments.length} stringhe traducibili, ${manual.length} a mano (ICU).`);
      for (const lang of langs) {
        let hit = 0;
        for (const s of segments) if (tm.get(s.source, lang)) hit++;
        console.log(`  ${lang}: ${hit}/${segments.length} in memoria, ${segments.length - hit} da tradurre.`);
      }
      return;
    }

    // run
    const limit = Number(flag("--limit") ?? "0");
    const segs = limit > 0 ? segments.slice(0, limit) : segments;
    const budget = await deeplBudget(deepl);
    console.log(`run ${project.key}: ${segs.length} stringhe × ${langs.length} lingue. DeepL budget: ${budget} caratteri.`);
    const res = await translateSegments(segs, langs, {
      glossary,
      tm,
      engines,
      sourceLang: project.sourceLang,
      deeplBudgetChars: budget,
    });
    tm.save();

    for (const lang of langs) {
      const byId = new Map<string, string>();
      let fromTm = 0;
      let missing = 0;
      for (const r of res) {
        if (r.lang !== lang) continue;
        if (r.text != null) {
          byId.set(r.id, r.text);
          if (r.engine === "tm") fromTm++;
        } else {
          missing++;
        }
      }
      const out = adapter.outPath(lang);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, adapter.build(lang, byId));
      console.log(`  ${lang}: ${out} — ${byId.size} tradotte (${fromTm} da memoria), ${missing} da rivedere.`);
    }
    if (manual.length) {
      console.log(`  nota ICU (a mano): ${manual.length} chiavi → ${manual.slice(0, 6).join(", ")}${manual.length > 6 ? "…" : ""}`);
    }
    return;
  }

  console.log(`loctron — node --experimental-strip-types tools/loctron/cli.ts <comando>
  engines              motori disponibili (DeepL key? Ollama up?)
  usage                stato crediti DeepL del mese
  demo                 traduce 3 stringhe campione (prova end-to-end)
  status <site|app>    copertura della memoria per progetto
  run <site|app> [--limit N] [--lang X]   traduce e scrive le preview in .preview/
  tm-stats             statistiche della memoria di traduzione`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
