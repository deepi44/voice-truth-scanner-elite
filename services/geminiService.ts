import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SupportedLanguage } from "../types";
import { fileToBase64, getMimeType } from "./audioService";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeForensicInput = async (
  input: File | Blob | string,
  language: SupportedLanguage,
  retries = 2
): Promise<AnalysisResult> => {
  const isText = typeof input === 'string';
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let parts: any[] = [];
  
  if (isText) {
    parts.push({ text: `TEXT_TO_ANALYZE: ${input}` });
  } else {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (input.size > MAX_SIZE) {
      throw new Error("VALIDATION_ERROR: File exceeds 10MB security limit.");
    }
    const base64Data = await fileToBase64(input);
    const mimeType = getMimeType(input);
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    });
  }

  parts.push({
    text: `VOICE TRUTH SCANNER ELITE - FORENSIC PROTOCOL v5.0
    USER_GATEWAY_LANGUAGE: ${language}
    
    MISSION: 
    1. Detect spoken/written language. If not ${language}, stop and report mismatch.
    2. STAGE 1 (Spam/Scam): Identify OTP requests, bank emergencies, prize scams, or police impersonation.
    3. STAGE 2 (Voice Forensics - Only if Audio): Analyze spatial acoustics, micro-tremors, cultural rhythm, breath-sync, spectral artifacts, and code-switching.
    
    VERDICT LOGIC:
    - LOW spam + HUMAN voice → SAFE
    - LOW spam + AI voice → AI_GENERATED_FRAUD
    - MEDIUM spam + HUMAN voice → CAUTION
    - HIGH spam + AI voice/HIGH spam → BLOCK_NOW
    
    OUTPUT FORMAT (STRICT JSON):
    {
      "final_verdict": "AI_GENERATED_FRAUD | HUMAN | CAUTION | BLOCK_NOW | SAFE",
      "confidence_score": number (0-1),
      "risk_level": "LOW | MEDIUM | HIGH",
      "detected_language": "string",
      "language_match": boolean,
      "spam_behavior": {
        "language_detected": "string",
        "scam_patterns": ["string"],
        "spam_risk": "LOW | MEDIUM | HIGH"
      },
      "voice_forensics": {
        "classification": "AI_GENERATED | HUMAN",
        "analysis_layers": {
          "spatial_acoustics": "Explain evidence",
          "emotional_micro_dynamics": "Explain evidence",
          "cultural_linguistics": "Explain evidence",
          "breath_emotion_sync": "Explain evidence",
          "spectral_artifacts": "Explain evidence",
          "code_switching": "Explain evidence"
        }
      },
      "safety_actions": ["IGNORE", "BLOCK", "REPORT"]
    }`,
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            final_verdict: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            risk_level: { type: Type.STRING },
            detected_language: { type: Type.STRING },
            language_match: { type: Type.BOOLEAN },
            spam_behavior: {
              type: Type.OBJECT,
              properties: {
                language_detected: { type: Type.STRING },
                scam_patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
                spam_risk: { type: Type.STRING }
              },
              required: ["language_detected", "scam_patterns", "spam_risk"]
            },
            voice_forensics: {
              type: Type.OBJECT,
              properties: {
                classification: { type: Type.STRING },
                analysis_layers: {
                  type: Type.OBJECT,
                  properties: {
                    spatial_acoustics: { type: Type.STRING },
                    emotional_micro_dynamics: { type: Type.STRING },
                    cultural_linguistics: { type: Type.STRING },
                    breath_emotion_sync: { type: Type.STRING },
                    spectral_artifacts: { type: Type.STRING },
                    code_switching: { type: Type.STRING }
                  },
                  required: ["spatial_acoustics", "emotional_micro_dynamics", "cultural_linguistics", "breath_emotion_sync", "spectral_artifacts", "code_switching"]
                }
              },
              required: ["classification", "analysis_layers"]
            },
            safety_actions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["final_verdict", "confidence_score", "risk_level", "detected_language", "language_match", "spam_behavior", "voice_forensics", "safety_actions"]
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("CORE_UPLINK_FAILURE");
    
    const parsed = JSON.parse(resultText);
    return {
      ...parsed,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      operator: "SECURE_BACKEND_NODE"
    };

  } catch (error: any) {
    if (retries > 0 && JSON.stringify(error).includes('overloaded')) {
      await sleep(2000);
      return analyzeForensicInput(input, language, retries - 1);
    }
    throw new Error(error.message || "NEURAL_LINK_INTERRUPTED");
  }
};

export const simulateForensicDiagnostic = async (language: SupportedLanguage): Promise<AnalysisResult> => {
  await sleep(1000); 
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    final_verdict: "SAFE",
    confidence_score: 0.99,
    risk_level: "LOW",
    detected_language: language,
    language_match: true,
    operator: "SYSTEM_DIAGNOSTIC",
    spam_behavior: {
      language_detected: language,
      scam_patterns: [],
      spam_risk: "LOW"
    },
    voice_forensics: {
      classification: "HUMAN",
      analysis_layers: {
        spatial_acoustics: "Consistent with natural environment.",
        emotional_micro_dynamics: "Human micro-tremors detected.",
        cultural_linguistics: "Native cadence verified.",
        breath_emotion_sync: "Physiological sync confirmed.",
        spectral_artifacts: "Zero synthetic artifacts.",
        code_switching: "Natural transition markers."
      }
    },
    safety_actions: ["IGNORE"]
  };
};
