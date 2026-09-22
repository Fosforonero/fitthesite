import { describe, expect, it } from "vitest";
import { generateLlmsTxt } from "./llms-txt";
import { getFamigliaComingSoon } from "./content/famiglia-coming-soon";
import { CAPABILITY_STATUS } from "./product-facts";

/**
 * P0.24-B FASE A: /llms.txt descriveva Family Mesh (Mesh Famiglia) come una
 * funzione già disponibile, con dettagli di comportamento inventati (privacy
 * per-dato, "bring-your-own-device", un caso d'uso dettagliato).
 * `tools/check-llms-consistency.ts` non se ne accorgeva (verificato: verde
 * anche sul testo vecchio, prima della correzione).
 *
 * Decisione di prodotto confermata da Matteo il 22/09/2026: Mesh Famiglia è
 * decisa ed è in sviluppo, non ancora disponibile, nessuna data di rilascio
 * annunciata. Formula pubblica autorizzata (mai "coming soon"/"nei prossimi
 * giorni", che suggeriscono una vicinanza temporale non confermata; mai
 * "under evaluation"/"progetto in valutazione", che sottostima: la decisione
 * è presa).
 *
 * Ancora indipendente: `CAPABILITY_STATUS.familyMesh` in product-facts.ts
 * (evidenza di prodotto: il feature flag lato app citato in famiglia/page.tsx;
 * evidenza editoriale: questo commit). I test qui sotto NON si limitano a
 * confrontare /llms.txt con /famiglia: se le due pagine cambiassero insieme
 * in modo errato, la terza prova (lo stato in CAPABILITY_STATUS) dovrebbe
 * comunque cambiare per far passare il test, e quel cambio è un atto
 * editoriale distinto e deliberato, non un effetto collaterale di una copy.
 */
describe("llms.txt: Family Mesh e' in sviluppo, non disponibile, nessuna data", () => {
  const txt = generateLlmsTxt();
  const itCopy = getFamigliaComingSoon("it");
  const enCopy = getFamigliaComingSoon("en");

  it("non contiene i dettagli di comportamento inventati per una funzione non spedita", () => {
    for (const phrase of [
      "bring-your-own-device",
      "all data unified in one dashboard",
      "location NEVER shared",
      "weight/cycle/blood pressure",
      "member can leave group anytime",
      "aging parents monitoring, teen kids activity tracking, partner wellness",
      "family health monitoring, privacy controls, pricing",
    ]) {
      expect(txt, `frase inventata ancora presente: "${phrase}"`).not.toContain(phrase);
    }
  });

  it("non usa 'under evaluation'/'coming soon'/una vicinanza temporale non confermata", () => {
    const lines = txt.split("\n").filter((l) => l.startsWith("- ") && /family mesh|mesh famiglia/i.test(l));
    expect(lines.length, "nessuna menzione trovata: il test non starebbe controllando niente").toBeGreaterThan(0);
    for (const line of lines) {
      expect(line, `"under evaluation" ancora presente (sottostima: la decisione e' presa): ${line}`).not.toMatch(
        /under evaluation/i,
      );
      expect(line, `una promessa di vicinanza temporale non confermata: ${line}`).not.toMatch(
        /coming soon|in the coming days|nei prossimi giorni|shortly|soon\b/i,
      );
      expect(line, `riga senza "in development"/"not yet available": ${line}`).toMatch(
        /in development.*not yet available|not yet available.*in development/i,
      );
      expect(line, `riga senza "no release date": ${line}`).toMatch(/no release date/i);
    }
    // Nessuna data o trimestre vicino al nome (EDITORIAL-CORE 4).
    expect(txt, "una data o un trimestre vicino a Family Mesh/Mesh Famiglia").not.toMatch(
      /(?:family mesh|mesh famiglia)[^.]*\b(?:20\d{2}|q[1-4]\s?20\d{2}|spring|summer|fall|winter)\b/i,
    );
  });

  it("l'ancora indipendente (CAPABILITY_STATUS.familyMesh) non e' su uno stato live: una copy modificata da sola, senza questa voce, non basterebbe a rendere il claim vero", () => {
    const entry = CAPABILITY_STATUS.familyMesh;
    expect(entry, "CAPABILITY_STATUS non ha una voce familyMesh: il fact lock non ha un'ancora di prodotto").toBeDefined();
    expect(["live_verified", "live_limited", "release_candidate"], `status corrente: ${entry?.status}`).not.toContain(
      entry?.status,
    );
  });

  it("resta coerente con /famiglia (stessa formula, non semplicemente 'non disponibile')", () => {
    for (const copy of [itCopy, enCopy]) {
      expect(copy.availability_body).not.toMatch(/under evaluation|in valutazione|valutando|evaluando|évaluons/i);
    }
    expect(itCopy.availability_body).toMatch(/in sviluppo/);
    expect(itCopy.availability_body).toMatch(/non abbiamo annunciato/i);
    expect(enCopy.availability_body).toMatch(/in development/i);
    expect(enCopy.availability_body).toMatch(/haven'?t announced/i);
  });
});
