import config from '@payload-config';
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import { BLOG_POSTS } from '@/lib/blog/data';
import { sectionsToLexical } from '@/lib/cms/migrate-post';

export const dynamic = 'force-dynamic';

// ONE-OFF: scrive il locale `es` dei post CMS esistenti dal sorgente TS (ora tradotto).
// Guard con confirm fisso; rimuovere dopo l'uso.
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('confirm') !== 'es-migrate-once') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const payload = await getPayload({ config });
  const results: Array<Record<string, unknown>> = [];
  for (const p of BLOG_POSTS) {
    try {
      // Salta i post senza traduzione es (es. best-smartwatch-for-elderly).
      if (!p.hero?.title?.es) { results.push({ slug: p.slug, status: 'no-es' }); continue; }
      const found = await payload.find({
        collection: 'posts', where: { slug: { equals: p.slug } }, locale: 'it', limit: 1, depth: 0,
      });
      const doc = found.docs[0];
      if (!doc) { results.push({ slug: p.slug, status: 'missing-in-cms' }); continue; }
      await payload.update({
        collection: 'posts', id: doc.id, locale: 'es', depth: 0,
        data: {
          title: p.hero.title.es,
          slug: p.slug,
          metaDescription: p.metaDescription.es,
          primaryKeyword: p.primaryKeyword.es,
          tldr: (p.tldr?.es ?? []).map((point) => ({ point })),
          hero: { kicker: p.hero.kicker.es, title: p.hero.title.es, subtitle: p.hero.subtitle.es },
          body: sectionsToLexical(p.body, 'es'),
          faq: (p.faq ?? []).map((f) => ({ q: f.q.es, a: f.a.es })),
        },
      });
      results.push({ slug: p.slug, status: 'es-updated', id: doc.id });
    } catch (e) {
      let cur: unknown = e; const chain: string[] = [];
      for (let i = 0; i < 4 && cur; i++) { const c = cur as { message?: string; code?: string; cause?: unknown }; chain.push(`[${c.code ?? '-'}] ${(c.message ?? String(c)).slice(0, 160)}`); cur = c.cause; }
      results.push({ slug: p.slug, status: 'error', error: chain });
    }
  }
  const ok = results.filter((r) => r.status === 'es-updated').length;
  return NextResponse.json({ total: BLOG_POSTS.length, esUpdated: ok, results });
}
