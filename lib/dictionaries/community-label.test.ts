import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n";

/**
 * `footer.links.community` (etichetta del link r/FitMesh, Footer + /support)
 * deve esistere ed essere una stringa non vuota per OGNI locale attiva.
 *
 * `getDictionary()` in lib/i18n.ts fa un `import()` dinamico non tipato
 * (`Promise<any>`): un `Dictionary` mancante o incompleto in uno dei 15 file
 * non viene mai segnalato da tsc, solo a runtime (stringa `undefined`
 * renderizzata, o testo di un'altra lingua che trapela — stessa famiglia di
 * errore delle stringhe "1 ora"/"2 ore" in un'interfaccia non italiana).
 * Questo test è l'unico guardrail per questa chiave specifica.
 */
describe("dizionari — footer.links.community", () => {
  for (const locale of locales) {
    it(`${locale}: presente e non vuota`, async () => {
      const dict = (await import(`../dictionaries/${locale}.json`)).default;
      expect(typeof dict.footer?.links?.community).toBe("string");
      expect(dict.footer.links.community.trim().length).toBeGreaterThan(0);
    });
  }
});
