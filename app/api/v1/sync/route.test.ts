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
  upsertWorkouts: vi.fn(),
  founderRpc: vi.fn(),
  entitlementRpc: vi.fn(),
  deviceUpdateEq: vi.fn(),
  limitSync: vi.fn(),
  concediPonteIos: vi.fn(),
}));

// La cessione iOS e' mockata qui per isolare il RAMO della route (nega, o
// concede e prosegue) dalla decisione, che vive nella funzione Postgres e ha
// le sue guardie li' (gia' con diritto / non iOS / ponte gia' concesso).
vi.mock("./cessione-ios", () => ({
  concediPonteIos: (userId: string) => mocks.concediPonteIos(userId),
}));

// Sprint P0.10C — il rate limit vive ora dentro la route stessa (spostato
// dal Middleware). Mockato qui per isolare il comportamento della route dal
// meccanismo di fail-open reale del limiter (coperto invece in
// lib/rate-limit/limiter.test.ts).
vi.mock("@/lib/rate-limit/limiter", () => ({
  limitSync: (req: Request) => mocks.limitSync(req),
  buildRateLimitResponse: (result: { limit: number; remaining: number }) =>
    new Response(
      JSON.stringify({ error: "rate_limited", message: "Too many requests. Please retry later.", retryAfter: 60 }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": "60",
          "x-ratelimit-limit": String(result.limit),
          "x-ratelimit-remaining": String(result.remaining),
        },
      },
    ),
}));

vi.mock("@supabase/supabase-js", () => {
  const deviceQuery = {
    select: () => deviceQuery,
    eq: () => deviceQuery,
    is: () => deviceQuery,
    maybeSingle: mocks.deviceMaybeSingle,
  };
  const deviceUpdateQuery = {
    eq: () => Promise.resolve(mocks.deviceUpdateEq()),
  };

  return {
    createClient: () => ({
      auth: { getUser: mocks.getUser },
      from: () => ({
        select: () => deviceQuery,
        update: () => deviceUpdateQuery,
      }),
      // Sprint 189-RC2: both fitness_metrics AND workouts are now written via
      // RPC (upsert_fitness_metrics_v189, upsert_workouts_v189 — Blocker 2)
      // instead of plain inserts — dispatch by RPC name so each keeps its own
      // independently-configurable mock, exactly like two different
      // endpoints would.
      rpc: (name: string, params: unknown) => {
        if (name === "upsert_fitness_metrics_v189") return mocks.upsertMetrics(params);
        if (name === "upsert_workouts_v189") return mocks.upsertWorkouts(params);
        if (name === "user_has_active_entitlement") return mocks.entitlementRpc(params);
        return mocks.founderRpc(name, params);
      },
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
    // Sprint P0.10C: default "consentito" per ogni test che non riguarda
    // esplicitamente il rate limit — vedi describe dedicato sotto.
    mocks.limitSync.mockResolvedValue({ allowed: true, limit: 60, remaining: 59 });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user1@example.com" } },
      error: null,
    });
    mocks.deviceMaybeSingle.mockResolvedValue({
      data: { id: "device-1", os_version: null },
      error: null,
    });
    mocks.entitlementRpc.mockResolvedValue({ data: true, error: null });
    mocks.upsertMetrics.mockResolvedValue({ data: 42, error: null });
    mocks.upsertWorkouts.mockResolvedValue({ data: 1, error: null });
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
    // Sprint P0.10C: default "consentito" per ogni test che non riguarda
    // esplicitamente il rate limit — vedi describe dedicato sotto.
    mocks.limitSync.mockResolvedValue({ allowed: true, limit: 60, remaining: 59 });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user1@example.com" } },
      error: null,
    });
    mocks.deviceMaybeSingle.mockResolvedValue({
      data: { id: "device-1", os_version: null },
      error: null,
    });
    mocks.entitlementRpc.mockResolvedValue({ data: true, error: null });
    mocks.upsertMetrics.mockResolvedValue({ data: 42, error: null });
    mocks.upsertWorkouts.mockResolvedValue({ data: 1, error: null });
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
      "reads this table for GDPR export — restored, not removed) via " +
      "rpc('upsert_workouts_v189'), non piu' un insert diretto (Blocker 2)",
    async () => {
      const exerciseSessionsJson = JSON.stringify([
        { type: "running", startMs: 100, endMs: 3_700_100 },
      ]);

      const res = await POST(makeRequest({ ...BASE_PAYLOAD, exerciseSessionsJson }));

      expect(res.status).toBe(200);
      expect(mocks.upsertWorkouts).toHaveBeenCalledTimes(1);
      expect(mocks.upsertWorkouts).toHaveBeenCalledWith({
        p_row: expect.objectContaining({
          user_id: "user-1",
          device_id: "device-1",
          start_ms: 100,
          end_ms: 3_700_100,
          type: "running",
        }),
      });
    },
  );

  it("upsert_workouts_v189 fallisce -> sync resta 200 (best-effort, il dato salute e' gia' committato)", async () => {
    mocks.upsertWorkouts.mockResolvedValue({
      data: null,
      error: { code: "23503", message: "boom" },
    });
    const exerciseSessionsJson = JSON.stringify([
      { type: "running", startMs: 100, endMs: 3_700_100 },
    ]);

    const res = await POST(makeRequest({ ...BASE_PAYLOAD, exerciseSessionsJson }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, metricsId: 42 });
  });

  it("piu' exercise_sessions nello stesso payload -> upsert_workouts_v189 chiamata una volta per sessione", async () => {
    const exerciseSessionsJson = JSON.stringify([
      { type: "running", startMs: 100, endMs: 3_700_100 },
      { type: "cycling", startMs: 4_000_000, endMs: 7_600_000 },
    ]);

    await POST(makeRequest({ ...BASE_PAYLOAD, exerciseSessionsJson }));

    expect(mocks.upsertWorkouts).toHaveBeenCalledTimes(2);
  });
});

