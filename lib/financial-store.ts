import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PhaseKey = "preProduction" | "production" | "postProduction" | "contingency";
export type RevenueMode = "percent" | "amount";
export type SplitKey = "exhibitor" | "distributor" | "investor" | "pa";
export type ChartMode = "bar" | "line";
export type PlatformType = "OTT" | "Satellite" | "Theatrical";

const DEFAULT_PHASE_RATIO: Record<PhaseKey, number> = {
  preProduction: 0.15,
  production: 0.55,
  postProduction: 0.2,
  contingency: 0.1,
};

export type BreakEvenMode = "auto" | "manual";

export interface BudgetInputs {
  totalBudget: number;
  phases: Record<PhaseKey, number>;
  actorBudget: number;
  marketingBudget: number;
  travelBudget: number;
  foodUtilitiesBudget: number;
  miscBudget: number;
  breakEvenMode: BreakEvenMode;
  breakEvenManual: number;
}

export interface BreakdownConfig {
  preProductionPct: number;
  productionPct: number;
  postProductionPct: number;
  contingencyPct: number;
}

export interface RevenueConfig {
  totalCollections: number;
  netRevenueInput: number;
  mode: RevenueMode;
  percent: Record<SplitKey, number>;
  amount: Record<SplitKey, number>;
}

export interface NPVConfig {
  discountRate: number;
  requiredReturn: number;
  cashFlows: number[];
}

export interface TerritoryEntry {
  id: string;
  zone: string;
  state: string;
  city: string;
  platform: PlatformType;
  value: number;
}

export interface TerritoryConfig {
  entries: TerritoryEntry[];
  // legacy compatibility fields (used by InvestorReport)
  hindiDomesticPct: number;
  southIndiaPct: number;
  overseasPct: number;
  ottRightsPct: number;
  satelliteRightsPct: number;
  musicRightsPct: number;
}

export interface ProjectionsConfig {
  years: number;
  chartMode: ChartMode;
  projectedCollections: number[];
  actualCollections: number[];
}

export interface FinancialMetrics {
  totalBudget: number;
  totalInvestment: number;
  preProduction: number;
  production: number;
  postProduction: number;
  contingency: number;
  exhibitorShare: number;
  distributorShare: number;
  investorShare: number;
  paShare: number;
  netRevenue: number;
  roi: number;
  investorNet: number;
  efficiencyRatio: number;
  efficiencyLabel: "Over-spending" | "Average" | "Highly efficient";
  breakEven: number;
  npv: number;
  irr: number | null;
}

export const DEFAULT_BUDGET: BudgetInputs = {
  totalBudget: 0,
  phases: {
    preProduction: 0,
    production: 0,
    postProduction: 0,
    contingency: 0,
  },
  actorBudget: 0,
  marketingBudget: 0,
  travelBudget: 0,
  foodUtilitiesBudget: 0,
  miscBudget: 0,
  breakEvenMode: "auto",
  breakEvenManual: 0,
};
export const DEFAULT_BREAKDOWN: BreakdownConfig = {
  preProductionPct: 0,
  productionPct: 0,
  postProductionPct: 0,
  contingencyPct: 0,
};

export const DEFAULT_REVENUE: RevenueConfig = {
  totalCollections: 0,
  netRevenueInput: 0,
  mode: "percent",
  percent: { exhibitor: 0, distributor: 0, investor: 0, pa: 100 },
  amount: { exhibitor: 0, distributor: 0, investor: 0, pa: 0 },
};

export const DEFAULT_NPV: NPVConfig = {
  discountRate: 0,
  requiredReturn: 0,
  cashFlows: [0, 0, 0, 0, 0],
};

export const DEFAULT_TERRITORY: TerritoryConfig = {
  entries: [],
  hindiDomesticPct: 0,
  southIndiaPct: 0,
  overseasPct: 0,
  ottRightsPct: 0,
  satelliteRightsPct: 0,
  musicRightsPct: 0,
};
export const DEFAULT_PROJECTIONS: ProjectionsConfig = {
  years: 5,
  chartMode: "bar",
  projectedCollections: [0, 0, 0, 0, 0],
  actualCollections: [0, 0, 0, 0, 0],
};

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function normalizePhaseTotals(phases: Record<PhaseKey, number>, totalBudget: number): Record<PhaseKey, number> {
  const clean: Record<PhaseKey, number> = {
    preProduction: Math.max(0, phases.preProduction || 0),
    production: Math.max(0, phases.production || 0),
    postProduction: Math.max(0, phases.postProduction || 0),
    contingency: Math.max(0, phases.contingency || 0),
  };
  const phaseTotal = sum(Object.values(clean));
  if (totalBudget <= 0 || phaseTotal <= 0) return clean;
  const ratio = totalBudget / phaseTotal;
  return {
    preProduction: clean.preProduction * ratio,
    production: clean.production * ratio,
    postProduction: clean.postProduction * ratio,
    contingency: clean.contingency * ratio,
  };
}

