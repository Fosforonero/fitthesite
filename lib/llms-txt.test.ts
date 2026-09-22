import { describe, expect, it } from "vitest";
import { generateLlmsTxt } from "./llms-txt";
import { getFamigliaComingSoon } from "./content/famiglia-coming-soon";

/**
 * P0.24-B FASE A: /llms.txt descriveva Family Mesh (Mesh Famiglia) come una
 * funzione già disponibile, con dettagli di comportamento inventati (privacy
 * per-dato, "bring-your-own-device", un caso d'uso dettagliato), mentre
 * /famiglia (getFamigliaComingSoon, COMING_SOON=true) dice correttamente che
 * il progetto è in valutazione, senza data. `tools/check-llms-consistency.ts`
 * non se ne accorgeva (verificato: verde anche sul testo vecchio, prima della
 * correzione). Questo test lega /llms.txt alla stessa fonte di verità di
 * /famiglia, non a una frase congelata.
 */
describe("llms.txt: Family Mesh non e' descritto come disponibile", () => {
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

  it("ogni menzione di Family Mesh / Mesh Famiglia dice che non e' disponibile, non promette una data", () => {
    // Solo le righe di contenuto ("- ..."): il titolo di sezione "## Family Mesh
    // (Mesh Famiglia)" nomina la funzione senza affermare nulla sulla sua
    // disponibilita', quindi non deve dire "not available" lui stesso.
    const lines = txt.split("\n").filter((l) => l.startsWith("- ") && /family mesh|mesh famiglia/i.test(l));
    expect(lines.length, "nessuna menzione trovata: il test non starebbe controllando niente").toBeGreaterThan(0);
    for (const line of lines) {
      expect(line, `riga senza "not available": ${line}`).toMatch(/not available|not currently available/i);
    }
    // Nessuna data, nessuna promessa (EDITORIAL-CORE 4): niente mesi/trimestri/anni vicino al nome.
    expect(txt, "una data o un trimestre vicino a Family Mesh/Mesh Famiglia").not.toMatch(
      /(?:family mesh|mesh famiglia)[^.]*\b(?:20\d{2}|q[1-4]|spring|summer|fall|winter|q[1-4]\s?20\d{2})\b/i,
    );
  });

  it("resta agganciato alla stessa fonte di verita' di /famiglia: se quella pagina tornasse disponibile, questo test lo segnalerebbe", () => {
    // Non duplica la copy: si limita a controllare che l'affermazione di indisponibilita'
    // di /famiglia sia ancora quella corrente, cosi' un domani in cui la feature sblocca
    // (COMING_SOON=false) fa fallire QUESTO controllo prima che /llms.txt possa restare indietro.
    expect(itCopy.availability_body).toMatch(/non è attualmente disponibile/);
    expect(enCopy.availability_body).toMatch(/not currently available/);
  });
});
