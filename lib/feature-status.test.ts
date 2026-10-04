import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CAPABILITY_STATUS } from "./product-facts";
import { FAMIGLIA_COMING_SOON } from "./content/famiglia-coming-soon";
import { generateLlmsTxt } from "./llms-txt";
import { getDictionary, locales } from "./i18n";
import {
  FAMILY_MESH_STATUS_SENTENCE,
  MESH_FEATURE_CARD_INDEX,
  MESH_SENTENCE_AGENT_REVIEWED_LOCALES,
  WEB_DASHBOARD_STATUS_SENTENCE,
  STATUS_SENTENCE_PROVENANCE,
  featureStatusSentence,
  isFeatureAvailable,
  visibleFeatureCards,
  type FeatureKey,
} from "./feature-status";

/**
 * Contenimento dei claim su dashboard web personale e Mesh Famiglia (decisione
 * PM del 01/10/2026). Lo STATO e' uno solo, CAPABILITY_STATUS; le superfici lo
 * leggono. Questo file NON contiene test di annuncio (il gate tecnico reale
 * della dashboard web non e' ancora nel ramo di rilascio): verifica che oggi
 * nessuna superficie dichiari disponibile cio' che non lo e', e che le frasi
 * di stato siano presenti, brevi e verificate in tutte le 15 lingue.
 */

