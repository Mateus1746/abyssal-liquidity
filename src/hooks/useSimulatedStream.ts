import { useState, useEffect } from 'react';
import { TimelineEvent } from '../types';

export function useSimulatedStream() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    // Simulated event stream
    const mockEvents: Partial<TimelineEvent>[] = [
      {
        id: '1',
        title: 'Quantum Core Fluctuation',
        description: 'Anomaly detected in the primary quantum cooling system. Containment field stability dropping by 0.4% per minute.',
        theme: 'QUANTUM'
      },
      {
        id: '2',
        title: 'Algorithmic Subroutine Deviation',
        description: 'Pathfinding logic in sector 4 is returning non-euclidean coordinates. Potential data corruption in memory banks.',
        theme: 'ALGO'
      },
      {
        id: '3',
        title: 'Thermal Vent Blockage',
        description: 'Debris accumulation in exhaust vent Alpha. Temperature rising beyond optimal threshold.',
        theme: 'THERMAL'
      }
    ];

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < mockEvents.length) {
        setEvents(prev => [...prev, mockEvents[currentIndex] as TimelineEvent]);
        currentIndex++;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return events;
}
