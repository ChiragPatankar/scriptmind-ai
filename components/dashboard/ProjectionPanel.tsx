"use client";

// ══════════════════════════════════════════════════════════════════════════════
//  ScriptMind AI — Revenue Projection Panel  (v2)
//  Deterministic hybrid engine — zero randomness.
//  Gemini used only on-demand (AI Insights button) with maxOutputTokens=400.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Zap, Calendar, Users, Star, Megaphone,
  Film, Clapperboard, AlertTriangle, RefreshCw, Info, ChevronDown,
  Sparkles, BarChart2, Target, Rocket, MonitorPlay, Youtube,
  CheckCircle2, XCircle, Lightbulb, Loader2, Eye, Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calculateProjection,
  projectionZone,
  ZONE_COLORS,
  ZONE_LABELS,
  STAR_LEVEL_LABELS,
  RELEASE_GENRE_LABELS,
  MARKETING_LABELS,
  FULL_TIMING_LABELS,
  FULL_AUDIENCE_LABELS,
  PLATFORM_LABELS,
  type ProjectionInputs,
  type ProjectionResult,
  type Platform,
  type StarLevel,
  type ReleaseGenre,
  type MarketingLevel,
  type FullReleaseTiming,
  type FullAudienceType,
} from "@/lib/financial/projection";

// ── Formatting ─────────────────────────────────────────────────────────────────

const fmt      = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
const fmtMult  = (n: number) => `${n.toFixed(2)}×`;
const fmtViews = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
};

