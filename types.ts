export type Role = 'USER' | 'ADMIN';
export type Verdict = 'HUMAN' | 'AI_GENERATED' | 'AI_GENERATED_FRAUD';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ForensicClassification = 'HUMAN' | 'AI_GENERATED';
export type Theme = 'DARK' | 'LIGHT';

export interface SpamBehavior {
  scam_patterns: string[];
  spam_risk: RiskLevel;
  suspicious_phrases?: string[]; // Kept for UI detail if available
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  status: string;
  detected_language: string;
  final_verdict: Verdict;
  classification: ForensicClassification;
  confidence_score: number;
  risk_level: RiskLevel;
  spam_behavior: SpamBehavior;
  safety_actions: string[];
  operator: string;
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

export const LANGUAGE_METADATA: Record<string, {
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
    layers: { spatial: 'സ്ഥലം', emotional: 'വികാരം', cultural: 'സാംസ്കാരികം', respiratory: 'ശ്വാസം', spectral: 'സ്പെക്ട്രൽ', linguistic: 'ഭാഷ' }
  },
  Telugu: {
    nativeName: 'తెలుగు',
    layers: { spatial: 'స్థలం', emotional: 'భావం', cultural: 'సాంస్కృతిక', respiratory: 'శ్వాస', spectral: 'స్పెక్ట్రల్', linguistic: 'భాష' }
  },
  AUTO: {
    nativeName: 'Auto Detect',
    layers: { spatial: 'Auto', emotional: 'Auto', cultural: 'Auto', respiratory: 'Auto', spectral: 'Auto', linguistic: 'Auto' }
  }
};