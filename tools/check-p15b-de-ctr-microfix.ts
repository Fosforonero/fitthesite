/**
 * Sprint P1.5B Fase A — guardrail mirato per il micro-fix CTR DE su
 * "health-connect-not-syncing" (GSC 26/07-01/08: CTR 2.09%, query dominante
 * "samsung health synchronisiert nicht" 152 impr / CTR 0.66%).
 *
 * La modifica autorizzata è SOLO metadata (seoTitle.de + metaDescription.de):
 * slug, canonical, H1, publishedAt, struttura, numero soluzioni e tutte le
 * altre lingue devono restare bit-per-bit invariati. Questo guardrail fallisce
 * se una futura modifica a questo file rompe uno di questi invarianti, o se
 * ricompare un titolo/description fuori target, un em dash nel nuovo copy, o
 * una pagina concorrente sullo stesso query target.
 */
import { BLOG_POSTS } from "@/lib/blog/data";

const errors: string[] = [];

const SLUG = "health-connect-not-syncing";
const EXPECTED_H1_DE =
  "Health Connect synchronisiert nicht: 7 Lösungen, die funktionieren (2026)";
const EXPECTED_PUBLISHED_AT = "2026-05-30";
const EXPECTED_UPDATED_AT = "2026-07-13"; // invariato: la modifica e' solo metadata.
const EXPECTED_SOLUTION_COUNT = 7;

const post = BLOG_POSTS.find((p) => p.slug === SLUG);
if (!post) {
  errors.push(`post "${SLUG}" non trovato in BLOG_POSTS`);
} else {
  // URL/canonical (slug) invariato.
  if (post.slug !== SLUG) {
    errors.push(`slug cambiato: atteso "${SLUG}", trovato "${post.slug}"`);
  }
  // H1 invariato.
  if (post.hero.title.de !== EXPECTED_H1_DE) {
    errors.push(
      `H1 DE cambiato: atteso "${EXPECTED_H1_DE}", trovato "${post.hero.title.de}"`,
    );
  }
  // publishedAt invariato (contenuto non ripubblicato).
  if (post.publishedAt !== EXPECTED_PUBLISHED_AT) {
    errors.push(`publishedAt cambiato: atteso ${EXPECTED_PUBLISHED_AT}, trovato ${post.publishedAt}`);
  }
  // updatedAt invariato: la modifica resta solo nei metadata (title/description).
  if (post.updatedAt !== EXPECTED_UPDATED_AT) {
    errors.push(
      `updatedAt cambiato (${post.updatedAt}): questo micro-fix e' solo metadata, updatedAt/dateModified non va toccato`,
    );
  }

  // Title renderizzato <=60 caratteri (blogSeoTitle + " · FitMesh", stessa
  // logica reale di generateMetadata in blog/[slug]/page.tsx).
  const seoTitleDe = post.seoTitle?.de ?? post.hero.title.de;
  const renderedTitle = `${seoTitleDe} · FitMesh`;
  if (renderedTitle.length > 60) {
    errors.push(`title renderizzato DE lungo ${renderedTitle.length} caratteri (>60): "${renderedTitle}"`);
  }

  // Description 140-160 caratteri.
  const descLen = [...post.metaDescription.de].length;
  if (descLen < 140 || descLen > 160) {
    errors.push(`meta description DE lunga ${descLen} caratteri, attesi 140-160: "${post.metaDescription.de}"`);
  }

  // Nessun em dash nel nuovo copy pubblico (seoTitle.de + metaDescription.de).
  if (seoTitleDe.includes("—")) {
    errors.push(`seoTitle.de contiene un em dash: "${seoTitleDe}"`);
  }
  if (post.metaDescription.de.includes("—")) {
    errors.push(`metaDescription.de contiene un em dash: "${post.metaDescription.de}"`);
  }

  // Numero di soluzioni invariato (contenuto/struttura non toccati).
  const solutionHeadings = post.body.filter(
    (b) => b.type === "heading" && typeof b.text === "object" && "de" in b.text && /^Lösung \d+/.test((b.text as Record<string, string>).de ?? ""),
  );
  if (solutionHeadings.length !== EXPECTED_SOLUTION_COUNT) {
    errors.push(
      `numero di soluzioni DE cambiato: attese ${EXPECTED_SOLUTION_COUNT}, trovate ${solutionHeadings.length}`,
    );
  }

  // Tutte le altre lingue di seoTitle/metaDescription invariate (solo "de"
  // deve differire da questo sprint; "nl" era già presente da P0.8).
  const otherMetaDescLocales = Object.keys(post.metaDescription).filter((l) => l !== "de");
  if (otherMetaDescLocales.length === 0) {
    errors.push("metaDescription: nessuna altra locale trovata oltre a de (atteso invariato per it/en/es/...)");
  }
}

// Nessuna pagina concorrente: nessun ALTRO post deve avere uno slug o una
// primaryKeyword DE che ricalca "samsung health synchronisiert nicht".
for (const p of BLOG_POSTS) {
  if (p.slug === SLUG) continue;
  const kwDe = p.primaryKeyword?.de ?? "";
  if (kwDe.toLowerCase().includes("samsung health synchronisiert nicht")) {
    errors.push(`pagina concorrente rilevata: "${p.slug}" ha primaryKeyword.de = "${kwDe}"`);
  }
}

if (errors.length > 0) {
  console.error(`❌ P1.5B Fase A guardrail: ${errors.length} problema/i`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("✅ P1.5B Fase A guardrail: slug/H1/publishedAt/updatedAt/struttura invariati, title DE renderizzato ≤60, description 140-160, nessun em dash, nessuna pagina concorrente.");
