import { useState, useEffect } from 'react';
import { TimelineEvent } from '../types';

export function useSimulatedStream() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    // Simulated event stream
    const mockEvents: Partial<TimelineEvent>[] = [
      {
        id: '1',
        title: 'Abyssal Liquidity Influx',
        description: 'Nas profundezas do sistema financeiro global, trilhões de dólares fluem como correntes oceânicas abissais.',
        theme: 'ABYSSAL'
      },
      {
        id: '2',
        title: 'Capital Abissal: Correntes Globais',
        description: 'A infraestrutura hidráulica do capital sustenta cada transação e cada investimento global.',
        theme: 'ABYSSAL'
      },
      {
        id: '3',
        title: 'Pressão Sistêmica Estabilizada',
        description: 'Bancos centrais regulam as marés profundas, mantendo a estabilidade da realidade financeira.',
        theme: 'ABYSSAL'
      }
    ];

    let currentIndex = 0;

    const addEvent = () => {
      if (currentIndex < mockEvents.length) {
        setEvents(prev => [...prev, mockEvents[currentIndex] as TimelineEvent]);
        currentIndex++;
      }
    };

    addEvent(); // Add first event immediately

    const interval = setInterval(addEvent, 5000);

    return () => clearInterval(interval);
  }, []);

  return events;
}
