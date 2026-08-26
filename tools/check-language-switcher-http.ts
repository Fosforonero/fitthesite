/**
 * SPRINT P0.14 — guardrail HTTP esaustivo del selettore lingua blog
 * (addendum, FASE D punto B).
 *
 * Per OGNI post e OGNI locale che `blogLanguages()` (la SSOT unica di
 * hreflang e del selettore lingua, `lib/blog/indexability.ts`) dichiara
 * indicizzabile, verifica contro un server reale che la destinazione che il
 * menu offrirebbe sia:
 *   - 200 diretta (zero hop: nessun redirect, `redirect: "manual"`);
 *   - indicizzabile (nessun `<meta name="robots" content="noindex">`);
 *   - self-canonical (il `<link rel="canonical">` della pagina punta
 *     esattamente all'URL appena richiesto, non altrove).
 *
 * Richiede un server reale (`BASE_URL`, es. `next start`): se assente, salta
 * dichiarando esplicitamente lo skip — non si dichiara mai verde un check
 * che non è stato eseguito (stessa convenzione di
 * check-seo-redirect-integrity.ts / check-p013-crawl-hygiene.ts).
 */
import { BLOG_POSTS as RAW_BLOG_POSTS } from "@/lib/blog/data";
import { blogLanguages } from "@/lib/blog/indexability";
import { applyNordicOverlay, type NordicOverlay } from "@/lib/blog/nordic-overlay";
import nordicOverlayJson from "@/lib/blog/nordic-overlay.json";

const BASE_URL = process.env.BASE_URL;

// `blog/[slug]/page.tsx` legge da `getBlogPosts()`, che applica l'overlay
// nordico (sv/da/no/fi, vedi `nordic-overlay.ts`) prima di generare
// metadata/hreflang: un post con overlay completo per una di quelle lingue
// e' realmente indicizzabile li', anche se `BLOG_POSTS` grezzo no. Stesso
// pattern di clone+overlay di `syncPostsBySlug()` in indexability.ts —
// nessuna dipendenza da Payload/CMS, stessa funzione di overlay.
const BLOG_POSTS = RAW_BLOG_POSTS.map((p) => {
  const clone = structuredClone(p);
  applyNordicOverlay(clone, nordicOverlayJson as NordicOverlay);
  return clone;
});

async function main(): Promise<void> {
  if (!BASE_URL) {
    console.log("⚠ BASE_URL non impostato — guardrail HTTP selettore lingua SALTATO, non dichiarato verde.");
    return;
  }

  // Unione di tutte le destinazioni emesse da blogLanguages() per tutti i
  // post (x-default escluso: non è mai un'opzione del menu) — dedup per URL,
  // così una destinazione condivisa da più post/locale si verifica una sola
  // volta.
  const urls = new Set<string>();
  for (const post of BLOG_POSTS) {
    const langs = blogLanguages(post);
    for (const [locale, href] of Object.entries(langs)) {
      if (locale === "x-default") continue;
      urls.add(href);
    }
  }

  const errors: string[] = [];
  let checked = 0;
  const list = Array.from(urls);
  const CONCURRENCY = 12;
  let cursor = 0;

  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= list.length) return;
      const siteUrl = list[i];
      const path = new URL(siteUrl).pathname;
      const url = `${BASE_URL}${path}`;
      let res: Response;
      try {
        res = await fetch(url, { redirect: "manual" });
      } catch (e) {
        errors.push(`[fetch-failed] ${path}: ${(e as Error).message}`);
        continue;
      }
      checked++;
      if (res.status !== 200) {
        errors.push(`[non-200] ${path}: HTTP ${res.status} (atteso 200 diretta, zero hop)`);
        continue;
      }
      const html = await res.text();
      if (/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
        errors.push(`[noindex] ${path}: robots noindex, ma blogLanguages() la dichiara indicizzabile`);
      }
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      if (!canonicalMatch) {
        errors.push(`[canonical-assente] ${path}: nessun <link rel="canonical">`);
      } else if (canonicalMatch[1] !== siteUrl) {
        errors.push(`[non-self-canonical] ${path}: canonical="${canonicalMatch[1]}", atteso "${siteUrl}"`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  if (errors.length > 0) {
    console.error(`❌ Guardrail HTTP selettore lingua: ${errors.length} problemi su ${checked} destinazioni uniche verificate:`);
    for (const e of errors.slice(0, 50)) console.error(`  ${e}`);
    if (errors.length > 50) console.error(`  ... e altri ${errors.length - 50}`);
    process.exit(1);
  }

  console.log(`✅ Guardrail HTTP selettore lingua: ${checked} destinazioni uniche (da ${BLOG_POSTS.length} post) tutte 200 dirette, indicizzabili, self-canonical contro ${BASE_URL}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
