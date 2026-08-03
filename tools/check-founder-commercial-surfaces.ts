/**
 * Guardrail Sprint P0.10L-A — nessun claim Founder deve poter ricomparire
 * sulle superfici COMMERCIALI attive del sito (quelle con una CTA di
 * conversione adiacente: download/trial/acquisto). Nasce dal finding reale
 * dell'audit P0.10L: 6 landing page + 1 FAQ mostravano "i primi 1000
 * founder... Pro a vita gratis" accanto a un bottone "Prova gratis" — un
 * claim in 3a persona ("i founder ricevono") che il guardrail preesistente
 * `check-founder-acquisition-surfaces.ts` (classe e) non intercettava,
 * perche' quella classe cerca specificamente un verbo alla 2a persona
 * ("hai"/"you get") accanto a "gratis a vita", non una frase descrittiva.
 * Questo guardrail e' complementare, non sostitutivo: resta l'unico con
 * l'ambito esplicito "superfici commerciali" richiesto in P0.10L-A.
 *
 * Ambito scansionato (fisso, non ricorsivo su tutto il repo — le superfici
 * commerciali sono un insieme noto e piccolo):
 *   - components/Header.tsx, Footer.tsx, MobileMenu.tsx (nav globale)
 *   - homepage (app/(frontend)/[locale]/(marketing)/page.tsx)
 *   - lib/pricing-section.ts, lib/content/homepage-copy.ts (pricing)
 *   - lib/landing/data.ts + lib/landing/es-overlay.json (landing CTA/FAQ)
 *
 * Fuori ambito DI PROPOSITO (non scansionati qui): /beta (resta l'archivio
 * storico, ha una sua pagina dedicata e non e' una superficie commerciale),
 * gli articoli di blog storici datati, i termini di servizio (descrivono un
 * diritto gia' acquisito, non un'offerta), i commenti tecnici non
 * renderizzati (rimossi prima del match, vedi stripComments).
 *
 * Allowlist esplicita (uniche eccezioni ammesse dentro i file scansionati):
 *   - riferimenti allo slug "fitmesh-gratis-prezzo-founder" come URL/href
 *     (il link stesso non fa alcun claim, punta a un articolo che lo fa
 *     correttamente al passato — classificazione E nell'audit P0.10L);
 *   - il rumore di traduzione automatica preesistente "RODO founder drzemka"
 *     nelle secondaryKeywords polacche di lib/landing/data.ts (non e' un
 *     claim Founder, e' un artefatto di traduzione — fuori scope da questo
 *     hotfix, registrato separatamente).
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const errors: string[] = [];

const SCAN_FILES = [
  "components/Header.tsx",
  "components/Footer.tsx",
  "components/MobileMenu.tsx",
  "app/(frontend)/[locale]/(marketing)/page.tsx",
  "lib/pricing-section.ts",
  "lib/content/homepage-copy.ts",
  "lib/landing/data.ts",
  "lib/landing/es-overlay.json",
];

/** Rimuove commenti /* *\/ e // — un claim in un commento non renderizzato non e' un claim pubblico. */
function stripComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const ALLOWLIST_SUBSTRINGS = [
  // Link/slug al pricing guide article — URL, non un'offerta (classe E, audit P0.10L).
  "fitmesh-gratis-prezzo-founder",
  "is-fitmesh-free-pricing-founder",
  "fitmesh-es-gratis-precio-founder",
  "ist-fitmesh-kostenlos-preis-founder",
  "fitmesh-e-gratis-preco-founder",
  "fitmesh-est-il-gratuit-prix-founder",
  "czy-fitmesh-jest-darmowy-cena-founder",
  "fitmesh-ucretsiz-mi-fiyat-founder",
  // Rumore di traduzione automatica preesistente nelle keyword SEO polacche
  // (lib/landing/data.ts, secondaryKeywords.pl) — non e' un claim Founder,
  // fuori scope da questo hotfix (vedi header del file).
  "RODO founder drzemka",
];

function stripAllowlisted(content: string): string {
  let out = content;
  for (const s of ALLOWLIST_SUBSTRINGS) {
    out = out.split(s).join(" ".repeat(s.length));
  }
  return out;
}

const FOUNDER_RE = /founder/gi;

for (const rel of SCAN_FILES) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) {
    errors.push(`File atteso mancante dall'ambito di scansione: ${rel}`);
    continue;
  }
  const raw = fs.readFileSync(full, "utf8");
  const isJson = rel.endsWith(".json");
  const withoutComments = isJson ? raw : stripComments(raw);
  const scannable = stripAllowlisted(withoutComments);

  FOUNDER_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FOUNDER_RE.exec(scannable)) !== null) {
    const context = scannable
      .slice(Math.max(0, m.index - 60), m.index + m[0].length + 60)
      .replace(/\s+/g, " ");
    const lineNo = scannable.slice(0, m.index).split("\n").length;
    errors.push(`${rel}:${lineNo} — claim/menzione Founder su superficie commerciale: "...${context}..."`);
  }
}

if (errors.length > 0) {
  console.error(`❌ Founder commercial-surfaces guardrail: ${errors.length} problema/i\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✅ Founder commercial-surfaces guardrail: zero claim Founder su ${SCAN_FILES.length} superfici commerciali (nav globale, homepage, pricing, landing CTA/FAQ). Allowlist attiva: ${ALLOWLIST_SUBSTRINGS.length} eccezioni documentate (slug articolo, rumore MT preesistente).`,
);
