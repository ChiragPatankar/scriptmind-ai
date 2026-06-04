/**
 * Client-safe credit cost display values.
 * These are DISPLAY-ONLY — actual deduction always happens server-side.
 */
export const CLIENT_FEATURE_COSTS: Record<string, number> = {
  script_analysis:     3,
  scene_analysis:      15,
  story_generation:    2,
  script_expand:       6,
  dialogue:            1,
  image_generation:    3,
  projection_insights: 1,
  finance_report:      5,
  poster_generate:     10,
  poster_regenerate:   5,
};

export const CLIENT_FEATURE_LABELS: Record<string, string> = {
  script_analysis:     "Quick Script Analysis",
  scene_analysis:      "Scene-by-Scene Analysis",
  story_generation:    "Story Generation",
  script_expand:       "Expand to Full Script",
  dialogue:            "AI Dialogue",
  image_generation:    "Scene Visualizer",
  projection_insights: "AI Insights",
  finance_report:      "Finance Studio Report",
  poster_generate:     "Poster Generator",
  poster_regenerate:   "Poster Regeneration",
};
