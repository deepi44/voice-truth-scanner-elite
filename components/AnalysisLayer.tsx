import React from 'react';
import { Theme } from '../types';

interface AnalysisLayerProps {
  label: string;
  localizedLabel: string;
  description: string;
  isCompleted: boolean;
  theme?: Theme;
}

const AnalysisLayer: React.FC<AnalysisLayerProps> = ({ label, localizedLabel, description, isCompleted, theme = 'DARK' }) => (
  <div className={`p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] lg:rounded-[4rem] border-2 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden group ${
    theme === 'DARK' 
      ? 'border-white/5 bg-slate-900/40 hover:bg-slate-900/60 shadow-xl' 
      : 'border-slate-300 bg-white shadow-lg hover:shadow-xl'
  }`}>
    <div className={`absolute top-0 left-0 w-1 sm:w-1.5 h-full transition-all duration-500 ${isCompleted ? 'bg-indigo-600' : 'bg-white/10'}`} />
    
    <div className="flex justify-between items-start mb-6 sm:mb-10">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h4 className={`text-[9px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] ${theme === 'DARK' ? 'text-indigo-400' : 'text-indigo-700'}`}>{label}</h4>
        <span className={`text-[8px] sm:text-[11px] font-bold uppercase tracking-widest opacity-40 ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-600'}`}>{localizedLabel}</span>
      </div>
      {isCompleted && (
        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full relative ${
          theme === 'DARK' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)]' : 'bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.5)]'
        }`}>
          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-30" />
        </div>
      )}
    </div>
    
    <p className={`text-sm sm:text-xl font-bold uppercase tracking-tight leading-snug sm:leading-relaxed transition-all ${
      isCompleted ? (theme === 'DARK' ? 'text-slate-200' : 'text-slate-900') : 'text-slate-600 opacity-20'
    }`}>
      {isCompleted ? description : 'SIGNAL_AWAITING_DECRYPTION...'}
    </p>
    
    {!isCompleted && (
      <div className="mt-6 sm:mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600 w-1/3 animate-[shimmer_2s_infinite]" />
      </div>
    )}
  </div>
);

export default AnalysisLayer;