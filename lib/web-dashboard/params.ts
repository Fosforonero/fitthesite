/**
 * Parametri dell'anteprima (URL): stato dei dati, chi guarda, giorno, intervallo.
 * Tutto e' nell'URL cosi' ogni schermata e' riproducibile e fotografabile.
 */
import { SYNTHETIC_VIEWERS, type SyntheticViewer } from './access';
import { SCENARIO_KEYS, SCREENS, type ScenarioKey, type ScreenKey } from './model';
import { DEFAULT_DAY, clampDay } from './synthetic';

export type Range = 7 | 30 | 90;

export interface PreviewParams {
  state: ScenarioKey;
  as: SyntheticViewer;
  day: string;
  range: Range;
  /** false = senza la barra di anteprima (per fotografare la schermata pulita). */
  chrome: boolean;
}

export const DEFAULT_PARAMS: PreviewParams = { state: 'ok', as: 'subscriber', day: DEFAULT_DAY, range: 30, chrome: true };

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parsePreviewParams(sp: Raw): PreviewParams {
  const state = first(sp.state);
  const as = first(sp.as);
  const range = Number(first(sp.range));
  return {
    state: (SCENARIO_KEYS as readonly string[]).includes(state ?? '') ? (state as ScenarioKey) : DEFAULT_PARAMS.state,
    as: as && as in SYNTHETIC_VIEWERS ? (as as SyntheticViewer) : DEFAULT_PARAMS.as,
    day: clampDay(first(sp.day)),
    range: range === 7 || range === 90 ? range : DEFAULT_PARAMS.range,
    chrome: first(sp.chrome) !== '0',
  };
}

export function isScreen(s: string): s is ScreenKey {
  return (SCREENS as readonly string[]).includes(s);
}

/** URL di una schermata dell'anteprima; omette i valori di default. */
export function previewHref(lc: string, screen: ScreenKey, params: PreviewParams, overrides: Partial<PreviewParams> = {}): string {
  const p = { ...params, ...overrides };
  const q = new URLSearchParams();
  if (p.state !== DEFAULT_PARAMS.state) q.set('state', p.state);
  if (p.as !== DEFAULT_PARAMS.as) q.set('as', p.as);
  if (p.day !== DEFAULT_PARAMS.day) q.set('day', p.day);
  if (p.range !== DEFAULT_PARAMS.range) q.set('range', String(p.range));
  if (!p.chrome) q.set('chrome', '0');
  const qs = q.toString();
  return `/${lc}/dashboard-preview/${screen}${qs ? `?${qs}` : ''}`;
}