describe("Sprint P0.10C — rate limit spostato nella route (prima di auth/device/json/Zod/scritture)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://xcdyhkuyxukaifhhtadr.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user1@example.com" } },
      error: null,
    });
    mocks.deviceMaybeSingle.mockResolvedValue({ data: { id: "device-1", os_version: null }, error: null });
    mocks.entitlementRpc.mockResolvedValue({ data: true, error: null });
    mocks.upsertMetrics.mockResolvedValue({ data: 42, error: null });
    mocks.upsertWorkouts.mockResolvedValue({ data: 1, error: null });
    mocks.deviceUpdateEq.mockResolvedValue({ data: null, error: null });
    mocks.founderRpc.mockResolvedValue({ data: { transitionAccepted: true }, error: null });
  });

  it("richiesta consentita: passa normalmente alla route, limitSync chiamato esattamente una volta", async () => {
    mocks.limitSync.mockResolvedValue({ allowed: true, limit: 60, remaining: 59 });

    const res = await POST(makeRequest(BASE_PAYLOAD));

    expect(res.status).toBe(200);
    expect(mocks.limitSync).toHaveBeenCalledTimes(1);
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
  });

  it(
    "richiesta bloccata: 429 invariato, requireUser MAI chiamato, il body non viene letto, " +
      "nessuna RPC metrics/Founder/workout eseguita",
    async () => {
      mocks.limitSync.mockResolvedValue({ allowed: false, limit: 60, remaining: 0 });

      // Body deliberatamente non-JSON valido: se venisse anche solo letto/
      // parsato, la route fallirebbe con 400 invalid_json PRIMA di arrivare
      // a un eventuale controllo successivo — ottenere 429 qui è la prova
      // diretta che req.json() non viene mai chiamato quando il rate limit
      // blocca la richiesta.
      const req = new Request("https://fitmesh.fit/api/v1/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-token",
          "x-device-fingerprint": "device-abc",
        },
        body: "{not valid json",
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(429);
      expect(json).toMatchObject({ error: "rate_limited" });
      expect(mocks.getUser).not.toHaveBeenCalled();
      expect(mocks.deviceMaybeSingle).not.toHaveBeenCalled();
      expect(mocks.upsertMetrics).not.toHaveBeenCalled();
      expect(mocks.founderRpc).not.toHaveBeenCalled();
      expect(mocks.upsertWorkouts).not.toHaveBeenCalled();
    },
  );

  it("esito fail-open del limiter (allowed=true anche su errore interno) -> la route procede normalmente", async () => {
    // Il meccanismo di fail-open vero e proprio (errore di rete -> allowed
    // true) e' testato in lib/rate-limit/limiter.test.ts; qui si verifica
    // solo che la route non aggiunga alcun blocco extra sopra un risultato
    // "allowed" comunque ottenuto (limit/remaining a 0, come restituisce
    // ALLOWED_FAILOPEN).
    mocks.limitSync.mockResolvedValue({ allowed: true, limit: 0, remaining: 0 });

    const res = await POST(makeRequest(BASE_PAYLOAD));

    expect(res.status).toBe(200);
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
  });
});

