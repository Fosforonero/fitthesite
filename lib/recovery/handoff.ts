/**
 * Hotfix P0.10R — chiave del passaggio email fra forgot-password e
 * reset-password.
 *
 * Vive in un modulo suo perche' e' condivisa da due Client Component in
 * route diverse: duplicare la stringa a mano significherebbe che un refuso
 * rompe il precompilamento in silenzio, senza che nessun test se ne accorga.
 *
 * `sessionStorage` (non `localStorage`): l'indirizzo serve solo per il
 * passaggio fra due schermate dello stesso tab e non deve sopravvivere alla
 * chiusura del browser su un dispositivo condiviso.
 */
export const RECOVERY_EMAIL_HANDOFF_KEY = 'fm.recovery.email';

/** Legge e RIMUOVE l'email memorizzata: uso singolo, mai persistente. */
export function consumeHandoffEmail(): string | null {
  try {
    const value = window.sessionStorage.getItem(RECOVERY_EMAIL_HANDOFF_KEY);
    if (value) window.sessionStorage.removeItem(RECOVERY_EMAIL_HANDOFF_KEY);
    return value;
  } catch {
    // Storage non disponibile (navigazione privata, policy restrittive):
    // il form resta perfettamente utilizzabile a mano.
    return null;
  }
}
