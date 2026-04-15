/**
 * Mock script analysis payload — replace with API response.
 */

export interface AnalyseScriptReport {
  scriptTitle: string;
  originality: number;
  hook: number;
  engagement: number;
  emotional: number;
  previousScore: number;
  newScore: number;
  similar: string[];
  screenTime: Record<string, number>;
  dialogueShare: Record<string, number>;
  emotionalArcs: Record<string, number[]>;
  actLabels: string[];
  dialogueQuality: number;
  readability?: number;
  insights: string[];
  bestScene: string;
}

/** Example JSON shape from product spec + fields needed for charts */
export const MOCK_ANALYSE_SCRIPT: AnalyseScriptReport = {
  scriptTitle: "Untitled Thriller · Draft 3",
  originality: 7.5,
  hook: 7.0,
  engagement: 8.2,
  emotional: 7.8,
  previousScore: 6.0,
  newScore: 7.5,
  similar: ["Breaking Bad", "Ozark", "Narcos"],
  screenTime: { A: 40, B: 30, C: 30 },
  dialogueShare: { A: 50, B: 30, C: 20 },
  emotionalArcs: {
    A: [4.2, 5.1, 5.8, 6.4, 7.9, 7.2],
    B: [5.0, 4.6, 6.2, 6.0, 7.1, 7.8],
    C: [6.1, 5.9, 5.2, 5.8, 6.5, 6.4],
  },
  actLabels: ["Act I", "Act IIa", "Midpoint", "Act IIb", "Climax", "Resolution"],
  dialogueQuality: 7.2,
  readability: 72,
  insights: [
    "Tighten the second-act bridge so stakes escalate before the midpoint.",
    "Give the antagonist one more scene that reveals motivation without exposition.",
    "The climax lands emotionally — consider trimming 1–2 lines for pacing.",
  ],
  bestScene: "Final confrontation — warehouse, rain, moral reversal",
};
