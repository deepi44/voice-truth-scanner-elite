
import React from 'react';

interface AnalysisLayerProps {
  label: string;
  tamilLabel: string;
  description: string;
  isProcessing: boolean;
  isCompleted: boolean;
  delay?: number;
}

const AnalysisLayer: React.FC<AnalysisLayerProps> = ({ 
  label, 
  tamilLabel, 
  description, 
  isProcessing, 
  isCompleted,
  delay = 0
}) => {
  return (
    <div className="p-6 rounded-[1.8rem] border border-slate-800 bg-slate-900/30 transition-all duration-500 hover:scale-[1.02] hover:border-indigo-500/30">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] font-futuristic text-slate-200">
            {label}
          </h3>
          <span className="text-[9px] text-indigo-500/70 font-bold uppercase tracking-widest block mt-1">{tamilLabel}</span>
        </div>
        {isProcessing && !isCompleted && (
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        )}
        {isCompleted && (
          <div className="text-emerald-500 p-1 bg-emerald-500/10 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      <p className={`text-[11px] font-bold uppercase tracking-wider leading-relaxed min-h-[3rem] text-slate-500 ${
        !isCompleted && isProcessing ? 'animate-pulse' : ''
      }`}>
        {isCompleted 
          ? description 
          : isProcessing 
            ? 'SCALING FREQUENCY VECTORS...' 
            : 'IDLE - AWAITING UPLINK'}
      </p>

      <div className="mt-4 h-1.5 w-full rounded-full overflow-hidden bg-slate-800">
        <div 
          className={`h-full bg-indigo-500 transition-all duration-[2000ms] ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)] ${isProcessing || isCompleted ? 'w-full' : 'w-0'}`}
          style={{ transitionDelay: `${delay}ms` }}
        ></div>
      </div>
    </div>
  );
};

export default AnalysisLayer;
