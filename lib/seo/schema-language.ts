/**
 * `inLanguage` (BCP-47, es. "it-IT") per JSON-LD — unica implementazione,
 * usata ovunque un nodo schema.org dichiari la lingua del contenuto.
 *
 * Prima, la maggior parte dei file ripeteva una catena di ternari manuale
 * (`lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : ... : "en-US"`) che
 * copriva solo gli 11 locale "principali" e faceva fallback silenzioso su
 * "en-US" per i 4 nordici (sv/da/no/fi) — un Article in svedese che dichiara
 * inLanguage "en-US" è esattamente il tipo di contraddizione che questo
 * sprint elimina. `ogLocale` in lib/i18n.ts copre già tutti i 15 locale nel
 * formato `xx_XX`: qui si converte solo il separatore.
 */
import { ogLocale, type Locale } from "@/lib/i18n";

export function schemaLanguage(locale: Locale): string {
  return ogLocale[locale].replace("_", "-");
}
