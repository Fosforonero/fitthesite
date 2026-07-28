/**
 * Sprint P0.10 — fonte unica della finestra temporale del programma Founder.
 *
 * FOUNDER_END_AT è l'UNICA costante che definisce quando il programma
 * Founder si chiude. Nessun altro file deve hardcodare questa data in
 * un'altra forma (stringa diversa, offset diverso): il guardrail
 * tools/check-founder-window.ts fallisce se lo fa, e confronta anche il
 * valore SQL (private.grant_founder_launch_core) con questo valore TS.
 *
 * Perché 2026-07-31T22:00:00Z: equivale a 2026-08-01T00:00:00+02:00 CEST
 * (Europe/Rome è in CEST, UTC+2, a fine luglio). Il programma è quindi
 * aperto fino al 31 luglio 2026 23:59:59 CEST incluso, chiuso dal 1 agosto
 * 2026 00:00:00 CEST.
 *
 * `now` è sempre un parametro esplicito (mai `new Date()` chiamato
 * internamente senza default) così i test possono iniettare un orologio
 * fittizio — vedi program-window.test.ts — senza toccare l'ora di sistema
 * (niente vi.useFakeTimers/vi.setSystemTime).
 */

export const FOUNDER_END_AT = "2026-07-31T22:00:00Z" as const;
export const FOUNDER_END_AT_MS: number = Date.parse(FOUNDER_END_AT);

/** true se il programma Founder è ancora aperto al momento `now` (default: adesso). */
export function isFounderProgramOpen(now: Date = new Date()): boolean {
  return now.getTime() < FOUNDER_END_AT_MS;
}

/**
 * Data limite per la UI, in formato leggibile per locale — SOLO la parte
 * "31 luglio 2026" / "July 31, 2026", senza ora (l'ora CEST è nel copy
 * fisso, per evitare ambiguità di fuso in output Intl non identici tra
 * motori).
 */
const END_DATE_LOCALE_MAP: Record<string, string> = {
  it: "it-IT",
  es: "es-ES",
  de: "de-DE",
  pt: "pt-PT",
  fr: "fr-FR",
  pl: "pl-PL",
  tr: "tr-TR",
  nl: "nl-NL",
  ja: "ja-JP",
  ko: "ko-KR",
  sv: "sv-SE",
  da: "da-DK",
  no: "nb-NO",
  fi: "fi-FI",
  en: "en-US",
};

export function formatFounderEndDate(locale: string): string {
  const intlLocale = END_DATE_LOCALE_MAP[locale] ?? "en-US";
  // FOUNDER_END_AT è l'istante esatto di chiusura (00:00:00 CEST del 1
  // agosto): formattarlo direttamente in Europe/Rome darebbe "1 agosto",
  // che è il primo giorno CHIUSO, non l'ultimo giorno aperto. Sottraiamo
  // 1ms per atterrare sull'ultimo istante del 31 luglio.
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: "Europe/Rome",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(FOUNDER_END_AT_MS - 1));
}
