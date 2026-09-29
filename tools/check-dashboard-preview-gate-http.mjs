#!/usr/bin/env node
/**
 * Prova HTTP DIRETTA del cancello del prototipo della dashboard web.
 *
 * I test unitari (gate.test.ts, flag.test.ts) provano la funzione. Questa prova
 * avvia server Next VERI e fa richieste HTTP vere, perche' il cancello deve
 * reggere anche dove i test non arrivano: prerender a build time, middleware,
 * intestazioni, corpo dei 404.
 *
 * Prerequisito: un build gia' fatto (`npx next build`). Nessuna dipendenza nuova.
 *
 *   node tools/check-dashboard-preview-gate-http.mjs
 *
 * Cosa fa, in ordine:
 *   A) `next start` su una porta libera, per ogni combinazione di ambiente. Con
 *      WEB_DASHBOARD_PROTOTYPE=1 e FITMESH_WEB_DASHBOARD=1 ENTRAMBE accese:
 *      VERCEL_ENV=production, preview, development, un valore sconosciuto, e
 *      assente. Ogni percorso dell'anteprima deve rispondere 404.
 *      ATTENZIONE: `next start` gira sempre con NODE_ENV=production, quindi il
 *      cancello si chiude DA SOLO per il ramo NODE_ENV: questi casi provano il
 *      ramo NODE_ENV (e `notFound()` in pagina e layout), NON il ramo VERCEL_ENV
 *      ne' il ramo del flag. Lo dice anche il registro.
 *      Casi in piu': tutto spento, e solo il flag dell'anteprima acceso.
 *   B) `next dev` (NODE_ENV=development), dove NODE_ENV non chiude: l'unico modo
 *      di provare con un server vero gli altri due rami del cancello.
 *      - CONTROLLO POSITIVO: flag dell'anteprima acceso e VERCEL_ENV assente: 200.
 *        Prova che la prova negativa non e' cieca e fornisce il testo sintetico.
 *      - flag acceso con VERCEL_ENV=preview, production, development e un valore
 *        sconosciuto: 404 (ramo VERCEL_ENV: se il cancello smette di chiudere per
 *        uno di questi valori, il caso corrispondente diventa rosso);
 *      - flag SPENTO con VERCEL_ENV vuoto: 404 (ramo del flag).
 *   C) Il contenuto di ogni 404 non deve avere frasi dell'anteprima ne' dati
 *      sintetici, ne' nel testo visibile ne' nel corpo GREZZO (payload RSC
 *      compreso), e nessuna intestazione deve portarne.
 *   D) Ferma ogni server e verifica che le porte siano libere.
 *
 * La dashboard REALE (/app/dashboard) qui NON e' osservabile: senza sessione il
 * middleware risponde 307 verso il login prima che la pagina decida. Quel 307 non
 * e' contato come «conforme»: e' registrato come «non osservabile senza sessione»
 * e la prova dell'interruttore spento e' quella di pagina
 * (app/(frontend)/[locale]/app/dashboard/page.test.tsx).
 *
 * Nota: `next dev` riscrive `.next`, quindi dopo questa prova il build va rifatto
 * prima di rilanciarla. Le variabili Supabase sono FINTE e puntano a una porta
 * locale chiusa: il middleware dei percorsi /app le vuole, e cosi' nessuna
 * richiesta esce dalla macchina. Nessun segreto.
 *
 * Uscita 0 solo se tutto e' verde. Se un server non parte, l'errore e' riportato
 * cosi' com'e' e l'uscita e' diversa da 0: mai verde per un avvio fallito.
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEXT_BIN = path.join(RADICE, 'node_modules', 'next', 'dist', 'bin', 'next');

const SOLO_START = process.argv.includes('--solo-start');
const SOLO_DEV = process.argv.includes('--solo-dev');

const SCREENS = ['overview', 'activity', 'sleep', 'heart', 'workouts', 'trends', 'sources'];
const LOCALES = ['it', 'en'];
const QUERY = '?as=pro&state=ok&chrome=none&day=2026-09-24&range=30';

/** Frasi che non devono mai comparire fuori dal cancello aperto. */
const FRASI_VIETATE = [
  'Anteprima interna',
  'Prototipo interno',
  'Internal preview',
  'Internal prototype',
  'dati sintetici',
  'synthetic data',
  'Synthetic data',
];
/**
 * Etichette delle schermate (it, en). Si cercano come TESTO VISIBILE INTERO (un
 * nodo di testo uguale all'etichetta), non come sottostringa del corpo: la
 * cornice del sito ha una descrizione che nomina «Galaxy Watch» e un elenco di
 * funzioni con «Sonno» e «Trend», e non sono dati dell'anteprima.
 */
