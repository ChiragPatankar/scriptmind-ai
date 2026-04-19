import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PhaseKey = "preProduction" | "production" | "postProduction" | "contingency";
export type BudgetCategory = "marketing" | "actorBudget" | "foodUtilities" | "travel" | "misc";
export type RevenueMode = "percent" | "amount";
export type SplitKey = "exhibitor" | "distributor" | "investor" | "pa";
export type ChartMode = "bar" | "line";
export type PlatformType = "OTT" | "Satellite" | "Theatrical";

export type BreakEvenMode = "auto" | "manual";

export interface MatrixCell {
  budget: number;
  actual: number;
}

export type BudgetMatrix = Record<PhaseKey, Record<BudgetCategory, MatrixCell>>;

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
  totalActuals: number;
  totalInvestment: number;
  totalMarketingBudget: number;
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

export const PHASE_KEYS: PhaseKey[] = ["preProduction", "production", "postProduction", "contingency"];
export const BUDGET_CATEGORIES: BudgetCategory[] = [
  "marketing",
  "actorBudget",
  "foodUtilities",
  "travel",
  "misc",
];

/** Demo seed (₹ Cr) — valid splits; totals ~33 Cr budget for quick “Generate report” trials. */
export function createDemoMatrix(): BudgetMatrix {
  const b = (budget: number, actual: number): MatrixCell => ({
    budget: Math.max(0, budget),
    actual: Math.max(0, actual),
  });
  return {
    preProduction: {
      marketing: b(0.9, 0.75),
      actorBudget: b(0.2, 0.15),
      foodUtilities: b(0.35, 0.3),
      travel: b(0.25, 0.22),
      misc: b(0.2, 0.18),
    },
    production: {
      marketing: b(1.4, 1.2),
      actorBudget: b(12.5, 11.8),
      foodUtilities: b(1.6, 1.45),
      travel: b(2.2, 2.0),
      misc: b(1.1, 0.95),
    },
    postProduction: {
      marketing: b(8.2, 7.4),
      actorBudget: b(0.6, 0.55),
      foodUtilities: b(0.85, 0.8),
      travel: b(0.55, 0.5),
      misc: b(2.1, 1.9),
    },
    contingency: {
      marketing: b(0.4, 0.1),
      actorBudget: b(0.35, 0.1),
      foodUtilities: b(0.45, 0.12),
      travel: b(0.35, 0.1),
      misc: b(0.65, 0.15),
    },
  };
}

export function createEmptyMatrix(): BudgetMatrix {
  const cell = (): MatrixCell => ({ budget: 0, actual: 0 });
  return {
    preProduction: {
      marketing: cell(),
      actorBudget: cell(),
      foodUtilities: cell(),
      travel: cell(),
      misc: cell(),
    },
    production: {
      marketing: cell(),
      actorBudget: cell(),
      foodUtilities: cell(),
      travel: cell(),
      misc: cell(),
    },
    postProduction: {
      marketing: cell(),
      actorBudget: cell(),
      foodUtilities: cell(),
      travel: cell(),
      misc: cell(),
    },
    contingency: {
      marketing: cell(),
      actorBudget: cell(),
      foodUtilities: cell(),
      travel: cell(),
      misc: cell(),
    },
  };
}

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

/** Percent mode: exhibitor + distributor + investor must not exceed 100 % (P&A is remainder). */
export function revenueSplitPercentInvalid(revenue: RevenueConfig): boolean {
  if (revenue.mode !== "percent") return false;
  const s = revenue.percent.exhibitor + revenue.percent.distributor + revenue.percent.investor;
  return s > 100 + 1e-6;
}

/** Amount mode: split amounts should match total collections (after sync, pa fills remainder). */
export function revenueSplitAmountInvalid(revenue: RevenueConfig): boolean {
  if (revenue.mode !== "amount") return false;
  const total = Math.max(0, revenue.totalCollections);
  if (total <= 0) return false;
  const synced = syncRevenue(revenue);
  const sumAmt =
    synced.amount.exhibitor + synced.amount.distributor + synced.amount.investor + synced.amount.pa;
  return Math.abs(sumAmt - total) > 0.02;
}

export function validateFinanceInputs(revenue: RevenueConfig): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (revenueSplitPercentInvalid(revenue)) {
    const s = revenue.percent.exhibitor + revenue.percent.distributor + revenue.percent.investor;
    errors.push(`Revenue split exceeds 100 % (Exhibitor + Distributor + Investor = ${s.toFixed(2)} %).`);
  }
  if (revenueSplitAmountInvalid(revenue)) {
    errors.push("Revenue amounts do not add up to Total Collections. Adjust splits or collections.");
  }
  return { ok: errors.length === 0, errors };
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

