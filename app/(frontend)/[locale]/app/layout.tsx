import { redirect } from 'next/navigation';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import { getDictionary, locales, type Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : 'it';

  // Gate: solo loggati possono vedere /app/*
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lc}/auth/login?next=/${lc}/app`);
  }

  const t = await getDictionary(lc);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-divider bg-bg-secondary/40 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href={`/${lc}/app`} className="font-display font-semibold text-text-primary">
            FitMesh
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href={`/${lc}/app`}
              className="px-3 py-2 rounded-pill hover:bg-white/5 text-text-primary"
            >
              {t.app?.nav?.dashboard ?? 'Dashboard'}
            </Link>
            <Link
              href={`/${lc}/app/devices`}
              className="px-3 py-2 rounded-pill hover:bg-white/5 text-text-secondary"
            >
              {t.app?.nav?.devices ?? 'Dispositivi'}
            </Link>
            <Link
              href={`/${lc}/app/settings`}
              className="px-3 py-2 rounded-pill hover:bg-white/5 text-text-secondary"
            >
              {t.app?.nav?.settings ?? 'Impostazioni'}
            </Link>
            <form action={`/${lc}/auth/logout`} method="post">
              <button
                type="submit"
                className="px-3 py-2 rounded-pill hover:bg-white/5 text-text-muted"
              >
                {t.app?.nav?.logout ?? 'Esci'}
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-divider mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-xs text-text-muted">
          {t.app?.disclaimer ??
            'I dati mostrati sono solo informativi. FitMesh non è un dispositivo medico e non sostituisce il parere medico professionale.'}
        </div>
      </footer>
    </div>
  );
}
