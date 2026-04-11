import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BudgetInputs {
  productionBudget: number;
  marketingBudget: number;
  travelBudget: number;
  actorBudget: number;
  foodUtilitiesBudget: number;
  miscBudget: number;
  actualTravelExpenses: number;
  actualFoodExpenses: number;
  actualMiscExpenses: number;
}

export interface BreakdownConfig {
  preProductionPct: number;  // 30–35
  postProductionPct: number; // 20–25
  productionPct: number;     // 25–30
  contingencyPct: number;    // balance (10–15)
}

export interface RevenueConfig {
  totalCollections: number;
  exhibitorSplit: number;    // 45–55
  distributorSplit: number;  // 20–35
  investorSplit: number;     // 10–20
}

export interface NPVConfig {
  discountRate: number;
  cashFlows: number[];       // per-year inflows (₹ Cr)
}

// ── Territory Revenue ──────────────────────────────────────────────────────────

export interface TerritoryConfig {
  hindiDomesticPct: number;   // Domestic Hindi Belt
  southIndiaPct: number;      // South India (Tamil/Telugu/Kannada/Malayalam)
  overseasPct: number;        // Overseas (UAE, UK, USA, Australia)
  ottRightsPct: number;       // OTT streaming rights
  satelliteRightsPct: number; // Satellite / TV rights
  musicRightsPct: number;     // Music / audio rights
  // Remaining = 100 − sum of above (misc / walkaway)
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

export interface ScenarioSnapshot {
  name: string;
  label: "Optimistic" | "Base" | "Pessimistic";
  budget: BudgetInputs;
  revenue: RevenueConfig;
  isSet: boolean;
}

// ── Derived metrics ────────────────────────────────────────────────────────────

export interface FinancialMetrics {
  totalBudget: number;
  totalInvestment: number;
  preProduction: number;
  postProduction: number;
  production: number;
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
  isOverBudget: boolean;
  actualOverBudget: number;
  isProfitable: boolean;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

export const DEFAULT_BUDGET: BudgetInputs = {
  productionBudget: 20,
  marketingBudget: 8,
  travelBudget: 2,
  actorBudget: 15,
  foodUtilitiesBudget: 1,
  miscBudget: 2,
  actualTravelExpenses: 2.4,
  actualFoodExpenses: 1.2,
  actualMiscExpenses: 2.3,
};

export const DEFAULT_BREAKDOWN: BreakdownConfig = {
  preProductionPct: 33,
  postProductionPct: 22,
  productionPct: 32,
  contingencyPct: 13,
};

export const DEFAULT_REVENUE: RevenueConfig = {
  totalCollections: 100,
  exhibitorSplit: 50,
  distributorSplit: 25,
  investorSplit: 15,
};

export const DEFAULT_NPV: NPVConfig = {
  discountRate: 10,
  cashFlows: [15, 25, 35, 20, 10],
};

export const DEFAULT_TERRITORY: TerritoryConfig = {
  hindiDomesticPct: 42,
  southIndiaPct: 14,
  overseasPct: 18,
  ottRightsPct: 12,
  satelliteRightsPct: 8,
  musicRightsPct: 4,
  // remaining = 2%
};

const DEFAULT_SCENARIO = (label: ScenarioSnapshot["label"]): ScenarioSnapshot => ({
  name: label,
  label,
  budget: { ...DEFAULT_BUDGET },
  revenue: { ...DEFAULT_REVENUE },
  isSet: false,
});

export const DEFAULT_SCENARIOS: ScenarioSnapshot[] = [
  DEFAULT_SCENARIO("Optimistic"),
  DEFAULT_SCENARIO("Base"),
  DEFAULT_SCENARIO("Pessimistic"),
];

// ── IRR (Newton-Raphson) ───────────────────────────────────────────────────────

function computeIRR(cashFlows: number[]): number | null {
  if (!cashFlows.some((c) => c < 0) || !cashFlows.some((c) => c > 0)) return null;

  let rate = 0.15;
  for (let iter = 0; iter < 2000; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      const d = Math.pow(1 + rate, i);
      npv += cashFlows[i] / d;
      dnpv -= (i * cashFlows[i]) / (d * (1 + rate));
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const next = rate - npv / dnpv;
    if (Math.abs(next - rate) < 1e-8) return next * 100;
    rate = next;
    if (rate < -0.99 || rate > 50) return null;
  }
  return rate * 100;
}

// ── Core Calculation Engine ────────────────────────────────────────────────────

export function computeMetrics(
  budget: BudgetInputs,
  breakdown: BreakdownConfig,
  revenue: RevenueConfig,
  npvCfg: NPVConfig
): FinancialMetrics {
  const totalBudget =
    budget.productionBudget +
    budget.marketingBudget +
    budget.travelBudget +
    budget.actorBudget +
    budget.foodUtilitiesBudget +
    budget.miscBudget;

  const totalInvestment = budget.productionBudget + budget.marketingBudget;

  const preProduction  = (totalBudget * breakdown.preProductionPct)  / 100;
  const postProduction = (totalBudget * breakdown.postProductionPct) / 100;
  const production     = (totalBudget * breakdown.productionPct)     / 100;
  const contingency    = (totalBudget * breakdown.contingencyPct)    / 100;

  const c = revenue.totalCollections;
  const exhibitorShare    = (c * revenue.exhibitorSplit)    / 100;
  const distributorShare  = (c * revenue.distributorSplit)  / 100;
  const investorShare     = (c * revenue.investorSplit)     / 100;
  const paShare           = Math.max(0, c - exhibitorShare - distributorShare - investorShare);

  const netRevenue = c - distributorShare - paShare;
  const roi =
    totalInvestment > 0
      ? ((netRevenue - totalInvestment) / totalInvestment) * 100
      : 0;

  const investorBase = Math.max(0, exhibitorShare - distributorShare - paShare);
  const investorNet  = investorBase * (revenue.investorSplit / 100);

  const efficiencyRatio =
    budget.marketingBudget > 0 ? c / budget.marketingBudget : 0;
  const efficiencyLabel: FinancialMetrics["efficiencyLabel"] =
    efficiencyRatio < 2
      ? "Over-spending"
      : efficiencyRatio <= 3
      ? "Average"
      : "Highly efficient";

  const breakEven = totalInvestment;

  const npv = npvCfg.cashFlows.reduce(
    (sum, cf, i) => sum + cf / Math.pow(1 + npvCfg.discountRate / 100, i + 1),
    0
  );

  const irrFlows = [-totalInvestment, ...npvCfg.cashFlows];
  const irr = computeIRR(irrFlows);

  const budgetedActuals =
    budget.travelBudget + budget.foodUtilitiesBudget + budget.miscBudget;
  const actualTotal =
    budget.actualTravelExpenses +
    budget.actualFoodExpenses +
    budget.actualMiscExpenses;
  const isOverBudget     = actualTotal > budgetedActuals;
  const actualOverBudget = actualTotal - budgetedActuals;

  return {
    totalBudget, totalInvestment,
    preProduction, postProduction, production, contingency,
    exhibitorShare, distributorShare, investorShare, paShare,
    netRevenue, roi, investorNet,
    efficiencyRatio, efficiencyLabel,
    breakEven, npv, irr,
    isOverBudget, actualOverBudget,
    isProfitable: roi > 0,
  };
}

// ── Territory helpers ──────────────────────────────────────────────────────────

export function territoryRemaining(t: TerritoryConfig): number {
  return Math.max(
    0,
    100 - t.hindiDomesticPct - t.southIndiaPct - t.overseasPct -
    t.ottRightsPct - t.satelliteRightsPct - t.musicRightsPct
  );
}

// ── Zustand Store ──────────────────────────────────────────────────────────────

interface FinancialStore {
  budget: BudgetInputs;
  breakdown: BreakdownConfig;
  revenue: RevenueConfig;
  npvConfig: NPVConfig;
  territory: TerritoryConfig;
  scenarios: ScenarioSnapshot[];

