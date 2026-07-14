/**
 * FitMesh Sync — identità legale del trader (single source of truth).
 *
 * Questi sono i dati che Apple pubblica sulla scheda App Store ai sensi del
 * Digital Services Act (DSA) una volta verificato lo "stato di operatore
 * commerciale". Il sito DEVE essere coerente con la scheda store: stesso nome
 * legale, stesso indirizzo, stessa P.IVA.
 *
 * Un solo punto da aggiornare → alimenta:
 *   - il JSON-LD Organization (app/(frontend)/[locale]/(marketing)/layout.tsx)
 *   - il componente <TraderIdentity/> (Terms, Privacy)
 *   - la pagina /imprint (Impressum, obbligatorio in DE e in più stati UE)
 *
 * P.IVA reale confermata 2026-07-14 (sprint completamento /delete-account):
 * IT16166801007, REA LI-218580 (Livorno/Rosignano Marittimo). L'indirizzo
 * di sede resta Via Collazia 20, Roma — confermato esplicitamente da Matteo
 * come indirizzo ufficiale nonostante la registrazione REA a Rosignano
 * Marittimo (comune diverso da quello della sede, caso comune per ditte
 * individuali). Non un'incongruenza da correggere.
 */

export const TRADER = {
  /** Ragione sociale esatta come da visura / scheda Apple / Huawei. */
  legalName: "FOSFORONERO DI MATTEO PIZZI",
  /** Persona fisica titolare della ditta individuale. */
  representative: "Matteo Pizzi",
  /** Partita IVA UE, confermata reale 2026-07-14. */
  vat: "IT16166801007",
  address: {
    street: "Via Collazia 20",
    postalCode: "00183",
    city: "Roma",
    province: "RM",
    countryCode: "IT",
  },
  contactEmail: "hello@fitmesh.fit",
  privacyEmail: "privacy@fitmesh.fit",
  supportEmail: "support@fitmesh.fit",
  /** Sito del brand/azienda. */
  brandUrl: "https://www.fosforonero.com",
} as const;

/** Indirizzo su una riga, per uso inline (footer, JSON-LD caption, ecc.). */
export const TRADER_ADDRESS_LINE = `${TRADER.address.street}, ${TRADER.address.postalCode} ${TRADER.address.city}, Italia`;

/** PostalAddress schema.org, riusato nel JSON-LD Organization. */
export const TRADER_POSTAL_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: TRADER.address.street,
  postalCode: TRADER.address.postalCode,
  addressLocality: TRADER.address.city,
  addressRegion: TRADER.address.province,
  addressCountry: TRADER.address.countryCode,
} as const;
