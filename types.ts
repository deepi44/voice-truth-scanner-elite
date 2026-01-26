
export type Role = 'USER' | 'ADMIN';
export type Theme = 'dark' | 'light';
export type Classification = 'AI_GENERATED' | 'HUMAN';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AnalysisLayers {
  spatial_acoustics: string;
  emotional_micro_dynamics: string;
  cultural_linguistics: string;
  breath_emotion_sync: string;
  spectral_artifacts: string;
  code_switching: string;
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
  // Language detection fields
  detected_language: string;
  language_match: boolean;
}

export interface AnalyticsData {
  totalScans: number;
  fraudCount: number;
  humanCount: number;
  riskDistribution: { high: number; medium: number; low: number };
  languageUsage: Record<string, number>;
  recentScans: AnalysisResult[];
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

export const ADMIN_EMAILS = ['admin@truthscanner.ai', 'supervisor@truthscanner.ai', 'lead@truthscanner.ai'];
