/**
 * Utilita' condivise dai test dell'invito pubblico (pagina e API di anteprima).
 *
 * Non e' un file di test: esporta solo le due «trappole» e le classi di codice
 * usate per dimostrare che la risposta non dipende dal codice.
 */

/**
 * Le classi di codice. Nessuna e' un codice reale: sono stringhe sintetiche.
 * I nomi «valido», «scaduto» ed «esaurito» descrivono la classe che si vuole
 * SIMULARE: dato che pagina e API non leggono nulla, non c'e' nessun modo in cui
 * possano distinguerle, ed e' proprio quello che il test deve provare.
 * Nessun codice puo' esistere: il generatore vivo usa solo le cifre 0-9A-F e
 * ognuno di questi contiene almeno un carattere fuori da quell'alfabeto (Z, X, L).
 */
export const CLASSI_DI_CODICE: Record<string, string> = {
  valido_simulato: "MESH-ABCZ",
  scaduto_simulato: "MESH-EXP1",
  esaurito_simulato: "MESH-FULL",
  inesistente: "MESH-ZZZZ",
  senza_prefisso: "ZZZZ",
  minuscolo: "mesh-zzzz",
  troppo_corto: "MESH-Z",
  caratteri_speciali: "MESH-%00%2F..",
  unicode: "MESH-é€☃",
  lunghissimo: `MESH-${"Z".repeat(5000)}`,
};

/**
 * Trappola sull'ambiente: sostituisce `process.env` con un proxy che registra
 * ogni lettura di una variabile di Supabase o della chiave di servizio.
 * Chi la usa deve chiamare `ripristina()` alla fine.
 */
export function spiaAmbiente() {
  const originale = process.env;
  const lette: string[] = [];
  process.env = new Proxy(originale, {
    get(target, chiave, ricevente) {
      if (typeof chiave === "string" && /supabase|service_role/i.test(chiave)) {
        lette.push(chiave);
      }
      return Reflect.get(target, chiave, ricevente);
    },
  });
  return {
    lette,
    ripristina() {
      process.env = originale;
    },
  };
}
