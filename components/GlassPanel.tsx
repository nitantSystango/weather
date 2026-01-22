import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '', onClick, style }) => {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        backdrop-blur-md 
        bg-space-900/40 
        border border-accent-cyan/20 
        shadow-[0_0_20px_rgba(0,217,255,0.05)]
        rounded-xl 
        text-slate-100
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
};