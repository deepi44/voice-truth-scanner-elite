
export type Role = 'USER' | 'ADMIN';
export type Classification = 'AI_GENERATED' | 'HUMAN';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type Theme = 'DARK' | 'LIGHT';

export interface AnalysisLayers {
  spatial_acoustics: string;
  emotional_micro_dynamics: string;
  cultural_linguistics: string;
  breath_emotion_sync: string;
  spectral_artifacts: string;
  code_switching: string;
  behavioral_threats: string; // New: Explicit behavioral analysis
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  classification: Classification;
  confidence_score: number;
  fraud_risk_level: RiskLevel;
  analysis_layers: AnalysisLayers;
  safety_actions: string[];
  forensic_report: string;
  operator: string;
  detected_language: string;
  language_match: boolean;
  is_scam: boolean; // New: Direct scam detection
  scam_keywords: string[]; // New: Extracted red flags
}

export type AppStatus = 'IDLE' | 'RECORDING' | 'ANALYZING' | 'COMPLETED' | 'ERROR';

export type SupportedLanguage = 'Tamil' | 'English' | 'Hindi' | 'Malayalam' | 'Telugu';

export const LANGUAGE_LOCALES: Record<SupportedLanguage, string> = {
  Tamil: 'ta-IN',
  English: 'en-US',
  Hindi: 'hi-IN',
  Malayalam: 'ml-IN',
  Telugu: 'te-IN',
};
