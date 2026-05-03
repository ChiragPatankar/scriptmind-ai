/**
 * POST /api/analyse
 *
 * Proxy + credit gate for script analysis.
 * Deducts credits via withCredits, then forwards the multipart
 * file to the Hugging Face FastAPI backend.
 */

import { NextRequest, NextResponse } from "next/server";
import { withCredits } from "@/lib/credits/withCredits";

export const POST = withCredits("script_analysis", async (req: NextRequest) => {
  const base = (process.env.NEXT_PUBLIC_ANALYSE_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

  // Forward the raw multipart body unchanged
  const form = await req.formData();

  const res = await fetch(`${base}/api/v1/scripts/analyse`, {
    method: "POST",
    body:   form,
  });

  const data = await res.json().catch(() => ({}));

  return NextResponse.json(data, { status: res.status });
});
