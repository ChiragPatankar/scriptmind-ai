/**
 * Client-safe credit cost display values.
 * These are DISPLAY-ONLY — actual deduction always happens server-side.
 */
export const CLIENT_FEATURE_COSTS: Record<string, number> = {
  script_analysis:     2,
  story_generation:    2,
  script_expand:       6,
  dialogue:            1,
  image_generation:    3,
  projection_insights: 1,
  finance_report:      5,
};

export const CLIENT_FEATURE_LABELS: Record<string, string> = {
  script_analysis:     "Script Analysis",
  story_generation:    "Story Generation",
  script_expand:       "Expand to Full Script",
  dialogue:            "AI Dialogue",
  image_generation:    "Scene Visualizer",
  projection_insights: "AI Insights",
  finance_report:      "Finance Studio Report",
};
