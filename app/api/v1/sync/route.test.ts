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
  upsertMetrics: vi.fn(),
  founderRpc: vi.fn(),
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
        insert: () => workoutsInsertQuery,
        update: () => deviceUpdateQuery,
      }),
      // Sprint 189-RC2: fitness_metrics is now written via
      // rpc("upsert_fitness_metrics_v189", ...) instead of a plain insert —
      // dispatch by RPC name so each keeps its own independently-configurable
      // mock, exactly like two different endpoints would. `workouts` is
      // still written via a plain insert (restored after adversarial review
      // found it's read by ExportDataClient.tsx's GDPR export).
      rpc: (name: string, params: unknown) =>
        name === "upsert_fitness_metrics_v189"
          ? mocks.upsertMetrics(params)
          : mocks.founderRpc(name, params),
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
    mocks.upsertMetrics.mockResolvedValue({ data: 42, error: null });
    mocks.workoutsInsert.mockResolvedValue({ data: null, error: null });
    mocks.deviceUpdateEq.mockResolvedValue({ data: null, error: null });
  });

  it("insert riuscito -> RPC awaited con i parametri esatti -> founderGrant=granted nella risposta", async () => {
    mocks.founderRpc.mockResolvedValue({
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
    expect(mocks.founderRpc).toHaveBeenCalledWith("record_first_sync_transition", {
      p_device_fingerprint: "device-abc",
      p_state: "success",
      p_platform: "android",
      p_app_version: "3.9.9+189",
    });
  });

  it("errore RPC -> founderGrant=retry_needed, MA il sync resta 200 (i dati salute sono gia' committati)", async () => {
    mocks.founderRpc.mockResolvedValue({
      data: null,
      error: { code: "500", message: "boom" },
    });

    const res = await POST(makeRequest(BASE_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, metricsId: 42, founderGrant: "retry_needed" });
  });

  it("eccezione lanciata dalla chiamata RPC -> founderGrant=retry_needed, sync comunque 200", async () => {
    mocks.founderRpc.mockRejectedValue(new Error("network down"));

    const res = await POST(makeRequest(BASE_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, metricsId: 42, founderGrant: "retry_needed" });
  });

  it("cap raggiunto -> founderGrant=cap_reached, mai un blocco del sync", async () => {
    mocks.founderRpc.mockResolvedValue({
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
      mocks.founderRpc.mockResolvedValue({
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
      expect(mocks.founderRpc).toHaveBeenCalledWith(
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
      mocks.founderRpc.mockResolvedValue({
        data: { transitionAccepted: true, grantCreated: true },
        error: null,
      });

      const { osVersion: _osVersion, ...payloadWithoutOsVersion } = BASE_PAYLOAD;
      await POST(makeRequest(payloadWithoutOsVersion));

      expect(mocks.founderRpc).toHaveBeenCalledWith(
        "record_first_sync_transition",
        expect.objectContaining({ p_platform: "ios" }),
      );
    },
  );
});

describe("Sprint 189-RC2 — canonical upsert wiring", () => {
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
    mocks.upsertMetrics.mockResolvedValue({ data: 42, error: null });
    mocks.founderRpc.mockResolvedValue({ data: { transitionAccepted: true }, error: null });
    mocks.deviceUpdateEq.mockResolvedValue({ data: null, error: null });
  });

  it("fitness_metrics e' scritta via rpc('upsert_fitness_metrics_v189', {p_row}), MAI via insert diretto", async () => {
    const res = await POST(makeRequest(BASE_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, metricsId: 42 });
    expect(mocks.upsertMetrics).toHaveBeenCalledWith({
      p_row: expect.objectContaining({
        user_id: "user-1",
        device_id: "device-1",
        local_day_key: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    });
  });

  it("payload 189+ con localDayKey esplicito -> passato as-is nel p_row, nessun ricalcolo", async () => {
    await POST(makeRequest({ ...BASE_PAYLOAD, localDayKey: "2026-07-21" }));

    expect(mocks.upsertMetrics).toHaveBeenCalledWith({
      p_row: expect.objectContaining({ local_day_key: "2026-07-21" }),
    });
  });

  it("upsert_fitness_metrics_v189 fallisce -> 500 insert_metrics_failed, nessuna RPC founder chiamata", async () => {
    mocks.upsertMetrics.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "constraint violation" },
    });

    const res = await POST(makeRequest(BASE_PAYLOAD));

    expect(res.status).toBe(500);
    expect(mocks.founderRpc).not.toHaveBeenCalled();
  });

  it(
    "public.workouts VIENE ancora scritta quando ci sono exercise_sessions " +
      "(Sprint 189-RC2 correction: adversarial review found ExportDataClient.tsx " +
      "reads this table for GDPR export — restored, not removed)",
    async () => {
      const exerciseSessionsJson = JSON.stringify([
        { type: "running", startMs: 100, endMs: 3_700_100 },
      ]);

      const res = await POST(makeRequest({ ...BASE_PAYLOAD, exerciseSessionsJson }));

      expect(res.status).toBe(200);
      expect(mocks.workoutsInsert).toHaveBeenCalledTimes(1);
    },
  );
});
