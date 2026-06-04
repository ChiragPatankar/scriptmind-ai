/**
 * Credit gate for scene_analysis: monthly plan quota + daily limit + 15 credits.
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-route";
import { deductCredits } from "./deduct";
import { checkRateLimit } from "./checkRateLimit";
import { checkSubscription } from "./checkSubscription";
import { checkSceneMonthlyQuota } from "./checkSceneMonthlyQuota";
import { FEATURE_LABELS } from "./costs";

type Handler = (
  req: NextRequest,
  userId: string,
  ctx: { remainingCredits: number }
) => Promise<NextResponse>;

export function withSceneAnalysis(handler: Handler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { supabase, applyCookies } = createRouteSupabase(req);

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

    const monthly = await checkSceneMonthlyQuota(user.id);
    if (!monthly.allowed) {
      const { data: userRow } = await supabase
        .from("users")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      const plan = (userRow?.plan as string) ?? "free";
      const msg =
        plan === "free"
          ? "Scene-by-Scene Analysis is available on Basic and Pro plans. Upgrade at /pricing."
          : `You've used all ${monthly.limit} scene analyses for this month on your plan. Resets on the 1st UTC.`;
      return applyCookies(
        NextResponse.json(
          {
            error: monthly.code,
            message: msg,
            used: monthly.used,
            limit: monthly.limit,
          },
          { status: 403 }
        )
      );
    }

    const rateResult = await checkRateLimit(user.id, "scene_analysis");
    if (!rateResult.allowed) {
      return applyCookies(
        NextResponse.json(
          {
            error: "RATE_LIMIT_EXCEEDED",
            message: `Daily limit reached for ${FEATURE_LABELS.scene_analysis}. Try again tomorrow.`,
            used: rateResult.used,
            limit: rateResult.limit,
          },
          { status: 429 }
        )
      );
    }

    const result = await deductCredits(user.id, "scene_analysis", {
      path: req.nextUrl.pathname,
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });

    if (!result.success) {
      const status = result.code === "INSUFFICIENT_CREDITS" ? 402 : 500;
      return applyCookies(
        NextResponse.json(
          { error: result.code, message: result.message },
          { status }
        )
      );
    }

    const response = await handler(req, user.id, { remainingCredits: result.remaining });
    response.headers.set("X-Credits-Remaining", String(result.remaining));
    return applyCookies(response);
  };
}
