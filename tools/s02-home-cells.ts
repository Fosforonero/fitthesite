/**
 * tools/s02-home-cells.ts: localizzatore delle celle del pacchetto home S02
 * (testo base BASE-HOME-v2.1-8961c3f9) nelle 13 lingue diverse da it/en.
 *
 * Modulo condiviso da:
 *   - tools/build-s02-home-units.ts  (costruisce tools/data/s02-home-units.json)
 *   - tools/check-s02-home-lingue.ts (gate di rilascio del pacchetto)
 *
 * Legge i valori dall'albero indicato da `root` (di norma la cwd). Per il
 * baseline f142eac il builder estrae l'albero in una cartella a parte e
 * rilancia questo file con `--dump` dentro quella cartella.
 *
 * Uso: npx tsx tools/s02-home-cells.ts --dump   (JSON su stdout, root = cwd)
 */
import fs from "node:fs";
import path from "node:path";

export const LANGS13 = ["es", "de", "fr", "pt", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"] as const;
export type Lang13 = (typeof LANGS13)[number];

/** Valore di una cella: stringa non vuota, oppure null se assente. */
export type CellValue = string | null;
export type CellDump = Record<string, Record<string, CellValue>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export interface Ctx {
  root: string;
  dict: Record<string, Any>;
  homepage?: Any;
  pricing?: Any;
  about?: Any;
  faqs?: Any;
  facts?: Any;
  ai?: Any;
  meta?: Any;
  legacyMeta?: { titles?: Record<string, string>; descriptions?: Record<string, string> };
}

async function tryImport(root: string, rel: string): Promise<Any | undefined> {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return undefined;
  return import(full);
}

/** Estrae da layout.tsx del baseline gli oggetti `titles`/`descriptions` (prima del modulo home-meta). */
function legacyMetaFromLayout(root: string): Ctx["legacyMeta"] {
  const rel = "app/(frontend)/[locale]/(marketing)/layout.tsx";
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return undefined;
  const src = fs.readFileSync(full, "utf8");
  const grab = (name: string): Record<string, string> | undefined => {
    const m = src.match(new RegExp(`const ${name}: Record<Locale, string> = (\\{[\\s\\S]*?\\n  \\});`));
    if (!m) return undefined;
    return new Function(`return (${m[1]});`)() as Record<string, string>;
  };
  return { titles: grab("titles"), descriptions: grab("descriptions") };
}

export async function loadCtx(root: string): Promise<Ctx> {
  const dict: Record<string, Any> = {};
  for (const lc of ["it", "en", ...LANGS13]) {
    dict[lc] = JSON.parse(fs.readFileSync(path.join(root, "lib/dictionaries", `${lc}.json`), "utf8"));
  }
  const meta = await tryImport(root, "lib/content/home-meta.ts");
  return {
    root,
    dict,
    homepage: (await tryImport(root, "lib/content/homepage-copy.ts"))?.HOMEPAGE_COPY,
    pricing: (await tryImport(root, "lib/pricing-section.ts"))?.PRICING_SECTION,
    about: (await tryImport(root, "lib/content/about-copy.ts"))?.ABOUT_COPY,
    faqs: (await tryImport(root, "lib/content/faqs.ts"))?.SUPPORT_FAQS,
    facts: await tryImport(root, "lib/product-facts.ts"),
    ai: (await tryImport(root, "lib/content/home-ai-copy.ts"))?.HOME_AI_COPY,
    meta,
    legacyMeta: meta ? undefined : legacyMetaFromLayout(root),
  };
}

const nz = (v: unknown): CellValue => (typeof v === "string" && v.trim().length > 0 ? v : null);

/** Percorso tipo `features.items[4].title` dentro un oggetto. */
export function walk(obj: Any, keyPath: string): unknown {
  let cur = obj;
  for (const part of keyPath.replace(/\[(\d+)\]/g, ".$1").split(".")) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

type Getter = (c: Ctx, lc: string) => CellValue;

const dictGet = (keyPath: string): Getter => (c, lc) => nz(walk(c.dict[lc], keyPath));
const own = (pick: (c: Ctx) => Any, ...rest: string[]): Getter => (c, lc) => {
  const o = pick(c);
  if (!o) return null;
  const v = rest.length ? walk(o, rest.join(".")) : o;
  const rec = v as Record<string, unknown> | undefined;
  return rec && Object.prototype.hasOwnProperty.call(rec, lc) ? nz(rec[lc]) : null;
};
const step = (i: number, f: "t" | "d"): Getter => (c, lc) => {
  const arr = c.homepage?.steps && Object.prototype.hasOwnProperty.call(c.homepage.steps, lc) ? c.homepage.steps[lc] : undefined;
  return nz(arr?.[i]?.[f]);
};
/**
 * FAQ: indice 4 (costo) e 5 (cambio telefono). Dove la lingua non ha la FAQ
 * propria l'array e' piu' corto (7 voci con la FAQ, 5 senza le due cambiate).
 */
const faq = (idx: 4 | 5): Getter => (c, lc) => {
  const arr = c.faqs?.[lc] as { q: string; a: string }[] | undefined;
  if (!arr || arr.length < 7) return null;
  const f = arr[idx];
  return f ? nz(`${f.q}\n${f.a}`) : null;
};
const metaTitle: Getter = (c, lc) =>
  c.meta ? nz(c.meta.HOME_META_TITLES?.[lc]) : nz(c.legacyMeta?.titles?.[lc]);
const metaDesc: Getter = (c, lc) =>
  c.meta ? nz(c.meta.HOME_META_DESCRIPTIONS?.[lc]) : nz(c.legacyMeta?.descriptions?.[lc]);

export interface CellDef {
  id: string;
  /** Lingue interessate (default: le 13). */
  langs?: readonly string[];
  get: Getter;
  /** Dove vive la cella nel sito oggi. */
  locator: string;
  /**
   * La cella non ha un testo proprio: riusa quello di un'altra unita' nella
   * stessa lingua (U-ABOUT-08 legge PRICING_SECTION.subhead = U-PRICE-03).
   * Resta PENDENTE finche' lo e' l'unita' seguita.
   */
  segue?: string;
}

const JA_KO = ["ja", "ko"] as const;

export const CELLS: CellDef[] = [
  { id: "U-HERO-01", get: dictGet("hero.heading_1"), locator: "lib/dictionaries/{lc}.json hero.heading_1" },
  { id: "U-HERO-02", get: dictGet("hero.heading_accent"), locator: "lib/dictionaries/{lc}.json hero.heading_accent" },
  { id: "U-HERO-03", get: own((c) => c.homepage, "leadSentence"), locator: "lib/content/homepage-copy.ts HOMEPAGE_COPY.leadSentence" },
  { id: "U-HERO-04", get: dictGet("hero.description"), locator: "lib/dictionaries/{lc}.json hero.description" },
  { id: "U-STEP-01", get: own((c) => c.homepage, "howItWorksHeading"), locator: "lib/content/homepage-copy.ts HOMEPAGE_COPY.howItWorksHeading" },
  { id: "U-STEP-02", get: step(0, "t"), locator: "lib/content/homepage-copy.ts HOMEPAGE_COPY.steps[0].t" },
  { id: "U-STEP-03", get: step(0, "d"), locator: "lib/content/homepage-copy.ts HOMEPAGE_COPY.steps[0].d" },
  { id: "U-STEP-04", get: step(1, "t"), locator: "lib/content/homepage-copy.ts HOMEPAGE_COPY.steps[1].t" },
  { id: "U-STEP-05", get: step(1, "d"), locator: "lib/content/homepage-copy.ts HOMEPAGE_COPY.steps[1].d" },
  { id: "U-STEP-06", get: step(2, "t"), locator: "lib/content/homepage-copy.ts HOMEPAGE_COPY.steps[2].t" },
  { id: "U-STEP-07", get: step(2, "d"), locator: "lib/content/homepage-copy.ts HOMEPAGE_COPY.steps[2].d" },
  { id: "U-CARD-01", get: dictGet("features.items[4].title"), locator: "lib/dictionaries/{lc}.json features.items[4].title" },
  { id: "U-CARD-02", get: dictGet("features.items[4].desc"), locator: "lib/dictionaries/{lc}.json features.items[4].desc" },
  { id: "U-FEAT-01", get: dictGet("features.heading"), locator: "lib/dictionaries/{lc}.json features.heading" },
  { id: "U-FEAT-02", get: dictGet("features.items[0].desc"), locator: "lib/dictionaries/{lc}.json features.items[0].desc" },
  { id: "U-FEAT-03", get: dictGet("features.items[2].desc"), locator: "lib/dictionaries/{lc}.json features.items[2].desc" },
  { id: "U-AI-02", get: own((c) => c.ai, "heading"), locator: "lib/content/home-ai-copy.ts HOME_AI_COPY.heading" },
  { id: "U-AI-03", get: own((c) => c.ai, "body"), locator: "lib/content/home-ai-copy.ts HOME_AI_COPY.body" },
  { id: "U-AI-05", get: own((c) => c.ai, "linkLabel"), locator: "lib/content/home-ai-copy.ts HOME_AI_COPY.linkLabel" },
  { id: "U-PRICE-02", get: own((c) => c.pricing, "heading"), locator: "lib/pricing-section.ts PRICING_SECTION.heading" },
  { id: "U-PRICE-03", langs: JA_KO, get: own((c) => c.pricing, "subhead"), locator: "lib/pricing-section.ts PRICING_SECTION.subhead (solo ja, ko)" },
  { id: "U-PRICE-04", get: own((c) => c.pricing, "storeNote"), locator: "lib/pricing-section.ts PRICING_SECTION.storeNote" },
  { id: "U-PRICE-11", get: own((c) => c.pricing, "proTagline"), locator: "lib/pricing-section.ts PRICING_SECTION.proTagline" },
  { id: "U-PRICE-13", get: own((c) => c.pricing, "priceFromStore"), locator: "lib/pricing-section.ts PRICING_SECTION.priceFromStore" },
  { id: "U-PRICE-16", get: dictGet("final_cta.description"), locator: "lib/dictionaries/{lc}.json final_cta.description" },
  { id: "U-FAQ-01", get: faq(4), locator: "lib/content/faqs.ts SUPPORT_FAQS[lc][4] (q + a)" },
  { id: "U-FAQ-02", get: faq(5), locator: "lib/content/faqs.ts SUPPORT_FAQS[lc][5] (q + a)" },
  { id: "U-PRIV-11", get: dictGet("footer.tagline"), locator: "lib/dictionaries/{lc}.json footer.tagline" },
  { id: "U-ABOUT-01", get: own((c) => c.about, "metaTitle"), locator: "lib/content/about-copy.ts ABOUT_COPY.metaTitle" },
  { id: "U-ABOUT-02", get: own((c) => c.about, "metaDescription"), locator: "lib/content/about-copy.ts ABOUT_COPY.metaDescription" },
  { id: "U-ABOUT-03", get: own((c) => c.about, "heroTitlePrefix"), locator: "lib/content/about-copy.ts ABOUT_COPY.heroTitlePrefix" },
  { id: "U-ABOUT-04", get: own((c) => c.about, "heroTitleAccent"), locator: "lib/content/about-copy.ts ABOUT_COPY.heroTitleAccent" },
  { id: "U-ABOUT-05", get: own((c) => c.about, "heroDescription"), locator: "lib/content/about-copy.ts ABOUT_COPY.heroDescription" },
  { id: "U-ABOUT-08", langs: JA_KO, get: own((c) => c.about, "trialDesc"), locator: "lib/content/about-copy.ts ABOUT_COPY.trialDesc (solo ja, ko)", segue: "U-PRICE-03" },
  { id: "U-ABOUT-10", get: own((c) => c.about, "featuresIntro"), locator: "lib/content/about-copy.ts ABOUT_COPY.featuresIntro" },
  { id: "U-ABOUT-11", get: own((c) => c.about, "devicesIntro"), locator: "lib/content/about-copy.ts ABOUT_COPY.devicesIntro" },
  { id: "U-ABOUT-12", get: own((c) => c.about, "pixelWatchDevice"), locator: "lib/content/about-copy.ts ABOUT_COPY.pixelWatchDevice" },
  { id: "U-ABOUT-13", get: own((c) => c.about, "teamBody1"), locator: "lib/content/about-copy.ts ABOUT_COPY.teamBody1" },
  { id: "U-META-01", get: metaTitle, locator: "lib/content/home-meta.ts HOME_META_TITLES" },
  { id: "U-META-02", get: metaDesc, locator: "lib/content/home-meta.ts HOME_META_DESCRIPTIONS" },
  { id: "U-META-04", get: (c, lc) => nz(c.facts?.ORG_DESCRIPTIONS?.[lc]), locator: "lib/product-facts.ts ORG_DESCRIPTIONS" },
];

export function cellLangs(def: CellDef): readonly string[] {
  return def.langs ?? LANGS13;
}

export async function dumpValues(root: string): Promise<{ ctx: Ctx; values: CellDump }> {
  const ctx = await loadCtx(root);
  const values: CellDump = {};
  for (const def of CELLS) {
    values[def.id] = {};
    for (const lc of cellLangs(def)) values[def.id][lc] = def.get(ctx, lc);
  }
  return { ctx, values };
}

// Modalita' --dump: JSON dei valori dell'albero in cwd (usata dal builder sul baseline).
if (process.argv.includes("--dump")) {
  dumpValues(process.cwd())
    .then(({ values }) => process.stdout.write(JSON.stringify(values)))
    .catch((e) => {
      console.error(e);
      process.exit(2);
    });
}
