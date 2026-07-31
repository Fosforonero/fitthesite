"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FOUNDER_END_AT_MS, isFounderProgramOpen } from "@/lib/founder/program-window";

// setTimeout tronca un delay oltre ~24.8 giorni (2^31-1 ms) a 0, cioe' lo
// fa scattare SUBITO invece che alla data richiesta: se questa pagina
// restasse aperta per settimane prima del cutoff, un singolo setTimeout
// scatterebbe erroneamente in anticipo. Charchiamo invece un timer alla
// volta, mai piu' di MAX_SAFE_DELAY_MS, e ad ogni scatto ricalcoliamo il
// resto: resta comunque UN SOLO timer attivo per volta (mai un intervallo
// fisso), quindi non e' polling.
const MAX_SAFE_DELAY_MS = 2_147_000_000; // poco sotto 2^31-1, margine di sicurezza

/**
 * Sprint P0.10K (2026-07-31): NESSUN consumer pubblico da questo sprint in
 * poi — homepage/header/footer/menu mostrano ora sempre e solo il ramo
 * evergreen, hardcoded, senza gate (chiusura commerciale del sito
 * anticipata rispetto al cutoff backend). Questo componente resta nel repo
 * — coperto da FounderClientGate.test.tsx, referenziato dall'allowlist di
 * check-founder-static-invariant.ts/check-founder-window.ts/
 * check-vercel-fluid-cpu.ts — invece di essere cancellato: e' un
 * meccanismo generico (toggle client-side basato sull'orologio con
 * auto-transizione via singolo setTimeout), non logica di business, e la
 * sua rimozione forzerebbe una riscrittura non necessaria di quei
 * guardrail. Non ha piu' alcun punto di rendering pubblico.
 *
 * Sprint P0.10: homepage e /beta restano completamente STATICHE — nessuna
 * decisione temporale lato server, nessuna query Supabase/API/funzione
 * Vercel coinvolta. Questo componente decide quale variante mostrare
 * interamente lato client, dopo l'hydration, leggendo solo l'orologio del
 * browser (isFounderProgramOpen usa `new Date()` — zero richieste di rete).
 *
 * `evergreen` e' sia il fallback SSR (mostrato nell'HTML statico prima
 * dell'hydration, quindi anche a crawler che non eseguono JS) sia quello
 * mostrato dopo il cutoff. `founder` appare SOLO dopo l'hydration, e solo
 * se il programma e' ancora aperto — mai nell'HTML iniziale.
 *
 * Auto-transizione: se questa pagina resta aperta a cavallo del cutoff,
 * deve passare da sola a evergreen, senza reload e senza polling — un solo
 * setTimeout schedulato esattamente su FOUNDER_END_AT_MS (mai un
 * setInterval che ricontrolla a intervalli fissi).
 *
 * `minHeightClassName` riserva lo spazio per evitare layout shift quando si
 * passa da `evergreen` a `founder` dopo l'hydration (le due varianti
 * possono avere altezze leggermente diverse).
 *
 * `as` sceglie l'elemento contenitore: "div" (default) per blocchi, "span"
 * quando il gate vive dentro un `<p>` (un `<div>` dentro un `<p>` e' HTML
 * non valido e React lo segnala).
 */
export function FounderClientGate({
  founder,
  evergreen,
  minHeightClassName,
  as = "div",
}: {
  founder: ReactNode;
  evergreen: ReactNode;
  minHeightClassName?: string;
  as?: "div" | "span";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isFounderProgramOpen());

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function scheduleCheck() {
      const remaining = FOUNDER_END_AT_MS - Date.now();
      if (remaining <= 0) {
        setOpen(false);
        return;
      }
      const delay = Math.min(remaining, MAX_SAFE_DELAY_MS);
      timeoutId = setTimeout(() => {
        setOpen(isFounderProgramOpen());
        scheduleCheck();
      }, delay);
    }

    scheduleCheck();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const Tag = as;
  return <Tag className={minHeightClassName}>{open ? founder : evergreen}</Tag>;
}
