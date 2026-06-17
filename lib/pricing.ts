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

import type { Locale } from "@/lib/i18n";

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
    es: "€1,19",
    de: "€1,19",
    pt: "€1,19",
    fr: "€1,19",
  },
  /** Acquisto unico su Android (Play Store) */
  lifetimeAndroid: {
    it: "€3,99",
    en: "€3.99",
    es: "€3,99",
    de: "€3,99",
    pt: "€3,99",
    fr: "€3,99",
  },
  /** Acquisto unico su iPhone (App Store) */
  lifetimeIos: {
    it: "€4,99",
    en: "€4.99",
    es: "€4,99",
    de: "€4,99",
    pt: "€4,99",
    fr: "€4,99",
  },

  // ── Frasi composte riusabili ─────────────────────────────────────────

  /** "€3,99 su Android · €4,99 su iPhone" */
  lifetimeBoth: {
    it: "€3,99 su Android · €4,99 su iPhone",
    en: "€3.99 on Android · €4.99 on iPhone",
    es: "€3,99 en Android · €4,99 en iPhone",
    de: "€3,99 auf Android · €4,99 auf iPhone",
    pt: "€3,99 no Android · €4,99 no iPhone",
    fr: "€3,99 sur Android · €4,99 sur iPhone",
  },
  /** "€3,99 Android · €4,99 iPhone" (versione compatta senza preposizione) */
  lifetimeBothShort: {
    it: "€3,99 Android · €4,99 iPhone",
    en: "€3.99 Android · €4.99 iPhone",
    es: "€3,99 Android · €4,99 iPhone",
    de: "€3,99 Android · €4,99 iPhone",
    pt: "€3,99 Android · €4,99 iPhone",
    fr: "€3,99 Android · €4,99 iPhone",
  },
  /** "da €3,99" / "from €3.99" — per contesti che citano solo il prezzo minimo */
  fromLifetime: {
    it: "da €3,99",
    en: "from €3.99",
    es: "desde €3,99",
    de: "ab €3,99",
    pt: "a partir de €3,99",
    fr: "à partir de €3,99",
  },
  /** "€1,19/6 mesi" / "€1.19/6mo" */
  subSixMonthsLabel: {
    it: "€1,19/6 mesi",
    en: "€1.19/6mo",
    es: "€1,19/6 meses",
    de: "€1,19/6 Monate",
    pt: "€1,19/6 meses",
    fr: "€1,19/6 mois",
  },
  /** "€1,19 ogni 6 mesi" / "€1.19 every 6 months" */
  subSixMonthsFull: {
    it: "€1,19 ogni 6 mesi",
    en: "€1.19 every 6 months",
    es: "€1,19 cada 6 meses",
    de: "€1,19 alle 6 Monate",
    pt: "€1,19 a cada 6 meses",
    fr: "€1,19 tous les 6 mois",
  },
} as const;

/** Helper: ritorna la stringa display per la locale corrente */
export function p(key: keyof typeof PRICING, locale: Locale): string {
  return PRICING[key][locale];
}
