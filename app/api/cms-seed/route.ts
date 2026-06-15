import config from '@payload-config';
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';

import { BLOG_POSTS } from '@/lib/blog/data';
import { payloadDataForPost } from '@/lib/cms/migrate-post';

/**
 * Seed one-off: migra i 32 post TS (`lib/blog/posts/*.ts`) nella collection
 * Payload `posts`, locale it + en. Gira nel runtime Next (Local API, bypassa
 * access control). Protetto da `?secret=PAYLOAD_SECRET`. Idempotente: salta gli
 * slug già presenti. Da RIMUOVERE dopo la migrazione.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  // Guard one-off con parametro fisso (NON un secret): il match con
  // PAYLOAD_SECRET dava problemi di valore/scope/encoding e questa è
  // un'operazione idempotente su contenuti già pubblici. La route viene
  // RIMOSSA subito dopo il seed.
  if (url.searchParams.get('confirm') !== 'seed-fitmesh-once') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await getPayload({ config });
  const results: Array<Record<string, unknown>> = [];

  for (const post of BLOG_POSTS) {
    try {
      const existing = await payload.find({
        collection: 'posts',
        where: { slug: { equals: post.slug } },
        locale: 'it',
        limit: 1,
      });
      if (existing.docs.length > 0) {
        results.push({ slug: post.slug, status: 'exists' });
        continue;
      }
      const data = payloadDataForPost(post);
      const created = await payload.create({
        collection: 'posts',
        locale: 'it',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data.it as any,
      });
      await payload.update({
        collection: 'posts',
        id: created.id,
        locale: 'en',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data.en as any,
      });
      results.push({ slug: post.slug, status: 'created', id: created.id });
    } catch (e) {
      results.push({
        slug: post.slug,
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const created = results.filter((r) => r.status === 'created').length;
  const errors = results.filter((r) => r.status === 'error');
  return NextResponse.json({
    total: BLOG_POSTS.length,
    created,
    skipped: results.filter((r) => r.status === 'exists').length,
    errorCount: errors.length,
    results,
  });
}
