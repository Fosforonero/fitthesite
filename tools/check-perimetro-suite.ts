/**
 * Gate sul PERIMETRO della suite Vitest, non sul prodotto.
 *
 * Il 25/08/2026 `pnpm test` raccoglieva 6.478 file di test, 6.444 dei quali
 * provenivano da `.claude/worktrees/`: trentaquattro checkout completi di
 * altri rami, dentro il repository e ignorati da git. Il 99,5% di quel verde
 * non riguardava questo ramo, e «suite completa verde» e' un cancello della
 * 190: un rosso vero poteva restare sepolto sotto migliaia di verdi altrui.
 *
 * Il guardrail precedente (suite-scope.test.ts) leggeva la configurazione e
 * verificava che ci fossero ancora le righe di esclusione. Era meglio di
 * niente, ma controllava il TESTO della configurazione, non il suo EFFETTO:
 * sarebbe rimasto verde con un `include` allargato, con una radice sbagliata,
 * o con una directory nuova a cui nessuno aveva pensato.
 *
 * Questo gate guarda cosa vitest raccoglie DAVVERO e lo confronta con due
 * verita' indipendenti:
 *
 *   1) l'elenco dei file di test TRACCIATI DA GIT — quindi diventa rosso sia
 *      se entra qualcosa che non dovrebbe (perimetro riaperto), sia se un
 *      test vero non viene piu' eseguito (perimetro troppo stretto, che e' il
 *      rischio proprio dei perimetri positivi);
 *   2) due numeri congelati in tools/perimetro-suite.conf, cosi' una deriva
 *      va spiegata invece di passare inosservata.
 *
 *   pnpm suite:perimetro-check
 *   pnpm suite:perimetro-check --controllo-positivo
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const RADICE = path.resolve(__dirname, "..");
const CONF = path.join(RADICE, "tools", "perimetro-suite.conf");

/**
 * MODALITA' RELEASE (INFRA-5B).
 *
 * In locale `pnpm test` puo' saltare i test contro il database: dichiara il
 * motivo e va bene cosi'. In un gate di release no: uno skip ambientale li'
 * significa che sei test non sono stati eseguiti, e un verde che non dice
 * quante cose ha guardato puo' averne guardate zero.
 *
 * Qui il bersaglio e' obbligatorio, gli skip ambientali sono rossi, e gli
 * unici skip tollerati sono quelli DICHIARATI in perimetro-suite.conf con il
 * loro motivo.
 */
const RELEASE = process.argv.includes("--release");

let uscita = 0;
const ok = (m: string) => console.log(`  ok     ${m}`);
const rosso = (m: string) => {
  console.log(`  ROSSO  ${m}`);
  uscita = 1;
};

type Conf = { file: number; test: number; saltati: number; skipAutorizzati: string[] };

function leggiConf(): Conf {
  const testo = readFileSync(CONF, "utf8");
  const righe = testo.split("\n");
  const num = (chiave: string) => {
    const riga = righe.find((l) => l.startsWith(`${chiave}=`));
    if (!riga) throw new Error(`manca '${chiave}=' in ${CONF}`);
    const v = Number(riga.slice(chiave.length + 1).trim());
    if (!Number.isInteger(v) || v < 0) throw new Error(`'${chiave}' non e' un intero: ${riga}`);
    return v;
  };
  const skipAutorizzati = righe
    .filter((l) => l.startsWith("skip_autorizzato="))
    .map((l) => l.slice("skip_autorizzato=".length).trim())
    .filter(Boolean);
  return RELEASE
    ? { file: num("file"), test: num("test_release"), saltati: num("saltati_release"), skipAutorizzati }
    : { file: num("file"), test: num("test"), saltati: num("saltati"), skipAutorizzati };
}

/** Elenco derivato dal catalogo di git, non dichiarato a mano. */
function attesiDaGit(): string[] {
  const out = execFileSync("git", ["ls-files", "*.test.ts", "*.test.tsx"], {
    cwd: RADICE,
    encoding: "utf8",
  });
  return out.split("\n").map((r) => r.trim()).filter(Boolean).sort();
}

type Raccolta = {
  file: string[];
  casi: number;
  saltati: number;
  saltatiPerFile: Map<string, number>;
  esito: number;
};