function distributeFromTotal(totalBudget: number): Record<PhaseKey, number> {
  return {
    preProduction: totalBudget * DEFAULT_PHASE_RATIO.preProduction,
    production: totalBudget * DEFAULT_PHASE_RATIO.production,
    postProduction: totalBudget * DEFAULT_PHASE_RATIO.postProduction,
    contingency: totalBudget * DEFAULT_PHASE_RATIO.contingency,
  };
}

function syncRevenue(cfg: RevenueConfig): RevenueConfig {
  const total = Math.max(0, cfg.totalCollections);
  if (cfg.mode === "percent") {
    const p = { ...cfg.percent };
    p.exhibitor = Math.max(0, p.exhibitor);
    p.distributor = Math.max(0, p.distributor);
    p.investor = Math.max(0, p.investor);
    p.pa = Math.max(0, 100 - (p.exhibitor + p.distributor + p.investor));
    return {
      ...cfg,
      percent: p,
      amount: {
        exhibitor: (total * p.exhibitor) / 100,
        distributor: (total * p.distributor) / 100,
        investor: (total * p.investor) / 100,
        pa: (total * p.pa) / 100,
      },
    };
  }
  const a = {
    exhibitor: Math.max(0, cfg.amount.exhibitor),
    distributor: Math.max(0, cfg.amount.distributor),
    investor: Math.max(0, cfg.amount.investor),
    pa: Math.max(0, cfg.amount.pa),
  };
  const known = a.exhibitor + a.distributor + a.investor;
  a.pa = Math.max(0, total - known);
  const denom = total > 0 ? total : 1;
  return {
    ...cfg,
    amount: a,
    percent: {
      exhibitor: (a.exhibitor / denom) * 100,
      distributor: (a.distributor / denom) * 100,
      investor: (a.investor / denom) * 100,
      pa: (a.pa / denom) * 100,
    },
  };
}

function computeIRR(cashFlows: number[]): number | null {
  if (!cashFlows.some((c) => c < 0) || !cashFlows.some((c) => c > 0)) return null;
  let rate = 0.1;
  for (let iter = 0; iter < 250; iter++) {
    let npv = 0;
    let deriv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      const denom = Math.pow(1 + rate, i);
      npv += cashFlows[i] / denom;
      if (i > 0) deriv -= (i * cashFlows[i]) / (denom * (1 + rate));
    }
    if (Math.abs(deriv) < 1e-12) return null;
    const next = rate - npv / deriv;
    if (Math.abs(next - rate) < 1e-7) return next * 100;
    rate = next;
    if (rate <= -0.99 || rate > 100) return null;
  }
  return null;
}

export function computeMetrics(budget: BudgetInputs, revenue: RevenueConfig, npvCfg: NPVConfig): FinancialMetrics {
  const travelShared = budget.travelBudget / 4;
  const foodShared = budget.foodUtilitiesBudget / 4;
  const miscShared = budget.miscBudget / 4;

  const preProduction = budget.phases.preProduction + travelShared + foodShared + miscShared;
  const production = budget.phases.production + travelShared + foodShared + miscShared + budget.actorBudget;
  const postProduction = budget.phases.postProduction + travelShared + foodShared + miscShared + budget.marketingBudget;
  const contingency = budget.phases.contingency + travelShared + foodShared + miscShared;

  const phaseTotal = preProduction + production + postProduction + contingency;
  const totalBudget = Math.max(budget.totalBudget, phaseTotal);
  const totalInvestment = totalBudget;

  const split = syncRevenue(revenue).amount;
  const netRevenue = Math.max(0, revenue.netRevenueInput);
  const roi = totalInvestment > 0 ? ((netRevenue - totalInvestment) / totalInvestment) * 100 : 0;
  const investorNet = split.investor;
  const efficiencyRatio = budget.marketingBudget > 0 ? revenue.totalCollections / budget.marketingBudget : 0;
  const efficiencyLabel: FinancialMetrics["efficiencyLabel"] =
    efficiencyRatio < 2 ? "Over-spending" : efficiencyRatio <= 3 ? "Average" : "Highly efficient";

  const npv = npvCfg.cashFlows.reduce(
    (acc, cf, i) => acc + cf / Math.pow(1 + npvCfg.discountRate / 100, i + 1),
    -totalInvestment
  );
  const irr = computeIRR([-totalInvestment, ...npvCfg.cashFlows]);

  return {
    totalBudget,
    totalInvestment,
    preProduction,
    production,
    postProduction,
    contingency,
    exhibitorShare: split.exhibitor,
    distributorShare: split.distributor,
    investorShare: split.investor,
    paShare: split.pa,
    netRevenue,
    roi,
    investorNet,
    efficiencyRatio,
    efficiencyLabel,
    breakEven:
      budget.breakEvenMode === "manual" && budget.breakEvenManual > 0
        ? budget.breakEvenManual
        : totalInvestment,
    npv,
    irr,
  };
}

