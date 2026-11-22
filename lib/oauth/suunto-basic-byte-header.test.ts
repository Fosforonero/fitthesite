/**
 * Byte dell'header Authorization Basic che FitMesh manda al token endpoint
 * Suunto, nelle due varianti:
 *   - prima richiesta: id e segreto GREZZI (comportamento in produzione);
 *   - ritentativo (solo dopo 400 invalid_request o 401 invalid_client):
 *     id e segreto codificati application/x-www-form-urlencoded, come chiede
 *     RFC 6749 §2.3.1.
 *
 * Qui non c'e' nessun finto server che decodifica: fetch risponde a copione e
 * il test legge solo cio' che FitMesh ha messo nell'header, decodifica il
 * Base64 e confronta BYTE per BYTE con stringhe attese scritte a mano. Non dice
 * nulla su come Suunto interpreti quei byte.
 *
 * Valori tutti sintetici.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exchangeSuuntoCode, refreshSuuntoToken } from "./suunto-backend";

const ID = "id-sintetico";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** fetch a copione: prima risposta `primo`, poi 200. Restituisce gli header Authorization visti. */
function copione(primo: Response) {
  const visti: string[] = [];
  let n = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_u: string, init: RequestInit) => {
      visti.push(new Headers(init.headers).get("authorization") ?? "");
      n += 1;
      return n === 1 ? primo : json(200, { access_token: "h.e30.s", refresh_token: "rt-2" });
    }),
  );
  return visti;
}

/** I byte dentro il Base64 dell'header, dopo il prefisso "Basic ". */
function byteDelBasic(header: string): Buffer {
  expect(header.startsWith("Basic ")).toBe(true);
  const b64 = header.slice("Basic ".length);
  expect(b64).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
  return Buffer.from(b64, "base64");
}

/** Confronto byte per byte, con un messaggio che indica il primo byte diverso. */
function stessiByte(visti: Buffer, attesi: Buffer) {
  let i = 0;
  while (i < Math.min(visti.length, attesi.length) && visti[i] === attesi[i]) i++;
  const dove = i === visti.length && i === attesi.length ? "identici" : `primo byte diverso all'indice ${i}`;
  expect(dove).toBe("identici");
  expect(Buffer.compare(visti, attesi)).toBe(0);
}

function credenziali(id: string, segreto: string) {
  process.env.SUUNTO_CLIENT_ID = id;
  process.env.SUUNTO_CLIENT_SECRET = segreto;
}

let log: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  log = vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.SUUNTO_CLIENT_ID;
  delete process.env.SUUNTO_CLIENT_SECRET;
});

/**
 * [descrizione, id, segreto, id codificato atteso, segreto codificato atteso]
 * Gli attesi sono scritti a mano dalla definizione WHATWG di
 * application/x-www-form-urlencoded: restano solo A-Za-z0-9 * - . _, lo spazio
 * diventa '+', ogni altro byte UTF-8 diventa %XX maiuscolo.
 */
const CASI: Array<[string, string, string, string, string]> = [
  [
    "riservati : / ? # [ ] @ ! $ & ' ( ) * + , ; =",
    ID,
    ":/?#[]@!$&'()*+,;=",
    ID,
    "%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29*%2B%2C%3B%3D",
  ],
  ["percento letterale, malformato e valido", ID, "Sg%zz%41", ID, "Sg%25zz%2541"],
  ["spazi -> '+'", ID, "Sg con  spazi", ID, "Sg+con++spazi"],
  ["tilde -> %7E", ID, "Sg~x", ID, "Sg%7Ex"],
  ["trattino, punto, underscore, asterisco restano", ID, "a-b.c_d*e f", ID, "a-b.c_d*e+f"],
  ["accentate (2 byte UTF-8)", ID, "àé", ID, "%C3%A0%C3%A9"],
  ["CJK (3 byte UTF-8)", ID, "日本", ID, "%E6%97%A5%E6%9C%AC"],
  ["emoji (4 byte UTF-8)", ID, "Sg😀", ID, "Sg%F0%9F%98%80"],
  ["due punti nell'id: codificati, la separazione id:segreto resta al primo ':'", "id:sint", "s:g", "id%3Asint", "s%3Ag"],
  ["caratteri speciali anche nell'id", "id é+%", "Sg", "id+%C3%A9%2B%25", "Sg"],
  ["segreto base64 tipico (+ / =)", ID, "Sg+a/b==", ID, "Sg%2Ba%2Fb%3D%3D"],
  ["lunghezza grande (4096 accentate)", ID, "é".repeat(4096), ID, "%C3%A9".repeat(4096)],
];

