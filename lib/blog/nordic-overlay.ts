/**
 * Overlay traduzioni nordiche (sv/da/no/fi) per i post del blog.
 *
 * I 51 post sono `BlogPost` con campi `Localized`/`LocalizedList` che hanno
 * it/en + le altre lingue. Le nordiche NON vengono scritte nei file TS: stanno
 * in un overlay JSON (`nordic-overlay.json`) e vengono iniettate in memoria al
 * caricamento (vedi `payload-source`). Chiave: slug -> path del campo -> lingua.
 * Path stabile prodotto da `walkPost` (usato sia per estrarre sia per applicare).
 */
import type { BlogPost, BlogSection, Localized, LocalizedList } from "./types";

export type NordicLang = "sv" | "da" | "no" | "fi";
export const NORDIC_LANGS: NordicLang[] = ["sv", "da", "no", "fi"];

export type Entry =
  | { path: string; kind: "loc"; node: Localized }
  | { path: string; kind: "list"; node: LocalizedList };

/** Percorre i campi traducibili del post, con path stabile e riferimento all'oggetto. */
export function walkPost(post: BlogPost): Entry[] {
  const out: Entry[] = [];
  const loc = (path: string, node: Localized | undefined) => {
    if (node) out.push({ path, kind: "loc", node });
  };
  const list = (path: string, node: LocalizedList | undefined) => {
    if (node) out.push({ path, kind: "list", node });
  };

  loc("hero.kicker", post.hero.kicker);
  loc("hero.title", post.hero.title);
  loc("hero.subtitle", post.hero.subtitle);
  loc("metaDescription", post.metaDescription);
  loc("primaryKeyword", post.primaryKeyword);
  list("secondaryKeywords", post.secondaryKeywords);
  if (post.tldr) list("tldr", post.tldr);

  post.body.forEach((s, i) => walkSection(s, `body.${i}`, out));

  (post.faq ?? []).forEach((f, i) => {
    loc(`faq.${i}.q`, f.q);
    loc(`faq.${i}.a`, f.a);
  });

  return out;
}

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

export type OverlayValue = Partial<Record<NordicLang, string>>;
export type OverlayListValue = Partial<Record<NordicLang, string[]>>;
export type PostOverlay = Record<string, OverlayValue | OverlayListValue>;
/** slug -> path -> valore per lingua. */
export type NordicOverlay = Record<string, PostOverlay>;

/** Inietta sv/da/no/fi negli oggetti `Localized`/`LocalizedList` del post (muta in memoria). */
export function applyNordicOverlay(post: BlogPost, overlay: NordicOverlay): void {
  const po = overlay[post.slug];
  if (!po) return;
  for (const e of walkPost(post)) {
    const v = po[e.path];
    if (!v) continue;
    for (const lang of NORDIC_LANGS) {
      const t = (v as Record<string, unknown>)[lang];
      if (t == null) continue;
      (e.node as Record<string, unknown>)[lang] = t;
    }
  }
}

/** True se il post ha l'overlay completo (tutti i campi, tutte e 4 le lingue): usato per togliere il noindex. */
export function isFullyTranslated(post: BlogPost, overlay: NordicOverlay): boolean {
  const po = overlay[post.slug];
  if (!po) return false;
  const entries = walkPost(post);
  if (entries.length === 0) return false;
  for (const e of entries) {
    const v = po[e.path];
    if (!v) return false;
    for (const lang of NORDIC_LANGS) {
      if ((v as Record<string, unknown>)[lang] == null) return false;
    }
  }
  return true;
}
