/**
 * Integration test del route handler vero (non solo gli helper puri di
 * founder-grant.ts/schema.ts) — Founder P0 review, punto 6: dimostra che
 * l'INSERT riuscito in fitness_metrics e' seguito da un await REALE della
 * RPC record_first_sync_transition, il cui esito finisce nella risposta
 * come founderGrant. Se la chiamata fosse fire-and-forget (non awaited),
 * il valore risolto dal mock non potrebbe MAI comparire sincronamente nel
 * body della risposta — l'asserzione su founderGrant prova l'await da
 * sola, senza bisogno di introdurre ritardi artificiali.
 *
 * @supabase/supabase-js e' mockato: niente rete reale, niente Next.js
 * runtime (route.ts usa solo Request/Response nativi, mai next/server).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  deviceMaybeSingle: vi.fn(),
  metricsInsertSingle: vi.fn(),
  rpc: vi.fn(),
  workoutsInsert: vi.fn(),
  deviceUpdateEq: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => {
  const deviceQuery = {
    select: () => deviceQuery,
    eq: () => deviceQuery,
    is: () => deviceQuery,
    maybeSingle: mocks.deviceMaybeSingle,
  };
  const metricsInsertQuery = {
    select: () => metricsInsertQuery,
    single: mocks.metricsInsertSingle,
  };
  const workoutsInsertQuery = {
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(mocks.workoutsInsert()).then(resolve),
  };
  const deviceUpdateQuery = {
    eq: () => Promise.resolve(mocks.deviceUpdateEq()),
  };

  return {
    createClient: () => ({
      auth: { getUser: mocks.getUser },
      from: (table: string) => ({
        select: () => deviceQuery,
        insert: () =>
          table === "fitness_metrics" ? metricsInsertQuery : workoutsInsertQuery,
        update: () => deviceUpdateQuery,
      }),
      rpc: mocks.rpc,
    }),
  };
});

const { POST } = await import("./route");

function makeRequest(body: object) {
  return new Request("https://fitmesh.fit/api/v1/sync", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer test-token",
      "x-device-fingerprint": "device-abc",
    },
    body: JSON.stringify(body),
  });
}

const BASE_PAYLOAD = {
  windowStartMillis: 1_720_000_000_000,
  windowEndMillis: 1_720_003_600_000,
  collectedAtMillis: 1_720_003_600_000,
  osVersion: "Android 14",
  appVersion: "3.9.9+189",
};

describe("POST /api/v1/sync — Founder P0 RPC wiring (route reale, non solo helper puri)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://xcdyhkuyxukaifhhtadr.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user1@example.com" } },
      error: null,
    });
    mocks.deviceMaybeSingle.mockResolvedValue({
      data: { id: "device-1", os_version: null },
      error: null,
    });
    mocks.metricsInsertSingle.mockResolvedValue({
      data: { id: 42 },
      error: null,
    });
    mocks.workoutsInsert.mockResolvedValue({ data: null, error: null });
    mocks.deviceUpdateEq.mockResolvedValue({ data: null, error: null });
  });

  it("insert riuscito -> RPC awaited con i parametri esatti -> founderGrant=granted nella risposta", async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        transitionAccepted: true,
        transitionRecordedNow: true,
        effectiveState: "success",
        grantCreated: true,
        alreadyHadEligibleGrant: false,
        grantKind: "founder-launch",
        capReached: false,
        notEligibleReason: null,
      },
      error: null,
    });

    const res = await POST(makeRequest(BASE_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, metricsId: 42, founderGrant: "granted" });
    expect(mocks.rpc).toHaveBeenCalledWith("record_first_sync_transition", {
      p_device_fingerprint: "device-abc",
      p_state: "success",
      p_platform: "android",
      p_app_version: "3.9.9+189",
    });
  });

  it("errore RPC -> founderGrant=retry_needed, MA il sync resta 200 (i dati salute sono gia' committati)", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "500", message: "boom" },
    });

    const res = await POST(makeRequest(BASE_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, metricsId: 42, founderGrant: "retry_needed" });
  });

  it("eccezione lanciata dalla chiamata RPC -> founderGrant=retry_needed, sync comunque 200", async () => {
    mocks.rpc.mockRejectedValue(new Error("network down"));

    const res = await POST(makeRequest(BASE_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, metricsId: 42, founderGrant: "retry_needed" });
  });

  it("cap raggiunto -> founderGrant=cap_reached, mai un blocco del sync", async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        transitionAccepted: true,
        transitionRecordedNow: true,
        effectiveState: "success",
        grantCreated: false,
        alreadyHadEligibleGrant: false,
        grantKind: null,
        capReached: true,
        notEligibleReason: "cap_reached",
      },
      error: null,
    });

    const res = await POST(makeRequest(BASE_PAYLOAD));
    const json = await res.json();

    expect(json).toMatchObject({ ok: true, founderGrant: "cap_reached" });
  });

  it(
    "payload senza osVersion -> platform NULL passato alla RPC, sync comunque valido " +
      "(P0.4: platform mai bloccante)",
    async () => {
      mocks.rpc.mockResolvedValue({
        data: {
          transitionAccepted: true,
          transitionRecordedNow: true,
          effectiveState: "success",
          grantCreated: true,
        },
        error: null,
      });

      const { osVersion: _osVersion, ...payloadWithoutOsVersion } = BASE_PAYLOAD;
      const res = await POST(makeRequest(payloadWithoutOsVersion));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toMatchObject({ ok: true, founderGrant: "granted" });
      expect(mocks.rpc).toHaveBeenCalledWith(
        "record_first_sync_transition",
        expect.objectContaining({ p_platform: null }),
      );
    },
  );

  it(
    "osVersion assente nel payload ma gia' noto su devices.os_version -> " +
      "usato come fallback per la RPC",
    async () => {
      mocks.deviceMaybeSingle.mockResolvedValue({
        data: { id: "device-1", os_version: "iOS 17.5" },
        error: null,
      });
      mocks.rpc.mockResolvedValue({
        data: { transitionAccepted: true, grantCreated: true },
        error: null,
      });

      const { osVersion: _osVersion, ...payloadWithoutOsVersion } = BASE_PAYLOAD;
      await POST(makeRequest(payloadWithoutOsVersion));

      expect(mocks.rpc).toHaveBeenCalledWith(
        "record_first_sync_transition",
        expect.objectContaining({ p_platform: "ios" }),
      );
    },
  );
});
