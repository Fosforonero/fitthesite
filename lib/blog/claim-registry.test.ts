import { describe, expect, it } from "vitest";
import { CLAIM_TIPI } from "@/lib/blog/claims/claim-detectors";
import { COVERED_POSTS, claimSentences } from "@/lib/blog/claims/claim-cells";
import { classifyClaim } from "@/lib/blog/claims/claim-classify";
import { CLAIM_REGISTRY, FONTI, STATI_REVISIONE, type ClaimEntry } from "@/lib/blog/claims/claim-registry";

// ---------------------------------------------------------------------------------------------
// REGISTRO DEI CLAIM (SD): ogni frase dei tre post coperti (Garmin, Fitbit, Google Health; 11 lingue TS + sv/da
// overlay) che i rilevatori di richiamo segnalano come possibile claim ha una voce con fonte, ambito, lingua e
// stato di revisione. Il test NON dice che un claim e' vero: dice che e' registrato, che il registro e'
// coerente e che nessuna affermazione positiva di frequenza/integrazione ufficiale e' senza fonte e senza decisione.
// ---------------------------------------------------------------------------------------------
const POSTS = Object.entries(COVERED_POSTS); // [chiave, slug]
const key = (slug: string, ambito: string, impronta: string): string => `${slug}|${ambito}|${impronta}`;

type Live = { post: string; slug: string; path: string; lang: string; testo: string; impronta: string; tipo: string; polarita: string };
const LIVE: Live[] = [];
for (const [post, slug] of POSTS) {
  const seen = new Set<string>();
  for (const s of claimSentences(slug)) {
    const d = classifyClaim(post, s.path, s.testo);
    if (!d || seen.has(key(slug, s.path, s.impronta))) continue;
    seen.add(key(slug, s.path, s.impronta));
    LIVE.push({ post, slug, path: s.path, lang: s.lang, testo: s.testo, impronta: s.impronta, tipo: d.tipo, polarita: d.polarita });
  }
}
const REG_BY_KEY = new Map(CLAIM_REGISTRY.map((e) => [key(e.slug, e.ambito, e.impronta), e]));
const LIVE_BY_KEY = new Map(LIVE.map((l) => [key(l.slug, l.path, l.impronta), l]));

// Findings APERTI sul contenuto corrente, dichiarati per id (nessun testo cambia in questo sprint): frequenza
// attribuita a una causa/un problema nel post Google Health, senza fonte e senza decisione di Matteo. Non e' una
// whitelist: l'elenco e' chiuso, ogni voce DEVE ancora essere una violazione (una voce risolta fa fallire il test e va
// tolta) e nessuna nuova voce puo' aggiungersi senza comparire qui. Vedi SD-REGISTRO-CLAIM.md.
const OPEN_FINDINGS = new Set<string>([
  "google-health/ts:body.22.text.de#5",
  "google-health/ts:body.22.text.nl#5",
  "google-health/ts:body.22.text.pl#5",
  "google-health/ts:body.22.text.tr#6",
  "google-health/ts:faq.5.a.de#0",
  "google-health/ts:faq.5.a.fr#0",
  "google-health/ts:faq.5.a.ja#0",
  "google-health/ts:faq.5.a.ko#0",
  "google-health/ts:faq.5.a.pl#0",
  "google-health/ts:faq.5.a.pt#0",
  "google-health/ts:faq.5.a.tr#0",
  "google-health/ts:faq.7.a.fr#0",
  "google-health/ts:faq.7.a.nl#0",
  "google-health/ts:faq.7.a.tr#0",
]);

const isViolation = (e: ClaimEntry): boolean => {
  if (e.fonte !== "nessuna" || e.statoRevisione === "rivisto-da-matteo") return false;
  if (e.polarita !== "afferma") return false; // negazioni, domande, etichette, frasi neutre: ammesse
  if (e.tipo === "frequenza") return true; // frequenza attribuita a una causa/un problema
  const ufficiale = e.marcatori.some((m) => ["ufficiale", "diretta", "partnership"].includes(m));
  return e.soggetto === "fitmesh" && ufficiale && ["integrazione", "roadmap", "disponibilita"].includes(e.tipo);
};

describe("REGISTRO DEI CLAIM: completezza", () => {
  it("copertura: i tre post sono visitati e producono claim in tutte le lingue attese", () => {
    for (const [post] of POSTS) {
      const langs = new Set(LIVE.filter((l) => l.post === post).map((l) => l.lang));
      // Google Health non ha voci overlay (sv/da): il test seo-metadata-batch1 lo asserisce gia'; qui 11 lingue TS
      const attese = post === "google-health" ? 11 : 13;
      for (const l of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da"].slice(0, attese)) {
        expect(langs.has(l), `${post} ${l}`).toBe(true);
      }
    }
    expect(LIVE.length).toBeGreaterThan(1500);
  });

  it("ogni frase che un rilevatore classifica come claim e' registrata (per impronta)", () => {
    const missing = LIVE.filter((l) => !REG_BY_KEY.has(key(l.slug, l.path, l.impronta)));
    const msg = missing
      .slice(0, 12)
      .map((m) => `  ${m.post} ${m.path} [${m.tipo}] «${m.testo.slice(0, 90)}»`)
      .join("\n");
    expect(
      missing.length,
      `${missing.length} frasi-claim NON registrate. Registra ciascuna in lib/blog/claims/claim-registry.json con fonte e stato di revisione ` +
        `(npx tsx lib/blog/claims/generate-claim-registry.ts le aggiunge come «nessuna / da-rivedere»), oppure riformulala e togli il claim:\n${msg}`,
    ).toBe(0);
  });
});

