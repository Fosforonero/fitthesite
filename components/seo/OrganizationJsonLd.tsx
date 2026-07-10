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
 * Organization — entità stabile, stesso `@id` su ogni pagina (renderizzata
 * dal layout marketing globale). `founder` è il nodo Person completo, con lo
 * stesso `@id` riusato (per riferimento) dall'author dell'Article sui post
 * del blog — vedi lib/seo/entities.ts.
 *
 * `areaServed` volutamente OMESSO: Android è live ovunque, iOS fuori UE, non
 * esiste un valore Schema.org pulito che rappresenti "tutto il mondo tranne
 * un sottoinsieme in rollout" senza essere fuorviante. Meglio ometterlo che
 * dichiarare (come prima) `["IT", "EU"]`, falso per entrambe le piattaforme.
 */
/** Costruzione dati pura (nessun JSX) — testabile in isolamento. */
export function organizationJsonLdData(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: PRODUCT_NAME,
    alternateName: ["FitMesh", "FitMesh Sync Health Dashboard", "FitMesh Android Health Tracker"],
    legalName: TRADER.legalName,
    url: SITE_URL,
    description: ORG_DESCRIPTIONS[locale] ?? ORG_DESCRIPTIONS.en,
    address: TRADER_POSTAL_ADDRESS,
    ...(TRADER.vat !== "IT00000000000" && { vatID: TRADER.vat, taxID: TRADER.vat }),
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
