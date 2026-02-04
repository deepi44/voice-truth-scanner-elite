
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, SupportedLanguage } from "../types";
import { fileToBase64, getMimeType } from "./audioService";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * VOICE TRUTH SCANNER ELITE - Core Forensic Engine (2026 Edition)
 * Optimized for real-time deepfake detection and multi-language scam analysis.
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
You are a production-grade AI Voice Fraud Detection and Forensic engine.

STRICT OPERATIONAL PARAMETERS:
1. You analyze audio data (Base64) and SMS/Text content for cross-verification.
2. You support: Tamil, English, Hindi, Telugu, Malayalam, and "Tanglish" (Tamil-English mix).
3. Analyze for "Machan-da" timing (robotic cadence), 8-15Hz micro-tremor loss, and synthetic reverb patterns.
4. If "sms_text" contains words like "otp", "bank", "sollunga", "pesren", flag as high-risk Tamil scam patterns.

RESPONSE PROTOCOL:
- Respond ONLY in valid, parseable JSON.
- NO markdown formatting (no \`\`\`json). NO explanations.
- If the input is Base64, analyze the voice for deepfake artifacts.

REQUIRED JSON SCHEMA:
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
      "spatial_acoustics": "string (e.g., Uniform 38ms reverb - synthetic)",
      "emotional_micro_dynamics": "string (e.g., Missing 8-15Hz tremors - AI indicator)",
      "cultural_linguistics": "string (e.g., Robotic machan-da timing)",
      "breath_emotion_sync": "string (e.g., Algorithmic respiration)",
      "spectral_artifacts": "string (e.g., 2026 AI fingerprints detected)",
      "code_switching": "string (e.g., Patterned Tamil to English transitions)"
    }
  },
  "safety_actions": ["IGNORE", "BLOCK", "REPORT"],
  "forensic_evidence": {
    "timestamp": "ISO_STRING",
    "sha256_hash": "HEX_STRING (shortened)",
    "blockchain_proof": "ipfs://QmXyz..."
  }
}`;

  const prompt = `FORENSIC_ANALYSIS_REQUEST:
{
  "audio_base64": "${isText ? "N/A" : "DATA_STREAM_INCLUDED"}",
  "sms_text": "${smsText || ""}",
  "target_language": "${targetLanguage}"
}

Run 6-layer forensic scan. Check for Tamil/English linguistic roboticism. Return JSON only.`;

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
    throw new Error("FORENSIC_LINK_FAILURE");
  }
};