describe("byte dell'header Basic: grezzo al primo colpo, form-urlencoded nel ritentativo", () => {
  it.each(CASI)("%s", async (_d, id, segreto, idAtteso, segretoAtteso) => {
    credenziali(id, segreto);
    const visti = copione(json(400, { error: "invalid_request" }));
    await exchangeSuuntoCode("code-sintetico");
    expect(visti).toHaveLength(2);
    // prima richiesta: i byte UTF-8 grezzi di id:segreto (comportamento in produzione, invariato)
    stessiByte(byteDelBasic(visti[0]), Buffer.from(`${id}:${segreto}`, "utf8"));
    // ritentativo: solo ASCII, codificato secondo application/x-www-form-urlencoded
    const ritentativo = byteDelBasic(visti[1]);
    stessiByte(ritentativo, Buffer.from(`${idAtteso}:${segretoAtteso}`, "ascii"));
    expect([...ritentativo].every((b) => b >= 0x21 && b <= 0x7e)).toBe(true);
    // la separazione al primo ':' restituisce esattamente id e segreto codificati
    const testo = ritentativo.toString("ascii");
    expect(testo.slice(0, testo.indexOf(":"))).toBe(idAtteso);
    expect(testo.slice(testo.indexOf(":") + 1)).toBe(segretoAtteso);
  });

  it("anche dopo 401 invalid_client il ritentativo porta gli stessi byte codificati", async () => {
    credenziali(ID, "Sg con~");
    const visti = copione(json(401, { error: "invalid_client" }));
    await exchangeSuuntoCode("code-sintetico");
    stessiByte(byteDelBasic(visti[1]), Buffer.from(`${ID}:Sg+con%7E`, "ascii"));
  });

  it("il rinnovo usa la stessa codifica nel ritentativo", async () => {
    credenziali("id é", "a b~!");
    const visti = copione(json(400, { error: "invalid_request" }));
    await refreshSuuntoToken("rt-sintetico");
    expect(visti).toHaveLength(2);
    stessiByte(byteDelBasic(visti[0]), Buffer.from("id é:a b~!", "utf8"));
    stessiByte(byteDelBasic(visti[1]), Buffer.from("id+%C3%A9:a+b%7E%21", "ascii"));
  });

  it("id o segreto vuoti: configurazione mancante, nessuna richiesta a Suunto", async () => {
    for (const [id, segreto] of [["", "Sg"], [ID, ""], ["   ", "Sg"], [ID, " \t "]]) {
      credenziali(id, segreto);
      const visti = copione(json(400, { error: "invalid_request" }));
      await expect(exchangeSuuntoCode("c")).rejects.toThrow(/env Vercel/);
      expect(visti).toHaveLength(0);
    }
  });

  it("la riga di log del ritentativo dichiara variante ed esiti, senza id, segreto ne' loro codifiche", async () => {
    credenziali("id é", "Sg con%zz");
    copione(json(400, { error: "invalid_request" }));
    await exchangeSuuntoCode("code-sintetico");
    const righe = log.mock.calls.map((c) => String(c[0])).filter((r) => r.includes("suunto_oauth_basic"));
    expect(righe).toHaveLength(1);
    const riga = JSON.parse(righe[0]);
    expect(riga).toEqual({
      evt: "suunto_oauth_basic",
      route: "exchange",
      variante: "form_urlencoded_rfc6749",
      primo: "400 invalid_request",
      esito: 200,
      errore: null,
    });
    for (const vietato of ["id é", "id+%C3%A9", "Sg con%zz", "Sg+con%25zz", "code-sintetico"]) {
      expect(righe[0]).not.toContain(vietato);
    }
  });

  it("nessun ritentativo su 5xx, corpo non JSON o status/error incrociati", async () => {
    credenziali(ID, "Sg con%zz");
    const risposte: Array<() => Response> = [
      () => json(500, { error: "invalid_request" }),
      () => new Response("<html>503</html>", { status: 503, headers: { "content-type": "text/html" } }),
      () => new Response("bad request plain", { status: 400, headers: { "content-type": "text/plain" } }),
      () => json(401, { error: "invalid_request" }),
      () => json(400, { error: "invalid_client" }),
    ];
    for (const crea of risposte) {
      const visti = copione(crea());
      await expect(exchangeSuuntoCode("code-sintetico")).rejects.toThrow();
      expect(visti).toHaveLength(1);
    }
  });

  it("errore di rete al primo tentativo: nessuna seconda richiesta", async () => {
    credenziali(ID, "Sg con%zz");
    const fetchMock = vi.fn(async () => {
      throw new Error("timeout-primo");
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(exchangeSuuntoCode("code-sintetico")).rejects.toThrow("timeout-primo");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mai piu' di 2 richieste se anche il secondo tentativo fallisce (400 o 500)", async () => {
    credenziali(ID, "Sg con%zz");
    for (const secondoStatus of [400, 500]) {
      let chiamate = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          chiamate += 1;
          return chiamate === 1
            ? json(400, { error: "invalid_request" })
            : json(secondoStatus, { error: "server_error" });
        }),
      );
      await expect(exchangeSuuntoCode("code-sintetico")).rejects.toThrow();
      expect(chiamate).toBe(2);
    }
  });

  it("errore di rete o timeout sul ritentativo: logga suunto_oauth_basic con esito 'rete' e rilancia", async () => {
    credenziali("id é", "Sg con%zz");
    let chiamate = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        chiamate += 1;
        if (chiamate === 1) return json(400, { error: "invalid_request" });
        throw new Error("timeout-ritentativo");
      }),
    );
    await expect(exchangeSuuntoCode("code-sintetico")).rejects.toThrow("timeout-ritentativo");
    expect(chiamate).toBe(2);
    const righe = log.mock.calls.map((c) => String(c[0])).filter((r) => r.includes("suunto_oauth_basic"));
    expect(righe).toHaveLength(1);
    expect(JSON.parse(righe[0])).toEqual({
      evt: "suunto_oauth_basic",
      route: "exchange",
      variante: "form_urlencoded_rfc6749",
      primo: "400 invalid_request",
      esito: "rete",
      errore: null,
    });
  });
});
