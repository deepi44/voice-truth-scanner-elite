
import React from 'react';
import { RiskLevel } from '../types';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level }) => {
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score * circumference);

  const getColor = () => {
    switch (level) {
      case 'HIGH': return '#f43f5e'; // Rose
      case 'MEDIUM': return '#f59e0b'; // Amber
      case 'LOW': return '#10b981'; // Emerald
      default: return '#6366f1';
    }
  };

  const color = getColor();

  return (
    <div className="relative flex items-center justify-center w-full max-w-[280px] aspect-square group mx-auto">
      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-4 rounded-full blur-[60px] opacity-20 transition-all duration-[2000ms] ease-in-out"
        style={{ backgroundColor: color }}
      ></div>

      {/* SVG Container for the gauge */}
      <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" viewBox="0 0 220 220">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Ring Rail */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          stroke="#0f172a"
          strokeWidth="12"
          fill="transparent"
          className="opacity-50"
        />

        {/* Gauge Progress */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-[2000ms] ease-out"
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />

        {/* Interactive Ticks */}
        {[...Array(24)].map((_, i) => {
          const angle = (i * 15) * (Math.PI / 180);
          const x1 = 110 + (radius + 12) * Math.cos(angle);
          const y1 = 110 + (radius + 12) * Math.sin(angle);
          const x2 = 110 + (radius + 20) * Math.cos(angle);
          const y2 = 110 + (radius + 20) * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i / 24 < score ? color : '#1e293b'}
              strokeWidth="2"
              className="transition-colors duration-1000"
              style={{ opacity: i % 2 === 0 ? 0.6 : 0.2 }}
            />
          );
        })}

        {/* Radial Scanner Sweep */}
        <circle
          cx="110"
          cy="110"
          r={radius - 15}
          fill="none"
          stroke={`url(#sweepGradient)`}
          strokeWidth="30"
          strokeDasharray={`${circumference / 4} ${circumference}`}
          className="animate-[spin_4s_linear_infinite] opacity-10 pointer-events-none"
        />
      </svg>

      {/* Center Display Panel */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-[11px] font-black tracking-[0.4em] text-slate-400 uppercase mb-2 crt-text">
            AUTHENTICITY
          </span>
          <div className="relative">
             <span className="text-5xl sm:text-6xl font-black font-futuristic text-white tracking-tighter crt-text leading-none block">
              {Math.round(score * 100)}%
            </span>
            {/* Holographic underline */}
            <div className="h-0.5 w-full bg-indigo-500/30 mt-1 blur-[1px]"></div>
          </div>
          
          <div className="mt-5 px-4 py-1.5 rounded-full border border-white/10 bg-black/60 shadow-inner backdrop-blur-md">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mr-2">
              RISK LEVEL:
            </span>
            <span 
              className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest"
              style={{ color }}
            >
              {level}
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Outer Border */}
      <div className="absolute inset-0 border border-white/5 rounded-full pointer-events-none"></div>
    </div>
  );
};

export default RiskMeter;
