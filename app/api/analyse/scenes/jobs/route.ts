/**
 * POST /api/analyse/scenes/jobs — create scene analysis job, deduct credits, trigger worker.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { withSceneAnalysis } from "@/lib/credits/withSceneAnalysis";

export const POST = withSceneAnalysis(async (req: NextRequest, userId) => {
  const form = await req.formData();
  const file = form.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "MISSING_FILE", message: "Upload a PDF, DOCX, or TXT screenplay." },
      { status: 400 }
    );
  }

  const name =
    file instanceof File && file.name
      ? file.name
      : "script.txt";

  const admin = createAdminClient();
  const { data: job, error: insertErr } = await admin
    .from("analysis_jobs")
    .insert({
      user_id: userId,
      feature: "scene_analysis",
      status: "queued",
      progress_pct: 0,
      phase_message: "Queued",
      input_meta: { filename: name },
    })
    .select("id")
    .single();

  if (insertErr || !job) {
    return NextResponse.json(
      { error: "JOB_CREATE_FAILED", message: insertErr?.message ?? "Could not create job." },
      { status: 500 }
    );
  }

  const jobId = job.id as string;
  const base = (process.env.NEXT_PUBLIC_ANALYSE_API_URL ?? "http://127.0.0.1:8000").replace(
    /\/$/,
    ""
  );
  const secret = process.env.SCENE_JOB_PROCESS_SECRET ?? "";

  const triggerForm = new FormData();
  triggerForm.append("job_id", jobId);
  triggerForm.append("file", file, name);

  try {
    const triggerRes = await fetch(`${base}/api/v1/scripts/analyse/scenes/process`, {
      method: "POST",
      headers: secret ? { "X-Job-Secret": secret } : {},
      body: triggerForm,
    });

    if (!triggerRes.ok) {
      const detail = await triggerRes.text().catch(() => "");
      await admin
        .from("analysis_jobs")
        .update({
          status: "failed",
          error: `Worker trigger failed: ${detail.slice(0, 200)}`,
        })
        .eq("id", jobId);

      return NextResponse.json(
        {
          error: "WORKER_TRIGGER_FAILED",
          message: "Could not start analysis worker. Try again shortly.",
        },
        { status: 503 }
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    await admin
      .from("analysis_jobs")
      .update({ status: "failed", error: msg })
      .eq("id", jobId);

    return NextResponse.json(
      { error: "WORKER_UNREACHABLE", message: "Analysis server unreachable." },
      { status: 503 }
    );
  }

  return NextResponse.json({ jobId, status: "queued" });
});
