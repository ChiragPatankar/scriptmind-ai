/**
 * POST /api/verify-payment
 *
 * Verifies a Razorpay payment signature server-side (HMAC-SHA256).
 * On success, upgrades the user's plan and sets credits in public.users.
 *
 * ⚠️  Never trust the frontend for plan/credits — everything is derived here.
 */

import crypto       from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-route";
import { createAdminClient }   from "@/lib/supabase-admin";

const PLAN_CREDITS: Record<string, { credits: number }> = {
  free:  { credits: 20 },
  basic: { credits: 250 },
  pro:   { credits: 700 },
};

export async function POST(req: NextRequest) {
  // 1. Auth
  const { supabase, applyCookies } = createRouteSupabase(req);
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return applyCookies(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  // 2. Parse body
  const body = await req.json().catch(() => ({}));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body as {
    razorpay_order_id:  string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan:               string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const planData = PLAN_CREDITS[plan.toLowerCase()];
  if (!planData) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // 3. Verify signature (server-side, never trust the client)
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error("RAZORPAY_KEY_SECRET not configured");
    return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.warn(`Signature mismatch for user ${user.id}`);
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // 4. Upgrade plan + set credits + set expiry (admin client bypasses RLS)
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // now + 30 days

  const { error: dbErr } = await admin
    .from("users")
    .upsert(
      {
        id:              user.id,
        email:           user.email,
        plan:            plan.toLowerCase(),
        credits:         planData.credits,
        plan_expires_at: expiresAt,
      },
      { onConflict: "id" }
    );

  if (dbErr) {
    console.error("DB update failed:", dbErr.message);
    return applyCookies(
      NextResponse.json({ error: "Failed to activate plan" }, { status: 500 })
    );
  }

  return applyCookies(
    NextResponse.json({
      success:        true,
      plan:           plan.toLowerCase(),
      credits:        planData.credits,
      plan_expires_at: expiresAt,
    })
  );
}
