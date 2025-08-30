// features/facial-analysis/types.ts

import type { NormalizedLandmark, Category } from '@mediapipe/tasks-vision';

export type { NormalizedLandmark, Category };


export interface TimelineEvent {
  t: number;
  label: string;
  probs: number[];
}

export interface KeyMoment {
  tStart: number;
  tEnd: number;
  label: string;
  note: string;
  thumb_b64: string | null;
  clip_url: string | null;
}

export interface BackendReport {
  classes: string[];
  timeline: TimelineEvent[];
  aggregates: {
    counts: Record<string, number>;
    durationsSec: Record<string, number>;
    meanConfidence: number;
    perClassMeanConf: Record<string, number>;
  };
  scores: {
    expressiveness: number;
    steadiness: number;
    positivity: number;
  };
  insights: {
    dominantEmotion: string;
    keyMoments: KeyMoment[];
    gaps: string[];
  };
  version: string;
  fps: number;
  durationSec: number;
}



export type BlendshapeData = Category;

export interface BoundingBox {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  width: number;
  height: number;
}

export interface RawFacialDetections {
  landmarks: NormalizedLandmark[];
  blendshapes: Category[];
  boundingBox?: BoundingBox;
}

export interface CalculatedMetrics {
  dominantExpression?: string;
  expressionConfidences?: { [key: string]: number };
  isSmiling?: boolean;
  smileIntensity?: number;
  isBrowFurrowed?: boolean;
  browFurrowIntensity?: number;
  isLookingAtCamera?: boolean;
  eyeContactDurationPercent?: number;
}

export interface FeedbackTip {
  id: string;
  text: string;
  category: 'expression' | 'engagement' | 'pace' | 'clarity' | 'posture' | 'general';
  type: 'positive' | 'constructive' | 'neutral';
  importance?: 'high' | 'medium' | 'low';
}

export interface FeedbackRuleContext {
  scenarioId: string;
  selectedGoals: string[];
  elapsedTimeSeconds?: number;
}

export interface SummaryReport {
  prediction: string;
  confidence: number;
}

export type TipPriority = 'critical' | 'urgent' | 'trending_down' | 'positive' | 'neutral' | 'moderate';

export interface Tip {
  message: string;
  priority: TipPriority;
}

export interface GoalFeedback {
  percentage: number;
  status: 'good' | 'average' | 'needs_improvement';
  tips: Tip[];
  confidence?: number;
}

export type LiveFeedbackData = {
  [goalName: string]: GoalFeedback;
};

export interface DetailedReport {
  sessionDuration: number;
  blinksPerMinute: number;
  averageSmileIntensity: number;
  averageBrowFurrow: number;
  averageJawOpen: number;
  nodCount: number;
  gazePercent?: number;
  openingSmileIntensity?: number;
  eyeContactPercent?: number;
  blinkRate?: number;
  keyMoments?: any[];
  yawnCount: number;
}

export interface SessionData {
  id?: string;
  createdAt: any;
  scenarioId: string;
  selectedGoals: string[];
  summaryReport: SummaryReport;
  detailedReport: DetailedReport;
}

export type FeedbackStatus = "excellent" | "good" | "needs-work";

export interface FeedbackData {
  overallScore: number;
  date: string;
  session: string;
  duration: string;
  insights: {
    category: string;
    score: number;
    status: FeedbackStatus;
    feedback: string;
    suggestions: string[];
  }[];
  keyInsights: string[];
  actionItems: {
    priority: "high" | "medium" | "low";
    task: string;
    estimated: string;
  }[];
}

export interface BackendReport {
  classes: string[];
  timeline: TimelineEvent[];
  aggregates: {
    counts: Record<string, number>;
    durationsSec: Record<string, number>;
    meanConfidence: number;
    perClassMeanConf: Record<string, number>;
  };
  scores: {
    expressiveness: number;
    steadiness: number;
    positivity: number;
  };
  insights: {
    dominantEmotion: string;
    keyMoments: KeyMoment[];
    gaps: string[];
  };
  version: string;
  fps: number;
  durationSec: number;
}

export interface SummaryResult {
  category: string;
  score: number;
  status: "excellent" | "good" | "needs-work";
  feedback: string;
  suggestions: string[];
  confidence: number;
  prediction: string;
}

export interface UnifiedFeedbackData {
  overallScore: number;
  positivityScore: number;
  steadinessScore: number;
  expressivenessScore: number;
  date: string;
  session: string;
  duration: string;
  keyInsights: string[];
  actionItems: {
    priority: "high" | "medium" | "low";
    task: string;
  }[];
}

export interface FeedbackHistoryItem extends UnifiedFeedbackData {
  id: string;
  createdAt: any;
  rawReport: BackendReport;
  scenarioId: string;
}