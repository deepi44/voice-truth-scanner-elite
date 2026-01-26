
import React from 'react';
import { RiskLevel } from '../types';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score * circumference);

  const color = level === 'HIGH' ? '#ef4444' : level === 'MEDIUM' ? '#f59e0b' : '#10b981';

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-slate-900/40 rounded-[3rem] border border-white/5 backdrop-blur-xl">
      <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} stroke="#1e293b" strokeWidth="12" fill="transparent" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-[-8px]">
        <span className="text-4xl font-black font-futuristic text-white">{Math.round(score * 100)}%</span>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">CONFIDENCE</p>
      </div>
      <div className="mt-4 px-4 py-1.5 rounded-full border border-white/10 bg-black/40">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>RISK: {level}</span>
      </div>
    </div>
  );
};

export default RiskMeter;
