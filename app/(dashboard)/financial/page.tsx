"use client";

// ══════════════════════════════════════════════════════════════════════════════
//  ScriptMind AI — Film Finance Studio
//  Sections: Budget · Breakdown · Revenue · KPIs · Charts · NPV/IRR · Insights
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Percent, BarChart3,
  AlertTriangle, CheckCircle2, XCircle, Target,
  RefreshCcw, Save, Plus, Minus, HelpCircle, Sparkles,
  Film, Clapperboard, IndianRupee, Globe, GitBranch,
  Copy, CheckCheck, Calculator, LineChart, Layers,
  FileDown, Loader2, PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useFinancialStore, computeMetrics, territoryRemaining,
  type BudgetInputs, type TerritoryConfig,
} from "@/lib/financial-store";
import { cn } from "@/lib/utils";
import { ROIGauge } from "@/components/dashboard/ROIGauge";
import { InvestorReport } from "@/components/dashboard/InvestorReport";
import { exportReportPDF } from "@/lib/exportPDF";
import { ProjectionPanel } from "@/components/dashboard/ProjectionPanel";

// ── Formatting helpers ─────────────────────────────────────────────────────────

const fmt = (n: number, d = 2) =>
  `₹${Math.abs(n).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} Cr`;
const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;
const fmtX = (n: number) => `${n.toFixed(2)}x`;

// ── Design tokens ──────────────────────────────────────────────────────────────

const COLORS = {
  blue:   "#1D77C5",
  cyan:   "#00C2E0",
  gold:   "#F59E0B",
  green:  "#22C55E",
  purple: "#A78BFA",
  red:    "#EF4444",
  muted:  "#6B6B80",
};

const BUDGET_PIE_COLORS  = [COLORS.blue, COLORS.cyan, COLORS.gold, COLORS.purple];
const REVENUE_PIE_COLORS = [COLORS.green, COLORS.blue, COLORS.gold, COLORS.muted];

// ── Shared primitives ──────────────────────────────────────────────────────────

