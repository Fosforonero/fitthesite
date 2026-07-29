/**
 * Sprint P0.10 — guardrail "founder:backend-check".
 *
 * Verifica STATICA (analisi testuale delle migration, non esecuzione SQL —
 * per una verifica comportamentale reale vedi la suite eseguita su Postgres
 * disposable, riportata nel report P0.10) che la funzione EFFETTIVAMENTE
 * chiamata da record_first_sync_transition ad ogni sync:
 *
 *  1. confronti auth.users.created_at con un cutoff (mai un timestamp
 *     inviato dal client);
 *  2. applichi una finestra di 14 giorni dalla registrazione alla prima
 *     sync riuscita;
 *  3. escluda review@fitmesh.fit, appreview.demo@fitmesh.fit e .invalid
 *     dal consumo di posti;
 *  4. usi un lock atomico (pg_advisory_xact_lock) prima di contare/inserire,
 *     con un ricontrollo "già pro" DOPO il lock;
 *  5. non revochi/sovrascriva mai un ruolo 'pro' già esistente (il fast-path
 *     "già pro" deve precedere qualunque valutazione di cutoff/finestra);
 *  6. sia effettivamente la funzione chiamata da record_first_sync_transition
 *     (stesso nome, stessa migration o migration successiva che la
 *     ridefinisce — mai un secondo motore di grant parallelo).
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(repoRoot, "supabase/migrations");
const errors: string[] = [];

let migrationFiles: string[] = [];
try {
  migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
} catch {
  errors.push("Cartella mancante: supabase/migrations non trovata.");
}

const GRANT_FN = "private.grant_founder_launch_core";
const TRANSITION_FN = "public.record_first_sync_transition";

/**
 * Rimuove i commenti SQL `-- ...` prima dei controlli di ORDINE (quale
 * check viene prima nel codice REALE): senza questo, un commento che
 * SPIEGA la regola in prosa (es. "auth.users.created_at >= FOUNDER_END_AT")
 * farebbe scattare un match prima ancora del codice vero, falsando l'ordine
 * rilevato. I controlli di sola PRESENZA (es. "esiste 'review@fitmesh.fit'
 * da qualche parte") restano volutamente sul testo originale: un'esclusione
 * documentata in un commento ma assente dal codice e' comunque un segnale
 * utile, non un falso positivo.
 */
function stripSqlComments(sql: string): string {
  return sql.replace(/--.*$/gm, "");
}

const grantDefiningFiles = migrationFiles.filter((f) => {
  const c = fs.readFileSync(path.join(migrationsDir, f), "utf8");
  return new RegExp(`create\\s+or\\s+replace\\s+function\\s+${GRANT_FN.replace(".", "\\.")}`, "i").test(c);
});
const transitionDefiningFiles = migrationFiles.filter((f) => {
  const c = fs.readFileSync(path.join(migrationsDir, f), "utf8");
  return new RegExp(`create\\s+or\\s+replace\\s+function\\s+${TRANSITION_FN.replace(".", "\\.")}`, "i").test(c);
});

if (grantDefiningFiles.length === 0) {
  errors.push(`Nessuna migration definisce ${GRANT_FN} — nessuna funzione di grant trovata.`);
}
if (transitionDefiningFiles.length === 0) {
  errors.push(`Nessuna migration definisce ${TRANSITION_FN}.`);
}