/**
 * Si usa il RAPPORTO DELL'ESECUZIONE, non `vitest list`.
 *
 * `vitest list` sembrava la scelta ovvia — colleziona senza eseguire, e' piu'
 * rapido — ma non elenca un file il cui unico `describe` e' saltato da uno
 * `skipIf`. Per il gate quel file diventava «tracciato ma non raccolto», cioe'
 * indistinguibile da un file lasciato fuori dal perimetro. Sono due cose
 * diverse: la prima e' un prerequisito dichiarato che manca (il bersaglio del
 * database), la seconda e' un difetto del perimetro. Un gate che le confonde
 * resta rosso per il motivo sbagliato finche' qualcuno lo spegne.
 *
 * Il rapporto dell'esecuzione conosce i file saltati e li conta, quindi le
 * due cose restano separate — e in piu' l'esito e' quello vero della suite.
 * `--run` e' esplicito: una suite in watch, in un gate, resterebbe appesa.
 */
function raccoltaDaVitest(): Raccolta {
  const rapporto = path.join(RADICE, "node_modules", ".cache", "perimetro-suite.json");
  mkdirSync(path.dirname(rapporto), { recursive: true });
  rmSync(rapporto, { force: true });
  let esito = 0;
  try {
    execFileSync(
      "node",
      [
        path.join(RADICE, "node_modules", "vitest", "vitest.mjs"),
        "--run",
        "--reporter=json",
        `--outputFile=${rapporto}`,
      ],
      {
        cwd: RADICE,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
        // RICHIEDI_DB=1 trasforma in FALLIMENTO il salto silenzioso dei test
        // contro il database (vedi test/legacy-189/vendored.test.ts): in
        // release, «il container non risponde» non e' una scusa.
        env: RELEASE ? { ...process.env, RICHIEDI_DB: "1" } : process.env,
      },
    );
  } catch (e) {
    // L'esito si cattura QUI, prima di qualunque lettura: un rosso della suite
    // non deve trasformarsi in un verde del perimetro.
    esito = (e as { status?: number }).status ?? 1;
  }
  if (!existsSync(rapporto)) throw new Error(`vitest non ha prodotto ${rapporto}`);
  const json = JSON.parse(readFileSync(rapporto, "utf8")) as {
    testResults?: Array<{ name?: string; assertionResults?: Array<{ status?: string }> }>;
  };
  const risultati = json.testResults ?? [];
  const file = [
    ...new Set(
      risultati
        .map((r) => r.name ?? "")
        .filter(Boolean)
        .map((f) => (path.isAbsolute(f) ? path.relative(RADICE, f) : f)),
    ),
  ].sort();
  const casi = risultati.reduce((n, r) => n + (r.assertionResults?.length ?? 0), 0);
  const perFile = new Map<string, number>();
  for (const r of risultati) {
    const nome = r.name ? (path.isAbsolute(r.name) ? path.relative(RADICE, r.name) : r.name) : "?";
    const n = (r.assertionResults ?? []).filter((a) => a.status === "pending" || a.status === "skipped").length;
    if (n > 0) perFile.set(nome, (perFile.get(nome) ?? 0) + n);
  }
  const saltati = [...perFile.values()].reduce((a, b) => a + b, 0);
  return { file, casi, saltati, saltatiPerFile: perFile, esito };
}

/** Estratta per poterla vedere fallire: vedi il controllo positivo. */
function intrusiDa(file: string[]): string[] {
  return file.filter(
    (f) => f.includes(`.claude${path.sep}worktrees`) || f.includes(".claude/worktrees") || f.includes(".claude"),
  );
}

