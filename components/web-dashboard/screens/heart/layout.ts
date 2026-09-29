/**
 * Griglia dei cinque valori del giorno, condivisa dalla schermata e dallo
 * scheletro: cosi' il caricamento occupa esattamente le stesse celle.
 *
 * Telefono: due colonne, «riposo» a tutta larghezza e sotto 2 + 2.
 * Tablet: sei colonne, tre schede sopra e due piu' larghe sotto (niente orfana).
 * Desktop: dieci colonne, cinque schede uguali.
 */
export const STAT_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-6 lg:grid-cols-10 lg:gap-4';

export const TILE_SPAN = {
  resting: 'col-span-2',
  average: 'col-span-1 sm:col-span-2',
  min: 'col-span-1 sm:col-span-2',
  max: 'col-span-1 sm:col-span-3 lg:col-span-2',
  hrv: 'col-span-1 sm:col-span-3 lg:col-span-2',
} as const;

export const TILE_ORDER = ['resting', 'average', 'min', 'max', 'hrv'] as const;
export type TileKey = (typeof TILE_ORDER)[number];

/** Vincolo di altezza: le schede della stessa riga si allungano alla piu' alta (una parziale ha piu' righe). */
export const TILE_WRAP = '[&>*]:h-full';
