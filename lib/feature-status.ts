/**
 * Stato pubblico delle funzioni non ancora disponibili: dashboard web personale
 * e Mesh Famiglia.
 *
 * UNA sola fonte del FATTO: `CAPABILITY_STATUS` in lib/product-facts.ts. Questo
 * modulo non conserva nessuno stato proprio: lo legge. Le superfici che
 * cambiano con lo stato (card Mesh della home, paragrafo Mesh di /about,
 * flag di /famiglia, riga di llms.txt) chiamano `isFeatureAvailable()`; al
 * rilascio si cambia lo stato in product-facts.ts e quelle superfici seguono.
 *
 * Una funzione e' «disponibile» SOLO con `live_verified` o `live_limited`.
 * Una flag accesa o un prototipo esistente NON bastano: per la dashboard web
 * il passaggio a `live_verified` richiede tre condizioni insieme (vedi la nota
 * di `CAPABILITY_STATUS.webDashboard`): gate tecnico reale, rilascio approvato,
 * verifica in produzione con utenti Pro idonei e accesso verificato lato
 * server. Le chiavi sconosciute sono NON disponibili (fail-closed).
 *
 * Le frasi di stato sono brevi, senza date e senza formule di imminenza
 * («in arrivo», «coming soon», «presto»), come impone la nota di
 * `CAPABILITY_STATUS.familyMesh`.
 *
 * REVISIONE DELLE FRASI. Mesh Famiglia: it, es, en, de, pt, fr, pl, tr sono la
 * formula approvata (`FAMIGLIA_COMING_SOON[...].sub`, letta da li', non
 * ricopiata). nl, ja, ko, sv, da, no, fi: bozza e revisione di AGENTI, non di
 * madrelingua. Dashboard web: it, en, es, de, pt, fr, tr, nl, ja, pl, ko sono
 * le frasi gia' usate dalle correzioni della PR #79 (agenti); sv, da, no, fi
 * nuove (agenti). Se una frase non e' piu' ritenuta affidabile si toglie il
 * blocco che la mostra, non si ripiega sull'inglese.
 */
import { CAPABILITY_STATUS } from "@/lib/product-facts";
import { FAMIGLIA_COMING_SOON } from "@/lib/content/famiglia-coming-soon";
import type { Locale } from "@/lib/i18n";

export type FeatureKey = "familyMesh" | "webDashboard";

/** Stati che rendono vera una frase del tipo «e' disponibile». */
const AVAILABLE_STATUSES: ReadonlySet<string> = new Set(["live_verified", "live_limited"]);

/** True solo se CAPABILITY_STATUS dichiara la funzione disponibile. Fail-closed. */
export function isFeatureAvailable(key: FeatureKey): boolean {
  const entry = CAPABILITY_STATUS[key];
  return entry !== undefined && AVAILABLE_STATUSES.has(entry.status);
}

/** Dashboard web personale: non ancora disponibile (revisione: agenti). */
export const WEB_DASHBOARD_STATUS_SENTENCE: Record<Locale, string> = {
  it: "La dashboard web personale non è ancora disponibile.",
  en: "The personal web dashboard is not yet available.",
  es: "El panel web personal aún no está disponible.",
  de: "Das persönliche Web-Dashboard ist noch nicht verfügbar.",
  pt: "O painel web pessoal ainda não está disponível.",
  fr: "Le tableau de bord web personnel n'est pas encore disponible.",
  pl: "Osobisty panel internetowy nie jest jeszcze dostępny.",
  tr: "Kişisel web paneli henüz kullanılabilir değil.",
  nl: "Het persoonlijke webdashboard is nog niet beschikbaar.",
  ja: "個人用のウェブダッシュボードはまだ利用できません。",
  ko: "개인 웹 대시보드는 아직 제공되지 않습니다.",
  sv: "Den personliga webbpanelen är ännu inte tillgänglig.",
  da: "Det personlige webdashboard er endnu ikke tilgængeligt.",
  no: "Det personlige nettdashbordet er ikke tilgjengelig ennå.",
  fi: "Henkilökohtainen verkkokojelauta ei ole vielä saatavilla.",
};

/** Lingue della frase Mesh senza formula approvata: bozza e revisione di agenti. */
export const MESH_SENTENCE_AGENT_REVIEWED_LOCALES = ["nl", "ja", "ko", "sv", "da", "no", "fi"] as const;

