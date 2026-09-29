/**
 * Griglia dei grafici, condivisa dalla schermata e dallo scheletro:
 * cosi' il caricamento occupa esattamente le stesse celle.
 *
 * Una colonna fino a 1279 px (il grafico a 90 giorni ha bisogno di larghezza:
 * a 90 colonne ogni pixel conta), due colonne quando la colonna dei contenuti
 * accanto alla barra laterale arriva a circa 470 px per scheda.
 *
 * `items-start`: la scheda dei passi ha in piu' il totale del periodo. Con le
 * schede stirate alla piu' alta, le altre avrebbero uno spazio vuoto DENTRO;
 * cosi' ognuna finisce dove finisce il suo contenuto.
 */
export const TRENDS_GRID = 'grid grid-cols-1 items-start gap-6 xl:grid-cols-2';