function round2(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

// ── Design tokens ───────────────────────────────────────────────────────────────

const C = {
  blue:   "#1D77C5",
  cyan:   "#00C2E0",
  gold:   "#F59E0B",
  green:  "#22C55E",
  red:    "#EF4444",
  purple: "#A78BFA",
  amber:  "#F59E0B",
};

const SENTIMENT_COLORS = {
  positive: C.green,
  negative: C.red,
  neutral:  C.cyan,
} as const;

// ── Animated number counter ─────────────────────────────────────────────────────

function AnimatedNumber({ value, format = fmt }: { value: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef  = useRef<number | null>(null);
  useEffect(() => {
    const from = prevRef.current, to = value, duration = 600, start = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);
  return <span>{format(display)}</span>;
}

// ── Generic select ──────────────────────────────────────────────────────────────

function Select<T extends string>({
  value, onChange, options, label, icon: Icon,
}: { value: T; onChange: (v: T) => void; options: Record<T, string>; label: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={cn(
            "w-full appearance-none rounded-xl px-3 pr-8 py-2.5 text-sm font-medium",
            "bg-surface-2 border border-border text-text-primary",
            "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all cursor-pointer",
          )}
        >
          {(Object.entries(options) as [T, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
      </div>
    </div>
  );
}

// ── Number input field ──────────────────────────────────────────────────────────

function NumberField({
  label, value, onChange, prefix = "₹", suffix = "Cr", min = 0, step = 0.01, icon: Icon,
}: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; min?: number; step?: number; icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted">{prefix}</span>
        <input
          type="number" min={min} step={step}
          value={value === 0 ? "" : round2(value)}
          onChange={(e) => onChange(round2(Math.max(min, parseFloat(e.target.value) || 0)))}
          className={cn(
            "w-full rounded-xl pl-7 pr-10 py-2.5 text-sm font-semibold",
            "bg-surface-2 border border-border text-text-primary",
            "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all",
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-bold">{suffix}</span>
      </div>
    </div>
  );
}

// ── 10-pip rating bar ───────────────────────────────────────────────────────────

function RatingBar({ label, value, onChange, tooltip }: { label: string; value: number; onChange: (v: number) => void; tooltip?: string }) {
  const col = value <= 3 ? C.red : value <= 6 ? C.gold : C.green;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1">
          {label}
          {tooltip && (
            <span title={tooltip} className="cursor-help opacity-50 hover:opacity-100">
              <Info className="w-3 h-3" />
            </span>
          )}
        </label>
        <span className="text-xs font-black tabular-nums" style={{ color: col }}>{value}/10</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => {
          const pip = i + 1;
          const c   = i < 3 ? C.red : i < 6 ? C.gold : C.green;
          return (
            <button
              key={pip} type="button"
              onClick={() => onChange(pip)}
              className="flex-1 h-3 rounded-sm transition-all duration-150"
              style={{ background: value >= pip ? c : "rgba(var(--border-rgb,100,100,120),0.3)" }}
              title={`${pip}/10`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Metric card ─────────────────────────────────────────────────────────────────

function MetricCard({
  label, display, icon: Icon, color, sub,
}: { label: string; display: React.ReactNode; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 relative overflow-hidden flex-1 min-w-0"
      style={{ background: "var(--card-bg,rgba(255,255,255,0.04))", border: `1px solid ${color}25`, boxShadow: `0 2px 12px ${color}0c` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted leading-tight">{label}</span>
      </div>
      <div className="text-lg font-black tabular-nums" style={{ color }}>{display}</div>
      {sub && <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ── Default inputs ──────────────────────────────────────────────────────────────

function makeDefaultInputs(budgetSeed?: number, scriptSeed?: number): ProjectionInputs {
  return {
    platform:                "theatrical",
    genre:                   "action",
    starPower:               "medium",
    marketing:               "medium",
    timing:                  "normal",
    audienceType:            "mass",
    scriptQualityScore:      scriptSeed ?? 6,
    historicalDataInfluence: 5,
    benchmarkMatch:          5,
    productionBudget:        round2(budgetSeed ?? 50),
    marketingBudget:         10,
    pnaExpenses:             5,
    isExceptionalMovie:      false,
    reach:                   5_000_000,
    engagementRate:          0.30,
    cpm:                     100,
  };
}

// ── Props ───────────────────────────────────────────────────────────────────────

interface ProjectionPanelProps {
  budgetSeed?:     number;
  scriptScoreSeed?: number;
  hideHeader?:     boolean;
  className?:      string;
}

// ══════════════════════════════════════════════════════════════════════════════
//  Main Panel
// ══════════════════════════════════════════════════════════════════════════════

export function ProjectionPanel({ budgetSeed, scriptScoreSeed, hideHeader = false, className }: ProjectionPanelProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [inputs, setInputs] = useState<ProjectionInputs>(() => makeDefaultInputs(budgetSeed, scriptScoreSeed));

  // Sync seeds from parent
  useEffect(() => {
    if (budgetSeed !== undefined)     setInputs((p) => ({ ...p, productionBudget: round2(budgetSeed) }));
  }, [budgetSeed]);
  useEffect(() => {
    if (scriptScoreSeed !== undefined) {
      const mapped = Math.max(1, Math.min(10, Math.round(scriptScoreSeed / 10)));
      setInputs((p) => ({ ...p, scriptQualityScore: mapped }));
    }
  }, [scriptScoreSeed]);

  const [showBreakdown,   setShowBreakdown]   = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [showWeekly,      setShowWeekly]      = useState(true);
  const [showSimilar,     setShowSimilar]     = useState(false);

  // Gemini AI insights — on-demand only, cached per result key
  const [aiInsights,    setAiInsights]    = useState<string[]>([]);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [aiError,       setAiError]       = useState<string | null>(null);
  const aiCacheKey = useRef<string>("");

  // ── Input updater (stable reference via useCallback + prev pattern) ─────────
  const updateInput = useCallback(<K extends keyof ProjectionInputs>(key: K, value: ProjectionInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    // Clear AI insights when inputs change (would be stale)
    setAiInsights([]);
    setAiError(null);
  }, []);

  // ── Core calculation — useMemo for performance, deterministic output ────────
  // Same inputs always return same result (no random, no Date.now in calculation)
  const result = useMemo<ProjectionResult>(() => calculateProjection(inputs), [inputs]);

  // ── Derived display values ──────────────────────────────────────────────────
  const isDigital = inputs.platform !== "theatrical";
  const zone      = useMemo(
    () => projectionZone(result.finalRevenue, result.totalExpenses),
    [result.finalRevenue, result.totalExpenses],
  );
  const zoneColor = ZONE_COLORS[zone];
  const zoneLabel = ZONE_LABELS[zone];

  // ── Gemini on-demand fetch ──────────────────────────────────────────────────
  const fetchAiInsights = useCallback(async () => {
    const cacheKey = JSON.stringify({
      finalMultiplier: result.finalMultiplier.toFixed(3),
      finalRevenue: result.finalRevenue.toFixed(2),
      breakEvenWeek: result.breakEvenWeek,
      genre: inputs.genre,
      platform: inputs.platform,
    });

    // Cache hit — don't re-call Gemini
    if (cacheKey === aiCacheKey.current && aiInsights.length > 0) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/projection-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre:           inputs.genre,
          platform:        inputs.platform,
          starPower:       inputs.starPower,
          marketing:       inputs.marketing,
          timing:          inputs.timing,
          audienceType:    inputs.audienceType,
          scriptQualityScore:  inputs.scriptQualityScore,
          isExceptionalMovie:  inputs.isExceptionalMovie,
          finalMultiplier:     result.finalMultiplier,
          finalRevenue:        result.finalRevenue,
          totalExpenses:       result.totalExpenses,
          breakEvenWeek:       result.breakEvenWeek,
          breakEvenAchieved:   result.breakEvenAchieved,
          weightedScore:       result.weightedScore,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      aiCacheKey.current = cacheKey;
      setAiInsights(Array.isArray(data.insights) ? data.insights : []);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to load insights");
    } finally {
      setAiLoading(false);
    }
  }, [inputs, result, aiInsights.length]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col gap-6", className)}>

      {/* ── Header ── */}
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,194,224,0.15)", border: "1px solid rgba(0,194,224,0.30)" }}>
              <TrendingUp className="w-5 h-5" style={{ color: C.cyan }} />
            </div>
            <div>
              <h3 className="text-base font-black text-text-primary">Revenue Projection Engine</h3>
              <p className="text-xs text-text-muted">Hybrid weighted forecast — 60% factor model + 40% dataset</p>
            </div>
          </div>
          <button
            onClick={() => setInputs(makeDefaultInputs(budgetSeed, scriptScoreSeed))}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg",
              "text-text-muted border border-border hover:text-accent hover:border-accent/40 transition-colors",
            )}
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>
      )}

      {/* ── Platform selector ── */}
      <div className="flex gap-2 flex-wrap">
        {(["theatrical", "ott", "youtube"] as Platform[]).map((p) => {
          const active = inputs.platform === p;
          const icons  = { theatrical: Film, ott: MonitorPlay, youtube: Youtube };
          const PIcon  = icons[p];
          return (
            <button
              key={p}
              onClick={() => updateInput("platform", p)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                active
                  ? "text-white"
                  : "text-text-muted border border-border hover:border-accent/40 hover:text-text-primary",
              )}
              style={active ? { background: C.cyan, boxShadow: `0 0 16px ${C.cyan}50` } : {}}
            >
              <PIcon className="w-3.5 h-3.5" />
              {PLATFORM_LABELS[p]}
            </button>
          );
        })}
      </div>

      {/* ── Verdict badge ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={zone + result.finalMultiplier.toFixed(2)}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          className="relative rounded-2xl px-5 py-4 overflow-hidden"
          style={{ background: `${zoneColor}0d`, border: `1px solid ${zoneColor}30` }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 70% 80% at 15% 50%,${zoneColor}10,transparent 70%)` }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${zoneColor}18`, border: `1px solid ${zoneColor}35` }}>
                {zone === "blockbuster" ? <Rocket className="w-4 h-4" style={{ color: zoneColor }} />
                  : zone === "hit" ? <TrendingUp className="w-4 h-4" style={{ color: zoneColor }} />
                  : zone === "breakeven" ? <BarChart2 className="w-4 h-4" style={{ color: zoneColor }} />
                  : <TrendingDown className="w-4 h-4" style={{ color: zoneColor }} />}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Verdict</div>
                <div className="text-base font-black" style={{ color: zoneColor }}>{zoneLabel}</div>
              </div>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-[11px] text-text-muted font-semibold pb-0.5">Multiplier</span>
              <span className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: zoneColor }}>
                <AnimatedNumber value={result.finalMultiplier} format={fmtMult} />
              </span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-[11px] text-text-muted font-semibold pb-0.5">
                {isDigital ? "Digital Revenue" : "Projected"}
              </span>
              <span className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: zoneColor }}>
                <AnimatedNumber value={result.finalRevenue} />
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Investor Summary Card ── */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${C.purple}12, ${C.cyan}08)`,
          border: `1px solid ${C.purple}30`,
        }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, ${C.purple}, ${C.cyan})` }} />
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-1.5">
          <Star className="w-3 h-3" style={{ color: C.purple }} /> Investor Summary
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-black tabular-nums" style={{ color: C.purple }}>
              {(result.successProbability * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-text-muted mt-1 font-semibold">Hit Probability</div>
          </div>
          <div className="text-center border-l border-r border-border/30">
            <div className="text-xl font-black" style={{
              color:
                result.successLabel === "Strong Hit" ? C.green :
                result.successLabel === "Promising"  ? C.cyan  :
                result.successLabel === "Uncertain"  ? C.gold  : C.red,
            }}>
              {result.successLabel}
            </div>
            <div className="text-[10px] text-text-muted mt-1 font-semibold">Success Label</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black tabular-nums" style={{ color: C.cyan }}>
              {(result.confidenceScore * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-text-muted mt-1 font-semibold">Confidence</div>
          </div>
        </div>
      </div>

      {/* ── Top 4 metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Final Revenue"
          display={<AnimatedNumber value={result.finalRevenue} />}
          icon={Target}
          color={zoneColor}
          sub={isDigital ? "Digital model" : "Theatrical projection"}
        />
        <MetricCard
          label="Final Multiplier"
          display={<AnimatedNumber value={result.finalMultiplier} format={fmtMult} />}
          icon={TrendingUp}
          color={C.cyan}
          sub={`Base ${result.baseMultiplier.toFixed(2)}× | Dataset ${result.datasetMultiplier.toFixed(2)}×`}
        />
        <MetricCard
          label="Break-even"
          display={
            <span style={{ color: result.breakEvenAchieved ? C.green : C.amber }}>
              {result.breakEvenAchieved ? `Week ${result.breakEvenWeek}` : "Not in run"}
            </span>
          }
          icon={result.breakEvenAchieved ? CheckCircle2 : XCircle}
          color={result.breakEvenAchieved ? C.green : C.amber}
          sub={`Total spend: ${fmt(result.totalExpenses)}`}
        />
        <MetricCard
          label="Dataset Influence"
          display={`${((result.datasetMultiplier / (result.baseMultiplier + result.datasetMultiplier)) * 100).toFixed(1)}%`}
          icon={BarChart2}
          color={C.purple}
          sub={`Weighted score: ${(result.weightedScore * 100).toFixed(1)}%`}
        />
      </div>

      {/* ── Inputs + Results grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">

        {/* ── Input panel ── */}
        <div className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: "var(--card-bg,rgba(255,255,255,0.04))", border: "1px solid rgba(var(--border-rgb,100,100,120),0.35)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
            <Clapperboard className="w-3 h-3" /> Film Parameters
          </div>

          {/* Budget split */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NumberField label="Production Budget" value={inputs.productionBudget}
              onChange={(v) => updateInput("productionBudget", v)} icon={Film} />
            <NumberField label="Marketing Budget" value={inputs.marketingBudget}
              onChange={(v) => updateInput("marketingBudget", v)} icon={Megaphone} />
            <NumberField label="P&A / Distribution" value={inputs.pnaExpenses}
              onChange={(v) => updateInput("pnaExpenses", v)} icon={Target} />
          </div>
          <div className="text-[10px] text-text-muted px-1">
            Total spend: <strong className="text-text-secondary">{fmt(result.totalExpenses)}</strong>
          </div>

          {/* Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select<ReleaseGenre>
              value={inputs.genre} onChange={(v) => updateInput("genre", v)}
              options={RELEASE_GENRE_LABELS} label="Genre" icon={Film}
            />
            <Select<StarLevel>
              value={inputs.starPower} onChange={(v) => updateInput("starPower", v)}
              options={STAR_LEVEL_LABELS} label="Star Power" icon={Star}
            />
            <Select<MarketingLevel>
              value={inputs.marketing} onChange={(v) => updateInput("marketing", v)}
              options={MARKETING_LABELS} label="Marketing" icon={Megaphone}
            />
            <Select<FullReleaseTiming>
              value={inputs.timing} onChange={(v) => updateInput("timing", v)}
              options={FULL_TIMING_LABELS} label="Release Timing" icon={Calendar}
            />
            <Select<FullAudienceType>
              value={inputs.audienceType} onChange={(v) => updateInput("audienceType", v)}
              options={FULL_AUDIENCE_LABELS} label="Audience Type" icon={Users}
            />
          </div>

          {/* Rating pips */}
          <div className="space-y-4">
            <RatingBar
              label="Script Quality Score" value={inputs.scriptQualityScore}
              onChange={(v) => updateInput("scriptQualityScore", v)}
              tooltip="1–10: script quality from analysis module. Higher = better word-of-mouth."
            />
            <RatingBar
              label="Historical Data Influence" value={inputs.historicalDataInfluence}
              onChange={(v) => updateInput("historicalDataInfluence", v)}
              tooltip="How strongly the historical film dataset shapes this projection."
            />
            <RatingBar
              label="Benchmark Match" value={inputs.benchmarkMatch}
              onChange={(v) => updateInput("benchmarkMatch", v)}
              tooltip="How well this film aligns with high-performing benchmark films."
            />
          </div>

          {/* Exceptional toggle */}
          <label className="flex items-center gap-2 text-xs text-text-secondary font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inputs.isExceptionalMovie}
              onChange={(e) => updateInput("isExceptionalMovie", e.target.checked)}
            />
            Exceptional movie boost
            <span title="Multiplier capped at 3.5× with 25% uplift. Week-1 gets +15% bonus." className="cursor-help opacity-50 hover:opacity-100">
              <Info className="w-3 h-3" />
            </span>
          </label>

          {/* Digital-only params */}
          {isDigital && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl p-4 space-y-4"
              style={{ background: `${C.cyan}0a`, border: `1px solid ${C.cyan}25` }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: C.cyan }}>
                <Wifi className="w-3 h-3" /> Digital Parameters
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <NumberField
                  label="Reach (views / subscribers)"
                  value={inputs.reach ?? 0}
                  onChange={(v) => updateInput("reach", v)}
                  prefix="" suffix="viewers" step={100000}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    <Eye className="w-3 h-3" /> Engagement Rate
                  </label>
                  <div className="relative">
                    <input
                      type="number" min={0} max={1} step={0.01}
                      value={inputs.engagementRate ?? 0.3}
                      onChange={(e) => updateInput("engagementRate", Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                      className="w-full rounded-xl px-3 pr-10 py-2.5 text-sm font-semibold bg-surface-2 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-bold">0–1</span>
                  </div>
                </div>
                <NumberField
                  label="CPM (₹ / 1k views)"
                  value={inputs.cpm ?? 100}
                  onChange={(v) => updateInput("cpm", v)}
                  prefix="₹" suffix="/k"
                  step={10}
                />
              </div>
              {result.estimatedViews !== undefined && (
                <div className="flex gap-4 flex-wrap text-xs">
                  <span className="text-text-muted">Est. Views: <strong style={{ color: C.cyan }}>{fmtViews(result.estimatedViews)}</strong></span>
                  {result.adjustedEngagement !== undefined && (
                    <span className="text-text-muted">Adj. Engagement: <strong style={{ color: C.gold }}>{(result.adjustedEngagement * 100).toFixed(1)}%</strong></span>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* ── Results panel ── */}
        <div className="flex flex-col gap-4">

          {/* Theatrical split cards */}
          {!isDigital && (
            <div className="flex gap-3">
              <MetricCard label="Theatrical Revenue" display={<AnimatedNumber value={result.theatricalRevenue} />}
                icon={Film} color={C.blue} sub={`${inputs.isExceptionalMovie ? "65" : "60"}% of final`} />
              <MetricCard label="Digital / OTT Revenue" display={<AnimatedNumber value={result.digitalRevenue} />}
                icon={MonitorPlay} color={C.purple} sub={`${inputs.isExceptionalMovie ? "35" : "40"}% of final`} />
            </div>
          )}

          {/* Opening / Week1 cards */}
          <div className="flex gap-3">
            <MetricCard label="Opening Weekend" display={<AnimatedNumber value={result.openingWeekend} />}
              icon={Rocket} color={C.gold}
              sub={inputs.isExceptionalMovie ? "~45% of projection" : "~35% of projection"} />
            <MetricCard label="Week 1 Cumulative" display={<AnimatedNumber value={result.week1} />}
              icon={Calendar} color={C.cyan}
              sub={inputs.isExceptionalMovie ? "~75% of projection" : "~65% of projection"} />
          </div>

          {/* Estimate range */}
          <div className="rounded-2xl p-4"
            style={{ background: "var(--card-bg,rgba(255,255,255,0.04))", border: `1px solid ${zoneColor}20` }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
              <Info className="w-3 h-3" /> Estimate Range
            </div>
            <div className="flex justify-between text-[10px] font-semibold mb-2">
              <span style={{ color: C.red }}>Low: {fmt(result.lowEstimate)}</span>
              <span style={{ color: zoneColor }}>Mid: {fmt(result.finalRevenue)}</span>
              <span style={{ color: C.green }}>High: {fmt(result.highEstimate)}</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "rgba(var(--border-rgb,100,100,120),0.35)" }}>
              {result.highEstimate > 0 && (
                <>
                  <motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: C.red + "60" }}
                    animate={{ width: `${(result.lowEstimate / result.highEstimate) * 100}%` }} transition={{ duration: 0.7 }} />
                  <motion.div className="absolute left-0 top-0 h-full rounded-full"
                    style={{ background: `linear-gradient(90deg,${C.red}80,${zoneColor})` }}
                    animate={{ width: `${(result.finalRevenue / result.highEstimate) * 100}%` }} transition={{ duration: 0.8 }} />
                </>
              )}
            </div>
          </div>

          {/* Revenue Range Bar */}
          <div className="rounded-2xl p-4"
            style={{ background: "var(--card-bg,rgba(255,255,255,0.04))", border: `1px solid ${C.purple}20` }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
              Revenue Range  (Min · Mid · Max)
            </div>
            {(() => {
              const total = result.maxRevenue - result.minRevenue;
              const midPct = total > 0 ? ((result.finalRevenue - result.minRevenue) / total) * 100 : 50;
              return (
                <>
                  <div className="relative h-3 rounded-full overflow-hidden mb-2"
                    style={{ background: "rgba(var(--border-rgb,100,100,120),0.35)" }}>
                    <div className="absolute left-0 top-0 h-full rounded-full"
                      style={{ background: `linear-gradient(90deg,${C.red}60,${zoneColor},${C.green}60)`, width: "100%" }} />
                    {/* Mid-point marker */}
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10"
                      style={{ left: `${midPct}%`, background: "white", border: `2px solid ${zoneColor}`, boxShadow: `0 0 6px ${zoneColor}` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span style={{ color: C.red }}>{fmt(result.minRevenue)}</span>
                    <span style={{ color: zoneColor }}>{fmt(result.finalRevenue)}</span>
                    <span style={{ color: C.green }}>{fmt(result.maxRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-text-muted mt-0.5">
                    <span>Min (×0.70)</span>
                    <span>Projected</span>
                    <span>Max (×1.30)</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Break-even banner */}
          <div className={cn("rounded-xl px-4 py-3 flex items-center gap-3")}
            style={{
              background: result.breakEvenAchieved ? `${C.green}0d` : `${C.amber}0d`,
              border: `1px solid ${result.breakEvenAchieved ? C.green : C.amber}30`,
            }}>
            {result.breakEvenAchieved
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: C.green }} />
              : <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: C.amber }} />}
            <span className="text-xs font-semibold" style={{ color: result.breakEvenAchieved ? C.green : C.amber }}>
              {result.breakEvenAchieved
                ? `Break-even achieved in Week ${result.breakEvenWeek}`
                : "Break-even not achieved within the 4-week window"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Weekly Distribution Table ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(var(--border-rgb,100,100,120),0.35)" }}>
        <button
          onClick={() => setShowWeekly((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
            <Calendar className="w-4 h-4 text-accent" /> Weekly Distribution
          </div>
          <motion.div animate={{ rotate: showWeekly ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </motion.div>
        </button>
        <AnimatePresence>
          {showWeekly && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"
            >
              <div className="px-5 pb-5">
                <div className="h-px mb-4" style={{ background: "rgba(var(--border-rgb,100,100,120),0.3)" }} />
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-text-muted font-bold uppercase tracking-widest text-[9px]">
                      <th className="text-left pb-2">Week</th>
                      <th className="text-right pb-2">Revenue</th>
                      <th className="text-right pb-2">%</th>
                      <th className="text-right pb-2">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.weeklyDistribution.map((w, i) => {
                      const isBreakEven = result.breakEvenWeek === i + 1;
                      return (
                        <tr
                          key={w.week}
                          className="transition-colors"
                          style={isBreakEven ? { background: `${C.green}12` } : undefined}
                        >
                          <td className="py-1.5 font-semibold flex items-center gap-2 text-text-primary">
                            {w.week}
                            {isBreakEven && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                                style={{ background: `${C.green}20`, color: C.green }}>
                                BREAK-EVEN
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-text-secondary">{fmt(w.revenue)}</td>
                          <td className="py-1.5 text-right tabular-nums text-text-muted">{w.percentage.toFixed(0)}%</td>
                          <td className="py-1.5 text-right tabular-nums font-semibold" style={{ color: isBreakEven ? C.green : undefined }}>
                            {fmt(w.cumulativeRevenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Region Split ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: `${C.blue}0a`, border: `1px solid ${C.blue}25` }}>
          <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1">
            <Film className="w-3 h-3" /> India (Domestic)
          </div>
          <div className="text-xl font-black tabular-nums" style={{ color: C.blue }}>
            <AnimatedNumber value={result.domesticRevenue} />
          </div>
          <div className="text-[10px] text-text-muted mt-1">
            {result.finalRevenue > 0 ? ((result.domesticRevenue / result.finalRevenue) * 100).toFixed(0) : 0}% of projection
          </div>
        </div>
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: `${C.gold}0a`, border: `1px solid ${C.gold}25` }}>
          <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Overseas
          </div>
          <div className="text-xl font-black tabular-nums" style={{ color: C.gold }}>
            <AnimatedNumber value={result.overseasRevenue} />
          </div>
          <div className="text-[10px] text-text-muted mt-1">
            {result.finalRevenue > 0 ? ((result.overseasRevenue / result.finalRevenue) * 100).toFixed(0) : 0}% of projection
          </div>
        </div>
      </div>

      {/* ── OTT Deal Panel ── */}
      <div className="rounded-2xl p-5"
        style={{ background: `${C.cyan}08`, border: `1px solid ${C.cyan}25` }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1.5">
              <MonitorPlay className="w-3 h-3" style={{ color: C.cyan }} /> Estimated OTT Deal
            </div>
            <div className="text-2xl font-black tabular-nums" style={{ color: C.cyan }}>
              <AnimatedNumber value={result.ottDealEstimate} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-text-secondary">
              {result.finalMultiplier < 1.2
                ? "0.8× production budget"
                : result.finalMultiplier < 1.8
                ? "1.2× production budget"
                : "2.0× production budget"}
            </div>
            <div className="text-[10px] text-text-muted mt-0.5">
              {result.finalMultiplier < 1.2
                ? "Below-average multiplier band"
                : result.finalMultiplier < 1.8
                ? "Average multiplier band"
                : "Premium multiplier band"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Factor Breakdown ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(var(--border-rgb,100,100,120),0.35)" }}>
        <button
          onClick={() => setShowBreakdown((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
            <BarChart2 className="w-4 h-4 text-accent" /> Factor Breakdown & Weights
          </div>
          <motion.div animate={{ rotate: showBreakdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </motion.div>
        </button>
        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"
            >
              <div className="px-5 pb-5">
                <div className="h-px mb-4" style={{ background: "rgba(var(--border-rgb,100,100,120),0.3)" }} />
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-0.5 mb-2 text-[9px] font-bold uppercase tracking-widest text-text-muted">
                  <span>Factor</span>
                  <span className="text-right">Score</span>
                  <span className="text-right">Weight</span>
                  <span className="text-right">Contribution</span>
                </div>
                {result.factors.map((f) => {
                  const barColor = f.score >= 0.70 ? C.green : f.score >= 0.40 ? C.amber : C.red;
                  return (
                    <div key={f.key} className="py-2 border-b border-border/20 last:border-0">
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center mb-1.5">
                        <span className="text-xs font-semibold text-text-secondary">{f.label}</span>
                        <span className="text-xs tabular-nums font-bold text-right" style={{ color: barColor }}>{(f.score * 100).toFixed(0)}%</span>
                        <span className="text-[10px] tabular-nums text-text-muted text-right">{(f.weight * 100).toFixed(0)}%</span>
                        <span className="text-[10px] tabular-nums font-bold text-right" style={{ color: C.cyan }}>{(f.contribution * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(var(--border-rgb,100,100,120),0.3)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg,${barColor}80,${barColor})` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, f.score * 100)}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid rgba(var(--border-rgb,100,100,120),0.3)" }}>
                  <span className="text-xs font-bold text-text-primary">Composite Weighted Score</span>
                  <span className="text-xl font-black tabular-nums" style={{ color: zoneColor }}>
                    {(result.weightedScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Explanation bullets ── */}
      {result.explanations.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(var(--border-rgb,100,100,120),0.35)" }}>
          <button
            onClick={() => setShowExplanation((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
              <Sparkles className="w-4 h-4" style={{ color: C.gold }} /> Why this projection?
            </div>
            <motion.div animate={{ rotate: showExplanation ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-2">
                  <div className="h-px mb-3" style={{ background: "rgba(var(--border-rgb,100,100,120),0.3)" }} />
                  {result.explanations.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-text-muted leading-relaxed pl-3 py-1"
                      style={{ borderLeft: `3px solid ${SENTIMENT_COLORS[item.sentiment]}` }}
                    >
                      {item.message}
                    </div>
                  ))}

                  {/* Summary Line callout */}
                  <div className="mt-3 rounded-xl px-4 py-3"
                    style={{ background: `${C.gold}0d`, border: `1px solid ${C.gold}30` }}>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: C.gold }}>
                      Summary
                    </div>
                    <p className="text-xs font-semibold text-text-primary leading-relaxed">
                      &ldquo;{result.summaryLine}&rdquo;
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Gemini AI Insights (on-demand, minimal credits) ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${C.purple}30` }}>
        <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: `${C.purple}08` }}>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" style={{ color: C.purple }} />
            <span className="text-sm font-bold text-text-secondary">AI Strategic Insights</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${C.purple}20`, color: C.purple }}>Gemini</span>
          </div>
          <button
            onClick={fetchAiInsights}
            disabled={aiLoading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              aiLoading
                ? "opacity-60 cursor-not-allowed"
                : "hover:opacity-90 active:scale-95",
            )}
            style={{ background: C.purple, color: "white", boxShadow: aiLoading ? "none" : `0 0 12px ${C.purple}50` }}
          >
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {aiLoading ? "Analysing…" : aiInsights.length ? "Refresh" : "Get AI Insights"}
          </button>
        </div>

        {(aiInsights.length > 0 || aiError) && (
          <div className="px-5 pb-5 pt-3 space-y-2">
            <div className="h-px mb-3" style={{ background: "rgba(var(--border-rgb,100,100,120),0.3)" }} />
            {aiError ? (
              <p className="text-xs text-red-400">{aiError}</p>
            ) : (
              aiInsights.map((insight, i) => (
                <div key={i}
                  className="flex items-start gap-2.5 text-xs text-text-muted leading-relaxed pl-3 py-1"
                  style={{ borderLeft: `3px solid ${C.purple}` }}>
                  {insight}
                </div>
              ))
            )}
            <p className="text-[9px] text-text-muted pt-1 opacity-60">
              Powered by Gemini · {aiInsights.length} insights generated · Cached until inputs change
            </p>
          </div>
        )}

        {aiInsights.length === 0 && !aiError && !aiLoading && (
          <div className="px-5 pb-4 pt-2">
            <p className="text-[10px] text-text-muted opacity-70">
              Click "Get AI Insights" for Gemini-powered strategic analysis.
              Insights are generated once per projection and cached — no unnecessary API calls.
            </p>
          </div>
        )}
      </div>

      {/* ── Similar Films ── */}
      {result.similarFilms.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(var(--border-rgb,100,100,120),0.35)" }}>
          <button
            onClick={() => setShowSimilar((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
            style={{ background: "rgba(var(--surface-rgb,30,30,50),0.6)" }}
          >
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-text-secondary">Similar Films · Weighted Dataset</span>
              <span className="ml-2 text-[10px] text-text-muted">
                Dataset avg: <strong style={{ color: C.cyan }}>{result.datasetMultiplier.toFixed(2)}×</strong>
              </span>
            </div>
            <motion.div animate={{ rotate: showSimilar ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showSimilar && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"
              >
                <div className="px-5 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.similarFilms.map((sf) => {
                    const f = sf.film;
                    return (
                      <div key={f.id}
                        className="rounded-xl p-3 border bg-surface-2 space-y-1.5"
                        style={{ borderColor: sf.closest ? `${C.gold}60` : "rgba(var(--border-rgb,100,100,120),0.4)", background: sf.closest ? `rgba(245,158,11,0.06)` : undefined }}>
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-xs font-bold text-text-primary truncate">{f.title}</div>
                          {sf.closest && <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: `${C.gold}20`, color: C.gold }}>Closest</span>}
                        </div>
                        <div className="flex justify-between text-[11px] pt-1 border-t border-border/30">
                          <span className="text-text-muted">₹{f.budget} Cr</span>
                          <span className="text-text-muted">→ ₹{f.collections} Cr</span>
                          <span className="font-bold" style={{ color: C.green }}>{f.multiplier.toFixed(2)}×</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[9px]">
                            <span className="text-text-muted">Similarity</span>
                            <span className="font-bold" style={{ color: sf.pct >= 70 ? C.green : sf.pct >= 40 ? C.gold : C.red }}>{sf.pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${sf.pct}%`, background: sf.pct >= 70 ? C.green : sf.pct >= 40 ? C.gold : C.red }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Info footer ── */}
      <div className="flex items-start gap-2 rounded-xl px-4 py-3"
        style={{ background: "rgba(0,194,224,0.06)", border: "1px solid rgba(0,194,224,0.2)" }}>
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: C.cyan }} />
        <p className="text-[10px] leading-relaxed text-text-muted">
          <span className="font-semibold text-text-secondary">Deterministic engine: </span>
          Same inputs always return the same numbers — no randomness. Core model uses
          <span className="font-semibold text-text-primary"> 8 weighted factors</span> blended with
          <span className="font-semibold text-text-primary"> dataset similarity matching</span>.
          AI Insights call Gemini only when you explicitly click the button.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl px-4 py-3"
        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: C.gold }} />
        <p className="text-[10px] leading-relaxed text-text-muted">
          <span className="font-semibold text-text-secondary">Disclaimer: </span>
          Projections are statistical estimates and{" "}
          <span className="font-semibold">not guaranteed outcomes</span>. Actual results depend on
          market conditions, competition, and reception. Use for planning only.
        </p>
      </div>

    </div>
  );
}
