/**
 * FitMesh Labs: contenuto della pagina indice `/labs`. Stesso pattern
 * per-campo di lib/labs/hrv/content.ts (necessario per
 * tools/local-translator/translate-ts.sh): IT scritto a mano come sorgente,
 * EN generato via pipeline di traduzione + revisione umana (Fase 9).
 */

import type { LabsText, LabsTextList } from "@/lib/labs/registry";

export interface LabsIndexContent {
  metaTitle: LabsText;
  metaDescription: LabsText;
  heroKicker: LabsText;
  heroTitle: LabsText;
  heroSubtitle: LabsText;
  missionHeading: LabsText;
  missionParagraphs: LabsTextList;
  privacyHeading: LabsText;
  privacyParagraphs: LabsTextList;
  liveToolsHeading: LabsText;
  comingSoonHeading: LabsText;
  comingSoonBadge: LabsText;
  breadcrumbHome: LabsText;
  breadcrumbLabs: LabsText;
}

export const LABS_INDEX_CONTENT: LabsIndexContent = {
  metaTitle: {
    it: "FitMesh Labs: strumenti di calcolo per dati di salute",
    en: "FitMesh Labs: calculation tools for health data",
  },
  metaDescription: {
    it: "FitMesh Labs: strumenti di calcolo gratuiti, trasparenti e privacy-first per dati di salute e fitness. Elaborazione locale nel browser, nessun upload, formule documentate.",
    en: "FitMesh Labs: free, transparent, privacy-first calculation tools for health and fitness data. Local browser processing, no upload, documented formulas.",
  },
  heroKicker: { it: "FitMesh Labs", en: "FitMesh Labs" },
  heroTitle: {
    it: "Strumenti di calcolo per i tuoi dati di salute",
    en: "Calculation tools for your health data",
  },
  heroSubtitle: {
    it: "Calcolatori gratuiti, trasparenti e verificabili per metriche di salute e fitness. Ogni calcolo avviene nel tuo browser: nessun dato viene mai inviato a un server.",
    en: "Free, transparent, verifiable calculators for health and fitness metrics. Every calculation happens in your browser: no data is ever sent to a server.",
  },
  missionHeading: { it: "La missione di FitMesh Labs", en: "The mission of FitMesh Labs" },
  missionParagraphs: {
    it: [
      "FitMesh Labs raccoglie strumenti di calcolo indipendenti per metriche di salute e fitness, non semplici form ottimizzati per i motori di ricerca, ma risorse pensate per essere davvero utili, riproducibili e citabili da utenti, sviluppatori, giornalisti e assistenti AI.",
      "Ogni strumento documenta le formule che usa, dichiara esplicitamente i propri limiti e non presenta mai un risultato come diagnosi, classificazione o previsione medica. Dove le evidenze non supportano un valore universale (es. tabelle di riferimento per età o sesso), lo diciamo esplicitamente invece di inventarne uno.",
    ],
    en: [
      "FitMesh Labs collects independent calculation tools for health and fitness metrics, not simple SEO-optimized forms, but resources designed to be genuinely useful, reproducible, and citable by users, developers, journalists, and AI assistants.",
      "Each tool documents the formulas it uses, explicitly states its own limits, and never presents a result as a diagnosis, classification, or medical prediction. Where the evidence doesn't support a universal value (e.g. age or sex reference tables), we say so explicitly instead of inventing one.",
    ],
  },
  privacyHeading: { it: "Privacy degli strumenti", en: "Tool privacy" },
  privacyParagraphs: {
    it: [
      "Tutti gli strumenti di FitMesh Labs calcolano interamente nel tuo browser. I dati che inserisci, che siano intervalli cardiaci, orari di sonno o altro, non vengono mai inviati a un server, non entrano in parametri URL, cookie, localStorage o eventi analytics.",
      "Le uniche azioni che producono un file o copiano testo (es. \"Scarica CSV\", \"Copia risultati\") avvengono localmente sul tuo dispositivo, solo dopo un click esplicito: mai upload, mai automatismi.",
    ],
    en: [
      "All FitMesh Labs tools calculate entirely in your browser. The data you enter, whether heartbeat intervals, sleep times, or anything else, is never sent to a server, and never enters URL parameters, cookies, localStorage, or analytics events.",
      "The only actions that produce a file or copy text (e.g. \"Download CSV\", \"Copy results\") happen locally on your device, only after an explicit click: never an upload, never automatic.",
    ],
  },
  liveToolsHeading: { it: "Strumenti disponibili", en: "Available tools" },
  comingSoonHeading: { it: "In preparazione", en: "Coming soon" },
  comingSoonBadge: { it: "Presto disponibile", en: "Coming soon" },
  breadcrumbHome: { it: "Home", en: "Home" },
  breadcrumbLabs: { it: "Labs", en: "Labs" },
};
