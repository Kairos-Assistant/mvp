import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { CompanyProfile, EvaluatorType, FocusMode, Difficulty, Message, ScoreReport } from "../types";
import { CATEGORIES, FOCUS_WEIGHTS, EVALUATOR_EMPHASIS } from "../constants";

const MODEL_NAME = "gemini-3-flash-preview";

export const GeminiService = {
  getAI: () => {
    // Vite does not support process.env in the browser. 
    // We must use a safe check for import.meta.env or a dynamic window property.
    // @ts-ignore
    const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
    const key = env?.VITE_GEMINI_API_KEY || "MY_GEMINI_API_KEY";
    return new GoogleGenAI({ apiKey: key });
  },

  generateQuestion: async (
    profile: CompanyProfile,
    evaluator: EvaluatorType,
    focus: FocusMode,
    difficulty: Difficulty,
    transcript: Message[]
  ): Promise<{ question: string; context: string; nudge?: string }> => {
    const ai = GeminiService.getAI();
    
    const systemInstruction = `
      You are a ${evaluator} conducting an investor-readiness simulation for a founder.
      Your focus is strictly on: ${focus}.
      Your persona is ${difficulty}.
      The company profile is:
      - Name: ${profile.name}
      - One-liner: ${profile.oneLiner}
      - Target Segment: ${profile.targetSegment}
      - Business Model: ${profile.businessModel}
      - Stage: ${profile.stage}
      - Traction: ${profile.tractionNotes}
      
      Emphasis for this evaluator type: ${EVALUATOR_EMPHASIS[evaluator]}
      
      Rules:
      1. Ask ONE contextually relevant investor question.
      2. Adhere strictly to the selected focus (${focus}).
      3. Be extremely concise and fast. No fluff.
      4. Do not ramble. Be crisp.
      5. Do not coach or give answers.
      6. If the founder was off-topic in the previous turn, nudge them back to focus.
      7. IMPORTANT: If this is the FIRST question (transcript is empty), you MUST start by briefly repeating what the founder is working on (e.g., "So, you're building [One-liner] for [Target Segment]. My first question is...") before asking your question.
      
      Return JSON format:
      {
        "question": "The question text",
        "context": "Short context about your persona's mood (e.g., 'Skeptical, looking for numbers')",
        "nudge": "Optional string if the founder was off-topic or vague in the previous turn"
      }
    `;

    const contents = transcript.length > 0 
      ? transcript.map(m => ({ role: m.role === 'investor' ? 'model' : 'user', parts: [{ text: m.content }] }))
      : [{ role: 'user', parts: [{ text: "Start the simulation." }] }];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            context: { type: Type.STRING },
            nudge: { type: Type.STRING, description: "Optional nudge if the founder was off-topic" }
          },
          required: ["question", "context"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse AI response", response.text);
      return {
        question: "Could you elaborate more on your business model?",
        context: "Skeptical, looking for clarity."
      };
    }
  },

  scoreSession: async (
    profile: CompanyProfile,
    focus: FocusMode,
    transcript: Message[],
    roundLength: number
  ): Promise<ScoreReport> => {
    const ai = GeminiService.getAI();
    
    const weights = FOCUS_WEIGHTS[focus];
    
    const systemInstruction = `
      You are an expert investor analyst. Score the following founder interview transcript.
      
      Company Profile:
      - Name: ${profile.name}
      - One-liner: ${profile.oneLiner}
      - Stage: ${profile.stage}
      
      Focus: ${focus}
      Round Length: ${roundLength} minutes
      
      Scoring Rubric (0-4 scale):
      0: Missing / incoherent
      1: Weak, vague, unconvincing
      2: Decent but incomplete
      3: Strong, clear, backed
      4: Investor-grade
      
      Categories to score:
      ${CATEGORIES.join(", ")}
      
      Rules:
      1. For each category, provide a raw score (0-4) and a brief explanation.
      2. Identify Top 3 Strengths.
      3. Identify Top 3 Fix-Next items. For each, specify the index of the message in the transcript that triggered it.
      4. Detect contradictions or claims without evidence for the "Consistency & Integrity" category.
      5. Calculate a Coverage Score (0-100) based on how many aspects of the focus were tested.
      6. Determine a Confidence Level (Low, Medium, High). 
      7. Provide a short investor-style summary.
      
      Return JSON format:
      {
        "categoryScores": {
          "Category Name": { "avgRawScore": 2.5, "explanation": "..." }
        },
        "coverageScore": 85,
        "confidenceLevel": "Medium",
        "strengths": ["...", "...", "..."],
        "fixNext": [
          { "item": "...", "transcriptIndex": 2 }
        ],
        "investorSummary": "...",
        "penalties": {
          "integrityPenalty": 0,
          "contradictionFlags": []
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ parts: [{ text: JSON.stringify(transcript) }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const rawResult = JSON.parse(response.text || "{}");
    
    let convictionScore = 0;
    const categoryScores: Record<string, any> = {};
    
    for (const cat of CATEGORIES) {
      const raw = rawResult.categoryScores[cat] || { avgRawScore: 0, explanation: "Not assessed" };
      const normalized = (raw.avgRawScore / 4) * 100;
      categoryScores[cat] = {
        score: normalized,
        avgRawScore: raw.avgRawScore,
        explanation: raw.explanation
      };
      convictionScore += normalized * (weights[cat] || 0);
    }
    
    convictionScore = Math.max(0, convictionScore - (rawResult.penalties?.integrityPenalty || 0));

    // Post-process confidence level to ensure it's not "High" if score is very low
    let finalConfidence = rawResult.confidenceLevel;
    if (convictionScore < 40 && finalConfidence === "High") {
      finalConfidence = "Medium";
    }
    if (convictionScore < 20) {
      finalConfidence = "Low";
    }

    return {
      convictionScore: Math.round(convictionScore),
      confidenceLevel: finalConfidence,
      coverageScore: rawResult.coverageScore,
      categoryScores,
      penalties: rawResult.penalties,
      strengths: rawResult.strengths,
      fixNext: rawResult.fixNext,
      investorSummary: rawResult.investorSummary
    };
  }
};
