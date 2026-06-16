#!/usr/bin/env node
/**
 * Guardrail route mobile (audit sicurezza 2026-06).
 *
 * Due regole, a "ratchet" (si stringe, non si allenta):
 *  1) Nessuna NUOVA route può usare `createAdminClient(` (service_role, bypassa
 *     la RLS). Le route che oggi lo usano legittimamente sono in ADMIN_ALLOWLIST.
 *     Aggiungerne una richiede una modifica conscia a questa lista (= review).
 *  2) Ogni route webhook pubblica deve chiamare una funzione di verifica
 *     (verifyXxx o requireUser) nel suo handler.
 *
 * Esce 1 se trova violazioni. Pensato per girare in pre-commit e in CI.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const API_ROOT = "app/api";

// File autorizzati a usare service_role (no contesto utente: cron/webhook/billing).
const ADMIN_ALLOWLIST = new Set([
  "app/api/cron/beta-welcome-emails/route.ts",
  "app/api/cron/sync-trigger/route.ts",
  "app/api/v1/auth/devices/codes/route.ts",
  "app/api/v1/billing/validate-purchase/route.ts",
  "app/api/v1/family-events/webhook/route.ts",
  "app/api/v1/invites/[code]/preview/route.ts",
]);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e === "route.ts") out.push(p);
  }
  return out;
}

const problems = [];
let routes = [];
try {
  routes = walk(API_ROOT);
} catch {
  console.log(`check-mobile-routes: ${API_ROOT} non trovato, skip.`);
  process.exit(0);
}

for (const file of routes) {
  const src = readFileSync(file, "utf8");
  const rel = file.replaceAll("\\", "/");

  if (/\bcreateAdminClient\s*\(/.test(src) && !ADMIN_ALLOWLIST.has(rel)) {
    problems.push(
      `${rel}: usa createAdminClient() (service_role) ma non è in ADMIN_ALLOWLIST. ` +
        `Usa il client user-bound (RLS) o aggiungi il file alla allowlist se è davvero necessario.`,
    );
  }

  if (rel.includes("/webhook/")) {
    // Verifica riconosciuta: funzione verify*/requireUser, OPPURE auth via
    // secret condiviso/firma (x-webhook-secret, *_WEBHOOK_SECRET, signature/hmac).
    const hasVerify =
      /\bverify[A-Z]\w*\s*\(|\brequireUser\s*\(|WEBHOOK_SECRET|x-webhook-secret|x-[a-z-]*signature|\bhmac/i.test(
        src,
      );
    if (!hasVerify) {
      problems.push(
        `${rel}: route webhook senza verifica (manca una chiamata verify*/requireUser).`,
      );
    }
  }
}

if (problems.length) {
  console.error("❌ check-mobile-routes: violazioni trovate:");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`✓ check-mobile-routes: ${routes.length} route ok.`);
