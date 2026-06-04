"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, Clapperboard, Star, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SceneAnalysisReport, SceneRow } from "@/lib/mock/scene-analyse";

const TIP_STYLE = {
  backgroundColor: "rgb(18 18 28)",
  border: "1px solid rgb(42 42 58)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "rgb(200 200 220)",
};

function scoreColor(v: number): string {
  if (v >= 7.5) return "text-green-400";
  if (v >= 5) return "text-amber-400";
  return "text-red-400";
}

export function SceneBySceneDashboard({
  report,
  onAnalyseAnother,
}: {
  report: SceneAnalysisReport;
  onAnalyseAnother: () => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const curveData = useMemo(
    () =>
      report.emotional_curve.map((p) => ({
        scene: p.scene,
        emotion: p.emotion,
      })),
    [report.emotional_curve]
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-border/60 pb-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">
            Scene-by-scene analysis
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary">
            {report.script_title}
          </h1>
          <p className="text-sm text-text-muted mt-2">
            {report.scene_count} scenes · {report.batch_count} AI batches · pacing consistency{" "}
            {report.pacing_consistency}/10
          </p>
        </div>
        <Button variant="secondary" onClick={onAnalyseAnother} className="gap-2 shrink-0">
          <RefreshCw className="w-4 h-4" />
          Analyse another
        </Button>
      </header>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-green-500/25 bg-green-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-bold text-text-primary">Strongest scenes</h3>
          </div>
          <ul className="space-y-2">
            {report.strongest_scenes.map((s) => (
              <li key={s.scene_number} className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">#{s.scene_number}</span>{" "}
                {s.heading}
                <span className={`ml-2 ${scoreColor(s.composite_score)}`}>
                  {s.composite_score.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-text-primary">Weakest scenes</h3>
          </div>
          <ul className="space-y-2">
            {report.weakest_scenes.map((s) => (
              <li key={s.scene_number} className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">#{s.scene_number}</span>{" "}
                {s.heading}
                <span className={`ml-2 ${scoreColor(s.composite_score)}`}>
                  {s.composite_score.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Emotional curve */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-red-400" />
          <h2 className="text-lg font-bold text-text-primary">Emotional curve</h2>
        </div>
        <div className="rounded-2xl border border-border/80 bg-surface/60 p-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="scene" tick={{ fill: "rgb(138 138 160)", fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "rgb(138 138 160)", fontSize: 11 }} />
              <Tooltip contentStyle={TIP_STYLE} labelFormatter={(l) => `Scene ${l}`} />
              <Line type="monotone" dataKey="emotion" stroke="#F472B6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Scene table */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clapperboard className="w-4 h-4 text-accent" />
          <h2 className="text-lg font-bold text-text-primary">All scenes</h2>
        </div>
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2 text-left text-xs text-text-muted uppercase tracking-wider">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Heading</th>
                  <th className="px-4 py-3">Pages</th>
                  <th className="px-4 py-3">Dialogue %</th>
                  <th className="px-4 py-3">Emotion</th>
                  <th className="px-4 py-3">Pacing</th>
                  <th className="px-4 py-3">Conflict</th>
                  <th className="px-4 py-3">Dialogue</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {report.scenes.map((row: SceneRow) => (
                  <React.Fragment key={row.scene_number}>
                    <tr
                      className="border-t border-border/60 hover:bg-surface-2/50 cursor-pointer"
                      onClick={() =>
                        setExpanded(expanded === row.scene_number ? null : row.scene_number)
                      }
                    >
                      <td className="px-4 py-3 font-mono text-text-muted">{row.scene_number}</td>
                      <td className="px-4 py-3 text-text-primary max-w-[200px] truncate">
                        {row.heading}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{row.estimated_pages}</td>
                      <td className="px-4 py-3 text-text-secondary">{row.dialogue_pct}%</td>
                      <td className={`px-4 py-3 ${scoreColor(row.emotion_score)}`}>
                        {row.emotion_score.toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 ${scoreColor(row.pacing_score)}`}>
                        {row.pacing_score.toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 ${scoreColor(row.conflict_score)}`}>
                        {row.conflict_score.toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 ${scoreColor(row.dialogue_quality)}`}>
                        {row.dialogue_quality.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-accent text-xs">Details</td>
                    </tr>
                    {expanded === row.scene_number && (
                      <tr className="border-t border-border/40 bg-surface-2/30">
                        <td colSpan={9} className="px-4 py-4">
                          <p className="text-xs text-text-muted mb-2">
                            Characters: {row.characters.join(", ") || "—"} · Location:{" "}
                            {row.location || "—"}
                          </p>
                          {row.rewrite_suggestions.length > 0 ? (
                            <ul className="list-disc pl-5 text-sm text-text-secondary space-y-1">
                              {row.rewrite_suggestions.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-text-muted italic">No rewrite suggestions.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