const MESH_SENTENCE_AGENT_REVIEWED: Record<(typeof MESH_SENTENCE_AGENT_REVIEWED_LOCALES)[number], string> = {
  nl: "Family Mesh is in ontwikkeling en nog niet beschikbaar. We hebben geen releasedatum aangekondigd.",
  ja: "Family Meshは開発中で、まだ利用できません。リリース日は発表していません。",
  ko: "Family Mesh는 개발 중이며 아직 이용할 수 없습니다. 출시 일정은 발표하지 않았습니다.",
  sv: "Family Mesh är under utveckling och ännu inte tillgänglig. Vi har inte meddelat något lanseringsdatum.",
  da: "Family Mesh er under udvikling og endnu ikke tilgængelig. Vi har ikke annonceret en udgivelsesdato.",
  no: "Family Mesh er under utvikling og ikke tilgjengelig ennå. Vi har ikke kunngjort en lanseringsdato.",
  fi: "Family Mesh on kehitteillä, eikä se ole vielä saatavilla. Julkaisupäivää ei ole ilmoitettu.",
};

/**
 * Mesh Famiglia: in sviluppo, non disponibile, nessuna data. Le otto lingue
 * approvate sono LETTE da FAMIGLIA_COMING_SOON (una sola copia del testo).
 */
export const FAMILY_MESH_STATUS_SENTENCE: Record<Locale, string> = {
  it: FAMIGLIA_COMING_SOON.it.sub,
  en: FAMIGLIA_COMING_SOON.en.sub,
  es: FAMIGLIA_COMING_SOON.es.sub,
  de: FAMIGLIA_COMING_SOON.de.sub,
  pt: FAMIGLIA_COMING_SOON.pt.sub,
  fr: FAMIGLIA_COMING_SOON.fr.sub,
  pl: FAMIGLIA_COMING_SOON.pl.sub,
  tr: FAMIGLIA_COMING_SOON.tr.sub,
  ...MESH_SENTENCE_AGENT_REVIEWED,
};

/**
 * Record di provenienza richiesto da TRANSLATIONS «Declaring the source»:
 * lingua di partenza, ruolo e controllo applicato (TRANSLATIONS 6).
 *
 * Scostamento dichiarato: TRANSLATIONS 6 chiede revisione nativa o un
 * controllo equivalente (persona nominata o controllo automatico). La
 * decisione PM del 01/10/2026 ammette per queste frasi brevi la sola
 * revisione editoriale di agenti, MARCATA come tale e mai attribuita a
 * madrelingua. In piu' c'e' un controllo automatico (lib/feature-status.test.ts:
 * presenza in 15 lingue, nessun ripiego inglese, nessuna formula di
 * imminenza, nessuna data, nessun em dash).
 */
export const STATUS_SENTENCE_PROVENANCE = {
  familyMesh: {
    authoredLanguage: "it",
    // Ruolo: l'italiano e' la fonte, le altre 14 lingue sono derivate dalla formula it/en.
    role: { source: ["it"], derivative: "tutte le altre lingue" },
    origin: "formula approvata da Matteo il 22/09/2026 (nota di CAPABILITY_STATUS.familyMesh); testo it, en, es, de, pt, fr, pl, tr in lib/content/famiglia-coming-soon.ts, nl, ja, ko, sv, da, no, fi tradotte da quella",
    controlRecordedOn: "2026-10-01",
    approvedFormula: ["it", "en", "es", "de", "pt", "fr", "pl", "tr"],
    controlAgentReview: [...MESH_SENTENCE_AGENT_REVIEWED_LOCALES],
  },
  webDashboard: {
    authoredLanguage: "it",
    role: { source: ["it"], derivative: "tutte le altre lingue" },
    origin: "formula it ed en della PR #79 (043fa1b, correzioni sulla dashboard web, tradotta da agenti in 11 lingue); sv, da, no, fi nuove (01/10/2026)",
    controlRecordedOn: "2026-10-01",
    approvedFormula: [] as string[],
    controlAgentReview: ["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"],
  },
} as const;

const SENTENCES: Record<FeatureKey, Record<Locale, string>> = {
  familyMesh: FAMILY_MESH_STATUS_SENTENCE,
  webDashboard: WEB_DASHBOARD_STATUS_SENTENCE,
};

/** Frase di stato verificata nella lingua pubblicata. Mai un ripiego inglese. */
export function featureStatusSentence(key: FeatureKey, locale: Locale): string {
  return SENTENCES[key][locale];
}

/**
 * Home: la griglia delle funzioni (`dictionary.features.items`) ha la Mesh
 * Famiglia come sesta voce in tutte e 15 le lingue. Finche' la Mesh non e'
 * disponibile la card NON si mostra: una card promozionale venderebbe una
 * funzione che nessuno puo' usare. I dizionari non si toccano: al rilascio
 * basta cambiare lo stato e la card ricompare. Il test di questo modulo
 * verifica che la voce all'indice indicato sia la Mesh in tutte le lingue.
 */
export const MESH_FEATURE_CARD_INDEX = 5;

export function visibleFeatureCards<T>(items: readonly T[]): T[] {
  if (isFeatureAvailable("familyMesh")) return [...items];
  return items.filter((_, i) => i !== MESH_FEATURE_CARD_INDEX);
}
