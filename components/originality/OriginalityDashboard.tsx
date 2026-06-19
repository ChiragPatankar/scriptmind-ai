"use client";

import React from "react";
import {
  Fingerprint,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Repeat2,
  Lightbulb,
  Gem,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  OriginalityReport,
  TropeItem,
  PatternItem,
  TropeSeverity,
} from "@/lib/originality-api";

/** For "higher is better" metrics (originality, dialogue uniqueness). */
function goodColor(v: number): string {
  if (v >= 70) return "#34D399"; // green
  if (v >= 45) return "#FBBF24"; // amber
  return "#F87171"; // red
}

/** For "higher is worse" metrics (tropes, predictability). */
function riskColor(v: number): string {
  if (v >= 70) return "#F87171"; // red
  if (v >= 45) return "#FBBF24"; // amber
  return "#34D399"; // green
}

const SEVERITY_STYLE: Record<TropeSeverity, string> = {
  low: "bg-green-500/10 border-green-500/30 text-green-400",
  medium: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  high: "bg-red-500/10 border-red-500/30 text-red-400",
};

/** Large circular gauge for the headline Originality Score. */
function ScoreGauge({ value }: { value: number }) {
  const size = 168;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circ;
  const color = goodColor(value);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(42 42 58)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black" style={{ color }}>
          {value}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          / 100
        </span>
      </div>
    </div>
  );
}

/** Horizontal meter for a single metric. */
function Meter({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: number;
  hint: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        <span className="text-lg font-black tabular-nums" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[11px] text-text-muted mt-2 leading-relaxed">{hint}</p>
    </div>
  );
}

/** Generic bullet-list section. */
function ListSection({
  icon: Icon,
  title,
  accent,
  items,
  empty,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${accent}`} />
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm text-text-secondary leading-relaxed">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${accent.replace("text-", "bg-")}`} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted italic">{empty}</p>
      )}
    </section>
  );
}

function TropesSection({ tropes }: { tropes: TropeItem[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-text-primary">Overused Tropes</h3>
      </div>
      {tropes.length > 0 ? (
        <ul className="space-y-3">
          {tropes.map((t, i) => (
            <li key={i} className="border-b border-border/50 last:border-0 pb-3 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-text-primary">{t.name}</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${SEVERITY_STYLE[t.severity]}`}
                >
                  {t.severity}
                </span>
              </div>
              {t.note && <p className="text-xs text-text-muted leading-relaxed">{t.note}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted italic">No overused tropes detected.</p>
      )}
    </section>
  );
}

function PatternsSection({ patterns }: { patterns: PatternItem[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <Repeat2 className="w-4 h-4 text-secondary" />
        <h3 className="text-sm font-bold text-text-primary">Repetitive Dialogue Patterns</h3>
      </div>
      {patterns.length > 0 ? (
        <ul className="space-y-3">
          {patterns.map((p, i) => (
            <li key={i} className="border-b border-border/50 last:border-0 pb-3 last:pb-0">
              <p className="text-sm font-semibold text-text-primary">{p.pattern}</p>
              {p.detail && <p className="text-xs text-text-muted leading-relaxed mt-0.5">{p.detail}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted italic">No notable repetitive patterns found.</p>
      )}
    </section>
  );
}

export function OriginalityDashboard({
  report,
  onAnalyseAnother,
}: {
  report: OriginalityReport;
  onAnalyseAnother: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-border/60 pb-7">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary mb-2">
            <Fingerprint className="w-3.5 h-3.5" />
            Originality Intelligence
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary">{report.scriptTitle}</h1>
          <p className="text-sm text-text-muted mt-2">
            Narrative-similarity & originality analysis
          </p>
        </div>
        <Button variant="secondary" onClick={onAnalyseAnother} className="gap-2 shrink-0">
          <RefreshCw className="w-4 h-4" />
          Analyse another
        </Button>
      </header>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface-2/40 px-4 py-3">
        <Info className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted leading-relaxed">
          This is an <span className="font-semibold text-text-secondary">originality and narrative-similarity</span>{" "}
          assessment to help strengthen your story. It is <span className="font-semibold text-text-secondary">not</span>{" "}
          legal plagiarism or copyright detection, and makes no claims about copying.
        </p>
      </div>

      {/* Headline score + meters */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            Originality Score
          </h3>
          <ScoreGauge value={report.originalityScore} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Meter
            label="Trope Meter"
            value={report.tropeScore}
            color={riskColor(report.tropeScore)}
            hint="Higher = more reliance on familiar tropes & clichés."
          />
          <Meter
            label="Predictability"
            value={report.predictabilityScore}
            color={riskColor(report.predictabilityScore)}
            hint="Higher = more formulaic, easy-to-foresee beats."
          />
          <Meter
            label="Dialogue Uniqueness"
            value={report.dialogueUniqueness}
            color={goodColor(report.dialogueUniqueness)}
            hint="Higher = more distinctive, non-generic dialogue."
          />
        </div>
      </section>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ListSection
          icon={ShieldCheck}
          title="Strengths"
          accent="text-green-400"
          items={report.strengths}
          empty="No standout strengths identified yet."
        />
        <ListSection
          icon={AlertTriangle}
          title="Similar Narrative Patterns"
          accent="text-red-400"
          items={report.risks}
          empty="No notable narrative-similarity risks found."
        />
        <TropesSection tropes={report.commonTropes} />
        <PatternsSection patterns={report.repetitivePatterns} />
        <ListSection
          icon={Lightbulb}
          title="Rewrite Suggestions"
          accent="text-accent"
          items={report.recommendations}
          empty="No recommendations — your script reads as original."
        />
        <ListSection
          icon={Gem}
          title="Unique Selling Elements"
          accent="text-secondary"
          items={report.standoutElements}
          empty="No standout selling elements identified yet."
        />
      </div>
    </div>
  );
}
