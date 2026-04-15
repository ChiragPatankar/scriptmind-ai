"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ImprovementTracker({
  previousScore,
  newScore,
}: {
  previousScore: number;
  newScore: number;
}) {
  const delta = Math.round((newScore - previousScore) * 10) / 10;
  const improved = delta > 0;

  return (
    <Card
      variant="default"
      className="border-border/80 bg-gradient-to-br from-surface via-surface to-surface-2/80 overflow-hidden"
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary mb-1">
              Improvement tracker
            </h2>
            <p className="text-xs text-text-muted max-w-md">
              Compares this revision to your last analysed draft. Upload again after edits to track progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-default">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                    Previous score
                  </div>
                  <div className="text-2xl font-black tabular-nums text-text-secondary">
                    {previousScore.toFixed(1)}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Overall composite from your prior upload</TooltipContent>
            </Tooltip>

            <div className="hidden sm:block w-px h-12 bg-border" aria-hidden />

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-default">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                    New score
                  </div>
                  <div className="text-2xl font-black tabular-nums text-text-primary">
                    {newScore.toFixed(1)}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Weighted blend of structure, dialogue, and originality signals</TooltipContent>
            </Tooltip>

            <div
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 border",
                improved
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-surface-3 border-border text-text-muted"
              )}
            >
              <TrendingUp
                className={cn("w-5 h-5", improved ? "text-emerald-400" : "text-text-muted")}
              />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider opacity-80">
                  Change
                </div>
                <div className="text-lg font-black tabular-nums leading-none">
                  {improved ? "↑" : ""}
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
