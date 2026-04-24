"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Activity } from "lucide-react";
import type { EmotionalTimelinePoint } from "@/lib/mock/analyse-script";

const TIP_STYLE = {
  backgroundColor: "rgb(18 18 28)",
  border: "1px solid rgb(42 42 58)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "rgb(200 200 220)",
  padding: "8px 12px",
};

const EMOTIONS: { key: keyof EmotionalTimelinePoint; label: string; color: string }[] = [
  { key: "joy",       label: "Joy",       color: "#FDE68A" },
  { key: "fear",      label: "Fear",      color: "#EF4444" },
  { key: "anger",     label: "Anger",     color: "#F97316" },
  { key: "sadness",   label: "Sadness",   color: "#60A5FA" },
  { key: "surprise",  label: "Surprise",  color: "#A78BFA" },
  { key: "excitement",label: "Excitement",color: "#34D399" },
  { key: "anxiety",   label: "Anxiety",   color: "#F472B6" },
];

export function EmotionalTimelineSection({
  timeline,
}: {
  timeline: EmotionalTimelinePoint[];
}) {
  const [activeEmotions, setActiveEmotions] = useState<Set<string>>(
    new Set(["joy", "fear", "sadness", "excitement"])
  );

  const presentEmotions = useMemo(
    () => EMOTIONS.filter((e) => timeline.some((pt) => pt[e.key] !== undefined && pt[e.key] !== 0)),
    [timeline]
  );

  const toggle = (key: string) =>
    setActiveEmotions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });

  if (!timeline.length) {
    return (
      <section className="rounded-2xl border border-border/80 bg-surface/60 p-6 text-center text-sm text-text-muted">
        No emotional timeline data returned for this script.
      </section>
    );
  }

  return (
    <section aria-labelledby="emo-timeline-heading">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <Activity className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h2 id="emo-timeline-heading" className="text-lg font-bold text-text-primary">
            Emotional timeline
          </h2>
          <p className="text-xs text-text-muted">Emotion intensity (0–1) across scenes — time progression</p>
        </div>
      </div>

      {/* Emotion toggles */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(presentEmotions.length ? presentEmotions : EMOTIONS).map(({ key, label, color }) => {
          const active = activeEmotions.has(key as string);
          return (
            <button
              key={key as string}
              type="button"
              onClick={() => toggle(key as string)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 border ${
                active
                  ? "border-transparent text-background"
                  : "border-border/60 text-text-muted bg-transparent hover:border-border"
              }`}
              style={active ? { backgroundColor: color, borderColor: color } : {}}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: active ? "rgba(255,255,255,0.6)" : color }}
              />
              {label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/80 bg-surface/60 p-4 sm:p-5">
        <div className="h-[300px] sm:h-[360px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="scene"
                label={{ value: "Scene", position: "insideBottomRight", offset: -5, fill: "rgb(138 138 160)", fontSize: 11 }}
                tick={{ fill: "rgb(138 138 160)", fontSize: 11 }}
                axisLine={{ stroke: "rgb(42 42 58)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tickCount={6}
                tick={{ fill: "rgb(138 138 160)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip
                contentStyle={TIP_STYLE}
                formatter={(val, name) => [Number(val).toFixed(2), name]}
                labelFormatter={(l) => `Scene ${l}`}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-text-secondary text-xs">{value}</span>
                )}
              />
              {EMOTIONS.filter((e) => activeEmotions.has(e.key as string)).map(({ key, label, color }) => (
                <Line
                  key={key as string}
                  type="monotone"
                  dataKey={key as string}
                  name={label}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
