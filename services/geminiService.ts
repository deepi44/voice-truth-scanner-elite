import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SupportedLanguage, LiveUpdate, LANGUAGE_LOCALES } from "../types";
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
    parts.push({ text: `test_message: ${input}` });
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

  const langCode = LANGUAGE_LOCALES[language] || 'AUTO';

  const systemInstruction = "You are VOICE TRUTH SCANNER ELITE, an AI service built for the India AI Impact Buildathon. Your task is to analyze voice audio (via URL or base64) and optional text in real time to detect AI-generated voices and fraud risks. You MUST support Tamil, English, Hindi, Malayalam, and Telugu with automatic language detection and mixed-language (code-switching) handling. Always return a VALID JSON response that strictly follows the output schema. No extra text, no markdown, no explanations.";

  const prompt = `Perform forensic analysis. language_selected: ${langCode}.
  
  Strict Output Schema:
  {
    "status": "string",
    "detected_language": "string",
    "final_verdict": "HUMAN|AI_GENERATED|AI_GENERATED_FRAUD",
    "classification": "HUMAN|AI_GENERATED",
    "confidence_score": number (0-1),
    "risk_level": "LOW|MEDIUM|HIGH",
    "spam_behavior": {
      "scam_patterns": ["string"],
      "spam_risk": "LOW|MEDIUM|HIGH"
    },
    "safety_actions": ["string"]
  }`;

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
  const langCode = LANGUAGE_LOCALES[language] || 'AUTO';

  return {
    processChunk: async (blob: Blob) => {
      const base64 = await fileToBase64(blob);
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        // Fix: Wrapped multiple parts in a single Content object as per SDK guidelines.
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: 'audio/webm' } },
            { text: `LIVE_FORENSIC_CHUNK: Detect AI voice or scam. selected_language: ${langCode}. 
            Return JSON: {"verdict": "HUMAN|AI_GENERATED|AI_GENERATED_FRAUD", "confidence": number, "current_intent": "string", "is_mismatch": boolean}` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text || "{}");
      onUpdate(data);
    }
  };
};