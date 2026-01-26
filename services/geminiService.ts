
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SupportedLanguage } from "../types";
import { fileToBase64, getMimeType } from "./audioService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeForensicAudio = async (
  audioFile: File | Blob,
  language: SupportedLanguage
): Promise<AnalysisResult> => {
  const base64Data = await fileToBase64(audioFile);
  const mimeType = getMimeType(audioFile);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `As an Elite Audio Forensic AI Specialist, analyze this audio sample for voice authenticity. 
            The spoken language is primarily ${language}. 
            
            Perform a 6-layer deep scan:
            1. Spatial Acoustic Reality: Check for real-world reverberation and mic noise.
            2. Emotional Micro-Tremors: Detect 8-15Hz human vocal instabilities.
            3. Cultural Idiom Timing: Analyze natural flow of cultural expressions.
            4. Breath-Emotion Synchronization: Verify if breath cycles match emotional intensity.
            5. Synthetic Spectral Fingerprints: Search for clean digital frequency artifacts.
            6. Natural Code-Switch Flow: Check multilingual transitions.

            Return the results in strict JSON format according to the provided schema.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          classification: { 
            type: Type.STRING, 
            description: "AI_GENERATED or HUMAN" 
          },
          confidence_score: { 
            type: Type.NUMBER, 
            description: "Probability score from 0.0 to 1.0" 
          },
          fraud_risk_level: { 
            type: Type.STRING, 
            description: "HIGH, MEDIUM, or LOW" 
          },
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
            required: [
              "spatial_acoustics", 
              "emotional_micro_dynamics", 
              "cultural_linguistics", 
              "breath_emotion_sync", 
              "spectral_artifacts", 
              "code_switching"
            ],
          },
          safety_actions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Suggested immediate actions"
          },
          forensic_report: { 
            type: Type.STRING, 
            description: "A comprehensive summary of the verification findings" 
          },
        },
        required: [
          "classification", 
          "confidence_score", 
          "fraud_risk_level", 
          "analysis_layers", 
          "safety_actions", 
          "forensic_report"
        ],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from AI engine");
  
  return JSON.parse(text) as AnalysisResult;
};
