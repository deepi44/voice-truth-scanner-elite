
export type Classification = 'AI_GENERATED' | 'HUMAN';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type Theme = 'dark' | 'light';

export interface AnalysisLayers {
  spatial_acoustics: string;
  emotional_micro_dynamics: string;
  cultural_linguistics: string;
  breath_emotion_sync: string;
  spectral_artifacts: string;
  code_switching: string;
}

export interface AnalysisResult {
  classification: Classification;
  confidence_score: number;
  fraud_risk_level: RiskLevel;
  analysis_layers: AnalysisLayers;
  safety_actions: string[];
  forensic_report: string;
}

export type AppStatus = 'IDLE' | 'RECORDING' | 'UPLOADING' | 'ANALYZING' | 'COMPLETED' | 'ERROR';

export type SupportedLanguage = 'Tamil' | 'English' | 'Hindi' | 'Malayalam' | 'Telugu';

export const LANGUAGE_LOCALES: Record<SupportedLanguage, string> = {
  Tamil: 'ta-IN',
  English: 'en-US',
  Hindi: 'hi-IN',
  Malayalam: 'ml-IN',
  Telugu: 'te-IN',
};
