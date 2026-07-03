/**
 * Guardrail integrità blog — impedisce il ripetersi dei bug SEO trovati il 02/07.
 *
 * Fallisce (exit 1) se:
 *  1. un post del blog non ha una entry `BLOG_SLUGS` con TUTTI i 10 locali non-IT
 *     (senza, quel post userebbe lo slug canonico IT in ogni lingua = SEO rotta);
 *  2. uno slug localizzato è vuoto o collide con un altro post nello stesso locale.
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/work -v "$PWD/fitthesite/node_modules":/work/fitthesite-f1/node_modules:ro \
 *     -w /work/fitthesite-f1 node:22 npx -y tsx tools/check-blog-integrity.ts
 *
 * Da eseguire prima di ogni deploy che tocca il blog. Aggiungere un post SENZA
 * la sua entry in lib/blog/slugs.ts fa fallire questo check.
 */
import { BLOG_POSTS } from "@/lib/blog/data";
import { BLOG_SLUGS as SLUG_MAP } from "@/lib/blog/slugs";
import { locales, UNTRANSLATED_CONTENT_LOCALES } from "@/lib/i18n";

// BLOG_SLUGS copre i 10 locali "stabili": l'IT usa il canonico, e i locali
// nordici (UNTRANSLATED_CONTENT_LOCALES) usano anch'essi il canonico per gli
// URL del blog (il tipo SlugSet non li include), quindi non vanno richiesti qui.
const NON_IT = locales.filter(
  (l) => l !== "it" && !UNTRANSLATED_CONTENT_LOCALES.has(l),
);
const problems: string[] = [];

// 1. Ogni post ha una entry completa.
for (const post of BLOG_POSTS) {
  const set = (SLUG_MAP as Record<string, Record<string, string>>)[post.slug];
  if (!set) {
    problems.push(`[slug-mancante] "${post.slug}": nessuna entry in BLOG_SLUGS (userà lo slug IT in tutte le lingue).`);
    continue;
  }
  for (const lc of NON_IT) {
    const s = set[lc];
    if (!s || !s.trim()) {
      problems.push(`[slug-vuoto] "${post.slug}" manca lo slug per "${lc}".`);
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      problems.push(`[slug-non-kebab] "${post.slug}" [${lc}] = "${s}" non è kebab-case.`);
    }
  }
}

// 2. Collisioni: due post canonici che mappano allo stesso slug in un locale.
for (const lc of NON_IT) {
  const seen = new Map<string, string>();
  for (const post of BLOG_POSTS) {
    const set = (SLUG_MAP as Record<string, Record<string, string>>)[post.slug];
    const s = set?.[lc];
    if (!s) continue;
    const prev = seen.get(s);
    if (prev) {
      problems.push(`[collisione] locale "${lc}": "${prev}" e "${post.slug}" usano entrambi lo slug "${s}".`);
    } else {
      seen.set(s, post.slug);
    }
  }
}

if (problems.length > 0) {
  console.error(`❌ Blog integrity: ${problems.length} problemi su ${BLOG_POSTS.length} post.\n`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log(`✅ Blog integrity OK: ${BLOG_POSTS.length} post, tutti con slug localizzati completi (${NON_IT.length} locali), nessuna collisione.`);
