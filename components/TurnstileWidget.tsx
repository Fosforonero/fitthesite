'use client';

/**
 * Cloudflare Turnstile widget — captcha invisible-by-default per protezione
 * abuse signup/login. Required da Supabase Auth dopo abilitazione Bot Protection.
 *
 * Usa explicit render via script CDN Cloudflare (no npm package) per minimizzare
 * bundle size. Il widget rende un iframe verso challenges.cloudflare.com — CSP
 * frame-src deve autorizzarlo.
 *
 * Env var richiesta: NEXT_PUBLIC_TURNSTILE_SITE_KEY (settata su Vercel).
 * Se assente, il componente non renderizza nulla (fallback graceful per dev
 * senza chiave) e l'auth flow andrà in errore captcha lato Supabase.
 */

import { useEffect, useRef } from 'react';

type TurnstileRenderOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  size?: 'normal' | 'flexible' | 'compact';
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: TurnstileRenderOptions) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function ensureScriptLoaded(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SCRIPT_ID)) return;
  const s = document.createElement('script');
  s.id = SCRIPT_ID;
  s.src = SCRIPT_SRC;
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

type Props = {
  onToken: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  locale?: string;
};

export function TurnstileWidget({ onToken, onError, onExpire, locale }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!sitekey || typeof window === 'undefined') return;

    ensureScriptLoaded();

    let cancelled = false;

    const tryRender = (): void => {
      if (cancelled) return;
      if (!window.turnstile || !containerRef.current) {
        setTimeout(tryRender, 100);
        return;
      }
      if (widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        callback: onToken,
        'error-callback': onError,
        'expired-callback': onExpire,
        theme: 'dark',
        language: locale === 'en' ? 'en' : 'it',
        size: 'flexible',
      });
    };

    tryRender();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore — widget potrebbe essere già stato rimosso
        }
        widgetIdRef.current = null;
      }
    };
  }, [sitekey, onToken, onError, onExpire, locale]);

  if (!sitekey) {
    // Dev / preview senza env var: niente widget, niente captcha.
    // L'auth flow andrà in errore lato Supabase → utente vede error.
    return null;
  }

  return <div ref={containerRef} className="my-2" />;
}
