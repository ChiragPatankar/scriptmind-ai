/**
 * GET /api/credits/balance
 *
 * Returns the authenticated user's credit balance and plan.
 * Auto-provisions the users row if missing.
 *
 * Uses NextRequest-based Supabase client so auth works on Cloudflare Workers
 * (OpenNext) where `cookies()` from next/headers is unreliable.
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-route";
import { createAdminClient }   from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = createRouteSupabase(request);

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return applyCookies(
      NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return applyCookies(
      NextResponse.json(
        { error: "SERVICE_CONFIG", message: "Credits service is not configured." },
        { status: 503 }
      )
    );
  }

  const { data: existing } = await admin
    .from("users")
    .select("credits, plan, plan_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return applyCookies(
      NextResponse.json({
        credits:         existing.credits,
        plan:            existing.plan,
        plan_expires_at: existing.plan_expires_at ?? null,
      })
    );
  }

  const { data: inserted, error: insertErr } = await admin
    .from("users")
    .insert({
      id:      user.id,
      email:   user.email ?? "",
      credits: 20,
      plan:    "free",
    })
    .select("credits, plan, plan_expires_at")
    .single();

  if (insertErr || !inserted) {
    return applyCookies(
      NextResponse.json(
        {
          error:   "PROVISION_FAILED",
          message: insertErr?.message ?? "Could not create credits account.",
        },
        { status: 500 }
      )
    );
  }

  return applyCookies(
    NextResponse.json({
      credits:         inserted.credits,
      plan:            inserted.plan,
      plan_expires_at: inserted.plan_expires_at ?? null,
    })
  );
}
