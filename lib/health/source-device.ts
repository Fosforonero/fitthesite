/**
 * Il nome del dispositivo arriva come lo ha scritto l'utente.
 *
 * Health Connect e HealthKit trasportano il nome che la persona ha dato al
 * proprio orologio, e quel nome contiene quasi sempre il suo nome di
 * battesimo: "Patricia's AW Ultra 2", "Apple Watch von Stefan". Misurato sul
 * database il 16/08/2026: 75 nomi distinti su 75 utenti contengono un nome
 * proprio di persona, ~2.700 righe.
 *
 * Quel dato non ci serve, non lo abbiamo chiesto, ed e' arrivato per effetto
 * collaterale. Compare in ogni report interno e nella schermata provenienza.
 * Toglierlo all'ingresso e' l'unico punto che vale per TUTTE le versioni
 * dell'app, comprese quelle gia' installate che continueranno a mandarlo.
 *
 * ── COSA FA E COSA NON FA ─────────────────────────────────────────────────
 *
 * Toglie il proprietario e tiene il dispositivo, perche' il dispositivo e'
 * l'informazione che serve al prodotto:
 *
 *   "Patricia's AW Ultra 2"       -> "AW Ultra 2"
 *   "Apple Watch von Stefan"      -> "Apple Watch"
 *   "Apple Watch Ultra de Nicolas"-> "Apple Watch Ultra"
 *   "Jakub - iPhone 15 Pro"       -> "iPhone 15 Pro"
 *
 * NON riconosce un nome di persona che non sia marcato da un possessivo o da
 * un separatore: "DIGS Apple Watch Ultra 3" resta intero. Riconoscerlo
 * richiederebbe una lista di nomi propri, e sbagliare significherebbe
 * distruggere il nome del dispositivo, che e' il dato utile. Meglio lasciare
 * qualche caso scoperto che rovinare i 103 nomi neutri.
 *
 * NON risolve il problema piu' grande, che e' diverso e va affrontato a parte:
 * `source_device` mescola oggi etichette di app ("Samsung Health"), nomi di
 * pacchetto grezzi ("com.app.cq.ring", 401 valori distinti), identificativi
 * hardware ("R09_9D07") e stringhe generiche ("android"). Separare "app che
 * ha scritto il dato" da "dispositivo che lo ha misurato" e' una modifica di
 * prodotto, non di igiene.
 */

/**
 * "Patricia's AW Ultra 2" / "tamallancus’s iPhone" -> via il possessivo.
 *
 * Lo spazio dopo `'s` e' opzionale di proposito: un nome che e' SOLO un
 * possessivo ("Marta's") e' interamente il nome di una persona, e va tolto
 * tutto. Con `\s+` obbligatorio quel caso sopravviveva intatto.
 */
const POSSESSIVO_INIZIALE = /^\s*\S[^'’]*['’]s\b\s*/u;

/**
 * "Apple Watch von Stefan" / "Apple Watch Ultra de Nicolas".
 * Il nome dopo la preposizione deve iniziare per maiuscola: senza questo
 * vincolo "Reloj de pulsera" perderebbe l'ultima parola.
 */
const POSSESSIVO_FINALE =
  /\s+(?:von|van|de|di|del|della|du|of)\s+\p{Lu}[\p{L}'’-]*\s*$/u;

/** "Jakub - iPhone 15 Pro": una sola parola capitalizzata, poi il trattino. */
const NOME_E_TRATTINO = /^\s*\p{Lu}[\p{L}'’-]*\s*[-–—]\s+/u;

/**
 * Restituisce il nome del dispositivo senza il proprietario, oppure null se
 * dopo la pulizia non resta niente di utile.
 *
 * Non lancia mai: un nome dispositivo non deve poter far fallire un sync.
 */
export function sanitizeSourceDevice(
  raw: string | null | undefined,
): string | null {
  if (typeof raw !== "string") return null;

  let nome = raw.trim();
  if (nome === "") return null;

  nome = nome.replace(POSSESSIVO_INIZIALE, "");
  nome = nome.replace(POSSESSIVO_FINALE, "");
  nome = nome.replace(NOME_E_TRATTINO, "");

  // Spazi interni collassati: "Apple  Watch" -> "Apple Watch".
  nome = nome.replace(/\s+/gu, " ").trim();

  // Restava solo il proprietario: meglio nessuna provenienza che il nome di
  // una persona. Chi legge vedra' "dispositivo non dichiarato", che e' vero.
  if (nome === "") return null;

  return nome;
}
