/**
 * Sprint P1.5B Fase B — guardrail mirato per le 2 nuove varianti DE
 * (sleep-score-regolarita-ritmo-circadiano, perche-zona-2-cambia-smartwatch-app).
 *
 * Fallisce se: la variante DE non è completa/indicizzabile (fallback
 * ancora attivo), il title renderizzato supera 60 caratteri, la description
 * è fuori 140-160, lo slug DE è ancora il placeholder EN o collide con
 * un'altra locale/post, appare un em dash nel nuovo copy DE, un CTA verso i
 * calcolatori Labs (it/en-only) dichiara `.de` verso `/it/...` invece che
 * `/en/...` (di per sé innocuo — /de/labs/* redirige comunque 307 verso
 * /en/labs/... con qualsiasi slug it/en, verificato live — ma la
 * dichiarazione esplicita deve restare coerente con l'intento leggibile
 * documentato nei due post, non un caso "a caso" fra i due).
 */
import { BLOG_POSTS, BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { BLOG_SLUGS as SLUG_MAP } from "@/lib/blog/slugs";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import { blogSeoTitle } from "@/lib/blog/types";

const errors: string[] = [];
const TARGET_SLUGS = ["sleep-score-regolarita-ritmo-circadiano", "perche-zona-2-cambia-smartwatch-app"];

function collectDeStrings(obj: unknown, path: string, out: { path: string; value: string }[]): void {
  if (obj == null) return;
  if (typeof obj === "string") return;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => collectDeStrings(v, `${path}[${i}]`, out));
    return;
  }
  if (typeof obj === "object") {
    const rec = obj as Record<string, unknown>;
    if (typeof rec.de === "string") out.push({ path: `${path}.de`, value: rec.de });
    if (Array.isArray(rec.de)) (rec.de as unknown[]).forEach((v, i) => { if (typeof v === "string") out.push({ path: `${path}.de[${i}]`, value: v }); });
    for (const [k, v] of Object.entries(rec)) {
      if (k === "de") continue;
      collectDeStrings(v, `${path}.${k}`, out);
    }
  }
}

for (const slug of TARGET_SLUGS) {
  const post = BLOG_POSTS_BY_SLUG[slug];
  if (!post) {
    errors.push(`post "${slug}" non trovato in BLOG_POSTS_BY_SLUG`);
    continue;
  }

  // 1. Indicizzabile in DE (niente fallback/redirect residuo).
  if (!isBlogVariantIndexable(post, "de")) {
    errors.push(`${slug}: isBlogVariantIndexable(post, "de") è false — la variante DE non è completa, resta in fallback/redirect`);
  }

  // 2. Title renderizzato <=60.
  const title = blogSeoTitle(post, "de");
  const rendered = `${title} · FitMesh`;
  if (rendered.length > 60) {
    errors.push(`${slug}: title DE renderizzato lungo ${rendered.length} caratteri (>60): "${rendered}"`);
  }

  // 3. Description 140-160.
  const desc = post.metaDescription.de;
  if (!desc) {
    errors.push(`${slug}: metaDescription.de mancante`);
  } else {
    const len = [...desc].length;
    if (len < 140 || len > 160) {
      errors.push(`${slug}: metaDescription DE lunga ${len} caratteri, attesi 140-160: "${desc}"`);
    }
  }

  // 4. Slug DE reale (non il placeholder EN riusato dalle altre locale incomplete).
  const slugSet = (SLUG_MAP as Record<string, Record<string, string>>)[slug];
  const deSlug = slugSet?.de;
  const enSlug = slugSet?.en;
  if (!deSlug) {
    errors.push(`${slug}: nessuno slug DE in lib/blog/slugs.ts`);
  } else if (deSlug === enSlug) {
    errors.push(`${slug}: slug DE ("${deSlug}") è ancora identico al placeholder EN — non è stato scelto uno slug reale`);
  }

  // 5. Nessun em dash nel nuovo copy DE (l'intero post, campo per campo).
  const deStrings: { path: string; value: string }[] = [];
  collectDeStrings(post as unknown as Record<string, unknown>, slug, deStrings);
  for (const { path, value } of deStrings) {
    if (value.includes("—")) {
      errors.push(`${slug}: em dash trovato in ${path}: "${value}"`);
    }
  }
}

// 6. Nessuna collisione fra i due nuovi slug DE, né con qualunque altro
// slug (qualunque locale) di qualunque altro post.
const allDeSlugs = new Map<string, string>();
for (const p of BLOG_POSTS) {
  const set = (SLUG_MAP as Record<string, Record<string, string>>)[p.slug];
  const de = set?.de;
  if (!de) continue;
  const existing = allDeSlugs.get(de);
  if (existing && existing !== p.slug) {
    errors.push(`collisione slug DE "${de}" fra "${existing}" e "${p.slug}"`);
  }
  allDeSlugs.set(de, p.slug);
}

// 7. CTA verso i calcolatori Labs (it/en-only) non devono mai puntare a
// `.it` per DE — solo `.it`/`.en` esplicitamente ammessi come target reali
// per un CTA Labs; DE deve puntare a `/en/labs/...` (stessa scelta
// deliberata documentata nei due file), mai a `/it/labs/...`.
for (const slug of TARGET_SLUGS) {
  const post = BLOG_POSTS_BY_SLUG[slug];
  if (!post) continue;
  for (const section of post.body) {
    if (section.type !== "cta") continue;
    const href = (section.ctaHref as Record<string, string> | undefined)?.de;
    if (href?.includes("/labs/") && href.startsWith("/it/")) {
      errors.push(`${slug}: CTA Labs ctaHref.de punta a "${href}" (locale IT) — deve puntare alla versione EN, non esiste una pagina Labs DE`);
    }
  }
}

if (errors.length > 0) {
  console.error(`❌ P1.5B Fase B guardrail: ${errors.length} problema/i`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("✅ P1.5B Fase B guardrail: entrambe le varianti DE indicizzabili, title ≤60, description 140-160, slug reali senza collisioni, nessun em dash, nessun CTA Labs mal instradato su .it.");
