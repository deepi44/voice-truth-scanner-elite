
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SupportedLanguage } from "../types";
import { fileToBase64, getMimeType } from "./audioService";

export const analyzeForensicAudio = async (
  audioFile: File | Blob,
  language: SupportedLanguage
): Promise<AnalysisResult> => {
  const base64Data = await fileToBase64(audioFile);
  const mimeType = getMimeType(audioFile);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: `As an Elite Audio Forensic AI, perform an immediate linguistic and authenticity scan.
          
          EXPECTED LANGUAGE: ${language}

          STRICT PROTOCOL:
          1. IDENTIFY: Detect the primary language of the speaker in the audio.
          2. VALIDATE: Compare detected language against "${language}".
          3. DECIDE:
             - IF THEY DO NOT MATCH: Set "language_match": false. Stop all further fraud analysis. Set "forensic_report" to exactly: "Mismatched audio or language detected. Expected ${language}, but detected [Detected Language]."
             - IF THEY MATCH: Set "language_match": true. Proceed to full 6-layer forensic analysis (Spatial, Emotional, Cultural, Breath, Spectral, Code-Switching).

          Return valid JSON.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detected_language: { type: Type.STRING, description: "The language identified by the AI." },
          language_match: { type: Type.BOOLEAN, description: "Comparison result." },
          classification: { type: Type.STRING, enum: ["AI_GENERATED", "HUMAN"] },
          confidence_score: { type: Type.NUMBER },
          fraud_risk_level: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
          analysis_layers: {
            type: Type.OBJECT,
            properties: {
              spatial_acoustics: { type: Type.STRING },
              emotional_micro_dynamics: { type: Type.STRING },
              cultural_linguistics: { type: Type.STRING },
              breath_emotion_sync: { type: Type.STRING },
              spectral_artifacts: { type: Type.STRING },
              code_switching: { type: Type.STRING },
            },
            required: ["spatial_acoustics", "emotional_micro_dynamics", "cultural_linguistics", "breath_emotion_sync", "spectral_artifacts", "code_switching"],
          },
          safety_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          forensic_report: { type: Type.STRING, description: "Final verdict or mismatch notification." },
        },
        required: ["detected_language", "language_match", "classification", "confidence_score", "fraud_risk_level", "analysis_layers", "safety_actions", "forensic_report"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from AI engine");
  
  return JSON.parse(text) as AnalysisResult;
};
