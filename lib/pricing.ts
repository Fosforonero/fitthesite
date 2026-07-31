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
 *
 *  3. lib/blog/posts/fitmesh-gratis-prezzo-founder.ts  →  sezioni prezzo + FAQ
 *     cita "al lancio €1,19 ogni 6 mesi" e "€3,99 Android / €4,99 iPhone"
 *     piu' le analogie caffe'/pizza. Aggiornare le cifre qui se cambiano.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * ─── Sprint P0.10K — chiusura commerciale del sito ────────────────────────
 *  a) COPERTURA 15 LOCALE. Le stringhe display si fermavano a 8 locale
 *     (it/en/es/de/pt/fr/pl/tr): nl, ja, ko, sv, da, no, fi cadevano sul
 *     fallback `en` di p(). Aggiunte tutte e 7. Provenienza — nessuna
 *     traduzione automatica: lib/content/about-copy.ts (metaDescription, 15
 *     locale, contiene gia' "acquisto unico da €3,99" nella forma e nella
 *     punteggiatura corretta per ogni lingua: "od €3,99", "vanaf €3,99",
 *     "€3.99から", "€3.99부터", "från/fra €3,99", "alkaen €3,99") e
 *     lib/dictionaries/<loc>.json → hero.pricing (forma locale di "ogni 6
 *     mesi": "per 6 maanden", "6ヶ月", "6개월", "var 6:e månad",
 *     "hver 6. måned", "joka kuusi kuukautta").
 *     Il separatore decimale segue la convenzione della lingua cosi' come gia'
 *     scritta a mano in about-copy: virgola ovunque, punto per ja/ko.
 *
 *  b) `founderPromo` RIMOSSA. Era la frase promozionale del programma per i
 *     primi mille account: con la chiusura commerciale del sito non ha piu'
 *     alcun consumer (verificato con grep su app/components/lib: restavano
 *     solo le citazioni del NOME dentro i guardrail tools/check-founder-*.ts,
 *     che controllano il testo dei file e non importano questo modulo).
 *     `founderSeats` resta: e' la stessa informazione in forma di "fact"
 *     storico e i guardrail la citano come SSOT ammessa per i contesti
 *     storici/legali. Nessuna delle due puo' comparire su una superficie che
 *     presenta l'offerta corrente — invariante verificata da
 *     founder:commercial-truth-check (check 2).
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
    pl: "€1,19",
    tr: "€1,19",
    nl: "€1,19",
    ja: "€1.19",
    ko: "€1.19",
    sv: "€1,19",
    da: "€1,19",
    no: "€1,19",
    fi: "€1,19",
  },
  /** Acquisto unico su Android (Play Store) */
  lifetimeAndroid: {
    it: "€3,99",
    en: "€3.99",
    es: "€3,99",
    de: "€3,99",
    pt: "€3,99",
    fr: "€3,99",
    pl: "€3,99",
    tr: "€3,99",
    nl: "€3,99",
    ja: "€3.99",
    ko: "€3.99",
    sv: "€3,99",
    da: "€3,99",
    no: "€3,99",
    fi: "€3,99",
  },
  /** Acquisto unico su iPhone (App Store) */
  lifetimeIos: {
    it: "€4,99",
    en: "€4.99",
    es: "€4,99",
    de: "€4,99",
    pt: "€4,99",
    fr: "€4,99",
    pl: "€4,99",
    tr: "€4,99",
    nl: "€4,99",
    ja: "€4.99",
    ko: "€4.99",
    sv: "€4,99",
    da: "€4,99",
    no: "€4,99",
    fi: "€4,99",
  },

  // ── Frasi composte riusabili ─────────────────────────────────────────

  /**
   * "€3,99 su Android · €4,99 su iPhone"
   * Preposizione locale da dictionaries hero.badge ("Disponibile su Android e
   * iOS" → "op", "på"). fi usa la forma senza preposizione (identica a
   * lifetimeBothShort): il repo non ha un caso locativo umano da riusare per
   * "su Android", e non lo si inventa.
   */
  lifetimeBoth: {
    it: "€3,99 su Android · €4,99 su iPhone",
    en: "€3.99 on Android · €4.99 on iPhone",
    es: "€3,99 en Android · €4,99 en iPhone",
    de: "€3,99 auf Android · €4,99 auf iPhone",
    pt: "€3,99 no Android · €4,99 no iPhone",
    fr: "€3,99 sur Android · €4,99 sur iPhone",
    pl: "€3,99 na Android · €4,99 na iPhone",
    tr: "Android'de €3,99 · iPhone'da €4,99",
    nl: "€3,99 op Android · €4,99 op iPhone",
    ja: "Android €3.99 · iPhone €4.99",
    ko: "Android €3.99 · iPhone €4.99",
    sv: "€3,99 på Android · €4,99 på iPhone",
    da: "€3,99 på Android · €4,99 på iPhone",
    no: "€3,99 på Android · €4,99 på iPhone",
    fi: "€3,99 Android · €4,99 iPhone",
  },
  /** "€3,99 Android · €4,99 iPhone" (versione compatta senza preposizione) */
  lifetimeBothShort: {
    it: "€3,99 Android · €4,99 iPhone",
    en: "€3.99 Android · €4.99 iPhone",
    es: "€3,99 Android · €4,99 iPhone",
    de: "€3,99 Android · €4,99 iPhone",
    pt: "€3,99 Android · €4,99 iPhone",
    fr: "€3,99 Android · €4,99 iPhone",
    pl: "€3,99 Android · €4,99 iPhone",
    tr: "€3,99 Android · €4,99 iPhone",
    nl: "€3,99 Android · €4,99 iPhone",
    ja: "Android €3.99 · iPhone €4.99",
    ko: "Android €3.99 · iPhone €4.99",
    sv: "€3,99 Android · €4,99 iPhone",
    da: "€3,99 Android · €4,99 iPhone",
    no: "€3,99 Android · €4,99 iPhone",
    fi: "€3,99 Android · €4,99 iPhone",
  },
  /**
   * "da €3,99" / "from €3.99" — per contesti che citano solo il prezzo minimo.
   * Le 7 locale nuove riusano verbatim la forma di ABOUT_COPY.metaDescription.
   */
  fromLifetime: {
    it: "da €3,99",
    en: "from €3.99",
    es: "desde €3,99",
    de: "ab €3,99",
    pt: "a partir de €3,99",
    fr: "à partir de €3,99",
    pl: "od €3,99",
    tr: "€3,99'dan itibaren",
    nl: "vanaf €3,99",
    ja: "€3.99から",
    ko: "€3.99부터",
    sv: "från €3,99",
    da: "fra €3,99",
    no: "fra €3,99",
    fi: "alkaen €3,99",
  },
  /** "€1,19/6 mesi" / "€1.19/6mo" */
  subSixMonthsLabel: {
    it: "€1,19/6 mesi",
    en: "€1.19/6mo",
    es: "€1,19/6 meses",
    de: "€1,19/6 Monate",
    pt: "€1,19/6 meses",
    fr: "€1,19/6 mois",
    pl: "€1,19/6 mies.",
    tr: "€1,19/6 ay",
    nl: "€1,19/6 maanden",
    ja: "€1.19/6ヶ月",
    ko: "€1.19/6개월",
    sv: "€1,19/6 månader",
    da: "€1,19/6 måneder",
    no: "€1,19/6 måneder",
    fi: "€1,19/6 kuukautta",
  },
  /** "€1,19 ogni 6 mesi" / "€1.19 every 6 months" */
  subSixMonthsFull: {
    it: "€1,19 ogni 6 mesi",
    en: "€1.19 every 6 months",
    es: "€1,19 cada 6 meses",
    de: "€1,19 alle 6 Monate",
    pt: "€1,19 a cada 6 meses",
    fr: "€1,19 tous les 6 mois",
    pl: "€1,19 co 6 miesięcy",
    tr: "€1,19 6 ayda bir",
    nl: "€1,19 per 6 maanden",
    ja: "6ヶ月ごとに €1.19",
    ko: "6개월마다 €1.19",
    sv: "€1,19 var 6:e månad",
    da: "€1,19 hver 6. måned",
    no: "€1,19 hver 6. måned",
    fi: "€1,19 joka kuusi kuukautta",
  },

  // ── Fact storico Founder (NON un'offerta corrente) ───────────────────
  // Allineato ai Termini di servizio: i primi mille account registrati entro
  // la data di chiusura hanno ricevuto il Pro a vita gratis, senza condizioni
  // (nessuna recensione richiesta). Vedi app/.../terms/page.tsx e
  // lib/founder/historical-note.ts. Da Sprint P0.10K il sito non propone piu'
  // l'adesione: questa stringa vale solo per contesti storici/legali e NON
  // deve comparire su homepage/header/footer/menu/beta.

  /** "Primi 1000 account: Pro a vita gratis" (versione fact/etichetta) */
  founderSeats: {
    it: "Primi 1000 account: Pro a vita gratis",
    en: "First 1,000 accounts: lifetime Pro free",
    es: "Primeros 1000 cuentas: Pro de por vida gratis",
    de: "Erste 1000 Konten: lebenslanges Pro gratis",
    pt: "Primeiras 1000 contas: Pro vitalício grátis",
    fr: "1000 premiers comptes : Pro à vie gratuit",
    pl: "Pierwsze 1000 kont: dożywotnie Pro za darmo",
    tr: "İlk 1000 hesap: ömür boyu ücretsiz Pro",
  },
} as const;

/** Helper: ritorna la stringa display per la locale corrente (fallback en) */
export function p(key: keyof typeof PRICING, locale: Locale): string {
  const entry = PRICING[key] as Record<string, string>;
  return entry[locale] ?? entry["en"];
}
