#!/usr/bin/env node
/**
 * Prova HTTP LOCALE della pagina pubblica dell'invito e dell'API di anteprima.
 *
 * Cosa prova: che, con il sito costruito (`next build`) e avviato SENZA
 * nessuna variabile di Supabase, pagina e API rispondono in modo identico per
 * qualunque codice, senza dati, senza pulsanti o link per accettare o
 * installare, con le intestazioni attese.
 *
 * Solo codici sintetici. Solo un server locale su una porta libera, mai la
 * produzione. Il server viene fermato in ogni caso e la porta verificata.
 *
 * LIMITE: il server gira SENZA variabili Supabase, quindi il rate limit del middleware
 * esce subito (fail-open) e il percorso con il database NON viene esercitato. Questa
 * prova dimostra che pagina e API non dipendono dal database, non che il middleware
 * non lo tocchi in produzione.
 *
 *   npx next build && node tools/check-invito-pubblico-http.mjs
 *
 * Il log va in .next/check-invito-pubblico-http.log (cartella ignorata da git)
 * oppure nel percorso dato con --log=<file>.
 *
 * Nota sul codice nel markup: in una rotta dinamica il framework ripete
 * l'indirizzo richiesto dentro i blocchi <script> del payload di navigazione.
 * Non e' un dato letto dal server (e' l'indirizzo che il visitatore ha appena
 * scritto), ma il confronto lo dichiara: le risposte si confrontano dopo aver
 * sostituito il codice con un segnaposto, e il codice deve comparire SOLO
 * dentro i <script>, mai nel testo visibile, negli attributi o nei metadati.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOG_ARG = process.argv.find((a) => a.startsWith("--log="));
const LOG =
  LOG_ARG?.slice("--log=".length) ??
  path.resolve(RADICE, ".next", "check-invito-pubblico-http.log");

const FRASE_IT =
  "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non è stata annunciata una data di rilascio.";
const FRASE_EN =
  "Family Mesh is in development and is not yet available. No release date has been announced.";

const LINGUE = ["it", "en", "es", "de", "ja"];
/** Codici sintetici: nessuno e' un codice reale (le Z non possono esistere). */
const CODICI = [
  "MESH-ZZZZ",
  "ZZZZ",
  "mesh-zzzz",
  "MESH-Z",
  "MESH-ZZZZ-ZZZZ",
  "MESH-%E2%82%AC",
  "MESH-" + "Z".repeat(3000),
  "q".repeat(300),
];

let errori = 0;
let controlli = 0;
mkdirSync(path.dirname(LOG), { recursive: true });
writeFileSync(LOG, `# Prova HTTP locale invito pubblico, ${new Date().toISOString()}\n`);
function scrivi(riga) {
  console.log(riga);
  appendFileSync(LOG, riga + "\n");
}
function ok(nome) {
  controlli += 1;
  scrivi(`  ok     ${nome}`);
}
function rosso(nome, dettaglio = "") {
  controlli += 1;
  errori += 1;
  scrivi(`  ROSSO  ${nome}${dettaglio ? ` | ${String(dettaglio).slice(0, 300)}` : ""}`);
}
function verifica(condizione, nome, dettaglio) {
  if (condizione) ok(nome);
  else rosso(nome, dettaglio);
}

function portaLibera() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function portaOccupata(porta) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port: porta, host: "127.0.0.1" });
    s.once("connect", () => {
      s.destroy();
      resolve(true);
    });
    s.once("error", () => resolve(false));
  });
}

const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

async function chiama(base, metodo, percorso) {
  const r = await fetch(base + percorso, { method: metodo, redirect: "manual" });
  const corpo = metodo === "HEAD" ? "" : await r.text();
  return {
    stato: r.status,
    corpo,
    intestazioni: {
      "cache-control": r.headers.get("cache-control"),
      "content-type": r.headers.get("content-type"),
      "x-robots-tag": r.headers.get("x-robots-tag"),
      location: r.headers.get("location"),
      allow: r.headers.get("allow"),
    },
  };
}

