// La cessione iOS concede accesso Pro. Quindi la proprieta' da bloccare non
// e' "funziona", e' "quando non funziona, NON apre".
//
// Un difetto che nega per sbaglio costa una persona bloccata, recuperabile.
// Un difetto che concede per sbaglio costa il paywall intero.

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mocks.createAdminClient(),
}));

const { concediPonteIos } = await import("./cessione-ios");

describe("cessione iOS — quando non funziona, non apre", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAdminClient.mockReturnValue({ rpc: mocks.rpc });
  });

  it("concede solo quando la funzione dice esattamente true", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    await expect(concediPonteIos("utente-1")).resolves.toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("concedi_ponte_ios", {
      p_user_id: "utente-1",
    });
  });

  it("false resta false", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    await expect(concediPonteIos("utente-1")).resolves.toBe(false);
  });

  it("un errore della funzione non concede", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "42501" } });
    await expect(concediPonteIos("utente-1")).resolves.toBe(false);
  });

  it("se la chiamata esplode non concede, e non propaga l'eccezione", async () => {
    // Deve restare un 403 sul sync, mai un 500: il chiamante non ha un
    // try/catch attorno.
    mocks.rpc.mockRejectedValue(new Error("rete giu'"));
    await expect(concediPonteIos("utente-1")).resolves.toBe(false);
  });

  it("se manca il client di servizio non concede", async () => {
    mocks.createAdminClient.mockImplementation(() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY assente");
    });
    await expect(concediPonteIos("utente-1")).resolves.toBe(false);
  });

  it("una risposta ambigua non vale un si", async () => {
    // La funzione Postgres ritorna boolean. Qualunque altra cosa arrivi
    // (null, stringhe, oggetti) e' un contratto rotto, e un contratto rotto
    // non concede accesso.
    for (const risposta of [null, undefined, "true", 1, {}, []]) {
      mocks.rpc.mockResolvedValue({ data: risposta, error: null });
      await expect(concediPonteIos("utente-1")).resolves.toBe(false);
    }
  });
});
