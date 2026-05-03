"use client";

/**
 * Renders a Finance Studio report.
 * Always-visible: total_revenue, break_even, roi_percent, net_revenue, verdict.
 * Locked behind LockedOverlay for trial users: territory, investor analysis, projections.
 */

import React from "react";
import { TrendingUp, TrendingDown, Target, DollarSign, Globe, BarChart3, FileDown } from "lucide-react";
import { Button }        from "@/components/ui/button";
import LockedOverlay     from "./LockedOverlay";
import type { FinanceReportResponse } from "@/app/api/finance/report/route";

type Report = FinanceReportResponse["report"];

interface FinanceReportProps {
  report: Report;
  tier:   "paid" | "trial";
}

// ── Formatters ────────────────────────────────────────────────────────────────
const crFmt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt   = (n: number) => `₹${crFmt.format(Math.max(0, Number.isFinite(n) ? n : 0))} Cr`;
const fmtSigned = (n: number) => {
  const v = Number.isFinite(n) ? n : 0;
  return v < 0 ? `−₹${crFmt.format(Math.abs(v))} Cr` : `₹${crFmt.format(v)} Cr`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string;
  value: string;
  sub?:  string;
  icon:  React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl p-4 bg-surface border border-border flex flex-col gap-2">
      <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wide">
        <Icon className="w-4 h-4" style={{ color }} />
        {label}
      </div>
      <div className="text-2xl font-black text-text-primary tabular-nums">{value}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
    </div>
  );
}

function VerdictBadge({ verdict, label, color }: { verdict: string; label: string; color: string }) {
  const bg = verdict === "STRONG_BUY" ? "rgba(34,197,94,0.1)"
           : verdict === "HIGH_RISK"   ? "rgba(239,68,68,0.1)"
           :                             "rgba(245,158,11,0.1)";
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{ background: bg, color, border: `1px solid ${color}40` }}>
      {label}
    </div>
  );
}

