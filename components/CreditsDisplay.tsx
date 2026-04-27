"use client";

/**
 * Compact credits badge for the dashboard navbar.
 * Shows: current balance pill + plan label.
 * Renders an amber warning when credits drop to 5 or below.
 * Renders a red "Out of Credits" state at 0.
 */

import React from "react";
import Link  from "next/link";
import { Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/useCredits";

interface CreditsDisplayProps {
  /** Extra class names on the root element */
  className?: string;
}

export default function CreditsDisplay({ className }: CreditsDisplayProps) {
  const { credits, plan, loading } = useCredits();

  if (loading) {
    return (
      <div className={cn("h-8 w-24 rounded-lg bg-surface-2 animate-pulse", className)} />
    );
  }

  if (credits === null) return null;

  const isOut     = credits === 0;
  const isLow     = credits > 0 && credits <= 5;
  const isHealthy = credits > 5;

  const pillColor = isOut
    ? "bg-red-500/15 border-red-500/30 text-red-400"
    : isLow
    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
    : "bg-accent/10 border-accent/20 text-accent";

  const iconColor = isOut ? "text-red-400" : isLow ? "text-amber-400" : "text-accent";

  return (
    <Link
      href="/settings?tab=billing"
      title={`${credits} credits remaining — ${plan ?? "free"} plan. Click to upgrade.`}
      className={cn(
        "flex items-center gap-1.5 px-2.5 h-9 rounded-lg border transition-all duration-200",
        "hover:brightness-110 select-none",
        pillColor,
        className
      )}
    >
      {/* Icon */}
      {isOut || isLow ? (
        <AlertTriangle className={cn("w-3.5 h-3.5 flex-shrink-0", iconColor)} />
      ) : (
        <Zap className={cn("w-3.5 h-3.5 flex-shrink-0 fill-current", iconColor)} />
      )}

      {/* Credits count */}
      <span className="text-xs font-bold tabular-nums">
        {isOut ? "0" : credits}
      </span>

      {/* Separator + plan badge — hidden on very small screens */}
      <span className="hidden sm:flex items-center gap-1">
        <span className="opacity-40 text-xs">·</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
          {plan ?? "free"}
        </span>
      </span>

      {/* Low-credit inline warning */}
      {(isOut || isLow) && (
        <span className="hidden md:block text-[10px] font-medium ml-0.5">
          {isOut ? "— Upgrade" : "— Low"}
        </span>
      )}
    </Link>
  );
}

// ── Separate toast-style banner for use inside feature pages ──────────────────

export function LowCreditsBanner({ credits }: { credits: number | null }) {
  if (credits === null || credits > 5) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium mb-4",
        credits === 0
          ? "bg-red-500/10 border border-red-500/25 text-red-400"
          : "bg-amber-500/10 border border-amber-500/25 text-amber-400"
      )}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      {credits === 0 ? (
        <>
          You have no credits left.{" "}
          <Link href="/settings?tab=billing" className="underline underline-offset-2 font-bold">
            Upgrade your plan
          </Link>{" "}
          to continue using AI features.
        </>
      ) : (
        <>
          Only <strong>{credits}</strong> credit{credits === 1 ? "" : "s"} remaining.{" "}
          <Link href="/settings?tab=billing" className="underline underline-offset-2 font-bold">
            Upgrade
          </Link>{" "}
          to avoid interruptions.
        </>
      )}
    </div>
  );
}
