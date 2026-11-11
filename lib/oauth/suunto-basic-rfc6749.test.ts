/**
 * Credenziali del client nell'header Basic. Tre fonti distinte:
 *
 * - RFC 6749 §2.3.1 (e Appendice B) chiede di codificare id e segreto con
 *   application/x-www-form-urlencoded PRIMA del Base64; il server li decodifica.
 * - La documentazione Suunto (FAQ, API Zone) descrive Basic con un esempio che
 *   non contiene caratteri speciali: non dice se Suunto decodifica.
 * - Il finto server qui sotto e' un MODELLO di Spring Authorization Server
 *   (ClientSecretBasicAuthenticationConverter: URLDecoder.decode su id e
 *   segreto; eccezione di decodifica -> 400 invalid_request prima di cercare il
 *   client). Che Suunto usi Spring AS e' solo un indizio (il code di 128
 *   caratteri base64url coincide con il generatore predefinito da 96 byte).
 *
 * Contro QUESTO modello, un segreto con un '%' non seguito da due cifre
 * esadecimali da' 400 invalid_request a ogni richiesta (code vero, code o
 * refresh inventati), come osservato in Production il 10-11/11; un '+' diventa
 * spazio -> 401 invalid_client. La somiglianza rende l'ipotesi PLAUSIBILE, NON
 * DIMOSTRATA: questi test provano il comportamento del nostro codice contro il
 * modello, non quello di Suunto.
 *
 * Valori tutti sintetici. Nessuna rete. I byte esatti dell'header sono in
 * suunto-basic-byte-header.test.ts, la codifica in form-urlencoded.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SuuntoApiError,
  exchangeSuuntoCode,
  refreshSuuntoToken,
} from "./suunto-backend";

const TOKEN_URL = "https://cloudapi-oauth.suunto.com/oauth/token";
const REDIRECT = "https://www.fitmesh.fit/api/v1/oauth/suunto/callback";
const ID = "0b8d9000-sint-etic-o000-00000000f5b3";

/** Come java.net.URLDecoder.decode(s, UTF-8): '+' -> spazio, %XX, eccezione se malformato. */
function urlDecoderJava(s: string): string {
  const byte: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "+") byte.push(0x20);
    else if (c === "%") {
      const hex = s.slice(i + 1, i + 3);
      if (!/^[0-9A-Fa-f]{2}$/.test(hex)) throw new Error("URLDecoder: Illegal hex characters in escape (%) pattern");
      byte.push(parseInt(hex, 16));
      i += 2;
    } else byte.push(...Buffer.from(c, "utf8"));
  }
  return Buffer.from(byte).toString("utf8");
}

function errore(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });
}

/**
 * Token endpoint con l'ordine dei controlli di Spring Authorization Server.
 * `decodifica: false` = server che NON applica RFC 6749 §2.3.1 (prende id e
 * segreto grezzi, come suggerisce il `curl --user` della documentazione).
 */