const ETICHETTE_SCHERMATE = [
  'Panoramica',
  'Passi e attività',
  'Passi e attivita',
  'Steps and activity',
  'Sonno',
  'Cuore',
  'Allenamenti',
  'Trend',
  'Sorgenti dei dati',
  'Data sources',
  'Ultimo dato ricevuto',
  'Last data received',
  'Durata degli allenamenti',
  'Workout duration',
];

const DUMMY_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'chiave-finta-non-e-un-segreto',
  NEXT_PUBLIC_APP_URL: 'http://localhost',
  NEXT_TELEMETRY_DISABLED: '1',
};

let uscita = 0;
let verdi = 0;
let rossi = 0;
const ok = (m) => {
  verdi += 1;
  console.log(`  ok     ${m}`);
};
const rosso = (m) => {
  rossi += 1;
  uscita = 1;
  console.log(`  ROSSO  ${m}`);
};
const info = (m) => console.log(`  ..     ${m}`);
const titolo = (m) => console.log(`\n== ${m}`);

// ── porte, processi ────────────────────────────────────────────────────────
const porteUsate = [];
const figli = [];

function portaLibera() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function connetti(port) {
  return new Promise((resolve) => {
    const c = net.connect({ port, host: '127.0.0.1' });
    const fine = (v) => {
      c.destroy();
      resolve(v);
    };
    c.once('connect', () => fine(true));
    c.once('error', () => fine(false));
    c.setTimeout(1500, () => fine(false));
  });
}

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

function ambiente(extra) {
  // Parte da un ambiente PULITO rispetto alle variabili che il cancello legge:
  // niente eredita dalla shell.
  const base = { ...process.env };
  for (const k of ['VERCEL_ENV', 'WEB_DASHBOARD_PROTOTYPE', 'FITMESH_WEB_DASHBOARD', 'NODE_ENV', 'CI']) delete base[k];
  return { ...base, ...DUMMY_ENV, ...extra };
}

