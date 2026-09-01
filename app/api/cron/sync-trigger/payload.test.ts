/**
 * BG1-1 — i nove RED sul payload del push di sincronizzazione.
 *
 * Cosa provano: che ogni messaggio prodotto porta le chiavi che APNs
 * richiede per una consegna in background, che il ramo Android non cambia, e
 * che un dispositivo di piattaforma ignota non riceve un push mal formato.
 *
 * Cosa NON provano: che l'iPhone si svegli davvero. Quella e' QA fisica
 * (BG1-4), e APNs non garantisce comunque la consegna di una singola silent
 * push. Ma senza queste chiavi non si sveglia di sicuro.
 */
import { describe, expect, it } from "vitest";

import {
  classificaPiattaforma,
  costruisciPushSync,
  DATI_SYNC,
  TTL_MS,
  type EsitoCostruzione,
} from "./payload";

const TOKEN_IOS = "token-di-prova-ios";
const TOKEN_ANDROID = "token-di-prova-android";

function messaggio(e: EsitoCostruzione) {
  if (e.tipo !== "messaggio") {
    throw new Error(`atteso un messaggio, ricevuto saltato:${e.motivo}`);
  }
  return e.messaggio as Record<string, any>;
}

const ios = () =>
  messaggio(costruisciPushSync({ token: TOKEN_IOS, osVersion: "iOS 18.5" }));
const android = () =>
  messaggio(
    costruisciPushSync({
      token: TOKEN_ANDROID,
      osVersion: "Android 14 (SDK 34)",
    }),
  );

describe("BG1-1 — payload APNs", () => {
  it("1. token iOS produce il blocco APNs completo", () => {
    const m = ios();
    expect(m.token).toBe(TOKEN_IOS);
    expect(m.apns).toBeDefined();
    expect(m.apns.headers["apns-push-type"]).toBe("background");
    expect(m.apns.headers["apns-priority"]).toBe("5");
    expect(m.apns.payload.aps.contentAvailable).toBe(true);
  });

  it("2. senza contentAvailable il messaggio non e valido per iOS", () => {
    // Il controllo che rende rosso il ritorno alla forma precedente: la
    // vecchia costruzione aveva SOLO `data` + `android`, e questa asserzione
    // fallisce esattamente su quella forma.
    const aps = ios().apns.payload.aps;
    expect(
      aps.contentAvailable,
      "senza content-available il gestore in background non viene mai " +
        "invocato: il push arriva ad APNs e muore li",
    ).toBe(true);
    expect(Object.keys(aps)).toContain("contentAvailable");
  });

  it("3. la priorita e 5, mai 10", () => {
    expect(ios().apns.headers["apns-priority"]).toBe("5");
    expect(ios().apns.headers["apns-priority"]).not.toBe("10");
  });

  it("4. il push type e background", () => {
    expect(ios().apns.headers["apns-push-type"]).toBe("background");
  });

  it("5. nessun alert, suono, badge o notification", () => {
    const m = ios();
    expect(Object.keys(m.apns.payload.aps).sort()).toEqual([
      "contentAvailable",
    ]);
    for (const vietato of ["alert", "sound", "badge"]) {
      expect(m.apns.payload.aps).not.toHaveProperty(vietato);
    }
    expect(m).not.toHaveProperty("notification");
    // Nemmeno sul ramo Android, che potrebbe farne comparire una a sua volta.
    expect(android()).not.toHaveProperty("notification");
    expect(android().android).not.toHaveProperty("notification");
  });

  it("6. token Android: configurazione invariata, e nessun blocco APNs", () => {
    const m = android();
    expect(m.token).toBe(TOKEN_ANDROID);
    expect(m.android).toEqual({ priority: "high", ttl: TTL_MS });
    expect(
      m.apns,
      "un blocco APNs su un dispositivo Android non serve a niente e " +
        "confonde chi legge",
    ).toBeUndefined();
  });

  it("7. piattaforma ignota: fail-closed, con il motivo dichiarato", () => {
    for (const os of [null, undefined, "", "   ", "HarmonyOS 4", "sconosciuto"]) {
      const e = costruisciPushSync({ token: "t", osVersion: os });
      expect(e.tipo, `os=${JSON.stringify(os)}`).toBe("saltato");
      if (e.tipo === "saltato") expect(e.motivo).toBe("piattaforma_ignota");
    }
    // Un token assente e' un caso diverso, e va detto diverso.
    for (const t of [null, undefined, "", "  "]) {
      const e = costruisciPushSync({ token: t, osVersion: "iOS 18.5" });
      expect(e.tipo).toBe("saltato");
      if (e.tipo === "saltato") expect(e.motivo).toBe("token_assente");
    }
  });

  it("8. il comando resta quello che l app sa gestire, solo stringhe", () => {
    for (const m of [ios(), android()]) {
      expect(m.data).toEqual({ ...DATI_SYNC });
      for (const v of Object.values(m.data)) {
        expect(typeof v).toBe("string");
      }
    }
  });

  it("9. il messaggio non porta uid, impronta del dispositivo o dati", () => {
    for (const m of [ios(), android()]) {
      const s = JSON.stringify(m);
      expect(s).not.toMatch(/user_?id/i);
      expect(s).not.toMatch(/fingerprint/i);
      expect(s).not.toMatch(/app_?version/i);
    }
  });
});

describe("classificazione della piattaforma", () => {
  it("riconosce le due forme reali in produzione", () => {
    expect(classificaPiattaforma("iOS 16.7.16")).toBe("ios");
    expect(classificaPiattaforma("iOS 27.0")).toBe("ios");
    expect(classificaPiattaforma("Android 11 (SDK 30)")).toBe("android");
    expect(classificaPiattaforma("Android 17 (SDK 37)")).toBe("android");
  });

  it("tutto il resto e ignoto, e non si indovina", () => {
    // `source_type` vale `health_connect` anche sugli iPhone: non e' un
    // indizio di piattaforma nonostante il nome. Qui si guarda solo
    // `os_version`.
    for (const v of ["health_connect", "", "  ", "Windows", null, undefined]) {
      expect(classificaPiattaforma(v)).toBe("ignota");
    }
  });
});