function creaFintoSpringAS(
  segretoRegistrato: string,
  codesValidi: string[],
  opz: { decodifica?: boolean; id?: string } = {},
) {
  const decodifica = opz.decodifica ?? true;
  const idRegistrato = opz.id ?? ID;
  const codes = new Set(codesValidi);
  const refresh = new Set<string>();
  return async (url: string, init: RequestInit): Promise<Response> => {
    if (url !== TOKEN_URL) return errore(404, "not_found");
    const h = new Headers(init.headers);
    // 1) conversione dell'header Basic (OAuth2ClientAuthenticationFilter)
    const parts = (h.get("authorization") ?? "").split(/\s/);
    if (parts[0]?.toLowerCase() !== "basic") return errore(401, "invalid_client");
    if (parts.length !== 2) return errore(400, "invalid_request");
    const cred = Buffer.from(parts[1], "base64").toString("utf8");
    const i = cred.indexOf(":");
    if (i <= 0 || i === cred.length - 1) return errore(400, "invalid_request");
    let id: string;
    let segreto: string;
    try {
      id = decodifica ? urlDecoderJava(cred.slice(0, i)) : cred.slice(0, i);
      segreto = decodifica ? urlDecoderJava(cred.slice(i + 1)) : cred.slice(i + 1);
    } catch {
      return errore(400, "invalid_request");
    }
    // 2) autenticazione del client
    if (!id.trim() || !segreto.trim()) return errore(400, "invalid_request"); // hasText
    if (id !== idRegistrato || segreto !== segretoRegistrato) return errore(401, "invalid_client");
    // 3) parametri del grant
    const corpo = new URLSearchParams(String(init.body));
    const grant = corpo.get("grant_type");
    if (!grant) return errore(400, "invalid_request");
    if (grant === "authorization_code") {
      const code = corpo.get("code");
      if (!code) return errore(400, "invalid_request");
      if (!codes.has(code) || corpo.get("redirect_uri") !== REDIRECT) return errore(400, "invalid_grant");
      codes.delete(code);
      refresh.add("rt-1");
      return new Response(
        JSON.stringify({ access_token: "h.e30.s", refresh_token: "rt-1", token_type: "bearer", expires_in: 86400 }),
        { status: 200 },
      );
    }
    if (grant === "refresh_token") {
      const rt = corpo.get("refresh_token");
      if (!rt) return errore(400, "invalid_request");
      if (!refresh.has(rt)) return errore(400, "invalid_grant");
      return new Response(JSON.stringify({ access_token: "h.e30.s", refresh_token: "rt-2" }), { status: 200 });
    }
    return errore(400, "unsupported_grant_type");
  };
}

async function esitoScambio(code: string): Promise<string> {
  try {
    await exchangeSuuntoCode(code);
    return "200";
  } catch (e) {
    if (e instanceof SuuntoApiError) return `${e.suuntoStatus} ${JSON.parse(e.suuntoBody).error}`;
    throw e;
  }
}

async function esitoRinnovo(rt: string): Promise<string> {
  try {
    await refreshSuuntoToken(rt);
    return "200";
  } catch (e) {
    if (e instanceof SuuntoApiError) return `${e.suuntoStatus} ${JSON.parse(e.suuntoBody).error}`;
    throw e;
  }
}

/** Installa il finto server; restituisce gli esiti di OGNI richiesta, in ordine. */
function usaSegreto(
  segreto: string,
  codes: string[] = ["code-vero-sintetico"],
  opz: { decodifica?: boolean; id?: string } = {},
) {
  process.env.SUUNTO_CLIENT_ID = opz.id ?? ID;
  process.env.SUUNTO_CLIENT_SECRET = segreto;
  const server = creaFintoSpringAS(segreto, codes, opz);
  const esiti: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (u: string, init: RequestInit) => {
      const r = await server(u, init);
      const t = await r.clone().text();
      esiti.push(r.status === 200 ? "200" : `${r.status} ${JSON.parse(t).error}`);
      return r;
    }),
  );
  return esiti;
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.SUUNTO_CLIENT_ID;
  delete process.env.SUUNTO_CLIENT_SECRET;
});

