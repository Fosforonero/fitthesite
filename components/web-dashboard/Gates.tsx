import type { ReactNode } from 'react';

import type { DashboardAccess } from '@/lib/web-dashboard/access';
import type { SharedCopy } from '@/lib/web-dashboard/copy';
import type { ScreenKey } from '@/lib/web-dashboard/model';
import type { PreviewParams } from '@/lib/web-dashboard/params';

import { Icon } from './Icon';
import { Card } from './primitives';
import { PreviewBanner, PreviewBar } from './Shell';

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';

function GateFrame({ copy, lc, screen, params, children }: { copy: SharedCopy; lc: string; screen: ScreenKey; params: PreviewParams; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <PreviewBanner copy={copy} />
      {params.chrome ? <PreviewBar copy={copy} lc={lc} screen={screen} params={params} /> : null}
      <main className="mx-auto flex max-w-[1280px] justify-center px-4 py-12 sm:px-6 sm:py-20">{children}</main>
    </div>
  );
}

/** Login: stessa forma del modulo reale (email + verifica + invio link), inerte nell'anteprima. */
export function LoginGate({ copy, lc, screen, params }: { copy: SharedCopy; lc: string; screen: ScreenKey; params: PreviewParams }) {
  const g = copy.gates.login;
  return (
    <GateFrame copy={copy} lc={lc} screen={screen} params={params}>
      <div data-gate="login" className="w-full max-w-md">
        <div className="text-center">
          <p className="font-display text-sm font-semibold text-text-secondary">{copy.brand}</p>
          <h1 className="mt-2 font-display text-display tracking-tightest font-semibold">{g.title}</h1>
          <p className="mt-3 text-text-secondary">{g.body}</p>
        </div>
        <Card as="div" className="mt-8">
          <form action="#" className="space-y-4" aria-describedby="login-note">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-text-secondary">{g.email}</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder={g.emailPlaceholder}
                disabled
                className="mt-1.5 w-full rounded px-4 py-3 bg-bg border border-divider text-text-primary placeholder:text-text-muted disabled:opacity-70"
              />
            </div>
            <div className="flex items-center gap-3 rounded border border-dashed border-divider px-4 py-3 text-xs text-text-muted">
              <Icon name="check" size={16} className="shrink-0" />
              {g.captcha}
            </div>
            <button type="button" disabled className="w-full min-h-[48px] rounded-pill bg-cta-gradient px-5 py-3 text-sm font-semibold text-bg-dark opacity-70">
              {g.submit}
            </button>
            <p id="login-note" className="text-center text-xs text-text-muted">{g.note}</p>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-text-muted">{g.forgot}</p>
      </div>
    </GateFrame>
  );
}

/**
 * Paywall: riguarda SOLO la dashboard. Sotto, le aree che restano sempre
 * raggiungibili (impostazioni, export, cancellazione account) con i loro link
 * veri: non passano dal paywall e non lo vedranno mai.
 */
export function PaywallGate({
  copy,
  lc,
  screen,
  params,
  reason,
}: {
  copy: SharedCopy;
  lc: string;
  screen: ScreenKey;
  params: PreviewParams;
  reason: 'trial' | 'expired' | 'none';
}) {
  const g = copy.gates.paywall;
  const link = `flex items-center gap-3 rounded-[14px] border border-divider px-4 min-h-[48px] text-sm font-medium text-text-primary hover:bg-white/5 ${focusRing}`;
  return (
    <GateFrame copy={copy} lc={lc} screen={screen} params={params}>
      <div data-gate="paywall" data-paywall-reason={reason} className="w-full max-w-xl">
        <Card as="div" className="p-6 sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-aqua/15 text-brand-aqua">
            <Icon name="lock" size={24} />
          </span>
          <h1 className="mt-5 font-display text-display tracking-tightest font-semibold">{g.title[reason]}</h1>
          <p className="mt-3 text-text-secondary">{g.body[reason]}</p>
          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted font-semibold">{g.whoTitle}</p>
            <ul className="mt-3 space-y-2">
              {g.whoItems.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-text-primary">
                  <Icon name="check" size={16} className="text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <section aria-labelledby="always" className="mt-6">
          <h2 id="always" className="text-[11px] uppercase tracking-[0.16em] text-text-muted font-semibold">{g.alwaysTitle}</h2>
          <p className="mt-1 text-sm text-text-secondary">{g.alwaysBody}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <a href={`/${lc}/app/settings`} className={link}><Icon name="settings" /> {g.settings}</a>
            <a href={`/${lc}/app/export`} className={link}><Icon name="download" /> {g.export}</a>
            <a href={`/${lc}/app/settings`} className={link}><Icon name="trash" /> {g.deleteAccount}</a>
          </div>
        </section>
      </div>
    </GateFrame>
  );
}

/** Il controllo di accesso non ha risposto: errore e «riprova», MAI un falso paywall. */
export function VerificationGate({
  copy,
  lc,
  screen,
  params,
  reason,
  retryHref,
}: {
  copy: SharedCopy;
  lc: string;
  screen: ScreenKey;
  params: PreviewParams;
  reason: 'read_failed' | 'unknown_contract_version';
  retryHref: string;
}) {
  const g = copy.gates.verification;
  return (
    <GateFrame copy={copy} lc={lc} screen={screen} params={params}>
      <div data-gate="verification" role="alert" className="w-full max-w-md">
        <Card as="div" className="p-6 text-center sm:p-8">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-error/15 text-error">
            <Icon name="alert" size={24} />
          </span>
          <h1 className="mt-5 font-display text-2xl tracking-tightest font-semibold">{g.title}</h1>
          <p className="mt-3 text-sm text-text-secondary">{g.body[reason]}</p>
          <a href={retryHref} className={`mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-pill border border-divider px-6 text-sm font-semibold hover:bg-white/5 ${focusRing}`}>
            <Icon name="sync" size={16} /> {g.retry}
          </a>
        </Card>
      </div>
    </GateFrame>
  );
}

export type { DashboardAccess };
