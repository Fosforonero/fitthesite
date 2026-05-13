import { createClient } from '@/lib/supabase/server';
import { getDictionary, locales, type Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

type DeviceListItem = {
  id: string;
  device_name: string | null;
  device_brand: string | null;
  source_type: string;
  app_version: string | null;
  os_version: string | null;
  paired_at: string;
  last_seen_at: string | null;
  revoked_at: string | null;
};

export default async function DevicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : 'it';
  const t = await getDictionary(lc);

  const supabase = await createClient();
  // RLS: torna solo i device dell'utente loggato
  const { data: rawDevices, error } = await supabase
    .from('devices')
    .select(
      'id, device_name, device_brand, source_type, app_version, os_version, paired_at, last_seen_at, revoked_at',
    )
    .order('paired_at', { ascending: false });

  const devices = rawDevices as DeviceListItem[] | null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
          {t.app?.devices?.heading ?? 'I tuoi dispositivi'}
        </h1>
        <p className="mt-2 text-text-secondary">
          {t.app?.devices?.subheading ??
            'Smartwatch e telefoni collegati al tuo account.'}
        </p>
      </header>

      <div className="rounded-card border border-divider bg-bg-card p-6 mb-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {t.app?.devices?.add_title ?? 'Aggiungi dispositivo'}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {t.app?.devices?.add_body ??
            'Genera un codice e inseriscilo nell\'app FitMesh Sync per collegare un nuovo telefono.'}
        </p>
        <button
          type="button"
          disabled
          className="mt-4 px-5 py-2.5 rounded-pill border border-divider text-text-muted text-sm cursor-not-allowed"
        >
          {t.app?.devices?.add_cta ?? 'Genera codice'}
          <span className="ml-2 text-xs text-text-muted">
            {t.app?.devices?.coming_soon ?? '(in arrivo)'}
          </span>
        </button>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
          {t.app?.devices?.list_title ?? 'Dispositivi collegati'}
        </h2>

        {error && (
          <div className="rounded-card border border-error/30 bg-error/5 p-4 text-sm text-error">
            {t.app?.devices?.error ?? 'Errore caricamento dispositivi.'} {error.message}
          </div>
        )}

        {!error && (!devices || devices.length === 0) && (
          <div className="rounded-card border border-divider bg-bg-card p-8 text-center">
            <p className="text-text-secondary">
              {t.app?.devices?.empty ?? 'Nessun dispositivo collegato ancora.'}
            </p>
          </div>
        )}

        {devices && devices.length > 0 && (
          <ul className="space-y-3">
            {devices.map((d) => (
              <li
                key={d.id}
                className="rounded-card border border-divider bg-bg-card p-5 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-text-primary">
                    {d.device_name ?? d.device_brand ?? 'Dispositivo'}{' '}
                    {d.revoked_at && (
                      <span className="ml-2 text-xs text-error font-normal">
                        {t.app?.devices?.revoked ?? 'revocato'}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {d.source_type} · {d.app_version ?? '—'} · {d.os_version ?? '—'}
                  </p>
                  <p className="text-xs text-text-muted">
                    {t.app?.devices?.last_sync ?? 'Ultimo sync'}:{' '}
                    {d.last_seen_at
                      ? new Date(d.last_seen_at).toLocaleString(lc)
                      : (t.app?.devices?.never ?? 'mai')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
