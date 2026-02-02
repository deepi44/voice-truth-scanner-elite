
import React from 'react';
import { RiskLevel, Theme } from '../types';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
  theme?: Theme;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level, theme = 'DARK' }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score * circumference);

  const color = level === 'HIGH' ? '#dc2626' : level === 'MEDIUM' ? '#d97706' : '#059669';

  return (
    <div className={`relative flex flex-col items-center justify-center p-10 rounded-[4rem] border backdrop-blur-xl transition-all ${
      theme === 'DARK' 
        ? 'bg-slate-900/40 border-white/5 shadow-2xl' 
        : 'bg-white/95 border-slate-300 shadow-2xl'
    }`}>
      <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 160 160">
        <circle 
          cx="80" cy="80" r={radius} 
          stroke={theme === 'DARK' ? "#1e293b" : "#e2e8f0"} 
          strokeWidth="14" fill="transparent" 
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 12px ${color})` }}
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-[-10px]">
        <span className={`text-6xl font-black font-futuristic leading-none ${theme === 'DARK' ? 'text-white' : 'text-slate-950'}`}>
          {Math.round(score * 100)}%
        </span>
        <p className={`text-[12px] font-black uppercase tracking-[0.4em] mt-3 ${theme === 'DARK' ? 'text-slate-500' : 'text-slate-600'}`}>
          CONFIDENCE
        </p>
      </div>
      <div className={`mt-10 px-10 py-3 rounded-full border-2 ${
        theme === 'DARK' ? 'border-white/10 bg-black/40' : 'border-slate-300 bg-slate-50'
      }`}>
        <span className="text-[13px] font-black uppercase tracking-[0.5em]" style={{ color }}>
          RISK: {level}
        </span>
      </div>
    </div>
  );
};

export default RiskMeter;
