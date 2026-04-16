import { GoogleGenerativeAI } from "@google/generative-ai";
import { CompanyProfile, EvaluatorType, FocusMode, Difficulty, Message, ScoreReport } from "../types";
import { CATEGORIES, FOCUS_WEIGHTS, EVALUATOR_EMPHASIS } from "../constants";

// For the stable SDK, we use the standard model names.
// "gemini-2.0-flash-thinking-exp" is the current active alias for the thinking model.
const MODEL_NAME = "gemini-3-flash-preview";

export const GeminiService = {
  getAI: () => {
    // @ts-ignore
    const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
    const key = env?.VITE_GEMINI_API_KEY || env?.GEMINI_API_KEY || "MY_GEMINI_API_KEY";
    
    if (key === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: Using default placeholder GEMINI_API_KEY! API requests will fail.");
    }
    
    return new GoogleGenerativeAI(key);
  },

  generateQuestion: async (
    profile: CompanyProfile,
    evaluator: EvaluatorType,
    focus: FocusMode,
    difficulty: Difficulty,
    transcript: Message[]
  ): Promise<{ question: string; context: string; nudge?: string }> => {
    const genAI = GeminiService.getAI();
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
      },
      // @ts-ignore
      thinkingConfig: { include_thoughts: true }
    });
    
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
      8. POLICY CHECK: At an appropriate point during the simulation, strictly check if the founder actually understands the legal and regulatory policies governing their business in their region of operation.
      
      Return JSON format:
      {
        "question": "The question text",
        "context": "Short context about your persona's mood (e.g., 'Skeptical, looking for numbers')",
        "nudge": "Optional string if the founder was off-topic or vague in the previous turn"
      }
    `;

    const chat = model.startChat({
      history: transcript.length > 0 
        ? transcript.map(m => ({ 
            role: m.role === 'investor' ? 'model' : 'user', 
            parts: [{ text: m.content }] 
          }))
        : [],
    });

    const prompt = transcript.length === 0 
      ? `${systemInstruction}\n\nStart the simulation.` 
      : `${systemInstruction}\n\nContinue the simulation based on the history above.`;

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    try {
      return JSON.parse(responseText || "{}");
    } catch (e) {
      console.error("Failed to parse AI response", responseText);
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
    const genAI = GeminiService.getAI();
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
      },
      // @ts-ignore
      thinkingConfig: { include_thoughts: true }
    });
    
    const weights = FOCUS_WEIGHTS[focus];
    
    const prompt = `
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
      
      Transcript:
      ${JSON.stringify(transcript)}

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

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const rawResult = JSON.parse(responseText || "{}");
    
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
