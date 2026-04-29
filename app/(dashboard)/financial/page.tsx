"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, CartesianGrid, Legend, PieChart, Pie,
  Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Target, BarChart3, AlertTriangle,
  CheckCircle2, XCircle, Calculator, Globe, RefreshCcw, Save, Info,
  FileDown, Upload, Plus, Trash2, Percent, ToggleLeft, ToggleRight,
  Layers, Landmark, Gauge, Film, ShieldAlert, ShieldCheck, Zap, Sparkles,
  SlidersHorizontal, Lightbulb, ChevronRight, PieChart as PieChartIcon,
  ChevronDown, ChevronUp, Eye, Wifi, PlayCircle, MonitorPlay,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROIGauge } from "@/components/dashboard/ROIGauge";
import { ProjectionPanel } from "@/components/dashboard/ProjectionPanel";
import GenerateButton from "@/components/finance/GenerateButton";
import {
  type PhaseKey,
  type SplitKey,
  type TerritoryEntry,
  type BreakEvenMode,
  type BudgetCategory,
  type ReleasePlatform,
  BUDGET_CATEGORIES,
  phaseRowTotals,
  categoryColumnTotals,
  clampPeriodCount,
  computeMetrics,
  territoryRemaining,
  territoryTotal,
  useFinancialStore,
  validateFinanceInputs,
  revenueSplitPercentInvalid,
} from "@/lib/financial-store";
import { saveFinancialData, getFinancialData } from "@/lib/financial/api";
import { computeDecision, generateInsights } from "@/lib/financial/insights";
import { cn } from "@/lib/utils";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  blue:   "#1D77C5",
  cyan:   "#00C2E0",
  gold:   "#F59E0B",
  green:  "#22C55E",
  purple: "#A78BFA",
  red:    "#EF4444",
  orange: "#F97316",
  muted:  "#6B7280",
};
const PIE_PAL = [C.blue, C.gold, C.cyan, C.purple, C.green, C.orange, C.muted];

// ── Formatters ─────────────────────────────────────────────────────────────────
/** Indian locale number formatter — ₹1,23,456.00 style */
const crFmt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmt = (n: number) =>
  `₹${crFmt.format(Math.max(0, Number.isFinite(n) ? n : 0))} Cr`;

/** Allows negative values — renders −₹ prefix for losses. */
const fmtSigned = (n: number) => {
  const v = Number.isFinite(n) ? n : 0;
  return v < 0 ? `−₹${crFmt.format(Math.abs(v))} Cr` : `₹${crFmt.format(v)} Cr`;
};

const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;
const fmtX   = (n: number)        => `${n.toFixed(2)}×`;
const clamp  = (n: number, lo=0)  => Math.max(lo, isFinite(n) ? n : 0);

/** Round ₹ Cr numbers to 2 decimals (fixes float noise in inputs, e.g. break-even target). */
function round2Cr(n: number): number {
  const x = Number.isFinite(n) ? n : 0;
  return Math.round(x * 100) / 100;
}

// ── Phase / split labels ────────────────────────────────────────────────────────
const PHASE_LABEL: Record<PhaseKey, string> = {
  preProduction:  "Pre-production",
  production:     "Production",
  postProduction: "Post-production",
  contingency:    "Contingency",
};
const PHASE_COLOR: Record<PhaseKey, string> = {
  preProduction:  C.blue,
  production:     C.gold,
  postProduction: C.cyan,
  contingency:    C.purple,
};
const SPLIT_LABEL: Record<SplitKey, string> = {
  exhibitor:   "Exhibitor",
  distributor: "Distributor",
  investor:    "Investor",
  pa:          "P&A",
};
const CATEGORY_LABEL: Record<BudgetCategory, string> = {
  marketing:      "Marketing expense",
  actorBudget:    "Actor expense",
  foodUtilities:  "Food & utilities",
  travel:         "Travel expense",
  misc:           "Miscellaneous",
};
const PLATFORM_OPTIONS: TerritoryEntry["platform"][] = ["Theatrical", "OTT", "Satellite"];

const RELEASE_PLATFORMS: ReleasePlatform[] = ["Theatrical", "OTT", "YouTube", "Instagram", "Mixed"];

const RELEASE_PLATFORM_LABEL: Record<ReleasePlatform, string> = {
  Theatrical:  "🎬 Theatrical",
  OTT:         "📺 OTT (Streaming)",
  YouTube:     "▶  YouTube",
  Instagram:   "📸 Instagram / Reels",
  Mixed:       "🔀 Mixed (Multi-platform)",
};

