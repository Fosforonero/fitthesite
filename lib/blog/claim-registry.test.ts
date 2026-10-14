import { describe, expect, it } from "vitest";
import { CLAIM_TIPI } from "@/lib/blog/claims/claim-detectors";
import { COVERED_POSTS, segmentCell } from "@/lib/blog/claims/claim-cells";
import {
  classifyPostClaims,
  claimSystemVerdict,
  equivalentCellKey,
  harmonizeEquivalentCells,
  isPolicyViolation,
  type ClassifiedSentence,
} from "@/lib/blog/claims/claim-classify";
import { CLAIM_REGISTRY, FONTI, STATI_REVISIONE, type ClaimEntry } from "@/lib/blog/claims/claim-registry";
import openFindingsJson from "@/lib/blog/claims/claim-open-findings.json";
import {
  S6_CLAIMS,
  S6_FREQ,
  S6_LEGIT,
  S6_LIMITI_NOTI,
  S6_OWN_CLAIMS,
  S6_OWN_LEGIT,
  type S6Post,
} from "@/lib/blog/claims/claim-corpus-s6";

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
for (const [post] of POSTS) {
  // classificazione per frase, poi coerenza per cella equivalente (S6-04): la stessa del generatore
  for (const c of classifyPostClaims(post)) {
    LIVE.push({ post, slug: c.slug, path: c.path, lang: c.lang, testo: c.testo, impronta: c.impronta, tipo: c.det.tipo, polarita: c.det.polarita });
  }
}
const REG_BY_KEY = new Map(CLAIM_REGISTRY.map((e) => [key(e.slug, e.ambito, e.impronta), e]));
const LIVE_BY_KEY = new Map(LIVE.map((l) => [key(l.slug, l.path, l.impronta), l]));

// Findings APERTI sul contenuto corrente, dichiarati per id E per impronta della frase (S6-09): frequenza attribuita
// a una causa/un problema nel post Google Health, senza fonte e senza decisione di Matteo. Non e' una whitelist:
// l'elenco e' chiuso (claim-open-findings.json, id -> SHA-256 della frase), ogni voce DEVE ancora essere una
// violazione (una voce risolta fa fallire il test e va tolta), e un'altra frase nella stessa posizione (impronta
// diversa) NON e' esentata: torna rossa. Nessun testo cambia in questo sprint. Vedi SD2-CORREZIONI-REGISTRO.md.
const OPEN_FINDINGS = new Map<string, string>(Object.entries(openFindingsJson as Record<string, string>));
const OPEN_FINDINGS_COUNT = 33; // numero REALE dopo il ricalcolo S6-04 su tutte le lingue (erano 16, sottostimati)

const isOpenFinding = (e: Pick<ClaimEntry, "id" | "impronta">): boolean => OPEN_FINDINGS.get(e.id) === e.impronta;