  setBudget:     (b: Partial<BudgetInputs>)    => void;
  setBreakdown:  (b: Partial<BreakdownConfig>) => void;
  setRevenue:    (r: Partial<RevenueConfig>)   => void;
  setNPVConfig:  (n: Partial<NPVConfig>)       => void;
  setTerritory:  (t: Partial<TerritoryConfig>) => void;
  setCashFlow:   (index: number, value: number) => void;
  addCashFlow:   () => void;
  removeCashFlow:(index: number) => void;

  // Scenario actions
  setScenarioFromCurrent: (index: number) => void;
  clearScenario:          (index: number) => void;
  renameScenario:         (index: number, name: string) => void;

  reset: () => void;
}

export const useFinancialStore = create<FinancialStore>()(
  persist(
    (set, get) => ({
      budget:    DEFAULT_BUDGET,
      breakdown: DEFAULT_BREAKDOWN,
      revenue:   DEFAULT_REVENUE,
      npvConfig: DEFAULT_NPV,
      territory: DEFAULT_TERRITORY,
      scenarios: DEFAULT_SCENARIOS,

      setBudget:    (b) => set((s) => ({ budget:    { ...s.budget,    ...b } })),
      setBreakdown: (b) => set((s) => ({ breakdown: { ...s.breakdown, ...b } })),
      setRevenue:   (r) => set((s) => ({ revenue:   { ...s.revenue,   ...r } })),
      setNPVConfig: (n) => set((s) => ({ npvConfig: { ...s.npvConfig, ...n } })),
      setTerritory: (t) => set((s) => ({ territory: { ...s.territory, ...t } })),

      setCashFlow: (index, value) =>
        set((s) => {
          const flows = [...s.npvConfig.cashFlows];
          flows[index] = value;
          return { npvConfig: { ...s.npvConfig, cashFlows: flows } };
        }),

      addCashFlow: () =>
        set((s) => ({
          npvConfig: { ...s.npvConfig, cashFlows: [...s.npvConfig.cashFlows, 0] },
        })),

      removeCashFlow: (index) =>
        set((s) => ({
          npvConfig: {
            ...s.npvConfig,
            cashFlows: s.npvConfig.cashFlows.filter((_, i) => i !== index),
          },
        })),

      setScenarioFromCurrent: (index) => {
        const { budget, revenue, scenarios } = get();
        const updated = scenarios.map((sc, i) =>
          i === index
            ? { ...sc, budget: { ...budget }, revenue: { ...revenue }, isSet: true }
            : sc
        );
        set({ scenarios: updated });
      },

      clearScenario: (index) => {
        const { scenarios } = get();
        const updated = scenarios.map((sc, i) =>
          i === index ? { ...sc, budget: { ...DEFAULT_BUDGET }, revenue: { ...DEFAULT_REVENUE }, isSet: false } : sc
        );
        set({ scenarios: updated });
      },

      renameScenario: (index, name) => {
        const { scenarios } = get();
        const updated = scenarios.map((sc, i) => (i === index ? { ...sc, name } : sc));
        set({ scenarios: updated });
      },

      reset: () =>
        set({
          budget:    DEFAULT_BUDGET,
          breakdown: DEFAULT_BREAKDOWN,
          revenue:   DEFAULT_REVENUE,
          npvConfig: DEFAULT_NPV,
          territory: DEFAULT_TERRITORY,
          scenarios: DEFAULT_SCENARIOS,
        }),
    }),
    {
      name: "scriptmind-financial",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
