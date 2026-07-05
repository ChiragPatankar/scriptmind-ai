/**
 * Subscription expiry check + auto-downgrade.
 * SERVER-SIDE ONLY.
 *
 * - Free plan (plan_expires_at IS NULL) → always active.
 * - Paid plan with future plan_expires_at  → active.
 * - Paid plan with past plan_expires_at   → expired; atomically downgrade to free.
 */

import { createAdminClient } from "@/lib/supabase-admin";

export type SubscriptionStatus =
  | { active: true;  plan: string; expiresAt: string | null }
  | { active: false; code: "SUBSCRIPTION_EXPIRED"; plan: "free" };

export async function checkSubscription(userId: string): Promise<SubscriptionStatus> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("users")
    .select("plan, plan_expires_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    // Row missing — treat as free, let deductCredits handle provisioning
    return { active: true, plan: "free", expiresAt: null };
  }

  const { plan, plan_expires_at } = data as {
    plan:            string;
    plan_expires_at: string | null;
  };

  // If plan_expires_at is null, they have no active plan (either new user or expired)
  if (!plan_expires_at) {
    return { active: false, code: "SUBSCRIPTION_EXPIRED", plan: "free" };
  }

  const now      = new Date();
  const expiresAt = new Date(plan_expires_at);

  if (now <= expiresAt) {
    // Still active
    return { active: true, plan, expiresAt: plan_expires_at };
  }

  // ── Expired: atomically downgrade to free
  await admin
    .from("users")
    .update({ plan: "free", plan_expires_at: null })
    .eq("id", userId);

  return { active: false, code: "SUBSCRIPTION_EXPIRED", plan: "free" };
}
