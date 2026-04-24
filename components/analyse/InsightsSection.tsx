"use client";

import React from "react";
import { Lightbulb, Star, GitBranch, Timer, User, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StructuredInsights } from "@/lib/mock/analyse-script";

const CATEGORIES = [
  {
    key: "plotHoles" as keyof StructuredInsights,
    label: "Plot holes",
    icon: GitBranch,
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    iconColor: "#EF4444",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
    bulletClass: "bg-red-400",
  },
  {
    key: "pacingIssues" as keyof StructuredInsights,
    label: "Pacing issues",
    icon: Timer,
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.25)",
    iconColor: "#FBBF24",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    bulletClass: "bg-amber-400",
  },
  {
    key: "weakCharacters" as keyof StructuredInsights,
    label: "Weak characters",
    icon: User,
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
    iconColor: "#F97316",
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    bulletClass: "bg-orange-400",
  },
  {
    key: "repetitiveDialogue" as keyof StructuredInsights,
    label: "Repetitive dialogue",
    icon: MessageSquare,
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.25)",
    iconColor: "#818CF8",
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    bulletClass: "bg-indigo-400",
  },
];

function RiskCard({
  label, icon: Icon, bg, border, iconColor, badgeClass, bulletClass, items,
}: {
  label: string;
  icon: React.ElementType;
  bg: string;
  border: string;
  iconColor: string;
  badgeClass: string;
  bulletClass: string;
  items: string[];
}) {
  if (!items.length) {
    return (
      <div
        className="rounded-2xl border p-4 sm:p-5"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}20` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
          </div>
          <span className="text-sm font-bold text-text-primary">{label}</span>
          <span className={cn("ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border", badgeClass)}>
            None found
          </span>
        </div>
        <p className="text-xs text-text-muted italic">No {label.toLowerCase()} detected.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-4 sm:p-5"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
        </div>
        <span className="text-sm font-bold text-text-primary">{label}</span>
        <span className={cn("ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border", badgeClass)}>
          {items.length} {items.length === 1 ? "issue" : "issues"}
        </span>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
            <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", bulletClass)} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InsightsSection({
  insights,
  bestScene,
}: {
  insights: StructuredInsights;
  bestScene: string;
}) {
  const totalIssues =
    insights.plotHoles.length +
    insights.pacingIssues.length +
    insights.weakCharacters.length +
    insights.repetitiveDialogue.length;

  return (
    <section aria-labelledby="insights-heading">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.25)" }}>
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 id="insights-heading" className="text-lg font-bold text-text-primary">
            Risk &amp; improvement engine
          </h2>
          <p className="text-xs text-text-muted">
            {totalIssues === 0
              ? "No major issues detected — clean script!"
              : `${totalIssues} total issue${totalIssues !== 1 ? "s" : ""} across ${CATEGORIES.filter(c => insights[c.key].length > 0).length} categories`}
          </p>
        </div>
      </div>

      {/* Risk cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {CATEGORIES.map((cat) => (
          <RiskCard
            key={cat.key}
            label={cat.label}
            icon={cat.icon}
            bg={cat.bg}
            border={cat.border}
            iconColor={cat.iconColor}
            badgeClass={cat.badgeClass}
            bulletClass={cat.bulletClass}
            items={insights[cat.key]}
          />
        ))}
      </div>

      {/* Most impactful scene */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(99,102,241,0.3)", background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 50%, transparent 100%)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(99,102,241,0.2)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(251,191,36,0.15)" }}>
              <Star className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-sm font-bold text-text-primary">Most impactful scene</span>
          </div>
        </div>
        <div className="px-5 py-5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">AI Highlight</p>
          <p className="text-base font-semibold text-text-primary leading-relaxed">
            {bestScene && bestScene !== "—" ? bestScene : "No specific scene identified."}
          </p>
        </div>
      </div>
    </section>
  );
}
