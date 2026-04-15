import type { BudgetInputs, RevenueConfig, NPVConfig, TerritoryConfig, ProjectionsConfig } from "@/lib/financial-store";

export interface FinancialPayload {
  budget: BudgetInputs;
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
