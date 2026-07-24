/**
 * P0.9: tombstone deterministico.
 *
 * Questo endpoint alimentava i contatori pubblici di visualizzazioni/
 * condivisioni sotto ogni articolo del blog, chiamato automaticamente da
 * `components/blog/ArticleMeta.tsx` a ogni apertura pagina (POST view) e a
 * ogni visita successiva (GET) — almeno una Function invocation per
 * sessione articolo, e importava l'intero dataset blog (`BLOG_SLUGS`, ogni
 * post) solo per validare lo slug in ingresso. `ArticleMeta` non chiama piu'
 * questo endpoint (i contatori sono stati rimossi dall'interfaccia
 * pubblica).
 *
 * Nessun import Payload/Supabase/dati blog: risposta 410 statica, nessuna
 * query. I dati Supabase (tabella `post_stats`, RPC `increment_post_view`/
 * `increment_post_share`) NON sono stati toccati in questo sprint.
 */
export const dynamic = "force-static";

const TOMBSTONE_HEADERS = {
  "content-type": "application/json",
  // Cache pubblica lunga: la risposta è statica e non cambierà finché
  // questo endpoint non viene rimosso definitivamente dal codice.
  "cache-control": "public, max-age=31536000, immutable",
};

function tombstone(): Response {
  return new Response(JSON.stringify({ error: "gone" }), {
    status: 410,
    headers: TOMBSTONE_HEADERS,
  });
}

export async function GET(): Promise<Response> {
  return tombstone();
}

export async function POST(): Promise<Response> {
  return tombstone();
}
