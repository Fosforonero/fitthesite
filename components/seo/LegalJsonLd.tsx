/**
 * Structured data per le pagine legali (privacy, terms, cookies).
 * Emette un nodo WebPage cross-referenziato (@id) al WebSite e all'Organization
 * già definiti nel layout marketing, con dateModified per i trust signal.
 *
 * Nota: schema.org non ha un tipo "PrivacyPolicy"/"TermsOfService" ufficiale,
 * quindi usiamo WebPage (valido e indicizzabile) invece di inventare un tipo.
 */
import { JsonLd } from "@/components/seo/JsonLd";
import { ogLocale, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";

export function LegalJsonLd({
  locale,
  path,
  name,
  description,
  dateModified,
}: {
  locale: Locale;
  /** Path senza locale, es. "/privacy". */
  path: string;
  name: string;
  description?: string;
  /** ISO date (YYYY-MM-DD) dell'ultimo aggiornamento del documento. */
  dateModified?: string;
}) {
  const url = `${SITE_URL}/${locale}${path}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name,
    url,
    inLanguage: ogLocale[locale].replace("_", "-"),
    isPartOf: { "@id": `${SITE_URL}#website` },
    publisher: { "@id": `${SITE_URL}#organization` },
    ...(description && { description }),
    ...(dateModified && { dateModified }),
  };
  return <JsonLd data={data} />;
}
