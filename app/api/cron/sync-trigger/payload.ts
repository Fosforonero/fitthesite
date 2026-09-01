/**
 * BG1-1 — costruzione del push di sincronizzazione, per piattaforma.
 *
 * Pura e testabile: nessuna rete, nessun Supabase, nessun orologio implicito.
 * Il momento arriva come parametro, cosi' il test non deve inseguire `now()`.
 *
 * ── PERCHE' ESISTE ────────────────────────────────────────────────────────
 *
 * Il trigger schedulato mandava un push di soli dati con un blocco `android`
 * e nessun blocco `apns`. Su iOS un push silenzioso senza `content-available`
 * non risveglia l'app in background: il gestore non viene mai invocato.
 *
 * Misurato in produzione il 27/08/2026 — unita': dispositivi, build
 * `3.9.8+189`, almeno una POST negli ultimi 30 giorni:
 *
 *     Android  229 dispositivi — 77 sincronizzati entro 2h, mediana  31,7 h
 *     iOS      104 dispositivi — ZERO entro 2h,             mediana 270,1 h
 *
 * Il passo «POST arrivata -> riga persistita» e' ~100% su entrambe le
 * piattaforme: i dispositivi iOS non arrivavano proprio.
 *
 * Era invisibile perche' i token restano validi e FCM risponde `success`: il
 * contatore degli inviati saliva lo stesso.
 */
import type { Message } from "firebase-admin/messaging";

/** Piattaforma di destinazione, decisa da un dato autorevole del database. */
export type PiattaformaPush = "ios" | "android" | "ignota";

/**
 * Classifica dalla `devices.os_version`, che il server scrive allo step 6 di
 * `/api/v1/sync` prendendola dal client.
 *
 * Le due forme reali in produzione sono `iOS 16.7.16` e
 * `Android 14 (SDK 34)`. Non si indovina da altro: `source_type` vale
 * `health_connect` anche sugli iPhone, quindi non e' un indizio di
 * piattaforma nonostante il nome.
 */
export function classificaPiattaforma(
  osVersion: string | null | undefined,
): PiattaformaPush {
  const v = (osVersion ?? "").trim().toLowerCase();
  if (v === "") return "ignota";
  if (v.includes("ios") || v.includes("ipados")) return "ios";
  if (v.includes("android")) return "android";
  return "ignota";
}

/** Il comando che l'app sa gia' gestire. Solo stringhe: FCM non accetta altro. */
export const DATI_SYNC = {
  action: "sync_now",
  reason: "scheduled",
} as const;

/** TTL del push, un'ora: oltre, il prossimo tick arriva comunque. */
export const TTL_MS = 60 * 60 * 1000;

export type EsitoCostruzione =
  | { tipo: "messaggio"; piattaforma: "ios" | "android"; messaggio: Message }
  | { tipo: "saltato"; motivo: "piattaforma_ignota" | "token_assente" };

/**
 * Costruisce il messaggio per un singolo dispositivo, o dichiara **perche'**
 * non lo costruisce.
 *
 * Fail-closed sulla piattaforma ignota: meglio non mandare niente che mandare
 * un push mal formato a un dispositivo che non sappiamo cosa sia. Oggi non
 * costa nulla — nella popolazione reale del cron (token presente, non
 * revocato, visto entro 14 giorni) i dispositivi non classificabili sono
 * **zero**: 177 Android e 54 iOS. Se un domani ne comparissero, il conteggio
 * li rende visibili invece di nasconderli dentro «inviati».
 */
export function costruisciPushSync(input: {
  token: string | null | undefined;
  osVersion: string | null | undefined;
}): EsitoCostruzione {
  const token = (input.token ?? "").trim();
  if (token === "") return { tipo: "saltato", motivo: "token_assente" };

  const piattaforma = classificaPiattaforma(input.osVersion);

  if (piattaforma === "android") {
    return {
      tipo: "messaggio",
      piattaforma: "android",
      messaggio: {
        token,
        data: { ...DATI_SYNC },
        android: {
          // Priorita' alta = sveglia il dispositivo anche in Doze. Invariato
          // rispetto a prima di BG1: qui non si tocca niente, si aggiunge il
          // ramo che mancava.
          priority: "high",
          ttl: TTL_MS,
        },
      },
    };
  }

  if (piattaforma === "ios") {
    return {
      tipo: "messaggio",
      piattaforma: "ios",
      messaggio: {
        token,
        data: { ...DATI_SYNC },
        apns: {
          headers: {
            // Da iOS 13 APNs PRETENDE questo header. Per un risveglio in
            // background dev'essere `background`.
            "apns-push-type": "background",
            // 5, mai 10: la 10 e' riservata a cio' che presenta qualcosa
            // all'utente, e APNs rifiuta la combinazione background+10.
            "apns-priority": "5",
          },
          payload: {
            aps: {
              // Il campo tipizzato del Firebase Admin SDK: si serializza in
              // `content-available: 1`. E' l'unica chiave dell'`aps` —
              // niente alert, niente suono, niente badge: questo push sveglia
              // un processo, non parla all'utente.
              contentAvailable: true,
            },
          },
        },
      },
    };
  }

  return { tipo: "saltato", motivo: "piattaforma_ignota" };
}

/** Conteggi tipizzati di un tick, senza mai portarsi dietro un token. */
export type ContiTick = {
  inviati: number;
  falliti: number;
  saltatiPiattaformaIgnota: number;
  saltatiTokenAssente: number;
  totaleCandidati: number;
};
