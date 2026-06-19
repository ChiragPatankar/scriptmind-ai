/**
 * Refund credits for a failed scene-analysis job — exactly once.
 * SERVER-SIDE ONLY (uses the service-role admin client).
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { addCredits } from "./manage";
import { FEATURE_COSTS } from "./costs";

/**
 * Refunds the scene-analysis credit cost if the job is failed and not yet refunded.
 *
 * Idempotency is enforced by a guarded UPDATE: only the call that flips
 * `refunded` from false → true (matching status='failed') actually credits the
 * user, so concurrent polls cannot double-refund.
 *
 * Safe to call on every poll — it is a no-op once a refund has happened, and it
 * silently no-ops if the `refunded` column has not been migrated yet.
 *
 * @returns true if this call performed the refund, false otherwise.
 */
export async function refundSceneJobIfNeeded(
  jobId: string,
  userId: string
): Promise<boolean> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("analysis_jobs")
    .update({ refunded: true })
    .eq("id", jobId)
    .eq("user_id", userId)
    .eq("status", "failed")
    .eq("refunded", false)
    .select("id");

  if (error || !data || data.length === 0) return false;

  try {
    await addCredits(userId, FEATURE_COSTS.scene_analysis, "scene_analysis_refund");
    return true;
  } catch {
    // Roll back the flag so a later poll can retry the refund.
    await admin
      .from("analysis_jobs")
      .update({ refunded: false })
      .eq("id", jobId)
      .eq("user_id", userId);
    return false;
  }
}
