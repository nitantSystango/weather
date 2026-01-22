import React from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

interface TimelineScrubberProps {
  currentHour: number;
  onHourChange: (hour: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ 
  currentHour, 
  onHourChange, 
  isPlaying, 
  onTogglePlay 
}) => {
  
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Simplified risk coloring logic for the timeline bar visual
  const getRiskColor = (h: number) => {
    // Just a visual pattern for the mock data aesthetic
    const cycle = Math.sin(h * 0.2) + Math.cos(h * 0.5);
    if (cycle > 1.2) return 'bg-risk-extreme';
    if (cycle > 0.5) return 'bg-risk-high';
    if (cycle > -0.5) return 'bg-risk-moderate';
    return 'bg-risk-low';
  };

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-3xl">
      <GlassPanel className="p-4 flex flex-col gap-4">
        
        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onTogglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 transition-all"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
            </button>
            
            <div className="flex flex-col">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Forecast Horizon</span>
              <span className="text-lg font-display font-bold text-white">
                T+{currentHour}H <span className="text-accent-cyan text-sm font-mono ml-2">/ 24H</span>
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => onHourChange(Math.max(0, currentHour - 1))} className="p-2 hover:bg-white/10 rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => onHourChange(Math.min(23, currentHour + 1))} className="p-2 hover:bg-white/10 rounded-lg">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Scrubber Bar */}
        <div className="relative h-12 w-full group cursor-pointer"
             onClick={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const pct = (e.clientX - rect.left) / rect.width;
               const hour = Math.min(23, Math.max(0, Math.floor(pct * 24)));
               onHourChange(hour);
             }}
        >
          {/* Background Track */}
          <div className="absolute inset-0 flex items-end gap-[2px] opacity-60 group-hover:opacity-100 transition-opacity">
            {hours.map(h => (
              <div 
                key={h} 
                className={`flex-1 rounded-t-sm transition-all duration-300 ${getRiskColor(h)}`}
                style={{ 
                  height: h === currentHour ? '100%' : '30%',
                  opacity: h < currentHour ? 0.3 : 1
                }}
              />
            ))}
          </div>
          
          {/* Hover/Selection Indicator */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none transition-all duration-100 ease-out"
            style={{ left: `${(currentHour / 23) * 100}%` }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
          <span>Now</span>
          <span>+4h</span>
          <span>+8h</span>
          <span>+12h</span>
          <span>+16h</span>
          <span>+20h</span>
          <span>+24h</span>
        </div>

      </GlassPanel>
    </div>
  );
};