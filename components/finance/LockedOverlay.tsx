"use client";

import React from "react";
import Link  from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      {/* Blurred content — still in DOM so layout doesn't shift */}
      <div
        style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl z-10"
        style={{ background: "rgba(10, 10, 20, 0.72)", backdropFilter: "blur(2px)" }}
      >
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            Upgrade to Pro to unlock this feature
          </p>
          <p className="text-xs text-text-muted max-w-xs">
            Territory breakdown, investor analysis, and detailed projections are available on the Pro plan.
          </p>
          <Button asChild size="sm" className="mt-1">
            <Link href="/pricing">Upgrade to Pro 🚀</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
