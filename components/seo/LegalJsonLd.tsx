/**
 * Structured data per le pagine legali (privacy, terms, cookies).
 * Emette un nodo WebPage con publisher — nodo Organization COMPATTO (stesso
 * @id della versione piena su homepage/about, ma autosufficiente: quelle
 * pagine non sono co-presenti qui, un bare `{"@id": ...}` sarebbe un
 * riferimento a vuoto). Con dateModified per i trust signal.
 *
 * Nota: schema.org non ha un tipo "PrivacyPolicy"/"TermsOfService" ufficiale,
 * quindi usiamo WebPage (valido e indicizzabile) invece di inventare un tipo.
 */
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationCompactRef } from "@/components/seo/OrganizationJsonLd";
import type { Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";

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
    inLanguage: schemaLanguage(locale),
    publisher: organizationCompactRef(),
    ...(description && { description }),
    ...(dateModified && { dateModified }),
  };
  return <JsonLd data={data} />;
}
