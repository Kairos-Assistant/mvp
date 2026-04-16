export type Stage = 'idea' | 'MVP' | 'traction' | 'revenue' | 'scale';
export type EvaluatorType = 'VC' | 'Angel Investor' | 'Incubator' | 'Accelerator' | 'Pitch Competition';
export type FocusMode = 'Idea' | 'Business Model' | 'Traction' | 'Full';
export type Difficulty = 'Friendly' | 'Neutral' | 'Aggressive';
export type RoundLength = '2' | '5' | '10'; // Minutes

export interface CompanyProfile {
  id: string;
  name: string;
  oneLiner: string;
  targetSegment: string;
  businessModel: string;
  stage: Stage;
  tractionNotes: string;
  email?: string;
  // Optional fields
  marketGeography?: string;
  pricing?: string;
  distributionChannels?: string;
  competition?: string;
  teamSummary?: string;
  fundingAsk?: string;
  metrics?: string;
  createdAt: string;
  updatedAt: string;
  preferredEvaluator?: EvaluatorType;
  preferredFocus?: FocusMode;
}

export interface Message {
  role: 'investor' | 'founder' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    questionId?: string;
    categoryTargets?: string[];
    isOffTopic?: boolean;
    isVague?: boolean;
  };
}

export interface CategoryScore {
  score: number; // 0-100
  avgRawScore: number; // 0-4
  explanation: string;
}

export interface ScoreReport {
  convictionScore: number; // 0-100
  confidenceLevel: 'Low' | 'Medium' | 'High';
  coverageScore: number; // 0-100
  categoryScores: Record<string, CategoryScore>;
  penalties: {
    integrityPenalty: number;
    contradictionFlags: string[];
  };
  strengths: string[];
  fixNext: {
    item: string;
    transcriptIndex: number;
  }[];
  investorSummary: string;
}

export interface SimulationSession {
  id: string;
  companyProfileId: string;
  evaluatorType: EvaluatorType;
  focusType: FocusMode;
  difficulty: Difficulty;
  roundLength: number; // minutes
  createdAt: string;
  transcript: Message[];
  scores: ScoreReport;
  tags: string[];
}
