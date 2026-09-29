import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

import { sharedCopy } from '@/lib/web-dashboard/copy';
import { uiLocale } from '@/lib/web-dashboard/format';
import type { ScenarioKey } from '@/lib/web-dashboard/model';
import { DEFAULT_PARAMS, previewHref } from '@/lib/web-dashboard/params';
import { DEFAULT_DAY, buildDashboardData } from '@/lib/web-dashboard/synthetic';

import type { ScreenProps } from '../screen-types';

/** Le props di una schermata per uno scenario sintetico e una lingua. */
export function screenProps(scenario: ScenarioKey, opts: { lc?: string; day?: string } = {}): ScreenProps {
  const lc = opts.lc ?? 'it';
  const day = opts.day ?? DEFAULT_DAY;
  const params = { ...DEFAULT_PARAMS, state: scenario, day };
  const ui = uiLocale(lc);
  return {
    data: buildDashboardData(scenario, day),
    lc,
    ui,
    copy: sharedCopy(ui),
    params,
    href: (screen, overrides = {}) => previewHref(lc, screen, params, overrides),
  };
}

export function renderScreen(
  Screen: (p: ScreenProps) => ReactElement | null,
  scenario: ScenarioKey,
  opts: { lc?: string; day?: string } = {},
): RenderResult & { props: ScreenProps } {
  const props = screenProps(scenario, opts);
  return { ...render(<Screen {...props} />), props };
}

/** Copy vietata nel prototipo: em dash, promesse di disponibilita' o di date. */
export const FORBIDDEN_COPY = /—|coming soon|prossimamente|a breve|in arrivo|presto disponibile|launch|lancio|dal \d{1,2} (gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/i;

export function forbiddenCopyIn(container: HTMLElement): string[] {
  const text = container.textContent ?? '';
  const found = text.match(new RegExp(FORBIDDEN_COPY.source, 'gi'));
  return found ?? [];
}

/** Gli stati di misura presenti nel DOM (attributo data-measure-state di MeasureValue e simili). */
export function measureStates(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-measure-state]')].map((n) => n.getAttribute('data-measure-state') ?? '');
}
