"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, CartesianGrid, Legend, PieChart, Pie,
  Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, ReferenceArea,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Target, BarChart3, AlertTriangle,
  CheckCircle2, XCircle, Calculator, Globe, RefreshCcw, Save, Info,
  FileDown, Upload, Plus, Trash2, Percent, ToggleLeft, ToggleRight,
  Layers, Landmark, Gauge, Film, ShieldAlert, ShieldCheck, Zap,
  SlidersHorizontal, Lightbulb, ChevronRight, PieChart as PieChartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROIGauge } from "@/components/dashboard/ROIGauge";
import { ProjectionPanel } from "@/components/dashboard/ProjectionPanel";
import {
  type PhaseKey, type SplitKey, type TerritoryEntry, type BreakEvenMode,
  computeMetrics, territoryRemaining, territoryTotal, useFinancialStore,
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
const fmt    = (n: number)         => `₹${Math.max(0, n).toFixed(2)} Cr`;
const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;
const fmtX   = (n: number)        => `${n.toFixed(2)}×`;
const clamp  = (n: number, lo=0)  => Math.max(lo, isFinite(n) ? n : 0);

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
const PLATFORM_OPTIONS: TerritoryEntry["platform"][] = ["Theatrical", "OTT", "Satellite"];

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
      className={cn("rounded-2xl bg-surface border border-border overflow-hidden scroll-mt-20", className)}
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
  // Show empty string when value is 0 so "0" renders as a placeholder, not a fixed value
  const displayValue = (!isFinite(value) || value === 0) ? "" : value;

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
        {label}
        {tooltip && (
          <span title={tooltip} className="cursor-help opacity-50 hover:opacity-100">
            <Info className="w-3 h-3" />
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type="number" min={min} step={0.1} readOnly={readOnly}
          value={readOnly ? (isFinite(value) ? value : 0) : displayValue}
          placeholder="0"
          onChange={(e) => {
            const raw = e.target.value;
            onChange?.(raw === "" ? 0 : Math.max(min, Number(raw) || 0));
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
function KpiChip({ label, value, color, sub, icon: Icon }: {
  label: string; value: string; color: string; sub?: string; icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-0.5 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.02]"
      style={{ background: `${color}08`, borderColor: `${color}22` }}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color }} />}{label}
      </div>
      <div className="text-lg font-black tabular-nums" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-text-muted">{sub}</div>}
    </div>
  );
}

function MetricBox({ label, value, color, guidance, icon: Icon }: {
  label: string; value: string; color: string; guidance?: string; icon?: React.ElementType;
}) {
  return (
    <div className="rounded-xl border p-4 space-y-1"
      style={{ borderColor: `${color}25`, background: `${color}06` }}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" style={{ color }} />}{label}
      </div>
      <div className="text-xl font-black tabular-nums" style={{ color }}>{value}</div>
      {guidance && <p className="text-[10px] text-text-muted">{guidance}</p>}
    </div>
  );
}

function Row({ label, val }: { label: string; val: number }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold text-text-primary">{fmt(val)}</span>
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
    budget, revenue, npvConfig, territory, projections,
    setTotalBudget, setPhaseAmount, setBudgetInput,
    setBreakEvenMode, setBreakEvenManual,
    setRevenueMode, setRevenueTotalCollections, setRevenueSplit, setNetRevenueInput,
    setNPVConfig, setCashFlow,
    addTerritoryEntry, updateTerritoryEntry, removeTerritoryEntry, importTerritoryRows,
    setProjectionYears, setChartMode, setProjectedValue, setActualValue,
    reset,
  } = useFinancialStore();

  const [saving, setSaving]             = useState(false);
  const [csvErrors, setCsvErrors]       = useState<string[]>([]);
  const [expandPhase, setExpandPhase]   = useState<PhaseKey | null>(null);
  const [autoBalMsg, setAutoBalMsg]     = useState("");
  const [cashFlowPeriod, setCashFlowPeriod] = useState<"year" | "month" | "week">("year");
  const [chartPeriod,    setChartPeriod]    = useState<"year" | "month" | "week">("year");
  const [yearsInputStr,  setYearsInputStr]  = useState(() => String(projections.years));

  // Keep local years input in sync with external store changes (e.g. Reset)
  useEffect(() => {
    setYearsInputStr(String(projections.years));
  }, [projections.years]);
  const [territoryZoneVizData, setTerritoryZoneVizData] = useState<Array<{ name: string; value: number }>>([]);
  const [territoryPlatformVizData, setTerritoryPlatformVizData] = useState<Array<{ name: string; value: number }>>([]);
  const [territoryVizRequested, setTerritoryVizRequested] = useState(false);

  const metrics = useMemo(
    () => computeMetrics(budget, revenue, npvConfig),
    [budget, revenue, npvConfig],
  );

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
    breakEven:        metrics.breakEven,
    totalCollections: revenue.totalCollections,
  }), [metrics, npvConfig.requiredReturn, proj0, revenue.totalCollections]);

  // ── Period-adjusted NPV & IRR ──────────────────────────────────────────────
  const PERIOD_DIVISOR = { year: 1, month: 12, week: 52 } as const;
  const PERIOD_LABEL   = { year: "Year",  month: "Month",  week: "Week"  } as const;
  const PERIOD_PLURAL  = { year: "Years", month: "Months", week: "Weeks" } as const;

  const periodRate = useMemo(() => {
    const annual = npvConfig.discountRate / 100;
    if (cashFlowPeriod === "year")  return annual;
    if (cashFlowPeriod === "month") return Math.pow(1 + annual, 1 / 12) - 1;
    return Math.pow(1 + annual, 1 / 52) - 1;
  }, [npvConfig.discountRate, cashFlowPeriod]);

  const periodNpv = useMemo(() =>
    npvConfig.cashFlows.reduce(
      (acc, cf, i) => acc + cf / Math.pow(1 + periodRate, i + 1),
      -metrics.totalInvestment,
    )
  , [npvConfig.cashFlows, periodRate, metrics.totalInvestment]);

  const periodIrr = useMemo(() => {
    const cfs = [-metrics.totalInvestment, ...npvConfig.cashFlows];
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
  }, [npvConfig.cashFlows, metrics.totalInvestment, cashFlowPeriod]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const travelShare = budget.travelBudget / 4;
  const foodShare   = budget.foodUtilitiesBudget / 4;
  const miscShare   = budget.miscBudget / 4;
  const phaseSharedTotal = (phase: PhaseKey) =>
    budget.phases[phase] +
    (phase === "production"     ? budget.actorBudget     : 0) +
    (phase === "postProduction" ? budget.marketingBudget : 0) +
    travelShare + foodShare + miscShare;

  const totalTerritory = territoryTotal(territory.entries);
  const territoryLeft  = territoryRemaining(territory.entries, revenue.totalCollections);
  const territoryOver  = revenue.totalCollections > 0 && totalTerritory > revenue.totalCollections;

  const revPctSum   = revenue.percent.exhibitor + revenue.percent.distributor + revenue.percent.investor;
  const revPctError = revenue.mode === "percent" && revPctSum > 100;

  const breakEvenGap = metrics.breakEven - proj0;
  const breakEvenMet = proj0 >= metrics.breakEven;

  const budgetPie = (["preProduction","production","postProduction","contingency"] as PhaseKey[]).map(
    (k) => ({ name: PHASE_LABEL[k], value: phaseSharedTotal(k) }),
  );
  const revenuePie = (["exhibitor","distributor","investor","pa"] as SplitKey[]).map((k) => ({
    name:  SPLIT_LABEL[k],
    value: metrics[`${k === "pa" ? "pa" : k}Share` as keyof typeof metrics] as number,
  }));

  const CHART_PERIOD_PREFIX = { year: "Y", month: "M", week: "W" } as const;
  const CHART_PERIOD_LABEL  = { year: "Years", month: "Months", week: "Weeks" } as const;

  const timeline = Array.from({ length: projections.years }, (_, i) => ({
    year:       `${CHART_PERIOD_PREFIX[chartPeriod]}${i + 1}`,
    Budget:     metrics.totalBudget,
    Projection: projections.projectedCollections[i] ?? 0,
    Actual:     projections.actualCollections[i] ?? 0,
  }));
  const yMax = Math.max(metrics.totalBudget, ...projections.projectedCollections, ...projections.actualCollections, 1) * 1.1;

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
    try { await saveFinancialData({ budget, revenue, npvConfig, territory, projections }); }
    finally { setSaving(false); }
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset}><RefreshCcw className="w-3.5 h-3.5 mr-1.5"/>Reset</Button>
          <Button variant="secondary" size="sm" onClick={handleLoad}>Load model</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-3.5 h-3.5 mr-1.5"/>{saving ? "Saving…" : "Save model"}
          </Button>
        </div>
      </motion.div>

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiChip label="Total Budget"    value={fmt(metrics.totalBudget)}     color={C.blue}   icon={Layers}     />
        <KpiChip label="Collections"     value={fmt(revenue.totalCollections)} color={C.cyan}   icon={TrendingUp} />
        <KpiChip label="Net Revenue"     value={fmt(metrics.netRevenue)}       color={C.green}  icon={DollarSign} />
        <KpiChip label="ROI"             value={fmtPct(metrics.roi)}           color={metrics.roi>=0?C.green:C.red} icon={metrics.roi>=0?TrendingUp:TrendingDown} />
        <KpiChip label="Break-even"      value={fmt(metrics.breakEven)}        color={C.gold}   icon={Target}
          sub={breakEvenMet ? "✓ Met by Y1 proj." : "Not met by Y1 proj."} />
        <KpiChip label="Mktg Efficiency" value={fmtX(metrics.efficiencyRatio)} color={effColor} icon={Gauge}
          sub={metrics.efficiencyLabel} />
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* DECISION SUMMARY CARD                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor:`${decision.color}30`, background: decision.bgColor }}
      >
        <div className="px-5 py-4 flex flex-wrap items-start gap-4">
          {/* Verdict badge */}
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

          {/* Headline + reasons */}
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
      {/* 1. BUDGET SYSTEM                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="budget" title="Budget System" accent={C.blue} icon={Layers}
        description="Set total budget; phases auto-distribute. Shared costs split equally across all 4 phases.">
        <div className="grid sm:grid-cols-3 gap-4">
          <NumField label="Total Budget"              value={budget.totalBudget}        onChange={setTotalBudget} suffix="Cr" tooltip="Distributes proportionally across phases" />
          <NumField label="Actor Budget → Production" value={budget.actorBudget}        onChange={(n)=>setBudgetInput({actorBudget:n})} suffix="Cr" />
          <NumField label="Marketing → Post-prod"     value={budget.marketingBudget}    onChange={(n)=>setBudgetInput({marketingBudget:n})} suffix="Cr" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3">
            Shared Costs <span className="font-normal normal-case">(÷ 4 phases each)</span>
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <NumField label="Travel"          value={budget.travelBudget}         onChange={(n)=>setBudgetInput({travelBudget:n})} suffix="Cr" />
            <NumField label="Food & Utilities" value={budget.foodUtilitiesBudget}  onChange={(n)=>setBudgetInput({foodUtilitiesBudget:n})} suffix="Cr" />
            <NumField label="Miscellaneous"   value={budget.miscBudget}           onChange={(n)=>setBudgetInput({miscBudget:n})} suffix="Cr" />
          </div>
        </div>

        {/* ── Budget Balance Tracker ─────────────────────────────────────── */}
        {(() => {
          const phaseSum    = budget.phases.preProduction + budget.phases.production + budget.phases.postProduction + budget.phases.contingency;
          const directTotal = phaseSum + budget.actorBudget + budget.marketingBudget + budget.travelBudget + budget.foodUtilitiesBudget + budget.miscBudget;
          const remaining   = budget.totalBudget - directTotal;
          const overBudget  = directTotal > budget.totalBudget && budget.totalBudget > 0;
          const balanced    = Math.abs(remaining) < 0.001 && budget.totalBudget > 0;
          const pct         = budget.totalBudget > 0 ? Math.min(100, (directTotal / budget.totalBudget) * 100) : 0;
          const barColor    = overBudget ? C.red : balanced ? C.green : C.gold;

          return (
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: `${barColor}25`, background: `${barColor}06` }}>
              {/* Header row */}
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: barColor }}>
                  Budget Allocation
                </p>
                <span className="text-xs font-bold" style={{ color: barColor }}>
                  {balanced ? "✓ Perfectly balanced" : overBudget ? `Over by ${fmt(Math.abs(remaining))}` : budget.totalBudget > 0 ? `${fmt(Math.abs(remaining))} remaining` : "Set a total budget"}
                </span>
              </div>

              {/* Progress bar */}
              {budget.totalBudget > 0 && (
                <div className="space-y-1">
                  <div className="h-2.5 rounded-full bg-surface-3 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: barColor }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>₹0</span>
                    <span className="font-bold" style={{ color: barColor }}>{pct.toFixed(1)}% allocated</span>
                    <span>Total {fmt(budget.totalBudget)}</span>
                  </div>
                </div>
              )}

              {/* 4-slot breakdown chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Base Phases",    value: phaseSum,               color: C.blue   },
                  { label: "Cast & Mktg",    value: budget.actorBudget + budget.marketingBudget, color: C.gold   },
                  { label: "Shared Costs",   value: budget.travelBudget + budget.foodUtilitiesBudget + budget.miscBudget, color: C.cyan   },
                  { label: "Total Allocated",value: directTotal,            color: barColor  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg border p-2.5 text-center"
                    style={{ borderColor: `${color}20`, background: `${color}08` }}>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{label}</div>
                    <div className="text-sm font-black mt-0.5 tabular-nums" style={{ color }}>{fmt(value)}</div>
                  </div>
                ))}
              </div>

              {/* Status banner */}
              {budget.totalBudget > 0 && !balanced && (
                overBudget
                  ? <ErrBanner msg={`Total allocation (${fmt(directTotal)}) exceeds budget by ${fmt(Math.abs(remaining))}. Reduce phase amounts, shared costs, or specific line items.`} />
                  : <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/8 border border-yellow-500/25 text-xs text-yellow-400">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      {fmt(Math.abs(remaining))} is unallocated. Increase base phases or add specific costs to fully utilise your budget.
                    </div>
              )}
              {balanced && <OkBanner msg={`All ${fmt(budget.totalBudget)} is fully allocated across phases and costs.`} />}
            </div>
          );
        })()}

        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3">Phase Breakdown</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(budget.phases) as PhaseKey[]).map((k) => {
              const total = phaseSharedTotal(k);
              const open  = expandPhase === k;
              return (
                <div key={k} className="rounded-xl border overflow-hidden" style={{ borderColor:`${PHASE_COLOR[k]}30` }}>
                  <div className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
                    style={{ background:`${PHASE_COLOR[k]}10` }}
                    onClick={() => setExpandPhase(open ? null : k)}>
                    <span className="text-xs font-bold" style={{ color: PHASE_COLOR[k] }}>{PHASE_LABEL[k]}</span>
                    <span className="text-xs font-black text-text-primary">{fmt(total)}</span>
                  </div>
                  <div className="px-3 pb-3 pt-2">
                    <NumField label="Base Phase" value={budget.phases[k]} onChange={(n)=>setPhaseAmount(k,n)} suffix="Cr" />
                  </div>
                  <AnimatePresence>
                    {open && (
                      <motion.div initial={{height:0}} animate={{height:"auto"}} exit={{height:0}} className="overflow-hidden">
                        <div className="px-3 pb-3 space-y-1 border-t border-border/40 pt-2">
                          <Row label="Travel ÷ 4"  val={travelShare} />
                          <Row label="Food ÷ 4"    val={foodShare}   />
                          <Row label="Misc ÷ 4"    val={miscShare}   />
                          {k === "production"     && <Row label="Actor budget" val={budget.actorBudget} />}
                          {k === "postProduction" && <Row label="Marketing"    val={budget.marketingBudget} />}
                          <div className="mt-1 pt-1 border-t border-border/40 flex justify-between text-[11px] font-bold">
                            <span className="text-text-muted">Phase total</span>
                            <span style={{ color: PHASE_COLOR[k] }}>{fmt(total)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-text-muted mt-2">Click a phase header to see its full cost breakdown.</p>
        </div>
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. PROJECTION ENGINE                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="projection" title="Projection Engine" accent={C.gold} icon={Landmark}
        description="Hybrid: 60 % weighted factors + 40 % similarity-weighted dataset. Fully deterministic.">
        <ProjectionPanel budgetSeed={metrics.totalBudget} hideHeader />
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3. REVENUE & DISTRIBUTION                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="revenue" title="Revenue & Distribution" accent={C.cyan} icon={DollarSign}
        description="Input in % or ₹. P&A is always auto-calculated as the remainder.">
        <div className="flex items-center gap-2 flex-wrap">
          {(["percent","amount"] as const).map((m) => (
            <button key={m} onClick={() => setRevenueMode(m)}
              className={cn("px-4 py-1.5 rounded-xl text-xs font-bold border transition-all",
                revenue.mode === m ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-border text-text-muted")}>
              {m === "percent" ? <><Percent className="w-3 h-3 inline mr-1"/>Percent mode</> : "₹ Amount mode"}
            </button>
          ))}
          <span className="text-[11px] text-text-muted">P&amp;A = auto-remainder</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <NumField label="Total Collections"    value={revenue.totalCollections} onChange={setRevenueTotalCollections} suffix="Cr" tooltip="Gross box-office across all platforms" />
          <NumField label="Net Revenue (user input)" value={revenue.netRevenueInput} onChange={setNetRevenueInput} suffix="Cr" tooltip="After all deductions; used for ROI" />
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          {(["exhibitor","distributor","investor"] as SplitKey[]).map((key) => (
            <NumField key={key} label={SPLIT_LABEL[key]}
              value={revenue.mode==="percent" ? revenue.percent[key] : revenue.amount[key]}
              onChange={(n)=>setRevenueSplit(key,n)}
              suffix={revenue.mode==="percent" ? "%" : "Cr"}
              error={revPctError && key==="investor" ? "Sum > 100 %" : undefined} />
          ))}
          <NumField label="P&A (auto)" value={revenue.mode==="percent" ? revenue.percent.pa : revenue.amount.pa}
            suffix={revenue.mode==="percent" ? "%" : "Cr"} readOnly tooltip="Auto-calculated as remainder" />
        </div>
        {revPctError && <ErrBanner msg={`Exhibitor + Distributor + Investor = ${fmtPct(revPctSum)} — exceeds 100 %. P&A set to 0.`} />}
        <div className="grid grid-cols-4 gap-2">
          {(["exhibitor","distributor","investor","pa"] as SplitKey[]).map((k,i) => (
            <div key={k} className="rounded-xl p-3 border border-border/50 bg-surface-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{SPLIT_LABEL[k]}</div>
              <div className="text-base font-black mt-0.5" style={{ color: PIE_PAL[i] }}>{fmtPct(revenue.percent[k])}</div>
              <div className="text-[10px] text-text-muted">{fmt(revenue.amount[k])}</div>
            </div>
          ))}
        </div>
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. BREAK-EVEN                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="breakeven" title="Break-even Analysis" accent={C.gold} icon={Target}
        description="Auto = total investment. Manual = custom target. Compare against Year 1 projection.">
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Mode</p>
            <div className="flex gap-2">
              {(["auto","manual"] as BreakEvenMode[]).map((m) => (
                <button key={m} onClick={() => setBreakEvenMode(m)}
                  className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize",
                    budget.breakEvenMode===m ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-border text-text-muted")}>
                  {m==="auto" ? <><ToggleLeft className="w-3 h-3 inline mr-1"/>Auto</> : <><ToggleRight className="w-3 h-3 inline mr-1"/>Manual</>}
                </button>
              ))}
            </div>
          </div>
          {budget.breakEvenMode==="manual"
            ? <NumField label="Break-even target (manual)"  value={budget.breakEvenManual} onChange={setBreakEvenManual} suffix="Cr" />
            : <NumField label="Break-even target (= invest.)" value={metrics.breakEven}    readOnly suffix="Cr" />}
          <NumField label="Year 1 Projected Collection" value={proj0} onChange={(n)=>setProjectedValue(0,n)} suffix="Cr" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-text-muted">Projection vs Break-even</span>
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
        {breakEvenMet
          ? <OkBanner   msg={`Y1 projection (${fmt(proj0)}) covers break-even of ${fmt(metrics.breakEven)}.`} />
          : <ErrBanner  msg={`Y1 projection falls ${fmt(Math.abs(breakEvenGap))} short of the break-even target.`} />}
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 5. TERRITORY                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="territory" title="Territory / Region Breakdown" accent={C.purple} icon={Globe}
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

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">
            <span>Zone</span><span>State</span><span>City</span>
            <span>Platform</span><span>Amount (Cr)</span><span>%</span><span/>
          </div>
          {territory.entries.map((row) => {
            const pct = revenue.totalCollections>0 ? fmtPct((row.value/revenue.totalCollections)*100) : "—";
            return (
              <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] gap-2 items-center">
                {(["zone","state","city"] as const).map((field) => (
                  <input key={field}
                    className="h-9 px-2 rounded-xl border border-border bg-surface-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
                    value={row[field]} placeholder={field.charAt(0).toUpperCase()+field.slice(1)}
                    onChange={(e) => updateTerritoryEntry(row.id, { [field]: e.target.value })} />
                ))}
                <select className="h-9 px-2 rounded-xl border border-border bg-surface-2 text-xs text-text-primary focus:outline-none"
                  value={row.platform} onChange={(e) => updateTerritoryEntry(row.id, { platform: e.target.value as TerritoryEntry["platform"] })}>
                  {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="number" min={0} step={0.1}
                  className={cn("h-9 px-2 rounded-xl border bg-surface-2 text-xs text-text-primary focus:outline-none focus:ring-1",
                    territoryOver ? "border-red-500/50 focus:ring-red-500/25" : "border-border focus:ring-accent/30")}
                  value={row.value === 0 ? "" : row.value}
                  placeholder="0"
                  onChange={(e) => updateTerritoryEntry(row.id, { value: Number(e.target.value)||0 })} />
                <span className="text-xs text-text-muted w-10 text-right">{pct}</span>
                <button onClick={() => removeTerritoryEntry(row.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
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
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 6. COMPARISON CHART                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="charts" title="Budget vs Projections vs Actuals" accent={C.cyan} icon={BarChart3}
        description="All series share the same ₹ Cr axis. Green zone = above break-even (profit); red zone = below (loss).">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex gap-2">
            {(["bar","line"] as const).map((mode) => (
              <button key={mode} onClick={() => setChartMode(mode)}
                className={cn("px-4 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize",
                  projections.chartMode===mode ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-border text-text-muted")}>
                {mode==="bar" ? "Column chart" : "Line chart"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{CHART_PERIOD_LABEL[chartPeriod]}:</span>
            <input
              type="number" min={1} max={5} step={1}
              value={yearsInputStr}
              onChange={(e) => setYearsInputStr(e.target.value)}
              onBlur={() => {
                const n = Math.min(5, Math.max(1, Math.round(Number(yearsInputStr) || 1)));
                setProjectionYears(n);
                setYearsInputStr(String(n));
              }}
              className="w-16 h-8 px-2 rounded-xl border border-border bg-surface-2 text-xs text-text-primary text-center focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-muted">Period:</span>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value as "year" | "month" | "week")}
              className="h-8 px-3 pr-8 rounded-xl border border-border bg-surface-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 transition-all appearance-none cursor-pointer"
            >
              <option value="year">📅 Year</option>
              <option value="month">🗓️ Month</option>
              <option value="week">📆 Week</option>
            </select>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted ml-auto">
            <span>Budget: <strong className="text-text-primary">{fmt(metrics.totalBudget)}</strong></span>
            <span>Break-even: <strong className="text-yellow-400">{fmt(metrics.breakEven)}</strong></span>
            <span>Collections: <strong className="text-text-primary">{fmt(revenue.totalCollections)}</strong></span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: projections.years }, (_, i) => (
            <div key={i} className="space-y-2">
              <NumField label={`${CHART_PERIOD_PREFIX[chartPeriod]}${i+1} Projection`} value={projections.projectedCollections[i]??0} onChange={(n)=>setProjectedValue(i,n)} suffix="Cr" />
              <NumField label={`${CHART_PERIOD_PREFIX[chartPeriod]}${i+1} Actual`}     value={projections.actualCollections[i]??0}     onChange={(n)=>setActualValue(i,n)}     suffix="Cr" />
            </div>
          ))}
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {projections.chartMode === "bar" ? (
              <BarChart data={timeline} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:"#9CA3AF" }} />
                <YAxis domain={[0,yMax]} tickFormatter={(v)=>`₹${(v as number).toFixed(0)}`} tick={{ fontSize:11, fill:"#9CA3AF" }} width={52} />
                {/* Profit/loss zones */}
                {metrics.breakEven > 0 && <ReferenceArea y1={0} y2={metrics.breakEven} fill={C.red}   fillOpacity={0.04} ifOverflow="hidden" />}
                {metrics.breakEven > 0 && <ReferenceArea y1={metrics.breakEven} y2={yMax} fill={C.green} fillOpacity={0.04} ifOverflow="hidden" />}
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="Budget"     fill={C.blue}  radius={[4,4,0,0]} maxBarSize={40} />
                <Bar dataKey="Projection" fill={C.green} radius={[4,4,0,0]} maxBarSize={40} />
                <Bar dataKey="Actual"     fill={C.gold}  radius={[4,4,0,0]} maxBarSize={40} />
                <ReferenceLine y={metrics.breakEven} stroke={C.red} strokeDasharray="4 3"
                  label={{ value:"Break-even", fill:C.red, fontSize:10, position:"right" }} />
              </BarChart>
            ) : (
              <LineChart data={timeline} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:"#9CA3AF" }} />
                <YAxis domain={[0,yMax]} tickFormatter={(v)=>`₹${(v as number).toFixed(0)}`} tick={{ fontSize:11, fill:"#9CA3AF" }} width={52} />
                {metrics.breakEven > 0 && <ReferenceArea y1={0} y2={metrics.breakEven} fill={C.red}   fillOpacity={0.04} ifOverflow="hidden" />}
                {metrics.breakEven > 0 && <ReferenceArea y1={metrics.breakEven} y2={yMax} fill={C.green} fillOpacity={0.04} ifOverflow="hidden" />}
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Line dataKey="Budget"     stroke={C.blue}  strokeWidth={2.5} dot={{ r:3 }} />
                <Line dataKey="Projection" stroke={C.green} strokeWidth={2.5} dot={{ r:3 }} />
                <Line dataKey="Actual"     stroke={C.gold}  strokeWidth={2.5} dot={{ r:3 }} />
                <ReferenceLine y={metrics.breakEven} stroke={C.red} strokeDasharray="4 3"
                  label={{ value:"Break-even", fill:C.red, fontSize:10, position:"right" }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        {/* Zone legend */}
        <div className="flex items-center gap-4 text-[10px] text-text-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background:`${C.green}30`, border:`1px solid ${C.green}40` }}/> Profit zone (above break-even)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background:`${C.red}30`,   border:`1px solid ${C.red}40` }}/> Loss zone (below break-even)</span>
        </div>
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 7. COMPOSITION PIES                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="composition" title="Budget & Revenue Composition" accent={C.purple} icon={Layers}
        description="Phase-level budget breakdown and revenue split.">
        <div className="grid lg:grid-cols-2 gap-8">
          {[
            { label:"Budget by Phase", data:budgetPie,  pal:PIE_PAL },
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
      {/* 8. EFFICIENCY                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="efficiency" title="Marketing Efficiency" accent={effColor} icon={Gauge}
        description="Gross Collections ÷ Marketing Budget. Measures return on marketing spend.">
        <div className="grid sm:grid-cols-3 gap-4 items-center">
          <div className="rounded-2xl p-5 flex flex-col items-center gap-1 border"
            style={{ background:`${effColor}10`, borderColor:`${effColor}30` }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Efficiency Ratio</div>
            <div className="text-4xl font-black" style={{ color: effColor }}>{fmtX(metrics.efficiencyRatio)}</div>
            <div className="text-xs font-bold" style={{ color: effColor }}>{metrics.efficiencyLabel}</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Collections</span><span className="font-bold text-text-primary">{fmt(revenue.totalCollections)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Marketing Budget</span><span className="font-bold text-text-primary">{fmt(budget.marketingBudget)}</span></div>
          </div>
          <div className="space-y-2">
            <BandRow ratio={metrics.efficiencyRatio} threshold={2}  label="< 2×" desc="Over-spending"    color={C.red}   />
            <BandRow ratio={metrics.efficiencyRatio} threshold={3}  label="2–3×" desc="Average"          color={C.gold}  />
            <BandRow ratio={metrics.efficiencyRatio} threshold={99} label="> 3×" desc="Highly efficient" color={C.green} />
          </div>
        </div>
      </SCard>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 9. NPV & IRR                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <SCard id="npv" title="NPV & IRR" accent={C.green} icon={Calculator}
        description="Net Present Value and Internal Rate of Return. Discount rate is always annual; period conversion is automatic.">
        <div className="grid sm:grid-cols-2 gap-4">
          <NumField label="Discount Rate" value={npvConfig.discountRate} onChange={(n)=>setNPVConfig({discountRate:n})} suffix="%" tooltip="WACC — weighted average cost of capital (annual)" />
          <NumField label="Required Return (IRR hurdle)" value={npvConfig.requiredReturn} onChange={(n)=>setNPVConfig({requiredReturn:n})} suffix="%" tooltip="Minimum acceptable return for investors (annual)" />
        </div>
        <div>
          {/* Period selector row */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
              Cash Flows ({PERIOD_PLURAL[cashFlowPeriod]} 1–5)
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted">Period:</span>
              <select
                value={cashFlowPeriod}
                onChange={(e) => setCashFlowPeriod(e.target.value as "year" | "month" | "week")}
                className="h-8 px-3 pr-8 rounded-xl border border-border bg-surface-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 transition-all appearance-none cursor-pointer"
              >
                <option value="year">📅 Year</option>
                <option value="month">🗓️ Month</option>
                <option value="week">📆 Week</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {npvConfig.cashFlows.map((cf, i) => (
              <NumField key={i} label={`${PERIOD_LABEL[cashFlowPeriod]} ${i + 1}`} value={cf} onChange={(n) => setCashFlow(i, n)} suffix="Cr" />
            ))}
          </div>
          {cashFlowPeriod !== "year" && (
            <p className="text-[10px] text-text-muted mt-2.5 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-border/50">
              <Info className="w-3 h-3 shrink-0 text-accent" />
              Annual discount rate <strong className="text-text-primary mx-1">{fmtPct(npvConfig.discountRate)}</strong>
              auto-converted to {cashFlowPeriod}ly rate
              <strong className="text-text-primary mx-1">{fmtPct(periodRate * 100, 4)}</strong>.
              IRR is annualised for comparison.
            </p>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <MetricBox label="NPV" value={fmt(periodNpv)}
            color={periodNpv >= 0 ? C.green : C.red}
            guidance="Accept project if NPV > 0"
            icon={periodNpv >= 0 ? TrendingUp : TrendingDown} />
          <MetricBox label="IRR (annualised)"
            value={periodIrr == null ? "Insufficient data" : `${periodIrr.toFixed(2)}%`}
            color={periodIrr == null ? C.muted : periodIrr >= npvConfig.requiredReturn ? C.green : C.red}
            guidance={`Accept if IRR > Required Return (${fmtPct(npvConfig.requiredReturn)})`}
            icon={periodIrr != null && periodIrr >= npvConfig.requiredReturn ? TrendingUp : TrendingDown} />
        </div>
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
      <SCard id="roi" title="ROI Gauge" accent={metrics.roi>=0?C.green:C.red} icon={Gauge}
        description="Return on Investment based on Net Revenue vs Total Investment.">
        <div className="max-w-sm mx-auto">
          <ROIGauge value={metrics.roi} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          <MetricBox label="Total Investment" value={fmt(metrics.totalInvestment)} color={C.blue} />
          <MetricBox label="Net Revenue"       value={fmt(metrics.netRevenue)}      color={C.cyan} />
          <MetricBox label="ROI"               value={fmtPct(metrics.roi)}          color={metrics.roi>=0?C.green:C.red} />
        </div>
      </SCard>

    </div>
  );
}
