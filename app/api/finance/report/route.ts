/**
 * POST /api/finance/report
 *
 * Generates a financial report from the client-supplied budget inputs.
 * Enforces the Finance Studio access policy (pro / 1-time trial / locked).
 * Strips locked fields server-side for trial users — never rely on frontend.
 */

import { NextRequest, NextResponse }            from "next/server";
import { createRouteSupabase }                   from "@/lib/supabase-route";
import { checkFinanceAccess }                    from "@/lib/finance/checkAccess";
import { commitTrial }                           from "@/lib/finance/commitTrial";
import {
  computeMetrics,
  type BudgetMatrix,
  type BreakEvenMode,
  type RevenueConfig,
  type NPVConfig,
  type TerritoryConfig,
  type ProjectionsConfig,
}                                                from "@/lib/financial-store";
import { computeDecision, generateInsights }     from "@/lib/financial/insights";

// ── Request body shape ────────────────────────────────────────────────────────

interface ReportRequest {
  budgetMatrix:     BudgetMatrix;
  breakEvenMode:    BreakEvenMode;
  breakEvenManual:  number;
  revenue:          RevenueConfig;
  npvConfig:        NPVConfig;
  territory:        TerritoryConfig;
  projections:      ProjectionsConfig;
}

// ── Full report shape (server-internal) ──────────────────────────────────────

interface FullReport {
  // Always visible (trial + pro)
  total_revenue:  number;   // totalBudgetRevenue
  break_even:     number;   // breakEven
  roi_percent:    number;   // roi
  net_revenue:    number;
  verdict:        string;
  verdict_label:  string;
  verdict_color:  string;

  // Pro-only fields
  territory_breakdown:   TerritoryConfig | null;
  investor_analysis: {
    npv:            number;
    irr:            number | null;
    efficiencyRatio: number;
    efficiencyLabel: string;
    investorShare:   number;
    insights:        ReturnType<typeof generateInsights>;
    decision:        ReturnType<typeof computeDecision>;
  } | null;
  detailed_projections: {
    periodType:     string;
    periodCount:    number;
    revenues:       number[];
    expenses:       number[];
  } | null;
}

// ── Response shape (public) ───────────────────────────────────────────────────

export interface FinanceReportResponse {
  report:          Omit<FullReport, "territory_breakdown" | "investor_analysis" | "detailed_projections"> & {
    territory_breakdown:   FullReport["territory_breakdown"];
    investor_analysis:     FullReport["investor_analysis"];
    detailed_projections:  FullReport["detailed_projections"];
  };
  tier:            "pro" | "trial";
  remainingTrial:  0 | null;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { supabase, applyCookies } = createRouteSupabase(request);

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return applyCookies(
      NextResponse.json({ error: "UNAUTHENTICATED", message: "Please sign in." }, { status: 401 })
    );
  }

  // 2. Access check
  const access = await checkFinanceAccess(user.id);
  if (!access.allowed) {
    const message =
      access.code === "FINANCE_LOCKED"
        ? "You have already used your free Finance Studio report. Upgrade to Pro for unlimited access."
        : "Finance Studio requires a Basic or Pro plan. Upgrade to continue.";

    return applyCookies(
      NextResponse.json({ error: access.code, message }, { status: 403 })
    );
  }

  // 3. Parse and validate body
  let body: ReportRequest;
  try {
    body = (await request.json()) as ReportRequest;
  } catch {
    return applyCookies(
      NextResponse.json({ error: "INVALID_BODY", message: "Invalid JSON body." }, { status: 400 })
    );
  }

  // 4. Compute metrics (pure function — no side effects)
  const metrics = computeMetrics(
    body.budgetMatrix,
    body.breakEvenMode,
    body.breakEvenManual,
    body.revenue,
    body.npvConfig,
  );

  const decisionParams = {
    npv:             metrics.npv,
    irr:             metrics.irr,
    requiredReturn:  body.npvConfig.requiredReturn,
    roi:             metrics.roi,
    efficiencyRatio: metrics.efficiencyRatio,
  };
  const decision = computeDecision(decisionParams);
  const insights = generateInsights({
    ...decisionParams,
    openingWeekend:     metrics.totalBudgetRevenue * 0.4,
    projected:          metrics.totalBudgetRevenue,
    week1:              metrics.totalBudgetRevenue * 0.65,
    breakEven:          metrics.breakEven,
    totalBudgetRevenue: metrics.totalBudgetRevenue,
    totalCollections:   body.revenue.totalCollections,
  });

  // Build detailed projections from projections config
  const periodCount  = body.projections?.periodCount ?? 5;
  const periodType   = body.projections?.periodType  ?? "year";
  const cfLen        = Math.min(periodCount, body.npvConfig.cashFlows.length);
  const detailedProjections = {
    periodType,
    periodCount,
    revenues:  body.npvConfig.cashFlows.slice(0, cfLen),
    expenses:  Array.from({ length: cfLen }, (_, i) =>
      i === 0 ? metrics.totalActuals : 0),
  };

  // 5. Assemble the full report
  const fullReport: FullReport = {
    total_revenue:  metrics.totalBudgetRevenue,
    break_even:     metrics.breakEven,
    roi_percent:    metrics.roi,
    net_revenue:    metrics.netRevenue,
    verdict:        decision.verdict,
    verdict_label:  decision.label,
    verdict_color:  decision.color,

    territory_breakdown:  body.territory,
    investor_analysis: {
      npv:             metrics.npv,
      irr:             metrics.irr,
      efficiencyRatio: metrics.efficiencyRatio,
      efficiencyLabel: metrics.efficiencyLabel,
      investorShare:   metrics.investorShare,
      insights,
      decision,
    },
    detailed_projections: detailedProjections,
  };

  // 6. Strip locked fields for trial users (server-side — never trust frontend)
  const tier = access.tier;
  const report: FullReport =
    tier === "trial"
      ? {
          ...fullReport,
          territory_breakdown:  null,
          investor_analysis:    null,
          detailed_projections: null,
        }
      : fullReport;

  // 7. Commit trial usage ONLY after successful generation
  if (tier === "trial") {
    await commitTrial(user.id);
  }

  // 8. Return
  return applyCookies(
    NextResponse.json({
      report,
      tier,
      remainingTrial: tier === "trial" ? 0 : null,
    } satisfies FinanceReportResponse)
  );
}
