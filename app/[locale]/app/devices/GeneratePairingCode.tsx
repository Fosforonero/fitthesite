'use client';

/**
 * Client Component per generare un codice 6 cifre di pairing app.
 *
 * Flow utente:
 *   1. Tap "Genera codice" → POST /api/v1/auth/devices/codes (cookie auth)
 *   2. Mostra il codice grande + countdown 5 min
 *   3. Quando scade, mostra "Codice scaduto" + bottone "Genera nuovo"
 *   4. L'utente apre l'app FitMesh Sync, fa login, inserisce il codice
 *
 * Niente "copia negli appunti" perché un codice 6 cifre si digita più
 * velocemente che fare copy-paste tra browser e telefono.
 */
import { useState, useEffect, useTransition } from 'react';

type Phase = 'idle' | 'generating' | 'shown' | 'expired' | 'error';

type Props = {
  translations: {
    title: string;
    body: string;
    cta_generate: string;
    cta_regenerate: string;
    code_shown_help: string;
    expires_in: string; // es. "Scade in {seconds}s"
    expired: string;
    error: string;
  };
};

export function GeneratePairingCode({ translations }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Tick countdown ogni 1s
  useEffect(() => {
    if (phase !== 'shown' || !expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setPhase('expired');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, expiresAt]);

  const generate = () => {
    setErrorMsg(null);
    startTransition(async () => {
      setPhase('generating');
      try {
        const res = await fetch('/api/v1/auth/devices/codes', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setErrorMsg(body.error ?? `HTTP ${res.status}`);
          setPhase('error');
          return;
        }
        const data = (await res.json()) as { code: string; expiresAt: string };
        setCode(data.code);
        setExpiresAt(new Date(data.expiresAt).getTime());
        setPhase('shown');
      } catch (e) {
        setErrorMsg((e as Error).message);
        setPhase('error');
      }
    });
  };

  if (phase === 'shown' && code) {
    return (
      <div className="mt-4 rounded-card border border-brand-aqua/30 bg-brand-aqua/5 p-6 text-center">
        <p className="text-xs uppercase tracking-wider text-brand-aqua font-semibold">
          {translations.code_shown_help}
        </p>
        <div
          className="mt-3 font-mono text-display-lg font-bold text-text-primary tracking-[0.4em] select-all"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {code}
        </div>
        <p className="mt-3 text-sm text-text-muted">
          {translations.expires_in.replace('{seconds}', secondsLeft.toString())}
        </p>
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div className="mt-4">
        <p className="text-sm text-warning mb-3">{translations.expired}</p>
        <button
          type="button"
          onClick={generate}
          disabled={isPending}
          className="px-5 py-2.5 rounded-pill btn-cta text-sm font-semibold"
        >
          {translations.cta_regenerate}
        </button>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="mt-4">
        <p className="text-sm text-error mb-3">
          {translations.error}: {errorMsg}
        </p>
        <button
          type="button"
          onClick={generate}
          disabled={isPending}
          className="px-5 py-2.5 rounded-pill btn-cta text-sm font-semibold"
        >
          {translations.cta_regenerate}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={isPending}
      className="mt-4 px-5 py-2.5 rounded-pill btn-cta text-sm font-semibold disabled:opacity-50"
    >
      {isPending ? '…' : translations.cta_generate}
    </button>
  );
}
