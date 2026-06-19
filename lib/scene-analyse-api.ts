/**
 * Scene-by-scene analysis — async job API client.
 */

import type { SceneAnalysisJob, SceneAnalysisReport } from "@/lib/mock/scene-analyse";

/** Tell the rest of the app the credit balance may have changed (e.g. after a refund). */
function notifyCreditsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("credits-changed"));
  }
}

function mapJob(row: Record<string, unknown>): SceneAnalysisJob {
  return {
    id: String(row.id),
    status: row.status as SceneAnalysisJob["status"],
    progress_pct: Number(row.progress_pct ?? 0),
    phase_message: (row.phase_message as string) ?? null,
    error: (row.error as string) ?? null,
    result: (row.result as SceneAnalysisReport) ?? null,
    input_meta: (row.input_meta as Record<string, unknown>) ?? {},
  };
}

export async function createSceneAnalysisJob(file: File): Promise<{
  jobId: string;
  remainingCredits?: number;
}> {
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch("/api/analyse/scenes/jobs", {
    method: "POST",
    body: form,
  });

  const payload = (await res.json().catch(() => ({}))) as {
    jobId?: string;
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    // A failed worker trigger refunds the credits server-side — refresh the badge.
    notifyCreditsChanged();
    throw new Error(payload.message ?? payload.error ?? `Request failed (${res.status})`);
  }

  const remaining = res.headers.get("X-Credits-Remaining");
  return {
    jobId: payload.jobId!,
    remainingCredits: remaining ? parseInt(remaining, 10) : undefined,
  };
}

export async function getSceneAnalysisJob(jobId: string): Promise<SceneAnalysisJob> {
  const res = await fetch(`/api/analyse/scenes/jobs/${jobId}`);
  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    throw new Error(
      (payload.message as string) ?? (payload.error as string) ?? `Poll failed (${res.status})`
    );
  }

  return mapJob(payload);
}

export async function pollSceneAnalysisJob(
  jobId: string,
  opts: {
    intervalMs?: number;
    maxAttempts?: number;
    onUpdate?: (job: SceneAnalysisJob) => void;
  } = {}
): Promise<SceneAnalysisReport> {
  const intervalMs = opts.intervalMs ?? 2500;
  const maxAttempts = opts.maxAttempts ?? 120;

  for (let i = 0; i < maxAttempts; i++) {
    const job = await getSceneAnalysisJob(jobId);
    opts.onUpdate?.(job);

    if (job.status === "completed" && job.result) {
      return job.result;
    }
    if (job.status === "failed") {
      // The poll endpoint refunds credits for failed jobs — refresh the badge.
      notifyCreditsChanged();
      throw new Error(job.error ?? "Scene analysis failed.");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("Analysis timed out. Check back later or try again.");
}
