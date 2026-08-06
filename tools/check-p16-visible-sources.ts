/**
 * Guardrail fonti visibili — P1.6 Fase 2.
 *
 * Fallisce (exit 1) se:
 *  1. `post.sources` contiene un URL con schema `javascript:`/`data:`, o non
 *     assoluto http(s) — rischio XSS/apertura silenziosa di contenuto non
 *     web se mai renderizzato come `href`.
 *  2. un post con `sourcesRenderedInline: true` non ha in realtà OGNI URL di
 *     `sources` presente anche come link nel corpo (verificato per
 *     occorrenza letterale dell'URL, non per un pattern testuale generico
 *     tipo "Fonte:"/"Source:" — quel pattern da solo produce falsi positivi
 *     quando il post nomina semplicemente una fonte in prosa senza linkare
 *     l'URL, vedi nota più sotto): il flag esiste per evitare la doppia
 *     sezione SOLO quando le fonti sono DAVVERO già tutte visibili altrove,
 *     non per nasconderle parzialmente.
 *  3. un post promette esplicitamente "fonti in fondo"/"sources below" (nel
 *     senso di una sezione fonti SU QUESTA pagina, non "vedi le fonti negli
 *     articoli dedicati" che rimanda altrove) ma non ha `sources` popolato:
 *     promessa rotta.
 *  4. un post con `sources` popolato NON ha `sourcesRenderedInline: true` MA
 *     ha già OGNI URL di `sources` presente come link nel corpo (stesso
 *     controllo per URL-overlap del punto 2, non per pattern testuale):
 *     la sezione condivisa duplicherebbe fonti già tutte visibili.
 *
 * Nota sul perché URL-overlap e non un pattern testuale "Fonte:"/"Source:":
 * un primo draft di questo guardrail cercava solo quel pattern e produceva 2
 * falsi positivi reali (galaxy-watch-ultra2-watch9-health-connect,
 * health-connect-vs-samsung-health): entrambi nominano una fonte in prosa
 * ("Fonte: supporto Google") per UNA claim specifica, ma la maggioranza
 * degli URL in `sources` non compare mai come link nel corpo — quindi la
 * sezione condivisa NON è ridondante lì, va renderizzata. Il controllo
 * corretto è "ogni URL di sources compare anche come link nel corpo?", non
 * "esiste una qualunque menzione della parola fonte/source?".
 *
 * Non verifica la raggiungibilità live degli URL (rete, fuori scope di un
 * check statico/CI) — quello è stato fatto manualmente durante l'audit P1.6
 * Fase 2 (vedi report), non è un controllo ripetibile senza rete qui.
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p16-visible-sources.ts
 */
import { BLOG_POSTS } from "@/lib/blog/data";
import type { Localized } from "@/lib/blog/types";

const problems: string[] = [];

// "vedi le fonti/fonti in fondo" ecc. MA non se rimanda esplicitamente ad
// "articoli dedicati"/"dedicated articles" (rimando ad altre pagine, non una
// promessa di sezione su QUESTA pagina — vedi metriche-recupero-hrv-sonno-
// frequenza-cardiaca, che rimanda intenzionalmente agli articoli linkati).
const PROMISE_PATTERN = /\b(fonti in fondo|sources below|vedi fonti|vedi le fonti|see sources)\b(?!\s*(negli articoli dedicati|in the dedicated articles))/i;

function allLocalizedStrings(post: (typeof BLOG_POSTS)[number]): string[] {
  const out: string[] = [];
  const pushLocalized = (l: Localized | undefined) => {
    if (!l) return;
    for (const v of Object.values(l)) if (typeof v === "string") out.push(v);
  };
  for (const s of post.body) {
    if ("text" in s) pushLocalized(s.text);
    if ("body" in s) pushLocalized(s.body);
    if ("title" in s && s.title) pushLocalized(s.title);
    if ("caption" in s && s.caption) pushLocalized(s.caption);
  }
  for (const f of post.faq ?? []) {
    pushLocalized(f.a);
  }
  return out;
}

for (const post of BLOG_POSTS) {
  const sources = post.sources ?? [];

  // 1. Schema URL sicuro.
  for (const url of sources) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      problems.push(`[url-non-valido] "${post.slug}": "${url}" non è un URL assoluto valido.`);
      continue;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      problems.push(`[schema-vietato] "${post.slug}": "${url}" usa lo schema "${parsed.protocol}", solo http/https ammessi.`);
    }
  }

  const bodyStrings = allLocalizedStrings(post);
  const bodyContainsUrl = (url: string) => bodyStrings.some((s) => s.includes(url));
  const allSourcesInline = sources.length > 0 && sources.every(bodyContainsUrl);
  const promisesSourcesSection = bodyStrings.some((s) => PROMISE_PATTERN.test(s));

  // 2. sourcesRenderedInline dichiarato ma non OGNI url è davvero nel corpo.
  if (post.sourcesRenderedInline && !allSourcesInline) {
    const missing = sources.filter((u) => !bodyContainsUrl(u));
    problems.push(
      `[inline-incompleto] "${post.slug}" ha sourcesRenderedInline:true ma ${missing.length}/${sources.length} URL di sources NON compaiono come link nel corpo: ${missing.join(", ")}.`,
    );
  }

  // 3. Promessa "fonti in fondo" senza sources popolato.
  if (promisesSourcesSection && sources.length === 0) {
    problems.push(`[promessa-rotta] "${post.slug}" promette una sezione fonti nel testo ma "sources" è vuoto/assente.`);
  }

  // 4. Rischio doppia sezione: TUTTI gli url già nel corpo, ma non dichiarato.
  if (allSourcesInline && !post.sourcesRenderedInline) {
    problems.push(
      `[doppia-sezione-non-dichiarata] "${post.slug}" ha già TUTTI i ${sources.length} URL di sources come link nel corpo: la sezione condivisa duplicherebbe fonti già visibili. Impostare sourcesRenderedInline:true.`,
    );
  }
}

if (problems.length > 0) {
  console.error(`❌ P1.6 Fase 2 guardrail: ${problems.length} problemi.\n`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log(
  `✅ P1.6 Fase 2 guardrail: ${BLOG_POSTS.length} post controllati, nessuno schema URL vietato in "sources", nessuna promessa "fonti in fondo" rotta, nessun sourcesRenderedInline con URL mancanti nel corpo, nessuna doppia sezione fonti non dichiarata.`,
);
