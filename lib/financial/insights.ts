// ══════════════════════════════════════════════════════════════════════════════
//  ScriptMind AI — Financial Decision & Insights Engine
//  Rule-based, fully deterministic.  No randomness.
// ══════════════════════════════════════════════════════════════════════════════

// ── Decision Summary ──────────────────────────────────────────────────────────

export type Verdict = "STRONG_BUY" | "MODERATE" | "HIGH_RISK";

export interface DecisionSummary {
  verdict:  Verdict;
  label:    string;
  color:    string;
  bgColor:  string;
  headline: string;
  reasons:  string[];
}

export interface DecisionParams {
  npv:             number;
  irr:             number | null;
  requiredReturn:  number;
  roi:             number;
  efficiencyRatio: number;
}

function f1(n: number, d = 1): string { return n.toFixed(d); }
function abs(n: number): string { return `₹${Math.abs(n).toFixed(1)} Cr`; }

export function computeDecision(p: DecisionParams): DecisionSummary {
  const { npv, irr, requiredReturn, roi, efficiencyRatio } = p;
  const irrOk  = irr != null && irr > requiredReturn;
  const reasons: string[] = [];

  // ── STRONG BUY ──
  if (npv > 0 && irrOk && roi > 20) {
    reasons.push(`Positive NPV (+${abs(npv)}) — project creates value at current discount rate`);
    reasons.push(`IRR ${f1(irr!)}% exceeds required return of ${f1(requiredReturn)}%`);
    reasons.push(`ROI of ${f1(roi)}% is comfortably above the 20% threshold`);
    if (efficiencyRatio >= 3)
      reasons.push(`Excellent marketing efficiency at ${f1(efficiencyRatio, 2)}× — optimal spend allocation`);
    return {
      verdict:  "STRONG_BUY",
      label:    "Strong Buy",
      color:    "#22C55E",
      bgColor:  "rgba(34,197,94,0.08)",
      headline: "All key indicators are positive. This project merits investment.",
      reasons,
    };
  }

  // ── HIGH RISK ──
  const isHighRisk =
    npv < 0 ||
    (irr != null && irr < requiredReturn && roi < 0) ||
    (npv < 0 && roi < 0);

  if (isHighRisk) {
    if (npv < 0)
      reasons.push(`Negative NPV (${abs(npv)}) — project destroys value at current WACC`);
    if (irr != null && irr < requiredReturn)
      reasons.push(`IRR ${f1(irr)}% is below required return of ${f1(requiredReturn)}%`);
    if (roi < 0)
      reasons.push(`Negative ROI (${f1(roi)}%) — investment unlikely to recoup`);
    if (efficiencyRatio > 0 && efficiencyRatio < 2)
      reasons.push(`Inefficient marketing at ${f1(efficiencyRatio, 2)}× — collections lag spending`);
    if (reasons.length === 0)
      reasons.push("Multiple financial indicators are outside acceptable thresholds");
    return {
      verdict:  "HIGH_RISK",
      label:    "High Risk",
      color:    "#EF4444",
      bgColor:  "rgba(239,68,68,0.08)",
      headline: "Multiple indicators signal risk. Revisit budget, marketing, or projections before proceeding.",
      reasons,
    };
  }

  // ── MODERATE (mixed signals) ──
  if (npv > 0)
    reasons.push(`Positive NPV (+${abs(npv)}) supports the case for investment`);
  else
    reasons.push(`Negative NPV (${abs(npv)}) needs attention — increase cash flows or reduce discount rate`);

  if (irrOk)
    reasons.push(`IRR ${f1(irr!)}% clears the hurdle rate — investor expectations can be met`);
  else if (irr != null)
    reasons.push(`IRR ${f1(irr)}% is below the ${f1(requiredReturn)}% required return — returns may be delayed`);
  else
    reasons.push("Insufficient cash flow data for a reliable IRR estimate — add yearly projections");

  if (roi >= 0)
    reasons.push(`Positive ROI of ${f1(roi)}% — project earns back the investment, but below 20% threshold`);

  return {
    verdict:  "MODERATE",
    label:    "Moderate",
    color:    "#F59E0B",
    bgColor:  "rgba(245,158,11,0.08)",
    headline: "Mixed signals — project may be viable but carries risk. Strengthen the weak areas.",
    reasons,
  };
}

// ── Financial Insights ────────────────────────────────────────────────────────

