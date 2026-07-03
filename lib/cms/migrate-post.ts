import type { BlogPost, BlogSection } from '@/lib/blog/types';

/**
 * Converte un `BlogPost` (modulo TS) nei dati per la collection Payload `posts`.
 * Ritorna i campi comuni + localizzati per `it`, e i soli localizzati per `en`.
 * Lo slug per ora è condiviso (EN riusa quello IT, com'era); gli slug ES/EN
 * dedicati si assegneranno dopo nel CMS.
 */
type L = 'it' | 'en' | 'es';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LexNode = Record<string, any>;

/**
 * Parser inline per il light-markdown `**bold**`: divide la stringa sui run
 * `**...**` e produce text node lexical alternando `format:0` (normale) e
 * `format:1` (bold). Gli asterischi vengono rimossi.
 */
function textNodes(raw: string): LexNode[] {
  const out: LexNode[] = [];
  // Split mantenendo i delimitatori: i segmenti dispari sono i bold.
  const parts = (raw ?? '').split(/\*\*(.+?)\*\*/g);
  parts.forEach((part, i) => {
    if (part === '') return;
    out.push({
      type: 'text',
      text: part,
      detail: 0,
      format: i % 2 === 1 ? 1 : 0,
      mode: 'normal',
      style: '',
      version: 1,
    });
  });
  return out;
}

function paragraphNode(text: string): LexNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    textFormat: 0,
    children: textNodes(text),
  };
}

function headingNode(level: 2 | 3, text: string): LexNode {
  return {
    type: 'heading',
    tag: `h${level}`,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: textNodes(text),
  };
}

function listNode(ordered: boolean, items: string[]): LexNode {
  return {
    type: 'list',
    listType: ordered ? 'number' : 'bullet',
    tag: ordered ? 'ol' : 'ul',
    start: 1,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: items.map((item, i) => ({
      type: 'listitem',
      value: i + 1,
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: textNodes(item),
    })),
  };
}

/** Wrappa i campi di un blocco SEO in un nodo lexical `block` (version 2). */
function blockNode(fields: Block): LexNode {
  return { type: 'block', format: '', version: 2, fields };
}

/**
 * Converte `BlogSection[]` nel valore richText lexical atteso da Payload per
 * una data lingua. Heading/paragraph/list diventano nodi nativi; i 4 blocchi
 * SEO (callout/table/comparison/cta) restano nodi `block` con gli STESSI campi
 * prodotti in precedenza. `id` deterministico per blocco: `${lc}-${index}`.
 */
// Accesso es-safe: se manca `es` (es. campi non tradotti o tipi solo it/en
// come ctaHref/secondaryKeywords) cade su en, poi it.
const pick = (o: { it: string; en: string; es?: string }, lc: L): string =>
  o[lc] ?? o.en ?? o.it;
const pickL = (o: { it: string[]; en: string[]; es?: string[] }, lc: L): string[] =>
  o[lc] ?? o.en ?? o.it;

export function sectionsToLexical(body: BlogSection[], lc: L): LexNode {
  const children: LexNode[] = body.map((s, index): LexNode => {
    switch (s.type) {
      case 'heading':
        return headingNode(s.level, pick(s.text, lc));
      case 'paragraph':
        return paragraphNode(pick(s.text, lc));
      case 'list':
        return listNode(s.ordered ?? false, pickL(s.items, lc));
      case 'callout':
        return blockNode({
          id: `${lc}-${index}`,
          blockType: 'callout',
          variant: s.variant,
          title: s.title ? pick(s.title, lc) : undefined,
          body: pick(s.body, lc),
        });
      case 'table':
        return blockNode({
          id: `${lc}-${index}`,
          blockType: 'table',
          caption: s.caption ? pick(s.caption, lc) : undefined,
          headers: pickL(s.headers, lc).map((header) => ({ header })),
          rows: s.rows.map((r) => ({ cells: pickL(r, lc).map((value) => ({ value })) })),
        });
      case 'comparison':
        return blockNode({
          id: `${lc}-${index}`,
          blockType: 'comparison',
          aTitle: pick(s.aTitle, lc),
          aItems: pickL(s.aItems, lc).map((item) => ({ item })),
          bTitle: pick(s.bTitle, lc),
          bItems: pickL(s.bItems, lc).map((item) => ({ item })),
        });
      case 'cta':
        return blockNode({
          id: `${lc}-${index}`,
          blockType: 'cta',
          title: pick(s.title, lc),
          body: pick(s.body, lc),
          ctaLabel: pick(s.ctaLabel, lc),
          ctaHref: pick(s.ctaHref, lc),
        });
      case 'image':
        // Il CMS non ha un blocco immagine dedicato: in migrazione lo screenshot
        // e' rappresentato dalla sua didascalia/alt come paragrafo. Le guide con
        // screenshot vivono nei file .ts statici, non nel CMS.
        return paragraphNode(s.caption ? pick(s.caption, lc) : pick(s.alt, lc));
    }
  });

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  };
}

function localeData(p: BlogPost, lc: L): Block {
  return {
    title: p.hero.title[lc],
    slug: p.slug,
    metaDescription: p.metaDescription[lc],
    primaryKeyword: p.primaryKeyword[lc],
    secondaryKeywords: (
      (p.secondaryKeywords as Record<string, string[] | undefined>)[lc] ?? []
    ).map((kw) => ({ kw })),
    tldr: (p.tldr?.[lc] ?? []).map((point) => ({ point })),
    hero: {
      kicker: p.hero.kicker[lc],
      title: p.hero.title[lc],
      subtitle: p.hero.subtitle[lc],
    },
    body: sectionsToLexical(p.body, lc),
    faq: (p.faq ?? []).map((f) => ({ q: f.q[lc], a: f.a[lc] })),
  };
}

export function payloadDataForPost(p: BlogPost): { it: Block; en: Block } {
  const common: Block = {
    category: p.category,
    publishedAt: p.publishedAt,
    updatedAtContent: p.updatedAt,
    readMinutes: p.readMinutes,
    pillar: p.pillar ?? false,
    ldType: p.ldType ?? 'BlogPosting',
    related: p.related ?? [],
    brandsMentioned: (p.brandsMentioned ?? []).map((brand) => ({ brand })),
  };
  return {
    it: { ...common, ...localeData(p, 'it') },
    en: localeData(p, 'en'),
  };
}