function SectionCard({
  title, description, accent, icon: Icon, children, className, id,
}: {
  title: string; description?: string; accent?: string;
  icon?: React.ElementType;
  children: React.ReactNode; className?: string; id?: string;
}) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("rounded-2xl bg-surface border border-border overflow-hidden scroll-mt-20", className)}
    >
      <div className="px-6 pt-5 pb-4 border-b border-border flex items-center gap-3">
        {Icon && accent && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-text-primary">{title}</h2>
          {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </motion.div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-text-muted hover:text-text-secondary"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-52 px-3 py-2 rounded-xl bg-surface-2 border border-border shadow-glass text-[11px] text-text-secondary leading-relaxed pointer-events-none"
          >
            {text}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-surface-2 border-r border-b border-border" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── Advanced Radix slider ──────────────────────────────────────────────────────

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: string;
  secondColor?: string;         // for gradient fill
  onChange: (v: number) => void;
  tooltip?: string;
  formatValue?: (v: number) => string;
  markers?: boolean;
}

function RangeSlider({
  label, value, min, max, step = 1, unit = "%",
  color = COLORS.blue, secondColor,
  onChange, tooltip, formatValue, markers = true,
}: SliderProps) {
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;
  const fillEnd = secondColor ?? color;
  const display = formatValue ? formatValue(value) : `${value}${unit}`;

  // Animated number via ref
  const prevValue = useRef(value);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (prevValue.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 300);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div
      className="group select-none"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Label + value badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </span>
        <motion.span
          animate={{ scale: flash ? 1.12 : 1, y: flash ? -1 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs font-black px-2.5 py-0.5 rounded-lg tabular-nums transition-shadow duration-200"
          style={{
            color,
            background: `${color}18`,
            border: `1px solid ${color}${active ? "55" : "30"}`,
            boxShadow: active ? `0 0 10px ${color}30` : "none",
          }}
        >
          {display}
        </motion.span>
      </div>

      {/* Radix slider */}
      <RadixSlider.Root
        className="relative flex items-center w-full h-7 cursor-pointer touch-none"
        min={min} max={max} step={step} value={[value]}
        onValueChange={([v]) => onChange(v)}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
      >
        {/* Track */}
        <RadixSlider.Track
          className="relative w-full h-[6px] rounded-full"
          style={{
            background: `rgba(var(--surface3-rgb), 1)`,
            boxShadow: `inset 0 1px 3px rgba(0,0,0,0.25)`,
          }}
        >
          {/* Subtle track glow */}
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{ background: `linear-gradient(to right, ${color}20, transparent)` }}
          />
          {/* Filled range */}
          <RadixSlider.Range
            className="absolute h-full rounded-full"
            style={{
              background: `linear-gradient(to right, ${color}cc 0%, ${fillEnd} 100%)`,
              boxShadow: `0 0 8px ${color}60`,
            }}
          />
        </RadixSlider.Track>

        {/* Thumb — no asChild so Radix positions it correctly on the track */}
        <RadixSlider.Thumb
          className="block w-[18px] h-[18px] rounded-full cursor-grab active:cursor-grabbing outline-none"
          style={{
            background: "white",
            transform: `scale(${active ? 1.3 : hover ? 1.1 : 1})`,
            boxShadow: active
              ? `0 0 0 3px ${color}, 0 0 18px ${color}80, 0 3px 10px rgba(0,0,0,0.45)`
              : hover
              ? `0 0 0 2.5px ${color}, 0 0 10px ${color}55, 0 2px 7px rgba(0,0,0,0.3)`
              : `0 0 0 2px ${color}, 0 0 5px ${color}35, 0 1px 4px rgba(0,0,0,0.25)`,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
        />
      </RadixSlider.Root>

      {/* Track details row */}
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[10px] text-text-muted tabular-nums">{min}{unit}</span>

        {/* Tick marks */}
        {markers && (
          <div className="flex items-center gap-0 flex-1 mx-3">
            {Array.from({ length: 5 }, (_, i) => {
              const tickPct = (i / 4) * 100;
              const isActive = tickPct <= pct;
              return (
                <React.Fragment key={i}>
                  <div
                    className="w-px h-1.5 rounded-full transition-all duration-300"
                    style={{ background: isActive ? `${color}80` : "rgba(var(--border-rgb),1)" }}
                  />
                  {i < 4 && <div className="flex-1" />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        <span className="text-[10px] text-text-muted tabular-nums">{max}{unit}</span>
      </div>
    </div>
  );
}

// ── Currency input ─────────────────────────────────────────────────────────────

function CurrencyField({
  label, value, onChange, error, required, tooltip,
}: {
  label: string; value: number; onChange: (v: number) => void;
  error?: string; required?: boolean; tooltip?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center">
        {label} {required && <span className="text-red-400 ml-0.5">*</span>}
        {tooltip && <InfoTooltip text={tooltip} />}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">₹</span>
        <input
          type="number" min={0} step={0.1} value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="0.00"
          className={cn(
            "w-full h-10 pl-7 pr-10 rounded-xl text-sm text-text-primary placeholder:text-text-muted",
            "bg-surface-2 border outline-none transition-all duration-200",
            "focus:ring-2 focus:ring-accent/25 focus:border-accent/50",
            error ? "border-red-500/50 focus:ring-red-500/20" : "border-border"
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[11px] font-medium">Cr</span>
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ── KPI metric card ────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, color, icon: Icon, trend, tooltip, large,
}: {
  label: string; value: string; sub?: string;
  color: string; icon: React.ElementType;
  trend?: "up" | "down" | "neutral"; tooltip?: string;
  large?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "var(--card-bg)",
        border: `1px solid ${color}30`,
        boxShadow: `0 2px 12px ${color}10`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }} />

      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend && (
          <span className={cn("flex items-center gap-1 text-[11px] font-semibold",
            trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-text-muted"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
          </span>
        )}
      </div>

      <div className={cn("font-black tabular-nums tracking-tight mb-0.5", large ? "text-3xl" : "text-2xl")}
        style={{ color }}>
        {value}
      </div>
      <div className="text-xs font-semibold text-text-secondary flex items-center">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      {sub && <div className="text-[11px] text-text-muted mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ── Recharts custom tooltip ────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; fill?: string; color?: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl bg-surface border border-border shadow-glass text-xs min-w-[140px]">
      {label && <p className="text-text-secondary font-semibold mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
            <span className="text-text-muted">{p.name}</span>
          </span>
          <span className="font-bold text-text-primary">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Zod schema for budget form
// ══════════════════════════════════════════════════════════════════════════════

const budgetSchema = z.object({
  productionBudget:     z.coerce.number().min(0, "Must be ≥ 0"),
  marketingBudget:      z.coerce.number().min(0, "Must be ≥ 0"),
  travelBudget:         z.coerce.number().min(0),
  actorBudget:          z.coerce.number().min(0),
  foodUtilitiesBudget:  z.coerce.number().min(0),
  miscBudget:           z.coerce.number().min(0),
  actualTravelExpenses: z.coerce.number().min(0),
  actualFoodExpenses:   z.coerce.number().min(0),
  actualMiscExpenses:   z.coerce.number().min(0),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

// ══════════════════════════════════════════════════════════════════════════════
//  Section 1 + 2 — Budget Inputs & Phase Breakdown
// ══════════════════════════════════════════════════════════════════════════════

function BudgetSection() {
  const { budget, breakdown, setBudget, setBreakdown } = useFinancialStore();
  const [activeTab, setActiveTab] = useState<"estimates" | "actuals">("estimates");

  const { register, watch, formState: { errors } } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetFormData>,
    defaultValues: budget,
  });

  // Sync form → store in real-time
  const watched = watch();
  useEffect(() => {
    const parsed = budgetSchema.safeParse(watched);
    if (parsed.success) setBudget(parsed.data as Partial<BudgetInputs>);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watched)]);

  const totalBudget = Object.values(watched).slice(0, 6).reduce((s, v) => s + (Number(v) || 0), 0);
  const totalActuals = (Number(watched.actualTravelExpenses) || 0)
    + (Number(watched.actualFoodExpenses) || 0)
    + (Number(watched.actualMiscExpenses) || 0);
  const budgetedActuals = (Number(watched.travelBudget) || 0)
    + (Number(watched.foodUtilitiesBudget) || 0)
    + (Number(watched.miscBudget) || 0);
  const overBudget = totalActuals > budgetedActuals;

  const breakdownSum =
    breakdown.preProductionPct +
    breakdown.postProductionPct +
    breakdown.productionPct +
    breakdown.contingencyPct;

  const phases = [
    { key: "preProductionPct"  as const, label: "Pre-Production",  color: COLORS.blue,   secondColor: COLORS.cyan,   min: 28, max: 40 },
    { key: "postProductionPct" as const, label: "Post-Production", color: COLORS.cyan,   secondColor: "#00E5FF",     min: 18, max: 30 },
    { key: "productionPct"     as const, label: "Production",      color: COLORS.gold,   secondColor: "#FF9F0A",     min: 22, max: 35 },
    { key: "contingencyPct"    as const, label: "Contingency",     color: COLORS.purple, secondColor: "#C084FC",     min: 8,  max: 18 },
  ];

  const fieldCls = "w-full h-10 pl-7 pr-10 rounded-xl text-sm text-text-primary placeholder:text-text-muted bg-surface-2 border border-border outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
      {/* ── Budget Inputs ── */}
      <SectionCard
        title="Budget Inputs"
        description="Enter all budget line items and actuals in ₹ Crore"
        accent={COLORS.blue}
        icon={Calculator}
        id="s-budget"
      >
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl bg-surface-2 border border-border mb-5 w-fit">
          {(["estimates", "actuals"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize",
                activeTab === tab
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {tab === "estimates" ? "Budget Estimates" : "Actual Expenses"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "estimates" ? (
            <motion.div
              key="estimates"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
            {([ 
              { name: "productionBudget",    label: "Production Budget",    required: true,  tooltip: "Core production costs including crew, equipment & locations." },
              { name: "marketingBudget",     label: "Marketing Budget",     required: true,  tooltip: "Theatrical P&A, digital & OTT marketing spend." },
              { name: "actorBudget",         label: "Actor Budget",         required: false, tooltip: "Combined talent fees for all cast members." },
              { name: "travelBudget",        label: "Travel Budget",        required: false, tooltip: "Estimated travel & accommodation for the shoot." },
              { name: "foodUtilitiesBudget", label: "Food & Utilities",     required: false, tooltip: "On-set catering, utilities & miscellaneous overheads." },
              { name: "miscBudget",          label: "Miscellaneous",        required: false, tooltip: "Any other unclassified budget items." },
            ] as const).map(({ name, label, required, tooltip }) => (
              <div key={name}>
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center">
                  {label} {required && <span className="text-red-400 ml-0.5">*</span>}
                  <InfoTooltip text={tooltip} />
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">₹</span>
                  <input
                    type="number" min={0} step={0.1} placeholder="0.00"
                    {...register(name)}
                    className={cn(fieldCls, errors[name] ? "border-red-500/50" : "")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[11px] font-medium">Cr</span>
                </div>
                {errors[name] && <p className="text-[11px] text-red-400 mt-1">{errors[name]?.message}</p>}
              </div>
            ))}

            {/* Total estimate row */}
            <div className="pt-3 border-t border-border flex items-center justify-between col-span-full">
              <span className="text-sm font-semibold text-text-secondary">Total Budget</span>
              <span className="text-xl font-black text-text-primary">{fmt(totalBudget)}</span>
            </div>
            </motion.div>
          ) : (
            <motion.div
              key="actuals"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
            {([
              { name: "actualTravelExpenses", label: "Actual Travel Expenses",    budget: Number(watch("travelBudget")) || 0,        tooltip: "Real travel costs incurred so far." },
              { name: "actualFoodExpenses",   label: "Actual Food & Utilities",   budget: Number(watch("foodUtilitiesBudget")) || 0,  tooltip: "Real food & utilities costs so far." },
              { name: "actualMiscExpenses",   label: "Actual Misc Expenses",      budget: Number(watch("miscBudget")) || 0,           tooltip: "Any other real expenses incurred." },
            ] as const).map(({ name, label, budget: bgt, tooltip }) => {
              const actual = Number(watch(name)) || 0;
              const over = actual > bgt;
              return (
                <div key={name}>
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center">
                    {label}
                    <InfoTooltip text={tooltip} />
                    {bgt > 0 && (
                      <span className="ml-auto text-[10px] font-medium text-text-muted normal-case tracking-normal">
                        Budget: {fmt(bgt)}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">₹</span>
                    <input
                      type="number" min={0} step={0.1} placeholder="0.00"
                      {...register(name)}
                      className={cn(fieldCls, over ? "border-red-500/40" : "")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[11px] font-medium">Cr</span>
                  </div>
                  {bgt > 0 && actual > 0 && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: over ? COLORS.red : COLORS.green }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (actual / bgt) * 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Variance summary card */}
            <div className={cn(
              "rounded-xl p-4 border",
              overBudget ? "bg-red-500/5 border-red-500/20" : "bg-green-500/5 border-green-500/20"
            )}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3"
                style={{ color: overBudget ? COLORS.red : COLORS.green }}>
                Actuals vs Budget
              </p>
              {[
                { label: "Estimated (variable)", value: budgetedActuals },
                { label: "Actual spent",         value: totalActuals   },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-muted">{row.label}</span>
                  <span className="font-bold text-text-primary">{fmt(row.value)}</span>
                </div>
              ))}
              <div className="h-px bg-border my-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: overBudget ? COLORS.red : COLORS.green }}>
                  {overBudget ? "Over budget by" : "Under budget by"}
                </span>
                <span className="font-black" style={{ color: overBudget ? COLORS.red : COLORS.green }}>
                  {fmt(Math.abs(totalActuals - budgetedActuals))}
                </span>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* ── Phase Breakdown ── */}
      <SectionCard
        title="Phase Breakdown"
        description="Allocate budget by production phase"
        accent={COLORS.gold}
        icon={Layers}
      >
        <div className="space-y-5">
          {breakdownSum !== 100 && (
            <div className="text-[11px] text-gold bg-gold/10 border border-gold/25 rounded-lg px-3 py-2">
              Phases sum to {breakdownSum}% — adjust to reach 100%
            </div>
          )}

          {phases.map((p) => (
            <div key={p.key}>
              <RangeSlider
                label={p.label}
                value={breakdown[p.key]}
                min={p.min} max={p.max} step={1}
                color={p.color}
                secondColor={p.secondColor}
                formatValue={(v) => `${v}% · ${fmt((totalBudget * v) / 100)}`}
                onChange={(v) => setBreakdown({ [p.key]: v })}
              />
            </div>
          ))}

          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {phases.map((p) => (
              <div key={p.key} className="rounded-xl p-3 bg-surface-2 border border-border">
                <div className="text-[10px] text-text-muted mb-0.5">{p.label}</div>
                <div className="text-sm font-black" style={{ color: p.color }}>
                  {fmt((totalBudget * breakdown[p.key]) / 100)}
                </div>
                <div className="text-[10px]" style={{ color: p.color }}>{breakdown[p.key]}%</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Section 3 — Revenue & Distribution Split
// ══════════════════════════════════════════════════════════════════════════════

function RevenueSection({ metrics }: { metrics: ReturnType<typeof computeMetrics> }) {
  const { revenue, setRevenue } = useFinancialStore();

  const splits = [
    {
      key: "exhibitorSplit"   as const, label: "Exhibitor (Theatres)",
      color: COLORS.green, secondColor: "#4ADE80", min: 40, max: 60, amount: metrics.exhibitorShare,
      tooltip: "Percentage of total collections retained by theatre owners.",
    },
    {
      key: "distributorSplit" as const, label: "Distributor",
      color: COLORS.blue, secondColor: COLORS.cyan, min: 15, max: 40, amount: metrics.distributorShare,
      tooltip: "Distributor commission from gross box office receipts.",
    },
    {
      key: "investorSplit"    as const, label: "Investor Equity",
      color: COLORS.gold, secondColor: "#FBBF24", min: 5, max: 25, amount: metrics.investorShare,
      tooltip: "Investor equity share in net collections after exhibitor & distributor fees.",
    },
  ];

  return (
    <SectionCard
      title="Revenue & Distribution"
      description="Enter box office collections and configure revenue split"
      accent={COLORS.green}
      icon={TrendingUp}
      id="s-revenue"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-8">
        {/* Collections input */}
        <div className="space-y-5">
          <CurrencyField
            label="Total Box Office Collections"
            value={revenue.totalCollections}
            onChange={(v) => setRevenue({ totalCollections: v })}
            tooltip="Total gross box office collections including all territories & formats."
            required
          />

          {/* P&A remainder */}
          <div className="rounded-xl p-4 bg-surface-2 border border-border">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3">Revenue Allocation</p>
            {[
              { label: "Exhibitor Share",    value: metrics.exhibitorShare,    color: COLORS.green  },
              { label: "Distributor Fee",    value: metrics.distributorShare,  color: COLORS.blue   },
              { label: "Investor Return",    value: metrics.investorShare,     color: COLORS.gold   },
              { label: "P&A / Balance",      value: metrics.paShare,           color: COLORS.muted  },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between py-1.5 text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                  <span className="text-text-secondary">{r.label}</span>
                </span>
                <span className="font-bold tabular-nums" style={{ color: r.color }}>
                  {fmt(r.value)}
                </span>
              </div>
            ))}
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between text-xs">
              <span className="text-text-muted font-semibold">Total Collections</span>
              <span className="font-black text-text-primary">{fmt(revenue.totalCollections)}</span>
            </div>
          </div>
        </div>

        {/* Split sliders */}
        <div className="space-y-6">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Split Configuration</p>
          {splits.map((s) => (
            <div key={s.key}>
              <RangeSlider
                label={s.label}
                value={revenue[s.key]}
                min={s.min} max={s.max} step={1}
                color={s.color}
                secondColor={s.secondColor}
                formatValue={(v) => `${v}%`}
                onChange={(v) => setRevenue({ [s.key]: v })}
                tooltip={s.tooltip}
              />
              {/* live amount pill */}
              <motion.div
                layout
                className="flex items-center justify-between mt-2 px-3 py-2.5 rounded-xl"
                style={{ background: `${s.color}0c`, border: `1px solid ${s.color}25` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[11px] text-text-secondary font-medium">{s.label}</span>
                </div>
                <motion.span
                  key={s.amount}
                  initial={{ opacity: 0.6, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-black tabular-nums"
                  style={{ color: s.color }}
                >
                  {fmt(s.amount)}
                </motion.span>
              </motion.div>
            </div>
          ))}

          {/* P&A auto */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2 border border-border">
            <span className="text-[11px] text-text-muted">P&A (auto remainder)</span>
            <span className="text-sm font-black tabular-nums text-text-muted">{fmt(metrics.paShare)}</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Section 4 — KPI Dashboard
// ══════════════════════════════════════════════════════════════════════════════

function KPISection({ metrics }: { metrics: ReturnType<typeof computeMetrics> }) {
  const effColor =
    metrics.efficiencyLabel === "Highly efficient"
      ? COLORS.green
      : metrics.efficiencyLabel === "Average"
      ? COLORS.gold
      : COLORS.red;

  return (
    <SectionCard
      title="KPI Dashboard"
      description="Real-time financial performance indicators"
      accent={COLORS.cyan}
      icon={BarChart3}
      id="s-kpis"
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Return on Investment"
          value={fmtPct(metrics.roi)}
          sub={metrics.roi >= 0 ? "Profitable" : "Loss projected"}
          color={metrics.roi >= 20 ? COLORS.green : metrics.roi >= 0 ? COLORS.gold : COLORS.red}
          icon={metrics.roi >= 0 ? TrendingUp : TrendingDown}
          trend={metrics.roi >= 20 ? "up" : metrics.roi >= 0 ? "neutral" : "down"}
          tooltip="ROI = (Net Revenue − Total Investment) ÷ Total Investment × 100. Positive means profit."
          large
        />
        <KPICard
          label="Total Investment"
          value={fmt(metrics.totalInvestment)}
          sub="Production + Marketing"
          color={COLORS.blue}
          icon={IndianRupee}
          tooltip="Sum of Production Budget and Marketing Budget — your core financial commitment."
        />
        <KPICard
          label="Net Revenue"
          value={fmt(metrics.netRevenue)}
          sub="After distributor & P&A"
          color={metrics.netRevenue >= metrics.totalInvestment ? COLORS.green : COLORS.gold}
          icon={DollarSign}
          trend={metrics.netRevenue >= metrics.totalInvestment ? "up" : "down"}
          tooltip="Collections minus distributor fee and P&A costs."
        />
        <KPICard
          label="Break-even Point"
          value={fmt(metrics.breakEven)}
          sub="= Total Investment"
          color={COLORS.purple}
          icon={Target}
          tooltip="The minimum box office needed to recover your total investment."
        />
        <KPICard
          label="Efficiency Ratio"
          value={fmtX(metrics.efficiencyRatio)}
          sub={metrics.efficiencyLabel}
          color={effColor}
          icon={BarChart3}
          tooltip="Gross Collections ÷ Marketing Spend. >3× = Highly efficient, 2–3× = Average, <2× = Over-spending."
        />
        <KPICard
          label="Investor Net Return"
          value={fmt(metrics.investorNet)}
          sub={`${fmtPct(useFinancialStore.getState().revenue.investorSplit)} equity`}
          color={COLORS.cyan}
          icon={Sparkles}
          tooltip="Investor return = (Exhibitor share − Distributor − P&A) × Investor Equity %."
        />
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Section 5 — NPV & IRR
// ══════════════════════════════════════════════════════════════════════════════

function NPVSection({ metrics }: { metrics: ReturnType<typeof computeMetrics> }) {
  const { npvConfig, setNPVConfig, setCashFlow, addCashFlow, removeCashFlow } = useFinancialStore();

  return (
    <SectionCard
      title="NPV & IRR Analysis"
      description="Discounted cash flow valuation of your film project"
      accent={COLORS.purple}
      icon={LineChart}
      id="s-npv"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center">
              Discount Rate (%)
              <InfoTooltip text="The minimum acceptable rate of return (cost of capital / WACC). Typically 8–15% for film projects." />
            </label>
            <div className="relative">
              <input
                type="number" min={0} max={50} step={0.5}
                value={npvConfig.discountRate}
                onChange={(e) => setNPVConfig({ discountRate: Number(e.target.value) || 0 })}
                className="w-full h-10 pl-3 pr-8 rounded-xl text-sm text-text-primary bg-surface-2 border border-border outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[11px]">%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center">
                Annual Cash Flows (₹ Cr)
                <InfoTooltip text="Expected net inflows for each year after release. Year 1 is typically theatrical, subsequent years are OTT, satellite & international." />
              </label>
              <Button size="sm" variant="ghost"
                leftIcon={<Plus className="w-3 h-3" />}
                onClick={addCashFlow}
                className="h-7 text-xs px-2"
              >
                Year
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {npvConfig.cashFlows.map((cf, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[11px] text-text-muted w-12 flex-shrink-0 font-medium">Yr {i + 1}</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
                    <input
                      type="number" step={0.5}
                      value={cf}
                      onChange={(e) => setCashFlow(i, Number(e.target.value) || 0)}
                      className="w-full h-9 pl-7 pr-8 rounded-xl text-sm text-text-primary bg-surface-2 border border-border outline-none focus:ring-2 focus:ring-accent/25 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[11px]">Cr</span>
                  </div>
                  {npvConfig.cashFlows.length > 1 && (
                    <button onClick={() => removeCashFlow(i)}
                      className="w-8 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* NPV */}
          <div className={cn(
            "rounded-2xl p-5 border",
            metrics.npv >= 0 ? "border-green-500/25 bg-green-500/5" : "border-red-500/25 bg-red-500/5"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest"
                style={{ color: metrics.npv >= 0 ? COLORS.green : COLORS.red }}>
                Net Present Value
              </span>
              <InfoTooltip text="NPV = Σ (CashFlow / (1 + rate)^n). Positive NPV means the project creates value above the discount rate." />
            </div>
            <div className="text-3xl font-black tabular-nums"
              style={{ color: metrics.npv >= 0 ? COLORS.green : COLORS.red }}>
              {metrics.npv >= 0 ? "+" : "−"}{fmt(Math.abs(metrics.npv), 2)}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {metrics.npv >= 0
                ? "Project creates value above discount rate — viable investment."
                : "Project destroys value at this discount rate — review cash flows."}
            </p>
          </div>

          {/* IRR */}
          <div className={cn(
            "rounded-2xl p-5 border",
            metrics.irr === null
              ? "border-border bg-surface-2"
              : metrics.irr >= npvConfig.discountRate
              ? "border-green-500/25 bg-green-500/5"
              : "border-red-500/25 bg-red-500/5"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest"
                style={{ color: metrics.irr === null ? COLORS.muted : metrics.irr >= npvConfig.discountRate ? COLORS.green : COLORS.red }}>
                Internal Rate of Return
              </span>
              <InfoTooltip text="IRR is the discount rate that makes NPV = 0. If IRR > Discount Rate, the project is financially viable." />
            </div>
            <div className="text-3xl font-black tabular-nums"
              style={{ color: metrics.irr === null ? COLORS.muted : metrics.irr >= npvConfig.discountRate ? COLORS.green : COLORS.red }}>
              {metrics.irr === null ? "N/A" : fmtPct(metrics.irr)}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {metrics.irr === null
                ? "Cannot compute — ensure cash flows include both positive and negative values."
                : metrics.irr >= npvConfig.discountRate
                ? `IRR ${fmtPct(metrics.irr)} exceeds hurdle rate ${fmtPct(npvConfig.discountRate)} — proceed.`
                : `IRR ${fmtPct(metrics.irr)} below hurdle rate ${fmtPct(npvConfig.discountRate)} — reconsider.`}
            </p>
          </div>

          {/* Comparison bar */}
          {metrics.irr !== null && (
            <div className="rounded-xl p-4 bg-surface-2 border border-border">
              <p className="text-[11px] text-text-muted mb-2 font-semibold">IRR vs Discount Rate</p>
              <div className="relative h-3 bg-surface-3 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (npvConfig.discountRate / Math.max(metrics.irr, npvConfig.discountRate + 1)) * 100)}%`,
                    background: COLORS.red,
                  }} />
                <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 opacity-80"
                  style={{
                    width: `${Math.min(100, (metrics.irr / Math.max(metrics.irr, npvConfig.discountRate + 1)) * 100)}%`,
                    background: metrics.irr >= npvConfig.discountRate ? COLORS.green : COLORS.gold,
                  }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[11px]">
                <span style={{ color: COLORS.red }}>Hurdle: {fmtPct(npvConfig.discountRate)}</span>
                <span style={{ color: metrics.irr >= npvConfig.discountRate ? COLORS.green : COLORS.gold }}>
                  IRR: {fmtPct(metrics.irr)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Section 6 — Charts
// ══════════════════════════════════════════════════════════════════════════════

function ChartsSection({ metrics }: { metrics: ReturnType<typeof computeMetrics> }) {
  const budgetPieData = [
    { name: "Pre-Production",  value: Number(metrics.preProduction.toFixed(2))  },
    { name: "Post-Production", value: Number(metrics.postProduction.toFixed(2)) },
    { name: "Production",      value: Number(metrics.production.toFixed(2))     },
    { name: "Contingency",     value: Number(metrics.contingency.toFixed(2))    },
  ];

  const revenuePieData = [
    { name: "Exhibitor",    value: Number(metrics.exhibitorShare.toFixed(2))   },
    { name: "Distributor",  value: Number(metrics.distributorShare.toFixed(2)) },
    { name: "Investor",     value: Number(metrics.investorShare.toFixed(2))    },
    { name: "P&A",          value: Number(metrics.paShare.toFixed(2))          },
  ];

  const barData = [
    { name: "Total Budget",   Budget: metrics.totalBudget,    Revenue: 0 },
    { name: "Investment",     Budget: metrics.totalInvestment, Revenue: 0 },
    { name: "Net Revenue",    Budget: 0,                       Revenue: metrics.netRevenue },
    { name: "Collections",   Budget: 0,                       Revenue: useFinancialStore.getState().revenue.totalCollections },
  ];

  const renderPieLabel = (props: import("recharts").PieLabelRenderProps) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    if (!cx || !cy || !midAngle || !outerRadius || !percent || percent < 0.06) return null;
    const RADIAN = Math.PI / 180;
    const ox = Number(outerRadius) + 20;
    const x = Number(cx) + ox * Math.cos(-Number(midAngle) * RADIAN);
    const y = Number(cy) + ox * Math.sin(-Number(midAngle) * RADIAN);
    return (
      <text x={x} y={y} textAnchor={x > Number(cx) ? "start" : "end"} dominantBaseline="central"
        fill="rgb(var(--text-s-rgb))" fontSize="10" fontFamily="Inter, sans-serif">
        {String(name)} ({(Number(percent) * 100).toFixed(0)}%)
      </text>
    );
  };

  return (
    <SectionCard
      title="Charts & Analytics"
      description="Visual breakdown of budget, revenue, and ROI"
      accent={COLORS.gold}
      icon={BarChart3}
      id="s-charts"
    >
      {/* Row 1: Two pie charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Budget Breakdown Pie */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Budget Breakdown</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={budgetPieData} cx="50%" cy="50%" outerRadius={82}
                dataKey="value" labelLine={false} label={renderPieLabel}>
                {budgetPieData.map((_, i) => (
                  <Cell key={i} fill={BUDGET_PIE_COLORS[i % BUDGET_PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {budgetPieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: BUDGET_PIE_COLORS[i] }} />
                <span className="text-text-muted">{d.name}</span>
                <span className="font-bold text-text-primary ml-auto">{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Split Pie */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Revenue Split</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={revenuePieData} cx="50%" cy="50%" innerRadius={42} outerRadius={82}
                dataKey="value" labelLine={false} label={renderPieLabel}>
                {revenuePieData.map((_, i) => (
                  <Cell key={i} fill={REVENUE_PIE_COLORS[i % REVENUE_PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {revenuePieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: REVENUE_PIE_COLORS[i] }} />
                <span className="text-text-muted">{d.name}</span>
                <span className="font-bold text-text-primary ml-auto">{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Bar chart — full width */}
      <div className="mb-8 pt-6 border-t border-border">
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Budget vs Revenue</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--border-rgb),0.5)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "rgb(var(--text-m-rgb))", fontSize: 10 }}
              axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `₹${v}Cr`}
              tick={{ fill: "rgb(var(--text-m-rgb))", fontSize: 10 }}
              axisLine={false} tickLine={false} width={55} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(var(--surface2-rgb),0.5)" }} />
            <Legend wrapperStyle={{ fontSize: 11, color: "rgb(var(--text-s-rgb))" }} />
            <Bar dataKey="Budget"  fill={COLORS.blue}  radius={[6, 6, 0, 0]} name="Budget" />
            <Bar dataKey="Revenue" fill={COLORS.green} radius={[6, 6, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3: ROI Gauge — centred with generous whitespace */}
      <div className="pt-6 border-t border-border">
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-6 text-center">ROI Gauge</p>
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-sm mx-auto">
            <ROIGauge value={metrics.roi} />
          </div>
          <div className="grid grid-cols-3 gap-6 mt-4 w-full max-w-xs">
            {[
              { label: "Investment",  value: fmt(metrics.totalInvestment), color: COLORS.blue   },
              { label: "Net Rev.",    value: fmt(metrics.netRevenue),       color: COLORS.green  },
              { label: "ROI",         value: fmtPct(metrics.roi),           color: metrics.roi >= 0 ? COLORS.green : COLORS.red },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-sm font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Section 7 — Risk & Insights
// ══════════════════════════════════════════════════════════════════════════════

function InsightsSection({ metrics }: { metrics: ReturnType<typeof computeMetrics> }) {
  const { revenue } = useFinancialStore();

  type Severity = "green" | "yellow" | "red";

  const insights: { severity: Severity; title: string; body: string }[] = [];

  // ROI
  if (metrics.roi >= 30)
    insights.push({ severity: "green", title: "Strong ROI", body: `ROI of ${fmtPct(metrics.roi)} signals a healthy, profitable project. Proceed with confidence.` });
  else if (metrics.roi >= 0)
    insights.push({ severity: "yellow", title: "Low-margin Project", body: `ROI of ${fmtPct(metrics.roi)} — you'll break even, but margins are thin. Consider reducing costs.` });
  else
    insights.push({ severity: "red", title: "High-risk — Loss Projected", body: `ROI is ${fmtPct(metrics.roi)}. Current projections indicate a net loss. Revisit budget or revenue targets.` });

  // Efficiency
  if (metrics.efficiencyRatio >= 3)
    insights.push({ severity: "green", title: "Marketing Highly Efficient", body: `Collections are ${fmtX(metrics.efficiencyRatio)} of marketing spend — excellent return on marketing investment.` });
  else if (metrics.efficiencyRatio >= 2)
    insights.push({ severity: "yellow", title: "Average Marketing Efficiency", body: `Efficiency ratio of ${fmtX(metrics.efficiencyRatio)} is acceptable but consider increasing collections or reducing marketing spend.` });
  else if (metrics.efficiencyRatio > 0)
    insights.push({ severity: "red", title: "Marketing Over-spending", body: `Efficiency ratio of ${fmtX(metrics.efficiencyRatio)} indicates marketing spend is disproportionate to collections. Cut or reallocate.` });

  // Budget vs Revenue
  if (revenue.totalCollections >= metrics.totalBudget * 1.5)
    insights.push({ severity: "green", title: "Strong Box Office Coverage", body: `Collections (${fmt(revenue.totalCollections)}) comfortably exceed total budget — good financial cushion.` });
  else if (revenue.totalCollections >= metrics.totalBudget)
    insights.push({ severity: "yellow", title: "Narrow Box Office Margin", body: `Collections barely cover total budget. Any underperformance risks a net loss.` });
  else
    insights.push({ severity: "red", title: "Collections Below Budget", body: `Box office collections (${fmt(revenue.totalCollections)}) do not cover total budget (${fmt(metrics.totalBudget)}). Loss is highly likely.` });

  // Over-budget actuals
  if (metrics.isOverBudget)
    insights.push({ severity: "red", title: "Actual Expenses Over Budget", body: `You are ${fmt(Math.abs(metrics.actualOverBudget))} over your estimated actuals. Review variable cost controls immediately.` });

  // NPV
  if (metrics.npv > 0)
    insights.push({ severity: "green", title: "Positive NPV", body: `NPV of ${fmt(metrics.npv)} confirms value creation above the hurdle rate.` });
  else
    insights.push({ severity: "yellow", title: "Negative NPV", body: `NPV of −${fmt(Math.abs(metrics.npv))} suggests returns fall short of the required discount rate. Revisit cash flow assumptions.` });

  const severityConfig = {
    green:  { icon: CheckCircle2, bg: "bg-green-500/5",   border: "border-green-500/20",  color: COLORS.green },
    yellow: { icon: AlertTriangle, bg: "bg-gold/5",       border: "border-gold/20",        color: COLORS.gold  },
    red:    { icon: XCircle,      bg: "bg-red-500/5",     border: "border-red-500/20",     color: COLORS.red   },
  };

  return (
    <SectionCard
      title="Risk & Insights"
      description="AI-generated observations based on your financial model"
      accent={COLORS.red}
      icon={AlertTriangle}
      id="s-insights"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((ins, i) => {
          const cfg = severityConfig[ins.severity];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn("rounded-xl p-4 border", cfg.bg, cfg.border)}
            >
              <div className="flex items-start gap-2.5 mb-2">
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                <span className="text-xs font-bold" style={{ color: cfg.color }}>{ins.title}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{ins.body}</p>
            </motion.div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Section Nav — sticky tab bar with IntersectionObserver scroll-spy
// ══════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id: "s-budget",     label: "Budget",     icon: Calculator   },
  { id: "s-revenue",    label: "Revenue",    icon: TrendingUp   },
  { id: "s-kpis",       label: "KPIs",       icon: BarChart3    },
  { id: "s-npv",        label: "NPV / IRR",  icon: LineChart    },
  { id: "s-charts",     label: "Charts",     icon: BarChart3    },
  { id: "s-territory",  label: "Territory",  icon: Globe        },
  { id: "s-scenarios",  label: "Scenarios",  icon: GitBranch    },
  { id: "s-projection", label: "Projection", icon: TrendingUp   },
  { id: "s-insights",   label: "Insights",   icon: AlertTriangle },
];

function SectionNav() {
  const [active, setActive] = useState(NAV_ITEMS[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const visible = new Map<string, number>();

    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          visible.set(id, entry.intersectionRatio);
          // pick the most visible section
          let best = NAV_ITEMS[0].id;
          let bestRatio = -1;
          visible.forEach((ratio, key) => {
            if (ratio > bestRatio) { bestRatio = ratio; best = key; }
          });
          setActive(best);
        },
        { threshold: [0, 0.1, 0.3, 0.5], rootMargin: "-10% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }, []);

  return (
    <div className="sticky top-0 z-20 -mx-6 px-6 py-2 bg-background/80 backdrop-blur-md border-b border-border">
      <div ref={scrollRef} className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0",
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-2"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Break-even Tracker — wide progress card
// ══════════════════════════════════════════════════════════════════════════════

function BreakevenTracker({ metrics, collections }: {
  metrics: ReturnType<typeof computeMetrics>;
  collections: number;
}) {
  const target   = metrics.breakEven;
  const progress = target > 0 ? Math.min(1, collections / target) : 0;
  const pct      = (progress * 100).toFixed(1);
  const remaining = Math.max(0, target - collections);
  const color     = progress >= 1 ? COLORS.green : progress >= 0.7 ? COLORS.gold : COLORS.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="rounded-2xl px-6 py-4 relative overflow-hidden"
      style={{ background: "var(--card-bg)", border: `1px solid ${color}25`, boxShadow: `0 2px 16px ${color}0c` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Target className="w-4 h-4" style={{ color }} />
          <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Break-even Tracker</span>
        </div>
        <div className="flex items-center gap-6 text-xs ml-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Target</span>
            <span className="font-black tabular-nums" style={{ color }}>{fmt(target)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Collections</span>
            <span className="font-black tabular-nums text-text-primary">{fmt(collections)}</span>
          </div>
          {remaining > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Remaining</span>
              <span className="font-bold tabular-nums text-red-400">{fmt(remaining)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 rounded-full bg-surface-3 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 10px ${color}60` }}
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(100, progress * 100)}%` }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Target line at 100% */}
        <div className="absolute top-0 right-0 w-0.5 h-full bg-white/30 rounded-full" />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-text-muted">0</span>
        <span
          className="text-xs font-black tabular-nums px-2 py-0.5 rounded-full"
          style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
        >
          {pct}% {progress >= 1 ? "✓ Achieved" : "of break-even"}
        </span>
        <span className="text-[11px] text-text-muted">{fmt(target)}</span>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Territory Section — 7-way revenue split by territory
// ══════════════════════════════════════════════════════════════════════════════

const TERRITORY_PIE_COLORS = [
  COLORS.blue, COLORS.cyan, COLORS.green, COLORS.purple,
  COLORS.gold, "#F97316", COLORS.muted,
];

function TerritorySection({ totalCollections }: { totalCollections: number }) {
  const { territory, setTerritory } = useFinancialStore();
  const remaining = territoryRemaining(territory);
  const totalAssigned = 100 - remaining;
  const overAllocated = totalAssigned > 100;

  const sliders: { key: keyof TerritoryConfig; label: string; color: string; tooltip: string }[] = [
    { key: "hindiDomesticPct",   label: "Hindi Belt (Domestic)", color: COLORS.blue,   tooltip: "Collections from North India, UP, Bihar, MP, Rajasthan, Delhi NCR." },
    { key: "southIndiaPct",      label: "South India",           color: COLORS.cyan,   tooltip: "Tamil Nadu, Andhra Pradesh, Karnataka, Kerala — all languages." },
    { key: "overseasPct",        label: "Overseas Markets",      color: COLORS.green,  tooltip: "UAE, UK, USA, Canada, Australia, and other international markets." },
    { key: "ottRightsPct",       label: "OTT / Streaming",       color: COLORS.purple, tooltip: "Digital rights sold to OTT platforms (Netflix, Amazon Prime, JioCinema, etc.)." },
    { key: "satelliteRightsPct", label: "Satellite / TV Rights", color: COLORS.gold,   tooltip: "Broadcast rights sold to TV channels (Star, Zee, Sony, Colors, etc.)." },
    { key: "musicRightsPct",     label: "Music Rights",          color: "#F97316",     tooltip: "Audio rights revenue (Spotify, Apple Music, YouTube Music, etc.)." },
  ];

  const pieData = [
    ...sliders.map((s) => ({
      name: s.label,
      value: Number(((territory[s.key] / 100) * totalCollections).toFixed(2)),
    })),
    { name: "Other / Misc", value: Number(((remaining / 100) * totalCollections).toFixed(2)) },
  ].filter((d) => d.value > 0);

  const renderTerritoryLabel = (props: import("recharts").PieLabelRenderProps) => {
    const { cx, cy, midAngle, outerRadius, percent } = props;
    if (!cx || !cy || !midAngle || !outerRadius || !percent || Number(percent) < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const ox = Number(outerRadius) + 18;
    const x = Number(cx) + ox * Math.cos(-Number(midAngle) * RADIAN);
    const y = Number(cy) + ox * Math.sin(-Number(midAngle) * RADIAN);
    return (
      <text x={x} y={y} textAnchor={x > Number(cx) ? "start" : "end"} dominantBaseline="central"
        fill="rgb(var(--text-s-rgb))" fontSize="10" fontFamily="Inter, sans-serif">
        {(Number(percent) * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <SectionCard
      title="Territory Revenue Breakdown"
      description="Split your total box office collections across territories and rights"
      accent={COLORS.green}
      icon={Globe}
      id="s-territory"
    >
      {overAllocated && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/25 text-xs text-red-400 font-semibold flex items-center gap-2">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Total allocation exceeds 100%. Reduce one or more sliders.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        {/* Sliders */}
        <div className="space-y-5">
          {sliders.map((s) => (
            <RangeSlider
              key={s.key}
              label={s.label}
              value={territory[s.key]}
              min={0} max={60} step={1}
              color={s.color}
              tooltip={s.tooltip}
              formatValue={(v) => `${v}% · ${fmt((v / 100) * totalCollections)}`}
              onChange={(v) => setTerritory({ [s.key]: v } as Partial<TerritoryConfig>)}
              markers={false}
            />
          ))}

          {/* Remaining row */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-2 border border-border">
            <span className="text-xs text-text-muted font-semibold">Other / Misc (auto)</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black tabular-nums"
                style={{ color: overAllocated ? COLORS.red : COLORS.muted }}>
                {remaining.toFixed(0)}%
              </span>
              <span className="text-xs font-bold text-text-muted">{fmt((remaining / 100) * totalCollections)}</span>
            </div>
          </div>

          {/* Total allocated */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-xs font-semibold text-text-secondary">Total Collections Allocated</span>
            <span className="text-sm font-black text-text-primary">{fmt(totalCollections)}</span>
          </div>
        </div>

        {/* Pie chart */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Territory Split</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={80}
                dataKey="value" labelLine={false} label={renderTerritoryLabel}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={TERRITORY_PIE_COLORS[i % TERRITORY_PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: TERRITORY_PIE_COLORS[i % TERRITORY_PIE_COLORS.length] }} />
                <span className="text-text-muted truncate">{d.name}</span>
                <span className="font-bold text-text-primary ml-auto tabular-nums">{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Scenario Planner — 3 named snapshots with side-by-side comparison
// ══════════════════════════════════════════════════════════════════════════════

const SCENARIO_COLORS: Record<string, string> = {
  Optimistic:  COLORS.green,
  Base:        COLORS.blue,
  Pessimistic: COLORS.red,
};

function ScenarioPlanner({ currentMetrics: _currentMetrics }: { currentMetrics: ReturnType<typeof computeMetrics> }) {
  const { scenarios, setScenarioFromCurrent, clearScenario, renameScenario, breakdown, npvConfig } = useFinancialStore();

  const scenarioMetrics = scenarios.map((sc) =>
    sc.isSet
      ? computeMetrics(sc.budget, breakdown, sc.revenue, npvConfig)
      : null
  );

  const verdictLabel = (roi: number) =>
    roi >= 20 ? "Profitable" : roi >= 0 ? "Break-even" : "Loss";
  const verdictColor = (roi: number) =>
    roi >= 20 ? COLORS.green : roi >= 0 ? COLORS.gold : COLORS.red;

  return (
    <SectionCard
      title="Scenario Planner"
      description="Model Optimistic, Base, and Pessimistic outcomes side-by-side"
      accent={COLORS.purple}
      icon={GitBranch}
      id="s-scenarios"
    >
      {/* Scenario cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {scenarios.map((sc, i) => {
          const sm     = scenarioMetrics[i];
          const color  = SCENARIO_COLORS[sc.label] ?? COLORS.blue;
          const isSet  = sc.isSet;

          return (
            <motion.div
              key={sc.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: "var(--card-bg)",
                border: `1px solid ${color}${isSet ? "35" : "20"}`,
                boxShadow: isSet ? `0 4px 20px ${color}12` : "none",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <GitBranch className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <input
                  value={sc.name}
                  onChange={(e) => renameScenario(i, e.target.value)}
                  className="flex-1 text-sm font-bold bg-transparent outline-none text-text-primary"
                  placeholder={sc.label}
                />
              </div>

              {/* Metrics or empty state */}
              {isSet && sm ? (
                <div className="space-y-2 mb-4">
                  {[
                    { label: "Collections",    value: fmt(sm.breakEven + (sm.netRevenue - sm.breakEven) > 0 ? sm.breakEven : sm.breakEven), display: fmt(sc.revenue.totalCollections) },
                    { label: "Net Revenue",    display: fmt(sm.netRevenue)       },
                    { label: "ROI",            display: fmtPct(sm.roi)           },
                    { label: "Total Budget",   display: fmt(sm.totalBudget)      },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-xs">
                      <span className="text-text-muted">{row.label}</span>
                      <span className="font-bold text-text-primary tabular-nums">{row.display}</span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center justify-between">
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ color: verdictColor(sm.roi), background: `${verdictColor(sm.roi)}15`, border: `1px solid ${verdictColor(sm.roi)}30` }}
                    >
                      {verdictLabel(sm.roi)}
                    </span>
                    <span className="text-lg font-black tabular-nums" style={{ color }}>{fmtPct(sm.roi)}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-xs text-text-muted mb-3">No data yet</p>
                  <p className="text-[11px] text-text-muted opacity-70">
                    Set up your model then click &ldquo;Capture&rdquo; below
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setScenarioFromCurrent(i)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                >
                  <Copy className="w-3 h-3" />
                  Capture Current
                </button>
                {isSet && (
                  <button
                    onClick={() => clearScenario(i)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 text-text-muted hover:text-red-400 hover:bg-red-500/10 border border-border"
                  >
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison table — only if at least 2 scenarios are set */}
      {scenarioMetrics.filter(Boolean).length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-surface-2 border border-border overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Side-by-side Comparison</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-text-muted font-semibold w-36">Metric</th>
                  {scenarios.map((sc) => (
                    <th key={sc.label} className="px-5 py-3 text-center font-bold"
                      style={{ color: SCENARIO_COLORS[sc.label] }}>
                      {sc.name || sc.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Collections",  fn: (sm: ReturnType<typeof computeMetrics>, idx: number) => fmt(scenarios[idx].revenue.totalCollections) },
                  { label: "Total Budget", fn: (sm: ReturnType<typeof computeMetrics>) => fmt(sm.totalBudget) },
                  { label: "Net Revenue",  fn: (sm: ReturnType<typeof computeMetrics>) => fmt(sm.netRevenue) },
                  { label: "ROI",          fn: (sm: ReturnType<typeof computeMetrics>) => fmtPct(sm.roi) },
                  { label: "Break-even",   fn: (sm: ReturnType<typeof computeMetrics>) => fmt(sm.breakEven) },
                  { label: "Efficiency",   fn: (sm: ReturnType<typeof computeMetrics>) => `${fmtX(sm.efficiencyRatio)} (${sm.efficiencyLabel})` },
                ].map((row, ri) => (
                  <motion.tr
                    key={row.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ri * 0.04 }}
                    className="border-b border-border/50 hover:bg-surface-2/50 transition-colors"
                  >
                    <td className="px-5 py-2.5 text-text-secondary font-semibold">{row.label}</td>
                    {scenarioMetrics.map((sm, i) => (
                      <td key={i} className="px-5 py-2.5 text-center font-bold tabular-nums"
                        style={{ color: sm ? SCENARIO_COLORS[scenarios[i].label] : undefined }}>
                        {sm ? row.fn(sm, i) : <span className="text-text-muted opacity-40">—</span>}
                      </td>
                    ))}
                  </motion.tr>
                ))}
                {/* Verdict row */}
                <tr className="bg-surface-3/50">
                  <td className="px-5 py-3 text-text-secondary font-bold text-[11px] uppercase tracking-wider">Verdict</td>
                  {scenarioMetrics.map((sm, i) => (
                    <td key={i} className="px-5 py-3 text-center">
                      {sm ? (
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{
                            color: verdictColor(sm.roi),
                            background: `${verdictColor(sm.roi)}15`,
                            border: `1px solid ${verdictColor(sm.roi)}30`,
                          }}
                        >
                          {verdictLabel(sm.roi)}
                        </span>
                      ) : (
                        <span className="text-text-muted opacity-40">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Main Page
// ══════════════════════════════════════════════════════════════════════════════

export default function FinancialPage() {
  const { budget, breakdown, revenue, npvConfig, territory, reset } = useFinancialStore();
  const [saved, setSaved]         = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filmTitle, setFilmTitle] = useState("Untitled Film");
  const [editingTitle, setEditingTitle] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const metrics = useMemo(
    () => computeMetrics(budget, breakdown, revenue, npvConfig),
    [budget, breakdown, revenue, npvConfig]
  );

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);
    try {
      await exportReportPDF(
        reportRef.current,
        `${filmTitle.replace(/\s+/g, "-").toLowerCase()}-investor-report.pdf`
      );
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-full space-y-6">

      {/* ── Header — cinematic upgrade ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative rounded-2xl overflow-hidden px-6 py-6"
        style={{ background: "var(--card-bg)", border: "1px solid rgba(29,119,197,0.2)" }}
      >
        {/* Radial glow backdrop */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 10% 50%, rgba(29,119,197,0.10) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 80% at 90% 30%, rgba(0,194,224,0.06) 0%, transparent 70%)" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left: icon + title + subtitle + film name */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{ background: "rgba(29,119,197,0.18)", border: "1px solid rgba(29,119,197,0.35)" }}>
              <Clapperboard className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                <span className="text-text-primary">Film </span>
                <span className="text-gradient">Finance Studio</span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed"
              >
                Budget planning · Revenue modelling · ROI · NPV/IRR · Scenarios · Territory
              </motion.p>

              {/* Film title editor */}
              <div className="flex items-center gap-2 mt-2.5">
                {editingTitle ? (
                  <input
                    autoFocus
                    value={filmTitle}
                    onChange={(e) => setFilmTitle(e.target.value)}
                    onBlur={() => setEditingTitle(false)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingTitle(false); }}
                    className="text-sm font-semibold bg-transparent border-b border-accent outline-none text-text-primary w-full max-w-[240px] pb-0.5"
                    placeholder="Enter film title..."
                  />
                ) : (
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-accent transition-colors group max-w-full"
                  >
                    <Film className="w-3.5 h-3.5 text-accent/70 flex-shrink-0" />
                    <span className="truncate">{filmTitle}</span>
                    <PenLine className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Button variant="ghost" size="sm" leftIcon={<RefreshCcw className="w-3.5 h-3.5" />} onClick={reset}>
              Reset
            </Button>
            <Button size="sm"
              leftIcon={saved ? <CheckCheck className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              onClick={handleSave}
              className={saved ? "bg-green-500/20 border-green-500/30 text-green-400" : ""}
            >
              {saved ? "Saved!" : "Save Model"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={exporting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <FileDown className="w-3.5 h-3.5" />}
              onClick={handleExportPDF}
              disabled={exporting}
              className="border-accent/30 text-accent hover:bg-accent/10"
            >
              {exporting ? "Generating…" : "Export PDF"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Sticky section tab navigator ── */}
      <SectionNav />

      {/* ── Quick stats row ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Budget",  value: fmt(metrics.totalBudget),          color: COLORS.blue,   icon: Film       },
          { label: "Box Office",    value: fmt(revenue.totalCollections),      color: COLORS.green,  icon: TrendingUp },
          { label: "ROI",           value: fmtPct(metrics.roi),               color: metrics.roi >= 0 ? COLORS.green : COLORS.red, icon: Percent },
          { label: "Break-even",    value: fmt(metrics.breakEven),            color: COLORS.purple, icon: Target     },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05 }}
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{ background: "var(--card-bg)", border: `1px solid ${s.color}25`, boxShadow: `0 2px 12px ${s.color}0c` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{s.label}</span>
              </div>
              <div className="text-xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Break-even Progress Tracker ── */}
      <BreakevenTracker metrics={metrics} collections={revenue.totalCollections} />

      {/* ── Sections ── */}
      <BudgetSection />
      <RevenueSection metrics={metrics} />
      <TerritorySection totalCollections={revenue.totalCollections} />
      <KPISection metrics={metrics} />
      <NPVSection metrics={metrics} />
      <ChartsSection metrics={metrics} />
      <ScenarioPlanner currentMetrics={metrics} />

      {/* ── Revenue Projection Engine ── */}
      <motion.div
        id="s-projection"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-surface border border-border overflow-hidden scroll-mt-20"
      >
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,194,224,0.12)", border: "1px solid rgba(0,194,224,0.28)" }}>
            <TrendingUp className="w-4 h-4" style={{ color: "#00C2E0" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-text-primary">Revenue Projection Engine</h2>
            <p className="text-xs text-text-muted mt-0.5">Weighted box-office forecast · real-time recalculation</p>
          </div>
        </div>
        <div className="p-6">
          <ProjectionPanel budgetSeed={budget.productionBudget + budget.marketingBudget} hideHeader />
        </div>
      </motion.div>

      <InsightsSection metrics={metrics} />

      {/* ── Hidden investor report (captured by html2canvas for PDF export) ── */}
      <div
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <InvestorReport
          ref={reportRef}
          filmTitle={filmTitle}
          date={new Date().toLocaleDateString("en-IN", {
            day: "2-digit", month: "long", year: "numeric",
          })}
          metrics={metrics}
          totalCollections={revenue.totalCollections}
          territory={territory}
        />
      </div>
    </div>
  );
}
