import { redirect } from 'next/navigation';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import { getDictionary, locales, type Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${lc}/auth/login?next=/${lc}/admin`);
  }

  // Check ruolo admin via RPC RLS-safe
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) {
    redirect(`/${lc}/app`);
  }

  const t = await getDictionary(lc);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-error/10 border-b border-error/30 text-center py-1.5 text-xs text-error font-semibold tracking-wider">
        {t.admin?.banner ?? 'ADMIN MODE — i tuoi accessi sono tracciati'}
      </div>

      <header className="border-b border-divider bg-bg-secondary/40 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href={`/${lc}/admin`} className="font-display font-semibold text-text-primary">
            FitMesh <span className="text-error text-xs ml-1">ADMIN</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href={`/${lc}/admin`} className="px-3 py-2 rounded-pill hover:bg-white/5 text-text-primary">
              {t.admin?.nav?.overview ?? 'Overview'}
            </Link>
            <Link href={`/${lc}/admin/users`} className="px-3 py-2 rounded-pill hover:bg-white/5 text-text-secondary">
              {t.admin?.nav?.users ?? 'Utenti'}
            </Link>
            <Link href={`/${lc}/admin/devices`} className="px-3 py-2 rounded-pill hover:bg-white/5 text-text-secondary">
              {t.admin?.nav?.devices ?? 'Dispositivi'}
            </Link>
            <Link href={`/${lc}/admin/events`} className="px-3 py-2 rounded-pill hover:bg-white/5 text-text-secondary">
              {t.admin?.nav?.events ?? 'Eventi'}
            </Link>
            <Link href={`/${lc}/admin/beta`} className="px-3 py-2 rounded-pill hover:bg-white/5 text-text-secondary">
              Beta
            </Link>
            <Link href={`/${lc}/app`} className="px-3 py-2 rounded-pill hover:bg-white/5 text-text-muted">
              {t.admin?.nav?.exit ?? 'Esci da admin'}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
