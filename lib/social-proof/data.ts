/**
 * lib/social-proof/data.ts — testimonianze / social proof per la homepage.
 *
 * ⚠️  REGOLA: SOLO citazioni REALI e attribuibili (recensioni Google Play /
 * App Store, feedback dei founder beta). È VIETATO inventare testimonianze
 * (policy YMYL + linee guida Google/Apple sulle recensioni).
 *
 * Finché `TESTIMONIALS` è vuoto, la sezione NON viene renderizzata: il
 * componente `components/Testimonials.tsx` ritorna `null` (guard sui dati).
 * Appena inserisci quote reali qui sotto, la sezione appare automaticamente.
 *
 * `rating` va valorizzato SOLO se proviene da una recensione pubblica reale;
 * NON aggiungere schema AggregateRating finché non esiste un rating verificabile.
 */
import type { Localized } from "@/lib/blog/types";

export type Testimonial = {
  /** Nome visualizzato o iniziale (es. "Marco R.") — mai dati personali completi. */
  author: string;
  /** Contesto breve e localizzato (es. "Possessore Galaxy Watch 7"). */
  role: Localized;
  /** La citazione, localizzata. */
  quote: Localized;
  /** Etichetta fonte (es. "Recensione Google Play", "Founder beta"). */
  source?: string;
  /** Valutazione 1–5, SOLO se da recensione pubblica reale. */
  rating?: 1 | 2 | 3 | 4 | 5;
};

/** Vuoto di proposito: popolare con citazioni reali per attivare la sezione. */
export const TESTIMONIALS: Testimonial[] = [];

/** Copy di sezione (localizzata; en come fallback per le lingue mancanti). */
export const TESTIMONIALS_COPY = {
  kicker: {
    it: "Dicono di noi",
    en: "What people say",
    es: "Lo que dicen",
    de: "Das sagen Nutzer",
    pt: "O que dizem",
    fr: "Ce qu'on en dit",
  } as Localized,
  heading: {
    it: "Founder reali, dashboard reale.",
    en: "Real founders, real dashboard.",
    es: "Founders reales, dashboard real.",
    de: "Echte Founder, echtes Dashboard.",
    pt: "Founders reais, dashboard real.",
    fr: "De vrais founders, un vrai tableau de bord.",
  } as Localized,
  reviewCta: {
    it: "Lascia una recensione su Google Play",
    en: "Leave a review on Google Play",
    es: "Deja una reseña en Google Play",
    de: "Bewertung auf Google Play hinterlassen",
    pt: "Deixe uma avaliação no Google Play",
    fr: "Laissez un avis sur Google Play",
  } as Localized,
};

/** URL della scheda Play Store (per il CTA recensione). */
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";
