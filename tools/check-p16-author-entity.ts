/**
 * Guardrail entità autore (Person) — P1.6 Fase 6.
 *
 * Verifica read-only, nessun cambio di output pubblico. Codifica la
 * decisione PM esplicita: un unico `AUTHOR_ID`/`AUTHOR.url` condiviso da
 * tutte le locale è INTENZIONALE (Google richiede che `author.url`
 * identifichi univocamente l'autore, non che coincida con la lingua
 * dell'articolo) — questo guardrail verifica COERENZA, non "correttezza
 * per-locale" (che sarebbe l'opposto della decisione presa).
 *
 * Fallisce (exit 1) se:
 *  1. `AUTHOR_ID` non è lo stesso valore riusato sia da `authorPersonNode`
 *     (Organization.founder) sia da `authorCompactNode` (BlogPosting.author):
 *     due @id diversi per la stessa persona romperebbero l'identità unica.
 *  2. `AUTHOR.name` non è esattamente "Matteo Pizzi".
 *  3. `AUTHOR.jobTitle` è vuoto, o coincide byte-per-byte con `AUTHOR.name`
 *     (deve restare un campo separato, non un duplicato del nome).
 *  4. `AUTHOR.jobTitle` contiene una qualifica medica/sanitaria non
 *     posseduta (pattern: dottore, dott., medico, dr\\.|M\\.D\\.|specialist).
 *  5. `AUTHOR.sameAs` è vuoto, o contiene un URL non assoluto http(s).
 *  6. `AUTHOR.bio` promette una credenziale medica/sanitaria non dichiarata
 *     altrove nel repo (stesso pattern del punto 4, applicato alla bio).
 *  7. (solo se BASE_URL è impostata) `AUTHOR.url` risponde 200 e la pagina
 *     ha un blocco hreflang (indicizzabile, collegata alle traduzioni).
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p16-author-entity.ts
 *   BASE_URL=https://www.fitmesh.fit per includere anche il controllo live (7).
 */
import { AUTHOR, AUTHOR_ID, authorCompactNode, authorPersonNode } from "@/lib/seo/entities";

const problems: string[] = [];

// Niente `\b` finale: alcune alternative finiscono per "." (dott., dr., m.d.),
// un carattere non-word quasi sempre seguito da un altro non-word (spazio),
// quindi un `\b` finale lì non troverebbe mai un confine e la regex non
// matcherebbe mai — bug reale trovato dal test negativo di questo guardrail.
const MEDICAL_QUALIFICATION_PATTERN = /\b(dottore|dott\.|medico|dr\.|m\.d\.|specialist[ae]?|physician)/i;

async function main(): Promise<void> {
  // 1. @id coerente fra Person completo e Person compatto.
  const fullNode = authorPersonNode("it");
  const compactNode = authorCompactNode();
  if (fullNode["@id"] !== AUTHOR_ID || compactNode["@id"] !== AUTHOR_ID) {
    problems.push(
      `[id-incoerente] authorPersonNode/@id="${fullNode["@id"]}", authorCompactNode/@id="${compactNode["@id"]}", AUTHOR_ID="${AUTHOR_ID}": devono coincidere tutti e tre.`,
    );
  }

  // 2. Nome esatto.
  if (AUTHOR.name !== "Matteo Pizzi") {
    problems.push(`[nome-sbagliato] AUTHOR.name="${AUTHOR.name}", atteso esattamente "Matteo Pizzi".`);
  }

  // 3. jobTitle separato dal nome, non vuoto.
  if (!AUTHOR.jobTitle || AUTHOR.jobTitle.trim().length === 0) {
    problems.push(`[jobtitle-vuoto] AUTHOR.jobTitle è vuoto.`);
  } else if (AUTHOR.jobTitle === AUTHOR.name) {
    problems.push(`[jobtitle-duplica-nome] AUTHOR.jobTitle è identico a AUTHOR.name.`);
  }

  // 4. Nessuna qualifica medica inventata nel jobTitle.
  if (MEDICAL_QUALIFICATION_PATTERN.test(AUTHOR.jobTitle)) {
    problems.push(`[qualifica-medica-jobtitle] AUTHOR.jobTitle contiene un pattern di qualifica medica/sanitaria non dichiarata: "${AUTHOR.jobTitle}".`);
  }

  // 5. sameAs non vuoto, URL assoluti http(s).
  if (!AUTHOR.sameAs || AUTHOR.sameAs.length === 0) {
    problems.push(`[sameas-vuoto] AUTHOR.sameAs è vuoto.`);
  } else {
    for (const url of AUTHOR.sameAs) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          problems.push(`[sameas-schema-vietato] "${url}" non è http/https.`);
        }
      } catch {
        problems.push(`[sameas-non-valido] "${url}" non è un URL assoluto valido.`);
      }
    }
  }

  // 6. Nessuna qualifica medica inventata nella bio (tutte le locale).
  for (const [lc, text] of Object.entries(AUTHOR.bio)) {
    if (typeof text === "string" && MEDICAL_QUALIFICATION_PATTERN.test(text)) {
      problems.push(`[qualifica-medica-bio] AUTHOR.bio["${lc}"] contiene un pattern di qualifica medica/sanitaria non dichiarata.`);
    }
  }

  // 7. Controllo live opzionale.
  const base = process.env.BASE_URL;
  if (!base) {
    console.log("ℹ️  BASE_URL non impostata: controllo live AUTHOR.url (200 + hreflang) SALTATO, non dichiarato verde.");
  } else {
    try {
      const res = await fetch(AUTHOR.url);
      if (res.status !== 200) {
        problems.push(`[author-url-non-200] ${AUTHOR.url} -> ${res.status}.`);
      } else {
        const html = await res.text();
        if (!/<link rel="alternate" hrefLang=/.test(html)) {
          problems.push(`[author-url-no-hreflang] ${AUTHOR.url} non ha blocco hreflang: non collegata alle traduzioni.`);
        }
      }
    } catch (e) {
      problems.push(`[author-url-non-raggiungibile] ${AUTHOR.url}: ${(e as Error).message}.`);
    }
  }

  if (problems.length > 0) {
    console.error(`❌ P1.6 Fase 6 guardrail (entità autore): ${problems.length} problemi.\n`);
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }
  console.log(
    `✅ P1.6 Fase 6 guardrail (entità autore): @id coerente fra Person completo/compatto/AUTHOR_ID (identità unica intenzionale), nome esatto "Matteo Pizzi", jobTitle separato e senza qualifiche mediche inventate, sameAs popolato e valido, nessuna qualifica medica in bio.`,
  );
}

main().catch((err) => {
  console.error("❌ P1.6 Fase 6 guardrail: errore inatteso", err);
  process.exit(1);
});
