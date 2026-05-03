"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";

/**
 * Sticky banner shown at the top of the dashboard when a user's
 * paid subscription has expired. Free plan users never see this.
 */
export default function SubscriptionExpiredBanner() {
  const { plan, planExpiresAt, isExpired, loading } = useCredits();

  // Only show for paid plans that have expired
  if (loading || !isExpired || plan === "free" || !planExpiresAt) return null;

  const expiredDate = new Date(planExpiresAt).toLocaleDateString("en-IN", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  });

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/25 px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2.5 text-sm text-amber-400 font-medium">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          Your {plan} subscription expired on {expiredDate}.
          AI features are disabled.
        </span>
      </div>
      <Link
        href="/settings?tab=billing"
        className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 border border-amber-500/40 hover:border-amber-400/60 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Renew Subscription
      </Link>
    </div>
  );
}
