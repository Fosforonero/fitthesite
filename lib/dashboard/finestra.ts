/**
 * La finestra dei sette giorni CONCLUSI della dashboard (DASHBOARD-REAL-02, B3a).
 *
 * REGOLA: un giorno D e' concluso in ogni fuso del mondo se D < data di `now` in UTC-12
 * (l'ultimo fuso a cambiare giorno). Quindi
 *
 *   ultimo = data(now - 12 h, letta in UTC) - 1 giorno
 *   primo  = ultimo - 6 giorni
 *
 * `local_day_key` e' il giorno del telefono e resta l'ETICHETTA: nessuna conversione al
 * giorno del browser, nessun parametro ?tz, nessun fuso di ripiego. La finestra dice quali
 * date sono state consultate, NON in che fuso e' il dispositivo ne' se la rilevazione di
 * quei giorni e' completa. Di conseguenza non va chiamata «fino a ieri»: nelle ore fra la
 * mezzanotte UTC e le 12:00 UTC l'ultimo giorno e' l'altro ieri (UTC).
 *
 * L'orologio e' quello di sistema: nessun parametro `now` (i test usano vi.setSystemTime).
 * Aritmetica solo sul numero di giorni dall'epoca UTC: nessun getter in fuso locale, nessun
 * Intl, quindi nemmeno il cambio dell'ora legale puo' spostare una data.
 *
 * Contenimento nella lettura della pagina (30 giorni: da data UTC di now - 29 giorni a data
 * UTC di now): primo >= data(now) - 8 giorni e ultimo <= data(now) - 1 giorno, sempre dentro.
 *
 * Modulo puro: nessuno stato di modulo, nessun import. Solo lato server.
 */

export const GIORNI_FINESTRA = 7;

export type FinestraGiorni = {
  /** Il giorno piu' vecchio della finestra, AAAA-MM-GG (estremo compreso). */
  readonly primo: string;
  /** Il giorno piu' recente, AAAA-MM-GG, concluso in ogni fuso (estremo compreso). */
  readonly ultimo: string;
  /** Le sette date in ordine crescente, consecutive: sono le DATE EFFETTIVE da mostrare. */
  readonly giorni: readonly string[];
};

const GIORNO_MS = 86_400_000;
const DODICI_ORE_MS = 12 * 3_600_000;
const FORMA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Numero di giorni dall'epoca (UTC) di una data AAAA-MM-GG; null se non e' una data di calendario. */
function giorniDaData(testo: unknown): number | null {
  if (typeof testo !== 'string') return null;
  const m = FORMA.exec(testo);
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (!Number.isFinite(ms)) return null;
  const ricostruita = new Date(ms).toISOString().slice(0, 10);
  // Date.UTC accetta il 30 febbraio e lo sposta: si accetta solo la data che torna uguale.
  return ricostruita === testo ? ms / GIORNO_MS : null;
}

function dataDaGiorni(giorni: number): string {
  return new Date(giorni * GIORNO_MS).toISOString().slice(0, 10);
}

/** Il numero del giorno (dall'epoca UTC) dell'ultimo giorno concluso in ogni fuso, ora. */
function ultimoConclusoOra(): number {
  return Math.floor((Date.now() - DODICI_ORE_MS) / GIORNO_MS) - 1;
}

/** Le sette date concluse, rispetto all'orologio di sistema. */
export function finestraSetteGiorni(): FinestraGiorni {
  const ultimo = ultimoConclusoOra();
  const giorni = Object.freeze(
    Array.from({ length: GIORNI_FINESTRA }, (_, i) => dataDaGiorni(ultimo - (GIORNI_FINESTRA - 1) + i)),
  );
  return Object.freeze({ primo: giorni[0], ultimo: giorni[GIORNI_FINESTRA - 1], giorni });
}

/**
 * La finestra e' ben formata (sette date di calendario consecutive e crescenti, primo e
 * ultimo coerenti) E tutti i suoi giorni sono conclusi adesso. Una finestra calcolata prima
 * resta valida dopo: un giorno concluso non torna aperto.
 */
export function eFinestraConclusaValida(f: unknown): f is FinestraGiorni {
  if (typeof f !== 'object' || f === null || Array.isArray(f)) return false;
  const { primo, ultimo, giorni } = f as { primo?: unknown; ultimo?: unknown; giorni?: unknown };
  if (!Array.isArray(giorni) || giorni.length !== GIORNI_FINESTRA) return false;
  const numeri = giorni.map(giorniDaData);
  if (numeri.some((n) => n === null)) return false;
  for (let i = 1; i < numeri.length; i++) {
    if ((numeri[i] as number) !== (numeri[i - 1] as number) + 1) return false;
  }
  if (primo !== giorni[0] || ultimo !== giorni[GIORNI_FINESTRA - 1]) return false;
  return (numeri[GIORNI_FINESTRA - 1] as number) <= ultimoConclusoOra();
}
