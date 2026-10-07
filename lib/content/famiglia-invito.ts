/**
 * Testi della pagina pubblica di un link d'invito alla Mesh Famiglia.
 *
 * Decisione di Matteo (29/09/2026): la pagina e' la stessa per ogni codice e
 * dice una cosa sola, con queste due frasi ESATTE. Non esiste una traduzione
 * approvata nelle altre lingue: in quelle la pagina mostra entrambi i blocchi,
 * italiano e inglese, ciascuno marcato con il proprio `lang`, e non li
 * presenta come traduzione della lingua della rotta.
 *
 * Non aggiungere qui altre lingue senza una decisione esplicita.
 */

export const INVITO_COPY_IT =
  "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non è stata annunciata una data di rilascio.";

export const INVITO_COPY_EN =
  "Family Mesh is in development and is not yet available. No release date has been announced.";

export type InvitoBlocco = {
  lang: "it" | "en";
  /** Nome del prodotto nella lingua del blocco. */
  nome: string;
  testo: string;
};

const BLOCCO_IT: InvitoBlocco = { lang: "it", nome: "Mesh Famiglia", testo: INVITO_COPY_IT };
const BLOCCO_EN: InvitoBlocco = { lang: "en", nome: "Family Mesh", testo: INVITO_COPY_EN };

/** I blocchi da mostrare per una lingua della rotta, nell'ordine di lettura. */
export function invitoBlocchi(locale: string): InvitoBlocco[] {
  if (locale === "it") return [BLOCCO_IT];
  if (locale === "en") return [BLOCCO_EN];
  return [BLOCCO_IT, BLOCCO_EN];
}

/** Titolo e descrizione dei metadati: neutri, senza codice, senza presentare la Mesh come disponibile. */
export function invitoMetadati(locale: string): { title: string; description: string } {
  const blocchi = invitoBlocchi(locale);
  return {
    title: `${blocchi.map((b) => b.nome).join(" / ")} | FitMesh Sync`,
    description: blocchi.map((b) => b.testo).join(" "),
  };
}