describe("Basic del token endpoint Suunto: grezzo, poi un solo ritentativo RFC 6749 §2.3.1", () => {
  it("segreto con '%' non esadecimale: il grezzo e' 400 invalid_request (la firma di Production), il codificato riesce", async () => {
    const esiti = usaSegreto("Sg%zz-sintetico");
    expect(await esitoScambio("code-vero-sintetico")).toBe("200");
    expect(esiti).toEqual(["400 invalid_request", "200"]);
  });

  it("segreto con '%': code e refresh inventati passano da invalid_request a invalid_grant", async () => {
    const esiti = usaSegreto("Sg%zz-sintetico");
    expect(await esitoScambio("code-inventato")).toBe("400 invalid_grant");
    expect(await esitoRinnovo("refresh-inventato")).toBe("400 invalid_grant");
    expect(esiti).toEqual(["400 invalid_request", "400 invalid_grant", "400 invalid_request", "400 invalid_grant"]);
  });

  it("'%' malformato nel client id: stessa firma, stessa correzione", async () => {
    const esiti = usaSegreto("Sg-sintetico", ["code-vero-sintetico"], { id: "id%g-sintetico" });
    expect(await esitoScambio("code-vero-sintetico")).toBe("200");
    expect(esiti).toEqual(["400 invalid_request", "200"]);
  });

  it("segreto con '+' e '/': il grezzo e' 401 invalid_client, il codificato riesce", async () => {
    const esiti = usaSegreto("Sg+a/b=sintetico");
    expect(await esitoScambio("code-vero-sintetico")).toBe("200");
    expect(esiti).toEqual(["401 invalid_client", "200"]);
  });

  it("segreto con '%41' valido: non diventa un altro segreto", async () => {
    usaSegreto("Sg%41sintetico");
    expect(await esitoScambio("code-vero-sintetico")).toBe("200");
  });

  it("rinnovo di un collegamento esistente con segreto '%': riesce", async () => {
    usaSegreto("Sg%zz-sintetico");
    expect(await esitoScambio("code-vero-sintetico")).toBe("200");
    expect(await esitoRinnovo("rt-1")).toBe("200");
  });

  it("server che NON decodifica e segreto base64 (+/=): il grezzo riesce al primo colpo, nessun ritentativo (nessuna regressione)", async () => {
    const esiti = usaSegreto("Sg+a/b==", ["code-vero-sintetico"], { decodifica: false });
    expect(await esitoScambio("code-vero-sintetico")).toBe("200");
    expect(await esitoRinnovo("rt-1")).toBe("200");
    expect(esiti).toEqual(["200", "200"]);
  });

  it("segreto sbagliato davvero: al massimo due richieste, l'errore resta invalid_client (502 verso l'app)", async () => {
    const esiti = usaSegreto("Sg+giusto");
    process.env.SUUNTO_CLIENT_SECRET = "Sg+sbagliato";
    expect(await esitoScambio("code-vero-sintetico")).toBe("401 invalid_client");
    expect(esiti).toEqual(["401 invalid_client", "401 invalid_client"]);
  });

  it("id e segreto con soli caratteri non riservati: UNA richiesta, header byte per byte identico a prima (nessun cambio per la 191)", async () => {
    const segreto = "Sg_AZaz09-.~!*'()sintetico";
    usaSegreto(segreto, ["c"]);
    const visti: string[] = [];
    const server = creaFintoSpringAS(segreto, ["c"]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (u: string, init: RequestInit) => {
        visti.push(new Headers(init.headers).get("authorization")!);
        return server(u, init);
      }),
    );
    expect(await esitoScambio("c")).toBe("200");
    expect(visti).toEqual([`Basic ${Buffer.from(`${ID}:${segreto}`).toString("base64")}`]);
  });

  it("errore che non riguarda il client (invalid_grant): nessun ritentativo", async () => {
    const esiti = usaSegreto("Sg%zz-sintetico", []);
    process.env.SUUNTO_CLIENT_SECRET = "Sg%zz-sintetico";
    expect(await esitoScambio("code-inventato")).toBe("400 invalid_grant");
    expect(esiti).toHaveLength(2); // grezzo invalid_request -> codificato invalid_grant, poi stop
  });

  it("segreto alfanumerico sbagliato: UNA sola richiesta (le due forme coincidono, ritentare non serve)", async () => {
    const esiti = usaSegreto("SgGiusto0");
    process.env.SUUNTO_CLIENT_SECRET = "SgSbagliato0";
    expect(await esitoScambio("code-vero-sintetico")).toBe("401 invalid_client");
    expect(esiti).toEqual(["401 invalid_client"]);
  });

  it("invalid_grant al primo colpo (client autenticato, code inventato): nessun ritentativo anche se le forme differiscono", async () => {
    const esiti = usaSegreto("Sg+a/b==", [], { decodifica: false });
    expect(await esitoScambio("code-inventato")).toBe("400 invalid_grant");
    expect(esiti).toEqual(["400 invalid_grant"]);
  });

  it("segreto di soli spazi nella variabile: errore di configurazione del server, nessuna chiamata a Suunto", async () => {
    usaSegreto("   ");
    await expect(exchangeSuuntoCode("c")).rejects.toThrow(/env Vercel/);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});
