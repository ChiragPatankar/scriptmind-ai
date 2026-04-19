import type {
  BudgetMatrix,
  BreakEvenMode,
  RevenueConfig,
  NPVConfig,
  TerritoryConfig,
  ProjectionsConfig,
} from "@/lib/financial-store";

export interface FinancialPayload {
  budgetMatrix: BudgetMatrix;
  breakEvenMode: BreakEvenMode;
  breakEvenManual: number;
  revenue: RevenueConfig;
  npvConfig: NPVConfig;
  territory: TerritoryConfig;
  projections: ProjectionsConfig;
}

/** Placeholder: wire to real backend when API is ready. */
export async function saveFinancialData(payload: FinancialPayload): Promise<{ ok: true }> {
  void payload;
  return Promise.resolve({ ok: true });
}

/** Placeholder: wire to real backend when API is ready. */
export async function getFinancialData(): Promise<FinancialPayload | null> {
  return Promise.resolve(null);
}
