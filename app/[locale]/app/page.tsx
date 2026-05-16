import { createClient } from '@/lib/supabase/server';
import { getDictionary, locales, type Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function AppHome({
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Già garantito dal layout, ma type-safety
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
        {t.app?.dashboard?.welcome ?? 'Benvenuto'} 👋
      </h1>
      <p className="mt-2 text-text-secondary">{user.email}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard
          title={t.app?.dashboard?.steps ?? 'Passi oggi'}
          value="—"
          hint={t.app?.dashboard?.no_data ?? 'Nessun dispositivo collegato'}
        />
        <PlaceholderCard
          title={t.app?.dashboard?.heart_rate ?? 'BPM medio'}
          value="—"
          hint={t.app?.dashboard?.no_data ?? 'Nessun dispositivo collegato'}
        />
        <PlaceholderCard
          title={t.app?.dashboard?.sleep ?? 'Sonno'}
          value="—"
          hint={t.app?.dashboard?.no_data ?? 'Nessun dispositivo collegato'}
        />
      </div>

      <section className="mt-12 rounded-card border border-divider bg-bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          {t.app?.next_step?.title ?? 'Inizia: collega il tuo primo dispositivo'}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {t.app?.next_step?.body ??
            'Vai in "Dispositivi" e genera un codice di pairing. Poi inseriscilo nell\'app FitMesh sul tuo telefono.'}
        </p>
        <a
          href={`/${lc}/app/devices`}
          className="mt-5 inline-flex px-5 py-2.5 rounded-pill bg-brand-gradient text-bg-dark text-sm font-semibold hover:opacity-90 transition"
        >
          {t.app?.next_step?.cta ?? 'Collega dispositivo →'}
        </a>
      </section>
    </div>
  );
}

function PlaceholderCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-card border border-divider bg-bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-text-muted font-medium">
        {title}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold text-text-primary">
        {value}
      </p>
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  );
}
