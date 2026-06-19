import { createClient } from '@/lib/supabase/server';
import { getDictionary, locales, type Locale } from '@/lib/i18n';

import { DeleteAccountSection } from './DeleteAccountSection';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
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
  if (!user) return null;

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('display_name, locale, time_zone, created_at')
    .eq('id', user.id)
    .maybeSingle();

  type ProfileSummary = {
    display_name: string | null;
    locale: string;
    time_zone: string;
    created_at: string;
  };
  const profile = rawProfile as ProfileSummary | null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-10">
        <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
          {t.app?.settings?.heading ?? 'Impostazioni'}
        </h1>
        <p className="mt-2 text-text-secondary">{user.email}</p>
      </header>

      <section className="rounded-card border border-divider bg-bg-card p-6 mb-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {t.app?.settings?.profile_heading ?? 'Profilo'}
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">{t.app?.settings?.display_name ?? 'Nome'}</dt>
            <dd className="text-text-primary">{profile?.display_name ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Email</dt>
            <dd className="text-text-primary">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">{t.app?.settings?.locale ?? 'Lingua'}</dt>
            <dd className="text-text-primary">{profile?.locale ?? lc}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">{t.app?.settings?.timezone ?? 'Fuso orario'}</dt>
            <dd className="text-text-primary">{profile?.time_zone ?? 'Europe/Rome'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">{t.app?.settings?.member_since ?? 'Membro dal'}</dt>
            <dd className="text-text-primary">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString(lc)
                : '—'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-card border border-divider bg-bg-card p-6 mb-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {t.app?.settings?.privacy_heading ?? 'Privacy & dati'}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {t.app?.settings?.privacy_body ??
            'I tuoi dati di salute non vengono mai condivisi, non sono trattati a scopi medici, non vengono usati per produrre pareri medici. Tutto solo per la tua dashboard personale e gamification.'}
        </p>
        <div className="mt-4 flex gap-3 text-sm">
          <a
            href={`/${lc}/app/export`}
            className="px-4 py-2 rounded-pill border border-divider text-text-primary hover:bg-white/5 transition"
          >
            {t.app?.settings?.export ?? 'Esporta i miei dati'}
          </a>
        </div>
      </section>

      {/* Zona pericolo: delete account */}
      <DeleteAccountSection
        locale={lc}
        translations={{
          heading: t.app?.settings?.danger_heading ?? 'Zona pericolo',
          description:
            t.app?.settings?.delete_description ??
            'Elimina permanentemente il tuo account e tutti i dati associati. Hai 24h per annullare via email.',
          deleteCta: t.app?.settings?.delete_cta ?? 'Cancella il mio account',
          confirmTitle:
            t.app?.settings?.delete_confirm_title ?? 'Sei davvero sicuro?',
          confirmBody:
            t.app?.settings?.delete_confirm_body ??
            'Verranno eliminati permanentemente: profilo, tutti i dati di salute, dispositivi collegati, sessioni di allenamento. Verranno conservati anonimizzati per compliance: log tecnici (90gg) e audit admin (5 anni).',
          confirmInputLabel:
            t.app?.settings?.delete_confirm_input ??
            'Per confermare, digita "CANCELLA"',
          confirmKeyword: ({ it: 'CANCELLA', en: 'DELETE', es: 'ELIMINAR', de: 'LÖSCHEN', pt: 'EXCLUIR', fr: 'SUPPRIMER', pl: 'USUŃ', tr: 'SİL', nl: 'VERWIJDEREN', ja: '削除', ko: '삭제' } as Record<string, string>)[lc] ?? 'DELETE',
          confirmSubmit: t.app?.settings?.delete_confirm_submit ?? 'Conferma cancellazione',
          cancelLabel: t.app?.settings?.cancel ?? 'Annulla',
          scheduledTitle:
            t.app?.settings?.delete_scheduled_title ?? 'Richiesta ricevuta',
          scheduledBody:
            t.app?.settings?.delete_scheduled_body ??
            'Riceverai un\'email con il link per annullare. Se non fai nulla entro 24h, il tuo account verrà eliminato permanentemente.',
        }}
      />
    </div>
  );
}
