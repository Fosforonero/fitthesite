/**
 * lib/content/home-ai-copy.ts: copy della sezione AI della home (S02, 02/10/2026).
 *
 * Unita' U-AI-02, U-AI-03, U-AI-05 del testo base BASE-HOME-v2.1-8961c3f9.
 * Prima il testo stava in page.tsx come ternari it/es/en con l'inglese per le
 * altre 12 lingue (fallback silenzioso, TRANSLATIONS 5). Qui solo it/en
 * approvati: per le altre lingue il valore e' assente e la sezione si ritira
 * (lettura con tlOwn(), mai tl()), finche' la consegna linguistica non
 * arriva (TRANSLATE_NEEDED).
 *
 * Tolti: kicker «La tua AI, le tue regole» (U-AI-01), nomi di assistenti di
 * terzi e «quello che preferisci» (U-AI-03), elenco «Porta il tuo wearable» /
 * «Porta la tua AI» (U-AI-04). Testi di stato: solo lib/feature-status.ts.
 */
import type { Localized } from "@/lib/blog/types";

export const HOME_AI_COPY = {
  /** U-AI-02, H2. */
  heading: {
    it: "Un riepilogo dei tuoi dati, da condividere se vuoi",
    en: "A summary of your data, to share if you choose",
  } as Localized,
  /** U-AI-03, paragrafo. */
  body: {
    it: "Nell'app puoi preparare un riepilogo dei tuoi dati e decidere se condividerlo con un assistente AI.",
    en: "In the app you can prepare a summary of your data and decide whether to share it with an AI assistant.",
  } as Localized,
  /** U-AI-05, etichetta del link verso /{lc}/ai. */
  linkLabel: {
    it: "Scopri come funziona",
    en: "See how it works",
  } as Localized,
};
