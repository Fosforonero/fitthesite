/**
 * Le copie congelate sono ancora copie?
 *
 * ── PERCHE' QUESTO FILE E' STATO RISCRITTO ──────────────────────────────────
 *
 * La versione precedente confrontava l'unica fixture con `git show main:...`.
 * Passava. Passava perche' `main` LOCALE era rimasto indietro di 194 commit:
 * la fixture e il testimone erano vecchi allo stesso modo. Contro `origin/main`
 * il file era +34 righe (4e04ea8, 16/08, la traccia del tentativo scritta prima
 * della validazione), quindi per settimane quel verde ha affermato il falso.
 *
 * Un branch non puo' fare da testimone: si muove, e nessuno se ne accorge. Qui
 * l'autorita' e' il COMMIT COMPLETO scritto nel manifesto.
 *
 * ── DUE AUTORITA' DISTINTE ──────────────────────────────────────────────────
 *
 * route-189-at-release  il route quando usci' la 189. Immutabile. Serve solo a
 *                       riprodurre il difetto originale, e non decide un GO.
 * route-live-pre190     il route che gira DAVVERO adesso, verificato risolvendo
 *                       l'alias di produzione. Questa decide il rilascio.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { databaseRaggiungibile } from "@/test/db/psql-supabase";

// `new URL(...).pathname` lascia gli spazi come %20, e questo repo vive sotto
// "LOS ANGELES": fileURLToPath e' l'unico modo di ottenere un percorso vero.
const QUI = path.dirname(fileURLToPath(import.meta.url));
const RADICE = path.resolve(QUI, "../..");

type Fixture = {
  file: string;
  commit: string;
  sha256: string;
  righe: number;
  deployment: { id: string; target: string; url: string; pronto_utc: string };
  ancoraggio: string;
  scopo: string;
  immutabile: boolean;
  decide_il_rilascio: boolean;
};

const manifesto = JSON.parse(readFileSync(path.join(QUI, "manifesto.json"), "utf8")) as {
  repository: string;
  percorso_origine: string;
  marcatore: string;
  fixture: Fixture[];
};

const MARCATORE = `${manifesto.marcatore}\n`;

/** La copia letterale: tutto cio' che sta SOTTO il marcatore. L'intestazione
 *  scritta a mano sta sopra e non fa parte di quello che si confronta. */
function copiaDi(f: Fixture): string {
  const intero = readFileSync(path.join(QUI, f.file), "utf8");
  const i = intero.indexOf(MARCATORE);
  expect(i, `${f.file}: il marcatore di inizio copia e' sparito`).toBeGreaterThan(-1);
  return intero.slice(i + MARCATORE.length);
}

function daCommit(f: Fixture): string {
  return execFileSync("git", ["show", `${f.commit}:${manifesto.percorso_origine}`], {
    encoding: "utf8",
    cwd: RADICE,
    maxBuffer: 8 * 1024 * 1024,
  });
}

