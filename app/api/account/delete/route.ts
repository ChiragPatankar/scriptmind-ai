import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-route";
import { createAdminClient }   from "@/lib/supabase-admin";

export async function DELETE(req: NextRequest) {
  const { supabase, response: cookieResponse } = createRouteSupabase(req);

  // 1. Verify the caller is authenticated
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Confirm the email matches (extra safety check sent from the UI)
  const body = await req.json().catch(() => ({}));
  if (body.email !== user.email) {
    return NextResponse.json({ error: "Email confirmation does not match." }, { status: 400 });
  }

  // 3. Delete the user via the admin client (bypasses RLS, triggers CASCADE deletes)
  const admin = createAdminClient();
  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);

  if (deleteErr) {
    console.error("[account/delete]", deleteErr.message);
    return NextResponse.json({ error: "Failed to delete account. Please try again." }, { status: 500 });
  }

  // 4. Clear the session cookie
  const res = NextResponse.json({ success: true });
  // Copy Set-Cookie headers from the supabase SSR response so the session is cleared
  cookieResponse.headers.getSetCookie?.()?.forEach((c) => res.headers.append("Set-Cookie", c));
  return res;
}