const isViolation = (e: ClaimEntry): boolean => {
  if (e.fonte !== "nessuna" || e.statoRevisione === "rivisto-da-matteo") return false;
  return isPolicyViolation(e);
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
    const byId = new Map(CLAIM_REGISTRY.map((e) => [e.id, e]));
    const unexpected = violations.filter((id) => !isOpenFinding(byId.get(id)!));
    expect(
      unexpected,
      "claim di frequenza/integrazione ufficiale senza fonte ne' decisione: dai una fonte primaria, o fallo decidere a Matteo, o riformula",
    ).toEqual([]);
  });

  it("i finding aperti sono ancora violazioni (una voce risolta va tolta dall'elenco: nessuna esenzione fantasma)", () => {
    const violations = new Set(CLAIM_REGISTRY.filter(isViolation).map((e) => e.id));
    expect([...OPEN_FINDINGS.keys()].filter((id) => !violations.has(id)).sort()).toEqual([]);
    expect(OPEN_FINDINGS.size).toBe(OPEN_FINDINGS_COUNT);
    expect(violations.size).toBe(OPEN_FINDINGS_COUNT);
    // ogni id esentato ha ancora la sua impronta: la frase e' quella dichiarata (S6-09)
    const byId = new Map(CLAIM_REGISTRY.map((e) => [e.id, e]));
    expect([...OPEN_FINDINGS].filter(([id, imp]) => byId.get(id)?.impronta !== imp).map(([id]) => id)).toEqual([]);
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

describe("REGISTRO DEI CLAIM: correzioni S6 (CONTROLLO-S6)", () => {
  it("S6-09: un finding aperto e' esentato per id E impronta: un'altra frase nella stessa posizione torna rossa", () => {
    const [id, impronta] = [...OPEN_FINDINGS][0];
    const entry = CLAIM_REGISTRY.find((e) => e.id === id)!;
    expect(isOpenFinding(entry)).toBe(true);
    const sostituita: ClaimEntry = { ...entry, impronta: "f".repeat(64) }; // stessa cella, frase diversa
    expect(isOpenFinding(sostituita)).toBe(false);
    expect(isViolation(sostituita)).toBe(true); // violazione e non esentata: il test della politica la riporta
    expect(impronta).toBe(entry.impronta);
  });

  it("S6-09: ogni finding aperto e' una violazione con fonte «nessuna» e nessuna decisione di Matteo, nel solo post Google Health", () => {
    for (const [id] of OPEN_FINDINGS) {
      const e = CLAIM_REGISTRY.find((x) => x.id === id)!;
      expect(e.post, id).toBe("google-health");
      expect(e.fonte, id).toBe("nessuna");
      expect(isViolation(e), id).toBe(true);
    }
  });

  it("S6-04: stessa frase tradotta = stessa classificazione (cella equivalente): un fratello afferma, l'altro neutro diventa afferma", () => {
    const mk = (lang: string, polarita: "afferma" | "neutra" | "domanda", tipo = "frequenza"): ClassifiedSentence =>
      ({
        path: `ts:faq.7.a.${lang}`, lang, indice: 0, testo: lang, impronta: lang, post: "google-health", slug: "x", raised: false,
        det: { tipo, soggetto: "generico", polarita, marcatori: [] },
      }) as ClassifiedSentence;
    const g = harmonizeEquivalentCells([mk("it", "neutra"), mk("de", "afferma"), mk("en", "neutra"), mk("fr", "domanda"), mk("ja", "neutra", "capacita")]);
    const by = Object.fromEntries(g.map((c) => [c.lang, c.det.polarita]));
    expect(by).toEqual({ it: "afferma", de: "afferma", en: "afferma", fr: "domanda", ja: "neutra" }); // domanda e altro tipo intatti
    expect(g.filter((c) => c.raised).map((c) => c.lang).sort()).toEqual(["en", "it"]);
    // posizioni diverse non si contaminano
    const altro = { ...mk("pl", "neutra"), path: "ts:faq.8.a.pl" };
    expect(harmonizeEquivalentCells([mk("de", "afferma"), altro]).find((c) => c.lang === "pl")!.det.polarita).toBe("neutra");
    expect(equivalentCellKey("ts:faq.7.a.de", "de", 2)).toBe(equivalentCellKey("ts:faq.7.a.ko", "ko", 2));
    expect(equivalentCellKey("overlay:body.0.text.sv", "sv", 0)).toBe(equivalentCellKey("ts:body.0.text.it", "it", 0));
  });

  it("S6-04: sul contenuto reale nessuna cella equivalente mescola frequenza «afferma» e frequenza «neutra»", () => {
    const groups = new Map<string, Set<string>>();
    for (const [post] of POSTS) {
      for (const c of classifyPostClaims(post)) {
        if (c.det.tipo !== "frequenza") continue;
        const k = `${post}|${equivalentCellKey(c.path, c.lang, c.indice)}`;
        if (!groups.has(k)) groups.set(k, new Set());
        groups.get(k)!.add(c.det.polarita);
      }
    }
    const mixed = [...groups].filter(([, v]) => v.has("afferma") && v.has("neutra")).map(([k]) => k);
    expect(mixed).toEqual([]);
  });

  it("S6-08: si segmenta PRIMA di normalizzare: una riga senza punteggiatura non si fonde con la frase seguente", () => {
    expect(segmentCell("Häufig gestellte Fragen\nDie Option findest du normalerweise unter Einstellungen > Apps.")).toEqual([
      "Häufig gestellte Fragen",
      "Die Option findest du normalerweise unter Einstellungen > Apps.",
    ]);
    expect(segmentCell("Prima riga\n\nSeconda riga. Terza riga!")).toEqual(["Prima riga", "Seconda riga.", "Terza riga!"]);
    expect(segmentCell("Una frase sola senza newline.")).toEqual(["Una frase sola senza newline."]);
  });

  it("S6-02: la politica «integrazione ufficiale/diretta/partnership/certificazione di FitMesh senza fonte» vale su TUTTI i post coperti", () => {
    // (il post Garmin ha in piu' la propria guardia di promessa, verificata dal corpus S6: C01-C14)
    for (const post of ["fitbit", "google-health"]) {
      for (const t of [
        "FitMesh is officially integrated with Fitbit.",
        "FitMesh connects directly to your Fitbit account.",
        "FitMesh is an official Fitbit partner.",
        "Google has certified FitMesh for Fitbit data.",
        "Soon FitMesh will integrate with Fitbit.",
      ]) {
        expect(claimSystemVerdict(post, "ts:body.0.text.en", t).policy.length, `${post}: ${t}`).toBeGreaterThan(0);
      }
    }
    // stesse eccezioni documentate: negazione, domanda, terza parte, lettura da Health Connect restano verdi
    for (const t of ["FitMesh is not an official Fitbit partner.", "Is FitMesh officially integrated with Fitbit?", "Strava offers an official integration with Fitbit.", "FitMesh reads your data directly from Health Connect."]) {
      for (const post of ["fitbit", "google-health"]) expect(claimSystemVerdict(post, "ts:body.0.text.en", t).policy, `${post}: ${t}`).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------------------------
// CORPUS S6 (CONTROLLO-S6, SD2): le frasi del revisore VERBATIM (matrici .tsv, log di iniezione, L30, C14, C27-C29,
// C41, le 42 claim e le 40 legittime, i 54 casi di frequenza) piu' voci proprie. Verdetto = quello di sistema: la
// guardia di cella del post piu' la politica del registro, frase per frase. Verde meccanico != conformita': i
// LIMITI-NOTI sono dichiarati (S6-10), non nascosti.
// ---------------------------------------------------------------------------------------------
describe("CORPUS S6: ogni frase del controllo e' un test nominato; LIMITI-NOTI dichiarati", () => {
  const KEY: Record<S6Post, string> = { GA: "garmin", FB: "fitbit", GH: "google-health" };
  const pathOf = (lang: string): string => (lang === "sv" || lang === "da" ? `overlay:body.0.text.${lang}` : `ts:body.0.text.${lang}`);
  const red = (post: S6Post, lang: string, text: string): boolean => {
    const v = claimSystemVerdict(KEY[post], pathOf(lang), text);
    return v.guard.length > 0 || v.policy.length > 0;
  };

  it("copertura: 42 claim + 40 legittime + 54 frequenze del revisore, ciascuna nel corpus o nei LIMITI-NOTI, con id unici", () => {
    const limitiC = S6_LIMITI_NOTI.filter((l) => /^C\d+$/.test(l.id));
    expect(S6_CLAIMS.length + limitiC.length).toBe(42);
    expect(S6_LEGIT.length).toBe(40);
    expect(S6_FREQ.length).toBe(54);
    const ids = [...S6_CLAIMS, ...S6_LEGIT, ...S6_OWN_CLAIMS, ...S6_OWN_LEGIT].map((r) => r[0]).concat(S6_LIMITI_NOTI.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of S6_LIMITI_NOTI) expect(l.why.length, l.id).toBeGreaterThan(30);
    const langs = new Set([...S6_CLAIMS, ...S6_LEGIT, ...S6_FREQ.map(([, l, t]) => ["", "", l, t])].map((r) => r[2]));
    for (const l of ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da"]) expect(langs.has(l), `lingua ${l}`).toBe(true);
  });

  it.each(S6_CLAIMS.map((r) => [`DEVE-FALLIRE ${r[0]} ${r[1]} ${r[2]}: ${r[3].slice(0, 60)}`, r] as const))("%s", (_n, [id, post, lang, text]) => {
    expect(red(post, lang, text), `${id} deve essere rosso`).toBe(true);
  });
  it.each(S6_LEGIT.map((r) => [`DEVE-PASSARE ${r[0]} ${r[1]} ${r[2]}: ${r[3].slice(0, 60)}`, r] as const))("%s", (_n, [id, post, lang, text]) => {
    const v = claimSystemVerdict(KEY[post], pathOf(lang), text);
    expect([...v.guard, ...v.policy], id).toEqual([]);
  });
  it.each(S6_OWN_CLAIMS.map((r) => [`DEVE-FALLIRE (proprio) ${r[0]} ${r[1]} ${r[2]}: ${r[3].slice(0, 60)}`, r] as const))("%s", (_n, [id, post, lang, text]) => {
    expect(red(post, lang, text), `${id} deve essere rosso`).toBe(true);
  });
  it.each(S6_OWN_LEGIT.map((r) => [`DEVE-PASSARE (proprio) ${r[0]} ${r[1]} ${r[2]}: ${r[3].replace(/\n/g, " / ").slice(0, 60)}`, r] as const))("%s", (_n, [id, post, lang, text]) => {
    const v = claimSystemVerdict(KEY[post], pathOf(lang), text);
    expect([...v.guard, ...v.policy], id).toEqual([]);
  });
  it.each(S6_FREQ.map((r) => [`FREQUENZA ${r[0]} ${r[1]}: ${r[2].slice(0, 60)}`, r] as const))("%s", (_n, [cls, lang, text]) => {
    const v = claimSystemVerdict("fitbit", pathOf(lang), text);
    // P = occorrenza, K = common/causa: rosse. N = legittima, D = presa di distanza: verdi
    if (cls === "P" || cls === "K") expect(v.guard.length, text).toBeGreaterThan(0);
    else expect(v.guard, text).toEqual([]);
  });
  it.each(S6_LIMITI_NOTI.map((l) => [`LIMITE-NOTO ${l.id} (${l.post} ${l.lang}, verde osservato)`, l] as const))("%s", (_n, l) => {
    const v = claimSystemVerdict(KEY[l.post], pathOf(l.lang), l.text);
    // se il sistema comincia a vederla, il limite sparisce: va promosso nel corpus (nessun falso positivo accettato)
    expect([...v.guard, ...v.policy], `${l.id}: ${l.why}`).toEqual([]);
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
