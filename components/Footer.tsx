import React from 'react';
import { Clock, Database, Wifi } from 'lucide-react';

interface FooterProps {
  currentTime: string;
  dataSource: 'ZEUS_NODE' | 'ZEUS' | 'CONNECTING';
}

export const Footer: React.FC<FooterProps> = ({ currentTime, dataSource }) => {
  const isLive = dataSource === 'ZEUS_NODE';
  const isConnecting = dataSource === 'CONNECTING';

  return (
    <footer className="absolute bottom-0 left-0 w-full z-30 p-4 pointer-events-none flex justify-between items-end text-xs font-mono text-slate-500">
      <div className="flex items-center gap-2 bg-space-950/80 backdrop-blur px-3 py-1 rounded border border-white/5">
        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-amber-500'}`}></span>
        <span>{isConnecting ? 'ESTABLISHING UPLINK...' : 'SYSTEM OPERATIONAL'}</span>
      </div>
      
      <div className="flex items-center gap-2 bg-space-950/80 backdrop-blur px-3 py-1 rounded border border-white/5">
        <Clock size={12} />
        <span>TARGET TIME: {new Date(currentTime).toUTCString()}</span>
      </div>

      <div className={`flex items-center gap-2 bg-space-950/80 backdrop-blur px-3 py-1 rounded border border-white/5 ${isLive ? 'text-accent-cyan border-accent-cyan/20' : ''}`}>
        {isLive ? <Wifi size={12} /> : <Database size={12} />}
        <span>SOURCE: {dataSource}</span>
      </div>
    </footer>
  );
};