describe("P0 — senza diritto non entrano dati salute nuovi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limitSync.mockResolvedValue({ allowed: true, limit: 60, remaining: 59 });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
      error: null,
    });
    mocks.deviceMaybeSingle.mockResolvedValue({
      data: { id: "22222222-2222-4222-8222-222222222222", os_version: "Android 14" },
      error: null,
    });
    mocks.entitlementRpc.mockResolvedValue({ data: true, error: null });
    mocks.upsertMetrics.mockResolvedValue({ data: 42, error: null });
    mocks.upsertWorkouts.mockResolvedValue({ data: 1, error: null });
    mocks.founderRpc.mockResolvedValue({ data: { transitionAccepted: true }, error: null });
    mocks.deviceUpdateEq.mockResolvedValue({ data: null, error: null });
    // Predefinito: la cessione NON concede. Cosi' ogni test che non la
    // riguarda vede esattamente il comportamento di prima, e chi vuole il
    // ramo nuovo deve chiederlo esplicitamente.
    mocks.concediPonteIos.mockResolvedValue(false);
  });

  it("prova scaduta: 403 entitlement_required, e NIENTE viene scritto", async () => {
    mocks.entitlementRpc.mockResolvedValue({ data: false, error: null });
    mocks.concediPonteIos.mockResolvedValue(false);

    const res = await POST(makeRequest(BASE_PAYLOAD));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("entitlement_required");
    // Il punto non e' il codice di stato: e' che l'ingest non parta.
    expect(mocks.upsertMetrics).not.toHaveBeenCalled();
    expect(mocks.upsertWorkouts).not.toHaveBeenCalled();
  });

  it("iOS senza diritto: la cessione lo fa passare e l'ingest parte", async () => {
    // Un cliente ha pagato su App Store e non ha ricevuto Pro, perche' il
    // percorso che scrive `apple_iap` non e' mai riuscito (zero righe su 24 in
    // b2c_subscriptions). Finche' resta cosi', su iOS si cede in favore
    // dell'utente: meglio concedere a qualcuno con la prova scaduta che
    // togliere il servizio a chi ha pagato.
    mocks.entitlementRpc.mockResolvedValue({ data: false, error: null });
    mocks.concediPonteIos.mockResolvedValue(true);

    const res = await POST(makeRequest(BASE_PAYLOAD));

    expect(res.status).toBe(200);
    expect(mocks.upsertMetrics).toHaveBeenCalled();
  });

  // Il caso "la cessione va in errore" NON si prova qui: mockare il modulo
  // toglierebbe proprio il try/catch che lo rende innocuo. Sta in
  // ./cessione-ios.test.ts, contro il modulo vero.

  it("la cessione non viene nemmeno tentata su chi ha gia' diritto", async () => {
    const res = await POST(makeRequest(BASE_PAYLOAD));

    expect(res.status).toBe(200);
    expect(mocks.concediPonteIos).not.toHaveBeenCalled();
  });

  it("founder o pagante: passa e scrive esattamente come prima", async () => {
    const res = await POST(makeRequest(BASE_PAYLOAD));

    expect(res.status).toBe(200);
    expect(mocks.upsertMetrics).toHaveBeenCalledTimes(1);
  });

  it("il controllo chiede il diritto DELL'UTENTE AUTENTICATO, non uno dichiarato dal client", async () => {
    // Se un giorno l'identita' arrivasse dal corpo della richiesta, questo
    // caso morirebbe. Il diritto si valuta su chi ha il token, sempre.
    await POST(makeRequest({ ...BASE_PAYLOAD, userId: "33333333-3333-4333-8333-333333333333" }));

    expect(mocks.entitlementRpc).toHaveBeenCalledWith({
      p_user_id: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("se il controllo va in errore si LASCIA PASSARE, perche' sotto c'e' la RLS", async () => {
    // Negare per un guasto nostro significherebbe togliere il servizio a chi
    // paga. Le policy negano comunque: la difesa non e' questa.
    mocks.entitlementRpc.mockResolvedValue({ data: null, error: { code: "57014" } });

    const res = await POST(makeRequest(BASE_PAYLOAD));

    expect(res.status).toBe(200);
    expect(mocks.upsertMetrics).toHaveBeenCalledTimes(1);
  });

  it("il diritto si controlla PRIMA di scrivere, non dopo", async () => {
    mocks.entitlementRpc.mockResolvedValue({ data: false, error: null });
    await POST(makeRequest(BASE_PAYLOAD));

    const ordine = mocks.entitlementRpc.mock.invocationCallOrder[0];
    expect(ordine).toBeDefined();
    expect(mocks.upsertMetrics.mock.invocationCallOrder).toHaveLength(0);
  });
});
