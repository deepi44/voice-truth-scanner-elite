
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SupportedLanguage } from "../types";
import { fileToBase64, getMimeType } from "./audioService";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeForensicAudio = async (
  audioFile: File | Blob,
  language: SupportedLanguage,
  retries = 3 // Increased retries
): Promise<AnalysisResult> => {
  const base64Data = await fileToBase64(audioFile);
  const mimeType = getMimeType(audioFile);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `VOICE TRUTH SCANNER ELITE - CHALLENGE 1 PROTOCOL
            
            TASK: Perform real-time forensic audio analysis for Fraud and Spam detection.
            
            PHASE 1: LANGUAGE GATEWAY (MANDATORY)
            - Detect language. User selected: "${language}".
            - If detected != "${language}": Stop and report mismatch.
            
            PHASE 2: DEEP PATTERN & BEHAVIORAL ANALYSIS
            - Analyze Audio Patterns: Voice cloning artifacts (AI) vs human stress.
            - Extract Keywords: Identify financial red flags (OTP, Account, Bank, IRS, Urgent, Blocked).
            - Behavioral Analysis: Detect high-pressure tactics, social engineering, impersonation, or suspicious silence patterns.
            
            PHASE 3: VERDICT
            - Set "is_scam": true if the call intent appears fraudulent or spam-related.
            - Set "classification": "AI_GENERATED" or "HUMAN".
            - Set "scam_keywords": List of suspicious words found.
            
            RETURN VALID JSON SCHEMA ONLY.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected_language: { type: Type.STRING },
            language_match: { type: Type.BOOLEAN },
            classification: { type: Type.STRING, enum: ["AI_GENERATED", "HUMAN"] },
            is_scam: { type: Type.BOOLEAN },
            scam_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                behavioral_threats: { type: Type.STRING },
              },
              required: ["spatial_acoustics", "emotional_micro_dynamics", "cultural_linguistics", "breath_emotion_sync", "spectral_artifacts", "code_switching", "behavioral_threats"],
            },
            safety_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            forensic_report: { type: Type.STRING },
          },
          required: ["detected_language", "language_match", "classification", "is_scam", "scam_keywords", "confidence_score", "fraud_risk_level", "analysis_layers", "safety_actions", "forensic_report"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from forensic uplink.");
    return JSON.parse(text) as AnalysisResult;

  } catch (error: any) {
    const errorString = JSON.stringify(error);
    const isOverloaded = errorString.includes('503') || errorString.includes('overloaded') || error.message?.includes('503') || error.message?.includes('overloaded');
    
    if (retries > 0 && isOverloaded) {
      // Exponential backoff: 2s, 4s, 8s...
      const waitTime = (4 - retries) * 2000;
      await sleep(waitTime);
      return analyzeForensicAudio(audioFile, language, retries - 1);
    }
    
    console.error("Forensic Engine Critical Failure:", error);
    throw new Error(isOverloaded ? "MODEL OVERLOADED: The forensic grid is under heavy load. Please re-sync in a few seconds." : (error.message || "SIGNAL DISTURBANCE"));
  }
};
