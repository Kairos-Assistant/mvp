import { FocusMode } from "./types";

export const COLORS = {
  primary: "#6279b8",
  secondary: "#5aaa95",
  accent: "#c2948a",
  bg: "#ffffff",
};

export const CATEGORIES = [
  "Clarity",
  "Specificity & Evidence",
  "Market Understanding",
  "Business Model Coherence",
  "Traction & Execution Signals",
  "Defensibility / Moat",
  "Consistency & Integrity",
];

export const DEFAULT_WEIGHTS: Record<string, number> = {
  "Clarity": 0.15,
  "Specificity & Evidence": 0.20,
  "Market Understanding": 0.15,
  "Business Model Coherence": 0.15,
  "Traction & Execution Signals": 0.20,
  "Defensibility / Moat": 0.10,
  "Consistency & Integrity": 0.05,
};

export const FOCUS_WEIGHTS: Record<FocusMode, Record<string, number>> = {
  "Idea": {
    "Clarity": 0.25,
    "Market Understanding": 0.25,
    "Specificity & Evidence": 0.20,
    "Business Model Coherence": 0.15,
    "Defensibility / Moat": 0.10,
    "Consistency & Integrity": 0.05,
    "Traction & Execution Signals": 0.00,
  },
  "Business Model": {
    "Business Model Coherence": 0.30,
    "Specificity & Evidence": 0.20,
    "Market Understanding": 0.20,
    "Clarity": 0.15,
    "Defensibility / Moat": 0.10,
    "Consistency & Integrity": 0.05,
    "Traction & Execution Signals": 0.00,
  },
  "Traction": {
    "Traction & Execution Signals": 0.40,
    "Specificity & Evidence": 0.25,
    "Business Model Coherence": 0.15,
    "Market Understanding": 0.10,
    "Clarity": 0.05,
    "Consistency & Integrity": 0.05,
    "Defensibility / Moat": 0.00,
  },
  "Full": DEFAULT_WEIGHTS,
};

export const EVALUATOR_EMPHASIS: Record<string, string> = {
  "VC": "Scale, growth, moat, velocity, category ambition, repeatability",
  "Angel Investor": "Founder clarity, early proof, scrappiness, credibility, narrative, risk reduction",
  "Incubator": "Learning loops, problem clarity, early validation plan, feasibility",
  "Accelerator": "Execution speed, traction, distribution plan, milestones, iteration",
  "Pitch Competition": "Rubric compliance, clarity, storytelling, impact, time discipline",
};
