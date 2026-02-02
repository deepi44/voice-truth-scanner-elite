
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
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  classification: Classification;
  confidence_score: number;
  fraud_risk_level: RiskLevel;
  analysis_layers: AnalysisLayers;
  analysis_summary: string;
  detected_language: string;
  language_match: boolean;
  operator: string;
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

export const LANGUAGE_METADATA: Record<SupportedLanguage, {
  nativeName: string;
  layers: Record<string, string>;
}> = {
  Tamil: {
    nativeName: 'தமிழ்',
    layers: { spatial: 'இடம்', emotional: 'உணர்ச்சி', cultural: 'கலாச்சாரம்', respiratory: 'சுவாசம்', spectral: 'நிறமாலை', linguistic: 'மொழி' }
  },
  English: {
    nativeName: 'English',
    layers: { spatial: 'Spatial', emotional: 'Emotion', cultural: 'Cultural', respiratory: 'Breath', spectral: 'Spectral', linguistic: 'Language' }
  },
  Hindi: {
    nativeName: 'हिन्दी',
    layers: { spatial: 'स्थानिक', emotional: 'भावना', cultural: 'सांस्कृतिक', respiratory: 'श्वसन', spectral: 'स्पेक्ट्रल', linguistic: 'भाषा' }
  },
  Malayalam: {
    nativeName: 'മലയാളം',
    layers: { spatial: 'സ്ഥലം', emotional: 'വികാരം', cultural: 'സാംസ്காരികം', respiratory: 'ശ്വാസം', spectral: 'സ്പെക്ട്രൽ', linguistic: 'ഭാഷ' }
  },
  Telugu: {
    nativeName: 'తెలుగు',
    layers: { spatial: 'స్థలం', emotional: 'భావం', cultural: 'సాంస్కృతిక', respiratory: 'శ్వాస', spectral: 'స్పెక్ట్రల్', linguistic: 'భాഷ' }
  }
};
