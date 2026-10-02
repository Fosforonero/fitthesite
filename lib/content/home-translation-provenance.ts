/**
 * lib/content/home-translation-provenance.ts: provenienza delle 13 lingue del
 * pacchetto home S02 (TRANSLATIONS «Declaring the source»).
 *
 * Registra i quattro punti richiesti, per le lingue es de fr pt pl tr nl ja ko
 * sv da no fi:
 *   1. lingua d'origine: it (la fonte; en e' derivata da it);
 *   2. ruolo: derivata;
 *   3. origine: versione del testo base BASE-HOME-v2.1-8961c3f9
 *      (sha256 8961c3f96017f40430eb6e7dad67812508b6312b13f0e7b869e65693afbf108b);
 *   4. controllo: AGENT_EDITORIALLY_REVIEWED, cioe' revisione di agente, NON
 *      madrelingua (decisione di Matteo del 02/10/2026, 15 lingue con revisione
 *      di agente). Mai da presentare come testo rivisto da madrelingua.
 * In piu' dichiara quali unita' (id del testo base) sono CONSEGNATE e quali
 * PENDENTI in ogni lingua. Pendente = cella assente o ancora al testo di
 * f142eac: resta al testo di allora, oppure il campo nuovo non si rende
 * (nessun ripiego inglese) finche' Gemini non consegna
 * (.claude/stato-lavoro/sprint-pm-02ott/base-v2/RICHIESTA-GEMINI-ADATTAMENTI.md).
 *
 * Il test (home-translation-provenance.test.ts) ricalcola consegnate e
 * pendenti dal sito e dal manifest tools/data/s02-home-units.json e fallisce se
 * questa dichiarazione e' diversa dal sito: quando arriva una consegna si
 * aggiornano queste liste, non si lasciano indietro.
 * Il gate di rilascio e' tools/check-s02-home-lingue.ts.
 *
 * Precedente: STATUS_SENTENCE_PROVENANCE in lib/feature-status.ts.
 */
import type { Locale } from "@/lib/i18n";

export const HOME_TRANSLATION_LOCALES = [
  "es", "de", "fr", "pt", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi",
] as const satisfies readonly Locale[];
export type HomeTranslationLocale = (typeof HOME_TRANSLATION_LOCALES)[number];

export const HOME_TRANSLATION_VERSION = "BASE-HOME-v2.1-8961c3f9";
export const HOME_TRANSLATION_CONTROL = "AGENT_EDITORIALLY_REVIEWED" as const;

export const HOME_TRANSLATION_PROVENANCE = {
  version: HOME_TRANSLATION_VERSION,
  authoredLanguage: "it",
  // Ruolo: l'italiano e' la fonte; l'inglese e le 13 lingue sono derivate.
  role: { source: ["it"], derivative: HOME_TRANSLATION_LOCALES },
  origin: {
    item: "testo base della home e di /about, 81 unita' (TESTO-BASE-v2-FINALE.json)",
    fromLanguage: "it",
    revision: HOME_TRANSLATION_VERSION,
    revisionSha256: "8961c3f96017f40430eb6e7dad67812508b6312b13f0e7b869e65693afbf108b",
    baselineCommit: "f142eac",
    deliveredBy:
      "Gemini, PACCHETTO-LINGUISTICO-HOME-13-LINGUE.md (02/10/2026), copiato alla lettera; solo le unita' COPERTA_E_INVARIATA, con le sole correzioni di nome proprio di M3",
  },
  control: HOME_TRANSLATION_CONTROL,
  controlNote: "revisione di agente, non madrelingua",
  controlRecordedOn: "2026-10-02",
  byLocale: {
    es: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-PRICE-16", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    de: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-PRICE-16", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    fr: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-PRICE-16", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    pt: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-PRICE-16", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    pl: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-PRICE-16", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    tr: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-PRICE-16", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    nl: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-PRICE-16", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    ja: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-03", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-PRICE-16", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-08", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    ko: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-03", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-PRICE-16", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-08", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    sv: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-PRICE-16", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    da: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-PRICE-16", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    no: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-PRICE-16", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
    fi: {
      delivered: ["U-HERO-01", "U-HERO-02", "U-STEP-01", "U-STEP-02", "U-STEP-04", "U-CARD-01", "U-PRICE-16", "U-META-01"],
      pending: ["U-HERO-03", "U-HERO-04", "U-STEP-03", "U-STEP-05", "U-STEP-06", "U-STEP-07", "U-CARD-02", "U-FEAT-01", "U-FEAT-02", "U-FEAT-03", "U-AI-02", "U-AI-03", "U-AI-05", "U-PRICE-02", "U-PRICE-04", "U-PRICE-11", "U-PRICE-13", "U-FAQ-01", "U-FAQ-02", "U-PRIV-11", "U-ABOUT-01", "U-ABOUT-02", "U-ABOUT-03", "U-ABOUT-04", "U-ABOUT-05", "U-ABOUT-10", "U-ABOUT-11", "U-ABOUT-12", "U-ABOUT-13", "U-META-02", "U-META-04"],
    },
  },
} as const;

/** Unita' consegnate e pendenti per lingua, come dichiarate qui. */
export function homeTranslationStatus(lc: HomeTranslationLocale): {
  delivered: readonly string[];
  pending: readonly string[];
} {
  return HOME_TRANSLATION_PROVENANCE.byLocale[lc];
}
