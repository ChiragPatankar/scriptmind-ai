/**
 * Daily rate limits per feature.
 * null = no limit enforced.
 * SERVER-SIDE ONLY.
 */

import type { Feature } from "./costs";

export const DAILY_LIMITS: Record<Feature, number | null> = {
  script_analysis:     10,
  story_generation:    null,
  script_expand:       null,
  dialogue:            null,
  image_generation:    null,
  projection_insights: null,
  finance_report:      null,
  poster_generate:     null,
  poster_regenerate:   null,
};
