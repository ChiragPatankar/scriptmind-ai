"use client";

/**
 * InvestorReport
 * ──────────────
 * A self-contained, printable one-page financial summary for investor decks.
 *
 * Rules for html2canvas compatibility:
 *   • ALL styles are inline (no Tailwind, no CSS variables)
 *   • Background is always white (#ffffff)
 *   • Colors are hardcoded hex values
 *   • No Framer Motion / external animations
 *   • The component is rendered off-screen (position:absolute, left:-9999px)
 *     and captured with html2canvas, then removed.
 */

import React from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { computeMetrics, territoryRemaining, type TerritoryConfig } from "@/lib/financial-store";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ReportData {
  filmTitle: string;
  date: string;
  metrics: ReturnType<typeof computeMetrics>;
  totalCollections: number;
  territory: TerritoryConfig;
}

// ── Design tokens (hardcoded for print / html2canvas) ─────────────────────────

const C = {
  blue:   "#1D77C5",
  cyan:   "#00C2E0",
  gold:   "#F59E0B",
  green:  "#22C55E",
  purple: "#A78BFA",
  red:    "#EF4444",
  muted:  "#6B7280",
  border: "#E5E7EB",
  bg:     "#F9FAFB",
  text:   "#111827",
  sub:    "#4B5563",
};

const BUDGET_COLORS  = [C.blue, C.cyan, C.gold, C.purple];
const REVENUE_COLORS = [C.green, C.blue, C.gold, C.muted];

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₹${Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} Cr`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function roiColor(roi: number) {
  if (roi < 0)  return C.red;
  if (roi < 50) return C.gold;
  return C.green;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 14, paddingBottom: 8,
        borderBottom: `2px solid ${C.border}`,
      }}>
        <div style={{
          width: 4, height: 18, borderRadius: 2,
          background: C.blue, flexShrink: 0,
        }} />
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: C.sub,
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function KPITile({
  label, value, color, sub,
}: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${color}30`,
      borderRadius: 12,
      padding: "14px 16px",
      flex: 1,
      minWidth: 0,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 6,
        textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

function InsightPill({
  severity, title, body,
}: { severity: "green" | "yellow" | "red"; title: string; body: string }) {
  const colors = {
    green:  { border: "#16a34a30", bg: "#f0fdf4", icon: "✓", text: "#15803d" },
    yellow: { border: "#d9770630", bg: "#fffbeb", icon: "!", text: "#b45309" },
    red:    { border: "#dc262630", bg: "#fef2f2", icon: "✕", text: "#dc2626" },
  };
  const cfg = colors[severity];
  return (
    <div style={{
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
      borderRadius: 10,
      padding: "10px 14px",
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
    }}>
      <span style={{ color: cfg.text, fontWeight: 900, fontSize: 13, flexShrink: 0, marginTop: 1 }}>
        {cfg.icon}
      </span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: cfg.text, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 10, color: C.sub, lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

// ── ROI gauge (pure SVG, no animation — for static capture) ───────────────────

function StaticROIGauge({ roi }: { roi: number }) {
  const min = -100, max = 200;
  const clamped    = Math.max(min, Math.min(max, roi));
  const normalized = (clamped - min) / (max - min);
  const W = 260, H = 155, CX = 130, CY = 130, R = 96;

  const totalArc = Math.PI * R;
  const dashOffset = totalArc * (1 - normalized);

  const angleDeg = 180 - normalized * 180;
  const rad = (angleDeg * Math.PI) / 180;
  const nx = CX + R * Math.cos(rad);
  const ny = CY - R * Math.sin(rad);

  const arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
  const color = roiColor(roi);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}
      style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id="rpg" gradientUnits="userSpaceOnUse"
          x1={CX - R} y1={CY} x2={CX + R} y2={CY}>
          <stop offset="0%"    stopColor="#EF4444" />
          <stop offset="33.3%" stopColor="#F59E0B" />
          <stop offset="55%"   stopColor="#84CC16" />
          <stop offset="100%"  stopColor="#22C55E" />
        </linearGradient>
      </defs>
      {/* track */}
      <path d={arcPath} fill="none" stroke="#E5E7EB" strokeWidth="10" strokeLinecap="round" />
      {/* value arc */}
      <path d={arcPath} fill="none" stroke="url(#rpg)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={totalArc} strokeDashoffset={dashOffset} />
      {/* needle */}
      <circle cx={nx} cy={ny} r={6} fill="white" stroke={color} strokeWidth="2.5" />
      {/* value text */}
      <text x={CX} y={CY - 30} textAnchor="middle"
        fill={color} fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif">
        {roi.toFixed(1)}%
      </text>
      <text x={CX} y={CY - 10} textAnchor="middle"
        fill={C.sub} fontSize="9" fontFamily="Inter, sans-serif">
        Return on Investment
      </text>
      {/* labels */}
      <text x={CX - R + 4} y={CY + 16} textAnchor="start"
        fill={C.muted} fontSize="8" fontFamily="Inter, sans-serif">−100%</text>
      <text x={CX + R - 4} y={CY + 16} textAnchor="end"
        fill={C.muted} fontSize="8" fontFamily="Inter, sans-serif">+200%</text>
    </svg>
  );
}

