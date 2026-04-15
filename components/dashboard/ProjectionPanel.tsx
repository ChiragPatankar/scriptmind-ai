"use client";

// ══════════════════════════════════════════════════════════════════════════════
//  ScriptMind AI — Revenue Projection Panel
//  Real-time film collection estimator driven by weighted factor analysis.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Zap, Calendar, Users, Star, Megaphone,
  Film, Clapperboard, AlertTriangle, RefreshCw, Info, ChevronDown,
  Sparkles, BarChart2, Target, Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calculateProjection,
  projectionZone,
  ZONE_COLORS,
  ZONE_LABELS,
  STAR_LABELS,
  GENRE_LABELS,
  MARKETING_LABELS,
  TIMING_LABELS,
  AUDIENCE_LABELS,
  type ProjectionInput,
  type ProjectionResult,
  type StarPower,
  type Genre,
  type MarketingLevel,
  type ReleaseTiming,
  type AudienceType,
} from "@/lib/financial/projection";

// ── Formatting helpers ─────────────────────────────────────────────────────────

const fmt     = (n: number) => `₹${Math.abs(n).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} Cr`;
const fmtMult = (n: number) => `${n.toFixed(2)}×`;

// ── Design tokens ──────────────────────────────────────────────────────────────

const COLORS = {
  blue:   "#1D77C5",
  cyan:   "#00C2E0",
  gold:   "#F59E0B",
  green:  "#22C55E",
  red:    "#EF4444",
  purple: "#A78BFA",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  );
}

