/**
 * Magic link callback handler.
 *
 * Quando l'utente clicca il link nell'email, Supabase redirecta qui con
 * `?code=...&type=magiclink`. Lo scambiamo con un session token (httpOnly
 * cookie) via `exchangeCodeForSession`.
 *
 * Pattern PKCE: il code è single-use, il challenge è gestito da Supabase SDK.
 */
import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { locales, UNTRANSLATED_CONTENT_LOCALES } from '@/lib/i18n';

// L'app Flutter mappa già sv/da/no/fi -> en prima di costruire il link
// (locale senza contenuto tradotto), quindi qui accettiamo lo stesso set
// "completo" di 11 locali usato altrove nel sito (vedi lib/i18n.ts).
const LOCALES = locales.filter((l) => !UNTRANSLATED_CONTENT_LOCALES.has(l));

function safeLocale(l: string | undefined): string {
  return l && (LOCALES as readonly string[]).includes(l) ? l : 'it';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  const locale = safeLocale(rawLocale);

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? `/${locale}/app`;
  const errorParam = url.searchParams.get('error_description');

  if (errorParam) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set('error', errorParam);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set('error', error.message);
    return NextResponse.redirect(loginUrl);
  }

  // Verifica che `next` sia un path interno (no open redirect)
  const safeNext = next.startsWith('/') ? next : `/${locale}/app`;
  return NextResponse.redirect(new URL(safeNext, request.url));
}
