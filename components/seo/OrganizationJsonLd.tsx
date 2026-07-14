import { JsonLd } from "./JsonLd";
import type { Locale } from "@/lib/i18n";
import { TRADER, TRADER_POSTAL_ADDRESS } from "@/lib/legal/trader";
import { authorPersonNode } from "@/lib/seo/entities";
import {
  SITE_URL,
  PRODUCT_NAME,
  PLAY_STORE_URL,
  AVAILABILITY,
  ORG_DESCRIPTIONS,
} from "@/lib/product-facts";

/**
 * Organization — versione COMPLETA, emessa solo su homepage e /about (non
 * più nel layout globale: prima appariva su ogni pagina marketing, inclusi
 * tutti gli articoli del blog, il che rendeva "Organization completa
 * ovunque" indistinguibile da "MobileApplication ovunque", lo stesso
 * problema che questo sprint corregge per l'app). `founder` è il nodo Person
 * completo, con lo stesso `@id` riusato dal nodo Person COMPATTO che compare
 * su Article/altre pagine — vedi lib/seo/entities.ts.
 *
 * Sulle pagine dove l'Organization completa non è co-presente (Article,
 * /beta, pagine legali) usa invece `organizationCompactRef()` sotto: stesso
 * `@id`/`name`/`url`, ma senza address/sameAs/contactPoint/founder — un nodo
 * autosufficiente che non lascia riferimenti "a vuoto" (`{"@id": ...}` senza
 * una definizione completa altrove nella STESSA pagina).
 *
 * `areaServed` volutamente OMESSO: sia Android che iOS sono live ovunque
 * (nessuna eccezione UE residua, verificato 2026-07-13), ma organization-level
 * `areaServed` non è comunque il posto giusto per dichiarare disponibilità
 * per-piattaforma — quella vive in `MobileApplicationJsonLd` (offers/regions
 * per singola app), non qui.
 */
/** Costruzione dati pura (nessun JSX) — testabile in isolamento. */
export function organizationJsonLdData(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: PRODUCT_NAME,
    alternateName: ["FitMesh", "FitMesh Sync Health Dashboard"],
    legalName: TRADER.legalName,
    url: SITE_URL,
    description: ORG_DESCRIPTIONS[locale] ?? ORG_DESCRIPTIONS.en,
    address: TRADER_POSTAL_ADDRESS,
    vatID: TRADER.vat,
    taxID: TRADER.vat,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon-square.png`,
      contentUrl: `${SITE_URL}/icon-square.png`,
      width: 1254,
      height: 1254,
      caption: "FitMesh Sync — app icon (FM monogram)",
    },
    image: `${SITE_URL}/icon-square.png`,
    sameAs: [
      PLAY_STORE_URL,
      AVAILABILITY.ios.storeUrl,
      "https://www.fosforonero.com",
    ],
    email: "hello@fitmesh.fit",
    founder: authorPersonNode(locale),
    foundingDate: "2026-04",
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "support@fitmesh.fit",
        contactType: "customer support",
        availableLanguage: ["Italian", "English"],
      },
    ],
  };
}

export function OrganizationJsonLd({ locale }: { locale: Locale }) {
  return <JsonLd data={organizationJsonLdData(locale)} />;
}

/**
 * Riferimento COMPATTO ma completo (non un bare `{"@id": ...}`): stesso
 * `@id`/`name`/`url`/`logo` della Organization piena, così un motore di
 * ricerca (o qualunque parser JSON-LD) che legga SOLO questa pagina — senza
 * mai vedere homepage/about — ottiene comunque un'entità valida e coerente,
 * non un riferimento a un nodo mai definito. Usato da publisher su Article,
 * MobileApplicationJsonLd (che compare anche su /beta, dove l'Organization
 * piena non è co-presente) e dalle pagine legali.
 */
export function organizationCompactRef() {
  return {
    "@type": "Organization" as const,
    "@id": `${SITE_URL}#organization`,
    name: PRODUCT_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject" as const,
      url: `${SITE_URL}/icon-square.png`,
    },
  };
}
