import config from '@payload-config';
import { getPayload } from 'payload';

import { BLOG_POSTS } from './data';
import type { BlogCategory, BlogPost, BlogSection, Localized } from './types';

/**
 * Sorgente blog da Payload CMS, con FALLBACK ai moduli TS (`./data`) se il CMS
 * non è raggiungibile (es. produzione senza `DATABASE_URI`). Questo rende il
 * merge sicuro: il sito continua a funzionare coi post TS finché l'env Payload
 * su Vercel non è configurato; appena c'è, legge dal CMS.
 *
 * Legge con `locale: 'all'` → i campi localizzati arrivano come `{it,en,es}`,
 * quasi identici alla forma `Localized` di `BlogPost`. Il corpo ora è un richText
 * lexical per lingua: si mappano i nodi `body.root.children` (it/en) verso
 * `BlogSection[]` e si "zippano" per indice per ricostruire la forma bilingue.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function L(it: Any, en: Any): Localized {
  const itv = (it ?? '') as string;
  return { it: itv, en: (en ?? itv) as string };
}

function LList(itArr: Any, enArr: Any, map: (x: Any) => string) {
  const it = ((itArr ?? []) as Any[]).map(map);
  const en = ((enArr ?? itArr ?? []) as Any[]).map(map);
  return { it, en };
}

/**
 * Estrae il testo da un nodo lexical concatenando i text node figli; i run con
 * `format & 1` (bold) vengono ri-avvolti in `**...**` così il `BlogRenderer`
 * esistente li renderizza in grassetto (light-markdown).
 */
function inlineText(node: Any): string {
  const children = (node?.children ?? []) as Any[];
  return children
    .map((c) => {
      const t = (c?.text ?? '') as string;
      return (Number(c?.format) & 1) === 1 ? `**${t}**` : t;
    })
    .join('');
}

function sectionFrom(it: Any, en: Any): BlogSection | null {
  if (!it) return null;
  const type = it.type as string;
  if (type === 'heading') {
    const level = String(it.tag) === 'h3' ? 3 : 2;
    return { type: 'heading', level, text: L(inlineText(it), en && inlineText(en)) };
  }
  if (type === 'paragraph') {
    return { type: 'paragraph', text: L(inlineText(it), en && inlineText(en)) };
  }
  if (type === 'list') {
    const items = (li: Any) => ((li?.children ?? []) as Any[]).map((item) => inlineText(item));
    return {
      type: 'list',
      ordered: it.listType === 'number',
      items: { it: items(it), en: items(en ?? it) },
    };
  }
  if (type !== 'block') return null;

  const f = (it.fields ?? {}) as Any;
  const ef = (en?.fields ?? undefined) as Any;
  switch (f.blockType as string) {
    case 'callout':
      return {
        type: 'callout',
        variant: f.variant,
        ...(f.title != null ? { title: L(f.title, ef?.title) } : {}),
        body: L(f.body, ef?.body),
      };
    case 'table':
      return {
        type: 'table',
        ...(f.caption != null ? { caption: L(f.caption, ef?.caption) } : {}),
        headers: LList(f.headers, ef?.headers, (h) => h.header),
        rows: ((f.rows ?? []) as Any[]).map((r, i) => ({
          it: ((r.cells ?? []) as Any[]).map((c) => c.value),
          en: (((ef?.rows?.[i]?.cells ?? r.cells) ?? []) as Any[]).map((c) => c.value),
        })),
      };
    case 'comparison':
      return {
        type: 'comparison',
        aTitle: L(f.aTitle, ef?.aTitle),
        aItems: LList(f.aItems, ef?.aItems, (x) => x.item),
        bTitle: L(f.bTitle, ef?.bTitle),
        bItems: LList(f.bItems, ef?.bItems, (x) => x.item),
      };
    case 'cta':
      return {
        type: 'cta',
        title: L(f.title, ef?.title),
        body: L(f.body, ef?.body),
        ctaLabel: L(f.ctaLabel, ef?.ctaLabel),
        ctaHref: L(f.ctaHref, ef?.ctaHref),
      };
    default:
      return null;
  }
}

