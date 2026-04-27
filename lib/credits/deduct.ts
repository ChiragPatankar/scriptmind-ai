/**
 * Core atomic credit deduction engine.
 * SERVER-SIDE ONLY.
 *
 * Uses a single Supabase RPC that deducts + logs in one DB transaction.
 * No read-then-write pattern — race conditions are impossible.
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { FEATURE_COSTS, FEATURE_LABELS, type Feature } from "./costs";

// ── Result discriminated union ────────────────────────────────────────────────

export type DeductSuccess = {
  success:   true;
  remaining: number;
};

export type DeductFailure = {
  success: false;
  code:    "INSUFFICIENT_CREDITS" | "USER_NOT_FOUND" | "DB_ERROR";
  message: string;
};

export type DeductResult = DeductSuccess | DeductFailure;

// ── Main deduction function ───────────────────────────────────────────────────

/**
 * Atomically deducts credits for a feature.
 * Writes a usage_log row in the same DB transaction.
 *
 * @param userId   Supabase auth user id
 * @param feature  One of the keys in FEATURE_COSTS
 * @param metadata Optional context stored in usage_logs.metadata (path, ip, etc.)
 */
export async function deductCredits(
  userId:   string,
  feature:  Feature,
  metadata: Record<string, unknown> = {}
): Promise<DeductResult> {
  const supabase = createAdminClient();
  const cost     = FEATURE_COSTS[feature];

  const { data, error } = await supabase.rpc("deduct_credits_atomic", {
    p_user_id:  userId,
    p_cost:     cost,
    p_feature:  feature,
    p_metadata: metadata,
  });

  if (error) {
    return {
      success: false,
      code:    "DB_ERROR",
      message: `Database error: ${error.message}`,
    };
  }

  // RPC returns -1 when credits are insufficient or user row is missing
  if (data === -1) {
    // Distinguish the two cases by checking if the user row exists
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!userRow) {
      return {
        success: false,
        code:    "USER_NOT_FOUND",
        message: "User account not found. Please contact support.",
      };
    }

    return {
      success: false,
      code:    "INSUFFICIENT_CREDITS",
      message: `${FEATURE_LABELS[feature]} costs ${cost} credits. Please upgrade your plan or wait for your monthly refresh.`,
    };
  }

  return { success: true, remaining: data as number };
}
