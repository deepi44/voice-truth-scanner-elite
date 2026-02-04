export type Role = 'USER' | 'ADMIN';
export type Verdict = 'SAFE' | 'CAUTION' | 'AI_GENERATED_FRAUD' | 'BLOCK_NOW';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type Theme = 'DARK' | 'LIGHT';

export interface SpamBehavior {
  language_detected: string;
  supported_languages: string[];
  scam_patterns: string[];
  spam_risk: RiskLevel;
}

export interface AnalysisLayers {
  layer_1_spatial_acoustics: string;
  layer_2_emotional_micro_tremors: string;
  layer_3_cultural_speech_timing: string;
  layer_4_breath_emotion_sync: string;
  layer_5_spectral_artifacts: string;
  layer_6_code_switching: string;
}

export interface VoiceForensics {
  classification: 'HUMAN' | 'AI_GENERATED';
  analysis_layers: AnalysisLayers;
}

export interface ForensicEvidence {
  timestamp: string;
  sha256_hash: string;
  blockchain_proof: string;
}

export interface AnalysisResult {
  id: string; // Internal tracking ID
  status: 'SUCCESS' | 'ERROR';
  final_verdict: Verdict;
  confidence_score: number;
  risk_level: RiskLevel;
  spam_behavior: SpamBehavior;
  voice_forensics: VoiceForensics;
  safety_actions: string[];
  forensic_evidence: ForensicEvidence;
  operator?: string;
}

export interface LiveUpdate {
  verdict: Verdict;
  confidence: number;
  current_intent: string;
  is_mismatch: boolean;
}

export type AppStatus = 'IDLE' | 'RECORDING' | 'LIVE_CALL' | 'ANALYZING' | 'COMPLETED' | 'ERROR';

export type SupportedLanguage = 'Tamil' | 'English' | 'Hindi' | 'Malayalam' | 'Telugu' | 'AUTO';

export const LANGUAGE_LOCALES: Record<string, string> = {
  Tamil: 'ta',
  English: 'en',
  Hindi: 'hi',
  Malayalam: 'ml',
  Telugu: 'te',
  AUTO: 'AUTO'
};