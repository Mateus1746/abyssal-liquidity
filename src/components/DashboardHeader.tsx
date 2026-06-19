import { motion, AnimatePresence } from 'motion/react';
import { Terminal, ShieldAlert } from 'lucide-react';
import { TimelineEvent } from '../types';

interface DashboardHeaderProps {
  state: 'idle' | 'syncing' | 'analyzing' | 'error';
  visibleEvents: TimelineEvent[];
  activeEventIndex: number;
}

export function DashboardHeader({ state, visibleEvents, activeEventIndex }: DashboardHeaderProps) {
  return (
    <div className="absolute top-10 left-10 z-20 pointer-events-none">
      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-8 rounded-2xl w-[420px] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Subtle glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${
              state === 'idle' ? 'bg-white/20' :
              state === 'syncing' ? 'bg-cyan-400 animate-pulse' :
              state === 'analyzing' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-500 animate-pulse'
            }`} />
            <span className="text-white/40 text-[10px] font-mono tracking-widest uppercase">
              Insight_Stream
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activeEventIndex < visibleEvents.length ? (
              <motion.div
                key={activeEventIndex}
                initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h1 className="text-white text-3xl font-bold tracking-tight uppercase leading-none mb-4 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                  {visibleEvents[activeEventIndex].title}
                </h1>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-[#00E676] text-[10px] font-mono border border-[#00E676]/30 px-2 py-1 rounded bg-[#00E676]/10">
                    {visibleEvents[activeEventIndex].theme}
                  </span>
                  <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest">
                    Reality_Fix_0x{activeEventIndex.toString(16)}
                  </span>
                </div>

                <p className="text-white/60 text-sm font-mono leading-relaxed italic bg-white/5 p-4 rounded-lg border-l-2 border-white/20">
                  {visibleEvents[activeEventIndex].description}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="complete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <ShieldAlert size={32} className="text-cyan-400/50 mb-4" />
                <h2 className="text-white/80 text-xl font-mono tracking-widest uppercase">
                  Analysis Complete
                </h2>
                <p className="text-white/40 text-[10px] mt-2 font-mono">
                  AWAITING_NEW_DATA
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="mt-8 h-[2px] bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-cyan-400/50 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              initial={{ width: 0 }}
              animate={{
                width: `${visibleEvents.length > 0 ? ((activeEventIndex) / visibleEvents.length) * 100 : 0}%`
              }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
