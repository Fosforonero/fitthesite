/**
 * BG1 — il push che deve svegliare i dispositivi per sincronizzare non
 * sveglia iOS.
 *
 * ── MISURATO IN PRODUZIONE (27/08/2026, sola lettura) ──────────────────────
 *
 * Unita': dispositivi non revocati con almeno una POST negli ultimi 30
 * giorni, build 3.9.8+189.
 *
 *   Android  229 dispositivi — 77 sincronizzati entro 2h, mediana 31,7 h
 *   iOS      104 dispositivi — ZERO entro 2h, mediana 270 h (11,3 giorni)
 *
 * Il passo d'imbuto «POST arrivata -> riga persistita» e' ~100% su entrambe
 * le piattaforme, quindi l'ingestione non e' il difetto: i dispositivi iOS
 * non arrivano proprio.
 *
 * ── IL MECCANISMO ─────────────────────────────────────────────────────────
 *
 * Questo cron manda un push FCM di soli dati con un blocco `android` e
 * NESSUN blocco `apns`. Un push silenzioso senza `content-available: 1` e
 * senza `apns-push-type: background` non risveglia un'app iOS in background:
 * APNs lo tratta come un messaggio senza contenuto da presentare, e il
 * background handler non viene mai invocato.
 *
 * Perche' non se n'e' accorto nessuno: i token restano validi, FCM riporta
 * `success`, il contatore `sent` sale. Ogni metrica presa dal lato
 * dell'invio dice che va tutto bene.
 *
 * Che qui si sappia fare e' dimostrato dallo stesso repo:
 * `app/api/v1/family-events/webhook/route.ts` il blocco `apns` ce l'ha.
 *
 * ── COSA QUESTO TEST PROVA, E COSA NO ─────────────────────────────────────
 *
 * Prova che ogni messaggio prodotto da questo cron porta le chiavi che APNs
 * richiede per una consegna in background. NON prova che il dispositivo si
 * svegli: quella e' QA fisica su iPhone reale, e resta pendente. Ma senza
 * queste chiavi non si sveglia di sicuro.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendEach: vi.fn(),
  devices: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/fcm/admin", () => ({
  isFcmConfigured: () => true,
  getFcmMessaging: () => ({ sendEach: mocks.sendEach }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "devices") throw new Error(`tabella inattesa: ${table}`);
      const query = {
        select: () => query,
        not: () => query,
        is: () => query,
        gte: () => query,
        limit: () => mocks.devices(),
        update: () => ({ in: (_col: string, valori: string[]) => mocks.update(valori) }),
      };
      return query;
    },
  }),
}));

import { POST } from "./route";

const SEGRETO = "segreto-di-prova";

function richiesta(): Request {
  return new Request("https://esempio.test/api/cron/sync-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SEGRETO}` },
  });
}

type Messaggio = {
  token: string;
  data?: Record<string, string>;
  android?: unknown;
  apns?: {
    headers?: Record<string, string>;
    payload?: { aps?: Record<string, unknown> };
  };
};

describe("BG1 — il trigger schedulato deve poter svegliare anche iOS", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", SEGRETO);
    mocks.sendEach.mockReset();
    mocks.devices.mockReset();
    mocks.update.mockReset();
    mocks.devices.mockResolvedValue({
      data: [
        {
          id: "d1",
          user_id: "u1",
          fcm_token: "token-android",
          device_fingerprint: "fp1",
          app_version: "3.9.8+189",
          os_version: "Android 14 (SDK 34)",
        },
        {
          id: "d2",
          user_id: "u2",
          fcm_token: "token-ios",
          device_fingerprint: "fp2",
          app_version: "3.9.8+189",
          os_version: "iOS 18.5",
        },
      ],
      error: null,
    });
    mocks.sendEach.mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [{ success: true }, { success: true }],
    });
  });

  async function messaggiInviati(): Promise<Messaggio[]> {
    const res = await POST(richiesta());
    expect(res.status).toBe(200);
    expect(mocks.sendEach).toHaveBeenCalledTimes(1);
    return mocks.sendEach.mock.calls[0][0] as Messaggio[];
  }

  it("il messaggio iOS porta il blocco APNs, quello Android no", async () => {
    const inviati = await messaggiInviati();
    expect(inviati).toHaveLength(2);
    const ios = inviati.find((m) => m.token === "token-ios")!;
    const android = inviati.find((m) => m.token === "token-android")!;
    expect(ios.apns?.headers?.["apns-push-type"]).toBe("background");
    expect(ios.apns?.headers?.["apns-priority"]).toBe("5");
    expect((ios.apns?.payload?.aps as any)?.contentAvailable).toBe(true);
    expect(android.apns).toBeUndefined();
    expect(android.android).toBeDefined();
  });

  it("un dispositivo di piattaforma ignota viene saltato e CONTATO, e gli altri partono", async () => {
    mocks.devices.mockResolvedValue({
      data: [
        { id: "d1", user_id: "u1", fcm_token: "t-ok", device_fingerprint: "f1", app_version: "x", os_version: "iOS 18.5" },
        { id: "d2", user_id: "u2", fcm_token: "t-boh", device_fingerprint: "f2", app_version: "x", os_version: "HarmonyOS 4" },
      ],
      error: null,
    });
    mocks.sendEach.mockResolvedValue({
      successCount: 1, failureCount: 0, responses: [{ success: true }],
    });
    const res = await POST(richiesta());
    const body = await res.json();
    const inviati = mocks.sendEach.mock.calls[0][0] as Messaggio[];
    expect(inviati.map((m) => m.token)).toEqual(["t-ok"]);
    expect(body.conti.saltatiPiattaformaIgnota).toBe(1);
    expect(body.conti.inviati).toBe(1);
  });

  it("un fallimento parziale non ferma gli altri, e invalida il token GIUSTO", async () => {
    // Con un dispositivo saltato in mezzo, gli indici di `responses` non
    // combaciano piu' con quelli di `devices`: se il codice usasse questi
    // ultimi, il cleanup colpirebbe il dispositivo sbagliato.
    mocks.devices.mockResolvedValue({
      data: [
        { id: "d1", user_id: "u1", fcm_token: "t-ignoto", device_fingerprint: "f1", app_version: "x", os_version: null },
        { id: "d2", user_id: "u2", fcm_token: "t-buono", device_fingerprint: "f2", app_version: "x", os_version: "iOS 18.5" },
        { id: "d3", user_id: "u3", fcm_token: "t-morto", device_fingerprint: "f3", app_version: "x", os_version: "Android 14 (SDK 34)" },
      ],
      error: null,
    });
    mocks.sendEach.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      responses: [
        { success: true },
        { success: false, error: { code: "messaging/registration-token-not-registered" } },
      ],
    });
    const res = await POST(richiesta());
    const body = await res.json();
    expect(body.conti.saltatiPiattaformaIgnota).toBe(1);
    expect(body.conti.inviati).toBe(1);
    expect(body.conti.falliti).toBe(1);
    expect(body.invalidated).toBe(1);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(
      mocks.update.mock.calls[0][0],
      "invalidato il token SBAGLIATO: con un dispositivo saltato in mezzo, " +
        "gli indici di responses non combaciano piu con quelli di devices, " +
        "e il cleanup spegne le notifiche a chi non ha fatto niente",
    ).toEqual(["t-morto"]);
  });

  it("la risposta non contiene token ne impronte ne uid", async () => {
    const res = await POST(richiesta());
    const testo = JSON.stringify(await res.json());
    expect(testo).not.toContain("token-ios");
    expect(testo).not.toContain("token-android");
    expect(testo).not.toMatch(/fingerprint|user_?id/i);
  });

  it("un errore dell SDK non fa uscire il suo messaggio: solo il tipo", async () => {
    mocks.sendEach.mockRejectedValue(
      new TypeError("FCM ha rifiutato la richiesta con token=token-ios"),
    );
    const res = await POST(richiesta());
    expect(res.status).toBe(502);
    const testo = JSON.stringify(await res.json());
    expect(testo).not.toContain("token-ios");
    expect(testo).toContain("TypeError");
  });
});
