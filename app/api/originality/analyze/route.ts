/**
 * POST /api/originality/analyze
 *
 * Originality Intelligence — narrative-similarity & originality analysis.
 * NOT a plagiarism/legal check.
 *
 * Flow:
 *  1. Authenticate the user.
 *  2. Verify the subscription is active.
 *  3. Pre-check the credit balance (>= cost) before spending Gemini compute.
 *  4. Forward the screenplay to the FastAPI worker for chunked Gemini analysis.
 *  5. Deduct credits ONLY after a successful analysis.
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-route";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkSubscription } from "@/lib/credits/checkSubscription";
import { deductCredits } from "@/lib/credits/deduct";
import { FEATURE_COSTS } from "@/lib/credits/costs";

export const dynamic = "force-dynamic";

const COST = FEATURE_COSTS.originality;

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

  // 3. Credit pre-check (avoid spending Gemini compute for users who can't pay)
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
          message: `Originality Intelligence costs ${COST} credits. Please upgrade your plan or wait for your monthly refresh.`,
        },
        { status: 402 }
      )
    );
  }

  // 4. Forward to FastAPI worker
  const base = (process.env.NEXT_PUBLIC_ANALYSE_API_URL ?? "http://127.0.0.1:8000").replace(
    /\/$/,
    ""
  );

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

  let workerRes: Response;
  try {
    workerRes = await fetch(`${base}/api/v1/scripts/originality/analyze`, {
      method: "POST",
      body: form,
    });
  } catch {
    return applyCookies(
      NextResponse.json(
        { error: "WORKER_UNREACHABLE", message: "Analysis server unreachable. Try again shortly." },
        { status: 503 }
      )
    );
  }

  const data = await workerRes.json().catch(() => ({}));

  // On any worker failure, return its error WITHOUT deducting credits.
  if (!workerRes.ok) {
    return applyCookies(NextResponse.json(data, { status: workerRes.status }));
  }

  // 5. Deduct credits after successful completion
  const deduct = await deductCredits(user.id, "originality", {
    path: req.nextUrl.pathname,
    ip: req.headers.get("x-forwarded-for") ?? "unknown",
  });

  const response = NextResponse.json(data, { status: 200 });
  if (deduct.success) {
    response.headers.set("X-Credits-Remaining", String(deduct.remaining));
  }
  return applyCookies(response);
}
