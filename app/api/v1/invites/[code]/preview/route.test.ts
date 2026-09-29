/**
 * API di anteprima dell'invito: risposta COSTANTE.
 *
 * Cosa NON viene esposto: niente nome del gruppo, niente tipo, niente numero
 * di membri, niente scadenza, e niente che distingua un codice da un altro.
 * Il test lo prova cosi': per ogni classe di codice (tutti sintetici) la
 * risposta e' identica in stato, corpo e intestazioni, e il database non viene
 * mai toccato.
 *
 * Mutazioni che lo rendono rosso (provate a mano il 29/09/2026):
 *   - rimettere `createClient(` nell'handler  -> "nessun client Supabase"
 *   - leggere `SUPABASE_SERVICE_ROLE_KEY`      -> "nessuna variabile letta"
 *   - far dipendere stato o corpo dal codice   -> "risposte identiche"
 *   - togliere `no-store` o `x-robots-tag`     -> "intestazioni fisse"
 *   - esportare anche POST                     -> "solo GET"
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CLASSI_DI_CODICE, spiaAmbiente } from "@/test/invito-pubblico-trappola";

const trappola = vi.hoisted(() => ({
  costruiti: [] as string[],
}));

// Qualunque client Supabase costruito fa rosso il test: si registra e si lancia.
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => {
    trappola.costruiti.push("supabase-js");
    throw new Error(`client Supabase costruito (${args.length} argomenti)`);
  },
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => {
    trappola.costruiti.push("ssr");
    throw new Error("client Supabase SSR costruito");
  },
}));

import * as modulo from "./route";

type Handler = (...args: unknown[]) => Promise<Response>;

async function chiama(codice: string, metodo = "GET") {
  const url = `http://localhost/api/v1/invites/${encodeURIComponent(codice)}/preview`;
  const risposta = await (modulo.GET as unknown as Handler)(
    new Request(url, { method: metodo }),
    { params: Promise.resolve({ code: codice }) },
  );
  return {
    stato: risposta.status,
    corpo: await risposta.text(),
    intestazioni: [...risposta.headers.entries()].sort(([a], [b]) => a.localeCompare(b)),
  };
}

let spia: ReturnType<typeof spiaAmbiente>;

beforeEach(() => {
  trappola.costruiti.length = 0;
  spia = spiaAmbiente();
});
afterEach(() => {
  spia.ripristina();
});

describe("API di anteprima invito: risposta costante", () => {
  it("nessun client Supabase costruito, per nessuna classe di codice", async () => {
    for (const codice of Object.values(CLASSI_DI_CODICE)) await chiama(codice);
    expect(trappola.costruiti).toEqual([]);
  });

  it("nessuna variabile di Supabase o della chiave di servizio viene letta", async () => {
    for (const codice of Object.values(CLASSI_DI_CODICE)) await chiama(codice);
    expect(spia.lette).toEqual([]);
  });

  it("risposte identiche per valido simulato, scaduto, esaurito, inesistente, malformato e lunghissimo", async () => {
    const risposte = await Promise.all(
      Object.entries(CLASSI_DI_CODICE).map(async ([classe, codice]) => [classe, await chiama(codice)] as const),
    );
    const [, riferimento] = risposte[0];
    for (const [classe, r] of risposte) {
      expect(r, `classe ${classe}`).toEqual(riferimento);
    }
  });

  it("stato, corpo e intestazioni sono quelli attesi e fissi", async () => {
    const r = await chiama(CLASSI_DI_CODICE.inesistente);
    expect(r.stato).toBe(404);
    expect(JSON.parse(r.corpo)).toEqual({ error: "not_available" });
    const intestazioni = Object.fromEntries(r.intestazioni);
    expect(intestazioni["cache-control"]).toBe("no-store");
    expect(intestazioni["x-robots-tag"]).toBe("noindex");
    expect(intestazioni["content-type"]).toContain("application/json");
  });

  it("il corpo non contiene nessun campo dell'anteprima ne' il codice", async () => {
    for (const codice of Object.values(CLASSI_DI_CODICE)) {
      const { corpo } = await chiama(codice);
      expect(corpo).not.toMatch(/group_name|group_type|members_count|expires_at|not_found|expired|exhausted|invalid_format/);
      expect(corpo).not.toContain(codice);
    }
  });

  it("esporta solo GET: gli altri metodi restano i 405 uniformi del framework", () => {
    const metodi = ["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
    for (const m of metodi) {
      expect((modulo as Record<string, unknown>)[m], `metodo ${m}`).toBeUndefined();
    }
    expect(typeof modulo.GET).toBe("function");
  });

  it("la route non e' mai prerenderizzata ne' messa in cache", () => {
    expect(modulo.dynamic).toBe("force-dynamic");
  });
});
