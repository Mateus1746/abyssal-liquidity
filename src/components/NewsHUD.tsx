import { motion } from 'motion/react';
import { TimelineEvent } from '../types';

interface NewsHUDProps {
  visibleEvents: TimelineEvent[];
  activeEventIndex: number;
  setSelectedEvent: (event: TimelineEvent) => void;
}

export function NewsHUD({ visibleEvents, activeEventIndex, setSelectedEvent }: NewsHUDProps) {
  return (
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
  );
}