if (grantDefiningFiles.length > 0 && transitionDefiningFiles.length > 0) {
  const latestGrantFile = grantDefiningFiles[grantDefiningFiles.length - 1];
  const latestTransitionFile = transitionDefiningFiles[transitionDefiningFiles.length - 1];
  const grantSql = fs.readFileSync(path.join(migrationsDir, latestGrantFile), "utf8");
  const transitionSql = fs.readFileSync(path.join(migrationsDir, latestTransitionFile), "utf8");

  // ── 6: record_first_sync_transition chiama davvero grant_founder_launch_core
  if (!new RegExp(GRANT_FN.replace(".", "\\.")).test(transitionSql)) {
    errors.push(
      `${latestTransitionFile}: ${TRANSITION_FN} non chiama ${GRANT_FN} — il percorso reale del grant Founder e' scollegato dalla funzione verificata da questo guardrail.`,
    );
  }

  // ── 1: cutoff su auth.users.created_at, mai un parametro client
  if (!/auth\.users/i.test(grantSql) || !/created_at/i.test(grantSql)) {
    errors.push(`${latestGrantFile}: nessun riferimento a auth.users.created_at — l'eligibility non e' ancorata alla registrazione reale.`);
  }
  if (!/created_at\s*>=\s*\w+|>=\s*founder_cutoff/i.test(grantSql)) {
    errors.push(`${latestGrantFile}: nessun confronto \`>=\` tra created_at e un cutoff — cutoff assente o con boundary sbagliato (deve rifiutare una registrazione ESATTAMENTE al cutoff).`);
  }
  if (/p_created_at|p_registered_at|p_signup_at/i.test(grantSql)) {
    errors.push(`${latestGrantFile}: la funzione accetta un timestamp di registrazione come PARAMETRO — deve leggerlo sempre da auth.users, mai fidarsi del client.`);
  }

  // ── 2: finestra 14 giorni
  if (!/interval\s*'14\s*days?'/i.test(grantSql)) {
    errors.push(`${latestGrantFile}: nessuna finestra \`interval '14 days'\` trovata — la regola "prima sync entro 14gg dalla registrazione" non risulta implementata.`);
  }

  // ── 3: esclusioni App Review / .invalid
  for (const needle of ["review@fitmesh.fit", "appreview.demo@fitmesh.fit", ".invalid"]) {
    if (!grantSql.toLowerCase().includes(needle.toLowerCase())) {
      errors.push(`${latestGrantFile}: manca l'esclusione per "${needle}" — l'account potrebbe consumare un posto Founder.`);
    }
  }

  // ── 4: lock atomico + ricontrollo post-lock
  if (!/pg_advisory_xact_lock/i.test(grantSql)) {
    errors.push(`${latestGrantFile}: manca pg_advisory_xact_lock — il cap 1000 non e' protetto da race concorrenti.`);
  }
  const lockIndex = grantSql.search(/pg_advisory_xact_lock/i);
  const afterLock = lockIndex >= 0 ? grantSql.slice(lockIndex) : "";
  if (!/role\s*=\s*'pro'/i.test(afterLock)) {
    errors.push(`${latestGrantFile}: manca un ricontrollo "già pro" DOPO il lock — una race tra due chiamate concorrenti per lo stesso utente potrebbe superare il cap o duplicare il grant.`);
  }

  // ── 5: il fast-path "già pro" precede qualunque valutazione di cutoff/finestra
  // (sul codice con i commenti `--` rimossi: altrimenti la prosa esplicativa
  // in testa al file, che menziona il cutoff prima di descrivere l'ordine
  // reale dei controlli, falserebbe l'indice).
  const grantCodeOnly = stripSqlComments(grantSql);
  const firstProCheckIndex = grantCodeOnly.search(/role\s*=\s*'pro'/i);
  const cutoffCheckIndex = grantCodeOnly.search(/>=\s*founder_cutoff|created_at\s*>=/i);
  if (firstProCheckIndex === -1) {
    errors.push(`${latestGrantFile}: nessun controllo "già pro" trovato — i Founder esistenti e i ruoli pro da acquisto rischiano di essere rivalutati contro cutoff/finestra.`);
  } else if (cutoffCheckIndex !== -1 && firstProCheckIndex > cutoffCheckIndex) {
    errors.push(`${latestGrantFile}: il controllo cutoff precede il controllo "già pro" — un Founder esistente o un utente già pro da acquisto potrebbe essere valutato (e rifiutato) contro il cutoff prima di essere riconosciuto come già titolare di un ruolo pro.`);
  }

  // Nessuna revoca/UPDATE distruttivo su user_roles in questa funzione:
  // l'unica scrittura ammessa e' un INSERT (idempotente via ON CONFLICT).
  if (/delete\s+from\s+public\.user_roles|update\s+public\.user_roles\s+set\s+role/i.test(grantSql)) {
    errors.push(`${latestGrantFile}: contiene una DELETE o un UPDATE del campo role su user_roles — questa funzione deve solo INSERIRE, mai revocare/modificare ruoli esistenti.`);
  }
}

if (errors.length > 0) {
  console.error("❌ founder:backend-check FALLITO:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log(
    "✅ founder:backend-check: cutoff su auth.users.created_at (boundary >=), finestra 14gg, esclusioni App Review/.invalid, lock atomico + ricontrollo post-lock, fast-path già-pro prima del cutoff, nessuna revoca di ruoli esistenti.",
  );
}
