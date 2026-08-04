import { describe, expect, it } from "vitest";
import { config } from "./middleware";

/**
 * P0.9 — test strutturale del matcher del middleware.
 *
 * Non riproduce il compilatore path-to-regexp di Next.js (richiederebbe un
 * server reale — coperto invece da tools/check-locale-routing.ts e
 * tools/check-anti-loop-locale-routing.ts contro un vero `next start`).
 * Questo test verifica invece, come JS RegExp puro, l'unico pattern del
 * matcher che e' gia' sintassi regex pura (nessuno shorthand path-to-regexp
 * tipo `:path*`) — il piu' a rischio di bug di confine (es. `de` che
 * matcha `delete-account` come prefisso letterale invece che come locale
 * esatta) perche' e' l'unico scritto a mano carattere per carattere.
 */

// Il secondo entry del matcher e' il pattern "deep link senza locale" a
// singola regex — stesso indice della sua posizione in middleware.ts.
const DEEP_LINK_PATTERN = config.matcher[1];

function compile(pattern: string): RegExp {
  // Next.js matcher patterns non hanno gli ancoraggi ^...$ (li applica lui
  // internamente insieme al resto della pipeline path-to-regexp) — per un
  // test isolato serve ancorarli esplicitamente.
  return new RegExp(`^${pattern}$`);
}

describe("middleware matcher — deep link pattern (regex puro)", () => {
  const re = compile(DEEP_LINK_PATTERN);

  it("matches unprefixed deep links needing negotiation", () => {
    expect(re.test("/")).toBe(true);
    expect(re.test("/famiglia/join/MESH-1234")).toBe(true);
    expect(re.test("/some-random-deep-link")).toBe(true);
  });

  it("matches /nb and /nn (Norwegian canonicalization, P0.8)", () => {
    expect(re.test("/nb")).toBe(true);
    expect(re.test("/nb/blog/fitmesh-arriva-su-iphone")).toBe(true);
    expect(re.test("/nn/blog/fitmesh-arriva-su-iphone")).toBe(true);
  });

  it("excludes all 15 real locale prefixes (exact and with subpath)", () => {
    const locales = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"];
    for (const l of locales) {
      expect(re.test(`/${l}`)).toBe(false);
      expect(re.test(`/${l}/blog/some-post`)).toBe(false);
    }
  });

  it("does NOT falsely exclude paths that merely start with a locale code as a substring", () => {
    // Regression guard: without a segment boundary, 'de' would match
    // 'delete-account' as a literal prefix, and 'no' would match a
    // hypothetical '/nordic-guide' — both must be treated on their own
    // terms, not as a false-positive locale match.
    expect(re.test("/italy-guide")).toBe(true); // starts with "it" but isn't the it locale
    expect(re.test("/nordic-guide")).toBe(true); // starts with "no" but isn't the no locale
    // /delete-account IS excluded, but via its own explicit alternative,
    // not because "de" happens to prefix it — verified in the next test.
  });

  it("excludes system routes that no longer need the middleware", () => {
    expect(re.test("/delete-account")).toBe(false);
    expect(re.test("/delete-account/")).toBe(false);
    expect(re.test("/cms/some-admin-path")).toBe(false);
    expect(re.test("/oauth/strava-callback")).toBe(false);
    expect(re.test("/mockups/dashboard")).toBe(false);
    expect(re.test("/.well-known/assetlinks.json")).toBe(false);
    // Addendum pre-merge PR#39: /self-host bare deve rispondere 200 diretto
    // sulla stringa letterale usata dall'app — stesso pattern non-i18n di
    // /delete-account, quindi stessa esclusione dal matcher.
    expect(re.test("/self-host")).toBe(false);
    expect(re.test("/self-host/")).toBe(false);
  });

  it("does NOT falsely exclude paths that merely start with 'self-host' as a substring vs a real segment boundary", () => {
    // Regression guard, stesso principio del test 'de' vs 'delete-account'
    // sopra: 'self-host-guide' non e' la route /self-host, deve restare
    // soggetto alla negoziazione lingua generica.
    expect(re.test("/self-hosting-guide")).toBe(true);
  });

  it("excludes /api entirely (rate-limited endpoints are matched by their own explicit entries instead)", () => {
    expect(re.test("/api/v1/sync")).toBe(false);
    expect(re.test("/api/v1/oauth/strava/exchange")).toBe(false);
    expect(re.test("/api/apple-app-site-association")).toBe(false);
  });

  it("excludes Next.js internals and static assets", () => {
    expect(re.test("/_next/static/chunks/main.js")).toBe(false);
    expect(re.test("/_next/image")).toBe(false);
    expect(re.test("/favicon.ico")).toBe(false);
    expect(re.test("/logo-192.png")).toBe(false);
    expect(re.test("/icon-square-128.png")).toBe(false);
  });
});

