/**
 * Test statico: la pagina pubblica dell'invito e l'API di anteprima non
 * toccano il database.
 *
 * Perche' esiste: lo script scripts/check-mobile-routes.mjs guarda solo le
 * route sotto app/api e cerca solo `createAdminClient(`: la pagina era fuori
 * dal suo perimetro e queste due route usavano un client creato a mano.
 * Qui si legge il sorgente di TUTTI i file sotto i due percorsi (test esclusi)
 * e si fallisce se compare un qualunque modo di arrivare al database o alla
 * chiave di servizio.
 *
 * Mutazione che lo rende rosso (provata a mano): rimettere un import di
 * `@supabase/supabase-js` o la lettura della chiave di servizio in uno dei file.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const RADICE = path.resolve(__dirname, "..");
const PERCORSI = [
  "app/(frontend)/[locale]/famiglia/join",
  "app/api/v1/invites",
];

function file(dir: string): string[] {
  const uscita: string[] = [];
  for (const nome of readdirSync(dir)) {
    const p = path.join(dir, nome);
    if (statSync(p).isDirectory()) uscita.push(...file(p));
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(nome) && !/\.test\.(ts|tsx)$/.test(nome)) uscita.push(p);
  }
  return uscita;
}

const DIVIETI: [string, RegExp][] = [
  ["chiave di servizio", /SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE/],
  ["getSupabaseAdmin", /getSupabaseAdmin/],
  ["createClient(", /createClient\s*\(/],
  ["createAdminClient(", /createAdminClient\s*\(/],
  ["createServerClient(", /createServerClient\s*\(/],
  ["import di Supabase", /@supabase\//],
  ["import di lib/supabase", /lib\/supabase/],
  ["query .from(", /\.from\s*\(/],
  ["rpc(", /\.rpc\s*\(/],
  ["url di Supabase", /NEXT_PUBLIC_SUPABASE|SUPABASE_URL/],
  ["sessione o cookie", /next\/headers|\bcookies\s*\(|\bheaders\s*\(/],
  // Nessuna via per accettare o installare tramite il codice: niente pulsanti o
  // link dello store, niente referrer, niente link nella pagina.
  ["pulsanti o link dello store", /StoreButton|PLAY_STORE_URL|APPLE_STORE_URL|play\.google|apps\.apple|referrer|next\/link|<a[\s>]|href/i],
];

describe("invito pubblico: nessun database, nessuna chiave di servizio", () => {
  const elenco = PERCORSI.flatMap((r) => file(path.join(RADICE, r)));

  it("trova i due file attesi (il test non e' vuoto)", () => {
    const relativi = elenco.map((p) => path.relative(RADICE, p).split(path.sep).join("/")).sort();
    expect(relativi).toEqual([
      "app/(frontend)/[locale]/famiglia/join/[code]/page.tsx",
      "app/api/v1/invites/[code]/preview/route.ts",
    ]);
  });

  for (const [nome, regola] of DIVIETI) {
    it(`nessun file contiene: ${nome}`, () => {
      for (const p of elenco) {
        const sorgente = readFileSync(p, "utf8");
        expect(sorgente, path.relative(RADICE, p)).not.toMatch(regola);
      }
    });
  }
});
