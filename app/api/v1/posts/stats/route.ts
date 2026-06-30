/**
 * Contatori pubblici per i post del blog: visualizzazioni e condivisioni.
 *
 *   GET  /api/v1/posts/stats?slug=<canonical>   -> { views, shares }
 *   POST /api/v1/posts/stats { slug, kind }      -> { views, shares }
 *        kind = "view" | "share"
 *
 * Lo slug deve essere uno slug canonico di un post reale (anti-spam sui
 * contatori). L'incremento passa solo dalle RPC security-definer
 * `increment_post_view` / `increment_post_share`, eseguite con service_role.
 * Nessun dato personale: si memorizzano solo gli aggregati.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/api/auth-helpers";
import { BLOG_SLUGS } from "@/lib/blog/data";

// Cast generico: post_stats non e' ancora nei tipi DB generati.
type Sb = SupabaseClient;

export const revalidate = 0;

const KNOWN_SLUGS = new Set(BLOG_SLUGS);

async function readStats(sb: Sb, slug: string) {
  const { data } = await sb
    .from("post_stats")
    .select("views, shares")
    .eq("slug", slug)
    .maybeSingle();
  return {
    views: Number((data as { views?: number } | null)?.views ?? 0),
    shares: Number((data as { shares?: number } | null)?.shares ?? 0),
  };
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug || !KNOWN_SLUGS.has(slug)) return jsonError(400, "unknown_slug");

  const sb = createAdminClient() as unknown as Sb;
  try {
    return jsonOk(await readStats(sb, slug));
  } catch {
    return jsonError(500, "read_failed");
  }
}

export async function POST(req: Request) {
  let body: { slug?: unknown; kind?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "bad_json");
  }

  const slug = typeof body.slug === "string" ? body.slug : "";
  const kind = body.kind;
  if (!slug || !KNOWN_SLUGS.has(slug)) return jsonError(400, "unknown_slug");
  if (kind !== "view" && kind !== "share") return jsonError(400, "bad_kind");

  const sb = createAdminClient() as unknown as Sb;
  const fn = kind === "view" ? "increment_post_view" : "increment_post_share";
  const { error } = await sb.rpc(fn, { p_slug: slug });
  if (error) return jsonError(500, "increment_failed");

  try {
    return jsonOk(await readStats(sb, slug));
  } catch {
    return jsonError(500, "read_failed");
  }
}