describe("middleware matcher — explicit identity list (path-to-regexp entries)", () => {
  // Questi usano shorthand path-to-regexp (`:path*`, alternanza locale in
  // un gruppo non-catturante fuori da una regex pura) — non compilabili
  // come JS RegExp diretta. Verificati per PRESENZA esplicita nella lista
  // (identita', non conteggio) cosi' una rimozione accidentale di uno di
  // questi entry fa fallire il test, e per comportamento reale via
  // tools/check-locale-routing.ts / check-anti-loop-locale-routing.ts
  // contro un vero `next start`.
  it("keeps exactly the rate-limited API endpoints still handled by the middleware", () => {
    expect(config.matcher).toContain("/api/v1/beta/signup");
    expect(config.matcher).toContain("/api/v1/invites/:path*");
  });

  it("no longer matches /api/v1/sync (P0.10C — rate limit moved into the route itself, avoids a double Middleware+Function Fast Origin Transfer hop)", () => {
    expect(config.matcher).not.toContain("/api/v1/sync");
    expect(config.matcher.some((m) => m.includes("v1/sync"))).toBe(false);
  });

  it("keeps famiglia/join covered both with and without a locale prefix", () => {
    expect(config.matcher).toContain("/famiglia/join/:code*");
    expect(config.matcher.some((m) => m.includes("famiglia/join") && m.includes("app|admin") === false && /it|en/.test(m) && m !== "/famiglia/join/:code*")).toBe(true);
  });

  it("keeps the protected /[locale]/app and /[locale]/admin entry", () => {
    expect(config.matcher.some((m) => m.includes("app|admin"))).toBe(true);
  });

  it("keeps the root entry", () => {
    expect(config.matcher).toContain("/");
  });

  it("no longer contains the removed x-fitmesh-locale-only catch-all shape (sanity: matcher length is the new narrow list, not the old single entry)", () => {
    expect(config.matcher.length).toBeGreaterThan(1);
  });

  /**
   * Hotfix P0.10R. Il rate limit di /api/v1/auth/forgot-password vive
   * INTERAMENTE dentro la route (vedi app/api/v1/auth/forgot-password/
   * route.ts): applicarlo anche qui significherebbe che la richiesta
   * attraversa sia il Middleware sia la Function per lo stesso limite,
   * doppio hop e doppio conteggio Fast Origin Transfer, oltre a un secondo
   * punto dove l'esito potrebbe accidentalmente diventare osservabile
   * (header diversi, timing diverso fra i due livelli).
   */
  it("does not rate-limit /api/v1/auth/forgot-password itself (single hop, handled entirely in the route)", () => {
    expect(config.matcher).not.toContain("/api/v1/auth/forgot-password");
    const middlewareSource = require("node:fs").readFileSync(
      require("node:path").join(__dirname, "middleware.ts"),
      "utf8",
    ) as string;
    expect(middlewareSource).not.toMatch(/pathname === ['"]\/api\/v1\/auth\/forgot-password['"]/);
  });
});