export function computeMetrics(
  matrix: BudgetMatrix,
  breakEvenMode: BreakEvenMode,
  breakEvenManual: number,
  revenue: RevenueConfig,
  npvCfg: NPVConfig
): FinancialMetrics {
  let totalBudget = 0;
  let totalActuals = 0;
  let totalMarketingBudget = 0;

  const phaseBudgets: Record<PhaseKey, number> = {
    preProduction: 0,
    production: 0,
    postProduction: 0,
    contingency: 0,
  };

  for (const p of PHASE_KEYS) {
    for (const c of BUDGET_CATEGORIES) {
      const cell = matrix[p]?.[c] ?? { budget: 0, actual: 0 };
      const b = Math.max(0, cell.budget);
      const a = Math.max(0, cell.actual);
      totalBudget += b;
      totalActuals += a;
      phaseBudgets[p] += b;
      if (c === "marketing") totalMarketingBudget += b;
    }
  }

  const totalInvestment = totalBudget;
  const split = syncRevenue(revenue).amount;
  const netRevenue = Math.max(0, revenue.netRevenueInput);
  const roi = totalInvestment > 0 ? ((netRevenue - totalInvestment) / totalInvestment) * 100 : 0;
  const investorNet = split.investor;
  const efficiencyRatio =
    totalMarketingBudget > 0 ? revenue.totalCollections / totalMarketingBudget : 0;
  const efficiencyLabel: FinancialMetrics["efficiencyLabel"] =
    efficiencyRatio < 2 ? "Over-spending" : efficiencyRatio <= 3 ? "Average" : "Highly efficient";

  const npv = npvCfg.cashFlows.reduce(
    (acc, cf, i) => acc + cf / Math.pow(1 + npvCfg.discountRate / 100, i + 1),
    -totalInvestment
  );
  const irr = computeIRR([-totalInvestment, ...npvCfg.cashFlows]);

  return {
    totalBudget,
    totalActuals,
    totalInvestment,
    totalMarketingBudget,
    preProduction: phaseBudgets.preProduction,
    production: phaseBudgets.production,
    postProduction: phaseBudgets.postProduction,
    contingency: phaseBudgets.contingency,
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
      breakEvenMode === "manual" && breakEvenManual > 0 ? breakEvenManual : totalInvestment,
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
  budgetMatrix: BudgetMatrix;
  breakEvenMode: BreakEvenMode;
  breakEvenManual: number;
  revenue: RevenueConfig;
  npvConfig: NPVConfig;
  territory: TerritoryConfig;
  projections: ProjectionsConfig;
  reportGenerated: boolean;

  setMatrixCell: (phase: PhaseKey, category: BudgetCategory, field: "budget" | "actual", value: number) => void;
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
  setReportGenerated: (value: boolean) => void;
  /** Restore Finance Studio fields to built-in demo numbers (valid for Generate report). */
  loadDemoValues: () => void;
  resetInputs: () => void;
  reset: () => void;
}

let idCounter = 0;
const newId = () => `${Date.now()}-${++idCounter}`;

const DEMO_REVENUE_SEED: RevenueConfig = {
  totalCollections: 52,
  netRevenueInput: 21,
  mode: "percent",
  percent: { exhibitor: 32, distributor: 28, investor: 22, pa: 0 },
  amount: { exhibitor: 0, distributor: 0, investor: 0, pa: 0 },
};

const DEMO_NPV: NPVConfig = {
  discountRate: 12,
  requiredReturn: 14,
  cashFlows: [9, 13, 11, 7, 5],
};

const DEMO_PROJECTIONS: ProjectionsConfig = {
  years: 5,
  chartMode: "bar",
  projectedCollections: [15, 17, 13, 9, 6],
  actualCollections: [0, 0, 0, 0, 0],
};

const initialState = {
  budgetMatrix: createDemoMatrix(),
  breakEvenMode: "auto" as BreakEvenMode,
  breakEvenManual: 0,
  revenue: syncRevenue(DEMO_REVENUE_SEED),
  npvConfig: DEMO_NPV,
  territory: DEFAULT_TERRITORY,
  projections: DEMO_PROJECTIONS,
  reportGenerated: false,
};

export const useFinancialStore = create<FinancialStore>()(
  persist(
    (set) => ({
      ...initialState,

      setMatrixCell: (phase, category, field, value) =>
        set((s) => {
          const v = Math.max(0, value);
          const row = { ...s.budgetMatrix[phase], [category]: { ...s.budgetMatrix[phase][category], [field]: v } };
          return { budgetMatrix: { ...s.budgetMatrix, [phase]: row } };
        }),

      setBreakEvenMode: (mode) => set({ breakEvenMode: mode }),

      setBreakEvenManual: (value) => set({ breakEvenManual: Math.max(0, value) }),

      setRevenueMode: (mode) => set((s) => ({ revenue: syncRevenue({ ...s.revenue, mode }) })),

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
              projectedCollections: s.projections.projectedCollections
                .slice(0, n)
                .concat(Array(Math.max(0, n - s.projections.projectedCollections.length)).fill(0)),
              actualCollections: s.projections.actualCollections
                .slice(0, n)
                .concat(Array(Math.max(0, n - s.projections.actualCollections.length)).fill(0)),
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
              row.id === id
                ? { ...row, ...patch, value: patch.value == null ? row.value : Math.max(0, patch.value) }
                : row
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

      setReportGenerated: (value) => set({ reportGenerated: value }),

      loadDemoValues: () =>
        set({
          budgetMatrix: createDemoMatrix(),
          breakEvenMode: "auto",
          breakEvenManual: 0,
          revenue: syncRevenue(DEMO_REVENUE_SEED),
          npvConfig: DEMO_NPV,
          territory: DEFAULT_TERRITORY,
          projections: DEMO_PROJECTIONS,
          reportGenerated: false,
        }),

      resetInputs: () =>
        set({
          budgetMatrix: createEmptyMatrix(),
          breakEvenMode: "auto",
          breakEvenManual: 0,
          revenue: DEFAULT_REVENUE,
          npvConfig: DEFAULT_NPV,
          reportGenerated: false,
        }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: "scriptmind-financial-v5-demo",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        budgetMatrix: s.budgetMatrix,
        breakEvenMode: s.breakEvenMode,
        breakEvenManual: s.breakEvenManual,
        revenue: s.revenue,
        npvConfig: s.npvConfig,
        territory: s.territory,
        projections: s.projections,
        reportGenerated: s.reportGenerated,
      }),
    }
  )
);
