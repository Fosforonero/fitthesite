import type { WorkoutType } from '@/lib/web-dashboard/model';

import { Icon } from '../../Icon';

/**
 * Glifi dei tipi di allenamento che il set di Icon.tsx non ha (corsa, ciclismo,
 * nuoto), disegnati con le stesse regole: linea, angoli arrotondati, 24 px di
 * griglia, tratto 1,75. Camminata, forza e «altro» riusano le icone del set.
 * Se il prototipo passa, questi tre vanno spostati in Icon.tsx (vedi la
 * richiesta nel report).
 */
const GLYPHS = {
  run: 'M17 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM13.5 8.5L11 13.5l3.5 2-1 4.5M11 13.5L8.5 16 5.5 18M9 10.5l4.5-2 3.5 2.5',
  cycle:
    'M9.5 16a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM21.5 16a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM6 16l4-7h5l3 7M10 9l2.5 7H6M15 9l-.5-2h2',
  swim: 'M17.5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM6 12.5l5-3 4 2M3 16c1.5 0 1.5 1.5 3 1.5S7.5 16 9 16s1.5 1.5 3 1.5S13.5 16 15 16s1.5 1.5 3 1.5S19.5 16 21 16M3 20c1.5 0 1.5 1.5 3 1.5S7.5 20 9 20s1.5 1.5 3 1.5S13.5 20 15 20s1.5 1.5 3 1.5S19.5 20 21 20',
} as const;

export function TypeIcon({ type, size = 20 }: { type: WorkoutType; size?: 16 | 20 | 24 }) {
  if (type === 'run' || type === 'cycle' || type === 'swim') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d={GLYPHS[type]} />
      </svg>
    );
  }
  if (type === 'walk') return <Icon name="steps" size={size} />;
  if (type === 'strength') return <Icon name="workouts" size={size} />;
  return <Icon name="flame" size={size} />;
}
