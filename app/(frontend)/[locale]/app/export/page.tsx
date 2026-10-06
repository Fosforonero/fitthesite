import Link from 'next/link';

import { locales, type Locale } from '@/lib/i18n';

import { ExportDataClient } from './ExportDataClient';
import { EXPORT_COPY } from './copy';

export const dynamic = 'force-dynamic';


export default async function ExportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Un codice che non e' una delle 15 lingue servite non dovrebbe arrivare qui (lo risolve il middleware):
  // se arriva si usa la lingua di default DICHIARANDOLO. Le 15 lingue servite hanno TUTTE il proprio testo
  // (EXPORT_COPY e' un Record<Locale, ...>: un buco e' un errore di compilazione, non un ripiego silenzioso).
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : 'it';
  const t = EXPORT_COPY[lc];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/${lc}/app/settings`} className="text-sm text-text-muted hover:text-text-primary">
        {t.back}
      </Link>
      <div className="mt-4">
        <ExportDataClient locale={lc} t={t} />
      </div>
    </div>
  );
}
