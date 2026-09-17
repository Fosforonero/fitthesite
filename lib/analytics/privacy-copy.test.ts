import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { ABOUT_COPY } from "@/lib/content/about-copy";
import { GA_SCRIPT_SRC } from "@/lib/analytics/consent";

/**
 * P0.24-A: il testo pubblico descrive il comportamento implementato.
 *  - nessuna pagina nega l'uso di Google Analytics;
 *  - About, Cookie Policy e Privacy Policy dicono «solo dopo il consenso» e
 *    indicano lo stesso pulsante di revoca che il sito mostra; la Cookie
 *    Policy dice che dopo la revoca, o entrando in una route esclusa, la
 *    pagina si ricarica senza il tag;
 *  - l'unico punto che carica GA e' lib/analytics/consent.ts, e il root
 *    layout non contiene piu' il Consent Mode che inviava ping prima del
 *    consenso;
 *  - la landing Fitbit non promette piu' una cancellazione totale, una copia
 *    dello storico o il supporto di Ace.
 */

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const LOCALES = ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"] as const;
const POLICY_LOCALES = ["it", "en", "es", "de", "pt", "fr"] as const;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(join(ROOT, dir))) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx|json)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) out.push(rel);
  }
  return out;
}
const SOURCES = [...walk("app"), ...walk("components"), ...walk("lib")];

