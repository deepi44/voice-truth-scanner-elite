
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
  <div className={`p-8 rounded-[3.5rem] border transition-all hover:-translate-y-2 ${
    theme === 'DARK' 
      ? 'border-white/5 bg-slate-900/50 hover:bg-slate-900/70' 
      : 'border-slate-300 bg-white shadow-lg hover:shadow-2xl'
  }`}>
    <div className="flex justify-between items-start mb-6">
      <div className="flex flex-col gap-1">
        <h4 className={`text-[11px] font-black uppercase tracking-widest ${theme === 'DARK' ? 'text-indigo-400' : 'text-indigo-700'}`}>{label}</h4>
        <span className={`text-[10px] font-bold uppercase tracking-tighter opacity-70 ${theme === 'DARK' ? 'text-slate-400' : 'text-slate-600'}`}>{localizedLabel}</span>
      </div>
      {isCompleted && (
        <div className={`w-3 h-3 rounded-full ${
          theme === 'DARK' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)]' : 'bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.5)]'
        }`} />
      )}
    </div>
    <p className={`text-[14px] font-black uppercase tracking-wide leading-relaxed ${
      theme === 'DARK' ? 'text-slate-200' : 'text-slate-950'
    }`}>
      {isCompleted ? description : 'SIGNAL_AWAITING_LOCK...'}
    </p>
  </div>
);

export default AnalysisLayer;
