
import React from 'react';
import { RiskLevel, Theme } from '../types';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
  theme?: Theme;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level, theme = 'DARK' }) => {
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  
  // Ensure score is clamped between 0.0 and 1.0 for the SVG logic
  const clampedValue = Math.max(0, Math.min(1, score));
  const offset = circumference - (clampedValue * circumference);
  
  // Explicitly calculate integer score for display (strictly 0 to 100)
  const displayScore = Math.min(100, Math.max(0, Math.round(clampedValue * 100)));

  const color = level === 'HIGH' ? '#dc2626' : level === 'MEDIUM' ? '#f59e0b' : '#10b981';

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 sm:p-14 rounded-[2rem] sm:rounded-[5rem] border-2 sm:border-4 backdrop-blur-3xl transition-all duration-700 w-full max-sm:max-w-xs sm:max-w-md ${
      theme === 'DARK' 
        ? 'bg-slate-900/40 border-white/5 shadow-2xl' 
        : 'bg-white/95 border-slate-300 shadow-xl'
    }`}>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-[2rem] sm:rounded-[5rem]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_infinite]" />
      </div>

      <svg className="w-40 h-40 sm:w-64 md:w-80 transform -rotate-90" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="meterGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <circle 
          cx="100" cy="100" r={radius} 
          stroke={theme === 'DARK' ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"} 
          strokeWidth="18" fill="transparent" 
        />
        
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke={color}
          strokeWidth="18"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-[-10px] sm:mt-[-20px]">
        <div className="relative flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl sm:text-6xl md:text-8xl font-black font-futuristic leading-none ${theme === 'DARK' ? 'text-white' : 'text-slate-950'}`}>
              {displayScore}
            </span>
            <span className={`text-lg sm:text-2xl font-black opacity-30 ${theme === 'DARK' ? 'text-white' : 'text-slate-950'}`}>%</span>
          </div>
          <div className="absolute -top-3 -right-6 sm:-top-6 sm:-right-12 px-1.5 sm:px-3 py-0.5 sm:py-1 bg-indigo-600 rounded-md sm:rounded-lg text-[7px] sm:text-[10px] font-black text-white shadow-lg animate-bounce">
            TRUTH
          </div>
        </div>
        <p className={`text-[10px] sm:text-[14px] font-black uppercase tracking-[0.3em] sm:tracking-[0.6em] mt-3 sm:mt-6 opacity-40 ${theme === 'DARK' ? 'text-slate-500' : 'text-slate-600'}`}>
          SCORE
        </p>
      </div>
      
      <div className={`mt-6 sm:mt-14 px-5 sm:px-12 py-2.5 sm:py-5 rounded-full border-2 sm:border-4 flex items-center gap-2 sm:gap-4 transition-all duration-500 ${
        theme === 'DARK' ? 'border-white/10 bg-black/60 shadow-xl' : 'border-slate-300 bg-slate-50'
      }`}>
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full animate-ping" style={{ backgroundColor: color }} />
        <span className="text-[10px] sm:text-[14px] font-black uppercase tracking-[0.2em] sm:tracking-[0.6em] whitespace-nowrap" style={{ color }}>
          {level} RISK
        </span>
      </div>
    </div>
  );
};

export default RiskMeter;
