/**
 * Higher-order wrapper that gates any Next.js API route behind credit checks.
 *
 * Usage:
 *   export const POST = withCredits("story_generation", async (req, userId) => {
 *     // credits already deducted — run AI logic here
 *     return NextResponse.json(result);
 *   });
 *
 * SERVER-SIDE ONLY.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@/lib/supabase-server";
import { deductCredits }             from "./deduct";
import type { Feature }              from "./costs";

type Handler = (req: NextRequest, userId: string) => Promise<NextResponse>;

export function withCredits(feature: Feature, handler: Handler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // ── 1. Authenticate ───────────────────────────────────────────────────────
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED", message: "Please sign in to use this feature." },
        { status: 401 }
      );
    }

    // ── 2. Deduct credits (atomic) ────────────────────────────────────────────
    const result = await deductCredits(user.id, feature, {
      path: req.nextUrl.pathname,
      ip:   req.headers.get("x-forwarded-for") ?? "unknown",
    });

    if (!result.success) {
      const status = result.code === "INSUFFICIENT_CREDITS" ? 402 : 500;
      return NextResponse.json(
        { error: result.code, message: result.message },
        { status }
      );
    }

    // ── 3. Run the actual handler ─────────────────────────────────────────────
    const response = await handler(req, user.id);

    // Expose remaining credits so the frontend can update its UI instantly
    response.headers.set("X-Credits-Remaining", String(result.remaining));
    return response;
  };
}
