"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FOUNDER_END_AT_MS, isFounderProgramOpen } from "@/lib/founder/program-window";

// Stesso limite di FounderClientGate: setTimeout tronca un delay oltre
// ~24.8 giorni (2^31-1 ms) a 0, quindi charchiamo un timer alla volta.
const MAX_SAFE_DELAY_MS = 2_147_000_000;

type FounderStatus = "pending" | "open" | "closed";

/**
 * Sprint P0.10H — gate a TRE stati, dedicato esclusivamente a /beta.
 *
 * FounderClientGate (homepage/header/footer/menu) usa solo 2 stati
 * (founder/evergreen) perche' il loro `evergreen` e' neutro o assente:
 * corretto sia come fallback SSR sia come stato finale dopo il cutoff. Su
 * /beta l'`evergreen` storico (il vecchio FounderClosedBody-come-default)
 * invece AFFERMA la fine del programma — vero SOLO dopo che il client ha
 * verificato il vero cutoff, mai come fallback SSR prima dell'hydration.
 * Bug corretto in questo sprint (P0.10H): l'HTML grezzo di /beta mostrava
 * "il programma Founder e' concluso" anche quando il programma era ancora
 * aperto (verificato live il 2026-07-29, due giorni prima del cutoff).
 *
 * Servono quindi TRE stati distinti, mai due:
 *  - "pending": fallback SSR, l'UNICO mostrato prima che l'effect giri —
 *    a crawler/unfurler/screen reader senza JS e al primissimo frame di
 *    ogni browser. Deve restare temporalmente neutro: mai "aperto" ne'
 *    "concluso", solo la regola di idoneita' (founderEligibilityStatement).
 *  - "open": dopo hydration, se isFounderProgramOpen() e' vero.
 *  - "closed": dopo hydration, se il cutoff e' passato.
 *
 * Timer duplicato da FounderClientGate (un solo setTimeout ricalcolato ad
 * ogni scatto, mai setInterval) invece di estendere il componente
 * condiviso, per non toccare homepage/header/footer/menu — scope di
 * P0.10H e' esclusivamente /beta.
 */
export function BetaFounderGate({
  pending,
  open,
  closed,
}: {
  pending: ReactNode;
  open: ReactNode;
  closed: ReactNode;
}) {
  const [status, setStatus] = useState<FounderStatus>("pending");

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function scheduleCheck() {
      const remaining = FOUNDER_END_AT_MS - Date.now();
      if (remaining <= 0) {
        setStatus("closed");
        return;
      }
      setStatus("open");
      const delay = Math.min(remaining, MAX_SAFE_DELAY_MS);
      timeoutId = setTimeout(() => {
        setStatus(isFounderProgramOpen() ? "open" : "closed");
        scheduleCheck();
      }, delay);
    }

    scheduleCheck();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (status === "pending") return <>{pending}</>;
  return <>{status === "open" ? open : closed}</>;
}