// ── Territory table ───────────────────────────────────────────────────────────
function TerritoryBreakdown({ territory }: { territory: Report["territory_breakdown"] }) {
  if (!territory) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
        <Globe className="w-4 h-4 text-accent" /> Territory Breakdown
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        {[
          { label: "Hindi Domestic", value: territory.hindiDomesticPct },
          { label: "South India",    value: territory.southIndiaPct    },
          { label: "Overseas",       value: territory.overseasPct      },
          { label: "OTT Rights",     value: territory.ottRightsPct     },
          { label: "Satellite",      value: territory.satelliteRightsPct },
          { label: "Music Rights",   value: territory.musicRightsPct   },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-3 bg-surface-2 border border-border">
            <div className="text-text-muted">{label}</div>
            <div className="text-lg font-bold text-text-primary mt-0.5">{value.toFixed(1)}%</div>
          </div>
        ))}
      </div>
      {territory.entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-muted border-b border-border">
                <th className="text-left pb-2 pr-4">Zone</th>
                <th className="text-left pb-2 pr-4">State</th>
                <th className="text-left pb-2 pr-4">Platform</th>
                <th className="text-right pb-2">Value (₹ Cr)</th>
              </tr>
            </thead>
            <tbody>
              {territory.entries.map((e) => (
                <tr key={e.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4 text-text-secondary">{e.zone}</td>
                  <td className="py-2 pr-4 text-text-muted">{e.state}</td>
                  <td className="py-2 pr-4 text-text-muted">{e.platform}</td>
                  <td className="py-2 text-right font-mono text-text-primary">{e.value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Investor analysis ─────────────────────────────────────────────────────────
function InvestorAnalysis({ data }: { data: Report["investor_analysis"] }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-text-primary">Investor Analysis</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {[
          { label: "NPV",         value: fmtSigned(data.npv)                            },
          { label: "IRR",         value: data.irr != null ? `${data.irr.toFixed(1)}%` : "N/A" },
          { label: "Efficiency",  value: `${data.efficiencyRatio.toFixed(2)}×`           },
          { label: "Investor €",  value: fmt(data.investorShare)                         },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-3 bg-surface-2 border border-border">
            <div className="text-text-muted">{label}</div>
            <div className="text-base font-bold text-text-primary mt-0.5">{value}</div>
          </div>
        ))}
      </div>
      {data.insights.length > 0 && (
        <ul className="space-y-2">
          {data.insights.map((ins, i) => (
            <li key={i} className="flex gap-2.5 text-xs">
              <span className={
                ins.type === "positive" ? "text-green-400" :
                ins.type === "warning"  ? "text-amber-400" : "text-blue-400"
              }>●</span>
              <span className="text-text-secondary">{ins.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Detailed projections ──────────────────────────────────────────────────────
function DetailedProjections({ data }: { data: Report["detailed_projections"] }) {
  if (!data || data.revenues.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-accent" /> Detailed Projections
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-muted border-b border-border">
              <th className="text-left pb-2 pr-4 capitalize">{data.periodType}</th>
              <th className="text-right pb-2 pr-4">Revenue (₹ Cr)</th>
              <th className="text-right pb-2">Expenses (₹ Cr)</th>
            </tr>
          </thead>
          <tbody>
            {data.revenues.map((rev, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-4 text-text-secondary">{i + 1}</td>
                <td className="py-2 pr-4 text-right font-mono text-green-400">{rev.toFixed(2)}</td>
                <td className="py-2 text-right font-mono text-red-400">{(data.expenses[i] ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Export PDF placeholder ────────────────────────────────────────────────────
function ExportPDFButton() {
  return (
    <Button variant="secondary" size="sm" leftIcon={<FileDown className="w-4 h-4" />}>
      Export Report PDF
    </Button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FinanceReport({ report, tier }: FinanceReportProps) {
  const isLocked = tier !== "paid";
  const roiPositive = report.roi_percent >= 0;

  return (
    <div className="space-y-6">
      {/* ── Always-visible metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue"
          value={fmt(report.total_revenue)}
          icon={DollarSign}
          color="#22C55E"
        />
        <MetricCard
          label="Net Revenue"
          value={fmtSigned(report.net_revenue)}
          sub={report.net_revenue >= 0 ? "Profitable" : "Loss"}
          icon={report.net_revenue >= 0 ? TrendingUp : TrendingDown}
          color={report.net_revenue >= 0 ? "#22C55E" : "#EF4444"}
        />
        <MetricCard
          label="Break-even"
          value={fmt(report.break_even)}
          sub="Capital to recover"
          icon={Target}
          color="#F59E0B"
        />
        <MetricCard
          label="ROI"
          value={`${report.roi_percent.toFixed(1)}%`}
          sub={roiPositive ? "Return on investment" : "Loss on investment"}
          icon={roiPositive ? TrendingUp : TrendingDown}
          color={roiPositive ? "#22C55E" : "#EF4444"}
        />
      </div>

      {/* ── Verdict ── */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border">
        <VerdictBadge
          verdict={report.verdict}
          label={report.verdict_label}
          color={report.verdict_color}
        />
        <p className="text-sm text-text-secondary">
          {report.verdict === "STRONG_BUY"
            ? "All key indicators are positive. This project merits investment."
            : report.verdict === "HIGH_RISK"
            ? "Multiple indicators signal risk. Revisit budget and projections before proceeding."
            : "Mixed signals — project may be viable but carries risk."}
        </p>
      </div>

      {/* ── Locked section ── */}
      <LockedOverlay locked={isLocked}>
        <div className="space-y-6 p-1">
          <TerritoryBreakdown  territory={report.territory_breakdown}    />
          <InvestorAnalysis    data={report.investor_analysis}           />
          <DetailedProjections data={report.detailed_projections}        />
          <ExportPDFButton />
        </div>
      </LockedOverlay>

      {/* Trial notice */}
      {tier === "trial" && (
        <p className="text-xs text-text-muted text-center">
          This was your 1 free Finance Studio report. Upgrade to Pro for unlimited reports with full details.
        </p>
      )}
    </div>
  );
}
