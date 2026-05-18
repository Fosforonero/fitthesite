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

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

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

  const { pathname } = request.nextUrl;

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