/** Segnaposto al posto del codice, nelle forme in cui il framework lo ripete. */
function senzaCodice(testo, codice) {
  let t = testo;
  for (const forma of new Set([codice, encodeURIComponent(codice), decodeSicuro(codice)])) {
    if (forma) t = t.split(forma).join("«CODICE»");
  }
  return t;
}
function decodeSicuro(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
function senzaScript(html) {
  return html.replace(/<script[\s\S]*?<\/script>/g, "");
}
function soloTesto(markup) {
  return markup
    .replace(/<[^>]*>/g, "|")
    .replace(/\|+/g, "|")
    .replace(/^\||\|$/g, "");
}
const entita = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

function testoAtteso(lingua) {
  if (lingua === "it") return `Mesh Famiglia|${FRASE_IT}`;
  if (lingua === "en") return `Family Mesh|${FRASE_EN}`;
  return `Mesh Famiglia|${FRASE_IT}|Family Mesh|${FRASE_EN}`;
}

async function provaPagine(base) {
  scrivi("\n== Pagina /{lingua}/famiglia/join/{codice} ==");
  for (const lingua of LINGUE) {
    const risposte = [];
    for (const codice of CODICI) {
      risposte.push([codice, await chiama(base, "GET", `/${lingua}/famiglia/join/${codice}`)]);
    }
    const [codiceRif, rif] = risposte[0];
    const etichetta = (c) => `${lingua} ${c.slice(0, 16)}${c.length > 16 ? `...(${c.length})` : ""}`;

    verifica(rif.stato === 200, `${lingua}: stato 200`, rif.stato);
    verifica(
      /no-store/.test(rif.intestazioni["cache-control"] ?? ""),
      `${lingua}: Cache-Control contiene no-store`,
      rif.intestazioni["cache-control"],
    );
    verifica(/text\/html/.test(rif.intestazioni["content-type"] ?? ""), `${lingua}: content-type html`, rif.intestazioni["content-type"]);

    for (const [codice, r] of risposte) {
      verifica(r.stato === rif.stato, `${etichetta(codice)}: stesso stato del riferimento`, `${r.stato} contro ${rif.stato}`);
      verifica(
        JSON.stringify(r.intestazioni) === JSON.stringify(rif.intestazioni),
        `${etichetta(codice)}: stesse intestazioni`,
        JSON.stringify(r.intestazioni),
      );
      // Documento senza i <script>: identico per ogni codice, senza eccezioni.
      verifica(
        senzaScript(r.corpo) === senzaScript(rif.corpo),
        `${etichetta(codice)}: stesso documento fuori dai <script>`,
        `lunghezze ${senzaScript(r.corpo).length} e ${senzaScript(rif.corpo).length}`,
      );
      // Corpo intero: identico a parte il codice ripetuto dal framework. Con codici
      // molto lunghi il framework cambia il modo di serializzare quel payload
      // (righe di testo separate), quindi il confronto integrale vale fino a 64 caratteri.
      if (codice.length <= 64) {
        verifica(
          senzaCodice(r.corpo, codice) === senzaCodice(rif.corpo, codiceRif),
          `${etichetta(codice)}: stesso corpo intero (a parte il codice ripetuto nei <script>)`,
          `lunghezze ${r.corpo.length} e ${rif.corpo.length}`,
        );
      }
      // Il codice compare solo dentro i <script>: mai nel testo, negli attributi, nei metadati.
      const visibile = senzaScript(r.corpo);
      const forme = [codice, encodeURIComponent(codice), decodeSicuro(codice)].filter((f) => f.length >= 4);
      verifica(
        forme.every((f) => !visibile.includes(f)),
        `${etichetta(codice)}: il codice non compare fuori dai <script>`,
      );
    }

    const corpo = rif.corpo;
    const main = corpo.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? "";
    verifica(soloTesto(main) === entita(testoAtteso(lingua)), `${lingua}: il testo della pagina e' esattamente la copy richiesta`, soloTesto(main));
    const sezioni = [...main.matchAll(/<section lang="([^"]*)">/g)].map((m) => m[1]);
    verifica(
      JSON.stringify(sezioni) === JSON.stringify(lingua === "it" ? ["it"] : lingua === "en" ? ["en"] : ["it", "en"]),
      `${lingua}: blocchi con lang corretto`,
      sezioni.join(","),
    );
    const senzaEn = main.replace(/<section lang="en">[\s\S]*?<\/section>/g, "");
    verifica(!/Family Mesh|in development|release date/i.test(senzaEn), `${lingua}: l'inglese vive solo in lang="en"`);
    const senzaIt = main.replace(/<section lang="it">[\s\S]*?<\/section>/g, "");
    verifica(!/Mesh Famiglia|in sviluppo|data di rilascio/i.test(senzaIt), `${lingua}: l'italiano vive solo in lang="it"`);

    const nudo = senzaScript(corpo);
    verifica(!/<a[\s>]|<button[\s>]|<form[\s>]/i.test(nudo), `${lingua}: nessun link, pulsante o modulo`);
    verifica(
      !/play\.google|apps\.apple|referrer=|invite=|invite%3D/i.test(senzaCodice(corpo, codiceRif)) && !/MESH-/.test(nudo),
      `${lingua}: nessun link store, referrer o codice fuori dai <script>`,
    );
    verifica(/<meta name="robots" content="noindex, nofollow"\/>/.test(corpo), `${lingua}: meta robots noindex, nofollow`);
    verifica(!/rel="canonical"|rel="alternate"/.test(nudo), `${lingua}: nessun canonical ne' alternate`);
    const titolo = corpo.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
    verifica(!/MESH-|ZZZZ/i.test(titolo) && !/unisciti|invit|join/i.test(titolo), `${lingua}: titolo neutro`, titolo);
  }

  scrivi("\n== Pagina: HEAD e metodi non di lettura ==");
  for (const lingua of ["it", "de"]) {
    const testa = await Promise.all(
      ["MESH-ZZZZ", "ZZZZ", "MESH-" + "Z".repeat(3000)].map((c) => chiama(base, "HEAD", `/${lingua}/famiglia/join/${c}`)),
    );
    verifica(testa.every((t) => t.stato === 200 && t.corpo === ""), `${lingua}: HEAD 200 senza corpo per ogni codice`, testa.map((t) => t.stato).join(","));
    verifica(
      testa.every((t) => JSON.stringify(t.intestazioni) === JSON.stringify(testa[0].intestazioni)),
      `${lingua}: HEAD con le stesse intestazioni per ogni codice`,
    );
    for (const metodo of ["POST", "PUT", "DELETE"]) {
      const r = await Promise.all(
        ["MESH-ZZZZ", "ZZZZ", "MESH-" + "Z".repeat(3000)].map((c) => chiama(base, metodo, `/${lingua}/famiglia/join/${c}`)),
      );
      // Una pagina di Next risponde a qualunque metodo come al GET: quello che conta
      // e' che la risposta non dipenda dal codice (stato e documento fuori dai <script>).
      verifica(
        r.every((x) => x.stato === r[0].stato && senzaScript(x.corpo) === senzaScript(r[0].corpo)),
        `${lingua}: ${metodo} risposta uniforme per ogni codice (stato ${r[0].stato})`,
        r.map((x) => x.stato).join(","),
      );
    }
  }

  scrivi("\n== Lingua non supportata ==");
  const xx = await chiama(base, "GET", "/xx/famiglia/join/MESH-ZZZZ");
  verifica(xx.stato === 404 || xx.stato === 307 || xx.stato === 308, "xx: 404 o redirect di lingua, mai la pagina", xx.stato);
  verifica(!xx.corpo.includes("Family Mesh"), "xx: nessun contenuto della pagina");
}

async function provaApi(base) {
  scrivi("\n== API /api/v1/invites/{codice}/preview ==");
  const percorsi = CODICI.map((c) => [c, `/api/v1/invites/${c}/preview`]);
  const get = [];
  for (const [c, p] of percorsi) get.push([c, await chiama(base, "GET", p)]);
  const [, rif] = get[0];
  verifica(rif.stato === 404, "GET: stato 404 costante", rif.stato);
  verifica(rif.corpo === '{"error":"not_available"}', "GET: corpo fisso", rif.corpo);
  verifica(rif.intestazioni["cache-control"] === "no-store", "GET: cache-control no-store", rif.intestazioni["cache-control"]);
  verifica(rif.intestazioni["x-robots-tag"] === "noindex", "GET: x-robots-tag noindex", rif.intestazioni["x-robots-tag"]);
  verifica(/application\/json/.test(rif.intestazioni["content-type"] ?? ""), "GET: content-type json", rif.intestazioni["content-type"]);
  for (const [c, r] of get) {
    const et = `${c.slice(0, 16)}${c.length > 16 ? `...(${c.length})` : ""}`;
    verifica(
      r.stato === rif.stato && r.corpo === rif.corpo && JSON.stringify(r.intestazioni) === JSON.stringify(rif.intestazioni),
      `GET ${et}: identica al riferimento (stato, corpo, intestazioni)`,
      `${r.stato} ${r.corpo.slice(0, 80)}`,
    );
  }
  const head = [];
  for (const [, p] of percorsi) head.push(await chiama(base, "HEAD", p));
  verifica(
    head.every((h) => h.stato === head[0].stato && h.corpo === "" && JSON.stringify(h.intestazioni) === JSON.stringify(head[0].intestazioni)),
    "HEAD: identica per ogni codice, senza corpo",
    head.map((h) => h.stato).join(","),
  );
  verifica(head[0].stato === rif.stato, "HEAD: stesso stato del GET", head[0].stato);
  for (const metodo of ["POST", "PUT", "DELETE", "PATCH"]) {
    const r = [];
    for (const [, p] of percorsi) r.push(await chiama(base, metodo, p));
    verifica(r.every((x) => x.stato === 405), `${metodo}: 405 per ogni codice`, r.map((x) => x.stato).join(","));
    verifica(r.every((x) => x.corpo === r[0].corpo && JSON.stringify(x.intestazioni) === JSON.stringify(r[0].intestazioni)), `${metodo}: risposta uniforme per ogni codice`);
  }
  verifica(get.every(([c, r]) => !r.corpo.includes(c) || c.length < 4), "il corpo non ripete mai il codice");
}

async function main() {
  scrivi(`radice: ${RADICE}`);
  if (!existsSync(path.join(RADICE, ".next", "BUILD_ID"))) {
    scrivi("ROSSO: manca .next/BUILD_ID. Esegui prima `npx next build`.");
    process.exit(2);
  }
  const porta = await portaLibera();
  scrivi(`porta libera scelta: ${porta}`);

  // Ambiente MINIMO: nessuna variabile di Supabase, di servizio o di terze parti.
  const ambiente = { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" };
  verifica(!Object.keys(ambiente).some((k) => /supabase|service_role|secret|token|key/i.test(k)), "ambiente del server senza variabili di Supabase ne' segreti");

  const server = spawn(process.execPath, [path.join(RADICE, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(porta), "-H", "127.0.0.1"], {
    cwd: RADICE,
    env: ambiente,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let uscitaServer = "";
  server.stdout.on("data", (d) => (uscitaServer += d));
  server.stderr.on("data", (d) => (uscitaServer += d));
  let fermato = false;
  const ferma = () =>
    new Promise((resolve) => {
      if (fermato || server.exitCode !== null) {
        fermato = true;
        resolve();
        return;
      }
      fermato = true;
      server.once("exit", () => resolve());
      server.kill("SIGTERM");
      setTimeout(() => server.kill("SIGKILL"), 4000).unref();
    });
  process.on("SIGINT", () => ferma().then(() => process.exit(130)));

  try {
    const base = `http://127.0.0.1:${porta}`;
    let pronto = false;
    for (let i = 0; i < 120 && !pronto; i++) {
      if (server.exitCode !== null) break;
      try {
        const r = await fetch(`${base}/api/v1/invites/MESH-ZZZZ/preview`, { redirect: "manual" });
        pronto = r.status > 0;
      } catch {
        await attendi(500);
      }
    }
    verifica(pronto, "server locale avviato", uscitaServer.slice(-300));
    if (pronto) {
      await provaPagine(base);
      await provaApi(base);
    }
    verifica(!/supabase|SUPABASE/.test(uscitaServer), "l'uscita del server non nomina Supabase (nessun tentativo di connessione)", uscitaServer.slice(-300));
  } finally {
    await ferma();
    await attendi(500);
    const ancora = await portaOccupata(porta);
    verifica(!ancora, `server fermato e porta ${porta} libera`);
  }

  scrivi(`\nControlli: ${controlli}, rossi: ${errori}`);
  scrivi(errori === 0 ? "ESITO: VERDE" : "ESITO: ROSSO");
  process.exit(errori === 0 ? 0 : 1);
}

main().catch((e) => {
  scrivi(`ERRORE: ${e?.stack ?? e}`);
  process.exit(1);
});
