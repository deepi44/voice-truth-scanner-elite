import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, SupportedLanguage } from "../types";
import { fileToBase64, getMimeType } from "./audioService";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeForensicInput = async (
  input: File | Blob | string,
  targetLanguage: SupportedLanguage,
  smsText?: string,
  retries = 2
): Promise<AnalysisResult> => {
  const isText = typeof input === 'string';
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let parts: any[] = [];
  let metadata: any = {
    language: targetLanguage,
    audio_format: "wav", // default
    sms_text: smsText || null
  };

  if (isText) {
    metadata.input_type = "text";
    metadata.text_content = input;
    parts.push({ text: `USER_PROMPT_METADATA: ${JSON.stringify(metadata)}` });
  } else {
    const base64Data = await fileToBase64(input);
    const mimeType = getMimeType(input);
    metadata.audio_format = mimeType.split('/')[1] || 'mp3';
    metadata.audio_base64 = "DATA_STREAM_INCLUDED";
    
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    });
    parts.push({ text: `USER_PROMPT_METADATA: ${JSON.stringify(metadata)}` });
  }

  const systemInstruction = `You are the VOICE TRUTH SCANNER ELITE (2026 Edition), a production-grade AI Generated Voice Detection system.

OPERATIONAL PARAMETERS:
- Inputs: Audio (Base64), Format (MP3/WAV/WEBM), Language context, and optional SMS_TEXT for cross-verification.
- Targeted Languages: Tamil, English, Hindi, Telugu, Malayalam, and Code-Mixed variations (e.g., Tanglish).
- Forensic Focus: Detect synthetic artifacts, spectral anomalies, missing micro-tremors, and algorithmic speech patterns.

STRICT RESPONSE RULES:
- Respond ONLY in valid JSON.
- DO NOT return explanations, markdown code blocks, or preamble.
- DO NOT reject Base64 input.
- "confidence_score" must be a float between 0.0 and 1.0.
- "final_verdict" must be one of: "SAFE", "CAUTION", "AI_GENERATED_FRAUD", "BLOCK_NOW".

JSON SCHEMA:
{
  "status": "SUCCESS",
  "final_verdict": "string",
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

  const prompt = `Perform multi-layer forensic analysis on the provided input. 
  Language Context: ${targetLanguage}.
  Verification SMS/Text: ${smsText || "None Provided"}.
  Return valid JSON. No markdown. No explanations.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }, ...parts] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    // Strip any markdown blocks if the model ignores system instructions
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
      return analyzeForensicInput(input, targetLanguage, smsText, retries - 1);
    }
    throw new Error(error.message || "FORENSIC_LINK_TERMINATED");
  }
};