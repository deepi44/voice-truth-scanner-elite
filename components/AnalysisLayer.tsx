
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
    <div className="p-4 rounded-xl border border-slate-700/50 dark:border-slate-700/50 light:border-slate-200 bg-slate-900/30 dark:bg-slate-900/30 light:bg-white/50 backdrop-blur-sm transition-all hover:border-indigo-500/30 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-futuristic">
            {label}
          </h3>
          <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-tamil">{tamilLabel}</span>
        </div>
        {isProcessing && !isCompleted && (
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        )}
        {isCompleted && (
          <div className="text-emerald-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      <p className={`text-[11px] md:text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[3rem] ${!isCompleted && isProcessing ? 'animate-pulse' : ''}`}>
        {isCompleted ? description : isProcessing ? 'Analyzing frequency vectors and temporal anomalies...' : 'Waiting for audio data...'}
      </p>

      <div className="mt-3 h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-indigo-500 transition-all duration-[2000ms] ease-out ${isProcessing || isCompleted ? 'w-full' : 'w-0'}`}
          style={{ transitionDelay: `${delay}ms` }}
        ></div>
      </div>
    </div>
  );
};

export default AnalysisLayer;
