'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

/**
 * Tasto indietro dopo il logout: la bfcache rimette in vita la pagina com'era, dati compresi, senza
 * chiedere niente al server. Quando succede (`pageshow` con `persisted`), il contenuto se ne va
 * SUBITO (segnaposto vuoto, reso in modo sincrono) e la pagina si ricarica: sessione e verdetto
 * tornano a deciderli il server. Un `pageshow` normale non fa niente.
 */
export function BackForwardGuard({ children }: { children: ReactNode }) {
  const [nascosto, setNascosto] = useState(false);
  const ricaricata = useRef(false);

  useEffect(() => {
    const suPageshow = (e: PageTransitionEvent) => {
      if (!e.persisted || ricaricata.current) return;
      ricaricata.current = true;
      flushSync(() => setNascosto(true));
      window.location.reload();
    };
    window.addEventListener('pageshow', suPageshow);
    return () => window.removeEventListener('pageshow', suPageshow);
  }, []);

  if (nascosto) return <div data-bfcache="nascosto" aria-busy="true" className="min-h-screen" />;
  return <>{children}</>;
}
