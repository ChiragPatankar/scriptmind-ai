/**
 * Single source of truth for credit costs.
 * SERVER-SIDE ONLY — never import this in client components.
 * The frontend must never know individual costs; it only reads remaining balance.
 */

// 1 credit = ₹2  |  Basic ₹499 → 250 credits  |  Pro ₹1299 → 700 credits
export const FEATURE_COSTS = {
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
  originality:         10,
} as const;

export type Feature = keyof typeof FEATURE_COSTS;

/** Starting credits per plan (used when upgrading or provisioning). */
export const PLAN_CREDITS: Record<string, number> = {
  free:  20,
  basic: 250,
  pro:   700,
};

/** Display labels used in UI error messages. */
export const FEATURE_LABELS: Record<Feature, string> = {
  script_analysis:     "Quick Script Analysis",
  scene_analysis:      "Scene-by-Scene Analysis",
  story_generation:    "Story Generation",
  script_expand:       "Expand to Full Script",
  dialogue:            "AI Dialogue",
  image_generation:    "Scene Visualizer",
  projection_insights: "AI Projection Insights",
  finance_report:      "Finance Studio Report",
  poster_generate:     "Poster Generator",
  poster_regenerate:   "Poster Regeneration",
  originality:         "Originality Intelligence",
};