// Negazioni dell'uso di GA, nelle forme usate dal sito fino al 17/09/2026.
// `\b` in JavaScript e' solo ASCII: non vale davanti a «Ż», da qui il gruppo esplicito.
const GA_DENIAL =
  /(?:^|[\s.,;:!?"«“„(])(?:no|nessuna integrazione con|sin|kein|sem|pas de|żadnego|geen|ingen|ei)\s+google analytics|google analytics\s*(?:yok\b|も[、,]|도[,、])/i;

const dict = (l: string) => JSON.parse(read(`lib/dictionaries/${l}.json`)) as { cookie_banner: Record<string, string> };

describe("nessuna negazione dell'uso di Google Analytics", () => {
  it("nessun file sorgente pubblicato contiene una negazione", () => {
    const hits = SOURCES.filter((f) => GA_DENIAL.test(read(f))).map((f) => relative(ROOT, join(ROOT, f)));
    expect(hits).toEqual([]);
  });

  it("il rilevatore riconosce le vecchie frasi (controllo del test)", () => {
    for (const old of [
      "FitMesh does not sell, share, or profile. No Google Analytics, no Meta SDK, no ad networks.",
      "FitMesh non vende, non condivide, non profila. Nessuna integrazione con Google Analytics, Meta SDK, o ad network.",
      "FitMesh no vende, no comparte ni crea perfiles. Sin Google Analytics, sin Meta SDK, sin redes publicitarias.",
      "FitMesh verkauft, teilt und profiliert nicht. Kein Google Analytics, kein Meta SDK, keine Werbenetzwerke.",
      "FitMesh não vende, não compartilha e não cria perfis. Sem Google Analytics, sem Meta SDK, sem redes de publicidade.",
      "FitMesh ne vend pas, ne partage pas et ne profile pas. Pas de Google Analytics, pas de Meta SDK, pas de réseaux publicitaires.",
      "FitMesh ich nie sprzedaje, nie udostępnia i nie profiluje. Żadnego Google Analytics, żadnego SDK Meta, żadnych sieci reklamowych.",
      "FitMesh verilerinizi satmaz, paylaşmaz ve profillemez. Google Analytics yok, Meta SDK yok, reklam ağı yok.",
      "FitMesh verkoopt ze niet, deelt ze niet en gebruikt ze niet voor profilering. Geen Google Analytics, geen Meta SDK, geen advertentienetwerken.",
      "FitMeshはデータを販売せず、共有せず、プロファイリングもしません。Google Analyticsも、Meta SDKも、広告ネットワークも一切使用していません。",
      "FitMesh는 데이터를 판매하거나 공유하거나 프로파일링하지 않습니다. Google Analytics도, Meta SDK도, 광고 네트워크도 없습니다.",
      "FitMesh säljer inte, delar inte och profilerar inte. Ingen Google Analytics, ingen Meta SDK, inga annonsnätverk.",
      "FitMesh sælger, deler eller profilerer ikke dig. Ingen Google Analytics, intet Meta SDK, ingen annoncenetværk.",
      "FitMesh selger dem ikke, deler dem ikke og profilerer dem ikke. Ingen Google Analytics, ingen Meta SDK, ingen annonsenettverk.",
      "FitMesh ei myy, jaa eikä profiloi niitä. Ei Google Analyticsia, ei Meta SDK:ta, ei mainosverkostoja.",
    ]) {
      expect(GA_DENIAL.test(old), old).toBe(true);
    }
  });
});

describe("About, Cookie Policy, Privacy Policy e banner dicono la stessa cosa", () => {
  it("About: ogni lingua dice che GA4 si usa solo dopo il consenso e nomina il pulsante di revoca", () => {
    for (const l of LOCALES) {
      const text = ABOUT_COPY.privacyBody1[l];
      expect(text, l).toContain("Google Analytics 4");
      expect(text, l).toContain(dict(l).cookie_banner.preferences);
    }
  });

  it("Cookie Policy: nessuna procedura DevTools, nessun Consent Mode, nessuna dichiarazione di conformita'", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/cookies/page.tsx");
    expect(src).not.toMatch(/DevTools|herramientas de desarrollo|outils de développement/);
    expect(src).not.toMatch(/Consent Mode/);
    expect(src).not.toMatch(/conformidade com|compliant|konform|conforme au/i);
  });

  // Il corpo inglese e' servito anche alle nove lingue senza traduzione della
  // policy: li' le etichette devono venire dal dizionario della pagina.
  const LOCALIZED_BODIES = ["it", "es", "de", "pt", "fr"] as const;

  it("Cookie Policy: ogni lingua offre il pulsante di revoca con l'etichetta del banner", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/cookies/page.tsx");
    const labels = [...src.matchAll(/<ConsentPreferencesButton label="([^"]+)"/g)].map((m) => m[1]);
    expect(labels).toEqual(LOCALIZED_BODIES.map((l) => dict(l).cookie_banner.preferences));
    expect(src).toContain("<ConsentPreferencesButton label={labels.preferences}");
    expect(src).toContain("<CookiesEN labels={t.cookie_banner} />");
  });

  it("Cookie Policy: i nomi dei pulsanti citati sono quelli del banner", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/cookies/page.tsx");
    for (const l of LOCALIZED_BODIES) {
      const { accept, reject } = dict(l).cookie_banner;
      expect(src, `${l} accept`).toContain(accept);
      expect(src, `${l} reject`).toContain(reject);
    }
    const en = src.slice(src.indexOf("function CookiesEN"), src.indexOf("function CookiesES"));
    for (const expr of ["{labels.accept}", "{labels.preferences}", "{labels.reject}", "${labels.accept}"]) {
      expect(en, expr).toContain(expr);
    }
    expect(en).not.toMatch(/«|»|"Accept all"|Reject optional|"Cookie preferences"/);
  });

  it("Cookie Policy: la tabella non descrive _ga come anonimo e non promette l'anonimizzazione IP", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/cookies/page.tsx");
    const rows = src.split("\n").filter((l) => /<Row name="_ga/.test(l));
    expect(rows).toHaveLength(12);
    for (const row of rows) expect(row).not.toMatch(/anonym|anonim|anónim|anônim/i);
    expect(src).not.toMatch(/IP anonymi[sz]ation|anonimizzazione dell'IP|anonimización de IP|IP-Anonymisierung|anonimização de IP|anonymisation de l'IP/);
    expect(src).not.toMatch(/_ga<\/code> (?:e|and|y|und|et)\n/);
  });

  it("Cookie Policy: revoca e route escluse descrivono la ricarica senza il tag, con i termini del sito", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/cookies/page.tsx");
    const flat = src.replace(/\s+/g, " ");
    for (const phrase of [
      "ricarica la pagina senza il tag di Google",
      "reloads the page without the Google tag",
      "vuelve a cargar la página sin la etiqueta de Google",
      "lädt die Seite ohne das Google-Tag neu",
      "recarrega a página sem a tag do Google",
      "recharge la page sans la balise Google",
      "la pagina si ricarica senza",
      "the page reloads without it",
      "la página se recarga sin ella",
      "wird die Seite ohne das Tag neu geladen",
      "a página é recarregada sem ela",
      "la page se recharge sans elle",
    ]) {
      expect(flat, phrase).toContain(phrase);
    }
    // Il tag non resta «sospeso» in memoria: la pagina si ricarica.
    expect(flat).not.toMatch(/resta sospeso|stays suspended|queda suspendida|bleibt es dort ausgesetzt|fica suspensa|reste suspendue/);
    // Il sito chiama quell'area dashboard web, non «area personale».
    expect(flat).not.toMatch(/area personale|personal area|área personal|persönlichen Bereich|área pessoal|espace personnel/);
  });

  it("Privacy Policy: la voce GA4 non dice 'anonimo' e lega l'attivazione al consenso", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/privacy/page.tsx");
    const rows = [...src.matchAll(/\["Google Analytics 4 \([^"]*\)", ["`]([^"`]*)["`]\]/g)].map((m) => m[1]);
    expect(rows).toHaveLength(POLICY_LOCALES.length);
    for (const row of rows) {
      expect(row).not.toMatch(/anonym|anonim|anónim|anônim/i);
      expect(row).toMatch(/consen|Einwilligung/i);
      // Dopo il consenso si raccolgono statistiche: a essere caricato e' il tag, non le statistiche.
      expect(row).not.toMatch(/caricate|loaded|se cargan|geladen|carregadas|chargées/);
    }
    // Ordine dei corpi nel file: it, en, es, de, pt, fr. Il corpo inglese usa l'etichetta della pagina.
    ["it", "en", "es", "de", "pt", "fr"].forEach((l, i) =>
      expect(rows[i], l).toContain(l === "en" ? "${labels.preferences}" : dict(l).cookie_banner.preferences),
    );
    expect(src).toContain("<PrivacyEN labels={t.cookie_banner} />");
  });

  it("banner: ogni lingua ha l'etichetta del pulsante di revoca e nomina Google Analytics", () => {
    for (const l of LOCALES) {
      const b = dict(l).cookie_banner;
      expect(b.preferences, l).toBeTruthy();
      expect(b.description, l).toMatch(/Google Analytics/);
    }
  });
});

