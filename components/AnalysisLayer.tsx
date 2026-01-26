
import React from 'react';

interface AnalysisLayerProps {
  label: string;
  tamilLabel: string;
  description: string;
  isCompleted: boolean;
}

const AnalysisLayer: React.FC<AnalysisLayerProps> = ({ label, tamilLabel, description, isCompleted }) => (
  <div className="p-5 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-md space-y-3">
    <div className="flex justify-between items-center">
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{label}</h4>
        <span className="text-[9px] font-bold text-slate-500 font-tamil">{tamilLabel}</span>
      </div>
      {isCompleted && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />}
    </div>
    <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed text-slate-300">
      {isCompleted ? description : 'AWAITING SCAN...'}
    </p>
  </div>
);

export default AnalysisLayer;
