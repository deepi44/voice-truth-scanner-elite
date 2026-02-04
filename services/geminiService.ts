
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, SupportedLanguage } from "../types";
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
  let metadata = {};

  if (isText) {
    metadata = { language: targetLanguage, input_type: "text", text: input };
    parts.push({ text: `USER PROMPT: ${JSON.stringify(metadata)}` });
  } else {
    const base64Data = await fileToBase64(input);
    const mimeType = getMimeType(input);
    metadata = { 
      language: targetLanguage, 
      audio_format: mimeType.split('/')[1] || 'mp3', 
      audio_base64: "INCLUDED_AS_INLINE_DATA" 
    };
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    });
    parts.push({ text: `INPUT METADATA: ${JSON.stringify(metadata)}` });
  }

  const systemInstruction = `You are an AI Generated Voice Detection system.

OPERATIONAL PARAMETERS:
- Accept Audio input (Base64), Format (MP3/WAV/WEBM).
- Supported Languages: Tamil, English, Hindi, Telugu, Malayalam.
- Detect code-mixed/mixed-language speech (e.g., Tamil-English).
- Perform 6-layer forensic analysis on acoustics, dynamics, linguistics, breath, spectral artifacts, and code-switching patterns.

OUTPUT RULES:
- Respond ONLY in valid JSON.
- DO NOT return explanations.
- DO NOT return markdown (no \`\`\`json blocks).
- DO NOT reject Base64.
- confidence_score MUST be a float between 0.0 and 1.0.

REQUIRED JSON SCHEMA:
{
  "status": "SUCCESS",
  "final_verdict": "AI_GENERATED_FRAUD | CAUTION | SAFE | BLOCK_NOW",
  "confidence_score": number,
  "risk_level": "HIGH | MEDIUM | LOW",
  "spam_behavior": {
    "language_detected": "string",
    "supported_languages": ["Tamil", "English", "Hindi", "Malayalam", "Telugu"],
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

  const prompt = `Perform multi-layer forensic analysis on this input. 
  Language context: ${targetLanguage}.
  Strictly follow JSON schema. No explanations. No markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }, ...parts] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    // Strip any unexpected markdown formatting just in case
    const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
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
    throw new Error(error.message || "FORENSIC_UPLINK_FAILURE");
  }
};