describe("REGISTRO DEI CLAIM: integrita'", () => {
  it("campi obbligatori ed enumerazioni valide", () => {
    expect(CLAIM_REGISTRY.length).toBeGreaterThan(0);
    for (const e of CLAIM_REGISTRY) {
      const w = e.id;
      for (const f of ["id", "post", "slug", "ambito", "impronta", "anteprima", "dataRevisione"] as const) {
        expect(typeof e[f] === "string" && e[f].length > 0, `${w} campo ${f}`).toBe(true);
      }
      expect(e.impronta, `${w} impronta`).toMatch(/^[0-9a-f]{64}$/);
      expect((CLAIM_TIPI as readonly string[]).includes(e.tipo), `${w} tipo ${e.tipo}`).toBe(true);
      expect((FONTI as readonly string[]).includes(e.fonte), `${w} fonte ${e.fonte}`).toBe(true);
      expect((STATI_REVISIONE as readonly string[]).includes(e.statoRevisione), `${w} stato ${e.statoRevisione}`).toBe(true);
      expect(["fitmesh", "terza-parte", "generico"], `${w} soggetto`).toContain(e.soggetto);
      expect(["afferma", "nega", "domanda", "etichetta", "neutra"], `${w} polarita`).toContain(e.polarita);
      expect(e.dataRevisione, `${w} data`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(e.lingue) && e.lingue.length > 0, `${w} lingue`).toBe(true);
      expect(Array.isArray(e.marcatori), `${w} marcatori`).toBe(true);
      expect(Number.isInteger(e.indice) && e.indice >= 0, `${w} indice`).toBe(true);
    }
  });

  it("id unici e chiave (slug, ambito, impronta) unica", () => {
    expect(new Set(CLAIM_REGISTRY.map((e) => e.id)).size).toBe(CLAIM_REGISTRY.length);
    expect(REG_BY_KEY.size).toBe(CLAIM_REGISTRY.length);
  });

  it("nessuna voce orfana: la sua impronta e' ancora una frase-claim del contenuto, nella cella indicata", () => {
    const orphans = CLAIM_REGISTRY.filter((e) => !LIVE_BY_KEY.has(key(e.slug, e.ambito, e.impronta)));
    expect(orphans.map((o) => `${o.id} «${o.anteprima}»`), "voci orfane: la frase e' cambiata o non e' piu' un claim; aggiorna o togli la voce").toEqual([]);
  });

  it("lingua della voce = lingua della cella, e appartiene al post; slug e chiave del post coerenti", () => {
    for (const e of CLAIM_REGISTRY) {
      expect(COVERED_POSTS[e.post], `${e.id} post`).toBe(e.slug);
      const live = LIVE_BY_KEY.get(key(e.slug, e.ambito, e.impronta));
      if (live) expect(e.lingue, e.id).toEqual([live.lang]);
      expect(e.id.startsWith(`${e.post}/${e.ambito}#`), `${e.id} forma dell'id`).toBe(true);
    }
  });

  it("la classificazione memorizzata coincide con quella ricalcolata (non si declassa una voce a mano)", () => {
    const diff: string[] = [];
    for (const e of CLAIM_REGISTRY) {
      const live = LIVE_BY_KEY.get(key(e.slug, e.ambito, e.impronta));
      if (!live) continue;
      if (live.tipo !== e.tipo || live.polarita !== e.polarita) diff.push(`${e.id}: registro ${e.tipo}/${e.polarita}, ricalcolato ${live.tipo}/${live.polarita}`);
    }
    expect(diff).toEqual([]);
  });

  it("fonte e stato sono coerenti: «primaria» ha un URL https, le altre no; «nessuna» non e' mai «rivisto-da-agente»; sv/da restano da rivedere dal madrelingua", () => {
    for (const e of CLAIM_REGISTRY) {
      if (e.fonte === "primaria") {
        expect(e.urlFonte, `${e.id} urlFonte`).toMatch(/^https:\/\/[^\s]+$/);
        expect(e.riferimentoFonte && e.riferimentoFonte.length > 3, `${e.id} riferimentoFonte`).toBe(true);
      } else {
        expect(e.urlFonte, `${e.id} urlFonte senza fonte primaria`).toBeNull();
      }
      if (e.fonte === "nessuna") {
        expect(["da-rivedere", "da-rivedere-madrelingua", "rivisto-da-matteo"], `${e.id}: senza fonte non e' «${e.statoRevisione}»`).toContain(e.statoRevisione);
      } else {
        expect(e.riferimentoFonte && e.riferimentoFonte.length > 3, `${e.id} riferimentoFonte`).toBe(true);
      }
      if (e.lingue.some((l) => l === "sv" || l === "da")) {
        expect(e.statoRevisione, `${e.id} sv/da`).toBe("da-rivedere-madrelingua");
      }
      // nessuna decisione di Matteo e' stata registrata in questo sprint: non puo' comparire per costruzione dell'agente
      expect(e.statoRevisione, `${e.id}: solo Matteo puo' scrivere questo stato`).not.toBe("rivisto-da-matteo");
    }
  });
});

