import type { SVGProps } from 'react';

/** Icone a linea (BRAND.md sez. 13: stroke 1.5-2, angoli arrotondati, 16/20/24). Un solo set. */
const PATHS = {
  overview: 'M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z',
  steps: 'M8 4c1.7 0 3 1.5 3 3.6S9.7 12 8 12 5 9.7 5 7.6 6.3 4 8 4zM6 15.2h4.2v1.3A2 2 0 0 1 8.2 18.5 2.2 2.2 0 0 1 6 16.4zM16 8c1.7 0 3 1.5 3 3.6S17.7 16 16 16s-3-2.3-3-4.4S14.3 8 16 8zM14 19.2h4.2v.4A2 2 0 0 1 16.2 21 2.2 2.2 0 0 1 14 19.6z',
  sleep: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  heart: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
  workouts: 'M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12',
  trends: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  sources: 'M9 3h6l1 4H8zM9 21h6l1-4H8zM7 7h10v10H7zM12 10v4l2 1',
  sync: 'M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4',
  alert: 'M12 4l9 16H3zM12 10v4M12 17.3v.2',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 7.8v.2',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  chevronLeft: 'M14.5 5l-7 7 7 7',
  chevronRight: 'M9.5 5l7 7-7 7',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plug: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.4 1.1-1.6 2.8-1.7-.6a7 7 0 0 1-1.6.9l-.3 1.8h-3.2l-.3-1.8a7 7 0 0 1-1.6-.9l-1.7.6-1.6-2.8 1.4-1.1a7 7 0 0 1 0-1.9L6.6 10.5l1.6-2.8 1.7.6a7 7 0 0 1 1.6-.9l.3-1.8h3.2l.3 1.8a7 7 0 0 1 1.6.9l1.7-.6 1.6 2.8-1.4 1.1a7 7 0 0 1 0 1.9z',
  download: 'M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6',
  flame: 'M12 21c3.6 0 6-2.4 6-5.6 0-3-2-4.6-3-7-1.6 1-2.4 2.4-2.6 3.8C11.4 10 10 8 10.5 4.5 7.8 6.6 6 9.3 6 15.4 6 18.6 8.4 21 12 21z',
  stairs: 'M4 20h4v-4h4v-4h4V8h4M4 20V16M8 16V12',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  dash: 'M5 12h3M10.5 12h3M16 12h3',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  className,
  ...rest
}: { name: IconName; size?: 16 | 20 | 24 } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
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
      className={className}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
