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
    text: `VOICE TRUTH SCANNER ELITE v5.2 - BUILDATHON PROTOCOL
    CONTEXT: India AI User Safety & Fraud Prevention
    REQUIRED_GATEWAY_LANGUAGE: ${language}
    
    INSTRUCTION:
    1. LANGUAGE VERIFICATION: Detect the primary language of the input. If it is NOT ${language}, set "language_match": false and "final_verdict": "CAUTION".
    2. STAGE 1 (Behavioral): Detect Bank/OTP/Threat urgency. Detect linguistic manipulation.
    3. STAGE 2 (Forensics): If audio, analyze 6 layers (Spatial, Emotional Micro-Dynamics, Cultural Phonetics, Breath Sync, Spectral Artifacts, Code-Switch Flow).
    
    DECISION TREE:
    - LANGUAGE MISMATCH -> CAUTION (Mandatory alert)
    - LOW risk + HUMAN voice -> SAFE
    - LOW risk + AI voice -> AI_GENERATED_FRAUD
    - MEDIUM risk + HUMAN voice -> CAUTION
    - HIGH risk -> BLOCK_NOW
    
    JSON REQUIREMENTS:
    {
      "final_verdict": "Verdict",
      "confidence_score": 0-1,
      "risk_level": "LOW|MEDIUM|HIGH",
      "detected_language": "Detected Name",
      "language_match": boolean,
      "spam_behavior": {
        "language_detected": "string",
        "scam_patterns": ["string"],
        "spam_risk": "LOW|MEDIUM|HIGH",
        "suspicious_phrases": ["short excerpts"]
      },
      "voice_forensics": {
        "classification": "AI_GENERATED|HUMAN",
        "analysis_layers": {
          "spatial_acoustics": "Forensic evidence",
          "emotional_micro_dynamics": "Forensic evidence",
          "cultural_linguistics": "Forensic evidence",
          "breath_emotion_sync": "Forensic evidence",
          "spectral_artifacts": "Forensic evidence",
          "code_switching": "Forensic evidence"
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
          { text: `LIVE_FORENSIC_CHUNK: Detect AI voice clone or scam intent. Selected Gateway: ${language}. 
          CRITICAL: If the detected language is NOT ${language}, set "is_mismatch": true.
          Output JSON: {"verdict": "Verdict", "confidence": 0-1, "current_intent": "intent string", "is_mismatch": boolean}` }
        ],
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text || "{}");
      onUpdate(data);
    }
  };
};