import React from 'react';
import { X, Wind, CloudRain, Thermometer, Droplets, Eye, Navigation } from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import { WeatherLocation } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationPanelProps {
  location: WeatherLocation | null;
  currentHour: number;
  onClose: () => void;
}

export const LocationPanel: React.FC<LocationPanelProps> = ({ location, currentHour, onClose }) => {
  if (!location) return null;

  const data = location.forecast[currentHour];
  
  // Risk color helper
  const getRiskColor = (score: number) => {
    if (score > 0.7) return 'text-risk-extreme';
    if (score > 0.4) return 'text-risk-high';
    if (score > 0.2) return 'text-risk-moderate';
    return 'text-risk-low';
  };

  const riskLabel = (score: number) => {
    if (score > 0.7) return 'EXTREME';
    if (score > 0.4) return 'HIGH';
    if (score > 0.2) return 'MODERATE';
    return 'LOW';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute top-24 right-6 bottom-32 z-50 w-[380px] pointer-events-none"
      >
        <GlassPanel className="h-full pointer-events-auto overflow-y-auto flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-white/5 relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-3xl font-display font-bold uppercase text-white mb-1">{location.name}</h2>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Navigation size={12} />
              <span>{location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className={`px-3 py-1 rounded bg-white/5 font-mono text-xs border border-white/10 font-bold ${getRiskColor(data.riskScore)}`}>
                RISK: {riskLabel(data.riskScore)}
              </div>
              <div className="px-3 py-1 rounded bg-white/5 font-mono text-xs border border-white/10 text-slate-300">
                T+{currentHour}H
              </div>
            </div>
          </div>

          {/* Main Stats */}
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-space-950/30 p-4 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2">
              <Thermometer className="text-accent-cyan mb-1" size={24} />
              <span className="text-3xl font-mono font-light">{data.temperature}°</span>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Temperature</span>
            </div>
            <div className="bg-space-950/30 p-4 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2">
              <Wind className="text-accent-indigo mb-1" size={24} />
              <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-mono font-light">{data.windSpeed}</span>
                 <span className="text-xs text-slate-500">km/h</span>
              </div>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Wind {data.windDirection}</span>
            </div>
          </div>

          {/* Detailed List */}
          <div className="px-6 pb-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Atmospheric Metrics</h3>
            
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div className="flex items-center gap-3 text-slate-300">
                <Droplets size={16} className="text-sky-400" />
                <span className="text-sm">Humidity</span>
              </div>
              <span className="font-mono text-sm">{data.humidity}%</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div className="flex items-center gap-3 text-slate-300">
                <CloudRain size={16} className="text-indigo-400" />
                <span className="text-sm">Precipitation</span>
              </div>
              <span className="font-mono text-sm">{data.precipitationProbability}%</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div className="flex items-center gap-3 text-slate-300">
                <Eye size={16} className="text-emerald-400" />
                <span className="text-sm">Cloud Cover</span>
              </div>
              <span className="font-mono text-sm">{data.cloudCover}%</span>
            </div>
          </div>

          {/* Mini Forecast Chart */}
          <div className="px-6 pb-8 mt-auto">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Risk Trend (Next 12H)</h3>
             <div className="flex items-end justify-between h-24 gap-1">
               {location.forecast && location.forecast.length > 0 ? (
                 location.forecast.slice(currentHour, Math.min(currentHour + 12, location.forecast.length)).map((h, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div 
                        className={`w-full rounded-t-sm transition-all ${getRiskColor(h.riskScore || 0).replace('text-', 'bg-')}`}
                        style={{ height: `${Math.max(10, (h.riskScore || 0) * 100)}%`, opacity: 0.8 }}
                        title={`Risk: ${((h.riskScore || 0) * 100).toFixed(0)}%`}
                      />
                   </div>
                 ))
               ) : (
                 <div className="w-full text-center text-slate-500 text-xs py-4">
                   No forecast data available
                 </div>
               )}
             </div>
          </div>

        </GlassPanel>
      </motion.div>
    </AnimatePresence>
  );
};