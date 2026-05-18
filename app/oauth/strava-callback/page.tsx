'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * OAuth callback per Strava. Strava manda l'utente qui dopo l'autorizzazione
 * con `?code=...&state=...` o `?error=...`.
 *
 * Flow normale (Android con app installata):
 *   App Links verifica assetlinks.json → intercetta direttamente, l'utente
 *   NON vede questa pagina, torna nell'app FitMesh Sync che processa il code.
 *
 * Fallback (browser desktop, iOS, Android senza app installata o
 * assetlinks verification fallita):
 *   Mostriamo questa pagina + tentativo di deep link custom scheme
 *   `fitmeshsync://strava?code=...` (intent filter Android backup).
 */
export default function StravaCallback() {
  const params = useSearchParams();
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  useEffect(() => {
    if (code && typeof window !== 'undefined') {
      const deepLink = `fitmeshsync://strava?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state ?? '')}`;
      window.location.href = deepLink;
    }
  }, [code, state]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-red-600">
            Connessione Strava fallita
          </h1>
          <p className="mt-4 text-zinc-700">
            Errore restituito da Strava: <code className="bg-red-50 px-2 py-0.5 rounded">{error}</code>
          </p>
          <p className="mt-6 text-sm text-zinc-500">
            Torna nell&apos;app FitMesh Sync e riprova la connessione da
            Impostazioni → Dispositivi connessi.
          </p>
        </div>
      </main>
    );
  }

  if (!code) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Callback OAuth incompleto</h1>
          <p className="mt-4 text-zinc-700">
            Mancano i parametri necessari. Apri FitMesh Sync e riprova la
            connessione Strava.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
      <div className="max-w-md text-center">
        <div className="inline-block w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">
          Apertura FitMesh Sync…
        </h1>
        <p className="mt-4 text-zinc-700">
          Stiamo aprendo la tua app per completare la connessione Strava.
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          Se non si apre automaticamente entro qualche secondo, torna manualmente
          all&apos;app: lo stato connessione si aggiornerà al prossimo avvio.
        </p>
      </div>
    </main>
  );
}