describe("copie congelate di validate-purchase", () => {
  // Prima linea: non serve git. Regge anche in un archivio potato.
  it.each(manifesto.fixture)("$file — l'impronta e' quella del manifesto", (f) => {
    expect(createHash("sha256").update(copiaDi(f)).digest("hex")).toBe(f.sha256);
  });

  // Seconda linea: la copia viene DAVVERO da quel commit. Se l'oggetto non c'e'
  // (checkout superficiale) questo test e' rosso, e deve esserlo: un cancello di
  // release non puo' saltare la verifica di provenienza e chiamarsi verde.
  it.each(manifesto.fixture)("$file — e' identica al commit congelato, byte per byte", (f) => {
    const daGit = daCommit(f);
    expect(copiaDi(f)).toBe(daGit);
    expect(createHash("sha256").update(daGit).digest("hex")).toBe(f.sha256);
  });

  it("le due copie sono due cose diverse, e la storica viene prima", () => {
    const [storica, live] = manifesto.fixture;
    expect(storica.sha256).not.toBe(live.sha256);
    // L'ordine non e' un'etichetta: si verifica sull'archivio.
    expect(() =>
      execFileSync("git", ["merge-base", "--is-ancestor", storica.commit, live.commit], {
        cwd: RADICE,
      }),
    ).not.toThrow();
  });

  it("una sola fixture decide il rilascio, ed e' quella viva", () => {
    const decidono = manifesto.fixture.filter((f) => f.decide_il_rilascio);
    expect(decidono.map((f) => f.file)).toEqual(["route-live-pre190.vendored.ts"]);
    const storica = manifesto.fixture.find((f) => f.file.includes("at-release"))!;
    expect(storica.immutabile).toBe(true);
    expect(storica.decide_il_rilascio).toBe(false);
  });

  /**
   * Il difetto di prima non era la fixture: era il testimone. Questo lo
   * impedisce a chiunque, non solo a questo file.
   */
  it("nessun test del repository confronta una copia con un branch", () => {
    const tracciati = execFileSync("git", ["ls-files", "*.test.ts", "*.test.tsx"], {
      encoding: "utf8",
      cwd: RADICE,
    })
      .split("\n")
      .filter(Boolean);

    // L'argomento che segue "show" in una chiamata a git: e' li' che sta il ref.
    const ARGOMENTO_DI_SHOW = /"show"\s*,\s*(`[^`]*`|"[^"]*"|'[^']*')/g;
    // Ammessi: un commit completo letterale, o l'interpolazione di qualcosa che
    // si chiama commit. Tutto il resto e' un ref che puo' muoversi.
    const AMMESSO = /^[`"'](?:[0-9a-f]{40}|\$\{[^}]*[Cc]ommit[^}]*\})/;

    const colpevoli: string[] = [];
    for (const rel of tracciati) {
      // I commenti si tolgono PRIMA di cercare: questo stesso file spiega a
      // parole il difetto che impedisce, e cercare quelle parole nel testo
      // intero renderebbe rosso il guardrail per la frase che dice la cosa
      // giusta. Si guarda cio' che un file FA, non cio' che dice.
      const testo = readFileSync(path.join(RADICE, rel), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n")
        .filter((r) => !r.trimStart().startsWith("//"))
        .join("\n");

      for (const m of testo.matchAll(ARGOMENTO_DI_SHOW)) {
        if (!AMMESSO.test(m[1])) colpevoli.push(`${rel}: git show ${m[1]}`);
      }
      // Seconda linea, per le forme che non passano da execFileSync. Vale solo
      // per i file che lanciano DAVVERO processi: in un file che non ne lancia,
      // «git show main:» e' il testo di un'asserzione, non un comando. Si
      // nominano le API di child_process, non un generico «exec»: la prima
      // stesura accettava anche `RegExp.prototype.exec` e si accusava da sola.
      if (/\b(execFileSync|execSync|spawnSync|child_process)\b/.test(testo)) {
        for (const m of testo.matchAll(/git\s+show\s+([A-Za-z][A-Za-z0-9_./-]*):/g)) {
          colpevoli.push(`${rel}: git show ${m[1]}:`);
        }
      }
    }
    expect(
      colpevoli,
      "un branch si muove e nessuno se ne accorge: l'autorita' deve essere un commit completo",
    ).toEqual([]);
  });
});

/**
 * Il test end-to-end contro il database si salta quando il bersaglio non c'e'.
 * Un salto silenzioso pero' e' come un test che non esiste: sembra verde e non
 * ha guardato niente.
 *
 * Prima di un rilascio si esegue con RICHIEDI_DB=1, e allora il salto diventa
 * un fallimento. E' la riga della lista di rilascio che rende la copertura una
 * scelta invece di un caso.
 */
describe("copertura end-to-end col database", () => {
  it("il database isolato c'e' quando RICHIEDI_DB=1", () => {
    if (process.env.RICHIEDI_DB !== "1") {
      expect(true).toBe(true);
      return;
    }
    expect(
      databaseRaggiungibile(),
      "RICHIEDI_DB=1 ma il bersaglio non risponde: route.db.test.ts si sarebbe saltato in silenzio",
    ).toBe(true);
  });
});
