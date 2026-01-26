
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
          text: `VOICE TRUTH SCANNER ELITE - FORENSIC PROTOCOL
          
          EXPECTED OPERATIONAL LANGUAGE: ${language}

          TASK 1: LANGUAGE DETECTION
          Detect the actual primary language spoken in the audio.
          
          TASK 2: MATCH VERIFICATION
          Compare the detected language with the expected language: ${language}.
          If they do not match:
          - Set "language_match": false
          - Set "forensic_report": "CRITICAL: Input audio language does not match selected system locale (${language})."
          - Populate all other required fields (classification, layers, etc.) with default/fallback values indicating "INCONCLUSIVE DUE TO MISMATCH".

          TASK 3: 6-LAYER FORENSIC ANALYSIS (Only if Task 2 succeeds)
          Perform a deep spectral and acoustic reasoning scan based on these 6 conceptual layers:
          Layer 1 – Spatial Acoustic Reality: Analyze room reverberation vs AI sterility.
          Layer 2 – Emotional Micro-Tremors: Detect 8–15Hz vocal instabilities unique to human emotion.
          Layer 3 – Cultural Idiom Timing: Check natural timing of ${language}-specific conversational slang.
          Layer 4 – Breath-Emotion Synchronization: Verify if breath intake aligns with emotional emphasis.
          Layer 5 – Synthetic Spectral Fingerprints: Search for frequency consistency artifacts found in AI models.
          Layer 6 – Natural Code-Switch Flow: Analyze transitions between languages for robotic signatures.

          IMPORTANT: You MUST return a complete JSON object matching the provided schema even if Task 2 fails. If Task 2 fails, set confidence_score to 0 and fraud_risk_level to LOW.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detected_language: { type: Type.STRING, description: "The language detected in the audio file." },
          language_match: { type: Type.BOOLEAN, description: "True if detected_language matches the expected language." },
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
          forensic_report: { type: Type.STRING },
        },
        required: ["detected_language", "language_match", "classification", "confidence_score", "fraud_risk_level", "analysis_layers", "safety_actions", "forensic_report"],
      },
    },
  });

  const text = response.text;
  if (!text || text.trim() === "") {
    console.error("Gemini API Response Object:", response);
    throw new Error("Forensic engine failed to return data. This may be due to safety filtering or input size.");
  }
  
  try {
    return JSON.parse(text) as AnalysisResult;
  } catch (parseError) {
    console.error("Failed to parse JSON response:", text);
    throw new Error("Forensic engine returned invalid data format.");
  }
};