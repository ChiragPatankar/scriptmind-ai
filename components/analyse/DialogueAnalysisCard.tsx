"use client";

import React from "react";
import { MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  dialogueStrength,
  bandProgressClass,
  scoreBand,
} from "@/components/analyse/analyse-score-utils";
import { cn } from "@/lib/utils";

export function DialogueAnalysisCard({
  qualityScore,
  readability,
}: {
  qualityScore: number;
  readability?: number;
}) {
  const label = dialogueStrength(qualityScore);
  const band = scoreBand(qualityScore);
  const pct = Math.min(100, Math.max(0, (qualityScore / 10) * 100));

  const labelClass =
    label === "Weak"
      ? "text-red-400 bg-red-500/15 border-red-500/30"
      : label === "Average"
        ? "text-amber-300 bg-amber-500/12 border-amber-500/25"
        : "text-emerald-400 bg-emerald-500/12 border-emerald-500/25";

  return (
    <Card variant="default" className="border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <MessageSquareText className="w-4 h-4 text-secondary" />
          </span>
          Dialogue analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                  Quality score
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tabular-nums text-text-primary">
                    {qualityScore.toFixed(1)}
                  </span>
                  <span className="text-sm text-text-muted">/ 10</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Dialogue density, subtext, voice consistency, and exposition balance.
            </TooltipContent>
          </Tooltip>

          <div
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold border",
              labelClass
            )}
          >
            {label}
          </div>
        </div>

        <div>
          <Progress
            value={pct}
            className="h-2.5 bg-surface-3"
            indicatorClassName={cn("rounded-full", bandProgressClass(band))}
          />
        </div>

        {readability != null && (
          <div className="rounded-xl border border-border/80 bg-surface-2/50 px-4 py-3 flex items-center justify-between gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-text-muted cursor-default">
                  Readability index
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Flesch-Kincaid–style readability adapted for screenplay format (higher = easier scan).
              </TooltipContent>
            </Tooltip>
            <span className="text-lg font-bold tabular-nums text-text-primary">
              {readability}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
