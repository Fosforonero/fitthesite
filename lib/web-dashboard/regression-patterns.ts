/**
 * Elenchi dei test di regressione della dashboard web (solo per i test).
 *
 * Contengono di proposito le stringhe vietate: per questo i file `regression*`
 * sono gli unici esclusi dalla scansione dei sorgenti. Non sono importati da
 * nessuna pagina, componente o rotta.
 *
 * Fonte: DECISIONI.md del 28-29/09 (punti 3, 10, 26) e AGGIORNAMENTO-29SET.md.
 */

/**
 * T-DASH-ESITO-SYNC. Il server non possiede l'esito dei singoli sync ne' una
 * sorgente per i minuti attivi: nessun esito di sync e nessuna metrica «minuti
 * attivi» in nessun sorgente, chiave o markup della dashboard personale.
 * Gli stati dei DATI (misurato, zero misurato, parziale, assente) restano.
 *
 * Ci stanno anche i nomi che promettono cio' che il server non ha: la voce di menu
 * «Sorgenti e sync» / «Sync» e l'elenco «Ultime ricezioni» (nessuna cronologia dei sync).
 */
export const SYNC_OUTCOME_AND_ACTIVE_MINUTES: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: 'sync riuscito', re: /sync\s+riuscit/i },
  { name: 'sync parziale', re: /sync\s+parzial/i },
  { name: 'sync non riuscito', re: /sync\s+non\s+riuscit/i },
  { name: 'sync fallito', re: /sync\s+fallit/i },
  { name: 'sync incompleto', re: /(sync\s+incomplet|incomplete\s+sync)/i },
  { name: 'ok/parziale', re: /\bok\s*\/\s*parzial/i },
  { name: 'sync complete/failed/succeeded/partial', re: /sync\s+(complete|completed|succe\w*|failed|partial)\b/i },
  { name: 'partial sync', re: /partial\s+sync|failed\s+sync|successful\s+sync/i },
  { name: 'minuti attivi', re: /minuti\s+attivi/i },
  { name: 'active minutes', re: /active\s+minutes/i },
  { name: 'chiave activeMinutes', re: /activeMinutes/ },
  { name: 'chiave active_minutes', re: /active_minutes/i },
  { name: 'chiave syncLog / SyncLogEntry / SyncState', re: /syncLog|SyncLogEntry|\bSyncState\b/ },
  { name: 'attributo data-sync-state / data-log-state', re: /data-sync-state|data-log-state/ },
  { name: 'durata o conteggio per singolo sync', re: /durationSeconds|readTypes|failedTypes/ },
  // Esiti per dispositivo che il server non possiede (permessi, letture fallite):
  // la chiave ora si chiama incomplete_coverage e non dice piu' che e' il sync a essere incompleto.
  { name: 'chiave sync_incomplete', re: /sync_incomplete/ },
  { name: 'chiave permission_missing', re: /permission_missing/ },
  { name: 'chiave read_error', re: /read_error/ },
  { name: 'etichetta Permesso non concesso / Permission not granted', re: /permesso\s+non\s+concesso|permission\s+not\s+granted/i },
  // Il vecchio nome della schermata Fonti prometteva una cronologia di sync che il server non ha
  // (`received_at` e' sovrascritto a ogni invio, `sync_events` e' vuota): ora si chiama «Sorgenti dei dati».
  { name: 'voce di menu «Sorgenti e sync»', re: /sorgenti\s+(e|and|&)\s+sync/i },
  { name: 'voce di menu «Sources and sync»', re: /sources?\s+(and|&|e)\s+sync/i },
  { name: 'voce di menu «Sync» (da sola, o «Sync center» / «Centro sync»)', re: /^\s*(sync|sync\s+center|centro\s+sync|sincronizzazione)\s*$/i },
  { name: 'ultime ricezioni / latest receipts (cronologia inventata)', re: /ultime\s+ricezioni|latest\s+receipts|recent\s+receipts/i },
  // Il server conosce le sorgenti solo attraverso le righe ricevute: «nessuna fonte collegata» e
  // «sorgenti collegate ma nessun dato» sono cause dedotte dall'assenza di righe. Lo stato si chiama
  // «Nessun dato ricevuto».
  { name: 'stato «Nessuna fonte collegata» / «No source connected»', re: /nessuna\s+(fonte|sorgente)\s+(e'\s+|è\s+)?collegata|no\s+source\s+(is\s+)?connected/i },
  { name: 'frase «sorgenti collegate ma non e ancora arrivato nessun dato»', re: /sorgenti\s+sono\s+collegate\s+ma|sources\s+are\s+connected\s+but/i },
  { name: 'chiave neverWithSources', re: /neverWithSources|neverNoSources/ },
  // Stessa causa dedotta, al singolare: il server non sa se una fonte e' collegata (decisione 26).
  { name: 'frase «La fonte e\' collegata» / «The source is connected»', re: /(fonte|sorgente)\s+(è|e'|e)\s+collegata|source\s+is\s+connected/i },
  { name: 'etichetta Lettura non riuscita / Read failed', re: /lettura\s+non\s+riuscita|read\s+failed|la\s+lettura\s+non\s+(è|e')\s+riuscita|the\s+read\s+failed/i },
];

/**
 * Lo stesso elenco con un nome neutro, per i test delle schermate: il nome
 * dell'elenco sopra contiene la parola vietata e farebbe scattare la scansione
 * su qualunque file che lo importi.
 */
export const FORBIDDEN_SYNC_NAMES = SYNC_OUTCOME_AND_ACTIVE_MINUTES;

/**
 * Fonte vincente e genere del dispositivo (decisione del 29/09/2026, ricerca sui dati server).
 * Il server NON ha una colonna che dica quale sorgente «vince» per un tipo di dato (la scelta la fa l'app a
 * lettura, con prove di provenienza e copertura) e NON sa se una sorgente e' un orologio o un telefono
 * (`health_connect` e `healthkit` sono archivi di piattaforma). L'unico genere dimostrabile e' l'anello
 * (`colmi_ble`), che ha un nome proprio nel vocabolario chiuso, non un «genere».
 * Per fonte restano solo il nome del vocabolario chiuso e «Ultimo dato ricevuto».
 *
 * Ci stanno le CHIAVI del modello, gli attributi del DOM, le ETICHETTE visibili in it e en, e il nome di
 * un dispositivo inventato (l'esempio dei dati sintetici). Le parole comuni («telefono» in «sul telefono»)
 * non sono vietate: lo sono le etichette con cui il genere veniva mostrato (`'Orologio'`, `'Telefono'`).
 */
export const FORBIDDEN_WINNING_SOURCE_AND_DEVICE_KIND: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: 'chiave stepsSource', re: /stepsSource/ },
  { name: 'chiavi winning / winnersByType / wonBy / winsNone / chosenFor / chosenNone', re: /\bwinning\b|winnersByType|wonBy|winsNone|chosenFor|chosenNone|\bwins\b\s*[:(]/ },
  { name: 'attributi data-winning / winning-marker / won-by / win-summary / steps-source / data-kind / data-via', re: /data-winning|winning-marker|won-by|win-summary|steps-source|data-steps-source|data-kind|data-via/ },
  { name: 'tipi SourceKind, SourceTypeStatus, DataTypeKey, Via', re: /\bSourceKind\b|\bSourceTypeStatus\b|\bDataTypeKey\b|:\s*Via\b|<Via\b|Record<Via/ },
  { name: 'stato «non fornito» per tipo (not_provided)', re: /not_provided/ },
  { name: 'genere watch / phone / ring come valore o come chiave', re: /kind:\s*['"](watch|phone|ring)['"]|kind:\s*\{\s*watch|\.kind\[|'watch'|'phone'/ },
  { name: 'etichette «Fonte vincente», «Winning source», «Sorgente vincitrice»', re: /fonte\s+vincente|sorgente\s+vincente|sorgente\s+vincitrice|winning\s+source|winner\b/i },
  { name: 'etichette «Vince …» / «Won by»', re: /'Vince\s|`Vince\s|Won\s+by\b|wonBy/ },
  { name: 'titolo «Sorgente dei passi» / «Source of the steps» / «Fonte dei passi»', re: /sorgente\s+dei\s+passi|source\s+of\s+the\s+steps|fonte\s+dei\s+passi|steps\s+source/i },
  { name: 'regola «una sola sorgente per tipo, non si sommano»', re: /una\s+sola\s+sorgente|sorgenti\s+non\s+si\s+sommano|non\s+somma\s+pi[uù]\s+sorgenti|one\s+source\s+for\s+each|does\s+not\s+add\s+sources|sources\s+are\s+not\s+added/i },
  { name: 'etichette di genere «Orologio», «Telefono», «Watch», «Phone», «Ring» come valori scritti', re: /['"`](Orologio|Telefono|Watch|Phone|Ring|Anello)['"`]/ },
  { name: 'nome di dispositivo di esempio «Galaxy Watch»', re: /Galaxy\s+Watch|galaxy-watch/i },
  { name: 'titolo libero di un allenamento (`title` fuori whitelist)', re: /\bw\.title\b|\.title\.trim\(\)|title:\s*w\.title/ },
  { name: 'marcatore one-source (la regola «una sola sorgente» e\' stata tolta)', re: /one-source/i },
];

/**
 * Lo stesso elenco con un nome neutro, per i test delle schermate: il nome dell'elenco sopra contiene le
 * parole vietate e farebbe scattare la scansione su qualunque file che lo importi.
 */
export const FORBIDDEN_SOURCE_LABELS = FORBIDDEN_WINNING_SOURCE_AND_DEVICE_KIND;

/**
 * Decisione 10: pressione e glicemia fuori dalla v1, anche solo come presenza
 * o come parola in una schermata, in un dato sintetico, in un elenco o in un test.
 */
export const FORBIDDEN_VITALS: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: 'blood_pressure', re: /blood_pressure/i },
  { name: 'blood_glucose', re: /blood_glucose/i },
  { name: 'pressione', re: /pressione/i },
  { name: 'glicemia', re: /glicemia/i },
  { name: 'glucose', re: /glucose/i },
  { name: 'blood pressure', re: /blood\s+pressure/i },
  { name: 'sistolica / diastolica', re: /(systolic|diastolic|sistolic|diastolic)/i },
];

/**
 * Decisioni 3 e 2, e repository pubblico: testi e componenti di paywall e
 * accesso. La prova gratuita non abilita mai la dashboard, nessun acquisto sul
 * web, nessun prezzo, nessuna data di listino.
 */
export const FORBIDDEN_PAYWALL: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: 'La tua prova è terminata', re: /la\s+tua\s+prova\s+(è|e'|e)\s+terminata/i },
  { name: 'Your trial has ended', re: /your\s+(free\s+)?trial\s+(has\s+ended|is\s+over|ended)/i },
  { name: 'Vedi le opzioni / See the options', re: /vedi\s+le\s+opzioni|see\s+the\s+options/i },
  { name: 'apri l app e riprova (per un rinnovo)', re: /apri\s+l['’]app\s+e\s+riprova|open\s+the\s+app\s+and\s+(try\s+again|retry)/i },
  { name: 'pulsante di acquisto', re: /\b(acquista|compra|abbonati)\s+(ora|adesso|subito)\b|\b(buy|subscribe|purchase|upgrade)\s+now\b/i },
  { name: 'prezzo', re: /(€|£|\$(?!\{))\s?\d|\d\s?(€|£|\$(?!\{)|eur\b|euro\b|usd\b)|\bal\s+mese\b|\bper\s+(month|year|anno)\b|\/\s?(mese|anno|month|year)\b|\bprezzo\b|\bprice\b/i },
  { name: 'listino del 17/11', re: /listino|17\s*[\/.]\s*11|17\s+novembre|november\s+17/i },
];

/** Cartelle e file scansionati (relativi alla radice del repository). */
export const SCAN_ROOTS = ['lib/web-dashboard', 'components/web-dashboard', 'app/(frontend)/[locale]/dashboard-preview'] as const;

/** Chi contiene le stringhe vietate per mestiere: questo elenco e i due test di regressione. */
export const isRegressionFile = (file: string): boolean => /(^|\/)regression[^/]*$/.test(file);
