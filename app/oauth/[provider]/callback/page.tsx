'use client';

import { Suspense, use, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Callback OAuth condivisa per i provider che richiedono HTTPS redirect URI
 * (Fitbit, Polar, Withings, e ogni futuro provider che rifiuta scheme custom).
 *
 * Route: `/oauth/<provider>/callback?code=...&state=...`
 *
 * Flow normale (Android con app installata):
 *   App Links verifica assetlinks.json → intercetta direttamente, l'utente
 *   NON vede questa pagina, torna nell'app FitMesh Sync che processa il code
 *   via `ProviderConnectionService._handleDeepLink`.
 *
 * Fallback (browser desktop, iOS, Android senza app o assetlinks fallito):
 *   Mostriamo questa pagina e tentiamo il deep link custom scheme
 *   `fitmeshsync://<provider>?code=...&state=...` (intent filter Android
 *   backup) — funziona se l'app è installata ma App Links non è verificato.
 *
 * Note implementative:
 *   - `useSearchParams()` richiede Suspense boundary in Next.js 15 (streaming SSR).
 *   - I provider whitelisted sono solo quelli registrati lato app, per evitare
 *     che un attaccante usi questa pagina come open redirect arbitrario.
 */

const ALLOWED_PROVIDERS = new Set(['fitbit', 'polar', 'withings', 'oura']);

export default function ProviderCallback({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider } = use(params);
  const providerKey = provider.toLowerCase();

  if (!ALLOWED_PROVIDERS.has(providerKey)) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-red-600">
          Provider non riconosciuto
        </h1>
        <p className="mt-4 text-zinc-700">
          Il provider <code>{provider}</code> non è registrato in FitMesh Sync.
        </p>
      </Shell>
    );
  }

  return (
    <Suspense fallback={<LoadingShell />}>
      <CallbackHandler provider={providerKey} />
    </Suspense>
  );
}

function CallbackHandler({ provider }: { provider: string }) {
  const params = useSearchParams();
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');
  const errorDescription = params.get('error_description');

  useEffect(() => {
    if (code && typeof window !== 'undefined') {
      const deepLink =
        `fitmeshsync://${provider}` +
        `?code=${encodeURIComponent(code)}` +
        `&state=${encodeURIComponent(state ?? '')}`;
      window.location.href = deepLink;
    }
  }, [code, state, provider]);

  if (error) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-red-600">
          Connessione {prettyName(provider)} fallita
        </h1>
        <p className="mt-4 text-zinc-700">
          Errore restituito:{' '}
          <code className="bg-red-50 px-2 py-0.5 rounded">{error}</code>
        </p>
        {errorDescription ? (
          <p className="mt-2 text-sm text-zinc-600">{errorDescription}</p>
        ) : null}
        <p className="mt-6 text-sm text-zinc-500">
          Torna nell&apos;app FitMesh Sync e riprova la connessione da
          Impostazioni → Dispositivi connessi.
        </p>
      </Shell>
    );
  }

  if (!code) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Callback OAuth incompleto</h1>
        <p className="mt-4 text-zinc-700">
          Mancano i parametri necessari. Apri FitMesh Sync e riprova la
          connessione {prettyName(provider)}.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="inline-block w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      <h1 className="mt-6 text-2xl font-semibold text-zinc-900">
        Apertura FitMesh Sync…
      </h1>
      <p className="mt-4 text-zinc-700">
        Stiamo aprendo la tua app per completare la connessione{' '}
        {prettyName(provider)}.
      </p>
      <p className="mt-4 text-sm text-zinc-500">
        Se non si apre automaticamente entro qualche secondo, torna manualmente
        all&apos;app: lo stato della connessione si aggiornerà al prossimo
        avvio.
      </p>
    </Shell>
  );
}

function prettyName(provider: string): string {
  switch (provider) {
    case 'fitbit':
      return 'Fitbit';
    case 'polar':
      return 'Polar';
    case 'withings':
      return 'Withings';
    case 'oura':
      return 'Oura';
    default:
      return provider;
  }
}

function LoadingShell() {
  return (
    <Shell>
      <div className="inline-block w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
      <div className="max-w-md text-center">{children}</div>
    </main>
  );
}
