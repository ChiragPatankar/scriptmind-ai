/**
 * GET /api/usage
 *
 * Returns the authenticated user's credit usage history and summary stats.
 * Reads from usage_logs — no writes.
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-route";
import { createAdminClient }   from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = createRouteSupabase(request);
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const admin = createAdminClient();

  // Last 90 days of logs for this user, newest first
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: logs, error } = await admin
    .from("usage_logs")
    .select("id, feature, credits_used, created_at")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return applyCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  // Current balance + plan
  const { data: userRow } = await admin
    .from("users")
    .select("credits, plan, plan_expires_at")
    .eq("id", user.id)
    .single();

  return applyCookies(
    NextResponse.json({
      logs:           logs ?? [],
      credits:        userRow?.credits        ?? 0,
      plan:           userRow?.plan           ?? "free",
      plan_expires_at: userRow?.plan_expires_at ?? null,
    })
  );
}
