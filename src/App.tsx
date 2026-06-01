/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Zap, Activity, Radio, Cpu } from 'lucide-react';
import { FluidEngine } from './components/FluidEngine';
import { AbyssalState, PressureStatus, RealityTheme, RealityEvent } from './types';
import { fetchRealitySync } from './services/realitySync';
import { useMemo } from 'react';

const MOCK_INITIAL_STATE: AbyssalState = {
  globalPressure: 642,
  systemStatus: PressureStatus.STABLE,
  vectors: [
    { source: "REALITY_SYNC", value: 100, delta: 0, viscosity: 0.5, temperature: 0.5, pressure: 642 },
  ],
  timestamp: new Date().toISOString().split('T')[1].split('.')[0],
};

export default function App() {
  const [state, setState] = useState<AbyssalState>(MOCK_INITIAL_STATE);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeEventIndex, setActiveEventIndex] = useState<number>(-1);
  const [visibleEvents, setVisibleEvents] = useState<RealityEvent[]>([]);
  const [eventProgress, setEventProgress] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<RealityEvent | null>(null);

  // Theme levels logic: Progressive growth
  const themeLevels = useMemo(() => {
    const levels: Record<RealityTheme, number> = {
      THERMAL: 0,
      ABYSSAL: 0,
      ALGO: 0,
      FRICTION: 0,
      QUANTUM: 0
    };

    // All events up to activeIndex contribute 1.0 (stabilized)
    // The active event contributes eventProgress
    visibleEvents.forEach((event, idx) => {
      if (!event) return;
      const intensityValue = event.intensity === 'HIGH' ? 1.0 : event.intensity === 'MEDIUM' ? 0.6 : 0.4;
      
      if (idx < activeEventIndex) {
        levels[event.theme] = Math.max(levels[event.theme], intensityValue);
      } else if (idx === activeEventIndex) {
        levels[event.theme] = Math.max(levels[event.theme], intensityValue * eventProgress);
      }
    });

    return levels;
  }, [visibleEvents, activeEventIndex, eventProgress]);

  useEffect(() => {
    const syncRealWorld = async () => {
      setIsSyncing(true);
      const realData = await fetchRealitySync();
      
      if (realData) {
        setState(prev => ({
          ...prev,
          globalPressure: realData.globalPressure,
          systemStatus: realData.globalPressure > 850 ? PressureStatus.CRITICAL : PressureStatus.STABLE,
          reality: realData,
          vectors: prev.vectors.map(v => ({
            ...v,
            pressure: realData.globalPressure,
            viscosity: realData.viscosity,
            temperature: realData.temperature * 10,
            delta: realData.turbulence * 5
          }))
        }));

        // Start news cycle if events are present
        if (realData.events && realData.events.length > 0) {
          setActiveEventIndex(0);
          setEventProgress(0);
        }
      }
      
      setTimeout(() => setIsSyncing(false), 2000);
    };

    syncRealWorld();
    const syncInterval = setInterval(syncRealWorld, 180000); // 3 minutes
    return () => clearInterval(syncInterval);
  }, []);

  // News Cycle Effect
  useEffect(() => {
    if (activeEventIndex === -1 || !state.reality?.events) return;

    const events = state.reality.events;
    const currentEvent = events[activeEventIndex];
    if (!currentEvent) return;

    // Add to visible list if not already there
    setVisibleEvents(prev => {
      if (!prev.find(e => e.title === currentEvent.title)) {
        return [...prev, currentEvent];
      }
      return prev;
    });

    // Duration based on text length
    const duration = 15000; // 15 seconds per news item
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / duration, 1);
      setEventProgress(p);

      if (p >= 1) {
        clearInterval(timer);
        if (activeEventIndex < events.length - 1) {
          setTimeout(() => {
            setActiveEventIndex(prev => prev + 1);
            setEventProgress(0);
          }, 2000); // 2s pause
        }
      }
    }, 50);

    return () => clearInterval(timer);
  }, [activeEventIndex, state.reality?.events]);

  // Subtle oscillation for life-like movement
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        globalPressure: prev.globalPressure + (Math.random() - 0.5) * 0.2,
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* Narrative Pop-up Container */}
      <AnimatePresence mode="wait">
        {activeEventIndex !== -1 && state.reality?.events && state.reality.events[activeEventIndex] && (
          <motion.div 
            key={`popup-${activeEventIndex}`}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: 10 }}
            className="absolute left-10 top-10 z-30 max-w-sm pointer-events-auto"
          >
            <div className="relative group overflow-hidden">
              {/* Glass Background */}
              <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-2xl rounded-sm" />
              {/* Border with Inner Glow */}
              <div className="absolute inset-0 border border-white/10 rounded-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" />
              
              <div className="relative p-7">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse" />
                  <span className="text-white/40 text-[9px] font-mono tracking-[0.3em] uppercase">Insight_Stream</span>
                </div>
                
                {(() => {
                  const event = state.reality!.events![activeEventIndex];
                  if (!event) return null;
                  
                  const themeColor = {
                    THERMAL: 'text-red-500',
                    ABYSSAL: 'text-blue-500',
                    ALGO: 'text-[#00E676]',
                    FRICTION: 'text-[#FF7043]',
                    QUANTUM: 'text-[#D500F9]'
                  }[event.theme] || 'text-white';

                  return (
                    <>
                      <h3 className="text-white text-xl font-bold tracking-tight uppercase leading-tight mb-3">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-5">
                        <span className={`text-[8px] font-mono font-bold uppercase py-0.5 px-1.5 bg-white/5 ${themeColor} border border-current rounded-xs`}>
                          {event.theme}
                        </span>
                        <span className="text-white/20 text-[8px] font-mono uppercase tracking-widest pl-2">
                          REALITY_FIX_0x{activeEventIndex}
                        </span>
                      </div>
                      <p className="text-white/60 text-xs font-mono leading-relaxed italic mb-6">
                        {event.description}
                      </p>
                      
                      {/* Glassy progress track */}
                      <div className="relative h-[1px] w-full bg-white/10 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${eventProgress * 100}%` }}
                          className="absolute h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Narration Console (Analytical Sidebar) */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 z-20 w-80 pointer-events-none">
        <AnimatePresence mode="wait">
          {activeEventIndex !== -1 && state.reality?.events && state.reality.events[activeEventIndex] && (
            <motion.div
              key={`console-${activeEventIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-10"
            >
              {(() => {
                const event = state.reality!.events![activeEventIndex];
                if (!event) return null;
                return (
                  <>
                    <div className="relative p-5 group">
                      <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-sm border-l border-white/5" />
                      <div className="relative">
                        <div className="text-white/20 text-[8px] font-mono uppercase tracking-[0.3em] mb-4 flex justify-between items-center">
                          <span>System_Analysis</span>
                          <Cpu size={10} className="text-cyan-400/50" />
                        </div>
                        <p className="text-white/80 text-[11px] font-mono leading-relaxed tracking-tight">
                          {event.analysis}
                        </p>
                      </div>
                    </div>

                    <div className="relative p-5 group">
                      <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-sm border-l border-white/5" />
                      <div className="relative">
                        <div className="text-white/20 text-[8px] font-mono uppercase tracking-[0.3em] mb-4 flex justify-between items-center">
                          <span>Flow_Impact_Prediction</span>
                          <Radio size={10} className="text-white/30" />
                        </div>
                        <p className="text-cyan-400/70 text-[11px] font-mono leading-relaxed active:text-cyan-400 transition-colors">
                          {event.consequences}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Minimal News HUD (Historical List) */}
      <div className="absolute left-10 bottom-10 z-20 max-w-sm space-y-5">
        {visibleEvents.filter((_, idx) => idx < activeEventIndex).map((event, idx) => (
          <motion.div 
            key={`${event.title}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.4, y: 0 }}
            whileHover={{ opacity: 0.9 }}
            transition={{ duration: 0.6 }}
            className="cursor-pointer group pointer-events-auto pl-4 border-l border-white/10 hover:border-white/30 transition-all"
            onClick={() => setSelectedEvent(event)}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-white/90 text-[10px] font-bold tracking-tight uppercase leading-none group-hover:text-cyan-400 transition-colors">
                {event.title}
              </span>
            </div>
            <p className="text-white/20 text-[9px] font-mono leading-relaxed truncate max-w-[200px]">
              {event.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              id="modal-backdrop"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-lg overflow-hidden rounded-sm"
              id="event-modal"
            >
              {/* Glass Core */}
              <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-3xl border border-white/10" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
              
              <div className="relative p-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                       <span className={`text-[9px] font-mono font-bold uppercase py-1 px-3 bg-white/5 border border-current rounded-sm ${
                         {
                           THERMAL: 'text-red-500',
                           ABYSSAL: 'text-blue-500',
                           ALGO: 'text-[#00E676]',
                           FRICTION: 'text-[#FF7043]',
                           QUANTUM: 'text-[#D500F9]'
                         }[selectedEvent.theme]
                       }`}>
                        {selectedEvent.theme}
                      </span>
                      <div className="h-[1px] w-12 bg-white/20" />
                      <span className="text-white/40 text-[9px] font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={12} className="opacity-50" />
                        Historical_Trace
                      </span>
                    </div>
                    <h2 className="text-white text-3xl font-bold tracking-tighter uppercase leading-none">{selectedEvent.title}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="text-white/20 hover:text-white transition-all p-2 hover:bg-white/5 rounded-full"
                    id="close-modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-white/30 text-[9px] font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Zap size={12} className="opacity-70" />
                        Intensity
                      </h3>
                      <div className="flex gap-1 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${
                          selectedEvent.intensity === 'HIGH' ? 'w-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                          selectedEvent.intensity === 'MEDIUM' ? 'w-2/3 bg-[#FFD600]' : 
                          'w-1/3 bg-[#00E676]'
                        }`} />
                      </div>
                      <p className="text-white/60 text-[9px] font-mono mt-3 uppercase tracking-tighter">
                        Index: <span className="text-white font-bold">{selectedEvent.intensity}</span>
                      </p>
                    </div>

                    <div>
                      <h3 className="text-white/30 text-[9px] font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Info size={12} className="opacity-70" />
                        Impact_Vector
                      </h3>
                      <div className="text-white/90 text-sm font-mono font-bold tracking-widest uppercase border-b border-white/10 pb-1">
                        {selectedEvent.impact}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-white/30 text-[9px] font-mono uppercase tracking-widest">Description</h3>
                    <p className="text-white/90 text-[15px] font-mono leading-relaxed bg-white/[0.02] p-6 border border-white/10 rounded-sm">
                      {selectedEvent.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-between items-center text-[8px] font-mono">
                    <div className="text-white/30 tracking-widest uppercase italic">
                      Reality_Core_Sync_Completed
                    </div>
                    <div className="flex items-center gap-2 text-cyan-400/40">
                      <Radio size={10} className="animate-pulse" />
                      SECURE_CONNECTION_STABLE
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className={`flex items-center gap-2 text-[10px] font-mono tracking-widest transition-opacity duration-1000 ${isSyncing ? 'opacity-40' : 'opacity-0'}`}>
          <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-cyan-400/60 uppercase">Reality_Sync_Active</span>
        </div>
      </div>

      {/* 3D Simulation Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ 
            powerPreference: "high-performance",
            antialias: false,
            stencil: false,
            depth: true
          }}
          dpr={[1, 1.5]}
        >
          <color attach="background" args={['#05070A']} />
          <ambientLight intensity={0.5} />
          
          <Suspense fallback={null}>
            <FluidEngine state={state} themeLevels={themeLevels} />
            
            <EffectComposer enableNormalPass={false}>
              <Bloom 
                intensity={0.4} 
                luminanceThreshold={0.8} 
                luminanceSmoothing={0.3}
                mipmapBlur
              />
              <Vignette offset={0.1} darkness={1.1} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
