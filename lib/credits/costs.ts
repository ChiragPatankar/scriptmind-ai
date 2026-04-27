/**
 * Single source of truth for credit costs.
 * SERVER-SIDE ONLY — never import this in client components.
 * The frontend must never know individual costs; it only reads remaining balance.
 */

export const FEATURE_COSTS = {
  script_analysis:     5,
  story_generation:    3,
  dialogue:            2,
  image_generation:    4,
  projection_insights: 1,   // Gemini insights — intentionally cheap
} as const;

export type Feature = keyof typeof FEATURE_COSTS;

/** Starting credits per plan (used when upgrading or provisioning). */
export const PLAN_CREDITS: Record<string, number> = {
  free:  20,
  basic: 200,
  pro:   1000,
};

/** Display labels used in UI error messages. */
export const FEATURE_LABELS: Record<Feature, string> = {
  script_analysis:     "Script Analysis",
  story_generation:    "Story Generation",
  dialogue:            "AI Dialogue",
  image_generation:    "Scene Visualizer",
  projection_insights: "AI Projection Insights",
};
