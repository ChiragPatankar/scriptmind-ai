/**
 * POST /api/create-order
 *
 * Creates a Razorpay order for the requested plan using the REST API directly
 * (the razorpay npm SDK uses Node.js http internals incompatible with
 * Cloudflare Workers — fetch is used instead).
 */

import { createRouteSupabase } from "@/lib/supabase-route";
import { NextRequest, NextResponse } from "next/server";

const PLAN_CONFIG: Record<string, { amount: number; label: string }> = {
  free:  { amount: 49 * 100,   label: "ScriptMind Trial Pack"  },
  basic: { amount: 499 * 100,  label: "ScriptMind Basic" },
  pro:   { amount: 1299 * 100, label: "ScriptMind Pro"   },
};

export async function POST(req: NextRequest) {
  // Auth check
  const { supabase, applyCookies } = createRouteSupabase(req);
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return applyCookies(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  const body = await req.json().catch(() => ({}));
  const plan = String(body.plan ?? "").toLowerCase();
  const config = PLAN_CONFIG[plan];

  if (!config) {
    return NextResponse.json(
      { error: "Invalid plan. Must be 'free', 'basic' or 'pro'." },
      { status: 400 }
    );
  }

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("Razorpay keys not configured");
    return NextResponse.json(
      { error: "Payment gateway not configured" },
      { status: 500 }
    );
  }

  // Call Razorpay Orders API directly — no SDK, pure fetch (Cloudflare compatible)
  const credentials = btoa(`${keyId}:${keySecret}`);

  const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method:  "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      amount:   config.amount,
      currency: "INR",
      receipt:  `${plan}_${user.id.slice(0, 8)}_${Date.now()}`,
      notes:    { plan, user_id: user.id },
    }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.json().catch(() => ({}));
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 502 }
    );
  }

  const order = await rzpRes.json();

  return applyCookies(
    NextResponse.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      key_id:   keyId,
      plan,
      name:     config.label,
    })
  );
}
