/**
 * Overlay spagnolo per le landing page: completa i campi `Localized`/`LocalizedList`
 * che hanno `en` ma non `es`. Gap-fill (NON sovrascrive es esistente), iniettato in
 * memoria al load (vedi fondo di `data.ts`). Chiave: slug -> path -> valore es.
 * Path stabile prodotto da `walkLanding` (usato sia per estrarre sia per applicare).
 */
import type { LandingPage } from "./data";
import type { BlogSection, Localized, LocalizedList } from "@/lib/blog/types";

export type Entry =
  | { path: string; kind: "loc"; node: Localized }
  | { path: string; kind: "list"; node: LocalizedList };

function walkSection(s: BlogSection, base: string, out: Entry[]): void {
  const loc = (p: string, n: Localized | undefined) => {
    if (n) out.push({ path: p, kind: "loc", node: n });
  };
  const list = (p: string, n: LocalizedList | undefined) => {
    if (n) out.push({ path: p, kind: "list", node: n });
  };
  switch (s.type) {
    case "heading":
    case "paragraph":
      loc(`${base}.text`, s.text);
      break;
    case "list":
      list(`${base}.items`, s.items);
      break;
    case "callout":
      if (s.title) loc(`${base}.title`, s.title);
      loc(`${base}.body`, s.body);
      break;
    case "table":
      if (s.caption) loc(`${base}.caption`, s.caption);
      list(`${base}.headers`, s.headers);
      s.rows.forEach((r, j) => list(`${base}.rows.${j}`, r));
      break;
    case "comparison":
      loc(`${base}.aTitle`, s.aTitle);
      list(`${base}.aItems`, s.aItems);
      loc(`${base}.bTitle`, s.bTitle);
      list(`${base}.bItems`, s.bItems);
      break;
    case "cta":
      loc(`${base}.title`, s.title);
      loc(`${base}.body`, s.body);
      loc(`${base}.ctaLabel`, s.ctaLabel);
      // ctaHref: URL/path, non si traduce.
      break;
  }
}

/** Percorre i campi traducibili della landing (label CTA sì, href no). */
export function walkLanding(lp: LandingPage): Entry[] {
  const out: Entry[] = [];
  const loc = (path: string, node: Localized | undefined) => {
    if (node) out.push({ path, kind: "loc", node });
  };
  const list = (path: string, node: LocalizedList | undefined) => {
    if (node) out.push({ path, kind: "list", node });
  };

  loc("hero.kicker", lp.hero.kicker);
  loc("hero.title", lp.hero.title);
  loc("hero.subtitle", lp.hero.subtitle);
  loc("hero.primaryCta.label", lp.hero.primaryCta.label);
  if (lp.hero.secondaryCta) loc("hero.secondaryCta.label", lp.hero.secondaryCta.label);
  loc("metaDescription", lp.metaDescription);
  loc("primaryKeyword", lp.primaryKeyword);
  list("secondaryKeywords", lp.secondaryKeywords);

  lp.body.forEach((s, i) => walkSection(s, `body.${i}`, out));

  (lp.faq ?? []).forEach((f, i) => {
    loc(`faq.${i}.q`, f.q);
    loc(`faq.${i}.a`, f.a);
  });

  return out;
}

export type EsOverlay = Record<string, Record<string, string | string[]>>;

/** Inietta `es` dove manca (gap-fill; non sovrascrive es gia' presente). Muta in memoria. */
export function applyLandingEsOverlay(pages: LandingPage[], overlay: EsOverlay): void {
  for (const lp of pages) {
    const po = overlay[lp.slug];
    if (!po) continue;
    for (const e of walkLanding(lp)) {
      const v = po[e.path];
      if (v == null) continue;
      const node = e.node as Record<string, unknown>;
      if (node.es != null) continue; // non sovrascrivere
      if (e.kind === "list") {
        const src = e.node.en ?? e.node.it;
        if (Array.isArray(v) && Array.isArray(src) && v.length === src.length) node.es = v;
      } else if (typeof v === "string") {
        node.es = v;
      }
    }
  }
}

/** Campi con `en` ma senza `es`: per il tool di estrazione/copertura. */
export function landingEsMissing(lp: LandingPage): Entry[] {
  return walkLanding(lp).filter((e) => {
    const node = e.node as Record<string, unknown>;
    const hasEn = (e.node.en ?? e.node.it) != null;
    return hasEn && node.es == null;
  });
}
