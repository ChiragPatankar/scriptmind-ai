/**
 * Monthly scene-by-scene analysis quotas by plan (in addition to credits).
 * SERVER-SIDE ONLY.
 */

export const SCENE_ANALYSIS_MONTHLY_LIMITS: Record<string, number | null> = {
  free:       0,
  basic:      5,
  pro:        25,
  enterprise: null, // unlimited
};

export function getSceneMonthlyLimit(plan: string): number | null {
  return SCENE_ANALYSIS_MONTHLY_LIMITS[plan] ?? SCENE_ANALYSIS_MONTHLY_LIMITS.free;
}