/** Format large raw view counts nicely: 1 200 000 → "12.0 L" or "1.2 Cr" */
function fmtViews(n: number): string {
  if (!isFinite(n) || n <= 0) return "0";
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} K`;
  return String(Math.round(n));
}

const CHART_PERIOD_PREFIX = { year: "Y", month: "M", week: "W" } as const;
const CHART_PERIOD_LABEL  = { year: "Yearly", month: "Monthly", week: "Weekly" } as const;

/** Same horizontal footprint as MatrixNumInput — keeps column totals visually under inputs. */
function MatrixCellTotal({ value }: { value: number }) {
  return (
    <div
      className={cn(
        "w-full min-w-[4.5rem] h-8 px-2 rounded-lg text-xs font-bold tabular-nums text-text-primary border border-transparent",
        "flex items-center justify-end bg-surface-2/40",
      )}
    >
      {round2Cr(value)}
    </div>
  );
}

function MatrixNumInput({
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  "aria-label"?: string;
}) {
  return (
    <input
      type="number"
      min={0}
      step={0.1}
      aria-label={ariaLabel}
      placeholder="0"
      value={!isFinite(value) || value === 0 ? "" : value}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? 0 : Math.max(0, Number(raw) || 0));
      }}
      className={cn(
        "w-full min-w-[4.5rem] h-8 px-2 rounded-lg text-xs text-text-primary border bg-surface-2",
        "focus:outline-none focus:ring-2 focus:ring-accent/25 border-border",
      )}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Shared micro-components
// ══════════════════════════════════════════════════════════════════════════════

function SCard({
  id, title, description, accent, icon: Icon, children, className,
}: {
  id?: string; title: string; description?: string; accent?: string;
  icon?: React.ElementType; children: React.ReactNode; className?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "rounded-2xl bg-surface border border-border overflow-hidden scroll-mt-20",
        "shadow-sm hover:shadow-md transition-shadow duration-300",
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
        {Icon && accent && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
        )}
        <div>
          <h2 className="text-sm font-bold text-text-primary leading-tight">{title}</h2>
          {description && <p className="text-[11px] text-text-muted mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5 sm:p-6 space-y-5">{children}</div>
    </motion.section>
  );
}

function NumField({
  label, value, onChange, suffix, error, tooltip, min = 0, readOnly,
}: {
  label: string; value: number; onChange?: (n: number) => void;
  suffix?: string; error?: string; tooltip?: string; min?: number; readOnly?: boolean;
}) {
  // Editable: empty when 0. All displayed amounts rounded to 2 dp to avoid 35.20000000000001-style floats.
  const displayValue = (!isFinite(value) || value === 0) ? "" : round2Cr(value);

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
        {label}
        {tooltip && (
          <Tip text={tooltip}>
            <Info className="w-3 h-3 opacity-40 hover:opacity-90 transition-opacity cursor-help" />
          </Tip>
        )}
      </label>
      <div className="relative">
        <input
          type="number" min={min} step={0.01} readOnly={readOnly}
          value={readOnly ? (isFinite(value) ? round2Cr(value) : 0) : displayValue}
          placeholder="0"
          onChange={(e) => {
            const raw = e.target.value;
            const next = raw === "" ? 0 : Math.max(min, Number(raw) || 0);
            onChange?.(round2Cr(next));
          }}
          className={cn(
            "w-full h-10 px-3 pr-12 rounded-xl text-sm text-text-primary border bg-surface-2",
            "focus:outline-none focus:ring-2 focus:ring-accent/25 transition-all",
            "placeholder:text-text-muted/50",
            readOnly ? "opacity-60 cursor-default" : "",
            error ? "border-red-500/60" : "border-border",
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-text-muted select-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-red-400 flex items-center gap-1">
          <XCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

function ErrBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/25 text-xs text-red-400">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{msg}
    </div>
  );
}
function OkBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/8 border border-green-500/25 text-xs text-green-400">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{msg}
    </div>
  );
}
function KpiChip({ label, value, color, sub, icon: Icon, tooltip }: {
  label: string; value: string; color: string; sub?: string; icon?: React.ElementType;
  tooltip?: string;
}) {
  return (
    <div className={cn(
      "flex flex-col gap-0.5 p-4 rounded-2xl border",
      "transition-all duration-200 hover:scale-[1.03] hover:shadow-lg cursor-default select-none",
    )}
      style={{ background: `${color}08`, borderColor: `${color}22`, boxShadow: `0 2px 8px ${color}0a` }}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}
        <span>{label}</span>
        {tooltip && (
          <Tip text={tooltip}>
            <Info className="w-3 h-3 opacity-40 hover:opacity-90 transition-opacity cursor-help" />
          </Tip>
        )}
      </div>
      <div className="text-lg font-black tabular-nums leading-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-text-muted leading-snug">{sub}</div>}
    </div>
  );
}

function MetricBox({ label, value, color, guidance, icon: Icon, tooltip, badge }: {
  label: string; value: string; color: string; guidance?: string; icon?: React.ElementType;
  tooltip?: string; badge?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4 space-y-1.5 transition-all duration-200 hover:shadow-md"
      style={{ borderColor: `${color}25`, background: `${color}06`, boxShadow: `0 1px 4px ${color}08` }}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5 flex-wrap">
        {Icon && <Icon className="w-3 h-3" style={{ color }} />}
        <span>{label}</span>
        {tooltip && (
          <Tip text={tooltip}>
            <Info className="w-3 h-3 opacity-40 hover:opacity-90 transition-opacity cursor-help" />
          </Tip>
        )}
        {badge}
      </div>
      <div className="text-xl font-black tabular-nums" style={{ color }}>{value}</div>
      {guidance && <p className="text-[10px] text-text-muted leading-relaxed">{guidance}</p>}
    </div>
  );
}

function BandRow({ ratio, threshold, label, desc, color }: {
  ratio: number; threshold: number; label: string; desc: string; color: string;
}) {
  const active =
    threshold < 2  ? ratio < 2 :
    threshold === 3 ? ratio >= 2 && ratio <= 3 :
    ratio > 3;
  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border transition-all",
      active ? "border-opacity-50" : "border-transparent opacity-40",
    )}
      style={active ? { borderColor: `${color}50`, background: `${color}10`, color } : {}}>
      <span className="font-bold">{label}</span>
      <span>{desc}</span>
      {active && <CheckCircle2 className="w-3.5 h-3.5" />}
    </div>
  );
}

/** Floating tooltip with fade + delay — hover triggers via CSS group */
function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group/tip inline-flex shrink-0">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2
        rounded-xl border border-white/10 bg-gray-950/95 px-3 py-2.5 shadow-2xl
        text-[10px] leading-relaxed text-gray-300 whitespace-normal
        opacity-0 scale-95 group-hover/tip:opacity-100 group-hover/tip:scale-100
        transition-all duration-200 ease-out delay-300">
        {text}
        {/* Arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
          border-x-4 border-x-transparent border-t-4 border-t-gray-950/95" />
      </span>
    </span>
  );
}

function ChartTip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; fill?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl bg-surface border border-border shadow-xl text-xs min-w-[180px]">
      {label && <p className="font-bold text-text-secondary mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-text-muted">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            {p.name}
          </span>
          <span className="font-bold text-text-primary">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── CSV helpers ─────────────────────────────────────────────────────────────────

const CSV_TEMPLATE =
  "Zone,State,City,Platform,Amount (Cr)\n" +
  "North,Delhi,New Delhi,Theatrical,0\n" +
  "South,Tamil Nadu,Chennai,Theatrical,0\n" +
  "West,Maharashtra,Mumbai,Theatrical,0\n" +
  "East,West Bengal,Kolkata,Theatrical,0\n" +
  "Overseas,USA,Los Angeles,Theatrical,0\n" +
  "Digital,All,All,OTT,0\n" +
  "Digital,All,All,Satellite,0\n";

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "territory-template.csv"; a.click();
  URL.revokeObjectURL(url);
}

const REQ_HEADERS = ["zone", "state", "city", "platform", "amount (cr)"];
function parseTerritoryCsv(text: string): { rows: TerritoryEntry[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return { rows: [], errors: ["Empty file."] };
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const missing = REQ_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length) return { rows: [], errors: [`Missing headers: ${missing.join(", ")}`] };
  const errors: string[] = [];
  const rows: TerritoryEntry[] = [];
  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return;
    const cols = line.split(",");
    const zone     = cols[0]?.trim() ?? "";
    const state    = cols[1]?.trim() ?? "";
    const city     = cols[2]?.trim() ?? "";
    const platform = (cols[3]?.trim() as TerritoryEntry["platform"]) ?? "Theatrical";
    const vRaw     = cols[4]?.trim() ?? "";
    const value    = Number(vRaw);
    if (!PLATFORM_OPTIONS.includes(platform)) {
      errors.push(`Row ${i+2}: Platform "${platform}" invalid — use Theatrical | OTT | Satellite.`);
      return;
    }
    if (vRaw !== "" && isNaN(value)) {
      errors.push(`Row ${i+2}: Amount must be numeric.`); return;
    }
    rows.push({ id: `csv-${Date.now()}-${i}`, zone, state, city, platform, value: Math.max(0, value) });
  });
  return { rows, errors };
}

// ══════════════════════════════════════════════════════════════════════════════
//  Main Page
// ══════════════════════════════════════════════════════════════════════════════

export default function FinancialPage() {
  const {
    budgetMatrix,
    breakEvenMode,
    breakEvenManual,
    revenue,
    npvConfig,
    territory,
    projections,
    reportGenerated,
    setMatrixCell,
    setBreakEvenMode,
    setBreakEvenManual,
    setRevenueMode,
    setRevenueTotalCollections,
    setRevenueSplit,
    setTotalBudgetRevenue,
    setNPVConfig,
    setCashFlow,
    addTerritoryEntry,
    updateTerritoryEntry,
    removeTerritoryEntry,
    importTerritoryRows,
    setProjectionPeriodType,
    setPeriodCount,
    setChartMode,
    setProjectedValue,
    resetInputs,
    loadDemoValues,
    reset,
    releasePlatform,
    digitalModel,
    setReleasePlatform,
    setDigitalModel,
  } = useFinancialStore();

  const reportRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [autoBalMsg, setAutoBalMsg] = useState("");
  const [generateErrors] = useState<string[]>([]);
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [cashFlowPeriod, setCashFlowPeriod] = useState<"year" | "month" | "week">("year");
  const [periodCountStr, setPeriodCountStr] = useState(() => String(projections.periodCount));

  useEffect(() => {
    setPeriodCountStr(String(projections.periodCount));
  }, [projections.periodCount]);
  const [territoryZoneVizData, setTerritoryZoneVizData] = useState<Array<{ name: string; value: number }>>([]);
  const [territoryPlatformVizData, setTerritoryPlatformVizData] = useState<Array<{ name: string; value: number }>>([]);
  const [territoryVizRequested, setTerritoryVizRequested] = useState(false);

  const metrics = useMemo(
    () => computeMetrics(budgetMatrix, breakEvenMode, breakEvenManual, revenue, npvConfig),
    [budgetMatrix, breakEvenMode, breakEvenManual, revenue, npvConfig],
  );

  // ── Digital release model ────────────────────────────────────────────────
  const isDigital = releasePlatform !== "Theatrical";

  const digitalMetrics = useMemo(() => {
    const dm = digitalModel;
    // baseReach: if subscribers provided use 30% view rate, else use defaultReach
    const baseReach = dm.subscribers > 0 ? dm.subscribers * 0.3 : dm.defaultReach;
    // views boosted by virality (viralityScore 0-10)
    const estimatedViews = baseReach * (1 + dm.viralityScore / 10);
    // revenue in ₹ = (views / 1000) × CPM
    const estimatedRevenueINR = (estimatedViews / 1000) * dm.cpm;
    // convert to ₹ Cr for consistency with the rest of the system
    const estimatedRevenueCr = estimatedRevenueINR / 1_00_00_000;
    return { estimatedViews, estimatedRevenueCr };
  }, [digitalModel]);

  const expenseColumnTotals = useMemo(() => categoryColumnTotals(budgetMatrix), [budgetMatrix]);

  const inputValidation = useMemo(() => validateFinanceInputs(revenue), [revenue]);

  // ── Decision + Insights ─────────────────────────────────────────────────────
  const decision = useMemo(() => computeDecision({
    npv:             metrics.npv,
    irr:             metrics.irr,
    requiredReturn:  npvConfig.requiredReturn,
    roi:             metrics.roi,
    efficiencyRatio: metrics.efficiencyRatio,
  }), [metrics, npvConfig.requiredReturn]);

  const proj0   = projections.projectedCollections[0] ?? 0;
  const insights = useMemo(() => generateInsights({
    npv:              metrics.npv,
    irr:              metrics.irr,
    requiredReturn:   npvConfig.requiredReturn,
    roi:              metrics.roi,
    efficiencyRatio:  metrics.efficiencyRatio,
    openingWeekend:   proj0 * 0.35,
    projected:        proj0,
    week1:            proj0 * 0.65,
    breakEven:           metrics.breakEven,
    totalBudgetRevenue:  metrics.totalBudgetRevenue,
    totalCollections:    revenue.totalCollections,
  }), [metrics, npvConfig.requiredReturn, proj0, revenue.totalCollections]);

  // ── Period-adjusted NPV & IRR ──────────────────────────────────────────────
  const PERIOD_DIVISOR = { year: 1, month: 12, week: 52 } as const;
  const PERIOD_LABEL   = { year: "Year",  month: "Month",  week: "Week"  } as const;

  const periodRate = useMemo(() => {
    const annual = npvConfig.discountRate / 100;
    if (cashFlowPeriod === "year")  return annual;
    if (cashFlowPeriod === "month") return Math.pow(1 + annual, 1 / 12) - 1;
    return Math.pow(1 + annual, 1 / 52) - 1;
  }, [npvConfig.discountRate, cashFlowPeriod]);

  const periodNpv = useMemo(() =>
    npvConfig.cashFlows.reduce(
      (acc, cf, i) => acc + cf / Math.pow(1 + periodRate, i + 1),
      -metrics.totalActualInvestment,
    )
  , [npvConfig.cashFlows, periodRate, metrics.totalActualInvestment]);

  const periodIrr = useMemo(() => {
    const cfs = [-metrics.totalActualInvestment, ...npvConfig.cashFlows];
    if (!cfs.some((c) => c < 0) || !cfs.some((c) => c > 0)) return null;
    let rate = 0.1 / PERIOD_DIVISOR[cashFlowPeriod];
    for (let iter = 0; iter < 250; iter++) {
      let npv = 0, deriv = 0;
      for (let i = 0; i < cfs.length; i++) {
        const denom = Math.pow(1 + rate, i);
        npv += cfs[i] / denom;
        if (i > 0) deriv -= (i * cfs[i]) / (denom * (1 + rate));
      }
      if (Math.abs(deriv) < 1e-12) return null;
      const next = rate - npv / deriv;
      if (Math.abs(next - rate) < 1e-7) {
        return (Math.pow(1 + next, PERIOD_DIVISOR[cashFlowPeriod]) - 1) * 100;
      }
      rate = next;
      if (rate <= -0.99 || rate > 100) return null;
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npvConfig.cashFlows, metrics.totalActualInvestment, cashFlowPeriod]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalTerritory = territoryTotal(territory.entries);
  const territoryLeft  = territoryRemaining(territory.entries, revenue.totalCollections);
  const territoryOver  = revenue.totalCollections > 0 && totalTerritory > revenue.totalCollections;

  const revPctError = revenueSplitPercentInvalid(revenue);

  const breakEvenGap = metrics.breakEven - proj0;
  const breakEvenMet = proj0 >= metrics.breakEven;

  const budgetPie = (["preProduction", "production", "postProduction", "contingency"] as PhaseKey[]).map((k) => ({
    name: PHASE_LABEL[k],
    value: metrics[k],
  }));
  const revenuePie = (["exhibitor","distributor","investor","pa"] as SplitKey[]).map((k) => ({
    name:  SPLIT_LABEL[k],
    value: metrics[`${k === "pa" ? "pa" : k}Share` as keyof typeof metrics] as number,
  }));

  const timeline = useMemo(() => {
    const n = projections.periodCount;
    const pt = projections.periodType;
    const prefix = CHART_PERIOD_PREFIX[pt];
    let cum = 0;
    let breakEvenX: string | null = null;
    const rows = Array.from({ length: n }, (_, i) => {
      const proj = projections.projectedCollections[i] ?? 0;
      cum += proj;
      const period = `${prefix}${i + 1}`;
      if (breakEvenX == null && metrics.breakEven > 0 && cum >= metrics.breakEven) {
        breakEvenX = period;
      }
      return {
        period,
        Budget: n > 0 ? metrics.totalBudget / n : 0,
        Projection: proj,
        Actual: n > 0 ? metrics.totalActuals / n : 0,
        cumulativeProjection: cum,
      };
    });
    return { rows, breakEvenX };
  }, [
    projections.periodCount,
    projections.periodType,
    projections.projectedCollections,
    metrics.totalBudget,
    metrics.totalActuals,
    metrics.breakEven,
  ]);

  const yMax =
    Math.max(
      metrics.totalBudget,
      metrics.totalActuals,
      ...projections.projectedCollections,
      metrics.breakEven,
      1,
    ) * 1.1;

  const totalProjectedRevenue = useMemo(
    () => projections.projectedCollections.reduce((s, v) => s + v, 0),
    [projections.projectedCollections],
  );

  /** P&L comparison data — 5 single-value bars, no period breakdown */
  const plData = useMemo(() => [
    { name: "Budget Revenue",    value: metrics.totalBudgetRevenue,     fill: C.green,  desc: "Top-line budgeted revenue target (input)" },
    { name: "Projected Revenue", value: totalProjectedRevenue,          fill: C.cyan,   desc: "Sum of all period revenue projections" },
    { name: "Collections",       value: revenue.totalCollections,       fill: C.blue,   desc: "Gross box-office + OTT + satellite collections" },
    { name: "Budget Expenses",   value: metrics.totalBudgetedExpenses,  fill: C.orange, desc: "Total planned expenses (sum of all budget cells)" },
    { name: "Actual Expenses",   value: metrics.totalActualInvestment,  fill: C.red,    desc: "Total actual expenses — break-even & ROI denominator" },
  ], [metrics, totalProjectedRevenue, revenue.totalCollections]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCsvUpload = useCallback(() => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".csv";
    inp.onchange = async () => {
      const file = inp.files?.[0]; if (!file) return;
      const { rows, errors } = parseTerritoryCsv(await file.text());
      setCsvErrors(errors);
      if (rows.length > 0) importTerritoryRows(rows);
    };
    inp.click();
  }, [importTerritoryRows]);

  const autoBalanceTerritory = useCallback(() => {
    if (revenue.totalCollections <= 0 || totalTerritory <= 0) return;
    const factor = revenue.totalCollections / totalTerritory;
    importTerritoryRows(
      territory.entries.map((r) => ({ ...r, value: +(r.value * factor).toFixed(2) })),
    );
    setAutoBalMsg("Values proportionally scaled to match Total Collections.");
    setTimeout(() => setAutoBalMsg(""), 4000);
  }, [revenue.totalCollections, totalTerritory, territory.entries, importTerritoryRows]);

  const handleGenerateTerritoryVisualization = useCallback(() => {
    const zoneMap = new Map<string, number>();
    const platformMap = new Map<string, number>();

    territory.entries
      .filter((entry) => entry.value > 0)
      .forEach((entry) => {
        const zoneKey = entry.zone.trim() || "Unspecified";
        zoneMap.set(zoneKey, (zoneMap.get(zoneKey) ?? 0) + entry.value);

        const platformKey = entry.platform.trim() || "Unspecified";
        platformMap.set(platformKey, (platformMap.get(platformKey) ?? 0) + entry.value);
      });

    const zoneData = Array.from(zoneMap, ([name, value]) => ({ name, value }));
    const platformData = Array.from(platformMap, ([name, value]) => ({ name, value }));

    setTerritoryZoneVizData(zoneData);
    setTerritoryPlatformVizData(platformData);
    setTerritoryVizRequested(true);
  }, [territory.entries]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFinancialData({
        budgetMatrix,
        breakEvenMode,
        breakEvenManual,
        revenue,
        npvConfig,
        territory,
        projections,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async () => {
    const p = await getFinancialData();
    if (p) importTerritoryRows(p.territory.entries);
  };

  const effColor =
    metrics.efficiencyRatio < 2 ? C.red :
    metrics.efficiencyRatio <= 3 ? C.gold : C.green;

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background:`${C.blue}18`, border:`1px solid ${C.blue}30` }}>
            <Film className="w-5 h-5" style={{ color: C.blue }} />
          </div>
          <div>
            <h1 className="text-lg font-black text-text-primary">Finance Studio</h1>
            <p className="text-[11px] text-text-muted">Studio-grade film financial modelling</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset}><RefreshCcw className="w-3.5 h-3.5 mr-1.5"/>Reset</Button>
          <Button variant="secondary" size="sm" onClick={handleLoad}>Load model</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-3.5 h-3.5 mr-1.5"/>{saving ? "Saving…" : "Save model"}
          </Button>
        </div>
      </motion.div>

      {/* ── Input section (normal flow — report mounts below when generated) ── */}
      <section
        className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden"
        aria-labelledby="financial-inputs-heading"
      >
        {/* Section header — always visible */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5">
            <div className="flex items-start gap-2 min-w-0">
              {/* Collapse toggle */}
              <button
                type="button"
                aria-label={inputsCollapsed ? "Expand financial inputs" : "Collapse financial inputs"}
                onClick={() => setInputsCollapsed(c => !c)}
                className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                {inputsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <div className="min-w-0">
                <h2 id="financial-inputs-heading" className="text-sm font-black text-text-primary flex items-center gap-1.5">
                  Financial inputs
                  {inputsCollapsed && reportGenerated && (
                    <span className="text-[10px] font-normal text-text-muted bg-surface-2 px-1.5 py-0.5 rounded-full border border-border/60">
                      collapsed — click to edit
                    </span>
                  )}
                </h2>
                <p className="text-[10px] text-text-muted">P&L inputs: expense matrix (₹ Cr), total budget revenue, collections, period settings, NPV cash flows, and revenue split.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={loadDemoValues}>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Load demo
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { resetInputs(); setInputsCollapsed(false); }}>
                <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />Reset
              </Button>
              <GenerateButton
                payload={{
                  budgetMatrix,
                  breakEvenMode,
                  breakEvenManual,
                  revenue,
                  npvConfig,
                  territory,
                  projections,
                }}
              />
            </div>
          </div>

          {/* Collapsible body */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${inputsCollapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[9999px] opacity-100"}`}
          >
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-5">

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[900px] text-xs border-collapse">
              <thead>
                <tr className="bg-surface-2/80">
                  <th className="text-left p-2 font-bold text-text-muted border-b border-border/60 w-28">Phase</th>
                  {BUDGET_CATEGORIES.map((cat) => (
                    <th key={cat} colSpan={2} className="p-2 text-center font-bold text-text-primary border-b border-border/60 border-l border-border/40">
                      {CATEGORY_LABEL[cat]}
                    </th>
                  ))}
                  <th colSpan={2} className="p-2 text-center font-bold text-text-primary border-b border-border/60 border-l border-border/50 bg-surface-2/90">
                    Row totals
                  </th>
                </tr>
                <tr className="bg-surface-2/50 text-[10px] text-text-muted uppercase tracking-wide">
                  <th className="p-1.5 border-b border-border/60" />
                  {BUDGET_CATEGORIES.map((cat) => (
                    <React.Fragment key={`h-${cat}`}>
                      <th className="p-1.5 text-center border-b border-border/60 border-l border-border/40">Budget</th>
                      <th className="p-1.5 text-center border-b border-border/60">Actual</th>
                    </React.Fragment>
                  ))}
                  <th className="p-1.5 text-center border-b border-border/60 border-l border-border/50 font-bold text-text-secondary">Σ Budget</th>
                  <th className="p-1.5 text-center border-b border-border/60 font-bold text-text-secondary">Σ Actual</th>
                </tr>
              </thead>
              <tbody>
                {(["preProduction", "production", "postProduction", "contingency"] as PhaseKey[]).map((phase) => {
                  const rowTot = phaseRowTotals(budgetMatrix, phase);
                  return (
                  <tr key={phase} className="border-b border-border/40">
                    <td className="p-2 font-semibold text-text-secondary whitespace-nowrap" style={{ color: PHASE_COLOR[phase] }}>
                      {PHASE_LABEL[phase]}
                    </td>
                    {BUDGET_CATEGORIES.map((cat) => {
                      const cell = budgetMatrix[phase][cat];
                      return (
                        <React.Fragment key={`${phase}-${cat}`}>
                          <td className="p-1 border-l border-border/30">
                            <MatrixNumInput
                              aria-label={`${PHASE_LABEL[phase]} ${CATEGORY_LABEL[cat]} budget`}
                              value={cell.budget}
                              onChange={(n) => setMatrixCell(phase, cat, "budget", n)}
                            />
                          </td>
                          <td className="p-1">
                            <MatrixNumInput
                              aria-label={`${PHASE_LABEL[phase]} ${CATEGORY_LABEL[cat]} actual`}
                              value={cell.actual}
                              onChange={(n) => setMatrixCell(phase, cat, "actual", n)}
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="border-l border-border/50 bg-surface-2/40 p-2 align-middle">
                      <div className="flex min-h-8 items-center justify-end font-bold tabular-nums text-text-primary">
                        {round2Cr(rowTot.budget)}
                      </div>
                    </td>
                    <td className="bg-surface-2/40 p-2 align-middle">
                      <div className="flex min-h-8 items-center justify-end font-bold tabular-nums text-text-primary">
                        {round2Cr(rowTot.actual)}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/60 bg-surface-2/70">
                  <td className="p-2 align-middle font-bold text-text-secondary whitespace-nowrap">
                    Column total
                  </td>
                  {BUDGET_CATEGORIES.map((cat) => {
                    const col = expenseColumnTotals[cat];
                    return (
                      <React.Fragment key={`foot-${cat}`}>
                        <td className="p-1 border-l border-border/30 align-middle">
                          <MatrixCellTotal value={col.budget} />
                        </td>
                        <td className="p-1 align-middle">
                          <MatrixCellTotal value={col.actual} />
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="border-l border-border/50 bg-surface-2/50 p-2 align-middle">
                    <div className="flex min-h-8 items-center justify-end font-black tabular-nums text-accent">
                      {round2Cr(metrics.totalBudgetedExpenses)}
                    </div>
                  </td>
                  <td className="bg-surface-2/50 p-2 align-middle">
                    <div className="flex min-h-8 items-center justify-end font-black tabular-nums text-accent">
                      {round2Cr(metrics.totalActualInvestment)}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Summary pills ─────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 text-[11px]">
            <div className="rounded-xl border border-border/60 px-3 py-2 bg-surface-2/60"
              title="Sum of all budget cells in the expense matrix (planned outlay)">
              <span className="text-text-muted font-bold uppercase tracking-wide">Total Budget Expenses</span>
              <span className="ml-2 font-black text-text-primary tabular-nums">{fmt(metrics.totalBudgetedExpenses)}</span>
            </div>
            <div className="rounded-xl border border-border/60 px-3 py-2 bg-surface-2/60"
              title="Sum of all actual cells in the expense matrix (capital deployed)">
              <span className="text-text-muted font-bold uppercase tracking-wide">Total Actual Expenses</span>
              <span className="ml-2 font-black text-text-primary tabular-nums">{fmt(metrics.totalActualInvestment)}</span>
            </div>
            <div className="rounded-xl border border-border/60 px-3 py-2 bg-surface-2/60 flex items-center gap-2"
              title="Net Revenue = Total Budget Revenue − Total Actual Expenses">
              <span className="text-text-muted font-bold uppercase tracking-wide">Net Revenue (computed)</span>
              <span className="font-black tabular-nums" style={{ color: metrics.netRevenue >= 0 ? "#22C55E" : "#EF4444" }}>{fmtSigned(metrics.netRevenue)}</span>
              {metrics.netRevenue > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-green-500/15 text-green-400 border border-green-500/25">Profit</span>
              )}
              {metrics.netRevenue < 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-red-500/15 text-red-400 border border-red-500/25">Loss</span>
              )}
            </div>
          </div>

          {/* ── Period settings ───────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              Period Settings
              <span title="Controls the time granularity used for break-even timeline and projection inputs" className="cursor-help opacity-50 hover:opacity-100">
                <Info className="w-3 h-3" />
              </span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                  Period type
                  <span title="Weekly: up to 52 periods · Monthly: up to 60 · Yearly: up to 20" className="cursor-help opacity-50 hover:opacity-100"><Info className="w-3 h-3" /></span>
                </label>
                <select
                  value={projections.periodType}
                  onChange={(e) => setProjectionPeriodType(e.target.value as typeof projections.periodType)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-surface-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                  Period count
                  <span title="Number of time periods for break-even analysis and revenue projection" className="cursor-help opacity-50 hover:opacity-100"><Info className="w-3 h-3" /></span>
                </label>
                <input
                  type="number" min={1} step={1}
                  value={periodCountStr}
                  onChange={(e) => setPeriodCountStr(e.target.value)}
                  onBlur={() => {
                    const raw = Number(periodCountStr) || 1;
                    const n = clampPeriodCount(projections.periodType, raw);
                    setPeriodCount(n);
                    setPeriodCountStr(String(n));
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-surface-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
              </div>
            </div>
          </div>

          {/* ── Release Platform ─────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              Release Platform
              <span title="Controls whether to model theatrical collections or compute digital revenue from views & CPM." className="cursor-help opacity-50 hover:opacity-100"><Info className="w-3 h-3" /></span>
            </p>
            <div className="flex flex-wrap gap-2">
              {RELEASE_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReleasePlatform(p)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                    releasePlatform === p
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-border text-text-muted hover:border-accent/30 hover:text-text-secondary",
                  )}
                >
                  {RELEASE_PLATFORM_LABEL[p]}
                </button>
              ))}
            </div>
            {isDigital && (
              <div className="p-3 rounded-xl border border-accent/20 bg-accent/5 text-[11px] text-text-muted flex items-center gap-2">
                <MonitorPlay className="w-3.5 h-3.5 text-accent shrink-0" />
                Digital mode active — Collections replaced by Estimated Views & Revenue. Configure the digital model below.
              </div>
            )}
          </div>

          {/* ── Digital Release Model ────────────────────────────────── */}
          {isDigital && (
            <div className="space-y-3 rounded-xl border border-accent/15 bg-accent/4 p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent/80 flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5" />
                Digital Release Model
                <span title="views = baseReach × (1 + viralityScore/10) · revenue = (views/1000) × CPM" className="cursor-help opacity-50 hover:opacity-100"><Info className="w-3 h-3" /></span>
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <NumField
                  label="Subscribers / Followers"
                  value={digitalModel.subscribers}
                  onChange={(n) => setDigitalModel({ subscribers: n })}
                  suffix="raw"
                  tooltip="Total subscriber or follower count. 30% view rate applied. Leave 0 to use Default Reach instead."
                />
                <NumField
                  label="Default Reach (views)"
                  value={digitalModel.defaultReach}
                  onChange={(n) => setDigitalModel({ defaultReach: n })}
                  suffix="views"
                  tooltip="Base view estimate when no subscriber count is provided. e.g. 10 000 000 = 1 Cr views."
                />
                <NumField
                  label="Virality Score (0–10)"
                  value={digitalModel.viralityScore}
                  onChange={(n) => setDigitalModel({ viralityScore: Math.min(10, Math.max(0, n)) })}
                  suffix="/10"
                  tooltip="Viral amplification. 0 = no boost; 10 = 100% extra views. Formula: views × (1 + score/10)."
                />
                <NumField
                  label="Engagement Rate (%)"
                  value={digitalModel.engagementRate}
                  onChange={(n) => setDigitalModel({ engagementRate: n })}
                  suffix="%"
                  tooltip="Likes + comments + shares ÷ impressions × 100. Shown as a KPI in the report."
                />
                <NumField
                  label="CPM (₹ / 1 000 views)"
                  value={digitalModel.cpm}
                  onChange={(n) => setDigitalModel({ cpm: n })}
                  suffix="₹"
                  tooltip="Cost per mille — revenue earned per 1 000 views. Default ₹100. Drives estimated revenue."
                />
              </div>
              {/* Live preview */}
              <div className="flex flex-wrap gap-3 pt-1 border-t border-border/30">
                {[
                  { label: "Est. Views",   value: fmtViews(digitalMetrics.estimatedViews),                      color: C.cyan   },
                  { label: "Est. Revenue", value: fmt(digitalMetrics.estimatedRevenueCr),                       color: C.green  },
                  { label: "Engagement",  value: `${digitalModel.engagementRate.toFixed(1)} %`,                 color: C.purple },
                  { label: "Base Reach",  value: fmtViews(digitalModel.subscribers > 0 ? digitalModel.subscribers * 0.3 : digitalModel.defaultReach), color: C.gold },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg border px-3 py-1.5 text-center min-w-[100px]"
                    style={{ borderColor: `${color}25`, background: `${color}08` }}>
                    <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{label}</div>
                    <div className="text-sm font-black tabular-nums text-text-primary">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Revenue + NPV rate inputs ─────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Revenue &amp; discount inputs</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <NumField
                label="Total budget revenue (₹ Cr)"
                value={revenue.totalBudgetRevenue}
                onChange={setTotalBudgetRevenue}
                suffix="Cr"
                tooltip="Primary P&L input: top-line revenue target. Drives Net Revenue, ROI, and efficiency ratio."
              />
              {/* Collections: theatrical only — replaced by digital model when isDigital */}
              {!isDigital ? (
                <NumField
                  label="Total collections (₹ Cr)"
                  value={revenue.totalCollections}
                  onChange={setRevenueTotalCollections}
                  suffix="Cr"
                  tooltip="Gross box-office + OTT + satellite collections across all platforms and windows."
                />
              ) : (
                <NumField
                  label="Est. Revenue (₹ Cr) — computed"
                  value={digitalMetrics.estimatedRevenueCr}
                  readOnly
                  suffix="Cr"
                  tooltip="Computed from Subscribers/Reach × Virality × CPM. Edit digital model above to change."
                />
              )}
              <NumField
                label="Discount rate (%)"
                value={npvConfig.discountRate}
                onChange={(n) => setNPVConfig({ discountRate: n })}
                suffix="%"
                tooltip="Annual discount rate used for NPV calculation. Represents the opportunity cost of capital (e.g. 10–15% for film projects)."
              />
              <NumField
                label="Required return (%)"
                value={npvConfig.requiredReturn}
                onChange={(n) => setNPVConfig({ requiredReturn: n })}
                suffix="%"
                tooltip="Minimum acceptable IRR (hurdle rate). Accept the project only if IRR exceeds this value."
              />
            </div>
          </div>

          {/* ── NPV Cash Flows ────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                NPV Cash Flows
                <span title="Projected net cash inflows per period. Used alongside the discount rate to compute NPV and IRR." className="cursor-help opacity-50 hover:opacity-100"><Info className="w-3 h-3" /></span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted">Period:</span>
                <select
                  value={cashFlowPeriod}
                  onChange={(e) => setCashFlowPeriod(e.target.value as "year" | "month" | "week")}
                  className="h-8 px-3 rounded-xl border border-border bg-surface-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                >
                  <option value="year">Yearly</option>
                  <option value="month">Monthly</option>
                  <option value="week">Weekly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {npvConfig.cashFlows.map((cf, i) => (
                <NumField key={i} label={`${PERIOD_LABEL[cashFlowPeriod]} ${i + 1} (₹ Cr)`} value={cf} onChange={(n) => setCashFlow(i, n)} suffix="Cr"
                  tooltip={`Cash inflow in ${PERIOD_LABEL[cashFlowPeriod]} ${i + 1}. These are post-expense net inflows used to compute NPV and IRR.`} />
              ))}
            </div>
            {cashFlowPeriod !== "year" && (
              <p className="text-[10px] text-text-muted flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-border/50">
                <Info className="w-3 h-3 shrink-0 text-accent" />
                Annual discount rate <strong className="text-text-primary mx-1">{fmtPct(npvConfig.discountRate)}</strong>
                auto-converted to {cashFlowPeriod}ly rate for NPV/IRR. IRR shown annualised.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Revenue split</p>
            <div className="flex items-center gap-2 flex-wrap">
              {(["percent", "amount"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRevenueMode(m)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-xs font-bold border transition-all",
                    revenue.mode === m
                      ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                      : "border-border text-text-muted",
                  )}
                >
                  {m === "percent" ? (
                    <>
                      <Percent className="w-3 h-3 inline mr-1" />
                      Percent
                    </>
                  ) : (
                    "₹ Amount"
                  )}
                </button>
              ))}
              <span className="text-[10px] text-text-muted">P&amp;A auto-filled as remainder · amounts sync with %</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(["exhibitor", "distributor", "investor"] as SplitKey[]).map((key) => (
                <NumField
                  key={key}
                  label={SPLIT_LABEL[key]}
                  value={revenue.mode === "percent" ? revenue.percent[key] : revenue.amount[key]}
                  onChange={(n) => setRevenueSplit(key, n)}
                  suffix={revenue.mode === "percent" ? "%" : "Cr"}
                  error={revPctError && key === "investor" ? "Split > 100 %" : undefined}
                />
              ))}
              <NumField
                label="P&A (auto)"
                value={revenue.mode === "percent" ? revenue.percent.pa : revenue.amount.pa}
                suffix={revenue.mode === "percent" ? "%" : "Cr"}
                readOnly
                tooltip="Remainder so totals stay coherent"
              />
            </div>
            {revPctError && (
              <ErrBanner
                msg={`Exhibitor + Distributor + Investor = ${fmtPct(
                  revenue.percent.exhibitor + revenue.percent.distributor + revenue.percent.investor,
                )} — exceeds 100 %. Lower a split or switch to amount mode.`}
              />
            )}
            {!inputValidation.ok && !revPctError && inputValidation.errors[0] && (
              <ErrBanner msg={inputValidation.errors[0]} />
            )}
            {generateErrors.map((msg, i) => (
              <ErrBanner key={i} msg={msg} />
            ))}
          </div>
          </div>{/* end collapsible body */}
          </div>{/* end collapsible wrapper */}
      </section>

      {!reportGenerated && (
        <p className="text-center text-sm text-text-muted py-6">
          Fill the matrix and revenue split, then click <strong className="text-text-primary">Generate Report</strong> above to unlock the full analysis.
        </p>
      )}

      {reportGenerated && (
        <div
          id="financial-report"
          ref={reportRef}
          className="mt-10 space-y-8 scroll-mt-24"
        >
      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 overflow-x-auto">
        <KpiChip label="Budget Revenue"   value={fmt(metrics.totalBudgetRevenue)} color={C.blue}   icon={TrendingUp}
          tooltip="Primary P&L input: top-line budgeted revenue target before any expenses." />
        <KpiChip label="Budget Expenses"  value={fmt(metrics.totalBudgetedExpenses)} color={C.purple} icon={Layers}
          tooltip="Total Budget Expenses = sum of all budget cells across the expense matrix." />
        <KpiChip label="Actual Expenses"  value={fmt(metrics.totalActualInvestment)} color={C.orange} icon={BarChart3}
          tooltip="Total Actual Expenses = sum of all actual cells. Used as denominator for ROI and break-even." />

        {/* Collections (theatrical) ↔ Digital KPIs — mutually exclusive */}
        {!isDigital ? (
          <KpiChip label="Collections"    value={fmt(revenue.totalCollections)} color={C.cyan} icon={TrendingUp}
            tooltip="Gross box-office + OTT + satellite collections across all platforms." />
        ) : (
          <>
            <KpiChip label="Est. Views"     value={fmtViews(digitalMetrics.estimatedViews)}      color={C.cyan}   icon={Eye}
              tooltip={`Estimated total views. Formula: baseReach × (1 + viralityScore/10). Virality: ${digitalModel.viralityScore}/10.`} />
            <KpiChip label="Digital Revenue" value={fmt(digitalMetrics.estimatedRevenueCr)}       color={C.green}  icon={Wifi}
              tooltip={`Est. Revenue (₹ Cr) = (views ÷ 1 000) × CPM (₹${digitalModel.cpm}). Converted from ₹ to Cr.`} />
            <KpiChip label="Engagement"     value={`${digitalModel.engagementRate.toFixed(1)} %`} color={C.purple} icon={PlayCircle}
              tooltip="Engagement Rate = (likes + comments + shares) ÷ impressions × 100. Set in digital model inputs." />
          </>
        )}

        <KpiChip
          label="Net Revenue"
          value={fmtSigned(metrics.netRevenue)}
          color={metrics.netRevenue > 0 ? C.green : metrics.netRevenue < 0 ? C.red : C.muted}
          icon={DollarSign}
          sub={metrics.netRevenue > 0 ? "▲ Profit" : metrics.netRevenue < 0 ? "▼ Loss" : "Break-even"}
          tooltip="Net Revenue = Total Budget Revenue − Total Actual Expenses. Positive = profit, negative = loss."
        />
        <KpiChip
          label="ROI"
          value={metrics.totalActualInvestment === 0 ? "N/A" : fmtPct(metrics.roi)}
          color={metrics.totalActualInvestment === 0 ? C.muted : metrics.roi>=0?C.green:C.red}
          icon={metrics.roi>=0?TrendingUp:TrendingDown}
          tooltip={
            metrics.totalActualInvestment === 0
              ? "ROI not defined when actual expenses are zero. Enter actual expense values in the matrix to compute ROI."
              : "ROI % = (Net Revenue ÷ Total Actual Expenses) × 100. Measures return on capital deployed."
          }
        />
        <KpiChip label="Break-even"       value={fmt(metrics.breakEven)}        color={C.gold}   icon={Target}
          sub={
            timeline.breakEvenX
              ? `✓ Met by ${timeline.breakEvenX}`
              : metrics.breakEven === 0
              ? "Set actual expenses to calculate"
              : `Not met in ${projections.periodCount} periods`
          }
          tooltip="Break-even = Total Actual Expenses. Point where cumulative projected revenue equals total investment." />
        {!isDigital && (
          <KpiChip
            label="Mktg Efficiency"
            value={metrics.totalMarketingBudget === 0 ? "N/A" : fmtX(metrics.efficiencyRatio)}
            color={metrics.totalMarketingBudget === 0 ? C.muted : effColor}
            icon={Gauge}
            sub={metrics.totalMarketingBudget === 0 ? "No marketing spend" : metrics.efficiencyLabel}
            tooltip={
              metrics.totalMarketingBudget === 0
                ? "Efficiency not available (no marketing spend). Enter a marketing budget in the expense matrix."
                : "Marketing Efficiency = Budget Revenue ÷ Marketing Expense. >3× = highly efficient, 2–3× = average, <2× = over-spending."
            }
          />
        )}
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. PROJECTION ENGINE                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="projection" title="Projection Engine" accent={C.gold} icon={Landmark}
        description="Hybrid: 60 % weighted factors + 40 % similarity-weighted dataset. Fully deterministic.">
        <ProjectionPanel budgetSeed={metrics.totalBudgetedExpenses} hideHeader />
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* DIGITAL RELEASE MODEL (shown only when not Theatrical)            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isDigital && (
        <SCard id="digital" title="Digital Release Model" accent={C.cyan} icon={MonitorPlay}
          description={`Platform: ${RELEASE_PLATFORM_LABEL[releasePlatform]} · views = baseReach × (1 + virality/10) · revenue = (views ÷ 1 000) × CPM`}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricBox
              label="Estimated Views"
              value={fmtViews(digitalMetrics.estimatedViews)}
              color={C.cyan}
              icon={Eye}
              guidance={`Base reach: ${fmtViews(digitalModel.subscribers > 0 ? digitalModel.subscribers * 0.3 : digitalModel.defaultReach)} · Virality boost: +${(digitalModel.viralityScore * 10).toFixed(0)}%`}
              tooltip="Estimated total content views after virality amplification. Formula: baseReach × (1 + viralityScore/10)."
            />
            <MetricBox
              label="Estimated Revenue (₹ Cr)"
              value={fmt(digitalMetrics.estimatedRevenueCr)}
              color={C.green}
              icon={Wifi}
              guidance={`CPM ₹${digitalModel.cpm} · (views ÷ 1 000) × CPM converted to Cr`}
              tooltip="Revenue = (estimatedViews / 1000) × CPM (₹). Converted to ₹ Crores for P&L consistency."
            />
            <MetricBox
              label="Engagement Rate"
              value={`${digitalModel.engagementRate.toFixed(1)} %`}
              color={C.purple}
              icon={PlayCircle}
              guidance={
                digitalModel.engagementRate > 6 ? "Viral — exceptionally high" :
                digitalModel.engagementRate > 3 ? "Strong — above average" :
                digitalModel.engagementRate > 1 ? "Average — typical range" :
                "Below average — consider boosting"
              }
              tooltip="Engagement Rate = interactions ÷ impressions × 100. Indicator of content quality and audience resonance."
            />
          </div>

          {/* Formula breakdown */}
          <div className="rounded-xl border border-border/50 bg-surface-2/40 p-4 space-y-3 text-xs">
            <p className="font-bold text-text-secondary text-[11px] uppercase tracking-widest">Calculation Breakdown</p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-text-muted font-mono">
              <div className="flex justify-between">
                <span>Subscribers / Followers</span>
                <span className="text-text-primary font-bold">{fmtViews(digitalModel.subscribers)}</span>
              </div>
              <div className="flex justify-between">
                <span>View Rate (subs × 30%)</span>
                <span className="text-text-primary font-bold">
                  {digitalModel.subscribers > 0 ? fmtViews(digitalModel.subscribers * 0.3) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Default Reach (fallback)</span>
                <span className="text-text-primary font-bold">{fmtViews(digitalModel.defaultReach)}</span>
              </div>
              <div className="flex justify-between">
                <span>Base Reach (used)</span>
                <span className="text-cyan-400 font-bold">
                  {fmtViews(digitalModel.subscribers > 0 ? digitalModel.subscribers * 0.3 : digitalModel.defaultReach)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Virality multiplier</span>
                <span className="text-text-primary font-bold">× {(1 + digitalModel.viralityScore / 10).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CPM</span>
                <span className="text-text-primary font-bold">₹{digitalModel.cpm} / 1K views</span>
              </div>
              <div className="flex justify-between font-bold text-text-primary border-t border-border/40 pt-2">
                <span>→ Estimated Views</span>
                <span className="text-cyan-400">{fmtViews(digitalMetrics.estimatedViews)}</span>
              </div>
              <div className="flex justify-between font-bold text-text-primary border-t border-border/40 pt-2">
                <span>→ Revenue (₹ Cr)</span>
                <span className="text-green-400">{fmt(digitalMetrics.estimatedRevenueCr)}</span>
              </div>
            </div>
          </div>
        </SCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. BREAK-EVEN                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="breakeven" title="Break-even Analysis" accent={C.gold} icon={Target}
        description="Break-even = Total Actual Expenses. Tracks when cumulative projected revenue first equals or exceeds this threshold.">
        <div className="grid sm:grid-cols-3 gap-4 items-start">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1">
              Mode
              <span title="Auto: break-even = total actual expenses (from matrix). Manual: enter a custom target." className="cursor-help opacity-50 hover:opacity-100"><Info className="w-3 h-3" /></span>
            </p>
            <div className="flex gap-2">
              {(["auto","manual"] as BreakEvenMode[]).map((m) => (
                <button key={m} onClick={() => setBreakEvenMode(m)}
                  className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize",
                    breakEvenMode===m ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-border text-text-muted")}>
                  {m==="auto" ? <><ToggleLeft className="w-3 h-3 inline mr-1"/>Auto</> : <><ToggleRight className="w-3 h-3 inline mr-1"/>Manual</>}
                </button>
              ))}
            </div>
          </div>
          {breakEvenMode==="manual"
            ? <NumField label="Break-even target (manual)" value={breakEvenManual} onChange={setBreakEvenManual} suffix="Cr"
                tooltip="Enter a custom break-even threshold in ₹ Cr. Leave on Auto to use total actual expenses." />
            : <NumField label="Break-even (= actual expenses)" value={metrics.breakEven} readOnly suffix="Cr"
                tooltip="Auto-computed: Break-even = Total Actual Expenses (sum of all actual cells in the matrix)." />}
          <NumField label={`${CHART_PERIOD_PREFIX[projections.periodType]}1 projection (${CHART_PERIOD_LABEL[projections.periodType]})`}
            value={proj0} onChange={(n)=>setProjectedValue(0,n)} suffix="Cr"
            tooltip="Projected revenue for the first period. Used to compare against break-even threshold." />
        </div>

        {/* Period projection inputs */}
        {projections.periodCount > 1 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
              {CHART_PERIOD_LABEL[projections.periodType]} projections ({projections.periodCount} periods)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: projections.periodCount }, (_, i) => (
                <NumField key={i}
                  label={`${CHART_PERIOD_PREFIX[projections.periodType]}${i + 1}`}
                  value={projections.projectedCollections[i] ?? 0}
                  onChange={(n) => setProjectedValue(i, n)} suffix="Cr"
                  tooltip={`Projected revenue for ${CHART_PERIOD_LABEL[projections.periodType]} ${i + 1}. Cumulative sum is compared against break-even.`} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-text-muted">Cumulative projection vs break-even</span>
            <span className={breakEvenMet ? "text-green-400" : "text-red-400"}>
              {breakEvenMet ? `+${fmt(Math.abs(breakEvenGap))} surplus` : `-${fmt(Math.abs(breakEvenGap))} shortfall`}
            </span>
          </div>
          <div className="h-3 rounded-full bg-surface-2 overflow-hidden">
            <motion.div initial={{width:0}}
              animate={{ width: metrics.breakEven>0 ? `${Math.min(100,(proj0/metrics.breakEven)*100)}%` : "0%" }}
              transition={{ duration:0.6, ease:"easeOut" }}
              className="h-full rounded-full" style={{ background: breakEvenMet?C.green:C.red }} />
          </div>
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>₹0</span><span>Break-even {fmt(metrics.breakEven)}</span>
          </div>
        </div>
        {timeline.breakEvenX
          ? <OkBanner msg={`Break-even met by projected value in ${timeline.breakEvenX} — cumulative projection clears ${fmt(metrics.breakEven)}.`} />
          : metrics.breakEven === 0
          ? <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/8 border border-yellow-500/25 text-xs text-yellow-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Break-even is ₹0.00 Cr — enter actual expenses in the matrix to set a meaningful threshold.
            </div>
          : breakEvenMet
          ? <OkBanner msg={`${CHART_PERIOD_PREFIX[projections.periodType]}1 projection (${fmt(proj0)}) meets or exceeds break-even (${fmt(metrics.breakEven)}).`} />
          : <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400">
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              Break-even not achieved within selected period — projected revenue does not reach {fmt(metrics.breakEven)} across {projections.periodCount} {CHART_PERIOD_LABEL[projections.periodType].toLowerCase()} periods.
            </div>
        }
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 5. TERRITORY (theatrical only)                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {!isDigital && <SCard id="territory" title="Territory / Region Breakdown" accent={C.purple} icon={Globe}
        description="Allocate collections by zone, state, city, platform. Total must not exceed Total Collections.">
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label:"Total Collections", value:fmt(revenue.totalCollections), color:C.blue  },
            { label:"Assigned",           value:`${fmt(totalTerritory)} (${revenue.totalCollections>0 ? fmtPct((totalTerritory/revenue.totalCollections)*100) : "0%"})`, color: territoryOver?C.red:C.cyan },
            { label:"Remaining",          value:fmt(clamp(territoryLeft)), color: territoryLeft<=0?C.gold:C.green },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-3 border border-border/50 bg-surface-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</div>
              <div className="text-base font-black mt-0.5" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {territoryOver && <ErrBanner msg={`Territory total (${fmt(totalTerritory)}) exceeds Total Collections (${fmt(revenue.totalCollections)}). Use Auto-balance to fix.`} />}
        {autoBalMsg && <OkBanner msg={autoBalMsg} />}

        <div className="space-y-2 overflow-x-auto rounded-xl">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_3rem_2.5rem] gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted px-1 pb-1">
              <span>Zone</span><span>State</span><span>City</span>
              <span>Platform</span><span>Amount (Cr)</span><span className="text-center">%</span><span/>
            </div>
            {territory.entries.map((row) => {
              const pct = revenue.totalCollections>0 ? fmtPct((row.value/revenue.totalCollections)*100) : "—";
              return (
                <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_3rem_2.5rem] gap-2 items-center mb-1.5">
                  {(["zone","state","city"] as const).map((field) => (
                    <input key={field}
                      className="h-9 px-2 rounded-xl border border-border bg-surface-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 min-w-0"
                      value={row[field]} placeholder={field.charAt(0).toUpperCase()+field.slice(1)}
                      onChange={(e) => updateTerritoryEntry(row.id, { [field]: e.target.value })} />
                  ))}
                  <select className="h-9 px-2 rounded-xl border border-border bg-surface-2 text-xs text-text-primary focus:outline-none min-w-0"
                    value={row.platform} onChange={(e) => updateTerritoryEntry(row.id, { platform: e.target.value as TerritoryEntry["platform"] })}>
                    {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input type="number" min={0} step={0.1}
                    className={cn("h-9 px-2 rounded-xl border bg-surface-2 text-xs text-text-primary focus:outline-none focus:ring-1 min-w-0",
                      territoryOver ? "border-red-500/50 focus:ring-red-500/25" : "border-border focus:ring-accent/30")}
                    value={row.value === 0 ? "" : row.value}
                    placeholder="0"
                    onChange={(e) => updateTerritoryEntry(row.id, { value: Number(e.target.value)||0 })} />
                  <span className="text-xs text-text-muted text-center tabular-nums">{pct}</span>
                  <button onClick={() => removeTerritoryEntry(row.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors mx-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="secondary" size="sm" onClick={() => addTerritoryEntry()}>
            <Plus className="w-3.5 h-3.5 mr-1.5"/>Add row
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadCsvTemplate}>
            <FileDown className="w-3.5 h-3.5 mr-1.5"/>CSV template
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCsvUpload}>
            <Upload className="w-3.5 h-3.5 mr-1.5"/>Upload CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={handleGenerateTerritoryVisualization}>
            <PieChartIcon className="w-3.5 h-3.5 mr-1.5"/>Generate Visualization
          </Button>
          {territoryOver && (
            <Button variant="ghost" size="sm" onClick={autoBalanceTerritory}
              className="border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10">
              <Zap className="w-3.5 h-3.5 mr-1.5"/>Auto-balance
            </Button>
          )}
        </div>
        {csvErrors.length > 0 && (
          <div className="space-y-1">{csvErrors.map((e,i) => <ErrBanner key={i} msg={e} />)}</div>
        )}
        {territoryVizRequested && territoryZoneVizData.length === 0 && (
          <ErrBanner msg="No chart data found. Add amounts greater than 0, then click Generate Visualization." />
        )}
        {(territoryZoneVizData.length > 0 || territoryPlatformVizData.length > 0) && (() => {
          /* Territory visualization inline IIFE — kept as-is */
          const totalViz = territoryZoneVizData.reduce((s, d) => s + d.value, 0);
          const topZone     = territoryZoneVizData.sort((a,b) => b.value - a.value)[0];
          const topPlatform = territoryPlatformVizData.sort((a,b) => b.value - a.value)[0];
          const avgZone     = territoryZoneVizData.length ? totalViz / territoryZoneVizData.length : 0;

          // Custom pie label renderer
          const renderPieLabel = ({
            cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0,
          }: {
            cx?: number; cy?: number; midAngle?: number;
            innerRadius?: number; outerRadius?: number; percent?: number; name?: string;
          }): React.ReactElement | null => {
            if (percent < 0.05) return null;
            const RADIAN = Math.PI / 180;
            const r = innerRadius + (outerRadius - innerRadius) * 0.55;
            const x = cx + r * Math.cos(-midAngle * RADIAN);
            const y = cy + r * Math.sin(-midAngle * RADIAN);
            return (
              <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
                {`${(percent * 100).toFixed(1)}%`}
              </text>
            );
          };

          // Rich tooltip for bar
          const BarTip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { pct: number } }[] }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0];
            return (
              <div className="px-3 py-2.5 rounded-xl bg-surface border border-border shadow-xl text-xs min-w-[180px]">
                <p className="font-bold text-text-primary mb-1">{p.name}</p>
                <div className="flex justify-between gap-6">
                  <span className="text-text-muted">Amount</span>
                  <span className="font-bold text-text-primary">{fmt(p.value)}</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-text-muted">Share</span>
                  <span className="font-bold" style={{ color: C.cyan }}>{p.payload.pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          };

          const barData = [...territoryZoneVizData]
            .sort((a, b) => b.value - a.value)
            .map((d, i) => ({ ...d, pct: totalViz > 0 ? (d.value / totalViz) * 100 : 0, fill: PIE_PAL[i % PIE_PAL.length] }));

          return (
            <div className="space-y-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                Territory Allocation Visualizations
              </p>

              {/* ── KPI summary strip ─────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Allocated", value: fmt(totalViz),              color: C.cyan   },
                  { label: "Top Zone",         value: topZone?.name ?? "—",      color: C.blue   },
                  { label: "Top Platform",     value: topPlatform?.name ?? "—",  color: C.purple },
                  { label: "Avg / Zone",        value: fmt(avgZone),              color: C.gold   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border p-3 text-center"
                    style={{ borderColor: `${color}25`, background: `${color}08` }}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</div>
                    <div className="text-sm font-black mt-0.5 truncate" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* ── Row 1: Donuts ─────────────────────────────────────── */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* By Zone donut */}
                {territoryZoneVizData.length > 0 && (
                  <div className="rounded-xl border border-border/50 p-4 bg-surface-2/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">By Zone</p>
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={territoryZoneVizData} dataKey="value" nameKey="name"
                            outerRadius={92} innerRadius={50} labelLine={false} label={renderPieLabel}>
                            {territoryZoneVizData.map((_, i) => (
                              <Cell key={i} fill={PIE_PAL[i % PIE_PAL.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* By Platform donut */}
                {territoryPlatformVizData.length > 0 && (
                  <div className="rounded-xl border border-border/50 p-4 bg-surface-2/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">By Platform</p>
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={territoryPlatformVizData} dataKey="value" nameKey="name"
                            outerRadius={92} innerRadius={50} labelLine={false} label={renderPieLabel}>
                            {territoryPlatformVizData.map((_, i) => (
                              <Cell key={i} fill={PIE_PAL[i % PIE_PAL.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Row 2: Horizontal bar + ranked table ─────────────── */}
              <div className="grid lg:grid-cols-2 gap-6">

                {/* Horizontal bar — zone ranking */}
                {barData.length > 0 && (
                  <div className="rounded-xl border border-border/50 p-4 bg-surface-2/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Zone Revenue Ranking</p>
                    <div style={{ height: Math.max(180, barData.length * 44) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis type="number" dataKey="value" tick={{ fontSize: 10, fill: "#9CA3AF" }}
                            tickFormatter={(v) => `₹${(v as number).toFixed(0)}`} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} width={60} />
                          <Tooltip content={<BarTip />} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                            {barData.map((d, i) => (
                              <Cell key={i} fill={d.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Ranked table with inline progress bars */}
                {barData.length > 0 && (
                  <div className="rounded-xl border border-border/50 p-4 bg-surface-2/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Zone Breakdown</p>
                    <div className="space-y-3">
                      {barData.map((d, i) => (
                        <div key={d.name} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-text-muted w-4">#{i + 1}</span>
                              <span className="text-xs font-bold text-text-primary">{d.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold" style={{ color: d.fill }}>{d.pct.toFixed(1)}%</span>
                              <span className="text-[10px] text-text-muted tabular-nums">{fmt(d.value)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${d.pct}%` }}
                              transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: d.fill }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </SCard>}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* DECISION SUMMARY                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor:`${decision.color}30`, background: decision.bgColor }}
      >
        <div className="px-5 py-4 flex flex-wrap items-start gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background:`${decision.color}20`, border:`1.5px solid ${decision.color}40` }}>
              {decision.verdict === "STRONG_BUY"  && <ShieldCheck  className="w-5 h-5" style={{ color: decision.color }} />}
              {decision.verdict === "HIGH_RISK"   && <ShieldAlert  className="w-5 h-5" style={{ color: decision.color }} />}
              {decision.verdict === "MODERATE"    && <SlidersHorizontal className="w-5 h-5" style={{ color: decision.color }} />}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Investment Verdict</div>
              <div className="text-xl font-black leading-tight" style={{ color: decision.color }}>{decision.label}</div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary mb-2">{decision.headline}</p>
            <div className="flex flex-wrap gap-2">
              {decision.reasons.map((r, i) => (
                <span key={i} className="flex items-center gap-1 text-[11px] text-text-muted px-2.5 py-1 rounded-full border border-border/60 bg-surface/60">
                  <ChevronRight className="w-3 h-3 shrink-0" style={{ color: decision.color }} />
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 6. COMPARISON CHART                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="charts" title="P&L Financial Overview" accent={C.cyan} icon={BarChart3}
        description="Single-value comparison: Budget Revenue vs Projected Revenue vs Collections vs Budget Expenses vs Actual Expenses. All values in ₹ Cr.">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {(["bar","line"] as const).map((mode) => (
              <button key={mode} onClick={() => setChartMode(mode)}
                className={cn("px-4 py-1.5 rounded-xl text-xs font-bold border transition-all",
                  projections.chartMode===mode ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-border text-text-muted")}>
                {mode==="bar" ? "P&L Bar" : "Period Timeline"}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-xs text-text-muted">
            <span>Break-even: <strong className="text-yellow-400">{fmt(metrics.breakEven)}</strong></span>
            <span>Net Revenue: <strong style={{ color: metrics.netRevenue >= 0 ? C.green : C.red }}>{fmtSigned(metrics.netRevenue)}</strong></span>
          </div>
        </div>
        <div className="h-[240px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {projections.chartMode === "bar" ? (
              <BarChart data={plData} margin={{ top:8, right:24, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize:10, fill:"#9CA3AF" }} />
                <YAxis
                  domain={[0, (dataMax: number) => Math.max(dataMax, metrics.breakEven, 1) * 1.12]}
                  tickFormatter={(v) => `₹${crFmt.format(v as number)}`}
                  tick={{ fontSize:11, fill:"#9CA3AF" }} width={56}
                />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0];
                  const d = p.payload as typeof plData[number];
                  return (
                    <div className="px-3 py-2.5 rounded-xl bg-surface border border-border shadow-xl text-xs min-w-[200px]">
                      <p className="font-bold text-text-primary mb-1">{d.name}</p>
                      <div className="flex justify-between gap-4">
                        <span className="text-text-muted">Value</span>
                        <span className="font-bold" style={{ color: d.fill }}>{fmt(d.value)}</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-1">{d.desc}</p>
                    </div>
                  );
                }} />
                <Bar dataKey="value" radius={[6,6,0,0]} maxBarSize={72} label={false}>
                  {plData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
                <ReferenceLine y={metrics.breakEven} stroke={C.red} strokeDasharray="4 3"
                  label={{ value:`Break-even ${fmt(metrics.breakEven)}`, fill:C.red, fontSize:10, position:"insideTopRight" }} />
              </BarChart>
            ) : (
              <LineChart data={timeline.rows} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="period" tick={{ fontSize:11, fill:"#9CA3AF" }} />
                <YAxis domain={[0,yMax]} tickFormatter={(v)=>`₹${crFmt.format(v as number)}`} tick={{ fontSize:11, fill:"#9CA3AF" }} width={56} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Line dataKey="Budget"     name="Budget Expenses (run-rate)" stroke={C.orange} strokeWidth={2.5} dot={{ r:3 }} />
                <Line dataKey="Projection" name="Projected Revenue"          stroke={C.green}  strokeWidth={2.5} dot={{ r:3 }} />
                <Line dataKey="Actual"     name="Actual Expenses (run-rate)" stroke={C.red}    strokeWidth={2.5} dot={{ r:3 }} />
                <ReferenceLine y={metrics.breakEven} stroke={C.gold} strokeDasharray="4 3"
                  label={{ value:"Break-even", fill:C.gold, fontSize:10, position:"right" }} />
                {timeline.breakEvenX && (
                  <ReferenceLine x={timeline.breakEvenX} stroke={C.purple} strokeDasharray="3 3"
                    label={{ value:`BE: ${timeline.breakEvenX}`, fill:C.purple, fontSize:10, position:"top" }} />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[9px] sm:text-[10px] text-text-muted">
          {projections.chartMode === "bar" ? (
            <>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: C.green }} />Budget Revenue</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: C.cyan }} />Projected Revenue</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: C.blue }} />Collections</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: C.orange }} />Budget Expenses</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: C.red }} />Actual Expenses</span>
              <span className="flex items-center gap-1"><span className="inline-block w-5 border-t-2 border-dashed shrink-0" style={{ borderColor: C.red }} />Break-even</span>
            </>
          ) : (
            <span>Period timeline — projections vs run-rate expenses. Purple line = break-even period.</span>
          )}
        </div>
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 7. COMPOSITION PIES                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="composition" title="Expense & revenue composition" accent={C.purple} icon={Layers}
        description="Phase-level expense budgets and gross revenue split (from collections).">
        <div className="grid lg:grid-cols-2 gap-8">
          {[
            { label:"Expenses by phase", data:budgetPie,  pal:PIE_PAL },
            { label:"Revenue Split",   data:revenuePie, pal:[C.blue,C.cyan,C.green,C.gold] },
          ].map(({ label, data, pal }) => (
            <div key={label}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3">{label}</p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} innerRadius={44}>
                      {data.map((_,i) => <Cell key={i} fill={pal[i%pal.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0];
                      return (
                        <div className="px-3 py-2 rounded-xl bg-surface border border-border text-xs shadow-xl">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: p.payload.fill }} />
                            <span className="text-text-muted">{p.name}</span>
                          </div>
                          <div className="font-bold text-text-primary mt-0.5">{fmt(Number(p.value??0))}</div>
                        </div>
                      );
                    }} />
                    <Legend wrapperStyle={{ fontSize:11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 8. EFFICIENCY (theatrical only)                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {!isDigital && <SCard id="efficiency" title="Marketing efficiency" accent={metrics.totalMarketingBudget===0?C.muted:effColor} icon={Gauge}
        description="Total Budget Revenue ÷ Marketing expense (matrix). Measures budgeted yield on marketing spend.">
        {metrics.totalMarketingBudget === 0 ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:`${C.muted}18`, border:`1px solid ${C.muted}30` }}>
              <Gauge className="w-6 h-6" style={{ color: C.muted }} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-muted">Efficiency not available</p>
              <p className="text-xs text-text-muted mt-1">No marketing expense found in the matrix. Add a marketing budget to compute the efficiency ratio.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
              <span>Total Budget Revenue: <strong className="text-text-primary">{fmt(metrics.totalBudgetRevenue)}</strong></span>
              <span>Marketing Spend: <strong className="text-red-400">₹0.00 Cr</strong></span>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4 items-center">
            <div className="rounded-2xl p-5 flex flex-col items-center gap-1 border transition-all hover:shadow-md"
              style={{ background:`${effColor}10`, borderColor:`${effColor}30` }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Efficiency Ratio</div>
              <div className="text-4xl font-black tabular-nums" style={{ color: effColor }}>{fmtX(metrics.efficiencyRatio)}</div>
              <div className="text-xs font-bold" style={{ color: effColor }}>{metrics.efficiencyLabel}</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Total budget revenue</span>
                <span className="font-bold text-text-primary tabular-nums">{fmt(metrics.totalBudgetRevenue)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Marketing expense (matrix)</span>
                <span className="font-bold text-text-primary tabular-nums">{fmt(metrics.totalMarketingBudget)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <BandRow ratio={metrics.efficiencyRatio} threshold={2}  label="< 2×" desc="Over-spending"    color={C.red}   />
              <BandRow ratio={metrics.efficiencyRatio} threshold={3}  label="2–3×" desc="Average"          color={C.gold}  />
              <BandRow ratio={metrics.efficiencyRatio} threshold={99} label="> 3×" desc="Highly efficient" color={C.green} />
            </div>
          </div>
        )}
      </SCard>}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 9. NPV & IRR                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="npv" title="NPV & IRR Results" accent={C.green} icon={Calculator}
        description="Computed from cash flows, discount rate, and required return entered in the Financial Inputs section above.">
        <div className="flex flex-wrap gap-3 text-[11px] mb-4">
          <div className="rounded-xl border border-border/60 px-3 py-2 bg-surface-2/60">
            <span className="text-text-muted">Discount rate:</span>
            <strong className="ml-1.5 text-text-primary">{fmtPct(npvConfig.discountRate)}</strong>
          </div>
          <div className="rounded-xl border border-border/60 px-3 py-2 bg-surface-2/60">
            <span className="text-text-muted">Required return:</span>
            <strong className="ml-1.5 text-text-primary">{fmtPct(npvConfig.requiredReturn)}</strong>
          </div>
          <div className="rounded-xl border border-border/60 px-3 py-2 bg-surface-2/60">
            <span className="text-text-muted">Cash flow period:</span>
            <strong className="ml-1.5 text-text-primary capitalize">{cashFlowPeriod}ly</strong>
          </div>
          {cashFlowPeriod !== "year" && (
            <div className="rounded-xl border border-border/60 px-3 py-2 bg-surface-2/60">
              <span className="text-text-muted">Effective {cashFlowPeriod}ly rate:</span>
              <strong className="ml-1.5 text-text-primary">{fmtPct(periodRate * 100, 4)}</strong>
            </div>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <MetricBox label="NPV (Net Present Value)" value={fmtSigned(periodNpv)}
            color={periodNpv >= 0 ? C.green : C.red}
            guidance="Accept project if NPV > 0. Negative NPV means project destroys value at this discount rate."
            tooltip="NPV = sum of discounted future cash flows minus initial actual investment. Formula: Σ(CF_t / (1+r)^t) − Total Actual Expenses."
            icon={periodNpv >= 0 ? TrendingUp : TrendingDown} />
          <MetricBox label="IRR — annualised"
            value={periodIrr == null ? "Insufficient data" : `${periodIrr.toFixed(2)}%`}
            color={periodIrr == null ? C.muted : periodIrr >= npvConfig.requiredReturn ? C.green : C.red}
            guidance={`Accept if IRR > Required Return (${fmtPct(npvConfig.requiredReturn)}). ${periodIrr != null && periodIrr >= npvConfig.requiredReturn ? "✓ Hurdle cleared." : "✗ Below hurdle."}`}
            tooltip="IRR = discount rate at which NPV = 0. Compared against Required Return (hurdle rate) to decide project viability."
            icon={periodIrr != null && periodIrr >= npvConfig.requiredReturn ? TrendingUp : TrendingDown} />
        </div>
        <p className="text-[10px] text-text-muted flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-border/50">
          <Info className="w-3 h-3 shrink-0 text-accent" />
          Cash flows and rates are configured in the <strong className="text-text-primary mx-1">Financial Inputs</strong> section above. All inputs produce deterministic outputs — same values always produce the same NPV and IRR.
        </p>
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 10. FINANCIAL INSIGHTS                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {insights.length > 0 && (
        <SCard id="insights" title="AI Financial Insights" accent={C.purple} icon={Lightbulb}
          description="Rule-based diagnostics derived from your financial inputs. No randomness.">
          <div className="space-y-3">
            {insights.map((ins, i) => {
              const col =
                ins.type === "warning"  ? C.red    :
                ins.type === "positive" ? C.green  : C.blue;
              const Ic =
                ins.type === "warning"  ? AlertTriangle :
                ins.type === "positive" ? CheckCircle2  : Info;
              return (
                <motion.div key={i}
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.05 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                  style={{ borderColor:`${col}25`, background:`${col}06` }}>
                  <Ic className="w-4 h-4 mt-0.5 shrink-0" style={{ color: col }} />
                  <div>
                    <div className="text-xs font-bold text-text-primary">{ins.title}</div>
                    <div className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{ins.detail}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 11. ROI GAUGE                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="roi" title="ROI Gauge" accent={metrics.totalActualInvestment===0?C.muted:metrics.roi>=0?C.green:C.red} icon={Gauge}
        description="ROI % = Net Revenue ÷ Total Actual Expenses × 100. Net Revenue = Budget Revenue − Actual Expenses.">
        {metrics.totalActualInvestment === 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/8 border border-yellow-500/25 text-xs text-yellow-400 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            ROI not defined — Total Actual Expenses is zero. Enter actual expense values in the matrix to enable ROI calculation.
          </div>
        )}
        <div className="max-w-sm mx-auto">
          <ROIGauge value={metrics.totalActualInvestment === 0 ? 0 : metrics.roi} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          <MetricBox label="Total Actual Expenses" value={fmt(metrics.totalActualInvestment)} color={C.blue}
            tooltip="Meaning: Capital actually deployed across all expense categories.&#10;Formula: Σ of all actual cells in the expense matrix.&#10;Usage: Denominator for ROI and Break-even calculations." />
          <MetricBox
            label="Net Revenue"
            value={fmtSigned(metrics.netRevenue)}
            color={metrics.netRevenue > 0 ? C.green : metrics.netRevenue < 0 ? C.red : C.muted}
            badge={
              metrics.netRevenue > 0
                ? <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-green-500/15 text-green-400 border border-green-500/25 uppercase">Profit</span>
                : metrics.netRevenue < 0
                ? <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500/15 text-red-400 border border-red-500/25 uppercase">Loss</span>
                : null
            }
            tooltip="Meaning: Net return after deducting all actual expenses from budgeted revenue.&#10;Formula: Total Budget Revenue − Total Actual Expenses.&#10;Usage: Core P&L result. Positive = profit; negative = loss."
          />
          <MetricBox
            label="ROI %"
            value={metrics.totalActualInvestment === 0 ? "N/A" : fmtPct(metrics.roi)}
            color={metrics.totalActualInvestment === 0 ? C.muted : metrics.roi>=0?C.green:C.red}
            guidance={metrics.totalActualInvestment === 0 ? "Enter actual expenses to compute ROI" : undefined}
            tooltip={
              metrics.totalActualInvestment === 0
                ? "ROI not defined when actual expenses are zero."
                : "Meaning: Percentage return generated per rupee of actual spend.&#10;Formula: (Net Revenue ÷ Total Actual Expenses) × 100.&#10;Usage: Higher is better. >100% = project returned more than it cost."
            }
          />
        </div>
      </SCard>

        </div>
      )}

    </div>
  );
}
