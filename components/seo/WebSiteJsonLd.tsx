import { JsonLd } from "./JsonLd";
import type { Locale } from "@/lib/i18n";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { SITE_URL } from "@/lib/product-facts";

/**
 * WebSite — SOLO sulla homepage, non nel layout globale. Prima veniva
 * emessa su ogni pagina marketing (articoli blog, pagine provider, pagine
 * interne inclusi) con `url: ${SITE_URL}/${locale}` che cambiava a ogni
 * locale — un'entità "stabile" con un URL che varia per pagina è
 * contraddittorio. Ora un solo nodo, `url: SITE_URL` (l'apex, senza
 * variabile di locale), stesso `name` e stesso `@id` ovunque compaia.
 *
 * NOTA IMPORTANTE (non risolta in questo sprint): `/` reindirizza a `/it`
 * (vedi middleware/routing) — non esiste una vera home a `SITE_URL` che
 * risponda 200 direttamente su quell'URL. Google potrebbe quindi NON usare
 * questo WebSite come "site name" ufficiale nei risultati di ricerca, perché
 * l'URL dichiarato non è raggiungibile senza redirect. Risolverlo
 * richiederebbe cambiare l'architettura dell'URL radice (servire contenuto
 * reale su `/` invece di un redirect) — fuori scope per questo sprint,
 * segnalato esplicitamente qui e nel report finale.
 *
 * `potentialAction`/`SearchAction` resta RIMOSSO (sprint precedente):
 * richiede una pagina di ricerca interna funzionante per l'eleggibilità
 * alla sitelinks search box di Google, che non esiste.
 */
export function webSiteJsonLdData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: "FitMesh Sync",
    publisher: { "@id": `${SITE_URL}#organization` },
  };
}

export function WebSiteJsonLd({ locale }: { locale: Locale }) {
  return <JsonLd data={{ ...webSiteJsonLdData(), inLanguage: schemaLanguage(locale) }} />;
}