export function territoryTotal(entries: TerritoryEntry[]): number {
  return sum(entries.map((e) => Math.max(0, e.value)));
}

export function territoryRemaining(
  territoryOrEntries: TerritoryConfig | TerritoryEntry[],
  totalCollections?: number
): number {
  if (Array.isArray(territoryOrEntries)) {
    return Math.max(0, (totalCollections ?? 0) - territoryTotal(territoryOrEntries));
  }
  const t = territoryOrEntries;
  const legacyPct =
    (t.hindiDomesticPct ?? 0) +
    (t.southIndiaPct ?? 0) +
    (t.overseasPct ?? 0) +
    (t.ottRightsPct ?? 0) +
    (t.satelliteRightsPct ?? 0) +
    (t.musicRightsPct ?? 0);
  if (legacyPct > 0 && (totalCollections ?? 0) === 0) {
    return Math.max(0, 100 - legacyPct);
  }
  return Math.max(0, (totalCollections ?? 0) - territoryTotal(t.entries ?? []));
}

interface FinancialStore {
  budget: BudgetInputs;
  revenue: RevenueConfig;
  npvConfig: NPVConfig;
  territory: TerritoryConfig;
  projections: ProjectionsConfig;

  setTotalBudget: (value: number) => void;
  setPhaseAmount: (phase: PhaseKey, value: number) => void;
  setBudgetInput: (patch: Partial<BudgetInputs>) => void;
  setBreakEvenMode: (mode: BreakEvenMode) => void;
  setBreakEvenManual: (value: number) => void;
  setRevenueMode: (mode: RevenueMode) => void;
  setRevenueTotalCollections: (value: number) => void;
  setRevenueSplit: (key: SplitKey, value: number) => void;
  setNetRevenueInput: (value: number) => void;
  setNPVConfig: (patch: Partial<NPVConfig>) => void;
  setCashFlow: (index: number, value: number) => void;
  setProjectionYears: (years: number) => void;
  setChartMode: (mode: ChartMode) => void;
  setProjectedValue: (index: number, value: number) => void;
  setActualValue: (index: number, value: number) => void;
  addTerritoryEntry: (entry?: Partial<TerritoryEntry>) => void;
  updateTerritoryEntry: (id: string, patch: Partial<TerritoryEntry>) => void;
  removeTerritoryEntry: (id: string) => void;
  importTerritoryRows: (rows: TerritoryEntry[]) => void;
  reset: () => void;
}

