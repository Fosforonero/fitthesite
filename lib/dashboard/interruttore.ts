/**
 * La pagina /[locale]/app/dashboard esiste solo con FITMESH_WEB_DASHBOARD=1.
 *
 * Spenta per impostazione: la dashboard web personale non e' disponibile al
 * pubblico (P0.24-C), e il sito lo dice. L'interruttore serve a provarla su una
 * preview; accenderlo in produzione e' una decisione di lancio di Matteo, con
 * le traduzioni e la migration 20260924120000 applicata.
 *
 * Letto a ogni richiesta, mai a build time: la pagina e' dinamica.
 */
export function dashboardWebAttiva(): boolean {
  return process.env.FITMESH_WEB_DASHBOARD === '1';
}
