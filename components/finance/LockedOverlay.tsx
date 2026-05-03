"use client";

import React from "react";
import Link  from "next/link";
import { Lock, ArrowRight, Zap } from "lucide-react";

interface LockedOverlayProps {
  locked:   boolean;
  children: React.ReactNode;
}

/**
 * Wraps children with a blur + overlay when `locked` is true.
 * When not locked, renders children as-is — zero overhead.
 */
export default function LockedOverlay({ locked, children }: LockedOverlayProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred content */}
      <div
        style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl z-10"
        style={{ background: "rgba(10, 10, 20, 0.75)", backdropFilter: "blur(2px)" }}
      >
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary mb-1">
              Basic or Pro plan required
            </p>
            <p className="text-xs text-text-muted max-w-xs leading-relaxed">
              Territory breakdown, investor analysis, and detailed projections are unlocked on paid plans.
            </p>
          </div>

          {/* Primary CTA → Settings / Billing */}
          <Link
            href="/settings?tab=billing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            <Zap className="w-4 h-4 fill-current" />
            Upgrade Now
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Secondary link */}
          <Link
            href="/pricing"
            className="text-xs text-text-muted hover:text-accent underline underline-offset-2 transition-colors"
          >
            Compare plans
          </Link>
        </div>
      </div>
    </div>
  );
}