function docToBlogPost(doc: Any): BlogPost {
  const itBody = (doc.body?.it?.root?.children ?? []) as Any[];
  const enBody = (doc.body?.en?.root?.children ?? []) as Any[];
  const body = itBody
    .map((b, i) => sectionFrom(b, enBody[i]))
    .filter((s): s is BlogSection => s !== null);

  const itFaq = (doc.faq?.it ?? []) as Any[];
  const enFaq = (doc.faq?.en ?? []) as Any[];

  return {
    slug: (doc.slug?.it ?? doc.slug?.en ?? '') as string,
    category: doc.category as BlogCategory,
    publishedAt: ((doc.publishedAt ?? '') as string).slice(0, 10),
    updatedAt: ((doc.updatedAtContent ?? doc.publishedAt ?? '') as string).slice(0, 10),
    readMinutes: (doc.readMinutes ?? 0) as number,
    pillar: Boolean(doc.pillar),
    ldType: (doc.ldType ?? 'BlogPosting') as 'Article' | 'BlogPosting',
    hero: {
      kicker: L(doc.hero?.kicker?.it, doc.hero?.kicker?.en),
      title: L(doc.hero?.title?.it, doc.hero?.title?.en),
      subtitle: L(doc.hero?.subtitle?.it, doc.hero?.subtitle?.en),
    },
    metaDescription: L(doc.metaDescription?.it, doc.metaDescription?.en),
    primaryKeyword: L(doc.primaryKeyword?.it, doc.primaryKeyword?.en),
    secondaryKeywords: LList(doc.secondaryKeywords?.it, doc.secondaryKeywords?.en, (x) => x.kw),
    tldr: LList(doc.tldr?.it, doc.tldr?.en, (x) => x.point),
    body,
    faq: itFaq.map((f, i) => ({
      q: L(f.q, enFaq[i]?.q),
      a: L(f.a, enFaq[i]?.a),
    })),
    related: (doc.related ?? []) as string[],
    brandsMentioned: ((doc.brandsMentioned ?? []) as Any[]).map((b) => b.brand),
  };
}

let memo: Promise<BlogPost[]> | null = null;

async function loadFromPayload(): Promise<BlogPost[] | null> {
  try {
    const payload = await getPayload({ config });
    const res = await payload.find({
      collection: 'posts',
      locale: 'all',
      depth: 0,
      limit: 1000,
      sort: '-publishedAt',
    });
    if (!res?.docs?.length) return null;
    return (res.docs as Any[]).map(docToBlogPost);
  } catch {
    return null;
  }
}

/** Tutti i post (CMS se disponibile, altrimenti i moduli TS). Ordine desc per data. */
export function getBlogPosts(): Promise<BlogPost[]> {
  memo ??= loadFromPayload().then((cms) =>
    cms && cms.length > 0
      ? [...cms].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      : BLOG_POSTS,
  );
  return memo;
}

export async function getBlogPostsBySlug(): Promise<Record<string, BlogPost>> {
  return Object.fromEntries((await getBlogPosts()).map((p) => [p.slug, p]));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return (await getBlogPosts()).find((p) => p.slug === slug);
}

export async function getBlogSlugs(): Promise<string[]> {
  return (await getBlogPosts()).map((p) => p.slug);
}

export async function getPostsByCategory(c: BlogCategory): Promise<BlogPost[]> {
  return (await getBlogPosts()).filter((p) => p.category === c);
}

export async function getRelatedPosts(slugs: string[] | undefined): Promise<BlogPost[]> {
  if (!slugs?.length) return [];
  const bySlug = await getBlogPostsBySlug();
  return slugs.map((s) => bySlug[s]).filter((p): p is BlogPost => Boolean(p));
}