async function avvia(modo, extraEnv, attesaMs) {
  const port = await portaLibera();
  porteUsate.push(port);
  const args = [NEXT_BIN, modo, '-p', String(port), '-H', '127.0.0.1'];
  const figlio = spawn(process.execPath, args, {
    cwd: RADICE,
    env: ambiente(extraEnv),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  figli.push(figlio);
  let log = '';
  figlio.stdout.on('data', (d) => (log += d));
  figlio.stderr.on('data', (d) => (log += d));
  let morto = null;
  figlio.once('exit', (code, sig) => {
    morto = `codice ${code} segnale ${sig}`;
  });

  const limite = Date.now() + attesaMs;
  while (Date.now() < limite) {
    if (morto) throw new Error(`next ${modo} e' uscito prima di rispondere (${morto}). Ultimo output:\n${log.slice(-2000)}`);
    if (await connetti(port)) return { port, figlio, log: () => log };
    await dorme(400);
  }
  throw new Error(`next ${modo} non ha aperto la porta ${port} entro ${attesaMs} ms. Ultimo output:\n${log.slice(-2000)}`);
}

async function ferma(srv) {
  const { figlio, port } = srv;
  if (figlio.exitCode === null && figlio.signalCode === null) {
    try {
      process.kill(-figlio.pid, 'SIGTERM');
    } catch {}
    const limite = Date.now() + 8000;
    while (Date.now() < limite && figlio.exitCode === null && figlio.signalCode === null) await dorme(150);
    if (figlio.exitCode === null && figlio.signalCode === null) {
      try {
        process.kill(-figlio.pid, 'SIGKILL');
      } catch {}
      await dorme(500);
    }
  }
  // il gruppo intero deve essere sparito
  let gruppoVivo = true;
  for (let i = 0; i < 20 && gruppoVivo; i += 1) {
    try {
      process.kill(-figlio.pid, 0);
      await dorme(150);
    } catch {
      gruppoVivo = false;
    }
  }
  if (gruppoVivo) {
    try {
      process.kill(-figlio.pid, 'SIGKILL');
    } catch {}
  }
  const ancoraAperta = await connetti(port);
  if (ancoraAperta || gruppoVivo) rosso(`la porta ${port} o il gruppo di processi ${figlio.pid} risulta ancora vivo dopo lo stop`);
}

async function fermaTutti(server) {
  for (const s of server) await ferma(s);
}

// ── richieste e analisi del corpo ─────────────────────────────────────────
async function get(port, percorso) {
  const res = await fetch(`http://127.0.0.1:${port}${percorso}`, {
    redirect: 'manual',
    headers: { 'accept-language': 'it', 'user-agent': 'check-gate-http/1' },
    signal: AbortSignal.timeout(120_000),
  });
  const corpo = await res.text();
  const intestazioni = {};
  res.headers.forEach((v, k) => {
    intestazioni[k] = v;
  });
  return { stato: res.status, corpo, intestazioni };
}

/** Testo visibile: i nodi di testo fuori da script e style. */
function nodiDiTesto(html) {
  const pulito = html.replace(/<script[\s\S]*?<\/script>/gi, '<').replace(/<style[\s\S]*?<\/style>/gi, '<');
  const out = new Set();
  for (const m of pulito.matchAll(/>([^<>]+)</g)) {
    const t = m[1].replace(/\s+/g, ' ').trim();
    if (t.length >= 3) out.add(t);
  }
  return out;
}

function percorsiAnteprima() {
  const lista = [];
  for (const lc of LOCALES) {
    lista.push(`/${lc}/dashboard-preview`);
    lista.push(`/${lc}/dashboard-preview${QUERY}`);
    for (const s of SCREENS) {
      lista.push(`/${lc}/dashboard-preview/${s}`);
      lista.push(`/${lc}/dashboard-preview/${s}${QUERY}`);
    }
  }
  return lista;
}

function percorsiReali() {
  return LOCALES.flatMap((lc) => [`/${lc}/app/dashboard`, `/${lc}/app/dashboard${QUERY}`]);
}

/** Il corpo grezzo (HTML + payload RSC dentro gli <script>) con le sequenze di escape sciolte, in minuscolo. */
function corpoGrezzoNormalizzato(corpo) {
  return corpo
    .replace(/\\u([0-9a-fA-F]{4})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\(["'\\\/])/g, '$1')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// Raccolta per il controllo differenziale: corpi dei 404 (start e dev) e baseline.
const nonOsservabili = []; // richieste alla dashboard reale che il middleware manda al login
const corpi404 = []; // { caso, percorso, stato, corpo, intestazioni }
const baselineTesti = new Set();
const baselineCorpi = [];

/**
 * Dei 404 qualunque dello stesso server: sono il rumore della cornice del sito, da togliere dai marcatori.
 * Un percorso che non esiste in nessuna rotta ha un 404 spoglio; un segmento sconosciuto di una rotta REALE
 * del sito (blog, sync) e' un 404 che passa dal layout di lingua, come quello dell'anteprima chiusa, e porta
 * gli stessi metadati del sito (titolo e descrizione che nominano «Galaxy Watch», per esempio).
 */
const PERCORSI_BASELINE = (lc) => [`/${lc}/percorso-che-non-esiste-xyz`, `/${lc}/blog/articolo-che-non-esiste-xyz`, `/${lc}/sync/provider-che-non-esiste-xyz`];
async function raccogliBaseline(port) {
  for (const lc of LOCALES) {
    for (const percorso of PERCORSI_BASELINE(lc)) {
      const b = await get(port, percorso);
      baselineCorpi.push(b.corpo);
      for (const t of nodiDiTesto(b.corpo)) baselineTesti.add(t);
      if (b.stato !== 404) info(`baseline ${percorso}: stato ${b.stato}`);
    }
  }
}

async function provaCaso(nome, extraEnv, { attesi, percorsi }) {
  titolo(`next start: ${nome}`);
  let srv;
  try {
    srv = await avvia('start', extraEnv, 90_000);
  } catch (e) {
    rosso(`${nome}: avvio fallito. ${e.message}`);
    return;
  }
  try {
    info(`porta ${srv.port}, env: ${JSON.stringify(extraEnv)}`);
    info('next start ha NODE_ENV=production: il cancello si chiude per il ramo NODE_ENV, questo caso NON prova il ramo VERCEL_ENV ne\' il ramo del flag');
    await raccogliBaseline(srv.port);
    let contatore = 0;
    let conformi = 0;
    let nonOss = 0;
    for (const percorso of percorsi) {
      const r = await get(srv.port, percorso);
      contatore += 1;
      const atteso = attesi(percorso);
      const reale = /\/app\/dashboard(\?|$)/.test(percorso);
      const loginRedirect = r.stato === 307 && /\/[a-z]{2}\/auth\/login\?/.test(r.intestazioni.location ?? '');
      if (reale && loginRedirect) {
        // Il middleware manda al login ogni richiesta senza sessione a /app/*, PRIMA che la pagina
        // decida: il 404 della pagina reale non e' osservabile da fuori. NON e' «conforme».
        nonOsservabili.push(`${nome} ${percorso}`);
        nonOss += 1;
        corpi404.push({ caso: nome, percorso, stato: 307, corpo: r.corpo, intestazioni: r.intestazioni });
        continue;
      }
      if (r.stato === atteso.stato) conformi += 1;
      else {
        const loc = r.intestazioni.location ? ` location=${r.intestazioni.location}` : '';
        rosso(`${nome} ${percorso}: stato ${r.stato}, atteso ${atteso.stato}${loc}`);
      }
      if (r.stato === 404 && atteso.stato === 404) {
        corpi404.push({ caso: nome, percorso, stato: 404, corpo: r.corpo, intestazioni: r.intestazioni });
      }
    }
    if (conformi + nonOss === contatore && conformi > 0) {
      ok(`${nome}: ${conformi} richieste con lo stato atteso${nonOss ? `, ${nonOss} non osservabili senza sessione (dashboard reale, 307 verso il login)` : ''}`);
    } else info(`${contatore} richieste fatte, ${conformi} con lo stato atteso, ${nonOss} non osservabili`);
  } catch (e) {
    rosso(`${nome}: richiesta fallita. ${e.message}`);
  } finally {
    await ferma(srv);
  }
}

/** `next dev` con un ambiente dato: ogni percorso dato deve rispondere 404, e il corpo entra nel controllo dei contenuti. */
async function provaDev404(nome, extraEnv, percorsi) {
  titolo(`next dev: ${nome}`);
  let srv;
  try {
    if (SOLO_START) throw new Error('SALTATO con --solo-start');
    srv = await avvia('dev', { NODE_ENV: 'development', ...extraEnv }, 120_000);
    info(`porta ${srv.port}, env: ${JSON.stringify({ NODE_ENV: 'development', ...extraEnv })}`);
    await raccogliBaseline(srv.port);
    for (const p of percorsi) {
      const x = await get(srv.port, p);
      if (x.stato === 404) ok(`${p} risponde 404 (${nome})`);
      else rosso(`${p}: stato ${x.stato}, atteso 404 (${nome})`);
      if (x.stato === 404) corpi404.push({ caso: `dev ${nome}`, percorso: p, stato: 404, corpo: x.corpo, intestazioni: x.intestazioni });
    }
  } catch (e) {
    if (e.message.startsWith('SALTATO')) info(e.message);
    else rosso(`next dev (${nome}): avvio o richiesta fallita. ${e.message}`);
  } finally {
    if (srv) await ferma(srv);
  }
}

// ── main ──────────────────────────────────────────────────────────────────
const inizio = Date.now();
console.log(`Prova HTTP del cancello del prototipo, ${new Date().toISOString()}`);
console.log(`Radice: ${RADICE}`);
console.log(`Node ${process.version}`);

const ANTEPRIMA = percorsiAnteprima();
const REALI = percorsiReali();
const TUTTI = [...ANTEPRIMA, ...REALI];
const tutti404 = () => ({ stato: 404 });

const ENTRAMBI = { WEB_DASHBOARD_PROTOTYPE: '1', FITMESH_WEB_DASHBOARD: '1' };

const casi = [
  ['VERCEL_ENV=production, flag accesi', { ...ENTRAMBI, VERCEL_ENV: 'production' }],
  ['VERCEL_ENV=preview, flag accesi', { ...ENTRAMBI, VERCEL_ENV: 'preview' }],
  ['VERCEL_ENV=development, flag accesi', { ...ENTRAMBI, VERCEL_ENV: 'development' }],
  ['VERCEL_ENV sconosciuto, flag accesi', { ...ENTRAMBI, VERCEL_ENV: 'valore-sconosciuto' }],
  ['senza VERCEL_ENV (NODE_ENV production di next start), flag accesi', { ...ENTRAMBI }],
];

// Caso in piu' 1: tutto spento. Anteprima e reale devono essere 404.
// Caso in piu' 2: solo il flag dell'anteprima, reale spenta.
const casiInPiu = [
  ['EXTRA senza nessun flag', {}],
  ['EXTRA solo WEB_DASHBOARD_PROTOTYPE=1, senza VERCEL_ENV', { WEB_DASHBOARD_PROTOTYPE: '1' }],
];

if (!SOLO_DEV) {
  console.log('\nNota: con `next start` NODE_ENV=production chiude il cancello da solo, quindi i casi qui sotto provano il ramo NODE_ENV.');
  console.log('Il ramo VERCEL_ENV e il ramo del flag si provano con `next dev` (sezione successiva).');
}
for (const [nome, env] of SOLO_DEV ? [] : [...casi, ...casiInPiu]) {
  await provaCaso(nome, env, { attesi: tutti404, percorsi: TUTTI });
}

// ── B) controllo positivo e casi negativi con next dev ────────────────────
const positivi = []; // corpi 200
titolo('next dev: CONTROLLO POSITIVO (WEB_DASHBOARD_PROTOTYPE=1, senza VERCEL_ENV, NODE_ENV=development)');
let dev;
try {
  if (SOLO_START) throw new Error('SALTATO con --solo-start');
  dev = await avvia('dev', { WEB_DASHBOARD_PROTOTYPE: '1', NODE_ENV: 'development' }, 120_000);
  info(`porta ${dev.port}`);
  const r = await get(dev.port, '/it/dashboard-preview/overview');
  if (r.stato === 200) ok('/it/dashboard-preview/overview risponde 200');
  else rosso(`/it/dashboard-preview/overview: stato ${r.stato}, atteso 200 (il controllo positivo non apre: la prova negativa e' cieca)`);
  if (r.stato === 200) {
    positivi.push(r.corpo);
    if (/Anteprima interna|Prototipo interno/.test(r.corpo)) ok('la pagina aperta porta davvero le frasi dell\'anteprima (le frasi vietate sono cercabili)');
    else info('la pagina aperta non contiene «Anteprima interna» o «Prototipo interno» nel corpo (solo nei metadati)');
  }
  // Altre schermate e lingua: verificate, ma il minimo richiesto e' la panoramica.
  for (const [p, atteso] of [
    ['/en/dashboard-preview/overview', 200],
    ['/it/dashboard-preview', 307],
    ...SCREENS.filter((s) => s !== 'overview').map((s) => [`/it/dashboard-preview/${s}`, 200]),
    [`/it/dashboard-preview/overview${QUERY}`, 200],
  ]) {
    const x = await get(dev.port, p);
    if (x.stato === atteso) ok(`${p} risponde ${atteso}`);
    else rosso(`${p}: stato ${x.stato}, atteso ${atteso}`);
    if (x.stato === 200) positivi.push(x.corpo);
    if (p === '/it/dashboard-preview' && x.stato === 307) {
      const loc = x.intestazioni.location ?? '';
      if (/\/it\/dashboard-preview\/overview$/.test(loc)) ok(`redirect dell'indice verso ${loc}`);
      else rosso(`redirect dell'indice verso un posto inatteso: ${loc}`);
    }
  }
  await raccogliBaseline(dev.port);
} catch (e) {
  if (e.message.startsWith('SALTATO')) info(e.message);
  else rosso(`controllo positivo (next dev): avvio o richiesta fallita. ${e.message}`);
} finally {
  if (dev) await ferma(dev);
}

// Con NODE_ENV=development il ramo NODE_ENV non chiude: ogni 404 qui viene dal ramo VERCEL_ENV o dal ramo del flag.
const PERCORSI_DEV = ['/it/dashboard-preview/overview', '/en/dashboard-preview/overview', '/it/dashboard-preview', `/it/dashboard-preview/sources${QUERY}`];
const casiDev = [
  ['flag acceso, VERCEL_ENV=preview (ramo VERCEL_ENV)', { WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'preview' }],
  ['flag acceso, VERCEL_ENV=production (ramo VERCEL_ENV)', { WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'production' }],
  ['flag acceso, VERCEL_ENV=development (ramo VERCEL_ENV)', { WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'development' }],
  ['flag acceso, VERCEL_ENV sconosciuto (ramo VERCEL_ENV)', { WEB_DASHBOARD_PROTOTYPE: '1', VERCEL_ENV: 'valore-sconosciuto' }],
  ['flag SPENTO, VERCEL_ENV vuoto (ramo del flag)', { VERCEL_ENV: '' }],
];
for (const [nome, env] of casiDev) await provaDev404(nome, env, PERCORSI_DEV);

// ── C) controllo del contenuto dei 404 ────────────────────────────────────
titolo('contenuto dei 404: nessuna frase dell\'anteprima, nessun dato sintetico (testo e corpo grezzo), nessun dato nelle intestazioni');
const baselineTutto = baselineCorpi.join('\n').toLowerCase();
const baselineGrezzo = baselineCorpi.map(corpoGrezzoNormalizzato).join('\n');
const etichetteEffettive = ETICHETTE_SCHERMATE.filter((e) => !baselineTutto.includes(e.toLowerCase()));
const etichetteEscluse = ETICHETTE_SCHERMATE.filter((e) => baselineTutto.includes(e.toLowerCase()));
if (etichetteEscluse.length) info(`etichette gia' presenti in un 404 qualunque (rumore della cornice), non usate: ${etichetteEscluse.join(' | ')}`);

const testiPositivi = new Set();
for (const c of positivi) for (const t of nodiDiTesto(c)) testiPositivi.add(t);
const marcatori = [...testiPositivi].filter((t) => !baselineTesti.has(t));
// Nel corpo grezzo si cercano i marcatori LUNGHI (i brevi combacerebbero per caso dentro nomi di file e script), togliendo quelli
// che compaiono gia' in un 404 qualunque (cornice, metadati).
const marcatoriGrezzi = marcatori.filter((m) => m.length >= 8 && !baselineGrezzo.includes(m.replace(/\s+/g, ' ').toLowerCase()));
info(`testo sintetico ricavato dal controllo positivo: ${testiPositivi.size} nodi di testo, ${marcatori.length} distintivi (assenti da un 404 qualunque), ${marcatoriGrezzi.length} cercati anche nel corpo grezzo`);
if (SOLO_START) info('--solo-start: controllo differenziale sui dati sintetici NON eseguito (serve il controllo positivo)');
else if (positivi.length === 0) rosso('nessun corpo positivo disponibile: il controllo differenziale sui dati sintetici NON e\' stato eseguito');
else if (marcatori.length < 20) rosso(`troppo pochi marcatori distintivi (${marcatori.length}): il controllo differenziale non e' affidabile`);
else if (marcatoriGrezzi.length < 20) rosso(`troppo pochi marcatori per il corpo grezzo (${marcatoriGrezzi.length}): il controllo sul payload RSC non e' affidabile`);

let perdite = 0;
const etichetteMin = new Set(etichetteEffettive.map((e) => e.toLowerCase()));
const HEADER_IGNORATI = new Set(['date']);
for (const c of corpi404) {
  const bassoCorpo = c.corpo.toLowerCase();
  for (const f of FRASI_VIETATE) {
    const i = bassoCorpo.indexOf(f.toLowerCase());
    if (i >= 0) {
      perdite += 1;
      rosso(`${c.caso} ${c.percorso}: il corpo contiene «${f}» (...${c.corpo.slice(Math.max(0, i - 50), i + 50).replace(/\s+/g, ' ')}...)`);
    }
  }
  const testi = nodiDiTesto(c.corpo);
  for (const t of testi) {
    if (etichetteMin.has(t.toLowerCase())) {
      perdite += 1;
      rosso(`${c.caso} ${c.percorso}: il corpo mostra l'etichetta di schermata «${t}»`);
    }
  }
  const trovati = marcatori.filter((m) => testi.has(m));
  if (trovati.length) {
    perdite += 1;
    rosso(`${c.caso} ${c.percorso}: il corpo contiene ${trovati.length} testi dell'anteprima aperta, per esempio «${trovati.slice(0, 3).join('» «')}»`);
  }
  // Corpo grezzo: anche cio' che sta solo nel payload RSC (self.__next_f) e non in un nodo di testo.
  const grezzo = corpoGrezzoNormalizzato(c.corpo);
  const trovatiGrezzi = marcatoriGrezzi.filter((m) => grezzo.includes(m.replace(/\s+/g, ' ').toLowerCase()));
  if (trovatiGrezzi.length) {
    perdite += 1;
    rosso(`${c.caso} ${c.percorso}: il corpo GREZZO (payload RSC compreso) contiene ${trovatiGrezzi.length} testi dell'anteprima aperta, per esempio «${trovatiGrezzi.slice(0, 3).join('» «')}»`);
  }
  // Intestazioni: nessun valore deve portare frasi, etichette intere o testi dell'anteprima.
  for (const [k, v] of Object.entries(c.intestazioni)) {
    if (HEADER_IGNORATI.has(k)) continue;
    const val = String(v).toLowerCase();
    const colpito = FRASI_VIETATE.find((f) => val.includes(f.toLowerCase())) ?? [...etichetteMin].find((e) => val === e);
    const colpitoM = marcatori.find((m) => m.length >= 8 && val.includes(m.toLowerCase()));
    if (colpito || colpitoM) {
      perdite += 1;
      rosso(`${c.caso} ${c.percorso}: l'intestazione ${k} porta «${colpito ?? colpitoM}»`);
    }
  }
}
const n404 = corpi404.filter((c) => c.stato === 404).length;
const n307 = corpi404.filter((c) => c.stato === 307).length;
if (perdite === 0 && corpi404.length > 0) ok(`${n404} risposte 404 e ${n307} risposte 307 esaminate, corpo (testo e grezzo) e intestazioni puliti`);
if (corpi404.length === 0) rosso('nessun 404 raccolto da esaminare');

// Nomi delle intestazioni del primo 404, per il registro.
if (corpi404[0]) info(`intestazioni del primo 404 (${corpi404[0].percorso}): ${Object.keys(corpi404[0].intestazioni).sort().join(', ')}`);

// ── D) porte libere, nessun processo residuo ──────────────────────────────
titolo('porte libere e nessun processo residuo');
await dorme(500);
for (const p of porteUsate) {
  if (await connetti(p)) rosso(`la porta ${p} risponde ancora`);
}
info(`${porteUsate.length} porte usate: ${porteUsate.join(', ')}`);
let residui = '';
try {
  residui = execFileSync('pgrep', ['-fl', `${NEXT_BIN}`], { encoding: 'utf8' }).trim();
} catch {
  residui = '';
}
try {
  const lsof = execFileSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { encoding: 'utf8' });
  const vive = porteUsate.filter((p) => lsof.includes(`:${p} (LISTEN)`));
  if (vive.length) rosso(`lsof: porte ancora in ascolto ${vive.join(', ')}`);
  else ok('lsof: nessuna delle porte usate e\' in ascolto');
} catch {
  info('lsof non disponibile o senza output: la verifica delle porte resta quella per connessione');
}
if (residui) rosso(`processi next residui:\n${residui}`);
else ok('nessun processo next residuo (pgrep sul binario usato)');

// ── dashboard reale: non osservabile da fuori ─────────────────────────────
titolo('Dashboard reale (/app/dashboard): NON OSSERVABILE senza sessione');
if (nonOsservabili.length === 0) info('nessuna richiesta alla dashboard reale ha risposto 307 verso il login');
else {
  info(`${nonOsservabili.length} richieste alla dashboard reale non osservabili senza sessione: rispondono 307 verso /auth/login, NON sono contate come conformi.`);
  info('Motivo: il middleware manda al login ogni richiesta senza sessione a /app/* PRIMA che la pagina decida, quindi il 404 di dashboardWebAttiva() non si vede da fuori.');
  info('Il corpo del 307 non contiene frasi o dati dell\'anteprima (controllato sopra).');
}
// La prova dell'interruttore spento della pagina reale e' un test di pagina: qui si controlla solo che esista.
const PAGE_TEST = path.join(RADICE, 'app', '(frontend)', '[locale]', 'app', 'dashboard', 'page.test.tsx');
try {
  const testo = readFileSync(PAGE_TEST, 'utf8');
  if (/interruttore spento/.test(testo) && /NEXT_NOT_FOUND/.test(testo) && /FITMESH_WEB_DASHBOARD/.test(testo)) {
    info('interruttore spento della pagina reale: provato da page.test.tsx (404 con la variabile assente, 0, true, yes, con spazi), non da questa prova HTTP');
  } else {
    rosso('page.test.tsx non contiene piu\' la prova dell\'interruttore spento (404): la dashboard reale non ha nessuna prova del cancello');
  }
} catch (e) {
  rosso(`page.test.tsx illeggibile: ${e.message}`);
}

const esito = uscita !== 0 ? 'ROSSO' : nonOsservabili.length ? 'VERDE PER L\'ANTEPRIMA; DASHBOARD REALE NON OSSERVABILE SENZA SESSIONE (prova di pagina: page.test.tsx)' : 'VERDE';
titolo(`Esito: ${esito}  (${verdi} controlli ok, ${rossi} rossi, ${nonOsservabili.length} richieste non osservabili, ${Math.round((Date.now() - inizio) / 1000)} s)`);
// 0 = nessun rosso; 1 = almeno un rosso. Le richieste non osservabili non sono un rosso: la loro prova sta nel test di pagina.
process.exit(uscita !== 0 ? 1 : 0);
