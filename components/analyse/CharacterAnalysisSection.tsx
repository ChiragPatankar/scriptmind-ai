"use client";

import React, { useMemo } from "react";
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildEmotionalArcRows, recordsToPieData } from "@/components/analyse/analyse-chart-data";

const PALETTE = ["#A78BFA", "#1D77C5", "#34D399", "#F59E0B", "#EC4899", "#06B6D4"];

const TIP_STYLE = {
  backgroundColor: "rgb(18 18 28)",
  border: "1px solid rgb(42 42 58)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "rgb(200 200 220)",
  padding: "8px 12px",
};

function ChartCard({
  title, hint, children, className,
}: {
  title: string; hint?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border/80 bg-surface-2/40 p-4 sm:p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        {hint && <p className="text-[11px] text-text-muted mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function DonutWithLegend({
  data, formatter,
}: {
  data: { name: string; value: number }[];
  formatter: (v: number) => string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="rgb(18 18 28)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [formatter(Number(v)), "Share"]}
              contentStyle={TIP_STYLE}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            {entry.name}
            <span className="text-text-muted">{formatter(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CharacterAnalysisSection({
  screenTime,
  dialogueShare,
  emotionalArcs,
  actLabels,
}: {
  screenTime: Record<string, number>;
  dialogueShare: Record<string, number>;
  emotionalArcs: Record<string, number[]>;
  actLabels: string[];
}) {
  const screenPie   = useMemo(() => recordsToPieData(screenTime), [screenTime]);
  const dialoguePie = useMemo(() => recordsToPieData(dialogueShare), [dialogueShare]);
  const lineData    = useMemo(() => buildEmotionalArcRows(emotionalArcs, actLabels), [emotionalArcs, actLabels]);
  const charKeys    = useMemo(() => Object.keys(emotionalArcs), [emotionalArcs]);

  return (
    <section aria-labelledby="char-analysis-heading">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)" }}>
          <Users className="w-4 h-4 text-purple-300" />
        </div>
        <div>
          <h2 id="char-analysis-heading" className="text-lg font-bold text-text-primary">Character analysis</h2>
          <p className="text-xs text-text-muted">Screen time, dialogue share, and emotional trajectory per character</p>
        </div>
      </div>

      <Card variant="default" className="border-border/80 overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/60">
          <CardTitle className="text-base">Screen time &amp; dialogue share</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Screen time %"
              hint="Estimated presence across sluglines and scene headers"
            >
              <DonutWithLegend
                data={screenPie}
                formatter={(v) => `${v}%`}
              />
            </ChartCard>

            <ChartCard
              title="Dialogue share %"
              hint="Lines attributed to each character (approximate)"
            >
              <DonutWithLegend
                data={dialoguePie}
                formatter={(v) => `${v}%`}
              />
            </ChartCard>
          </div>

          {charKeys.length > 0 && (
            <ChartCard
              title="Character emotional arcs"
              hint="Audience empathy / tension tied to each character across story beats"
              className="bg-surface-2/20"
            >
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="beat"
                      tick={{ fill: "rgb(138 138 160)", fontSize: 11 }}
                      axisLine={{ stroke: "rgb(42 42 58)" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fill: "rgb(138 138 160)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={TIP_STYLE}
                      formatter={(v) => [Number(v).toFixed(1), "Intensity"]}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-text-secondary text-xs">{value}</span>
                      )}
                    />
                    {charKeys.map((key, i) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={key}
                        stroke={PALETTE[i % PALETTE.length]}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: PALETTE[i % PALETTE.length], strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