const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const useFinancialStore = create<FinancialStore>()(
  persist(
    (set) => ({
      budget: DEFAULT_BUDGET,
      revenue: DEFAULT_REVENUE,
      npvConfig: DEFAULT_NPV,
      territory: DEFAULT_TERRITORY,
      projections: DEFAULT_PROJECTIONS,

      setTotalBudget: (value) =>
        set((s) => {
          const total = Math.max(0, value);
          const lineCosts =
            s.budget.actorBudget + s.budget.marketingBudget +
            s.budget.travelBudget + s.budget.foodUtilitiesBudget + s.budget.miscBudget;
          const distributable = Math.max(0, total - lineCosts);
          return {
            budget: {
              ...s.budget,
              totalBudget: total,
              phases: distributeFromTotal(distributable),
            },
          };
        }),

      setPhaseAmount: (phase, value) =>
        set((s) => {
          const phases = { ...s.budget.phases, [phase]: Math.max(0, value) };
          const total = sum(Object.values(phases));
          return { budget: { ...s.budget, phases, totalBudget: total } };
        }),

      setBudgetInput: (patch) =>
        set((s) => {
          const next = { ...s.budget, ...patch };
          const lineCostKeys = ['actorBudget', 'marketingBudget', 'travelBudget', 'foodUtilitiesBudget', 'miscBudget'] as const;
          const hasLineCostChange = lineCostKeys.some((k) => k in patch);
          if (hasLineCostChange && next.totalBudget > 0) {
            // Auto-redistribute remaining budget to phases after line-item costs
            const lineCosts =
              next.actorBudget + next.marketingBudget +
              next.travelBudget + next.foodUtilitiesBudget + next.miscBudget;
            const distributable = Math.max(0, next.totalBudget - lineCosts);
            next.phases = distributeFromTotal(distributable);
          } else {
            next.phases = normalizePhaseTotals(next.phases, next.totalBudget);
          }
          return { budget: next };
        }),

      setBreakEvenMode: (mode) =>
        set((s) => ({ budget: { ...s.budget, breakEvenMode: mode } })),

      setBreakEvenManual: (value) =>
        set((s) => ({ budget: { ...s.budget, breakEvenManual: Math.max(0, value) } })),

      setRevenueMode: (mode) =>
        set((s) => ({ revenue: syncRevenue({ ...s.revenue, mode }) })),

      setRevenueTotalCollections: (value) =>
        set((s) => ({ revenue: syncRevenue({ ...s.revenue, totalCollections: Math.max(0, value) }) })),

      setRevenueSplit: (key, value) =>
        set((s) => {
          const clean = Math.max(0, value);
          if (s.revenue.mode === "percent") {
            return { revenue: syncRevenue({ ...s.revenue, percent: { ...s.revenue.percent, [key]: clean } }) };
          }
          return { revenue: syncRevenue({ ...s.revenue, amount: { ...s.revenue.amount, [key]: clean } }) };
        }),

      setNetRevenueInput: (value) =>
        set((s) => ({ revenue: { ...s.revenue, netRevenueInput: Math.max(0, value) } })),

      setNPVConfig: (patch) => set((s) => ({ npvConfig: { ...s.npvConfig, ...patch } })),

      setCashFlow: (index, value) =>
        set((s) => {
          const cashFlows = [...s.npvConfig.cashFlows];
          cashFlows[index] = Math.max(0, value);
          return { npvConfig: { ...s.npvConfig, cashFlows } };
        }),

      setProjectionYears: (years) =>
        set((s) => {
          const n = Math.min(5, Math.max(1, years));
          return {
            projections: {
              ...s.projections,
              years: n,
              projectedCollections: s.projections.projectedCollections.slice(0, n).concat(Array(Math.max(0, n - s.projections.projectedCollections.length)).fill(0)),
              actualCollections: s.projections.actualCollections.slice(0, n).concat(Array(Math.max(0, n - s.projections.actualCollections.length)).fill(0)),
            },
          };
        }),

      setChartMode: (mode) => set((s) => ({ projections: { ...s.projections, chartMode: mode } })),

      setProjectedValue: (index, value) =>
        set((s) => {
          const arr = [...s.projections.projectedCollections];
          arr[index] = Math.max(0, value);
          return { projections: { ...s.projections, projectedCollections: arr } };
        }),

      setActualValue: (index, value) =>
        set((s) => {
          const arr = [...s.projections.actualCollections];
          arr[index] = Math.max(0, value);
          return { projections: { ...s.projections, actualCollections: arr } };
        }),

      addTerritoryEntry: (entry) =>
        set((s) => ({
          territory: {
            ...s.territory,
            entries: [
              ...s.territory.entries,
              {
                id: newId(),
                zone: entry?.zone ?? "",
                state: entry?.state ?? "",
                city: entry?.city ?? "",
                platform: entry?.platform ?? "Theatrical",
                value: Math.max(0, entry?.value ?? 0),
              },
            ],
          },
        })),

      updateTerritoryEntry: (id, patch) =>
        set((s) => ({
          territory: {
            ...s.territory,
            entries: s.territory.entries.map((row) =>
              row.id === id ? { ...row, ...patch, value: patch.value == null ? row.value : Math.max(0, patch.value) } : row
            ),
          },
        })),

      removeTerritoryEntry: (id) =>
        set((s) => ({ territory: { ...s.territory, entries: s.territory.entries.filter((row) => row.id !== id) } })),

      importTerritoryRows: (rows) =>
        set((s) => ({
          territory: {
            ...s.territory,
            entries: rows.map((r) => ({ ...r, id: r.id || newId(), value: Math.max(0, r.value) })),
          },
        })),

      reset: () =>
        set({
          budget: DEFAULT_BUDGET,
          revenue: DEFAULT_REVENUE,
          npvConfig: DEFAULT_NPV,
          territory: DEFAULT_TERRITORY,
          projections: DEFAULT_PROJECTIONS,
        }),
    }),
    { name: "scriptmind-financial-v2", storage: createJSONStorage(() => localStorage) }
  )
);
