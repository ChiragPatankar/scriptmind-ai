import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-route";

/**
 * OAuth / magic-link callback.
 * Must use createRouteSupabase (request cookies → response cookies).
 * Using cookies() from next/headers breaks PKCE on Cloudflare Workers.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/projects";
  if (!next.startsWith("/")) {
    next = "/projects";
  }

  const origin = request.nextUrl.origin;

  if (code) {
    const { supabase, applyCookies } = createRouteSupabase(request);

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let redirectPath = next;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userRow } = await supabase
          .from("users")
          .select("plan, plan_expires_at")
          .eq("id", user.id)
          .maybeSingle();

        const isNewUser = !userRow || !userRow.plan_expires_at || searchParams.get("new") === "1";
        if (isNewUser && redirectPath === "/projects") {
          redirectPath = "/onboarding";
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      let redirectUrl: string;
      if (isLocalEnv) {
        redirectUrl = `${origin}${redirectPath}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${redirectPath}`;
      } else {
        redirectUrl = `${origin}${redirectPath}`;
      }

      return applyCookies(NextResponse.redirect(redirectUrl));
    }

    console.error("[auth/callback] exchangeCodeForSession:", error.message);
  }

  const failUrl = new URL("/login", origin);
  failUrl.searchParams.set("error", "auth_failed");
  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) {
    failUrl.searchParams.set("reason", oauthError);
  }
  return NextResponse.redirect(failUrl);
}
