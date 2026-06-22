/**
 * POST /api/originality/enhance
 *
 * Originality Intelligence — Enhancement Actions.
 * Applies a single craft-focused rewrite (e.g. "Increase Emotional Depth") to the
 * user's own script text. NOT a plagiarism/legal tool.
 *
 * Flow:
 *  1. Authenticate the user.
 *  2. Verify the subscription is active.
 *  3. Pre-check the credit balance (>= enhancement cost) before spending Gemini compute.
 *  4. Forward the script + action to the FastAPI worker for the chunked Gemini rewrite.
 *  5. Deduct enhancement credits ONLY after a successful rewrite (separate from analysis).
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-route";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkSubscription } from "@/lib/credits/checkSubscription";
import { deductCredits } from "@/lib/credits/deduct";
import { FEATURE_COSTS } from "@/lib/credits/costs";

export const dynamic = "force-dynamic";

const COST = FEATURE_COSTS.originality_enhance;

const VALID_ACTIONS = new Set([
  "improve_dialogue",
  "emotional_depth",
  "character_voices",
  "reduce_predictability",
  "narrative_flow",
]);

export async function POST(req: NextRequest) {
  const { supabase, applyCookies } = createRouteSupabase(req);

  // 1. Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return applyCookies(
      NextResponse.json(
        { error: "UNAUTHENTICATED", message: "Please sign in to use this feature." },
        { status: 401 }
      )
    );
  }

  // 2. Subscription check
  const sub = await checkSubscription(user.id);
  if (!sub.active) {
    return applyCookies(
      NextResponse.json(
        {
          error: "SUBSCRIPTION_EXPIRED",
          message: "Your subscription has expired. Upgrade to continue using AI features.",
        },
        { status: 403 }
      )
    );
  }

  // 3. Read the form up-front so we can validate the action before any DB work.
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return applyCookies(
      NextResponse.json(
        { error: "BAD_REQUEST", message: "Expected a multipart form with a script file." },
        { status: 400 }
      )
    );
  }

  const action = String(form.get("action") ?? "").trim();
  if (!VALID_ACTIONS.has(action)) {
    return applyCookies(
      NextResponse.json(
        { error: "BAD_REQUEST", message: "Unknown or missing enhancement action." },
        { status: 400 }
      )
    );
  }

  // 4. Credit pre-check (avoid spending Gemini compute for users who can't pay)
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

  const { data: userRow } = await admin
    .from("users")
    .select("credits")
    .eq("id", user.id)
    .maybeSingle();

  if (!userRow || (userRow.credits ?? 0) < COST) {
    return applyCookies(
      NextResponse.json(
        {
          error: "INSUFFICIENT_CREDITS",
          message: `This enhancement costs ${COST} credits. Please upgrade your plan or wait for your monthly refresh.`,
        },
        { status: 402 }
      )
    );
  }

  // 5. Forward to FastAPI worker
  const base = (process.env.NEXT_PUBLIC_ANALYSE_API_URL ?? "http://127.0.0.1:8000").replace(
    /\/$/,
    ""
  );

  let workerRes: Response;
  try {
    workerRes = await fetch(`${base}/api/v1/scripts/originality/enhance`, {
      method: "POST",
      body: form,
    });
  } catch {
    return applyCookies(
      NextResponse.json(
        { error: "WORKER_UNREACHABLE", message: "Enhancement server unreachable. Try again shortly." },
        { status: 503 }
      )
    );
  }

  const data = await workerRes.json().catch(() => ({}));

  // On any worker failure, return its error WITHOUT deducting credits.
  if (!workerRes.ok) {
    return applyCookies(NextResponse.json(data, { status: workerRes.status }));
  }

  // 6. Deduct enhancement credits after successful completion (separate feature).
  const deduct = await deductCredits(user.id, "originality_enhance", {
    path: req.nextUrl.pathname,
    action,
    ip: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  const response = NextResponse.json(data, { status: 200 });
  if (deduct.success) {
    response.headers.set("X-Credits-Remaining", String(deduct.remaining));
  }
  return applyCookies(response);
}
