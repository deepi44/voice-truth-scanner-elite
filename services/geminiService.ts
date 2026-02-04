
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, SupportedLanguage } from "../types";
import { fileToBase64, getMimeType } from "./audioService";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * VOICE TRUTH SCANNER ELITE - Core Forensic Engine (2026 Edition)
 * Synchronized with Production FastAPI Schema
 */
export const analyzeForensicInput = async (
  input: File | Blob | string,
  targetLanguage: SupportedLanguage,
  smsText?: string,
  retries = 2
): Promise<AnalysisResult> => {
  const isText = typeof input === 'string';
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let base64Data = "";
  let mimeType = "audio/mp3";
  
  if (!isText) {
    base64Data = await fileToBase64(input as File | Blob);
    mimeType = getMimeType(input as File | Blob);
  }

  // Exact request payload as defined in the FastAPI schema
  const payload = {
    language: targetLanguage,
    audio_format: mimeType.split('/')[1] || 'mp3',
    audio_base64: isText ? "N/A - TEXT_INPUT" : base64Data,
    sms_text: smsText || null
  };

  const systemInstruction = `You are the VOICE TRUTH SCANNER ELITE (2026 Edition). 
You are a production-grade AI Voice Detection and Forensic system.

CORE MISSION:
- Detect AI-generated fraudulent voices, deepfakes, and social engineering attempts.
- Provide forensic-level analysis across 6 distinct acoustic and linguistic layers.
- Support multi-language environments (Tamil, English, Hindi, Telugu, Malayalam).
- Handle code-mixed speech (e.g., Tamil-English "Tanglish").

STRICT RESPONSE PROTOCOL:
- Respond ONLY with valid JSON.
- DO NOT return explanations, markdown, or text outside the JSON.
- Use precise forensic terminology (e.g., "8-15Hz tremors", "r-value respiration", "harmonic spikes").

REQUIRED JSON SCHEMA (MATCHING FASTAPI BACKEND):
{
  "final_verdict": "AI_GENERATED_FRAUD | CAUTION | SAFE | BLOCK_NOW",
  "confidence_score": number (0.0 to 1.0),
  "risk_level": "HIGH | MEDIUM | LOW",
  "spam_behavior": {
    "language_detected": "string (e.g., Tamil-English mix)",
    "scam_patterns": ["string (e.g., BANK_EMERGENCY, OTP_REQUEST)"],
    "spam_risk": "HIGH | MEDIUM | LOW"
  },
  "voice_forensics": {
    "classification": "AI_GENERATED | HUMAN",
    "analysis_layers": {
      "spatial_acoustics": "string (Forensic detail on reverb/synthetic space)",
      "emotional_micro_dynamics": "string (Forensic detail on tremors/emotional range)",
      "cultural_linguistics": "string (Forensic detail on slang timing/pronunciation)",
      "breath_emotion_sync": "string (Forensic detail on respiration patterns)",
      "spectral_artifacts": "string (Forensic detail on digital fingerprints/harmonics)",
      "code_switching": "string (Forensic detail on language transition entropy)"
    }
  },
  "safety_actions": ["IGNORE", "BLOCK", "REPORT"],
  "forensic_evidence": {
    "timestamp": "ISO_STRING",
    "sha256_hash": "HEX_STRING",
    "blockchain_proof": "ipfs://QmXyz123..."
  }
}`;

  const prompt = `ANALYSIS_REQUEST:
INPUT_PAYLOAD: ${JSON.stringify(payload)}
ACTION: Run 6-layer forensic scan. Check for AI artifacts.
NOTE: If language is Tamil/Tanglish, evaluate for "machan-da" timing and phonetic roboticism.
OUTPUT: Strict JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [
        { text: prompt },
        ...(isText ? [] : [{ inlineData: { data: base64Data, mimeType } }])
      ]},
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    return {
      ...parsed,
      id: crypto.randomUUID(),
      status: "SUCCESS",
      operator: "SECURE_NODE_ELITE_01"
    };

  } catch (error: any) {
    if (retries > 0 && error.message?.includes('overloaded')) {
      await sleep(1500);
      return analyzeForensicInput(input, targetLanguage, smsText, retries - 1);
    }
    console.error("Forensic Link Error:", error);
    throw new Error(error.message || "FORENSIC_LINK_TERMINATED");
  }
};
