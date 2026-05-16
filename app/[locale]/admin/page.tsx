import { createClient } from '@/lib/supabase/server';
import { getDictionary, locales, type Locale } from '@/lib/i18n';

type AdminOverview = {
  total_users: number;
  active_users_7d: number;
  active_users_30d: number;
  new_users_7d: number;
  total_devices: number;
  active_devices: number;
  syncs_24h: number;
  failed_syncs_24h: number;
};

export const dynamic = 'force-dynamic';

export default async function AdminOverview({
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
  // SECURITY DEFINER function con check is_admin() interno.
  // RPC `setof record` ritorna array; prendiamo il primo (la function emette
  // sempre 1 row).
  const { data: rows, error } = await supabase.rpc('admin_overview');
  const overview = (rows as AdminOverview[] | null)?.[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
        {t.admin?.overview?.heading ?? 'Overview'}
      </h1>
      <p className="mt-2 text-text-secondary">
        {t.admin?.overview?.subheading ?? 'Stato del sistema, metriche aggregate, no dati salute personali.'}
      </p>

      {error && (
        <div className="mt-6 rounded-card border border-error/30 bg-error/5 p-4 text-sm text-error">
          {error.message}
        </div>
      )}

      {overview && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t.admin?.overview?.total_users ?? 'Utenti totali'} value={overview.total_users} />
          <StatCard label={t.admin?.overview?.active_7d ?? 'Attivi 7gg'} value={overview.active_users_7d} />
          <StatCard label={t.admin?.overview?.active_30d ?? 'Attivi 30gg'} value={overview.active_users_30d} />
          <StatCard label={t.admin?.overview?.new_7d ?? 'Nuovi 7gg'} value={overview.new_users_7d} />
          <StatCard label={t.admin?.overview?.total_devices ?? 'Device totali'} value={overview.total_devices} />
          <StatCard label={t.admin?.overview?.active_devices ?? 'Device attivi'} value={overview.active_devices} />
          <StatCard label={t.admin?.overview?.syncs_24h ?? 'Sync 24h'} value={overview.syncs_24h} accent="brand-aqua" />
          <StatCard label={t.admin?.overview?.failed_syncs_24h ?? 'Sync falliti 24h'} value={overview.failed_syncs_24h} accent={overview.failed_syncs_24h > 0 ? 'error' : 'text-muted'} />
        </div>
      )}

      <p className="mt-12 text-xs text-text-muted">
        {t.admin?.privacy_notice ??
          'Privacy: questa dashboard mostra solo metadata e metriche aggregate. I dati di salute degli utenti NON sono accessibili a nessun admin (enforced via Postgres RLS).'}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | bigint;
  accent?: string;
}) {
  return (
    <div className="rounded-card border border-divider bg-bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-3xl font-semibold ${
          accent === 'error' ? 'text-error' : accent === 'brand-aqua' ? 'text-brand-aqua' : 'text-text-primary'
        }`}
      >
        {Number(value).toLocaleString()}
      </p>
    </div>
  );
}
