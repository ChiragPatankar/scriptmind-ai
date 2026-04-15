"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildEmotionalArcRows,
  recordsToPieData,
} from "@/components/analyse/analyse-chart-data";
import { cn } from "@/lib/utils";

const PIE_PALETTE = ["#A78BFA", "#1D77C5", "#00C2E0", "#F59E0B", "#EC4899"];
const LINE_STROKES = ["#A78BFA", "#1D77C5", "#00C2E0", "#F59E0B", "#EC4899"];

const tipStyle = {
  backgroundColor: "rgb(26 26 36)",
  border: "1px solid rgb(42 42 58)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "rgb(200 200 220)",
};

function ChartCard({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-surface/60 p-4 sm:p-5",
        className
      )}
    >
      <div className="mb-3">
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        {hint && <p className="text-[11px] text-text-muted mt-0.5">{hint}</p>}
      </div>
      {children}
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
  const screenPie = useMemo(() => recordsToPieData(screenTime), [screenTime]);
  const dialoguePie = useMemo(() => recordsToPieData(dialogueShare), [dialogueShare]);
  const lineData = useMemo(
    () => buildEmotionalArcRows(emotionalArcs, actLabels),
    [emotionalArcs, actLabels]
  );
  const charKeys = useMemo(
    () => Object.keys(emotionalArcs),
    [emotionalArcs]
  );

  return (
    <section aria-labelledby="character-analysis-heading">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
          <Users className="w-4 h-4 text-purple-300" />
        </div>
        <div>
          <h2
            id="character-analysis-heading"
            className="text-lg font-bold text-text-primary"
          >
            Character analysis
          </h2>
          <p className="text-xs text-text-muted">
            Distribution and emotional trajectory by character code (A–C)
          </p>
        </div>
      </div>

      <Card variant="default" className="border-border/80 overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/80">
          <CardTitle className="text-base">Screen & dialogue</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Screen time %"
              hint="Estimated presence across sluglines and scene headers"
            >
              <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={screenPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {screenPie.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_PALETTE[i % PIE_PALETTE.length]}
                          stroke="#2A2A3A"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${Number(v ?? 0)}%`, "Share"]}
                      contentStyle={tipStyle}
                    />
                    <Legend
                      verticalAlign="bottom"
                      formatter={(value) => (
                        <span className="text-text-secondary text-xs">
                          Character {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Dialogue share %"
              hint="Lines attributed to each voice (approximate)"
            >
              <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dialoguePie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {dialoguePie.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_PALETTE[i % PIE_PALETTE.length]}
                          stroke="#2A2A3A"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${Number(v ?? 0)}%`, "Dialogue"]}
                      contentStyle={tipStyle}
                    />
                    <Legend
                      verticalAlign="bottom"
                      formatter={(value) => (
                        <span className="text-text-secondary text-xs">
                          Character {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard
            title="Character emotional arcs"
            hint="Intensity of audience empathy / tension tied to each POV across story beats"
            className="bg-surface-2/40"
          >
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={lineData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgb(42 42 58)"
                    vertical={false}
                  />
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
                    contentStyle={tipStyle}
                    formatter={(v) => [Number(v ?? 0).toFixed(1), "Intensity"]}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-text-secondary text-xs">
                        Character {value}
                      </span>
                    )}
                  />
                  {charKeys.map((key, i) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={key}
                      stroke={LINE_STROKES[i % LINE_STROKES.length]}
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </CardContent>
      </Card>
    </section>
  );
}