/** Animated number counter that transitions between values */
function AnimatedNumber({ value, format = fmt }: { value: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef  = useRef<number | null>(null);

  useEffect(() => {
    const from     = prevRef.current;
    const to       = value;
    const duration = 600;
    const start    = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const t  = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);          // cubic ease-out
      setDisplay(from + (to - from) * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else       prevRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <span>{format(display)}</span>;
}

/** Styled dropdown selector */
function Select<T extends string>({
  value, onChange, options, label, icon: Icon,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Record<T, string>;
  label: string;
  icon: React.ElementType;
}) {
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
            "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50",
            "transition-all cursor-pointer"
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

/** Horizontal range bar showing low → projected → high with animated fill */
function RangeBar({
  low, projected, high, color,
}: { low: number; projected: number; high: number; color: string }) {
  if (high <= 0) return null;

  const pctLow  = (low  / high) * 100;
  const pctProj = (projected / high) * 100;

  return (
    <div className="w-full">
      {/* Value labels */}
      <div className="flex justify-between text-[9px] sm:text-[10px] font-semibold mb-1.5 gap-1 min-w-0">
        <span className="truncate" style={{ color: COLORS.red   }}>{fmt(low)}</span>
        <span className="truncate text-center" style={{ color }}>{fmt(projected)}</span>
        <span className="truncate text-right" style={{ color: COLORS.green }}>{fmt(high)}</span>
      </div>

      {/* Track */}
      <div className="relative h-3 rounded-full overflow-hidden"
        style={{ background: "rgba(var(--border-rgb,100,100,120), 0.35)" }}>

        {/* Low band */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: COLORS.red + "60" }}
          initial={{ width: 0 }}
          animate={{ width: `${pctLow}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />

        {/* Filled up to projected */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${COLORS.red}80, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pctProj}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Projected dot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow-lg z-10"
          style={{ background: color, border: "2px solid white", boxShadow: `0 0 8px ${color}` }}
          initial={{ left: 0 }}
          animate={{ left: `${pctProj}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-text-muted mt-1">
        <span>Low</span>
        <span>Projected</span>
        <span>High</span>
      </div>
    </div>
  );
}

/** Individual factor bar inside the breakdown breakdown */
function FactorRow({
  label, multiplier, weight, icon: Icon, color,
}: { label: string; multiplier: number; weight: number; icon: React.ElementType; color: string }) {
  const pct = ((multiplier - 0.7) / (2.0 - 0.7)) * 100; // normalise 0.7–2.0 → 0–100%
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon className="w-2.5 h-2.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="font-semibold text-text-secondary">{label}</span>
          <span className="font-bold tabular-nums" style={{ color }}>{fmtMult(multiplier)}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(var(--border-rgb,100,100,120),0.3)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(4, pct)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
      <span className="text-[9px] text-text-muted w-8 text-right flex-shrink-0">
        {(weight * 100).toFixed(0)}%
      </span>
    </div>
  );
}

/** Small KPI result card */
function ResultCard({
  label, value, icon: Icon, color, sub, animate = true,
}: {
  label: string; value: number; icon: React.ElementType;
  color: string; sub?: string; animate?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 relative overflow-hidden flex-1 min-w-0"
      style={{
        background: "var(--card-bg, rgba(255,255,255,0.04))",
        border: `1px solid ${color}25`,
        boxShadow: `0 2px 12px ${color}0c`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted leading-tight">
          {label}
        </span>
      </div>
      <div className="text-lg font-black tabular-nums" style={{ color }}>
        {animate ? <AnimatedNumber value={value} /> : fmt(value)}
      </div>
      {sub && <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ── Default inputs ─────────────────────────────────────────────────────────────

const DEFAULT_INPUT: ProjectionInput = {
  budget:        50,
  starPower:     "mid",
  genre:         "action",
  marketing:     "medium",
  releaseTiming: "normal",
  scriptScore:   65,
  audience:      "mass",
  historicalBoost: 0,
  exceptionalMovie: false,
  benchmarkMatch: 0,
};

// ── Main Panel ─────────────────────────────────────────────────────────────────

interface ProjectionPanelProps {
  /** Seed from the main budget — kept in sync automatically */
  budgetSeed?: number;
  /** Seed script score from AI analysis if available */
  scriptScoreSeed?: number;
  /** Hide the internal section header (use when the parent already renders one) */
  hideHeader?: boolean;
  className?: string;
}

export function ProjectionPanel({
  budgetSeed,
  scriptScoreSeed,
  hideHeader = false,
  className,
}: ProjectionPanelProps) {
  // ── State ──
  const [input, setInput]       = useState<ProjectionInput>({
    ...DEFAULT_INPUT,
    budget:      budgetSeed      ?? DEFAULT_INPUT.budget,
    scriptScore: scriptScoreSeed ?? DEFAULT_INPUT.scriptScore,
  });
  const [result, setResult]         = useState<ProjectionResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [showBreakdown, setShowBreakdown]     = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync budget seed if parent changes it
  useEffect(() => {
    if (budgetSeed !== undefined) {
      setInput((prev) => ({ ...prev, budget: budgetSeed }));
    }
  }, [budgetSeed]);

  // Sync script score seed
  useEffect(() => {
    if (scriptScoreSeed !== undefined) {
      setInput((prev) => ({ ...prev, scriptScore: scriptScoreSeed }));
    }
  }, [scriptScoreSeed]);

  // ── Debounced recalculation ──
  const recalculate = useCallback((inp: ProjectionInput) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      setResult(calculateProjection(inp));
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    recalculate(input);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, recalculate]);

  const set = useCallback(<K extends keyof ProjectionInput>(key: K, val: ProjectionInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: val }));
  }, []);

  // ── Derived display values ──
  const zone  = useMemo(() =>
    result ? projectionZone(result.projected, input.budget) : "breakeven",
  [result, input.budget]);

  const zoneColor = ZONE_COLORS[zone];
  const zoneLabel = ZONE_LABELS[zone];

  const factorRows = result
    ? [
        { label: "Star Power",      multiplier: result.breakdown.starPower,     weight: 0.25, icon: Star,      color: COLORS.gold   },
        { label: "Genre",           multiplier: result.breakdown.genre,          weight: 0.15, icon: Film,      color: COLORS.blue   },
        { label: "Marketing",       multiplier: result.breakdown.marketing,      weight: 0.20, icon: Megaphone, color: COLORS.cyan   },
        { label: "Release Timing",  multiplier: result.breakdown.releaseTiming,  weight: 0.10, icon: Calendar,  color: COLORS.purple },
        { label: "Script Quality",  multiplier: result.breakdown.scriptScore,    weight: 0.20, icon: Sparkles,  color: COLORS.green  },
        { label: "Audience Type",   multiplier: result.breakdown.audience,       weight: 0.10, icon: Users,     color: COLORS.red    },
        { label: "Historical comps",multiplier: result.breakdown.historical,     weight: 0.08, icon: BarChart2, color: COLORS.cyan   },
        { label: "Benchmark match", multiplier: result.breakdown.benchmark,      weight: 0.07, icon: Target,    color: COLORS.gold   },
        { label: "Exceptional flag",multiplier: result.breakdown.exceptional,    weight: 0.05, icon: Rocket,    color: COLORS.purple },
      ]
    : [];

  // ── Render ──
  return (
    <div className={cn("flex flex-col gap-6", className)}>

      {/* ── Section header (hidden when parent renders its own) ── */}
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,194,224,0.15)", border: "1px solid rgba(0,194,224,0.30)" }}>
              <TrendingUp className="w-5 h-5" style={{ color: COLORS.cyan }} />
            </div>
            <div>
              <h3 className="text-base font-black text-text-primary">Revenue Projection Engine</h3>
              <p className="text-xs text-text-muted">Weighted box-office forecast based on film parameters</p>
            </div>
          </div>
          <button
            onClick={() => setInput({ ...DEFAULT_INPUT, budget: input.budget, scriptScore: input.scriptScore })}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg",
              "text-text-muted border border-border hover:text-accent hover:border-accent/40",
              "transition-colors duration-150"
            )}
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
        </div>
      )}

      {/* ── Verdict badge ── */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={zone}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="relative rounded-2xl px-5 py-4 overflow-hidden"
            style={{
              background: `${zoneColor}0d`,
              border: `1px solid ${zoneColor}30`,
            }}
          >
            {/* Animated glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse 70% 80% at 15% 50%, ${zoneColor}10, transparent 70%)` }} />

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${zoneColor}18`, border: `1px solid ${zoneColor}35` }}>
                  {zone === "blockbuster" ? (
                    <Rocket className="w-4.5 h-4.5" style={{ color: zoneColor }} />
                  ) : zone === "hit" ? (
                    <TrendingUp className="w-4.5 h-4.5" style={{ color: zoneColor }} />
                  ) : zone === "breakeven" ? (
                    <BarChart2 className="w-4.5 h-4.5" style={{ color: zoneColor }} />
                  ) : (
                    <TrendingDown className="w-4.5 h-4.5" style={{ color: zoneColor }} />
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Verdict
                  </div>
                  <div className="text-base font-black" style={{ color: zoneColor }}>
                    {zoneLabel}
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-1 min-w-0">
                <span className="text-[11px] text-text-muted font-semibold pb-0.5 flex-shrink-0">Multiplier</span>
                <span className="text-2xl sm:text-3xl font-black tabular-nums leading-none truncate" style={{ color: zoneColor }}>
                  {fmtMult(result.multiplier)}
                </span>
              </div>

              <div className="flex items-end gap-1 min-w-0">
                <span className="text-[11px] text-text-muted font-semibold pb-0.5 flex-shrink-0">Projected</span>
                <span className="text-2xl sm:text-3xl font-black tabular-nums leading-none truncate" style={{ color: zoneColor }}>
                  <AnimatedNumber value={result.projected} />
                </span>
              </div>
            </div>

            {/* Loading shimmer overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl flex items-center justify-center"
                  style={{ backdropFilter: "blur(2px)", background: "rgba(var(--bg-rgb,10,10,15),0.4)" }}
                >
                  <div className="flex items-center gap-2 text-xs text-text-muted font-semibold">
                    <Zap className="w-4 h-4 animate-pulse" style={{ color: COLORS.cyan }} />
                    Recalculating…
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inputs + Results grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6">

        {/* ── Input panel ── */}
        <div className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: "var(--card-bg, rgba(255,255,255,0.04))", border: "1px solid rgba(var(--border-rgb,100,100,120),0.35)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
            <Clapperboard className="w-3 h-3" />
            Film Parameters
          </div>

          {/* Budget */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              <Film className="w-3 h-3" />
              Total Budget (₹ Cr)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted">₹</span>
              <input
                type="number"
                min={0}
                step={5}
                value={input.budget}
                onChange={(e) => set("budget", Math.max(0, parseFloat(e.target.value) || 0))}
                className={cn(
                  "w-full rounded-xl pl-7 pr-10 py-2.5 text-sm font-semibold",
                  "bg-surface-2 border border-border text-text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50",
                  "transition-all"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-bold">Cr</span>
            </div>
          </div>

          {/* Dropdowns grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select<StarPower>
              value={input.starPower} onChange={(v) => set("starPower", v)}
              options={STAR_LABELS}  label="Star Power" icon={Star}
            />
            <Select<Genre>
              value={input.genre}    onChange={(v) => set("genre", v)}
              options={GENRE_LABELS} label="Genre"     icon={Film}
            />
            <Select<MarketingLevel>
              value={input.marketing}      onChange={(v) => set("marketing", v)}
              options={MARKETING_LABELS}   label="Marketing" icon={Megaphone}
            />
            <Select<ReleaseTiming>
              value={input.releaseTiming}  onChange={(v) => set("releaseTiming", v)}
              options={TIMING_LABELS}      label="Release"   icon={Calendar}
            />
            <Select<AudienceType>
              value={input.audience}  onChange={(v) => set("audience", v)}
              options={AUDIENCE_LABELS} label="Audience" icon={Users}
            />
          </div>

          {/* Script Score slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                <Sparkles className="w-3 h-3" />
                Script Quality Score
              </label>
              <motion.span
                key={input.scriptScore}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                className="text-sm font-black tabular-nums"
                style={{
                  color: input.scriptScore < 40
                    ? COLORS.red
                    : input.scriptScore <= 70
                    ? COLORS.gold
                    : COLORS.green,
                }}
              >
                {input.scriptScore}/100
              </motion.span>
            </div>

            {/* Custom slider track */}
            <div className="relative py-2">
              <div className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(var(--border-rgb,100,100,120),0.35)" }}>
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${input.scriptScore}%` }}
                  transition={{ duration: 0.25 }}
                  style={{
                    background: input.scriptScore < 40
                      ? `linear-gradient(90deg, ${COLORS.red}80, ${COLORS.red})`
                      : input.scriptScore <= 70
                      ? `linear-gradient(90deg, ${COLORS.gold}80, ${COLORS.gold})`
                      : `linear-gradient(90deg, ${COLORS.green}80, ${COLORS.green})`,
                  }}
                />
              </div>
              <input
                type="range"
                min={0} max={100} step={1}
                value={input.scriptScore}
                onChange={(e) => set("scriptScore", parseInt(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
              />
            </div>

            <div className="flex justify-between text-[9px] text-text-muted font-semibold">
              <span style={{ color: COLORS.red }}>Weak (&lt;40) ×0.8</span>
              <span style={{ color: COLORS.gold }}>Average ×1.2</span>
              <span style={{ color: COLORS.green }}>Strong (&gt;70) ×1.8</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Historical data influence
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={input.historicalBoost}
                onChange={(e) => set("historicalBoost", Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Benchmark match
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={input.benchmarkMatch}
                onChange={(e) => set("benchmarkMatch", Number(e.target.value))}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-text-secondary font-semibold">
            <input
              type="checkbox"
              checked={input.exceptionalMovie}
              onChange={(e) => set("exceptionalMovie", e.target.checked)}
            />
            Exceptional movie boost
          </label>
        </div>

        {/* ── Results panel ── */}
        <div className="flex flex-col gap-4">

          {/* KPI cards row 1 */}
          <div className="flex flex-col sm:flex-row gap-3">
            {result ? (
              <>
                <ResultCard label="Expected Collection" value={result.projected}   icon={Target}      color={zoneColor}    sub="Final projection" />
                <ResultCard label="Low Estimate"         value={result.lowEstimate} icon={TrendingDown} color={COLORS.red}   sub="Pessimistic band" />
              </>
            ) : (
              <div className="flex-1 h-24 rounded-2xl animate-pulse" style={{ background: "rgba(var(--border-rgb,100,100,120),0.2)" }} />
            )}
          </div>

          {/* KPI cards row 2 */}
          <div className="flex flex-col sm:flex-row gap-3">
            {result ? (
              <>
                <ResultCard label="High Estimate"    value={result.highEstimate}   icon={TrendingUp} color={COLORS.green}  sub="Optimistic band"  />
                <ResultCard label="Opening Weekend"  value={result.openingWeekend} icon={Rocket}     color={COLORS.gold}   sub="≈35% of projection" />
              </>
            ) : (
              <div className="flex-1 h-24 rounded-2xl animate-pulse" style={{ background: "rgba(var(--border-rgb,100,100,120),0.2)" }} />
            )}
          </div>

          {/* Week 1 card */}
          {result && (
            <ResultCard label="Week 1 Cumulative" value={result.week1} icon={Calendar} color={COLORS.cyan} sub="≈65% of projection" />
          )}

          {/* Range bar */}
          {result && (
            <div className="rounded-2xl p-4"
              style={{ background: "var(--card-bg, rgba(255,255,255,0.04))", border: `1px solid ${zoneColor}20` }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                Collection Range
              </div>
              <RangeBar low={result.lowEstimate} projected={result.projected} high={result.highEstimate} color={zoneColor} />
            </div>
          )}
        </div>
      </div>

      {/* ── Factor breakdown (expandable) ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(var(--border-rgb,100,100,120),0.35)" }}>

        <button
          onClick={() => setShowBreakdown((b) => !b)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
            <BarChart2 className="w-4 h-4 text-accent" />
            Factor Breakdown & Weights
          </div>
          <motion.div animate={{ rotate: showBreakdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showBreakdown && result && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">
                <div className="h-px mb-4" style={{ background: "rgba(var(--border-rgb,100,100,120),0.3)" }} />

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_auto] gap-4 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Factor</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted text-right">Weight</span>
                </div>

                {factorRows.map((r) => (
                  <FactorRow key={r.label} {...r} />
                ))}

                {/* Composite total */}
                <div className="mt-4 pt-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid rgba(var(--border-rgb,100,100,120),0.3)" }}>
                  <span className="text-xs font-bold text-text-primary">Composite Multiplier</span>
                  <span className="text-xl font-black tabular-nums" style={{ color: zoneColor }}>
                    {fmtMult(result.multiplier)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── "Why this projection?" Explanation ── */}
      {result && result.explanation.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(var(--border-rgb,100,100,120),0.35)" }}>
          <button
            onClick={() => setShowExplanation((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
              <Sparkles className="w-4 h-4" style={{ color: COLORS.gold }} />
              Why this projection?
            </div>
            <motion.div animate={{ rotate: showExplanation ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-2">
                  <div className="h-px mb-3" style={{ background: "rgba(var(--border-rgb,100,100,120),0.3)" }} />
                  {result.explanation.map((line, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-text-muted leading-relaxed">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: COLORS.gold, opacity: 0.8 }} />
                      {line}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Similar Films (dataset matching) ── */}
      {result && result.similarFilms.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(var(--border-rgb,100,100,120),0.35)" }}>
          <div className="px-5 py-3 flex items-center gap-2"
            style={{ background: "rgba(var(--surface-rgb,30,30,50),0.6)" }}>
            <Film className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-text-secondary">Similar Films  ·  Weighted Dataset</span>
            <span className="ml-auto text-[10px] text-text-muted">
              Weighted avg: <strong style={{ color: COLORS.cyan }}>{result.datasetMult.toFixed(2)}×</strong>
              &nbsp;|&nbsp; Model base: <strong style={{ color: COLORS.purple }}>{result.baseWeightedMult.toFixed(2)}×</strong>
            </span>
          </div>
          <div className="px-5 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {result.similarFilms.map((sf) => {
              const f = sf.film;
              return (
                <div key={f.id}
                  className="rounded-xl p-3 border bg-surface-2 space-y-1.5 transition-all"
                  style={{
                    borderColor: sf.closest ? `${COLORS.gold}60` : "rgba(var(--border-rgb,100,100,120),0.4)",
                    background:  sf.closest ? `rgba(245,158,11,0.06)` : undefined,
                  }}>
                  <div className="flex items-center justify-between gap-1">
                    <div className="text-xs font-bold text-text-primary truncate">{f.title}</div>
                    {sf.closest && (
                      <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: `${COLORS.gold}20`, color: COLORS.gold, border:`1px solid ${COLORS.gold}35` }}>
                        Closest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag label={f.genre}    color={COLORS.blue}   />
                    <Tag label={f.star}     color={COLORS.gold}   />
                    <Tag label={f.audience} color={COLORS.purple} />
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-border/30">
                    <span className="text-text-muted">₹{f.budget} Cr</span>
                    <span className="text-text-muted">→ ₹{f.collections} Cr</span>
                    <span className="font-bold" style={{ color: COLORS.green }}>{f.multiplier.toFixed(2)}×</span>
                  </div>
                  {/* Similarity bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-text-muted">Similarity</span>
                      <span className="font-bold" style={{ color: sf.pct >= 70 ? COLORS.green : sf.pct >= 40 ? COLORS.gold : COLORS.red }}>
                        {sf.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${sf.pct}%`,
                          background: sf.pct >= 70 ? COLORS.green : sf.pct >= 40 ? COLORS.gold : COLORS.red,
                        }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-2 rounded-xl px-4 py-3"
        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: COLORS.gold }} />
        <p className="text-[10px] leading-relaxed text-text-muted">
          <span className="font-semibold text-text-secondary">Disclaimer: </span>
          These projections are AI-based estimates derived from weighted statistical factors and are{" "}
          <span className="font-semibold">not guaranteed outcomes</span>. Actual box-office results depend
          on market conditions, critical reception, competition, and other unpredictable variables.
          Use this tool for planning purposes only.
        </p>
      </div>

    </div>
  );
}
