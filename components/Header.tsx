import React from 'react';
import { Globe, Menu } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

export const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 w-full z-40 p-6 pointer-events-none">
      <GlassPanel className="flex items-center justify-between px-8 py-4 pointer-events-auto">
        <div className="flex items-center gap-4">
          <Globe className="text-accent-cyan w-8 h-8 animate-pulse-slow" />
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-white">
              WEATHERPROOF <span className="text-accent-cyan">COMMONS</span>
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Global Risk Visualization Protocol</p>
          </div>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Menu className="text-slate-300 w-6 h-6" />
        </button>
      </GlassPanel>
    </header>
  );
};