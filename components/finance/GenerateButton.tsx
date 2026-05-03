"use client";

/**
 * Finance Studio generate button.
 * Reads access state from useFinanceAccess() and drives all UI states.
 *
 * States:
 *   isPaid   → "Generate Report (5 credits)"   [enabled, credit-based]
 *   isTrial  → "Generate Free Report (1 of 1)" [enabled, no credit cost]
 *   isLocked → "Free Report Used — Upgrade"    [disabled → /pricing]
 */

import React, { useState } from "react";
import Link from "next/link";
import { Loader2, Zap, Lock, ArrowRight } from "lucide-react";
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
  const { isLoading, isPaid, isTrial, isLocked, refresh } = useFinanceAccess();
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

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={className}>
        <div className="h-9 w-56 rounded-xl bg-surface-2 animate-pulse" />
      </div>
    );
  }

  // ── Locked state (free plan, trial exhausted) ──────────────────────────────
  if (isLocked) {
    return (
      <div className={`flex flex-col items-center gap-3 ${className ?? ""}`}>
        {/* Disabled generate button */}
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface-2 text-text-muted text-sm font-medium opacity-60 cursor-not-allowed select-none">
          <Lock className="w-4 h-4" />
          Free Report Used
        </div>

        {/* Upgrade CTA */}
        <Link
          href="/settings?tab=billing"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
        >
          <Zap className="w-4 h-4 fill-current" />
          Upgrade to Basic or Pro
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <p className="text-xs text-text-muted text-center">
          5 credits per report · unlimited generations ·{" "}
          <Link href="/pricing" className="text-accent underline underline-offset-2 hover:text-accent/80">
            Compare plans
          </Link>
        </p>
      </div>
    );
  }

  // ── Active states ──────────────────────────────────────────────────────────
  const label = isPaid
    ? "Generate Report"
    : "Generate Free Report (1 of 1)";

  const icon = generating
    ? <Loader2 className="w-4 h-4 animate-spin" />
    : isTrial
    ? <Zap className="w-4 h-4 fill-current" />
    : null;

  return (
    <div className={className}>
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          leftIcon={icon ?? undefined}
        >
          {generating ? "Generating…" : label}
        </Button>
        {isPaid && !generating && (
          <span className="text-xs text-text-muted">5 credits per report</span>
        )}
      </div>

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