const ROOT = join(__dirname, "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const KEYS: FeatureKey[] = ["familyMesh", "webDashboard"];

// Promesse di imminenza o date: vietate dalla nota di CAPABILITY_STATUS.familyMesh.
const IMMINENCE =
  /in arrivo|coming soon|prossimamente|próximamente|em breve|bientôt|demnächst|wkrótce|yakında|binnenkort|近日公開|출시 예정|kommer snart|tulossa pian|presto\b/i;

const original = Object.fromEntries(KEYS.map((k) => [k, CAPABILITY_STATUS[k]?.status])) as Record<FeatureKey, string>;
afterEach(() => {
  for (const k of KEYS) CAPABILITY_STATUS[k].status = original[k] as never;
});

describe("stato unico: CAPABILITY_STATUS", () => {
  it("la dashboard web ha una voce ed e' in sviluppo, non una flag o un prototipo", () => {
    expect(CAPABILITY_STATUS.webDashboard).toBeDefined();
    expect(CAPABILITY_STATUS.webDashboard.status).toBe("in_development");
    expect(CAPABILITY_STATUS.webDashboard.note).toMatch(/TUTTE E TRE/);
  });

  it("oggi nessuna delle due funzioni e' disponibile", () => {
    for (const k of KEYS) expect(isFeatureAvailable(k), k).toBe(false);
  });

  it("solo live_verified e live_limited rendono una funzione disponibile", () => {
    const stati = [
      ["live_verified", true],
      ["live_limited", true],
      ["release_candidate", false],
      ["in_development", false],
      ["planned", false],
      ["pending_production_verification", false],
      ["unsupported", false],
      ["unknown", false],
    ] as const;
    for (const k of KEYS) {
      for (const [s, atteso] of stati) {
        CAPABILITY_STATUS[k].status = s;
        expect(isFeatureAvailable(k), `${k}=${s}`).toBe(atteso);
      }
    }
  });

  it("una chiave sconosciuta non e' disponibile (fail-closed)", () => {
    expect(isFeatureAvailable("inesistente" as FeatureKey)).toBe(false);
  });
});

describe("frasi di stato verificate nella lingua pubblicata", () => {
  for (const k of KEYS) {
    it(`${k}: una frase in ognuna delle 15 lingue, breve, senza date, senza imminenza, senza em dash`, () => {
      for (const lc of locales) {
        const s = featureStatusSentence(k, lc);
        expect(s, `${k}/${lc}`).toBeTruthy();
        expect(s.length, `${k}/${lc} troppo lunga`).toBeLessThan(140);
        expect(s, `${k}/${lc} imminenza`).not.toMatch(IMMINENCE);
        expect(s, `${k}/${lc} cifre o date`).not.toMatch(/\d/);
        expect(s, `${k}/${lc} em dash`).not.toMatch(/—|–/);
      }
    });

    it(`${k}: nessun ripiego inglese silenzioso (le altre 14 lingue non sono la frase inglese)`, () => {
      const en = featureStatusSentence(k, "en");
      for (const lc of locales) {
        if (lc === "en") continue;
        expect(featureStatusSentence(k, lc), `${k}/${lc}`).not.toBe(en);
      }
    });
  }

  it("Mesh: le otto lingue con formula approvata sono LETTE da FAMIGLIA_COMING_SOON, non ricopiate", () => {
    for (const lc of Object.keys(FAMIGLIA_COMING_SOON) as (keyof typeof FAMIGLIA_COMING_SOON)[]) {
      expect(FAMILY_MESH_STATUS_SENTENCE[lc], lc).toBe(FAMIGLIA_COMING_SOON[lc].sub);
    }
    expect(FAMILY_MESH_STATUS_SENTENCE.it).toBe(
      "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio.",
    );
    expect(FAMILY_MESH_STATUS_SENTENCE.en).toBe(
      "Family Mesh is in development and is not yet available. We haven't announced a release date.",
    );
  });

  it("Mesh: le sette lingue senza formula approvata sono dichiarate «revisione di agenti» e sono tutte e sole quelle", () => {
    const approvate = Object.keys(FAMIGLIA_COMING_SOON);
    const attese = locales.filter((lc) => !approvate.includes(lc));
    expect([...MESH_SENTENCE_AGENT_REVIEWED_LOCALES].sort()).toEqual([...attese].sort());
  });

  it("ogni lingua ha un controllo registrato: formula approvata oppure revisione di agenti, mai nessuno dei due", () => {
    for (const k of KEYS) {
      const p = STATUS_SENTENCE_PROVENANCE[k];
      for (const lc of locales) {
        const approvata = (p.approvedFormula as readonly string[]).includes(lc);
        const agenti = (p.controlAgentReview as readonly string[]).includes(lc);
        expect(approvata !== agenti, `${k}/${lc}`).toBe(true);
      }
      expect(p.authoredLanguage).toBe("it");
      expect(p.role.source).toEqual(["it"]);
      expect(p.origin.length).toBeGreaterThan(30);
      expect(p.controlRecordedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("dashboard web: it ed en sono la formula decisa", () => {
    expect(WEB_DASHBOARD_STATUS_SENTENCE.it).toBe("La dashboard web personale non è ancora disponibile.");
    expect(WEB_DASHBOARD_STATUS_SENTENCE.en).toBe("The personal web dashboard is not yet available.");
  });
});

describe("home: la card promozionale Mesh non si mostra finche' la Mesh non e' disponibile", () => {
  it("in tutte le 15 lingue la sesta voce della griglia e' la Mesh", async () => {
    for (const lc of locales) {
      const items = (await getDictionary(lc)).features.items as { title: string }[];
      expect(items.length, lc).toBe(MESH_FEATURE_CARD_INDEX + 1);
      expect(items[MESH_FEATURE_CARD_INDEX].title, lc).toMatch(/Mesh/);
    }
  });

  it("con la Mesh non disponibile la card sparisce e nessuna voce residua nomina la Mesh", async () => {
    for (const lc of locales) {
      const items = (await getDictionary(lc)).features.items as { title: string; desc: string }[];
      const visibili = visibleFeatureCards(items);
      expect(visibili.length, lc).toBe(items.length - 1);
      for (const v of visibili) expect(v.title, lc).not.toMatch(/Mesh/);
    }
  });

  it("con la Mesh disponibile la griglia torna intera (nessun dizionario modificato)", async () => {
    CAPABILITY_STATUS.familyMesh.status = "live_verified";
    for (const lc of locales) {
      const items = (await getDictionary(lc)).features.items as { title: string }[];
      expect(visibleFeatureCards(items), lc).toEqual(items);
    }
  });
});

describe("superfici: nessuna legge uno stato proprio", () => {
  it("/about mostra il paragrafo Mesh solo se la Mesh e' disponibile, altrimenti la frase di stato", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/about/page.tsx");
    expect(src.split("ABOUT_COPY.familyBody").length - 1).toBe(1);
    expect(src).toMatch(/isFeatureAvailable\("familyMesh"\)\s*\?\s*tl\(ABOUT_COPY\.familyBody, lc\)\s*:\s*featureStatusSentence\("familyMesh", lc\)/);
    // le sette lingue senza firma nominata non rendono ne' titolo ne' paragrafo Mesh
    expect(src).toMatch(/isFeatureAvailable\("familyMesh"\) \|\| meshStatusSentenceRenderable\(lc\)/);
  });

  it("/famiglia deriva COMING_SOON da CAPABILITY_STATUS (niente costante a mano)", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/famiglia/page.tsx");
    expect(src).toMatch(/const COMING_SOON = !isFeatureAvailable\("familyMesh"\);/);
    expect(src).not.toMatch(/const COMING_SOON = (true|false);/);
  });

  it("la home filtra la griglia con visibleFeatureCards", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/page.tsx");
    expect(src).toMatch(/visibleFeatureCards<\{ title: string; desc: string \}>\(t\.features\.items\)/);
  });

  it("llms.txt dichiara la dashboard web non disponibile, e la dichiara disponibile solo se lo stato lo dice", () => {
    expect(generateLlmsTxt()).toContain("The personal web dashboard is not yet available.");
    expect(generateLlmsTxt()).not.toMatch(/family layer/i);
    CAPABILITY_STATUS.webDashboard.status = "live_verified";
    expect(generateLlmsTxt()).not.toContain("## Personal web dashboard");
  });

  it("le card della home non elencano piu' funzioni (nessuna Mesh in nessuna lingua): liste tolte (S02 U-PRICE-09/14)", async () => {
    const { PRICING_SECTION } = await import("./pricing-section");
    expect(Object.keys(PRICING_SECTION)).not.toContain("proFeatures");
    expect(Object.keys(PRICING_SECTION)).not.toContain("trialFeatures");
    expect(read("app/(frontend)/[locale]/(marketing)/page.tsx")).not.toMatch(/proFeatures|trialFeatures/);
  });
});

describe("regressione: le frasi false note non tornano nelle superfici della tranche", () => {
  const FALSE_PHRASES =
    /La tua dashboard è live|Your dashboard is live|Apri il browser da qualsiasi|La dashboard web è inclusa|The web dashboard is included|La dashboard stessa è disponibile sul web|Mesh Famiglia \(in arrivo\)|Family Mesh \(coming soon\)|Family Mesh（近日公開）/;
  const FILES = [
    "lib/content/homepage-copy.ts",
    "lib/content/faqs.ts",
    "lib/pricing-section.ts",
    "lib/llms-txt.ts",
    "app/(frontend)/[locale]/(marketing)/lp/[slug]/page.tsx",
    "app/(frontend)/[locale]/(marketing)/terms/page.tsx",
  ];
  for (const f of FILES) {
    it(`${f}: nessuna frase falsa nota`, () => {
      expect(read(f)).not.toMatch(FALSE_PHRASES);
    });
  }

  it("la roadmap da la dashboard web nativa nella colonna Future, senza chip di stato e non come «live»", () => {
    const src = read("app/(frontend)/[locale]/(marketing)/roadmap/page.tsx");
    // D2 A (02/10): nessun chip «In sviluppo»; solo la descrizione nella colonna Future
    expect(src).not.toMatch(/status: "in-progress",\s*title: \{ it: "Dashboard web nativa"/);
    expect(src).toMatch(/\{\s*title: \{ it: "Dashboard web nativa"/);
    // non nella colonna «Now · In produzione / Vivo e in mano agli utenti»
    expect(src.indexOf('title: { it: "Dashboard web nativa"')).toBeGreaterThan(src.indexOf('id: "future"'));
    expect(src).not.toMatch(/status: "live",\s*title: \{ it: "Dashboard web nativa"/);
  });
});
