/**
 * GET /api/credits/balance
 *
 * Returns the authenticated user's credit balance and plan.
 * Auto-provisions the users row if it doesn't exist yet
 * (handles users who signed up before the credits system was added).
 * Uses the service-role admin client so it bypasses RLS safely.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@/lib/supabase-server";
import { createAdminClient }         from "@/lib/supabase-admin";

export async function GET(_req: NextRequest) {
  // 1. Identify the caller
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 2. Try to fetch existing row
  const { data: existing } = await admin
    .from("users")
    .select("credits, plan")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ credits: existing.credits, plan: existing.plan });
  }

  // 3. Row missing — provision it now (existing user pre-dates credit system)
  const { data: inserted, error: insertErr } = await admin
    .from("users")
    .insert({
      id:      user.id,
      email:   user.email ?? "",
      credits: 20,
      plan:    "free",
    })
    .select("credits, plan")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: "Failed to provision credits account", detail: insertErr?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ credits: inserted.credits, plan: inserted.plan });
}
