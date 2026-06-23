import React, { useState, useEffect } from 'react';
import { TimelineEvent } from './types';
import { processEvent } from './services/llm';
import { EventModal } from './components/EventModal';
import { SimulationCanvas } from './components/SimulationCanvas';
import { NewsHUD } from './components/NewsHUD';
import { ActiveEventOverlay } from './components/ActiveEventOverlay';
import { DashboardHeader } from './components/DashboardHeader';
import { useSimulatedStream } from './hooks/useSimulatedStream';
import { useThemeLevels } from './hooks/useThemeLevels';

export default function App() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<TimelineEvent[]>([]);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [state, setState] = useState<'idle' | 'syncing' | 'analyzing' | 'error'>('idle');

  // Debug mode toggle (press 'D')
  const [debugActive, setDebugActive] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setDebugActive(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Signal app readiness for the recorder
    (window as any).__appReady = true;

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const simulatedEvents = useSimulatedStream();

  useEffect(() => {
    const processStream = async () => {
      if (simulatedEvents.length === 0 || state === 'syncing') return;
      
      const newEvents = simulatedEvents.filter(e => !events.find(ev => ev.id === e.id));
      if (newEvents.length === 0) return;

      setState('syncing');

      try {
        const enrichedEvents = await Promise.all(
          newEvents.map(async (event) => {
            if (process.env.GEMINI_API_KEY) {
              return await processEvent(event);
            }
            return {
              ...event,
              consequences: `System is now operating on localized simulation models, reducing sync cost while maintaining structural fidelity.`,
              impact: 'MODERATE_RESTRICTION',
              intensity: 'MEDIUM',
              theme: event.theme
            } as TimelineEvent;
          })
        );

        setEvents(prev => [...prev, ...enrichedEvents]);
        setVisibleEvents(prev => [...prev, ...enrichedEvents]);
        setState('idle');
      } catch (error) {
        console.error('Failed to process events:', error);
        setState('error');
        // Fallback for visual continuity
        setEvents(prev => [...prev, ...newEvents.map(e => ({
          ...e,
          consequences: 'System is now operating on localized simulation models, reducing sync cost while maintaining structural fidelity.',
          impact: 'MODERATE_RESTRICTION',
          intensity: 'MEDIUM'
        }))]);
        setVisibleEvents(prev => [...prev, ...newEvents.map(e => ({
          ...e,
          consequences: 'System is now operating on localized simulation models, reducing sync cost while maintaining structural fidelity.',
          impact: 'MODERATE_RESTRICTION',
          intensity: 'MEDIUM'
        }))]);
        setState('idle');
      }
    };

    processStream();
  }, [simulatedEvents, events, state]);

  // Advance timeline every 8 seconds
  useEffect(() => {
    if (visibleEvents.length === 0) return;

    const interval = setInterval(() => {
      setActiveEventIndex(prev => {
        if (prev < visibleEvents.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [visibleEvents.length]);

  const themeLevels = useThemeLevels(visibleEvents, activeEventIndex);
  const isSyncing = state === 'syncing';

  return (
    <div className="w-full h-screen bg-[#020408] overflow-hidden font-sans text-white selection:bg-cyan-400/30">
      <DashboardHeader
        state={state}
        visibleEvents={visibleEvents}
        activeEventIndex={activeEventIndex}
      />

      <ActiveEventOverlay
        activeEventIndex={activeEventIndex}
        visibleEvents={visibleEvents}
      />

      <NewsHUD
        visibleEvents={visibleEvents}
        activeEventIndex={activeEventIndex}
        setSelectedEvent={setSelectedEvent}
      />

      <EventModal
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
      />

      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className={`flex items-center gap-2 text-[10px] font-mono tracking-widest transition-opacity duration-1000 ${isSyncing ? 'opacity-40' : 'opacity-0'}`}>
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          <span className="text-cyan-400/80 uppercase drop-shadow-md">Reality_Sync_Active</span>
        </div>
      </div>

      <SimulationCanvas state={state} themeLevels={themeLevels} />

      {debugActive && (
        <>
          {/* Action-Safe Zone (93%) */}
          <div style={{
            position: 'absolute',
            top: '3.5%',
            left: '3.5%',
            width: '93%',
            height: '93%',
            border: '1px dashed rgba(0, 242, 255, 0.3)',
            pointerEvents: 'none',
            boxSizing: 'border-box',
            zIndex: 9999
          }}>
            <span style={{ 
              position: 'absolute', 
              top: '4px', 
              left: '6px', 
              fontSize: '8px', 
              color: 'rgba(0, 242, 255, 0.5)', 
              fontFamily: 'monospace',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '1px 4px',
              borderRadius: '2px'
            }}>
              ACTION-SAFE (93%)
            </span>
          </div>

          {/* Title-Safe Zone (90%) */}
          <div style={{
            position: 'absolute',
            top: '5%',
            left: '5%',
            width: '90%',
            height: '90%',
            border: '1px dashed rgba(188, 19, 254, 0.3)',
            pointerEvents: 'none',
            boxSizing: 'border-box',
            zIndex: 9999
          }}>
            <span style={{ 
              position: 'absolute', 
              bottom: '4px', 
              right: '6px', 
              fontSize: '8px', 
              color: 'rgba(188, 19, 254, 0.5)', 
              fontFamily: 'monospace',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '1px 4px',
              borderRadius: '2px'
            }}>
              TITLE-SAFE (90%)
            </span>
          </div>
        </>
      )}
    </div>
  );
}
