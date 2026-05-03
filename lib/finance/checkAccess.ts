/**
 * Finance Studio access gate — server-side only.
 * Single SELECT query via service-role client.
 */

import { createAdminClient } from "@/lib/supabase-admin";

export type FinanceAccessResult =
  | { allowed: true;  tier: "paid" | "trial" }
  | { allowed: false; code: "TRIAL_EXHAUSTED" };

/**
 * Finance Studio access logic:
 *
 * free  + trial not used  → { allowed: true,  tier: 'trial' }  (1 free report, then locked)
 * free  + trial used      → { allowed: false, code: 'TRIAL_EXHAUSTED' }
 * basic + any             → { allowed: true,  tier: 'paid'  }  (5 credits per report)
 * pro   + any             → { allowed: true,  tier: 'paid'  }  (5 credits per report)
 */
export async function checkFinanceAccess(userId: string): Promise<FinanceAccessResult> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("users")
    .select("plan, finance_trial_used")
    .eq("id", userId)
    .single();

  if (error || !data) {
    // Row missing — give the benefit of the doubt (trial)
    return { allowed: true, tier: "trial" };
  }

  const { plan, finance_trial_used } = data as {
    plan: string;
    finance_trial_used: boolean;
  };

  // Basic + Pro: unlimited, credit-based
  if (plan === "basic" || plan === "pro") {
    return { allowed: true, tier: "paid" };
  }

  // Free: 1 trial only
  return finance_trial_used
    ? { allowed: false, code: "TRIAL_EXHAUSTED" }
    : { allowed: true,  tier: "trial" };
}