export type InsightType = "warning" | "info" | "positive";

export interface FinancialInsight {
  type:   InsightType;
  title:  string;
  detail: string;
}

export interface InsightParams {
  npv:              number;
  irr:              number | null;
  requiredReturn:   number;
  roi:              number;
  efficiencyRatio:  number;
  openingWeekend:   number;   // ₹ Cr
  projected:        number;   // ₹ Cr (total projection)
  week1:            number;   // ₹ Cr
  breakEven:        number;   // ₹ Cr
  totalCollections: number;   // ₹ Cr (actual/entered)
}

export function generateInsights(p: InsightParams): FinancialInsight[] {
  const {
    npv, irr, requiredReturn, roi, efficiencyRatio,
    openingWeekend, projected, week1, breakEven, totalCollections,
  } = p;

  const items: FinancialInsight[] = [];

  // Marketing efficiency
  if (efficiencyRatio > 0 && efficiencyRatio < 2) {
    items.push({
      type:   "warning",
      title:  "Inefficient Marketing Spend",
      detail: `Collections-to-marketing ratio is only ${f1(efficiencyRatio, 2)}×. Consider reducing P&A or expanding release scope to improve returns.`,
    });
  } else if (efficiencyRatio >= 3) {
    items.push({
      type:   "positive",
      title:  "Strong Marketing ROI",
      detail: `Marketing efficiency of ${f1(efficiencyRatio, 2)}× is excellent. Budget allocation appears well-optimised.`,
    });
  }

  // Delayed returns — positive ROI but IRR below hurdle
  if (roi > 0 && irr != null && irr < requiredReturn) {
    items.push({
      type:   "warning",
      title:  "Delayed Return Profile",
      detail: `Positive overall ROI (${f1(roi)}%) but IRR (${f1(irr)}%) is below the ${f1(requiredReturn)}% hurdle. Investor returns are heavily back-loaded.`,
    });
  }

  // Negative NPV
  if (npv < 0) {
    items.push({
      type:   "warning",
      title:  "Value Destruction at Current WACC",
      detail: `At the given discount rate, the project destroys ₹${Math.abs(npv).toFixed(1)} Cr in present-value terms. Increase cash flows or reduce the discount rate.`,
    });
  }

  // Front-loaded performance risk
  if (projected > 0 && openingWeekend / projected > 0.42) {
    items.push({
      type:   "warning",
      title:  "Front-loaded Performance Risk",
      detail: `Opening weekend represents ${((openingWeekend / projected) * 100).toFixed(0)}% of projected total — unusually high. Strong word-of-mouth is critical for sustained legs.`,
    });
  }

  // Weak week-1 retention
  if (projected > 0 && week1 > 0 && week1 / projected < 0.60) {
    items.push({
      type:   "warning",
      title:  "Low Week-1 Audience Retention",
      detail: `Week-1 cumulative is only ${((week1 / projected) * 100).toFixed(0)}% of the total projection — suggests limited audience spread beyond opening days.`,
    });
  }

  // Collections below break-even
  if (totalCollections > 0 && breakEven > 0 && totalCollections < breakEven) {
    items.push({
      type:   "warning",
      title:  "Collections Below Break-even",
      detail: `Current total collections (₹${totalCollections.toFixed(1)} Cr) are ₹${(breakEven - totalCollections).toFixed(1)} Cr short of break-even (₹${breakEven.toFixed(1)} Cr).`,
    });
  }

  // Viable but modest returns
  if (roi > 0 && roi < 10 && npv > 0) {
    items.push({
      type:   "info",
      title:  "Viable But Modest Returns",
      detail: `Project is NPV-positive with a ${f1(roi)}% ROI. Consider supplementary revenue windows (OTT, satellite, music rights) to improve yield.`,
    });
  }

  // Strong overall profile
  if (roi > 30 && npv > 0 && efficiencyRatio >= 2) {
    items.push({
      type:   "positive",
      title:  "Strong Financial Profile",
      detail: `ROI of ${f1(roi)}% with positive NPV and efficient marketing — a well-structured film investment with healthy upside potential.`,
    });
  }

  // No IRR data warning
  if (irr === null && requiredReturn > 0) {
    items.push({
      type:   "info",
      title:  "IRR Cannot Be Computed",
      detail: "Ensure at least one negative and one positive cash flow are entered to enable IRR analysis.",
    });
  }

  return items;
}
