"use client";

/**
 * Finance Studio generate button.
 * Reads access state from useFinanceAccess() and drives all UI states.
 *
 * States:
 *   isPro    → "Generate Report"           [enabled]
 *   isTrial  → "⚡ Generate Free Report (1 of 1)"  [enabled]
 *   isLocked → "🔒 Free Report Used — Upgrade to Pro"  [disabled → /pricing]
 */

import React, { useState } from "react";
import Link from "next/link";
import { Loader2, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinanceAccess } from "@/hooks/useFinanceAccess";
import FinanceReport from "./FinanceReport";
import type { FinanceReportResponse } from "@/app/api/finance/report/route";

// The caller must supply the current financial inputs from the Zustand store.
// We accept them as `payload` to keep this component decoupled from the store.
interface GenerateButtonProps {
  /** Current financial inputs from useFinancialStore() */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
  /** Optional extra class on the root wrapper */
  className?: string;
}

export default function GenerateButton({ payload, className }: GenerateButtonProps) {
  const { isLoading, isPro, isTrial, isLocked, refresh } = useFinanceAccess();
  const [generating, setGenerating]   = useState(false);
  const [result,     setResult]       = useState<FinanceReportResponse | null>(null);
  const [errorMsg,   setErrorMsg]     = useState<string | null>(null);

  async function handleGenerate() {
    if (generating || isLocked) return;

    setGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/finance/report", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(payload),
      });

      if (res.status === 403) {
        const json = await res.json() as { error: string; message: string };
        setErrorMsg(json.message ?? "Upgrade to Pro to unlock Finance Studio.");
        return;
      }

      if (!res.ok) {
        const json = await res.json() as { message?: string };
        setErrorMsg(json.message ?? "Report generation failed. Please try again.");
        return;
      }

      const data = await res.json() as FinanceReportResponse;
      setResult(data);
      // After a successful trial use, refresh access state so button locks
      if (data.tier === "trial") refresh();

    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Locked state — direct to pricing ──────────────────────────────────────
  if (isLocked) {
    return (
      <div className={className}>
        <Button asChild variant="secondary" disabled className="opacity-60 cursor-not-allowed">
          <Link href="/pricing" onClick={(e) => e.stopPropagation()}>
            <Lock className="w-4 h-4 mr-2" />
            Free Report Used — Upgrade to Pro
          </Link>
        </Button>
        <p className="text-xs text-text-muted mt-2">
          You&apos;ve used your 1 free Finance Studio report.{" "}
          <Link href="/pricing" className="text-accent underline underline-offset-2">
            Upgrade to Pro
          </Link>{" "}
          for unlimited access.
        </p>
      </div>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={className}>
        <div className="h-9 w-56 rounded-xl bg-surface-2 animate-pulse" />
      </div>
    );
  }

  // ── Active states ──────────────────────────────────────────────────────────
  const label = isPro
    ? "Generate Report"
    : "Generate Free Report (1 of 1)";

  const icon = generating
    ? <Loader2 className="w-4 h-4 animate-spin" />
    : isTrial
    ? <Zap className="w-4 h-4 fill-current" />
    : null;

  return (
    <div className={className}>
      <Button
        onClick={handleGenerate}
        disabled={generating}
        leftIcon={icon ?? undefined}
      >
        {generating ? "Generating…" : label}
      </Button>

      {/* Error toast inline */}
      {errorMsg && (
        <p className="mt-2 text-xs text-red-400 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
          {errorMsg}
        </p>
      )}

      {/* Report output */}
      {result && !generating && (
        <div className="mt-6">
          <FinanceReport report={result.report} tier={result.tier} />
        </div>
      )}
    </div>
  );
}
