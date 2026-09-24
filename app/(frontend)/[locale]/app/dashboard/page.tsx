import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { dashboardWebAttiva } from '@/lib/dashboard/interruttore';
import { leggiMetricheDelTitolare, type ClientLetture } from '@/lib/dashboard/letture-titolare';
import { testiPer, type TestiDashboard } from '@/lib/dashboard/testi';
import { leggiVerdettoDashboard, type ClientVerdetto } from '@/lib/dashboard/verdetto';
import { createClient } from '@/lib/supabase/server';

// Dati di un utente: mai prerenderizzata, mai in cache, mai fetch conservate.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const GIORNI_RIEPILOGO = 30;

// `local_day_key` e' il giorno del telefono, qui la finestra e' in UTC: per chi
// e' avanti su UTC, nelle ore fra la sua mezzanotte e quella UTC, il giorno
// corrente resta fuori dal conteggio. E' un riepilogo, non un dato del giorno.
function giornoLocale(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function DashboardWebPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!dashboardWebAttiva()) notFound();
  const { locale } = await params;
  const t = testiPer(locale);
  if (!t) notFound();

  const percorso = `/${locale}/app/dashboard`;
  const login = `/${locale}/auth/login?next=${percorso}`;

  const supabase = await createClient({ senzaCache: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(login);

  // Il verdetto e' della sessione: il server usa auth.uid(), `user.id` serve
  // solo alle letture. Si chiede a ogni richiesta, anche nella navigazione
  // interna: il layout non viene rieseguito e non puo' portarlo lui.
  const verdetto = await leggiVerdettoDashboard(supabase as unknown as ClientVerdetto, user.id);
  if (verdetto.esito === 'non_autenticato') redirect(login);
  if (verdetto.esito === 'non_disponibile') return <NonDisponibile t={t} percorso={percorso} />;
  if (verdetto.esito === 'negato') {
    return <Negato t={t} testoMotivo={t.motivi[verdetto.motivo]} email={user.email ?? ''} />;
  }

  const oggi = new Date();
  const inizio = new Date(oggi.getTime() - (GIORNI_RIEPILOGO - 1) * 86_400_000);
  let giorni: number;
  let completo: boolean;
  try {
    const lettura = await leggiMetricheDelTitolare(
      supabase as unknown as ClientLetture,
      verdetto,
      { daGiorno: giornoLocale(inizio), aGiorno: giornoLocale(oggi) },
    );
    giorni = new Set(lettura.righe.map((r) => r.local_day_key)).size;
    completo = lettura.completo;
  } catch {
    // Una lettura non riuscita non e' un diniego: l'accesso c'e', i dati no.
    return <NonDisponibile t={t} percorso={percorso} />;
  }

  return (
    <Cornice t={t}>
      <p className="mt-2 text-text-secondary">{t.concessoPer(user.email ?? '')}</p>
      <p className="mt-6 text-text-primary">{t.giorniConDati(giorni)}</p>
      {!completo && <p className="mt-2 text-sm text-text-muted">{t.conteggioParziale}</p>}
    </Cornice>
  );
}

function Cornice({ t, children }: { t: TestiDashboard; children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
        {t.titolo}
      </h1>
      {children}
    </div>
  );
}

function Negato({ t, testoMotivo, email }: { t: TestiDashboard; testoMotivo: string | null; email: string }) {
  return (
    <Cornice t={t}>
      <div data-esito="negato" className="mt-6 rounded-card border border-divider bg-bg-card p-6 sm:p-8">
        <p className="text-text-primary">{t.richiesta}</p>
        {testoMotivo && <p className="mt-3 text-text-secondary">{testoMotivo}</p>}
        <p className="mt-3 text-text-secondary">{t.sessione(email)}</p>
        <p className="mt-3 text-sm text-text-muted">{t.acquisti}</p>
      </div>
    </Cornice>
  );
}

function NonDisponibile({ t, percorso }: { t: TestiDashboard; percorso: string }) {
  return (
    <Cornice t={t}>
      <div data-esito="non_disponibile" className="mt-6 rounded-card border border-divider bg-bg-card p-6 sm:p-8">
        <p className="text-text-primary">{t.nonDisponibile}</p>
        {/* Un link, non un pulsante di stato: ricarica la pagina intera e
            richiede un verdetto nuovo al server. */}
        <a
          href={percorso}
          className="mt-5 inline-flex px-5 py-2.5 rounded-pill bg-brand-gradient text-bg-dark text-sm font-semibold hover:opacity-90 transition"
        >
          {t.riprova}
        </a>
      </div>
    </Cornice>
  );
}
