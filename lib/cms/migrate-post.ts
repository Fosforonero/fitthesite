import type { BlogPost, BlogSection } from '@/lib/blog/types';

/**
 * Converte un `BlogPost` (modulo TS) nei dati per la collection Payload `posts`.
 * Ritorna i campi comuni + localizzati per `it`, e i soli localizzati per `en`.
 * Lo slug per ora è condiviso (EN riusa quello IT, com'era); gli slug ES/EN
 * dedicati si assegneranno dopo nel CMS.
 */
type L = 'it' | 'en';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = Record<string, any>;

function blocksFor(body: BlogSection[], lc: L): Block[] {
  return body.map((s): Block => {
    switch (s.type) {
      case 'heading':
        return { blockType: 'heading', level: String(s.level), text: s.text[lc] };
      case 'paragraph':
        return { blockType: 'paragraph', text: s.text[lc] };
      case 'list':
        return {
          blockType: 'list',
          ordered: s.ordered ?? false,
          items: s.items[lc].map((item) => ({ item })),
        };
      case 'callout':
        return {
          blockType: 'callout',
          variant: s.variant,
          title: s.title?.[lc],
          body: s.body[lc],
        };
      case 'table':
        return {
          blockType: 'table',
          caption: s.caption?.[lc],
          headers: s.headers[lc].map((header) => ({ header })),
          rows: s.rows.map((r) => ({ cells: r[lc].map((value) => ({ value })) })),
        };
      case 'comparison':
        return {
          blockType: 'comparison',
          aTitle: s.aTitle[lc],
          aItems: s.aItems[lc].map((item) => ({ item })),
          bTitle: s.bTitle[lc],
          bItems: s.bItems[lc].map((item) => ({ item })),
        };
      case 'cta':
        return {
          blockType: 'cta',
          title: s.title[lc],
          body: s.body[lc],
          ctaLabel: s.ctaLabel[lc],
          ctaHref: s.ctaHref[lc],
        };
    }
  });
}

function localeData(p: BlogPost, lc: L): Block {
  return {
    title: p.hero.title[lc],
    slug: p.slug,
    metaDescription: p.metaDescription[lc],
    primaryKeyword: p.primaryKeyword[lc],
    secondaryKeywords: (p.secondaryKeywords[lc] ?? []).map((kw) => ({ kw })),
    tldr: (p.tldr?.[lc] ?? []).map((point) => ({ point })),
    hero: {
      kicker: p.hero.kicker[lc],
      title: p.hero.title[lc],
      subtitle: p.hero.subtitle[lc],
    },
    body: blocksFor(p.body, lc),
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