describe("REGISTRO DEI CLAIM: politica", () => {
  it("nessuna affermazione positiva di frequenza o di integrazione ufficiale/diretta/partnership senza fonte e senza decisione (salvo i finding aperti)", () => {
    const violations = CLAIM_REGISTRY.filter(isViolation).map((e) => e.id);
    const unexpected = violations.filter((id) => !OPEN_FINDINGS.has(id));
    expect(
      unexpected,
      "claim di frequenza/integrazione ufficiale senza fonte ne' decisione: dai una fonte primaria, o fallo decidere a Matteo, o riformula",
    ).toEqual([]);
  });

  it("i finding aperti sono ancora violazioni (una voce risolta va tolta dall'elenco: nessuna esenzione fantasma)", () => {
    const violations = new Set(CLAIM_REGISTRY.filter(isViolation).map((e) => e.id));
    expect([...OPEN_FINDINGS].filter((id) => !violations.has(id)).sort()).toEqual([]);
    expect(OPEN_FINDINGS.size).toBe(14);
  });

  it("le negazioni e gli stati onesti ammessi hanno fonte «comportamento del prodotto» e testo registrato (body.15.items[2] Garmin, 13 lingue)", () => {
    const neg = CLAIM_REGISTRY.filter((e) => e.post === "garmin" && /^(ts|overlay):body\.15\.items\.[a-z]{2}\.2$/.test(e.ambito));
    expect(new Set(neg.map((e) => e.ambito)).size).toBe(13);
    expect(neg.length).toBe(14); // ja/ko hanno due frasi, entrambe nella clausola di negazione
    for (const e of neg) {
      expect(e.tipo, e.id).toBe("negazione");
      expect(e.polarita, e.id).toBe("nega");
      expect(e.fonte, e.id).toBe("comportamento del prodotto");
    }
  });

  it("la politica e' davvero attiva: una voce di frequenza «afferma» senza fonte e' una violazione; con una negazione no", () => {
    const base = CLAIM_REGISTRY[0];
    const freq: ClaimEntry = { ...base, tipo: "frequenza", polarita: "afferma", soggetto: "generico", marcatori: [], fonte: "nessuna", statoRevisione: "da-rivedere" };
    expect(isViolation(freq)).toBe(true);
    expect(isViolation({ ...freq, polarita: "nega" })).toBe(false);
    expect(isViolation({ ...freq, fonte: "comportamento del prodotto" })).toBe(false);
    expect(isViolation({ ...freq, statoRevisione: "rivisto-da-matteo" })).toBe(false);
    const off: ClaimEntry = { ...freq, tipo: "integrazione", soggetto: "fitmesh", marcatori: ["ufficiale"] };
    expect(isViolation(off)).toBe(true);
    expect(isViolation({ ...off, soggetto: "terza-parte" })).toBe(false); // fatto di una terza parte: da rivedere, non bloccato
  });
});

describe("REGISTRO DEI CLAIM: riepilogo (non bloccante)", () => {
  it("stampa quanti claim sono da rivedere, per stato e per tipo", () => {
    const by = (f: (e: ClaimEntry) => string): Record<string, number> => {
      const o: Record<string, number> = {};
      for (const e of CLAIM_REGISTRY) o[f(e)] = (o[f(e)] ?? 0) + 1;
      return o;
    };
    const perStato = by((e) => e.statoRevisione);
    const perTipo = by((e) => e.tipo);
    const perPost = by((e) => e.post);
    const perFonte = by((e) => e.fonte);
    // eslint-disable-next-line no-console
    console.info(
      `[REGISTRO CLAIM] voci=${CLAIM_REGISTRY.length}\n  per stato: ${JSON.stringify(perStato)}\n  per tipo: ${JSON.stringify(perTipo)}\n` +
        `  per post: ${JSON.stringify(perPost)}\n  per fonte: ${JSON.stringify(perFonte)}\n  finding aperti: ${OPEN_FINDINGS.size}`,
    );
    expect(Object.values(perStato).reduce((a, b) => a + b, 0)).toBe(CLAIM_REGISTRY.length);
  });
});
