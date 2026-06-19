import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Info, Radio, Activity } from 'lucide-react';
import { TimelineEvent } from '../types';

interface EventModalProps {
  selectedEvent: TimelineEvent | null;
  setSelectedEvent: (event: TimelineEvent | null) => void;
}

export function EventModal({ selectedEvent, setSelectedEvent }: EventModalProps) {
  return (
    <AnimatePresence>
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
            id="modal-backdrop"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-[0_0_100px_rgba(0,255,255,0.05)] border border-white/10 bg-white/5 backdrop-blur-3xl"
            id="event-modal"
          >
            {/* Ambient glows */}
            <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

            <div className="relative p-8 sm:p-12">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                     <span className={`text-[10px] font-mono font-bold uppercase py-1 px-3 bg-white/10 rounded-full ${
                       {
                         THERMAL: 'text-red-400',
                         ABYSSAL: 'text-blue-400',
                         ALGO: 'text-[#00E676]',
                         FRICTION: 'text-[#FF7043]',
                         QUANTUM: 'text-[#D500F9]'
                       }[selectedEvent.theme]
                     }`}>
                      {selectedEvent.theme}
                    </span>
                    <div className="h-px w-8 bg-white/20" />
                    <span className="text-white/50 text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                      <Activity size={14} className="opacity-70" />
                      Historical_Trace
                    </span>
                  </div>
                  <h2 className="text-white text-3xl sm:text-4xl font-bold tracking-tight uppercase leading-none bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">{selectedEvent.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-white/40 hover:text-white hover:bg-white/10 transition-all p-2 rounded-full backdrop-blur-md"
                  id="close-modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
                    <h3 className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Zap size={14} className="opacity-70 text-yellow-400" />
                      Intensity Index
                    </h3>
                    <div className="flex gap-1 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${
                        selectedEvent.intensity === 'HIGH' ? 'w-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' :
                        selectedEvent.intensity === 'MEDIUM' ? 'w-2/3 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                        'w-1/3 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]'
                      }`} />
                    </div>
                    <p className="text-white/60 text-[11px] font-mono mt-3 uppercase tracking-tighter">
                      Level: <span className="text-white font-bold">{selectedEvent.intensity}</span>
                    </p>
                  </div>

                  <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
                    <h3 className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Info size={14} className="opacity-70 text-blue-400" />
                      Impact Vector
                    </h3>
                    <div className="text-white/90 text-sm font-mono font-bold tracking-widest uppercase">
                      {selectedEvent.impact}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white/40 text-[10px] font-mono uppercase tracking-widest pl-1">Description</h3>
                  <p className="text-white/80 text-sm sm:text-base font-mono leading-relaxed bg-black/20 p-6 rounded-xl border border-white/10 shadow-inner">
                    {selectedEvent.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-between items-center text-[10px] font-mono">
                  <div className="text-white/40 tracking-widest uppercase">
                    Reality_Core_Sync
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400/60 bg-cyan-400/10 px-3 py-1.5 rounded-full border border-cyan-400/20">
                    <Radio size={12} className="animate-pulse" />
                    SECURE_CONNECTION
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
