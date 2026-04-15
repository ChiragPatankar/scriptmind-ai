"use client";

import React from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  bandTextClass,
  bandProgressClass,
  bandGlowClass,
  scoreBand,
} from "@/components/analyse/analyse-score-utils";

type Metric = {
  key: string;
  label: string;
  tooltip: string;
};

const METRICS: Metric[] = [
  {
    key: "originality",
    label: "Originality Score",
    tooltip:
      "How distinct your premise and execution are versus common genre patterns. Higher means fresher story DNA.",
  },
  {
    key: "hook",
    label: "Opening Hook Strength",
    tooltip:
      "First pages: clarity of conflict, tone, and audience promise. Strong hooks establish stakes fast.",
  },
  {
    key: "engagement",
    label: "Engagement Score",
    tooltip:
      "Pacing, scene variety, and tension curves — will readers want to turn the page?",
  },
  {
    key: "emotional",
    label: "Emotional Hook Strength",
    tooltip:
      "Relational stakes and character empathy — how much we care when things go wrong.",
  },
];

function MetricCard({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: number;
  tooltip: string;
}) {
  const band = scoreBand(value);
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));

  return (
    <Card
      variant="default"
      className={cn(
        "group border-border/80 bg-surface/80 backdrop-blur-sm transition-all duration-300",
        "hover:border-accent/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
      )}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {label}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-text-muted hover:text-secondary transition-colors shrink-0"
                aria-label={`About ${label}`}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-left leading-relaxed">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-baseline gap-1.5 mb-4">
          <span
            className={cn(
              "text-4xl sm:text-5xl font-black tabular-nums tracking-tight transition-colors",
              bandTextClass(band),
              bandGlowClass(band)
            )}
          >
            {value.toFixed(1)}
          </span>
          <span className="text-sm font-medium text-text-muted">/ 10</span>
        </div>

        <div className="relative">
          <Progress
            value={pct}
            className="h-2 bg-surface-3/90"
            indicatorClassName={cn("rounded-full", bandProgressClass(band))}
          />
          {/* Mini gauge accent */}
          <div
            className="pointer-events-none absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${
                band === "low"
                  ? "rgba(239,68,68,0.15)"
                  : band === "mid"
                    ? "rgba(251,191,36,0.12)"
                    : "rgba(52,211,153,0.15)"
              } 0%, transparent 65%)`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCardsSection({
  originality,
  hook,
  engagement,
  emotional,
}: {
  originality: number;
  hook: number;
  engagement: number;
  emotional: number;
}) {
  const values = { originality, hook, engagement, emotional };

  return (
    <section aria-labelledby="analyse-metrics-heading">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h2
            id="analyse-metrics-heading"
            className="text-lg font-bold text-text-primary"
          >
            Top metrics
          </h2>
          <p className="text-xs text-text-muted">
            Scored 0–10 · Colour indicates band (red / amber / green)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <MetricCard
            key={m.key}
            label={m.label}
            value={values[m.key as keyof typeof values]}
            tooltip={m.tooltip}
          />
        ))}
      </div>
    </section>
  );
}
