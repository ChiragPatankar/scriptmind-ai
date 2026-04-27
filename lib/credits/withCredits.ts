/**
 * Higher-order wrapper that gates any Next.js API route behind credit checks.
 *
 * Uses NextRequest-based Supabase auth (Cloudflare / OpenNext compatible).
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-route";
import { deductCredits }       from "./deduct";
import type { Feature }        from "./costs";

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
