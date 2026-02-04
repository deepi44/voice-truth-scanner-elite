
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SupportedLanguage, LiveUpdate, LANGUAGE_LOCALES } from "../types";
import { fileToBase64, getMimeType } from "./audioService";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeForensicInput = async (
  input: File | Blob | string,
  targetLanguage: SupportedLanguage,
  retries = 2
): Promise<AnalysisResult> => {
  const isText = typeof input === 'string';
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let parts: any[] = [];
  
  if (isText) {
    parts.push({ text: `user_text_message: ${input}` });
  } else {
    const base64Data = await fileToBase64(input);
    const mimeType = getMimeType(input);
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    });
  }

  const systemInstruction = `You are VOICE TRUTH SCANNER ELITE, an advanced multi-language AI system designed for real-time fraud detection and AI-generated voice identification.

STRICT OUTPUT RULES:
- Respond ONLY with valid JSON.
- No explanations, no markdown, no extra text.

FINAL JSON OUTPUT FORMAT (EXACT):
{
  "status": "SUCCESS",
  "final_verdict": "SAFE | CAUTION | AI_GENERATED_FRAUD | BLOCK_NOW",
  "confidence_score": number (0.0 to 1.0),
  "risk_level": "LOW | MEDIUM | HIGH",
  "spam_behavior": {
    "language_detected": "string",
    "supported_languages": ["Tamil", "English", "Hindi", "Malayalam", "Telugu"],
    "scam_patterns": ["string"],
    "spam_risk": "LOW | MEDIUM | HIGH"
  },
  "voice_forensics": {
    "classification": "HUMAN | AI_GENERATED",
    "analysis_layers": {
      "spatial_acoustics": "string",
      "emotional_micro_dynamics": "string",
      "cultural_linguistics": "string",
      "breath_emotion_sync": "string",
      "spectral_artifacts": "string",
      "code_switching": "string"
    }
  },
  "safety_actions": ["IGNORE", "BLOCK", "REPORT"],
  "forensic_evidence": {
    "timestamp": "ISO_STRING",
    "sha256_hash": "HEX_STRING",
    "blockchain_proof": "ipfs://CID"
  }
}`;

  const prompt = `Perform forensic analysis on input. 
  TARGET_IDENTITY_PROFILE_LANGUAGE: ${targetLanguage}.
  Return valid JSON matching the exact schema provided. Ensure confidence_score is between 0.0 and 1.0.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }, ...parts] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      ...parsed,
      id: crypto.randomUUID(),
      operator: "SECURE_NODE_ELITE_01"
    };

  } catch (error: any) {
    if (retries > 0 && error.message?.includes('overloaded')) {
      await sleep(1500);
      return analyzeForensicInput(input, targetLanguage, retries - 1);
    }
    throw new Error(error.message || "UPLINK_TIMEOUT");
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
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: 'audio/webm' } },
            { text: `LIVE_FORENSIC_CHUNK_UPDATE: Return JSON: {"verdict": "string", "confidence": number, "current_intent": "string", "is_mismatch": boolean}` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text || "{}");
      onUpdate(data);
    }
  };
};
