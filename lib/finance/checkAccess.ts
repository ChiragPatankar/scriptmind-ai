/**
 * Finance Studio access gate — server-side only.
 * Single SELECT query via service-role client.
 */

import { createAdminClient } from "@/lib/supabase-admin";

export type FinanceAccessResult =
  | { allowed: true;  tier: "pro" | "trial" }
  | { allowed: false; code: "FINANCE_LOCKED" | "UPGRADE_REQUIRED" };

/**
 * Determines whether a user can generate a Finance Studio report.
 *
 * plan=pro                          → { allowed: true, tier: 'pro' }
 * plan=basic + trial unused         → { allowed: true, tier: 'trial' }
 * plan=basic + trial already used   → { allowed: false, code: 'FINANCE_LOCKED' }
 * plan=free (any trial state)       → { allowed: false, code: 'UPGRADE_REQUIRED' }
 */
export async function checkFinanceAccess(userId: string): Promise<FinanceAccessResult> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("users")
    .select("plan, finance_trial_used")
    .eq("id", userId)
    .single();

  if (error || !data) {
    // Treat missing row as free-tier (safe default)
    return { allowed: false, code: "UPGRADE_REQUIRED" };
  }

  const { plan, finance_trial_used } = data as {
    plan: string;
    finance_trial_used: boolean;
  };

  if (plan === "pro") {
    return { allowed: true, tier: "pro" };
  }

  if (plan === "basic") {
    return finance_trial_used
      ? { allowed: false, code: "FINANCE_LOCKED" }
      : { allowed: true,  tier: "trial" };
  }

  // plan = 'free' or unknown
  return { allowed: false, code: "UPGRADE_REQUIRED" };
}