describe("l'implementazione e' quella che i testi descrivono", () => {
  it("il root layout non carica GA e non imposta il Consent Mode", () => {
    const shell = read("components/RootHtmlShell.tsx");
    expect(shell).not.toMatch(/googletagmanager|gtag\(|beforeInteractive|dataLayer/);
    expect(shell).toContain("<AnalyticsConsent />");
  });

  it("l'unico sorgente che conosce lo script GA e' lib/analytics/consent.ts", () => {
    const owners = SOURCES.filter((f) => /googletagmanager\.com\/gtag\/js/.test(read(f)));
    expect(owners).toEqual(["lib/analytics/consent.ts"]);
    expect(GA_SCRIPT_SRC).toMatch(/^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-/);
  });

  it("nessun altro sorgente definisce window.gtag o spinge nel dataLayer", () => {
    const offenders = SOURCES.filter((f) => f !== "lib/analytics/consent.ts").filter((f) =>
      /window\.gtag\s*=|\.gtag\s*=\s*function|dataLayer\.push/.test(read(f)),
    );
    expect(offenders).toEqual([]);
  });

  it("OutboundTracker invia solo attraverso trackEvent", () => {
    const src = read("components/OutboundTracker.tsx");
    expect(src).toContain("trackEvent(name, params)");
    expect(src).toContain("isAnalyticsActive()");
    expect(src).not.toMatch(/\.gtag\b(?!Fn)/);
  });
});

describe("landing Fitbit (R28)", () => {
  const data = read("lib/landing/data.ts");
  const es = read("lib/landing/es-overlay.json");
  const start = data.indexOf('slug: "fitbit-export-google"');
  const end = data.indexOf('slug: "', start + 30);
  const block = data.slice(start, end);

  it("il blocco della landing e' stato trovato", () => {
    expect(start).toBeGreaterThan(0);
    expect(block.length).toBeGreaterThan(1000);
  });

  it("nessuna cancellazione di 'tutto', nessuna copia promessa dopo la chiusura, nessun Ace", () => {
    const forbidden =
      /cancella tutto|wipes everything|entfernt alles|efface tout|apaga tudo|usuń wszystko|wist alles|すべて消去|모든 것이 지워|borra todo|accessibile anche dopo|accessible even after|auch nach dem Schließen|accessible même après|mesmo depois de encerrar|accesible incluso después|\bAce\b|qualsiasi Fitbit moderno|any modern Fitbit|jedem modernen Fitbit|qualquer Fitbit moderno|n'importe quel Fitbit|cualquier Fitbit moderno|Ładowanie 5\/6|Şarj 5\/6|5 minut|5-minute|5 Minuten|5 minutos|5 dakika|5\s?分|5\s?분|silinemeyecektir/;
    expect(block).not.toMatch(forbidden);
    const esBlock = es.slice(es.indexOf('"fitbit-export-google"'), es.indexOf('"garmin-connect-pc"'));
    expect(esBlock).not.toMatch(forbidden);
  });

  it("la FAQ sulla cancellazione rimanda alla pagina che elenca cosa resta", () => {
    const refs = block.match(/fitmesh\.fit\/delete-account/g) ?? [];
    expect(refs.length).toBe(10);
  });
});
