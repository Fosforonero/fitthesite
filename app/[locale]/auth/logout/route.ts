import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const LOCALES = ['it', 'en'] as const;

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

  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}

// Anche GET per supportare logout via link semplice (non strict-REST ma pragmatico)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ locale: string }> },
) {
  return POST(request, context);
}
