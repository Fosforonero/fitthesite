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
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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
  // Una richiesta di rete scritta a mano non passa da nessun client: si vieta il fetch esplicito.
  ["fetch(", /\bfetch\s*\(|XMLHttpRequest|sendBeacon|new\s+WebSocket/],
  ["sessione o cookie", /next\/headers|\bcookies\s*\(|\bheaders\s*\(/],
  // Nessuna via per accettare o installare tramite il codice: niente pulsanti o
  // link dello store, niente referrer, niente link nella pagina.
  ["pulsanti o link dello store", /StoreButton|PLAY_STORE_URL|APPLE_STORE_URL|play\.google|apps\.apple|referrer|next\/link|<a[\s>]|href/i],
];

/** Gli import LOCALI (alias @/ e relativi) di un file, risolti su disco; i pacchetti esterni non si scansionano. */
function importLocali(sorgente: string, dalDir: string): string[] {
  const specifici = [...sorgente.matchAll(/(?:from\s*|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g)].map((m) => m[1]);
  const risolti: string[] = [];
  for (const spec of specifici) {
    const base = spec.startsWith("@/") ? path.join(RADICE, spec.slice(2)) : spec.startsWith(".") ? path.resolve(dalDir, spec) : null;
    if (!base) continue;
    for (const cand of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
      if (existsSync(cand) && statSync(cand).isFile()) {
        risolti.push(cand);
        break;
      }
    }
  }
  return risolti;
}

/** La chiusura transitiva degli import locali, a partire dai file della pagina e della route. */
function chiusura(radici: string[]): string[] {
  const visti = new Set<string>();
  const coda = [...radici];
  while (coda.length) {
    const p = coda.pop() as string;
    if (visti.has(p)) continue;
    visti.add(p);
    for (const n of importLocali(readFileSync(p, "utf8"), path.dirname(p))) coda.push(n);
  }
  return [...visti].sort();
}

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

  // Il gate non si ferma ai due file: pagina e route importano contenuti e utilita' locali, e un client dei dati
  // importato da LI' (anche a piu' livelli) lo aggirerebbe. I divieti di ACCESSO AI DATI (non quelli sui link,
  // che valgono solo per la pagina) si applicano a tutta la chiusura degli import locali.
  const ACCESSO_AI_DATI = DIVIETI.filter(([nome]) => !/pulsanti o link/.test(nome));

  it("la chiusura degli import locali e' non vuota e comprende i contenuti dell'invito", () => {
    const tutti = chiusura(elenco).map((p) => path.relative(RADICE, p).split(path.sep).join("/"));
    expect(tutti.length).toBeGreaterThan(elenco.length);
    expect(tutti).toContain("lib/content/famiglia-invito.ts");
  });

  for (const [nome, regola] of ACCESSO_AI_DATI) {
    it(`nessun file importato (transitivo) contiene: ${nome}`, () => {
      for (const p of chiusura(elenco)) {
        expect(readFileSync(p, "utf8"), path.relative(RADICE, p)).not.toMatch(regola);
      }
    });
  }
});
