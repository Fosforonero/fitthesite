import type { Locale } from "@/lib/i18n";
import type { Localized } from "@/lib/blog/types";
import { tl } from "@/lib/blog/types";

/**
 * P1.6 Fase 2: sezione "Fonti" condivisa, unica fonte di verità per rendere
 * `post.sources` (oggi solo consumato dal JSON-LD `citation`, mai mostrato ai
 * lettori) anche come lista visibile e cliccabile nel corpo pagina.
 *
 * Regola esplicita: non inventare un titolo per la fonte. `post.sources` è
 * `string[]` (solo URL, nessun label strutturato nel modello dati) — quindi
 * ogni voce mostra dominio + numerazione leggibile ("Fonte 1 · pubmed.ncbi.nlm.nih.gov"),
 * mai un titolo remoto non verificato. Se un post preferisce citazioni con un
 * titolo reale scritto a mano, le mette inline nel corpo (pattern già in uso,
 * es. "Fonte: [HealthKit](url), consultata il 20/07/2026") e imposta
 * `sourcesRenderedInline: true` per far sì che QUESTO componente non
 * duplichi le stesse fonti in una seconda sezione.
 */

const SOURCES_HEADING: Localized = {
  it: "Fonti",
  en: "Sources",
  es: "Fuentes",
  de: "Quellen",
  pt: "Fontes",
  fr: "Sources",
  pl: "Źródła",
  tr: "Kaynaklar",
  nl: "Bronnen",
  ja: "出典",
  ko: "출처",
  sv: "Källor",
  da: "Kilder",
  no: "Kilder",
  fi: "Lähteet",
};

/** "Fonte 1" / "Source 1" ecc. — numerazione leggibile quando non c'è un titolo. */
const SOURCE_LABEL_PREFIX: Localized = {
  it: "Fonte",
  en: "Source",
  es: "Fuente",
  de: "Quelle",
  pt: "Fonte",
  fr: "Source",
  pl: "Źródło",
  tr: "Kaynak",
  nl: "Bron",
  ja: "出典",
  ko: "출처",
  sv: "Källa",
  da: "Kilde",
  no: "Kilde",
  fi: "Lähde",
};

/** Dominio leggibile da un URL, senza "www.": fallback quando non c'è un titolo verificato. */
function readableDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function BlogSources({
  sources,
  locale,
}: {
  sources: readonly string[] | undefined;
  locale: Locale;
}) {
  if (!sources || sources.length === 0) return null;

  return (
    <section aria-labelledby="blog-sources-heading" className="max-w-3xl mx-auto px-4 sm:px-6 mt-10">
      <h2
        id="blog-sources-heading"
        className="font-display text-display font-semibold tracking-tightest text-text-primary"
      >
        {tl(SOURCES_HEADING, locale)}
      </h2>
      <ol className="mt-4 space-y-2">
        {sources.map((url, i) => (
          <li key={url} className="text-sm text-text-secondary leading-relaxed">
            <span className="text-text-muted">
              {tl(SOURCE_LABEL_PREFIX, locale)} {i + 1} ·{" "}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-aqua hover:text-brand-green underline-offset-2 hover:underline transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua rounded-sm"
            >
              {readableDomain(url)}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
