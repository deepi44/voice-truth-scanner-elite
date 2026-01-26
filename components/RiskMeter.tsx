
import React from 'react';
import { RiskLevel } from '../types';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level }) => {
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score * circumference);

  const getColor = () => {
    switch (level) {
      case 'HIGH': return '#f43f5e'; // Rose/Red
      case 'MEDIUM': return '#f59e0b'; // Amber
      case 'LOW': return '#10b981'; // Emerald/Green
      default: return '#6366f1';
    }
  };

  const color = getColor();

  return (
    <div className="relative flex items-center justify-center w-full aspect-square max-w-[320px] mx-auto group">
      {/* Immersive Pulse Background */}
      <div 
        className="absolute inset-8 rounded-full blur-[70px] opacity-10 transition-all duration-[3000ms] ease-in-out group-hover:opacity-20"
        style={{ backgroundColor: color }}
      ></div>

      {/* SVG Container */}
      <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_30px_rgba(0,0,0,0.4)]" viewBox="0 0 240 240">
        <defs>
          <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Technical Outer Rail */}
        <circle
          cx="120"
          cy="120"
          r={radius + 8}
          stroke="#1e293b"
          strokeWidth="1"
          fill="transparent"
          strokeDasharray="4 8"
        />

        {/* Gauge Background Channel */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          stroke="#0f172a"
          strokeWidth="16"
          fill="transparent"
          className="opacity-40"
        />

        {/* Gauge Main Progress */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          stroke={`url(#meterGradient)`}
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-[2500ms] ease-out"
          filter="url(#neonGlow)"
        />

        {/* Calibration Ticks */}
        {[...Array(40)].map((_, i) => {
          const angle = (i * 9) * (Math.PI / 180);
          const outer = radius + 14;
          const inner = radius + (i % 10 === 0 ? 22 : 18);
          const x1 = 120 + outer * Math.cos(angle);
          const y1 = 120 + outer * Math.sin(angle);
          const x2 = 120 + inner * Math.cos(angle);
          const y2 = 120 + inner * Math.sin(angle);
          const active = i / 40 < score;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={active ? color : '#1e293b'}
              strokeWidth={i % 10 === 0 ? "2" : "1"}
              className="transition-colors duration-1000"
              opacity={active ? 1 : 0.3}
            />
          );
        })}
      </svg>

      {/* Internal Display Hub */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 select-none">
        <div className="space-y-1 w-full">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase crt-text mb-2 text-slate-500">
            AUTHENTICITY
          </p>
          <div className="relative inline-block">
            <span className="text-6xl font-black font-futuristic tracking-tighter crt-text leading-none text-white">
              {Math.round(score * 100)}%
            </span>
            <div className="h-1 w-full mt-4 rounded-full overflow-hidden bg-white/10">
               <div 
                 className="h-full bg-indigo-500 transition-all duration-[2500ms]" 
                 style={{ width: `${score * 100}%`, filter: `drop-shadow(0 0 5px ${color})` }}
               ></div>
            </div>
          </div>
          
          <div className="pt-8">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-white/5 bg-black/60 shadow-sm backdrop-blur-xl">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                RISK LEVEL:
              </span>
              <span 
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color }}
              >
                {level}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMeter;
