import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * OAuth / Magic-link callback handler.
 * Supabase redirects here after Google (or any OAuth) login.
 * Exchanges the ?code= param for a real session, then redirects to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/projects";

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // For brand-new OAuth users (no plan set), send to plan selection.
      // Existing users (plan already set) go directly to the requested page.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRow } = await supabase
          .from("users")
          .select("plan")
          .eq("id", user.id)
          .single();

        // No row or plan is still 'free' and this is a ?new=1 signup redirect
        const isNewUser = !userRow || searchParams.get("new") === "1";
        if (isNewUser && next === "/projects") {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send user back to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
