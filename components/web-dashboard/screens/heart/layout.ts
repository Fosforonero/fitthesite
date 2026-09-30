/**
 * Griglia dei tre valori del giorno, condivisa dalla schermata e dallo
 * scheletro: cosi' il caricamento occupa esattamente le stesse celle.
 *
 * Telefono: due colonne, «riposo» a tutta larghezza e sotto 1 + 1.
 * Da tablet in su: tre schede uguali.
 *
 * Niente Min e Max: i dati reali sono mediane a 5 minuti, quindi il valore piu' basso
 * e il piu' alto della serie non sono la FC minima o massima.
 */
export const STAT_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4';

export const TILE_SPAN = {
  resting: 'col-span-2 sm:col-span-1',
  average: 'col-span-1',
  hrv: 'col-span-1',
} as const;

export const TILE_ORDER = ['resting', 'average', 'hrv'] as const;
export type TileKey = (typeof TILE_ORDER)[number];

/** Vincolo di altezza: le schede della stessa riga si allungano alla piu' alta (una parziale ha piu' righe). */
export const TILE_WRAP = '[&>*]:h-full';
