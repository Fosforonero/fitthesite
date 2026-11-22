/**
 * Giro completo Suunto in locale, contro un FINTO server Suunto che applica le
 * regole OAuth (RFC 6749 §4.1 e §6) che un server reale puo' applicare:
 *
 *   authorize -> callback (route vera) -> deep link -> app (modello) ->
 *   exchange (route vera) -> salvataggio -> rilettura -> rinnovo (route vera)
 *
 * Regole del finto Suunto: client_id e redirect_uri dell'autorizzazione uguali
 * a quelli registrati; scambio con HTTP Basic (id:segreto) e corpo
 * form-urlencoded; redirect_uri dello scambio identico a quello
 * dell'autorizzazione; code monouso e legato al client; refresh token ruotato
 * (il vecchio non vale piu'); il code emesso contiene un '+' LETTERALE nella
 * query del redirect (l'ipotesi della PR #123).
 *
 * L'app e' un MODELLO in TypeScript del lato Flutter (state monouso, lettura
 * della query come Uri.queryParameters di Dart, salvataggio per proprietario,
 * campi letti da OAuthToken.fromJson): non e' il codice Dart. Il lato Dart ha
 * le sue prove nel candidato. Nessun dato reale, nessuna rete.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as callback } from "./callback/route";
import { POST as exchange } from "./exchange/route";
import { POST as refresh } from "./refresh/route";

const REDIRECT = "https://www.fitmesh.fit/api/v1/oauth/suunto/callback";
const TOKEN_URL = "https://cloudapi-oauth.suunto.com/oauth/token";
const ID = "id-sintetico-0000";
const SEGRETO = "segreto-sintetico";

// ---------------------------------------------------------------- finto Suunto
type Emesso = { client: string; redirect: string; usato: boolean };

function creaFintoSuunto(opz: { codeConPiu: boolean }) {
  const codes = new Map<string, Emesso>();
  const refreshValidi = new Set<string>();
  let n = 0;
  const richiesteToken: Array<{ grant: string | null; esito: string }> = [];

  function jwtCon(exp: number): string {
    const p = Buffer.from(JSON.stringify({ exp, user: "utente-sintetico" })).toString("base64url");
    return `h.${p}.s`;
  }

  function errore(status: number, error: string): Response {
    return new Response(JSON.stringify({ error }), {
      status,
      headers: { "content-type": "application/json" },
    });
  }

  /** Pagina di autorizzazione: restituisce il Location del redirect. */
  function autorizza(url: string): string {
    const u = new URL(url);
    const q = u.searchParams;
    if (`${u.origin}${u.pathname}` !== "https://cloudapi-oauth.suunto.com/oauth/authorize") {
      throw new Error("authorize: endpoint sbagliato");
    }
    if (q.get("response_type") !== "code") throw new Error("authorize: response_type");
    if (q.get("client_id") !== ID) throw new Error("authorize: client sconosciuto");
    if (q.get("redirect_uri") !== REDIRECT) throw new Error("authorize: redirect non registrato");
    n++;
    // Un code con '+' e '/' LETTERALI nella query, come un base64 non codificato.
    const code = opz.codeConPiu ? `Qk${n}+x/Z9+w` : `Qk${n}xZ9w`;
    codes.set(code, { client: ID, redirect: q.get("redirect_uri")!, usato: false });
    const state = q.get("state");
    return `${REDIRECT}?code=${code}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
  }

  async function endpointToken(input: string, init: RequestInit): Promise<Response> {
    if (input !== TOKEN_URL) return errore(404, "not_found");
    const h = new Headers(init.headers);
    if ((init.method ?? "GET").toUpperCase() !== "POST") return errore(405, "invalid_request");
    const auth = h.get("authorization") ?? "";
    if (!auth.startsWith("Basic ")) return errore(401, "invalid_client");
    const [id, segreto] = Buffer.from(auth.slice(6), "base64").toString("utf8").split(":");
    if (id !== ID || segreto !== SEGRETO) return errore(401, "invalid_client");
    if (!(h.get("content-type") ?? "").startsWith("application/x-www-form-urlencoded")) {
      return errore(400, "invalid_request");
    }
    const corpo = new URLSearchParams(String(init.body));
    const grant = corpo.get("grant_type");
    const registra = (esito: string) => richiesteToken.push({ grant, esito });

    if (grant === "authorization_code") {
      const code = corpo.get("code");
      const redirect = corpo.get("redirect_uri");
      if (!code || !redirect) return (registra("invalid_request"), errore(400, "invalid_request"));
      const e = codes.get(code);
      if (!e || e.usato || e.client !== id || e.redirect !== redirect) {
        if (e) e.usato = true; // un code ripresentato si brucia comunque
        return (registra("invalid_grant"), errore(400, "invalid_grant"));
      }
      e.usato = true;
      const rt = `rt-${n}-${Math.random().toString(36).slice(2)}`;
      refreshValidi.add(rt);
      registra("ok");
      return new Response(
        JSON.stringify({
          access_token: jwtCon(Math.floor(Date.now() / 1000) + 86400),
          refresh_token: rt,
          token_type: "bearer",
          expires_in: 86400,
          user: "utente-sintetico",
        }),
        { status: 200 },
      );
    }
    if (grant === "refresh_token") {
      const rt = corpo.get("refresh_token");
      if (!rt) return (registra("invalid_request"), errore(400, "invalid_request"));
      if (!refreshValidi.has(rt)) return (registra("invalid_grant"), errore(400, "invalid_grant"));
      refreshValidi.delete(rt); // rotazione: il vecchio non vale piu'
      const nuovo = `${rt}-r`;
      refreshValidi.add(nuovo);
      registra("ok");
      return new Response(
        JSON.stringify({
          access_token: jwtCon(Math.floor(Date.now() / 1000) + 86400),
          refresh_token: nuovo,
          token_type: "bearer",
          expires_in: 86400,
        }),
        { status: 200 },
      );
    }
    registra("invalid_request");
    return errore(400, "invalid_request");
  }

  return { autorizza, endpointToken, richiesteToken };
}

// ------------------------------------------------------- modello dell'app
type TokenSalvato = {
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
  tokenType: string;
};

let ipSeq = 0;
function ip(): string {
  ipSeq++;
  return `10.77.${Math.floor(ipSeq / 250)}.${ipSeq % 250}`;
}

/** Imita OAuthToken.fromJson: `access_token` stringa obbligatoria, scadenza da `expires_at_ms` (int). */
function daJsonComeLApp(j: Record<string, unknown>): TokenSalvato {
  if (typeof j.access_token !== "string") throw new Error("cast: access_token");
  const ms = j.expires_at_ms;
  if (ms !== undefined && !Number.isInteger(ms)) throw new Error("cast: expires_at_ms non int");
  return {
    accessToken: j.access_token,
    refreshToken: typeof j.refresh_token === "string" ? j.refresh_token : "",
    expiresAtMs: (ms as number | undefined) ?? Date.now() + 3600_000,
    tokenType: typeof j.token_type === "string" ? j.token_type : "Bearer",
  };
}

function creaApp() {
  const statiPendenti = new Set<string>();
  const archivio = new Map<string, string>(); // proprietario -> JSON (secure storage)
  let scambi = 0;

  function urlDiAutorizzazione(): string {
    const state = `st-${Math.random().toString(36).slice(2)}`;
    statiPendenti.add(state);
    // Come Uri.replace(queryParameters:) nel provider Dart.
    const q = new URLSearchParams({
      response_type: "code",
      client_id: ID,
      redirect_uri: REDIRECT,
      state,
    });
    return `https://cloudapi-oauth.suunto.com/oauth/authorize?${q.toString()}`;
  }

  /** Ritorno via deep link. Esito: 'collegato' | 'state_rifiutato' | 'scambio_fallito'. */
  async function ritorno(deepLink: string, proprietario: string): Promise<string> {
    if (!deepLink.startsWith("fitmeshsync://suunto?")) return "schema_sconosciuto";
    // Uri.queryParameters di Dart: '+' -> spazio, %XX decodificato una volta.
    const q = new URLSearchParams(deepLink.slice("fitmeshsync://suunto?".length));
    const state = q.get("state");
    if (!state || !statiPendenti.has(state)) return "state_rifiutato";
    statiPendenti.delete(state); // monouso, PRIMA dello scambio
    const code = q.get("code");
    if (!code) return "senza_code";
    scambi++;
    const res = await exchange(
      new Request("https://www.fitmesh.fit/api/v1/oauth/suunto/exchange", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip() },
        body: JSON.stringify({ code }),
      }),
    );
    if (res.status !== 200) return "scambio_fallito";
    const t = daJsonComeLApp((await res.json()) as Record<string, unknown>);
    archivio.set(proprietario, JSON.stringify(t));
    return "collegato";
  }

  function rileggi(proprietario: string): TokenSalvato | null {
    const raw = archivio.get(proprietario);
    return raw ? (JSON.parse(raw) as TokenSalvato) : null;
  }

  async function rinnova(proprietario: string): Promise<number> {
    const t = rileggi(proprietario);
    if (!t) return -1;
    const res = await refresh(
      new Request("https://www.fitmesh.fit/api/v1/oauth/suunto/refresh", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip() },
        body: JSON.stringify({ refresh_token: t.refreshToken }),
      }),
    );
    if (res.status === 200) {
      const nuovo = daJsonComeLApp((await res.json()) as Record<string, unknown>);
      archivio.set(proprietario, JSON.stringify(nuovo));
    }
    return res.status;
  }

  return { urlDiAutorizzazione, ritorno, rileggi, rinnova, scambiFatti: () => scambi };
}

