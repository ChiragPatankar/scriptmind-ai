/**
 * Higher-order wrapper that gates any Next.js API route behind credit checks.
 *
 * Uses NextRequest-based Supabase auth (Cloudflare / OpenNext compatible).
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase }  from "@/lib/supabase-route";
import { deductCredits }        from "./deduct";
import { checkRateLimit }       from "./checkRateLimit";
import { checkSubscription }    from "./checkSubscription";
import { DAILY_LIMITS }         from "./rateLimits";
import { FEATURE_LABELS }       from "./costs";
import type { Feature }         from "./costs";

type Handler = (req: NextRequest, userId: string) => Promise<NextResponse>;

export function withCredits(feature: Feature, handler: Handler) {
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

    // ── Subscription expiry check ──────────────────────────────────────────────
    const sub = await checkSubscription(user.id);
    if (!sub.active) {
      return applyCookies(
        NextResponse.json(
          {
            error:   "SUBSCRIPTION_EXPIRED",
            message: "Your subscription has expired. Upgrade to continue using AI features.",
          },
          { status: 403 }
        )
      );
    }

    // ── Rate limit check (before deducting credits) ────────────────────────────
    const rateResult = await checkRateLimit(user.id, feature);
    if (!rateResult.allowed) {
      const label = FEATURE_LABELS[feature];
      const limit = DAILY_LIMITS[feature]!;
      return applyCookies(
        NextResponse.json(
          {
            error:   "RATE_LIMIT_EXCEEDED",
            message: `Daily limit reached for ${label}. You can use this feature up to ${limit} times per day. Try again tomorrow.`,
            used:    rateResult.used,
            limit,
          },
          { status: 429 }
        )
      );
    }

    // ── Credit deduction ───────────────────────────────────────────────────────
    const result = await deductCredits(user.id, feature, {
      path: req.nextUrl.pathname,
      ip:   req.headers.get("x-forwarded-for") ?? "unknown",
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

    const response = await handler(req, user.id);
    response.headers.set("X-Credits-Remaining", String(result.remaining));
    return applyCookies(response);
  };
}
