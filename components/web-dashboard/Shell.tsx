import type { ReactNode } from 'react';

import type { SharedCopy } from '@/lib/web-dashboard/copy';
import { fmtAge, fmtDayLong, fmtDayShort, type UiLocale } from '@/lib/web-dashboard/format';
import { SCENARIO_KEYS, SCREENS, type ScreenKey, type SyncStatus } from '@/lib/web-dashboard/model';
import { previewHref, type PreviewParams } from '@/lib/web-dashboard/params';
import { SYNTHETIC_VIEWERS } from '@/lib/web-dashboard/access';
import { SYNTHETIC_TODAY, addDays } from '@/lib/web-dashboard/synthetic';

import { Icon, type IconName } from './Icon';
import { Chip } from './primitives';

const NAV_ICONS: Record<ScreenKey, IconName> = {
  overview: 'overview',
  activity: 'steps',
  sleep: 'sleep',
  heart: 'heart',
  workouts: 'workouts',
  trends: 'trends',
  sources: 'sources',
};

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua';

/** Fascia sempre presente: dice che questa NON e' la dashboard di un utente reale. */
export function PreviewBanner({ copy }: { copy: SharedCopy }) {
  return (
    <div role="note" data-preview-banner className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-warning">
      {copy.previewBanner}
    </div>
  );
}

