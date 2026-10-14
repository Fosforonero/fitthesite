/**
 * REGISTRO DEI CLAIM (SD, 14/10/2026). Una voce per ogni frase dei post coperti che i rilevatori di richiamo
 * (claim-detectors.ts) segnalano come possibile claim. I dati stanno in claim-registry.json (una voce per riga).
 * Il registro NON attesta la verita' di un claim: dice di ogni claim che fonte ha (o che non ne ha) e a che
 * punto e' la revisione. Dove manca una fonte primaria: fonte «nessuna» e stato «da-rivedere».
 */
import registryJson from "./claim-registry.json";
import type { ClaimPolarita, ClaimSoggetto, ClaimTipo } from "./claim-detectors";

export const FONTI = ["primaria", "misura interna", "comportamento del prodotto", "nessuna"] as const;
export type ClaimFonte = (typeof FONTI)[number];
export const STATI_REVISIONE = ["rivisto-da-matteo", "rivisto-da-agente", "da-rivedere", "da-rivedere-madrelingua"] as const;
export type StatoRevisione = (typeof STATI_REVISIONE)[number];

export type ClaimEntry = {
  id: string; // «<post>/<ambito>#<indice frase>», stabile finche' la cella e la posizione non cambiano
  post: string; // chiave del post coperto (garmin | fitbit | google-health)
  slug: string;
  ambito: string; // percorso della cella, es. ts:body.15.items.it.2
  indice: number; // posizione della frase nella cella
  lingue: string[];
  tipo: ClaimTipo;
  soggetto: ClaimSoggetto;
  polarita: ClaimPolarita;
  marcatori: string[];
  impronta: string; // SHA-256 della frase normalizzata
  anteprima: string; // primi 48 caratteri, solo per la leggibilita' del registro
  fonte: ClaimFonte;
  riferimentoFonte: string | null;
  urlFonte: string | null; // solo per fonte «primaria»
  statoRevisione: StatoRevisione;
  dataRevisione: string; // AAAA-MM-GG
};

export const CLAIM_REGISTRY = registryJson as unknown as ClaimEntry[];
