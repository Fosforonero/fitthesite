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
  // Contatori pubblici aggregati (nessun dato utente, nessun contesto RLS):
  // service_role serve per contare/incrementare righe cross-utente.
  "app/api/v1/posts/stats/route.ts",
  "app/api/v1/posts/stats/route.ts",
  // Notifiche degli store (2026-08-25). Sono chiamate DA Apple e DA Google,
  // senza nessuna sessione utente: non esiste un client user-bound da usare.
  // L'autenticita' non viene da un header ma dalla firma del payload —
  // catena x5c fino ai root Apple per l'una, token OIDC di Google per
  // l'altra — ed e' verificata prima di qualunque scrittura.
  "app/api/v1/billing/notifications/apple/route.ts",
  "app/api/v1/billing/notifications/google/route.ts",
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

  // Non solo `/webhook/`: due endpoint pubblici che possono REVOCARE un
  // diritto vivevano sotto `/notifications/` e sfuggivano a questa regola per
  // il solo nome della cartella. Una regola che dipende da come si chiama una
  // directory non e' una regola.
  if (rel.includes("/webhook/") || rel.includes("/notifications/")) {
    // Verifica riconosciuta: funzione verify*/requireUser, OPPURE auth via
    // secret condiviso/firma (x-webhook-secret, *_WEBHOOK_SECRET, signature/hmac).
    const hasVerify =
      /\bverify[A-Z]\w*\s*\(|\bverifica[A-Z]\w*\s*\(|\brequireUser\s*\(|WEBHOOK_SECRET|x-webhook-secret|x-[a-z-]*signature|\bhmac/i.test(
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
