import { JsonLd } from "./JsonLd";
import { ogLocale, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";

/**
 * WebSite — entità stabile (`@id` unico), referenzia Organization per `@id`.
 *
 * `potentialAction`/`SearchAction` RIMOSSO: richiede una pagina di ricerca
 * interna funzionante per l'eleggibilità alla sitelinks search box di
 * Google. Non esiste (`/blog?q=` non è una feature di ricerca reale) — la
 * dichiarazione precedente prometteva a Google una funzionalità inesistente.
 */
export function webSiteJsonLdData(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: `${SITE_URL}/${locale}`,
    name: "FitMesh Sync",
    inLanguage: ogLocale[locale].replace("_", "-"),
    publisher: { "@id": `${SITE_URL}#organization` },
  };
}

export function WebSiteJsonLd({ locale }: { locale: Locale }) {
  return <JsonLd data={webSiteJsonLdData(locale)} />;
}
