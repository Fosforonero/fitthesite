import config from '@payload-config';
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import { BLOG_POSTS } from '@/lib/blog/data';
import { payloadDataForPost } from '@/lib/cms/migrate-post';

export const dynamic = 'force-dynamic';

// ONE-OFF: riscrive il body dei post esistenti in formato lexical (it+en).
// Guard con confirm param fisso; rimuovere dopo l'uso.
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get('confirm') !== 'relexical-once') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const payload = await getPayload({ config });
  const results: Array<Record<string, unknown>> = [];
  for (const post of BLOG_POSTS) {
    try {
      const found = await payload.find({
        collection: 'posts',
        where: { slug: { equals: post.slug } },
        locale: 'it',
        limit: 1,
        depth: 0,
      });
      const doc = found.docs[0];
      if (!doc) { results.push({ slug: post.slug, status: 'missing' }); continue; }
      const data = payloadDataForPost(post);
      await payload.update({ collection: 'posts', id: doc.id, locale: 'it', depth: 0, data: { body: (data.it as Record<string, unknown>).body } });
      await payload.update({ collection: 'posts', id: doc.id, locale: 'en', depth: 0, data: { body: (data.en as Record<string, unknown>).body } });
      results.push({ slug: post.slug, status: 'updated', id: doc.id });
    } catch (e) {
      let cur: unknown = e;
      const chain: string[] = [];
      for (let i = 0; i < 6 && cur; i++) {
        const c = cur as { message?: string; code?: string; detail?: string; cause?: unknown };
        chain.push(`[${c.code ?? '-'}] ${(c.message ?? String(c)).slice(0, 240)}${c.detail ? ' | ' + c.detail : ''}`);
        cur = c.cause;
      }
      results.push({ slug: post.slug, status: 'error', error: chain });
    }
  }
  const updated = results.filter((r) => r.status === 'updated').length;
  return NextResponse.json({ total: BLOG_POSTS.length, updated, results });
}
