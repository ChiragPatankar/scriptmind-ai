/**
 * Atomically marks the one-time Finance Studio trial as used.
 * Server-side only. Call ONLY after confirmed successful report generation.
 *
 * The WHERE clause (plan = 'basic' AND finance_trial_used = false) makes
 * this a no-op if called twice or for the wrong plan — safe to call once.
 */

import { createAdminClient } from "@/lib/supabase-admin";

export async function commitTrial(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("users")
    .update({ finance_trial_used: true })
    .eq("id", userId)
    .eq("plan", "basic")
    .eq("finance_trial_used", false);

  if (error) {
    // Non-fatal: log but don't surface to user — report already generated.
    console.error("[commitTrial] failed to mark trial used:", error.message);
  }
}
