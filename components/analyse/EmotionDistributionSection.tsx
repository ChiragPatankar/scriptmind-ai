"use client";

import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Smile } from "lucide-react";
import type { EmotionDistribution } from "@/lib/mock/analyse-script";

const TIP_STYLE = {
  backgroundColor: "rgb(18 18 28)",
  border: "1px solid rgb(42 42 58)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "rgb(200 200 220)",
  padding: "8px 12px",
};

/** Color and display label for every emotion */
const EMOTION_META: Record<keyof EmotionDistribution, { label: string; color: string }> = {
  admiration:               { label: "Admiration",              color: "#F59E0B" },
  adoration:                { label: "Adoration",               color: "#EC4899" },
  aesthetic_appreciation:   { label: "Aesthetic Apprec.",       color: "#8B5CF6" },
  amusement:                { label: "Amusement",               color: "#10B981" },
  anger:                    { label: "Anger",                   color: "#EF4444" },
  anxiety:                  { label: "Anxiety",                 color: "#F97316" },
  awe:                      { label: "Awe",                     color: "#3B82F6" },
  awkwardness:              { label: "Awkwardness",             color: "#6B7280" },
  boredom:                  { label: "Boredom",                 color: "#9CA3AF" },
  calmness:                 { label: "Calmness",                color: "#06B6D4" },
  confusion:                { label: "Confusion",               color: "#A78BFA" },
  craving:                  { label: "Craving",                 color: "#D97706" },
  disgust:                  { label: "Disgust",                 color: "#65A30D" },
  empathic_pain:            { label: "Empathic Pain",           color: "#F472B6" },
  entrancement:             { label: "Entrancement",            color: "#6366F1" },
  envy:                     { label: "Envy",                    color: "#84CC16" },
  excitement:               { label: "Excitement",              color: "#FBBF24" },
  fear:                     { label: "Fear",                    color: "#DC2626" },
  horror:                   { label: "Horror",                  color: "#7F1D1D" },
  interest:                 { label: "Interest",                color: "#60A5FA" },
  joy:                      { label: "Joy",                     color: "#FDE68A" },
  nostalgia:                { label: "Nostalgia",               color: "#C084FC" },
  relief:                   { label: "Relief",                  color: "#34D399" },
  romance:                  { label: "Romance",                 color: "#F9A8D4" },
  sadness:                  { label: "Sadness",                 color: "#93C5FD" },
  satisfaction:             { label: "Satisfaction",            color: "#86EFAC" },
  sexual_desire:            { label: "Sexual Desire",           color: "#FB7185" },
};

interface ChartRow { label: string; value: number; color: string }

function CustomLabel({ x, y, width, value }: { x?: number; y?: number; width?: number; value?: number }) {
  if (value === undefined || value === 0) return null;
  return (
    <text
      x={(x ?? 0) + (width ?? 0) + 6}
      y={(y ?? 0) + 10}
      fill="rgb(138 138 160)"
      fontSize={10}
      textAnchor="start"
    >
      {value.toFixed(2)}
    </text>
  );
}

export function EmotionDistributionSection({
  distribution,
}: {
  distribution: EmotionDistribution;
}) {
  const chartData = useMemo<ChartRow[]>(() => {
    const rows: ChartRow[] = [];
    for (const [key, meta] of Object.entries(EMOTION_META) as [keyof EmotionDistribution, { label: string; color: string }][]) {
      const val = distribution[key];
      if (val !== undefined && val > 0) {
        rows.push({ label: meta.label, value: val, color: meta.color });
      }
    }
    return rows.sort((a, b) => b.value - a.value);
  }, [distribution]);

  if (!chartData.length) {
    return (
      <section className="rounded-2xl border border-border/80 bg-surface/60 p-6 text-center text-sm text-text-muted">
        No emotion distribution data returned for this script.
      </section>
    );
  }

  const chartHeight = Math.max(320, chartData.length * 32);

  return (
    <section aria-labelledby="emo-dist-heading">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
          <Smile className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h2 id="emo-dist-heading" className="text-lg font-bold text-text-primary">
            Emotion distribution
          </h2>
          <p className="text-xs text-text-muted">Full 27-emotion spectrum — overall intensity across the entire script</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-surface/60 p-4 sm:p-5">
        {/* Top 5 emotion chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {chartData.slice(0, 6).map(({ label, value, color }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
              style={{ borderColor: `${color}40`, backgroundColor: `${color}12`, color }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
              <span className="opacity-70 ml-0.5">{(value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>

        <div style={{ height: chartHeight }} className="w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
              barSize={18}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 1]}
                tickCount={6}
                tick={{ fill: "rgb(138 138 160)", fontSize: 10 }}
                axisLine={{ stroke: "rgb(42 42 58)" }}
                tickLine={false}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={130}
                tick={{ fill: "rgb(180 180 200)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={TIP_STYLE}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                formatter={(val) => [`${(Number(val) * 100).toFixed(1)}%`, "Intensity"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} label={<CustomLabel />}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
