import type { ScreenKey } from '@/lib/web-dashboard/model';

import type { ScreenEntry } from '../screen-types';

import { ActivityLoading, ActivityScreen } from './ActivityScreen';
import { HeartLoading, HeartScreen } from './HeartScreen';
import { OverviewLoading, OverviewScreen } from './OverviewScreen';
import { SleepLoading, SleepScreen } from './SleepScreen';
import { SourcesLoading, SourcesScreen } from './SourcesScreen';
import { TrendsLoading, TrendsScreen } from './TrendsScreen';
import { WorkoutsLoading, WorkoutsScreen } from './WorkoutsScreen';

export const SCREEN_REGISTRY: Record<ScreenKey, ScreenEntry> = {
  overview: { Screen: OverviewScreen, Loading: OverviewLoading },
  activity: { Screen: ActivityScreen, Loading: ActivityLoading },
  sleep: { Screen: SleepScreen, Loading: SleepLoading },
  heart: { Screen: HeartScreen, Loading: HeartLoading },
  workouts: { Screen: WorkoutsScreen, Loading: WorkoutsLoading },
  trends: { Screen: TrendsScreen, Loading: TrendsLoading },
  sources: { Screen: SourcesScreen, Loading: SourcesLoading },
};
