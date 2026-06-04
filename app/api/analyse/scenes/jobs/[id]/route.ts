/**
 * GET /api/analyse/scenes/jobs/:id — poll job status (owner only).
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-route";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const { supabase, applyCookies } = createRouteSupabase(req);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return applyCookies(
      NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    );
  }

  const { data: job, error } = await supabase
    .from("analysis_jobs")
    .select("id, status, progress_pct, phase_message, error, result, input_meta, created_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return applyCookies(
      NextResponse.json({ error: "DB_ERROR", message: error.message }, { status: 500 })
    );
  }

  if (!job) {
    return applyCookies(
      NextResponse.json({ error: "NOT_FOUND", message: "Job not found." }, { status: 404 })
    );
  }

  return applyCookies(NextResponse.json(job));
}