async function deepLinkDallaCallback(locationSuunto: string): Promise<string> {
  const res = await callback(new Request(locationSuunto));
  expect(res.status).toBe(302);
  return res.headers.get("location")!;
}

beforeEach(() => {
  process.env.SUUNTO_CLIENT_ID = ID;
  process.env.SUUNTO_CLIENT_SECRET = SEGRETO;
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.SUUNTO_CLIENT_ID;
  delete process.env.SUUNTO_CLIENT_SECRET;
});

describe("giro completo contro un finto Suunto con regole OAuth", () => {
  it("code con '+' letterale: collegato, salvato, riletto, rinnovato (e il refresh vecchio non vale piu')", async () => {
    const suunto = creaFintoSuunto({ codeConPiu: true });
    vi.stubGlobal("fetch", vi.fn(suunto.endpointToken));
    const app = creaApp();

    const location = suunto.autorizza(app.urlDiAutorizzazione());
    expect(location).toContain("+"); // la premessa: '+' letterale nella query
    const deepLink = await deepLinkDallaCallback(location);

    expect(await app.ritorno(deepLink, "proprietario-A")).toBe("collegato");
    const salvato = app.rileggi("proprietario-A");
    expect(salvato?.accessToken).toMatch(/^h\./);
    expect(Number.isInteger(salvato?.expiresAtMs)).toBe(true);
    expect(salvato!.expiresAtMs).toBeGreaterThan(Date.now());
    const refreshVecchio = salvato!.refreshToken;

    expect(await app.rinnova("proprietario-A")).toBe(200);
    const dopo = app.rileggi("proprietario-A")!;
    expect(dopo.refreshToken).not.toBe(refreshVecchio);
    expect(app.rileggi("proprietario-B")).toBeNull(); // per proprietario

    // Il refresh precedente e' stato ruotato: riusarlo e' rifiutato (502 verso l'app).
    const res = await refresh(
      new Request("https://www.fitmesh.fit/api/v1/oauth/suunto/refresh", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip() },
        body: JSON.stringify({ refresh_token: refreshVecchio }),
      }),
    );
    expect(res.status).toBe(502);
    expect(suunto.richiesteToken.map((r) => `${r.grant}:${r.esito}`)).toEqual([
      "authorization_code:ok",
      "refresh_token:ok",
      "refresh_token:invalid_grant",
    ]);
  });

  it("code senza caratteri speciali: stesso giro, stesso esito (comportamento della 191 invariato)", async () => {
    const suunto = creaFintoSuunto({ codeConPiu: false });
    vi.stubGlobal("fetch", vi.fn(suunto.endpointToken));
    const app = creaApp();
    const deepLink = await deepLinkDallaCallback(suunto.autorizza(app.urlDiAutorizzazione()));
    expect(await app.ritorno(deepLink, "p")).toBe("collegato");
    expect(await app.rinnova("p")).toBe(200);
  });

  it("doppia consegna dello stesso ritorno: lo state e' monouso, nessun secondo scambio", async () => {
    const suunto = creaFintoSuunto({ codeConPiu: true });
    vi.stubGlobal("fetch", vi.fn(suunto.endpointToken));
    const app = creaApp();
    const deepLink = await deepLinkDallaCallback(suunto.autorizza(app.urlDiAutorizzazione()));
    expect(await app.ritorno(deepLink, "p")).toBe("collegato");
    expect(await app.ritorno(deepLink, "p")).toBe("state_rifiutato");
    expect(app.scambiFatti()).toBe(1);
    expect(app.rileggi("p")).not.toBeNull(); // il collegamento riuscito resta
  });

  it("code monouso lato Suunto: un secondo scambio dello stesso code e' invalid_grant (502)", async () => {
    const suunto = creaFintoSuunto({ codeConPiu: true });
    vi.stubGlobal("fetch", vi.fn(suunto.endpointToken));
    const app = creaApp();
    const deepLink = await deepLinkDallaCallback(suunto.autorizza(app.urlDiAutorizzazione()));
    expect(await app.ritorno(deepLink, "p")).toBe("collegato");
    const code = new URLSearchParams(deepLink.split("?")[1]).get("code")!;
    const res = await exchange(
      new Request("https://www.fitmesh.fit/api/v1/oauth/suunto/exchange", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip() },
        body: JSON.stringify({ code }),
      }),
    );
    expect(res.status).toBe(502);
    expect(suunto.richiesteToken.at(-1)).toEqual({ grant: "authorization_code", esito: "invalid_grant" });
  });

  it("state sconosciuto (ritorno non avviato da questa app): rifiutato prima dello scambio", async () => {
    const suunto = creaFintoSuunto({ codeConPiu: true });
    vi.stubGlobal("fetch", vi.fn(suunto.endpointToken));
    const app = creaApp();
    const altra = creaApp();
    const deepLink = await deepLinkDallaCallback(suunto.autorizza(altra.urlDiAutorizzazione()));
    expect(await app.ritorno(deepLink, "p")).toBe("state_rifiutato");
    expect(suunto.richiesteToken).toHaveLength(0);
  });

  it("segreto del server diverso da quello registrato: Suunto risponde 401 invalid_client, non invalid_request", async () => {
    const suunto = creaFintoSuunto({ codeConPiu: false });
    vi.stubGlobal("fetch", vi.fn(suunto.endpointToken));
    process.env.SUUNTO_CLIENT_SECRET = "segreto-di-un-altro-client";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const app = creaApp();
    const deepLink = await deepLinkDallaCallback(suunto.autorizza(app.urlDiAutorizzazione()));
    expect(await app.ritorno(deepLink, "p")).toBe("scambio_fallito");
    const righe = warn.mock.calls.map((c) => String(c[0]));
    expect(righe.some((r) => r.includes('"suuntoStatus":401') && r.includes('"error":"invalid_client"'))).toBe(true);
  });

  it("la richiesta di scambio rispetta la forma documentata: Basic, form, tre chiavi, redirect identico all'autorizzazione", async () => {
    const suunto = creaFintoSuunto({ codeConPiu: true });
    const visto: Array<{ h: Headers; corpo: URLSearchParams }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (u: string, init: RequestInit) => {
        visto.push({ h: new Headers(init.headers), corpo: new URLSearchParams(String(init.body)) });
        return suunto.endpointToken(u, init);
      }),
    );
    const app = creaApp();
    const urlAuth = app.urlDiAutorizzazione();
    const deepLink = await deepLinkDallaCallback(suunto.autorizza(urlAuth));
    expect(await app.ritorno(deepLink, "p")).toBe("collegato");
    const { h, corpo } = visto[0];
    expect(h.get("authorization")).toBe(`Basic ${Buffer.from(`${ID}:${SEGRETO}`).toString("base64")}`);
    expect(h.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect([...corpo.keys()].sort()).toEqual(["code", "grant_type", "redirect_uri"]);
    expect(corpo.get("redirect_uri")).toBe(new URL(urlAuth).searchParams.get("redirect_uri"));
    expect(corpo.get("redirect_uri")!.endsWith("/")).toBe(false);
    expect(corpo.get("code")).toContain("+");
  });
});