/** Barra di revisione: cambia stato dei dati e «chi guarda». Sparisce con `?chrome=0`. */
export function PreviewBar({ copy, lc, screen, params }: { copy: SharedCopy; lc: string; screen: ScreenKey; params: PreviewParams }) {
  const pill = (active: boolean) =>
    `whitespace-nowrap px-3 py-1.5 rounded-pill text-xs font-medium border ${active ? 'border-brand-aqua bg-brand-aqua/15 text-brand-aqua' : 'border-divider text-text-secondary hover:bg-white/5'} ${focusRing}`;
  const viewers = Object.keys(SYNTHETIC_VIEWERS).filter((k) => k !== 'lifetime') as Array<keyof typeof SYNTHETIC_VIEWERS>;
  return (
    <div data-preview-bar className="border-b border-divider bg-bg-secondary px-4 py-3">
      <div className="mx-auto max-w-[1280px] space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-text-muted font-semibold">{copy.preview.scenarioLabel}</span>
          {SCENARIO_KEYS.map((s) => (
            <a key={s} href={previewHref(lc, screen, params, { state: s })} aria-current={params.state === s ? 'true' : undefined} className={pill(params.state === s)}>
              {copy.preview.scenarios[s]}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-text-muted font-semibold">{copy.preview.viewerLabel}</span>
          {viewers.map((v) => (
            <a key={v} href={previewHref(lc, screen, params, { as: v })} aria-current={params.as === v ? 'true' : undefined} className={pill(params.as === v)}>
              {copy.preview.viewers[v]}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Chip dell'ultimo sync: stato + eta'. Porta alla schermata sorgenti. */
export function SyncChip({ sync, copy, ui, href }: { sync: SyncStatus; copy: SharedCopy; ui: UiLocale; href: string }) {
  const tone = sync.state === 'ok' ? 'success' : sync.state === 'partial' ? 'warning' : sync.state === 'error' ? 'error' : 'neutral';
  const stateLabel = copy.sync[sync.state];
  const age = sync.ageMinutes === null ? copy.sync.never : `${copy.sync.label}: ${fmtAge(sync.ageMinutes, ui)}`;
  return (
    <a href={href} data-sync-state={sync.state} className={`inline-flex items-center gap-2 rounded-pill border border-divider bg-bg-card px-3 py-1.5 text-xs text-text-secondary hover:bg-white/5 ${focusRing}`}>
      <Chip tone={tone} icon="sync">{stateLabel}</Chip>
      <span className="text-text-muted">{age}</span>
    </a>
  );
}

/** Navigazione fra i giorni. Il giorno successivo a oggi non esiste. */
export function DateNav({ copy, lc, ui, screen, params }: { copy: SharedCopy; lc: string; ui: UiLocale; screen: ScreenKey; params: PreviewParams }) {
  const prev = addDays(params.day, -1);
  const next = addDays(params.day, 1);
  const canPrev = params.day > addDays(SYNTHETIC_TODAY, -89);
  const canNext = params.day < SYNTHETIC_TODAY;
  const label = params.day === SYNTHETIC_TODAY ? copy.date.today : params.day === addDays(SYNTHETIC_TODAY, -1) ? copy.date.yesterday : fmtDayShort(params.day, ui);
  const btn = `grid place-items-center w-11 h-11 rounded-pill border border-divider text-text-primary hover:bg-white/5 ${focusRing}`;
  const off = 'grid place-items-center w-11 h-11 rounded-pill border border-divider/50 text-text-muted opacity-40';
  return (
    <nav aria-label={copy.date.pick} className="flex items-center gap-2">
      {canPrev ? (
        <a href={previewHref(lc, screen, params, { day: prev })} className={btn} aria-label={copy.date.prev}>
          <Icon name="chevronLeft" />
        </a>
      ) : (
        <span className={off} aria-hidden="true"><Icon name="chevronLeft" /></span>
      )}
      <div className="min-w-[8.5rem] text-center">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{fmtDayLong(params.day, ui)}</p>
      </div>
      {canNext ? (
        <a href={previewHref(lc, screen, params, { day: next })} className={btn} aria-label={copy.date.next}>
          <Icon name="chevronRight" />
        </a>
      ) : (
        <span className={off} aria-hidden="true"><Icon name="chevronRight" /></span>
      )}
    </nav>
  );
}

function NavLink({ screen, lc, params, copy, active, mobile }: { screen: ScreenKey; lc: string; params: PreviewParams; copy: SharedCopy; active: boolean; mobile?: boolean }) {
  const base = mobile
    ? `shrink-0 inline-flex items-center gap-2 px-4 min-h-[44px] rounded-pill text-sm font-medium border`
    : `flex items-center gap-3 px-3 min-h-[44px] rounded-[14px] text-sm font-medium`;
  const state = active
    ? mobile ? 'border-brand-aqua bg-brand-aqua/15 text-brand-aqua' : 'bg-white/8 text-text-primary'
    : mobile ? 'border-divider text-text-secondary' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary';
  return (
    <a href={previewHref(lc, screen, params)} aria-current={active ? 'page' : undefined} className={`${base} ${state} ${focusRing}`}>
      <Icon name={NAV_ICONS[screen]} size={20} className={active && !mobile ? 'text-brand-aqua' : ''} />
      {copy.nav[screen]}
    </a>
  );
}

/**
 * Cornice della dashboard autorizzata: barra laterale su desktop, schede
 * scorrevoli su mobile. Impostazioni ed export stanno in «Account» e NON
 * dipendono dal paywall (sono le stesse rotte dell'area privata).
 */
export function DashboardShell({
  copy,
  lc,
  ui,
  screen,
  params,
  sync,
  title,
  children,
}: {
  copy: SharedCopy;
  lc: string;
  ui: UiLocale;
  screen: ScreenKey;
  params: PreviewParams;
  sync: SyncStatus | null;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <PreviewBanner copy={copy} />
      {params.chrome ? <PreviewBar copy={copy} lc={lc} screen={screen} params={params} /> : null}
      <div className="mx-auto max-w-[1280px] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-divider lg:px-4 lg:py-6">
          <p className="px-3 font-display text-lg font-semibold">{copy.brand}</p>
          <nav aria-label={copy.navAria} className="mt-6 flex flex-col gap-1">
            {SCREENS.map((s) => (
              <NavLink key={s} screen={s} lc={lc} params={params} copy={copy} active={s === screen} />
            ))}
          </nav>
          <div className="mt-auto space-y-1 border-t border-divider pt-4">
            <a href={`/${lc}/app/settings`} className={`flex items-center gap-3 px-3 min-h-[44px] rounded-[14px] text-sm text-text-secondary hover:bg-white/5 ${focusRing}`}>
              <Icon name="settings" /> {copy.gates.paywall.settings}
            </a>
            <a href={`/${lc}/app/export`} className={`flex items-center gap-3 px-3 min-h-[44px] rounded-[14px] text-sm text-text-secondary hover:bg-white/5 ${focusRing}`}>
              <Icon name="download" /> {copy.gates.paywall.export}
            </a>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <p className="lg:hidden font-display text-sm font-semibold text-text-secondary">{copy.brand}</p>
                <h1 className="font-display text-display tracking-tightest font-semibold">{title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {sync ? <SyncChip sync={sync} copy={copy} ui={ui} href={previewHref(lc, 'sources', params)} /> : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <DateNav copy={copy} lc={lc} ui={ui} screen={screen} params={params} />
            </div>
            <nav aria-label={copy.navAria} className="lg:hidden -mx-4 mt-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
              <div className="flex gap-2 pb-1">
                {SCREENS.map((s) => (
                  <NavLink key={s} screen={s} lc={lc} params={params} copy={copy} active={s === screen} mobile />
                ))}
              </div>
            </nav>
          </header>
          <main id="contenuto" className="px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
