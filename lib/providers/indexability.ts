/**
 * Fonte di verità UNICA per "questa pagina provider/modello (locale) è indicizzabile?".
 * Gemella di `lib/blog/indexability.ts` e `lib/landing/indexability.ts`, stesso
 * motivo: un campo mancante per `lc` cade in fallback en/it ma la pagina si
 * auto-canonicalizza come originale → duplicato rilevato da Search Console
 * ("Duplicate without user-selected canonical").
 *
 * Prima il gate di `/sync/[provider]` e `/sync/[provider]/[model]` copriva
 * SOLO le nordiche via `UNTRANSLATED_CONTENT_LOCALES`: un provider/modello con
 * un campo mancante o — peggio — con l'inglese copiato-incollato sotto una
 * chiave locale sbagliata (es. `ko: "..."` in inglese) risultava comunque
 * "indicizzabile" per quel locale. Il check qui sotto è per-campo: verifica
 * che title/description/FAQ abbiano un valore per `lc`, NON vuoto, e diverso
 * dalla stringa inglese (red flag economico per una traduzione mai fatta).
 *
 * Scope volutamente limitato a tagline/longDesc/FAQ (provider) e
 * description/FAQ (modello): sono i campi che finiscono in meta description,
 * H1/hero e JSON-LD FAQPage — quelli con reale rischio duplicate-content.
 * Campi accessori (techNote, viaHC, setupGuide, dataTypes label) restano
 * fuori dal gate per ora.
 *
 * Usato da `sync/[provider]/page.tsx` e `sync/[provider]/[model]/page.tsx`
 * (robots + hreflang) e da `sitemap.ts`: un solo helper, non possono divergere.
 */
import type { Locale } from "@/lib/i18n";
import type { Provider } from "@/lib/providers/data";
import type { ProviderModel } from "@/lib/providers/models";

type LocField = Partial<Record<Locale, string>> | undefined;

/** True se il campo ha un valore per `lc`: non vuoto e non identico alla stringa `en` (fallback mascherato). */
function fieldComplete(node: LocField, lc: Locale): boolean {
  if (!node) return true; // struttura assente (es. FAQ vuote): non conta come buco
  const en = (node.en ?? "").trim();
  const val = node[lc];
  if (val == null) return false;
  const v = val.trim();
  if (v.length === 0) return false;
  if (en.length > 0 && v === en) return false;
  return true;
}

function walkProvider(p: Provider): LocField[] {
  const out: LocField[] = [p.tagline, p.longDesc];
  for (const f of p.faqs) {
    out.push(f.q);
    out.push(f.a);
  }
  return out;
}

function walkProviderModel(m: ProviderModel): LocField[] {
  const out: LocField[] = [m.description];
  for (const qa of m.faq) {
    out.push(qa.q);
    out.push(qa.a);
  }
  return out;
}

/** True se OGNI campo traducibile del provider (tagline/longDesc/FAQ) ha un valore reale per `lc`. */
export function isProviderLocaleComplete(p: Provider, lc: Locale): boolean {
  const fields = walkProvider(p);
  if (fields.length === 0) return false;
  return fields.every((f) => fieldComplete(f, lc));
}

/** True se la pagina `/sync/[provider]` per `(p, locale)` è indicizzabile (NON esce `noindex`). */
export function isProviderVariantIndexable(p: Provider, lc: Locale): boolean {
  // it/en sono le lingue sorgente: sempre presenti, mai fallback.
  if (lc === "it" || lc === "en") return true;
  return isProviderLocaleComplete(p, lc);
}

/** True se OGNI campo traducibile del modello (description/FAQ) ha un valore reale per `lc`. */
export function isProviderModelLocaleComplete(m: ProviderModel, lc: Locale): boolean {
  const fields = walkProviderModel(m);
  if (fields.length === 0) return false;
  return fields.every((f) => fieldComplete(f, lc));
}

/** True se la pagina `/sync/[provider]/[model]` per `(m, locale)` è indicizzabile (NON esce `noindex`). */
export function isProviderModelVariantIndexable(m: ProviderModel, lc: Locale): boolean {
  if (lc === "it" || lc === "en") return true;
  return isProviderModelLocaleComplete(m, lc);
}
