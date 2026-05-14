"use client";

import type { DraftStatus } from "@/lib/draft/useFeatureDraft";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, Loader2, Save } from "lucide-react";
import React, { useEffect, useState } from "react";

interface SaveButtonProps {
  status: DraftStatus;
  isDirty: boolean;
  lastSavedAt: number | null;
  onClick: () => void;
  className?: string;
  /** Visual size variant. */
  size?: "sm" | "md";
}

function relativeTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  if (diff < 4_000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleString();
}

/**
 * One reusable Save button with all four states baked in:
 *   • idle         → "Save" (subtle, secondary)
 *   • dirty        → "Save changes" (accent, primary)
 *   • saving       → spinner + "Saving…" (disabled)
 *   • saved/idle+ts→ "Saved 30s ago" (success colour, button still clickable to re-save)
 *   • error        → red "Save failed — retry"
 */
export function SaveButton({
  status,
  isDirty,
  lastSavedAt,
  onClick,
  className,
  size = "sm",
}: SaveButtonProps) {
  // Re-render every 30s so the relative timestamp stays current.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const isSaving = status === "saving";
  const isError = status === "error";
  const showSavedFlash = status === "saved";

  const baseSizing =
    size === "md"
      ? "px-4 py-2 text-sm rounded-xl"
      : "px-3 py-1.5 text-xs rounded-lg";

  let label: React.ReactNode;
  let Icon = Save;
  let variant: "neutral" | "primary" | "success" | "error" = "neutral";

  if (isError) {
    label = "Save failed — retry";
    Icon = AlertCircle;
    variant = "error";
  } else if (isSaving) {
    label = "Saving…";
    Icon = Loader2;
    variant = "neutral";
  } else if (isDirty) {
    label = "Save on this device";
    Icon = Save;
    variant = "primary";
  } else if (showSavedFlash) {
    label = "Saved on this device";
    Icon = Check;
    variant = "success";
  } else if (lastSavedAt) {
    label = `Saved on this device · ${relativeTime(lastSavedAt)}`;
    Icon = Check;
    variant = "success";
  } else {
    label = "Save on this device";
    Icon = Save;
    variant = "neutral";
  }

  const variantClasses: Record<typeof variant, string> = {
    neutral:
      "bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:border-accent/30",
    primary:
      "bg-accent text-white border border-accent hover:bg-accent/90 shadow-sm shadow-accent/20",
    success:
      "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50",
    error:
      "bg-red-500/10 border border-red-500/30 text-red-400 hover:border-red-500/50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      title={
        lastSavedAt
          ? `Saved on this device at ${new Date(lastSavedAt).toLocaleString()}.\nDrafts live in this browser only — switching devices won't carry them over.`
          : "Save the current state to this browser. Drafts stay on this device only."
      }
      className={cn(
        "inline-flex items-center gap-1.5 font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed",
        baseSizing,
        variantClasses[variant],
        className
      )}
      aria-live="polite"
    >
      <Icon className={cn("w-3.5 h-3.5", isSaving && "animate-spin")} />
      <span>{label}</span>
    </button>
  );
}
