/**
 * Monthly quota for scene_analysis jobs (completed in current UTC month).
 * SERVER-SIDE ONLY.
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { getSceneMonthlyLimit } from "./sceneMonthlyLimits";

export type SceneQuotaResult =
  | { allowed: true; used: number; limit: number | null }
  | {
      allowed: false;
      used: number;
      limit: number;
      code: "SCENE_MONTHLY_LIMIT_EXCEEDED";
    };

export async function checkSceneMonthlyQuota(userId: string): Promise<SceneQuotaResult> {
  const admin = createAdminClient();

  const { data: userRow, error: userErr } = await admin
    .from("users")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  if (userErr || !userRow) {
    return { allowed: false, used: 0, limit: 0, code: "SCENE_MONTHLY_LIMIT_EXCEEDED" };
  }

  const plan = (userRow.plan as string) ?? "free";
  const limit = getSceneMonthlyLimit(plan);

  if (limit === null) {
    return { allowed: true, used: 0, limit: null };
  }

  if (limit === 0) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      code: "SCENE_MONTHLY_LIMIT_EXCEEDED",
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count, error } = await admin
    .from("analysis_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", "scene_analysis")
    .eq("status", "completed")
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    console.error("Scene monthly quota check failed:", error.message);
    return { allowed: true, used: 0, limit };
  }

  const used = count ?? 0;

  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      code: "SCENE_MONTHLY_LIMIT_EXCEEDED",
    };
  }

  return { allowed: true, used, limit };
}
