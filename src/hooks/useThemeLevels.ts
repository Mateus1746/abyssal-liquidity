import { useMemo } from 'react';
import { TimelineEvent } from '../types';

export function useThemeLevels(visibleEvents: TimelineEvent[], activeEventIndex: number) {
  return useMemo(() => {
    const levels = {
      ALGO: 0,
      THERMAL: 0,
      ABYSSAL: 0,
      FRICTION: 0,
      QUANTUM: 0
    };

    if (visibleEvents.length > 0 && activeEventIndex < visibleEvents.length) {
      const activeTheme = visibleEvents[activeEventIndex].theme;
      if (activeTheme && levels[activeTheme] !== undefined) {
        levels[activeTheme] = 1;
      }
    }

    return levels;
  }, [visibleEvents, activeEventIndex]);
}
