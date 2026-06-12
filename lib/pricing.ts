/**
 * lib/pricing.ts — UNICA FONTE DI VERITÀ per i prezzi di FitMesh Pro
 *
 * Per cambiare un prezzo: modifica SOLO questo file, poi aggiorna manualmente
 * i due punti di sync JSON elencati qui sotto (non possono importare TypeScript).
 *
 * ─── PUNTI DI SYNC MANUALE ────────────────────────────────────────────────
 *  1. lib/dictionaries/en.json   riga 13  →  hero.pricing
 *     valore attuale: "One-time purchase €3.99 · secure payment via Google Play"
 *     costante usata: PRICING.lifetimeAndroid.en
 *
 *  2. lib/dictionaries/it.json   riga 13  →  hero.pricing
 *     valore attuale: "Acquisto unico €3,99 · pagamento sicuro Google Play"
 *     costante usata: PRICING.lifetimeAndroid.it
 * ──────────────────────────────────────────────────────────────────────────
 */

// ── Valori numerici raw (usati nei JSON-LD schema.org) ────────────────────
/** Prezzo Android lifetime in euro (valore numerico grezzo per JSON-LD) */
export const PRICE_LIFETIME_ANDROID_RAW = "3.99" as const;
/** Prezzo iPhone lifetime in euro (valore numerico grezzo per JSON-LD) */
export const PRICE_LIFETIME_IOS_RAW = "4.99" as const;
/** Prezzo abbonamento 6 mesi in euro (valore numerico grezzo) */
export const PRICE_SUB_6M_RAW = "1.19" as const;

// ── Stringhe display localizzate ─────────────────────────────────────────

/** Oggetto centralizzato con tutte le stringhe display per i prezzi */
export const PRICING = {
  /** Abbonamento semestrale — stesso prezzo su Android e iPhone */
  subSixMonths: {
    it: "€1,19",
    en: "€1.19",
  },
  /** Acquisto unico su Android (Play Store) */
  lifetimeAndroid: {
    it: "€3,99",
    en: "€3.99",
  },
  /** Acquisto unico su iPhone (App Store) */
  lifetimeIos: {
    it: "€4,99",
    en: "€4.99",
  },

  // ── Frasi composte riusabili ─────────────────────────────────────────

  /** "€3,99 su Android · €4,99 su iPhone" */
  lifetimeBoth: {
    it: "€3,99 su Android · €4,99 su iPhone",
    en: "€3.99 on Android · €4.99 on iPhone",
  },
  /** "€3,99 Android · €4,99 iPhone" (versione compatta senza preposizione) */
  lifetimeBothShort: {
    it: "€3,99 Android · €4,99 iPhone",
    en: "€3.99 Android · €4.99 iPhone",
  },
  /** "da €3,99" / "from €3.99" — per contesti che citano solo il prezzo minimo */
  fromLifetime: {
    it: "da €3,99",
    en: "from €3.99",
  },
  /** "€1,19/6 mesi" / "€1.19/6mo" */
  subSixMonthsLabel: {
    it: "€1,19/6 mesi",
    en: "€1.19/6mo",
  },
  /** "€1,19 ogni 6 mesi" / "€1.19 every 6 months" */
  subSixMonthsFull: {
    it: "€1,19 ogni 6 mesi",
    en: "€1.19 every 6 months",
  },
} as const;

/** Helper: ritorna la stringa display per la locale corrente */
export function p(key: keyof typeof PRICING, locale: "it" | "en"): string {
  return PRICING[key][locale];
}
