/**
 * Guardrail SPRINT P0.12 FASE 1 — impedisce che il cron IndexNow giornaliero
 * torni a enumerare incondizionatamente tutte le pagine provider/modello/core
 * ogni giorno (473 URL fissi: 187 provider + 264 modelli + 22 core, a
 * prescindere da modifiche reali). La strategia scelta per la finestra
 * pre-ferie e' disabilitare la schedule automatica in vercel.json, non
 * riscrivere la logica di route.ts (nessun nuovo stato persistente, come da
 * mandato) — quindi il guardrail verifica che quella schedule resti assente.
 *
 * Fallisce (exit 1) se:
 *  1. vercel.json contiene ancora (o di nuovo) una entry `crons[].path` che
 *     matcha "/api/cron/indexnow-daily" — la schedule automatica e' tornata
 *     armata senza che nessuno abbia rivisto la logica di enumerazione.
 *  2. La route app/api/cron/indexnow-daily/route.ts e' stata cancellata —
 *     deve restare disponibile per invocazione manuale/deploy-triggered.
 *  3. La route ha perso il fail-closed su CRON_SECRET (auth bypassata).
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p012-indexnow-cron.ts
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

// 1. vercel.json: nessuna schedule automatica per indexnow-daily.
const vercelJsonPath = path.join(repoRoot, "vercel.json");
if (!fs.existsSync(vercelJsonPath)) {
  errors.push("[file-mancante] vercel.json non trovato.");
} else {
  const raw = fs.readFileSync(vercelJsonPath, "utf8");
  let parsed: { crons?: Array<{ path?: string; schedule?: string }> };
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    errors.push(`[json-invalido] vercel.json non parsabile: ${e instanceof Error ? e.message : String(e)}`);
    parsed = {};
  }
  const crons = parsed.crons ?? [];
  const indexNowCron = crons.find((c) => (c.path ?? "").includes("indexnow-daily"));
  if (indexNowCron) {
    errors.push(
      `[cron-riarmato] vercel.json ha di nuovo una schedule automatica per indexnow-daily ` +
        `(schedule="${indexNowCron.schedule}") — se la logica di route.ts enumera ancora tutte le ` +
        `pagine provider/modello/core incondizionatamente, questo torna a reinviare 473+ URL/giorno ` +
        `a prescindere da modifiche reali. Prima di riarmare, aggiungere un vero gate "solo cambiati".`,
    );
  }
}

// 2/3. La route deve esistere ed essere ancora fail-closed su CRON_SECRET.
const routePath = path.join(repoRoot, "app/api/cron/indexnow-daily/route.ts");
if (!fs.existsSync(routePath)) {
  errors.push("[route-cancellata] app/api/cron/indexnow-daily/route.ts non trovata — il percorso manuale/deploy-triggered deve restare disponibile.");
} else {
  const src = fs.readFileSync(routePath, "utf8");
  if (!/CRON_SECRET/.test(src)) {
    errors.push("[auth-rimossa] route.ts non referenzia piu' CRON_SECRET — il fail-closed sull'endpoint sembra rimosso.");
  }
  if (!/cron_misconfigured/.test(src) || !/unauthorized/.test(src)) {
    errors.push("[auth-indebolita] route.ts non sembra piu' rifiutare richieste senza secret configurato o senza bearer corretto.");
  }
}

if (errors.length > 0) {
  console.error(`❌ P0.12 IndexNow cron guardrail: ${errors.length} problema/i.\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(
  "✅ P0.12 IndexNow cron guardrail: nessuna schedule automatica indexnow-daily in vercel.json, route manuale/deploy-triggered ancora presente e fail-closed su CRON_SECRET.",
);