// ── Main report component ──────────────────────────────────────────────────────

export const InvestorReport = React.forwardRef<HTMLDivElement, ReportData>(
  function InvestorReport({ filmTitle, date, metrics, totalCollections, territory }, ref) {
    const m = metrics;

    // ── Budget pie data ──
    const budgetPie = [
      { name: "Pre-Production",  value: +m.preProduction.toFixed(2)  },
      { name: "Post-Production", value: +m.postProduction.toFixed(2) },
      { name: "Production",      value: +m.production.toFixed(2)     },
      { name: "Contingency",     value: +m.contingency.toFixed(2)    },
    ];

    // ── Revenue pie data ──
    const revenuePie = [
      { name: "Exhibitor",   value: +m.exhibitorShare.toFixed(2)   },
      { name: "Distributor", value: +m.distributorShare.toFixed(2) },
      { name: "Investor",    value: +m.investorShare.toFixed(2)    },
      { name: "P&A",         value: +m.paShare.toFixed(2)          },
    ];

    // ── Bar data ──
    const barData = [
      { name: "Budget",    Budget: m.totalBudget,     Revenue: 0                },
      { name: "Investment",Budget: m.totalInvestment,  Revenue: 0                },
      { name: "Net Rev.",  Budget: 0,                  Revenue: m.netRevenue     },
      { name: "Box Office",Budget: 0,                  Revenue: totalCollections },
    ];

    // ── Territory data ──
    const remaining = territoryRemaining(territory);
    const terrData = [
      { name: "Hindi Belt",  value: +(territory.hindiDomesticPct   / 100 * totalCollections).toFixed(2) },
      { name: "South India", value: +(territory.southIndiaPct      / 100 * totalCollections).toFixed(2) },
      { name: "Overseas",    value: +(territory.overseasPct        / 100 * totalCollections).toFixed(2) },
      { name: "OTT Rights",  value: +(territory.ottRightsPct       / 100 * totalCollections).toFixed(2) },
      { name: "Satellite",   value: +(territory.satelliteRightsPct / 100 * totalCollections).toFixed(2) },
      { name: "Music",       value: +(territory.musicRightsPct     / 100 * totalCollections).toFixed(2) },
      { name: "Other",       value: +(remaining                    / 100 * totalCollections).toFixed(2) },
    ].filter(d => d.value > 0);

    const terrColors = [C.blue, C.cyan, C.green, C.purple, C.gold, "#F97316", C.muted];

    // ── Insights ──
    type Sev = "green" | "yellow" | "red";
    const insights: { severity: Sev; title: string; body: string }[] = [];
    if (m.roi >= 30)
      insights.push({ severity: "green",  title: "Strong ROI",             body: `ROI of ${fmtPct(m.roi)} — healthy, profitable project.` });
    else if (m.roi >= 0)
      insights.push({ severity: "yellow", title: "Low-margin Project",      body: `ROI of ${fmtPct(m.roi)} — break-even margins are thin.` });
    else
      insights.push({ severity: "red",    title: "Loss Projected",          body: `ROI is ${fmtPct(m.roi)} — revise budget or revenue targets.` });

    if (m.efficiencyRatio >= 3)
      insights.push({ severity: "green",  title: "Marketing Efficient",     body: `Efficiency ratio ${m.efficiencyRatio.toFixed(2)}× — excellent ROI on marketing.` });
    else if (m.efficiencyRatio >= 2)
      insights.push({ severity: "yellow", title: "Average Marketing Efficiency", body: `Ratio ${m.efficiencyRatio.toFixed(2)}× — acceptable but improvable.` });
    else if (m.efficiencyRatio > 0)
      insights.push({ severity: "red",    title: "Marketing Over-spending", body: `Ratio ${m.efficiencyRatio.toFixed(2)}× — marketing spend disproportionate to collections.` });

    if (totalCollections >= m.totalBudget * 1.5)
      insights.push({ severity: "green",  title: "Strong Box Office",       body: `Collections (${fmt(totalCollections)}) well exceed total budget.` });
    else if (totalCollections >= m.totalBudget)
      insights.push({ severity: "yellow", title: "Narrow Box Office Margin",body: `Collections barely cover total budget.` });
    else
      insights.push({ severity: "red",    title: "Collections Below Budget",body: `Box office ${fmt(totalCollections)} < budget ${fmt(m.totalBudget)}.` });

    // ── Shared inline styles ──
    const page: React.CSSProperties = {
      width: 794,          // A4 width in px at 96 dpi
      minHeight: 1123,     // A4 height
      background: "#ffffff",
      fontFamily: "Inter, Arial, sans-serif",
      color: C.text,
      padding: "36px 48px",
      boxSizing: "border-box",
      fontSize: 12,
      lineHeight: 1.5,
    };

    return (
      <div ref={ref} style={page}>

        {/* ── Cover header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 28, paddingBottom: 20,
          borderBottom: `3px solid ${C.blue}`,
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
              textTransform: "uppercase", color: C.blue, marginBottom: 6 }}>
              ScriptMind AI · Film Finance Report
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: "-0.5px" }}>
              {filmTitle || "Untitled Film"}
            </div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>
              Investor Financial Summary · Generated {date}
            </div>
          </div>
          <div style={{
            background: m.roi >= 20 ? "#f0fdf4" : m.roi >= 0 ? "#fffbeb" : "#fef2f2",
            border: `2px solid ${roiColor(m.roi)}40`,
            borderRadius: 12,
            padding: "10px 18px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted,
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Verdict
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: roiColor(m.roi) }}>
              {m.roi >= 20 ? "Profitable" : m.roi >= 0 ? "Break-even" : "Loss Risk"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: roiColor(m.roi), marginTop: 2 }}>
              {fmtPct(m.roi)} ROI
            </div>
          </div>
        </div>

        {/* ── KPI row ── */}
        <Section title="Key Performance Indicators">
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <KPITile label="Total Budget"    value={fmt(m.totalBudget)}       color={C.blue}            sub="All line items"         />
            <KPITile label="Box Office"      value={fmt(totalCollections)}    color={C.green}           sub="Gross collections"      />
            <KPITile label="Net Revenue"     value={fmt(m.netRevenue)}        color={m.netRevenue >= m.totalInvestment ? C.green : C.gold} sub="After distributor & P&A" />
            <KPITile label="Total Investment"value={fmt(m.totalInvestment)}   color={C.blue}            sub="Production + Marketing" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <KPITile label="Break-even"      value={fmt(m.breakEven)}         color={C.purple}          sub="= Total Investment"     />
            <KPITile label="Efficiency Ratio"value={`${m.efficiencyRatio.toFixed(2)}×`} color={m.efficiencyRatio >= 3 ? C.green : m.efficiencyRatio >= 2 ? C.gold : C.red} sub={m.efficiencyLabel} />
            <KPITile label="Investor Return" value={fmt(m.investorNet)}       color={C.cyan}            sub="Net to investor"        />
            <KPITile label="NPV"             value={`${m.npv >= 0 ? "+" : "−"}${fmt(Math.abs(m.npv))}`} color={m.npv >= 0 ? C.green : C.red} sub="Discounted cash flow" />
          </div>
        </Section>

        {/* ── Charts row: pies + bar ── */}
        <Section title="Financial Breakdown">
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Budget pie */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 8,
                textTransform: "uppercase", letterSpacing: "0.08em" }}>Budget Breakdown</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={budgetPie} cx="50%" cy="50%" outerRadius={62} dataKey="value"
                    labelLine={false}>
                    {budgetPie.map((_, i) => <Cell key={i} fill={BUDGET_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v as number)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", marginTop: 6 }}>
                {budgetPie.map((d, i) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: BUDGET_COLORS[i], flexShrink: 0 }} />
                    <span style={{ color: C.sub }}>{d.name}</span>
                    <span style={{ fontWeight: 700, color: C.text, marginLeft: "auto" }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue pie */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 8,
                textTransform: "uppercase", letterSpacing: "0.08em" }}>Revenue Split</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={revenuePie} cx="50%" cy="50%" innerRadius={30} outerRadius={62}
                    dataKey="value" labelLine={false}>
                    {revenuePie.map((_, i) => <Cell key={i} fill={REVENUE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v as number)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", marginTop: 6 }}>
                {revenuePie.map((d, i) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: REVENUE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ color: C.sub }}>{d.name}</span>
                    <span style={{ fontWeight: 700, color: C.text, marginLeft: "auto" }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI gauge */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 8,
                textTransform: "uppercase", letterSpacing: "0.08em", alignSelf: "flex-start" }}>ROI Gauge</div>
              <StaticROIGauge roi={m.roi} />
            </div>
          </div>
        </Section>

        {/* ── Budget vs Revenue bar ── */}
        <Section title="Budget vs Revenue">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${v}Cr`} tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v) => fmt(v as number)} />
              <Bar dataKey="Budget"  fill={C.blue}  radius={[4, 4, 0, 0]} name="Budget" />
              <Bar dataKey="Revenue" fill={C.green} radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* ── Territory breakdown ── */}
        {terrData.length > 0 && (
          <Section title="Territory Revenue Breakdown">
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ flex: "0 0 200px" }}>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={terrData} cx="50%" cy="50%" innerRadius={28} outerRadius={60}
                      dataKey="value" labelLine={false}>
                      {terrData.map((_, i) => <Cell key={i} fill={terrColors[i % terrColors.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", alignContent: "start", paddingTop: 16 }}>
                {terrData.map((d, i) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: terrColors[i % terrColors.length], flexShrink: 0 }} />
                    <span style={{ color: C.sub, flex: 1 }}>{d.name}</span>
                    <span style={{ fontWeight: 700, color: C.text, tabularNums: true } as React.CSSProperties}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ── Risk & Insights ── */}
        <Section title="Risk Assessment &amp; Insights">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {insights.map((ins, i) => (
              <InsightPill key={i} {...ins} />
            ))}
          </div>
        </Section>

        {/* ── Footer ── */}
        <div style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 9,
          color: C.muted,
        }}>
          <span>Generated by ScriptMind AI · Film Finance Studio</span>
          <span>Confidential · For investor use only</span>
          <span>{date}</span>
        </div>

      </div>
    );
  }
);
