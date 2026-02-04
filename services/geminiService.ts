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

  const systemInstruction = `You are VOICE TRUTH SCANNER ELITE, an advanced multi-language AI system designed for real-time fraud detection and AI-generated voice identification for the India AI Impact Buildathon.

You will receive audio input and must perform a 6-layer forensic analysis.

STRICT OUTPUT RULES:
- Respond ONLY with valid JSON.
- No explanations, no markdown, no extra text.

SUPPORTED LANGUAGES: Tamil, English, Hindi, Malayalam, Telugu.

FINAL JSON OUTPUT FORMAT (EXACT):
{
  "status": "SUCCESS",
  "final_verdict": "SAFE | CAUTION | AI_GENERATED_FRAUD | BLOCK_NOW",
  "confidence_score": number (STRICTLY a value between 0.0 and 1.0),
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
      "layer_1_spatial_acoustics": "string",
      "layer_2_emotional_micro_tremors": "string",
      "layer_3_cultural_speech_timing": "string",
      "layer_4_breath_emotion_sync": "string",
      "layer_5_spectral_artifacts": "string",
      "layer_6_code_switching": "string"
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
  
  Examine spatial acoustics, micro-tremors, cultural timing, breath sync, and spectral artifacts.
  Return valid JSON matching the exact schema provided in system instructions.
  Ensure confidence_score is a normalized probability between 0 and 1.`;

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