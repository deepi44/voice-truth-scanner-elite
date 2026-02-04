
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, SupportedLanguage } from "../types";
import { fileToBase64, getMimeType } from "./audioService";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * VOICE TRUTH SCANNER ELITE - Core Forensic Engine (2026 Edition)
 * Synchronized with Production FastAPI Forensic Logic
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

  const systemInstruction = `You are the VOICE TRUTH SCANNER ELITE (2026 Edition).
You are a production-ready AI Generated Voice Detection and Forensic system.

STRICT OPERATIONAL RULES:
1. You accept audio as Base64 encoded strings (MP3/WAV).
2. You support: Tamil, English, Hindi, Telugu, Malayalam, and Code-Mixed variations.
3. Analyze for deepfake artifacts, robotic prosody, and synthetic harmonics.
4. Respond ONLY in valid, parseable JSON.
5. NO markdown formatting. NO code blocks (\`\`\`json). NO explanations.
6. If the input is Base64, do not reject it; treat it as the primary forensic evidence.

FORENSIC LAYER REQUIREMENTS:
- spatial_acoustics: Identify synthetic reverb/ambience.
- emotional_micro_dynamics: Detect missing 8-15Hz tremors typical of human speech.
- cultural_linguistics: Evaluate slang timing (e.g., "machan-da" timing vs robotic cadence).
- breath_emotion_sync: Check respiration correlation (human r > 0.7).
- spectral_artifacts: Identify harmonic spikes (e.g., 87Hz spikes).
- code_switching: Calculate transition entropy between languages.

JSON SCHEMA:
{
  "final_verdict": "AI_GENERATED_FRAUD | CAUTION | SAFE | BLOCK_NOW",
  "confidence_score": number (0.0 to 1.0),
  "risk_level": "HIGH | MEDIUM | LOW",
  "spam_behavior": {
    "language_detected": "string",
    "scam_patterns": ["string"],
    "spam_risk": "HIGH | MEDIUM | LOW"
  },
  "voice_forensics": {
    "classification": "AI_GENERATED | HUMAN",
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

  const prompt = `FORENSIC_ANALYSIS_REQUEST:
{
  "language": "${targetLanguage}",
  "audio_format": "${mimeType.split('/')[1] || 'mp3'}",
  "audio_base64": "${isText ? "N/A" : "DATA_STREAM_PROVIDED"}",
  "sms_text": "${smsText || ""}"
}

Perform 6-layer forensic scan now. Return valid JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { 
        parts: [
          { text: prompt },
          ...(isText ? [] : [{ inlineData: { data: base64Data, mimeType } }])
        ] 
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    // Clean any unexpected non-JSON clutter from the string
    const text = response.text || "{}";
    const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    
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
    console.error("Forensic Error:", error);
    throw new Error("FORENSIC_LINK_FAILURE: " + (error.message || "UNKNOWN_ERROR"));
  }
};
