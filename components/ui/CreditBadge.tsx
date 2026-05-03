"use client";

import React from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBadgeProps {
  cost: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Displays the credit cost of a feature.
 * E.g. <CreditBadge cost={2} label="per analysis" />
 */
export function CreditBadge({ cost, label = "credits", size = "md", className }: CreditBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full border",
        size === "sm"
          ? "text-[10px] px-2 py-0.5 gap-0.5"
          : "text-xs px-2.5 py-1",
        "bg-amber-500/10 border-amber-500/25 text-amber-400",
        className
      )}
    >
      <Zap className={cn("flex-shrink-0", size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3")} />
      {cost} {label}
    </span>
  );
}
