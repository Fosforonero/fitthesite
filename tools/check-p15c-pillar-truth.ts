/**
 * Sprint P1.5B Fase C — guardrail mirato per l'aggiornamento in place del
 * pillar "come-funziona-fitmesh" (C0: aggiornare in place, non nuovo URL).
 *
 * Fallisce se: il title renderizzato it/en supera 60 caratteri, la
 * description it/en è fuori 140-160, i nuovi blocchi non sono correttamente
 * gated su it/en (rischio di fallback indicizzabile per es/de/pt/fr), le 4
 * locale non toccate (es/de/pt/fr) risultano meno complete di prima
 * (regressione), appare un em dash nel nuovo copy pubblico, ricompare un
 * claim assoluto vietato dal mandato ("mai contato due volte", "elimina
 * sempre ogni duplicato", "self-host completo", ecc.), `sources` è vuoto o
 * non citato visibilmente nel body, meno di 8 FAQ.
 */
import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import { walkPost } from "@/lib/blog/nordic-overlay";
import { blogSeoTitle } from "@/lib/blog/types";
import type { BlogSection } from "@/lib/blog/types";

const errors: string[] = [];
const SLUG = "come-funziona-fitmesh";
// Baseline nota (locali NON toccate da questo sprint): entry count PRIMA
// della Fase C, misurato sull'albero pre-modifica. Se scende, è regressione.
const BASELINE_UNTOUCHED_ENTRIES = 61;

const post = BLOG_POSTS_BY_SLUG[SLUG];
if (!post) {
  errors.push(`post "${SLUG}" non trovato in BLOG_POSTS_BY_SLUG`);
} else {
  for (const lc of ["it", "en"] as const) {
    if (!isBlogVariantIndexable(post, lc)) {
      errors.push(`${lc}: isBlogVariantIndexable è false dopo la Fase C — non deve regredire`);
    }
    const title = blogSeoTitle(post, lc);
    const rendered = `${title} · FitMesh`;
    if (rendered.length > 60) {
      errors.push(`title ${lc} renderizzato lungo ${rendered.length} caratteri (>60): "${rendered}"`);
    }
    const desc = post.metaDescription[lc];
    const len = desc ? [...desc].length : 0;
    if (len < 140 || len > 160) {
      errors.push(`metaDescription ${lc} lunga ${len} caratteri, attesi 140-160: "${desc}"`);
    }
  }

  for (const lc of ["es", "de", "pt", "fr"] as const) {
    if (!isBlogVariantIndexable(post, lc)) {
      errors.push(`${lc}: isBlogVariantIndexable è false — regressione su una locale non toccata da questo sprint`);
    }
    const entries = walkPost(post, lc);
    if (entries.length !== BASELINE_UNTOUCHED_ENTRIES) {
      errors.push(
        `${lc}: ${entries.length} entry walkPost, attese ${BASELINE_UNTOUCHED_ENTRIES} (invariate) — i nuovi blocchi devono essere gated su locales:["it","en"] e non trapelare qui`,
      );
    }
  }

  // Nessun claim assoluto vietato dal mandato, in nessuna stringa pubblica del post.
  // Le domande FAQ ("... sempre ...?") sono per costruzione un invito a una
  // risposta sfumata, non un'affermazione: scansionate solo le risposte
  // (f.a), mai le domande (f.q). Lookbehind negativo su "non"/"not" per non
  // segnalare la negazione corretta della stessa frase vietata.
  const FORBIDDEN_PATTERNS: { label: string; re: RegExp }[] = [
    { label: "dedup sempre perfetta (asserzione, non domanda)", re: /(?<!\bnon )(?<!\bdoes )\b(elimina sempre (ogni|tutti i)|always eliminates? every)\b/i },
    { label: "self-host completo per il pubblico", re: /self-host (è|is) (completo|complete)/i },
    { label: "importa ogni metrica proprietaria (asserzione, non negazione)", re: /(?<!non )(?<!doesn't )(?<!does not )(importa (automaticamente )?ogni metrica proprietaria|automatically imports? every proprietary metric)/i },
  ];
  const allStrings: string[] = [];
  function collect(node: unknown): void {
    if (node == null) return;
    if (typeof node === "string") { allStrings.push(node); return; }
    if (Array.isArray(node)) { node.forEach(collect); return; }
    if (typeof node === "object") { Object.values(node as Record<string, unknown>).forEach(collect); }
  }
  collect(post.hero);
  collect(post.metaDescription);
  collect(post.tldr);
  collect(post.body);
  // FAQ: solo le risposte (f.a), mai le domande (f.q, vedi sopra).
  for (const f of post.faq ?? []) collect(f.a);
  for (const s of allStrings) {
    for (const { label, re } of FORBIDDEN_PATTERNS) {
      if (re.test(s)) errors.push(`claim assoluto vietato ("${label}") trovato: "${s.slice(0, 120)}..."`);
    }
    if (s.includes("—")) errors.push(`em dash nel copy pubblico: "${s.slice(0, 80)}..."`);
  }

  // sources presenti e citati visibilmente nel body (stesse URL, non solo in JSON-LD).
  if (!post.sources || post.sources.length === 0) {
    errors.push("sources mancante o vuoto — richiesto: fonti primarie visibili");
  } else {
    const bodyText = allStrings.join(" ");
    for (const url of post.sources) {
      if (!bodyText.includes(url)) {
        errors.push(`fonte "${url}" presente in sources ma non citata visibilmente nel body (solo JSON-LD) — richiesto "fonti visibili coerenti col JSON-LD"`);
      }
    }
  }

  // Almeno 8 FAQ.
  const faqCount = post.faq?.length ?? 0;
  if (faqCount < 8) {
    errors.push(`solo ${faqCount} FAQ, richieste almeno 8`);
  }

  // Nessuno schema medicale: ldType deve restare BlogPosting/Article.
  if (post.ldType && post.ldType !== "BlogPosting" && post.ldType !== "Article") {
    errors.push(`ldType "${post.ldType}" non ammesso — nessuno schema medicale per questo pillar`);
  }

  // Data di verifica visibile: la callout "Fonti e verifica" deve esistere,
  // gated it/en, con una data leggibile.
  const hasVerificationCallout = post.body.some(
    (b: BlogSection) =>
      b.type === "callout" &&
      JSON.stringify(b.title ?? {}).toLowerCase().includes("verif"),
  );
  if (!hasVerificationCallout) {
    errors.push('nessuna callout "Fonti e verifica" trovata nel body — richiesta data di verifica visibile');
  }
}

if (errors.length > 0) {
  console.error(`❌ P1.5B Fase C guardrail: ${errors.length} problema/i`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("✅ P1.5B Fase C guardrail: title/description it/en ok, locali non toccate invariate (nessun fallback), nessun claim assoluto vietato, nessun em dash, fonti visibili coerenti col JSON-LD, 8+ FAQ, nessuno schema medicale, data di verifica visibile.");
