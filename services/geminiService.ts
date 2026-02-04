import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, SupportedLanguage, LiveUpdate } from "../types";
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
    parts.push({ text: `MESSAGE_CONTENT: ${input}` });
  } else {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (input.size > MAX_SIZE) {
      throw new Error("VALIDATION_ERROR: File exceeds 10MB limit.");
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
    text: `VOICE TRUTH SCANNER ELITE v5.2 - SECURITY PROTOCOL
    CONTEXT: Global AI Fraud Prevention Suite
    SELECTED_GATEWAY_LANGUAGE: ${language}
    
    INSTRUCTIONS (STRICT ADHERENCE):
    1. LANGUAGE GATEKEEPER: Identify the input language. 
       - IF input language != ${language}: Set "language_match": false, "final_verdict": "CAUTION", "risk_level": "HIGH".
    2. SCAM BEHAVIOR (STAGE 1): Search for pressure tactics, bank impersonation, or urgency patterns.
    3. VOICE FORENSICS (STAGE 2): If audio, analyze spectral stability, pitch jitter, and synthetic artifacts.
    
    DECISION LOGIC:
    - LANGUAGE MISMATCH -> "CAUTION" (High Priority Alert)
    - AI DETECTED -> "AI_GENERATED_FRAUD"
    - SCAM INTENT -> "BLOCK_NOW"
    - HUMAN + SAFE INTENT -> "SAFE"
    
    RETURN JSON FORMAT ONLY:
    {
      "final_verdict": "Verdict",
      "confidence_score": 0.0-1.0,
      "risk_level": "LOW|MEDIUM|HIGH",
      "detected_language": "String",
      "language_match": boolean,
      "spam_behavior": {
        "language_detected": "string",
        "scam_patterns": ["string"],
        "spam_risk": "LOW|MEDIUM|HIGH",
        "suspicious_phrases": ["string"]
      },
      "voice_forensics": {
        "classification": "AI_GENERATED|HUMAN",
        "analysis_layers": {
          "spatial_acoustics": "Forensic findings",
          "emotional_micro_dynamics": "Forensic findings",
          "cultural_linguistics": "Forensic findings",
          "breath_emotion_sync": "Forensic findings",
          "spectral_artifacts": "Forensic findings",
          "code_switching": "Forensic findings"
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
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      ...parsed,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      operator: "SECURE_NODE_772"
    };

  } catch (error: any) {
    if (retries > 0 && error.message?.includes('overloaded')) {
      await sleep(1500);
      return analyzeForensicInput(input, language, retries - 1);
    }
    throw new Error(error.message || "UPLINK_ABORTED");
  }
};

export const startLiveForensics = async (
  language: SupportedLanguage,
  onUpdate: (update: LiveUpdate) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return {
    processChunk: async (blob: Blob) => {
      const base64 = await fileToBase64(blob);
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { inlineData: { data: base64, mimeType: 'audio/webm' } },
          { text: `LIVE_FORENSIC_CHUNK: Detect AI voice or scam. Selected: ${language}. 
          MANDATORY: If the speaker is NOT using ${language}, set "is_mismatch": true and "verdict": "CAUTION".
          Output JSON: {"verdict": "Verdict", "confidence": 0-1, "current_intent": "intent string", "is_mismatch": boolean}` }
        ],
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text || "{}");
      onUpdate(data);
    }
  };
};