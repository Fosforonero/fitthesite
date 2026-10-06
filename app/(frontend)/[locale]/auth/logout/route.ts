import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { locales, UNTRANSLATED_CONTENT_LOCALES } from '@/lib/i18n';

const LOCALES = locales.filter((l) => !UNTRANSLATED_CONTENT_LOCALES.has(l));

function safeLocale(l: string | undefined): string {
  return l && (LOCALES as readonly string[]).includes(l) ? l : 'it';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  const locale = safeLocale(rawLocale);

  const supabase = await createClient();
  await supabase.auth.signOut();

  // 303 See Other: dopo il POST il browser deve passare a GET sulla home. Con il 307 predefinito
  // rimanderebbe il POST (e il suo corpo) alla home.
  return NextResponse.redirect(new URL(`/${locale}`, request.url), 303);
}

// Anche GET per supportare logout via link semplice (non strict-REST ma pragmatico)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ locale: string }> },
) {
  return POST(request, context);
}
