import { motion, AnimatePresence } from 'motion/react';
import { Network, Database } from 'lucide-react';
import { TimelineEvent } from '../types';

interface ActiveEventOverlayProps {
  activeEventIndex: number;
  visibleEvents: TimelineEvent[];
}

export function ActiveEventOverlay({ activeEventIndex, visibleEvents }: ActiveEventOverlayProps) {
  return (
    <div className="absolute right-10 top-1/2 -translate-y-1/2 w-96 space-y-6 pointer-events-none z-20">
      <AnimatePresence mode="popLayout">
        {activeEventIndex < visibleEvents.length && (
          <motion.div
            key={activeEventIndex}
            initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -50, filter: 'blur(10px)', transition: { duration: 0.5 } }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {/* Glass highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent" />

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <span className="text-white/40 text-[10px] font-mono tracking-widest uppercase flex items-center gap-2">
                  <Network size={14} className="text-cyan-400/50" />
                  System_Analysis
                </span>
                <Database size={14} className="text-white/20" />
              </div>
              <p className="text-white/80 text-sm font-mono leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5">
                {visibleEvents[activeEventIndex].consequences}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
