import Link from 'next/link';

import { locales, type Locale } from '@/lib/i18n';
import { isExportTemporarilyUnavailable } from '@/lib/privacy/export-switch';

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

  // Interruttore d'emergenza (lib/privacy/export-switch.ts): pagina senza il componente, quindi nessuna lettura.
  if (isExportTemporarilyUnavailable()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href={`/${lc}/app/settings`} className="text-sm text-text-muted hover:text-text-primary">
          {t.back}
        </Link>
        <section className="mt-4 rounded-card border border-divider bg-bg-secondary p-6">
          <h2 className="font-display text-lg font-semibold text-text-primary">{t.heading}</h2>
          <div role="status" className="mt-4 rounded-card border border-warning/50 bg-warning/5 p-4">
            <p className="font-semibold text-text-primary text-sm">{t.unavailableTitle}</p>
            <p className="mt-1 text-xs text-text-secondary">{t.unavailableBody}</p>
          </div>
        </section>
      </div>
    );
  }

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
