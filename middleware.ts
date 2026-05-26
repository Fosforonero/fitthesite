/**
 * Next.js middleware — auth session refresh + route protection.
 *
 * Eseguito su OGNI request (vedi `config.matcher` in fondo). Due compiti:
 *
 *  1. Refresh dei cookie di sessione Supabase per mantenere il JWT valido
 *     (l'SDK aggiorna il refresh token in modo trasparente)
 *  2. Redirect `/[locale]/app/*` e `/[locale]/admin/*` a `/auth/login` se
 *     non loggato. La verifica `is_admin` per `/admin/*` viene fatta in
 *     `app/[locale]/admin/layout.tsx` server-side (qui non possiamo chiamare
 *     RPC perché siamo in Edge runtime ristretto).
 *
 * Best practice 2026: usare `getUser()` invece di `getSession()` per il check
 * (verifica il JWT contro Supabase Auth, vs leggere solo il cookie locale).
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import {
  buildRateLimitResponse,
  limitSignup,
  limitSync,
} from '@/lib/rate-limit/limiter';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PROTECTED_PREFIXES = ['/app', '/admin'] as const;

const LOCALES = ['it', 'en'] as const;

function stripLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length) || '/';
    }
  }
  return pathname;
}

function isProtected(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return PROTECTED_PREFIXES.some(
    (prefix) => stripped === prefix || stripped.startsWith(`${prefix}/`),
  );
}

function detectLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return 'it';
}

// Path prefixes che NON richiedono il locale prefix (route top-level non-i18n).
const NON_LOCALIZED_PREFIXES = ['/api', '/oauth', '/mockups', '/_next', '/.well-known'] as const;

function needsLocalePrefix(pathname: string): boolean {
  // Root path '/' lo lasciamo intoccato (la page.tsx top-level fa il redirect).
  if (pathname === '/') return false;
  // Skip route non localizzate.
  if (NON_LOCALIZED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  // Skip asset statici (anche se il matcher dovrebbe gia' escluderli).
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$/i.test(pathname)) return false;
  // Gia' ha un locale prefix.
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return false;
  return true;
}

function bestLocaleFromAcceptLanguage(header: string | null): string {
  if (!header) return 'it';
  const lower = header.toLowerCase();
  // Prima preferenza vince. Default 'it' (mercato primario).
  if (lower.startsWith('it') || lower.includes(',it')) return 'it';
  if (lower.startsWith('en') || lower.includes(',en')) return 'en';
  return 'it';
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Rate limit FIRST (P0-001 cybersec): blocca abuse-via-curl prima di
  // sprecare round-trip Supabase auth refresh. Fail-open su errore Supabase.
  // Solo route ad alto rischio. Resto del traffico passa through.
  if (pathname === '/api/v1/sync') {
    const result = await limitSync(request);
    if (!result.allowed) {
      return buildRateLimitResponse(result);
    }
  } else if (pathname === '/api/v1/beta/signup') {
    const result = await limitSignup(request);
    if (!result.allowed) {
      return buildRateLimitResponse(result);
    }
  }

  // Redirect deeplink senza locale (es. share URL "/famiglia/join/CODE") al
  // path localizzato corretto. Risolve il 404 quando l'app condivide URL
  // senza prefix locale. Fa il redirect PRIMA del refresh sessione per
  // evitare di sprecare round-trip Supabase su una request che cambia URL.
  if (needsLocalePrefix(pathname)) {
    const locale = bestLocaleFromAcceptLanguage(request.headers.get('accept-language'));
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Inject locale into a custom request header so the root layout can set
  // <html lang> correctly without duplicating the detection logic.
  // We clone the existing headers and add our custom one, then pass to
  // NextResponse.next so Server Components can read it via headers().
  const detectedLocale = detectLocale(pathname);
  void search; // already preserved by NextResponse.next
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-fitmesh-locale', detectedLocale);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Verifica autenticazione contro Supabase Auth (non solo cookie locale).
  // Best practice: `getUser` revalidata il JWT, `getSession` solo legge cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected(pathname) && !user) {
    const locale = detectLocale(pathname);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Match tutte le route eccetto asset statici, _next, e file pubblici.
  matcher: [
    // Esclude: asset statici, /mockups (route interna per screenshot generator),
    // /.well-known/* (asset links Android, OpenID discovery, ecc — devono essere
    // serviti senza cookie refresh Supabase), /oauth/* (callback redirect dei
    // provider OAuth, devono essere puliti e veloci).
    '/((?!_next/static|_next/image|favicon.ico|logo-.*|mockups|\\.well-known|oauth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
