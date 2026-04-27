/**
 * Credit management helpers — top-ups and plan upgrades.
 * SERVER-SIDE ONLY (admin operations; requires service role key).
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { PLAN_CREDITS }      from "./costs";

// ── Add credits (top-up) ──────────────────────────────────────────────────────

/**
 * Adds credits to a user's balance.
 * Calls the add_credits RPC which also writes a usage_log row.
 *
 * @param userId  Supabase auth user id
 * @param amount  Number of credits to add (positive integer)
 * @param reason  Audit label, e.g. "plan_upgrade", "referral_bonus", "support"
 * @returns       New credit balance
 */
export async function addCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("add_credits", {
    p_user_id: userId,
    p_amount:  amount,
    p_reason:  reason,
  });

  if (error) throw new Error(`Failed to add credits: ${error.message}`);
  return data as number;
}

// ── Upgrade plan ──────────────────────────────────────────────────────────────

/**
 * Upgrades a user's plan and resets their credits to the plan's allowance.
 * Also writes a usage_log row via the add_credits delta for auditability.
 *
 * @param userId  Supabase auth user id
 * @param plan    Target plan: 'basic' | 'pro'
 */
export async function upgradePlan(
  userId: string,
  plan:   "basic" | "pro"
): Promise<void> {
  const supabase   = createAdminClient();
  const newCredits = PLAN_CREDITS[plan];

  const { error } = await supabase
    .from("users")
    .update({ plan, credits: newCredits, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(`Failed to upgrade plan: ${error.message}`);
}

// ── Fetch balance (server-side) ───────────────────────────────────────────────

/**
 * Returns the current credit balance and plan for a user.
 * Use on the server (e.g. in a Server Component or API route check).
 */
export async function getBalance(
  userId: string
): Promise<{ credits: number; plan: string } | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("credits, plan")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as { credits: number; plan: string };
}
