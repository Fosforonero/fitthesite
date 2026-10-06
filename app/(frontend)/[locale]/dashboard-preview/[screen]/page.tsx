import { notFound } from 'next/navigation';

import { DashboardShell } from '@/components/web-dashboard/Shell';
import { LoginGate, PaywallGate, VerificationGate } from '@/components/web-dashboard/Gates';
import { StateNotice } from '@/components/web-dashboard/primitives';
import { SCREEN_REGISTRY } from '@/components/web-dashboard/screens/registry';
import { SYNTHETIC_VIEWERS, resolveDashboardAccess } from '@/lib/web-dashboard/access';
import { sharedCopy } from '@/lib/web-dashboard/copy';
import { uiLocale } from '@/lib/web-dashboard/format';
import { isWebDashboardPrototypeEnabled } from '@/lib/web-dashboard/flag';
import { isScreen, parsePreviewParams, previewHref } from '@/lib/web-dashboard/params';
import { buildDashboardResult } from '@/lib/web-dashboard/synthetic';
import { locales } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

type Raw = Record<string, string | string[] | undefined>;

export default async function DashboardPreviewScreen({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; screen: string }>;
  searchParams: Promise<Raw>;
}) {
  // Seconda chiave oltre a quella del layout: la pagina non si rende mai senza il flag.
  if (!isWebDashboardPrototypeEnabled()) notFound();

  const { locale, screen } = await params;
  if (!isScreen(screen)) notFound();
  const lc = (locales as readonly string[]).includes(locale) ? locale : 'it';
  const ui = uiLocale(lc);
  const copy = sharedCopy(ui);
  const p = parsePreviewParams(await searchParams);

  // Login, paywall e dashboard: la decisione e' della funzione pura, l'input e' SINTETICO.
  const access = resolveDashboardAccess(SYNTHETIC_VIEWERS[p.as]);
  if (access.decision === 'login') return <LoginGate copy={copy} lc={lc} screen={screen} params={p} />;
  if (access.decision === 'paywall') return <PaywallGate copy={copy} lc={lc} screen={screen} params={p} reason={access.reason} />;
  if (access.decision === 'verification_required') {
    return <VerificationGate copy={copy} lc={lc} screen={screen} params={p} reason={access.reason} retryHref={previewHref(lc, screen, p)} />;
  }

  const entry = SCREEN_REGISTRY[screen];
  const result = buildDashboardResult(p.state, p.day);
  const href = (s: Parameters<typeof previewHref>[1], o: Parameters<typeof previewHref>[3] = {}) => previewHref(lc, s, p, o);
  const title = copy.nav[screen];

  if (result.status === 'loading') {
    return (
      <DashboardShell copy={copy} lc={lc} ui={ui} screen={screen} params={p} receipt={null} title={title}>
        <div role="status" aria-busy="true" aria-label={copy.states.loading}>
          <entry.Loading lc={lc} ui={ui} />
        </div>
      </DashboardShell>
    );
  }

  if (result.status === 'error') {
    return (
      <DashboardShell copy={copy} lc={lc} ui={ui} screen={screen} params={p} receipt={null} title={title}>
        <StateNotice tone="error" title={copy.states.errorTitle} action={{ href: href(screen), label: copy.states.retry }}>
          {copy.states.errorBody}
        </StateNotice>
      </DashboardShell>
    );
  }

  const { data } = result;
  const notice =
    p.state === 'empty' ? (
      <StateNotice tone="empty" title={copy.states.emptyTitle}>{copy.states.emptyBody}</StateNotice>
    ) : p.state === 'stale' ? (
      <StateNotice tone="stale" title={copy.states.staleTitle}>{copy.states.staleBody}</StateNotice>
    ) : p.state === 'partial' ? (
      <StateNotice tone="partial" title={copy.states.partialTitle}>{copy.states.partialBody}</StateNotice>
    ) : null;

  return (
    <DashboardShell copy={copy} lc={lc} ui={ui} screen={screen} params={p} receipt={data.receipt} title={title}>
      {notice ? <div className="mb-6">{notice}</div> : null}
      <entry.Screen data={data} lc={lc} ui={ui} copy={copy} params={p} href={href} />
    </DashboardShell>
  );
}
