import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn((..._args: unknown[]) => ({ auth: {} }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

describe("createRecoveryClient", () => {
  beforeEach(() => {
    createClientMock.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("is isolated: persistSession/autoRefreshToken/detectSessionInUrl all disabled", async () => {
    const { createRecoveryClient } = await import("./recovery-client");
    createRecoveryClient();

    expect(createClientMock).toHaveBeenCalledTimes(1);
    const [, , options] = createClientMock.mock.calls[0] as [string, string, { auth: Record<string, unknown> }];
    expect(options.auth).toEqual({
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    });
  });

  it("never touches the site's shared/cookie-backed client module", async () => {
    // Se questo file importasse mai `./client` (il singleton cookie-backed del
    // sito), un cambio di sessione ordinaria potrebbe influenzare il recovery
    // flow. L'assenza dell'import e' garantita staticamente in questo modulo:
    // qui verifichiamo che la creazione non passi MAI per quel modulo.
    const clientModule = await import("./client");
    const spy = vi.spyOn(clientModule, "createClient");
    const { createRecoveryClient } = await import("./recovery-client");
    createRecoveryClient();
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns a brand-new instance on every call (no module-level cache/singleton)", async () => {
    const { createRecoveryClient } = await import("./recovery-client");
    createRecoveryClient();
    createRecoveryClient();
    expect(createClientMock).toHaveBeenCalledTimes(2);
  });
});
