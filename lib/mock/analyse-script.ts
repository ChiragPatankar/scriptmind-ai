/**
 * Script analysis types — mapped from Gemini JSON response.
 */

export interface EmotionalTimelinePoint {
  scene: number;
  joy?: number;
  fear?: number;
  anger?: number;
  sadness?: number;
  surprise?: number;
  excitement?: number;
  anxiety?: number;
  [key: string]: number | undefined;
}

export interface EmotionDistribution {
  admiration?: number;
  adoration?: number;
  aesthetic_appreciation?: number;
  amusement?: number;
  anger?: number;
  anxiety?: number;
  awe?: number;
  awkwardness?: number;
  boredom?: number;
  calmness?: number;
  confusion?: number;
  craving?: number;
  disgust?: number;
  empathic_pain?: number;
  entrancement?: number;
  envy?: number;
  excitement?: number;
  fear?: number;
  horror?: number;
  interest?: number;
  joy?: number;
  nostalgia?: number;
  relief?: number;
  romance?: number;
  sadness?: number;
  satisfaction?: number;
  sexual_desire?: number;
}

export interface StructuredInsights {
  plotHoles: string[];
  pacingIssues: string[];
  weakCharacters: string[];
  repetitiveDialogue: string[];
}

export interface AnalyseScriptReport {
  scriptTitle: string;
  originality: number;
  hook: number;
  engagement: number;
  emotional: number;
  previousScore: number;
  newScore: number;
  improvement: number;
  similar: string[];
  screenTime: Record<string, number>;
  dialogueShare: Record<string, number>;
  emotionalTimeline: EmotionalTimelinePoint[];
  emotionDistribution: EmotionDistribution;
  emotionalArcs: Record<string, number[]>;
  actLabels: string[];
  dialogueQuality: number;
  readability?: number;
  insights: StructuredInsights;
  bestScene: string;
}
