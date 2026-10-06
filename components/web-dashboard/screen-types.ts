import type { ReactNode } from 'react';

import type { SharedCopy } from '@/lib/web-dashboard/copy';
import type { UiLocale } from '@/lib/web-dashboard/format';
import type { DashboardData, ScreenKey } from '@/lib/web-dashboard/model';
import type { PreviewParams } from '@/lib/web-dashboard/params';

/** Cio' che riceve ogni schermata della dashboard (dati SINTETICI, gia' caricati). */
export interface ScreenProps {
  data: DashboardData;
  /** Segmento di lingua dell'URL (una delle 15 lingue del sito). */
  lc: string;
  /** Lingua della copy: it oppure en (le altre usano en). */
  ui: UiLocale;
  copy: SharedCopy;
  params: PreviewParams;
  /** Link a una schermata mantenendo lo stato dell'anteprima. */
  href: (screen: ScreenKey, overrides?: Partial<PreviewParams>) => string;
}

export interface ScreenEntry {
  /** Titolo mostrato nell'intestazione della pagina. */
  Screen: (props: ScreenProps) => ReactNode;
  /** Scheletro mostrato mentre carica (stato `loading`). */
  Loading: (props: { lc: string; ui: UiLocale }) => ReactNode;
}