function verifica(): Raccolta {
  const atteso = leggiConf();
  const attesi = attesiDaGit();
  const raccolta = raccoltaDaVitest();

  console.log(`  radice: ${RADICE}`);
  console.log(
    `  raccolti ${raccolta.file.length} file e ${raccolta.casi} test ` +
      `(di cui ${raccolta.saltati} saltati); tracciati da git ${attesi.length}; ` +
      `congelati ${atteso.file} file / ${atteso.test} test / ${atteso.saltati} saltati`,
  );
  console.log(`  la suite ha risposto: ${raccolta.esito}`);
  if (raccolta.esito !== 0) {
    rosso("la suite e' rossa: il perimetro puo' anche essere giusto, il verde non c'e'");
  }

  // 1) mai zero: una suite vuota passa sempre
  if (raccolta.file.length === 0) {
    rosso("zero file raccolti: un verde senza test non e' un verde");
    return raccolta;
  }

  // 2) nessun percorso puo' venire dai worktree degli agenti
  const intrusi = intrusiDa(raccolta.file);
  if (intrusi.length > 0) {
    rosso(`${intrusi.length} percorsi raccolti passano da .claude:`);
    intrusi.slice(0, 5).forEach((f) => console.log(`         ${f}`));
  } else {
    ok("nessun percorso raccolto passa da .claude/worktrees");
  }

  // 3) confronto con il catalogo di git, nelle due direzioni
  const insiemeRaccolti = new Set(raccolta.file);
  const insiemeAttesi = new Set(attesi);
  const inPiu = raccolta.file.filter((f) => !insiemeAttesi.has(f));
  const inMeno = attesi.filter((f) => !insiemeRaccolti.has(f));
  if (inPiu.length > 0) {
    rosso(`${inPiu.length} file raccolti NON sono tracciati da git (perimetro riaperto?):`);
    inPiu.slice(0, 5).forEach((f) => console.log(`         ${f}`));
  }
  if (inMeno.length > 0) {
    rosso(`${inMeno.length} file di test tracciati NON vengono eseguiti (perimetro troppo stretto):`);
    inMeno.slice(0, 5).forEach((f) => console.log(`         ${f}`));
  }
  if (inPiu.length === 0 && inMeno.length === 0) {
    ok(`i ${attesi.length} file di test tracciati sono esattamente quelli raccolti`);
  }

  // 4) la suite non deve mai girare in watch: in CI resterebbe appesa, e in
  //    locale «l'ho lanciata» non vorrebbe dire «e' finita».
  const pkg = JSON.parse(readFileSync(path.join(RADICE, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  const comando = pkg.scripts?.test ?? "";
  if (!/(^|\s)(run|--run)(\s|$)/.test(comando) || /--watch|(^|\s)watch(\s|$)/.test(comando)) {
    rosso(`lo script "test" non e' una esecuzione singola: ${JSON.stringify(comando)}`);
  } else {
    ok(`lo script "test" e' una esecuzione singola (${JSON.stringify(comando)})`);
  }

  // 5) i due numeri congelati
  if (raccolta.file.length !== atteso.file) {
    rosso(
      `file raccolti ${raccolta.file.length}, congelati ${atteso.file} ` +
        `(${raccolta.file.length > atteso.file ? "+" : ""}${raccolta.file.length - atteso.file}). ` +
        `Spiega la deriva e aggiorna ${path.relative(RADICE, CONF)} di proposito.`,
    );
  } else {
    ok(`file al numero congelato (${atteso.file})`);
  }
  if (RELEASE) {
    const cid = process.env.SUPABASE_DB_CONTAINER ?? "";
    const dbn = process.env.SUPABASE_DB_NAME ?? "";
    if (!cid || !dbn) {
      rosso(
        "modalita' release senza bersaglio: servono SUPABASE_DB_CONTAINER e " +
          "SUPABASE_DB_NAME. Senza, i sei test contro il database si salterebbero " +
          "e il gate direbbe verde su una suite incompleta.",
      );
    } else if (/supabase_db|prod|production|live|fitmesh_db/i.test(cid) || /supabase_db|prod|production|live|fitmesh_db/i.test(dbn)) {
      rosso(`bersaglio non isolato: container="${cid}" database="${dbn}"`);
    } else {
      ok(`bersaglio isolato dichiarato: container="${cid}" database="${dbn}"`);
    }

    // Ogni salto va giustificato per NOME DI FILE. Un file non dichiarato che
    // salta e' uno skip ambientale, e in release e' rosso.
    const ambientali = [...raccolta.saltatiPerFile.entries()].filter(
      ([f]) => !atteso.skipAutorizzati.includes(f),
    );
    if (ambientali.length > 0) {
      rosso(`${ambientali.length} file hanno skip AMBIENTALI (non autorizzati in perimetro-suite.conf):`);
      ambientali.forEach(([f, n]) => console.log(`         ${f}: ${n} test saltati`));
    } else {
      ok("zero skip ambientali: tutti i salti sono fra quelli dichiarati e motivati");
    }
    for (const [f, n] of raccolta.saltatiPerFile) {
      if (atteso.skipAutorizzati.includes(f)) console.log(`         skip autorizzato: ${f} (${n})`);
    }
  }

  if (raccolta.saltati !== atteso.saltati) {
    rosso(
      `test saltati ${raccolta.saltati}, congelati ${atteso.saltati}. ` +
        "Un insieme di skip che cresce in silenzio e' il modo piu' comodo di " +
        "svuotare una suite senza che nessuno se ne accorga.",
    );
  } else {
    ok(`test saltati al numero congelato (${atteso.saltati})`);
  }
  if (raccolta.casi !== atteso.test) {
    rosso(
      `test raccolti ${raccolta.casi}, congelati ${atteso.test} ` +
        `(${raccolta.casi > atteso.test ? "+" : ""}${raccolta.casi - atteso.test}). ` +
        `Spiega la deriva e aggiorna ${path.relative(RADICE, CONF)} di proposito.`,
    );
  } else {
    ok(`test al numero congelato (${atteso.test})`);
  }

  return raccolta;
}

// ─── controllo positivo ─────────────────────────────────────────────────────
const CORPO_TRAPPOLA = `import { expect, it } from "vitest";

// Trappola del controllo positivo di tools/check-perimetro-suite.ts.
// Se la trovi nel repository, il controllo si e' interrotto a meta': cancellala.
it("trappola", () => {
  expect(1).toBe(1);
});
`;

function controlloPositivo(): number {
  console.log("== controllo positivo: il perimetro sa dire di no, e sa dire di si'? ==");

  const fuori = path.join(RADICE, ".claude", "worktrees", "zz-trappola-infra5", "lib", "zz-trappola.test.ts");
  const fuori2 = path.join(RADICE, "docs", "zz-trappola-infra5.test.ts");
  const dentro = path.join(RADICE, "lib", "zz-trappola-infra5.test.ts");
  const trappole = [fuori, fuori2, dentro];

  const pulisci = () => {
    rmSync(path.join(RADICE, ".claude", "worktrees", "zz-trappola-infra5"), { recursive: true, force: true });
    rmSync(fuori2, { force: true });
    rmSync(dentro, { force: true });
  };

  try {
    for (const t of trappole) {
      mkdirSync(path.dirname(t), { recursive: true });
      writeFileSync(t, CORPO_TRAPPOLA, "utf8");
    }
    const raccolta = raccoltaDaVitest();
    const rel = (p: string) => path.relative(RADICE, p);

    let esito = 0;
    const dentroRaccolto = raccolta.file.includes(rel(dentro));
    const fuoriRaccolto = raccolta.file.includes(rel(fuori));
    const fuori2Raccolto = raccolta.file.includes(rel(fuori2));

    // Il filtro sugli intrusi, applicato a una lista sintetica: una verifica
    // che non si e' mai vista scattare non e' una verifica. Qui non si puo'
    // dimostrare col perimetro vero, perche' il perimetro vero — giustamente —
    // non fa mai entrare nulla da .claude.
    const finti = intrusiDa([".claude/worktrees/x/lib/a.test.ts", "lib/b.test.ts"]);
    if (finti.length === 1 && finti[0].includes(".claude/worktrees")) {
      console.log("  ok     il filtro sugli intrusi sa riconoscere un percorso .claude/worktrees");
    } else {
      console.log(`  ROSSO  il filtro sugli intrusi non riconosce piu' .claude/worktrees (${finti.length} trovati)`);
      esito = 1;
    }

    if (fuoriRaccolto) {
      console.log(`  ROSSO  la trappola dentro .claude/worktrees E' STATA raccolta: il perimetro non tiene`);
      esito = 1;
    } else {
      console.log(`  ok     la trappola in .claude/worktrees non viene raccolta`);
    }
    if (fuori2Raccolto) {
      console.log(`  ROSSO  la trappola in docs/ (directory non autorizzata) E' STATA raccolta`);
      esito = 1;
    } else {
      console.log(`  ok     la trappola in una directory non autorizzata non viene raccolta`);
    }
    if (!dentroRaccolto) {
      console.log(
        `  ROSSO  la trappola DENTRO il perimetro (lib/) NON e' stata raccolta: ` +
          `il gate direbbe "nessun intruso" perche' non raccoglie niente`,
      );
      esito = 1;
    } else {
      console.log(`  ok     la trappola dentro il perimetro viene raccolta (il gate sa anche dire di si')`);
    }
    return esito;
  } finally {
    pulisci();
    const residui = trappole.filter((t) => existsSync(t));
    if (residui.length > 0) {
      console.log(`  ROSSO  trappole rimaste sul disco: ${residui.map((r) => path.relative(RADICE, r)).join(", ")}`);
      process.exitCode = 1;
    } else {
      console.log("  ok     nessuna trappola rimasta sul disco");
    }
  }
}

const modo = (process.argv[2] ?? "") === "--release" ? (process.argv[3] ?? "") : (process.argv[2] ?? "");
if (modo === "--controllo-positivo") {
  const e = controlloPositivo();
  console.log();
  if (e === 0 && !process.exitCode) console.log("VERDE: il perimetro esclude cio' che deve e raccoglie cio' che deve.");
  process.exit(e || process.exitCode || 0);
} else if (modo && modo !== "--release") {
  console.log("uso: tsx tools/check-perimetro-suite.ts [--release] [--controllo-positivo]");
  process.exit(2);
} else {
  console.log(`== perimetro della suite vitest${RELEASE ? " — MODALITA' RELEASE" : ""} ==`);
  verifica();
  console.log();
  console.log(uscita === 0 ? "VERDE: perimetro conforme." : "ROSSO: perimetro non conforme.");
  process.exit(uscita);
}
