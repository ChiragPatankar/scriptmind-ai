/**
 * Daily rate-limit check using existing usage_logs table.
 * Counts successful feature calls made by a user today (UTC).
 * SERVER-SIDE ONLY.
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { DAILY_LIMITS }      from "./rateLimits";
import type { Feature }      from "./costs";

export type RateLimitResult =
  | { allowed: true;  used: number; limit: number | null }
  | { allowed: false; used: number; limit: number; code: "RATE_LIMIT_EXCEEDED" };

export async function checkRateLimit(
  userId:  string,
  feature: Feature,
): Promise<RateLimitResult> {
  const limit = DAILY_LIMITS[feature];

  // No limit configured for this feature
  if (limit === null) return { allowed: true, used: 0, limit: null };

  const admin = createAdminClient();

  // UTC day boundaries — consistent regardless of server timezone
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const { count, error } = await admin
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature",  feature)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString());

  if (error) {
    // On DB error, fail open (don't block the user)
    console.error("Rate limit check failed:", error.message);
    return { allowed: true, used: 0, limit };
  }

  const used = count ?? 0;

  if (used >= limit) {
    return { allowed: false, used, limit, code: "RATE_LIMIT_EXCEEDED" };
  }

  return { allowed: true, used, limit };
}
