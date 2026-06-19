"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Clapperboard,
  Star,
  AlertTriangle,
  RefreshCw,
  FileDown,
  Smile,
  Users,
  MapPin,
  FileText,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import type { SceneAnalysisReport, SceneRow, SceneHighlight } from "@/lib/mock/scene-analyse";
import { EMOTION_META } from "@/lib/emotions";
import { exportSceneReportPDF } from "@/lib/exportSceneAnalysePDF";

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

/** Per-scene 27-emotion spectrum — horizontal bars of the emotions present in a scene. */
function SceneEmotionSpectrum({ spectrum }: { spectrum?: Record<string, number> }) {
  const data = useMemo(() => {
    if (!spectrum) return [];
    return Object.entries(spectrum)
      .map(([key, value]) => ({
        key,
        label: EMOTION_META[key]?.label ?? key,
        color: EMOTION_META[key]?.color ?? "#8B5CF6",
        value: Number(value) || 0,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [spectrum]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Smile className="w-3.5 h-3.5 text-violet-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Emotion spectrum
        </h4>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-text-muted italic">No emotion signal for this scene.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.slice(0, 4).map((d) => (
              <span
                key={d.key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                style={{ borderColor: `${d.color}40`, backgroundColor: `${d.color}12`, color: d.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.label}
              </span>
            ))}
          </div>
          <div style={{ height: Math.max(120, data.length * 26) }} className="w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 0, right: 44, left: 0, bottom: 0 }}
                barSize={14}
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
                  width={110}
                  tick={{ fill: "rgb(180 180 200)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={TIP_STYLE}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  formatter={(val) => [`${(Number(val) * 100).toFixed(0)}%`, "Intensity"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

/** A clickable strongest/weakest scene entry that opens the scene viewer. */
function HighlightItem({ s, onOpen }: { s: SceneHighlight; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        title="Open scene viewer"
        className="w-full flex items-center gap-2 text-left text-sm text-text-secondary rounded-lg -mx-2 px-2 py-1.5 hover:bg-surface-2/60 transition-colors"
      >
        <span className="font-semibold text-text-primary">#{s.scene_number}</span>
        <span className="flex-1 min-w-0 truncate">{s.heading}</span>
        <span className={`flex-shrink-0 font-medium ${scoreColor(s.composite_score)}`}>
          {s.composite_score.toFixed(1)}
        </span>
      </button>
    </li>
  );
}

/** A single labelled score chip used inside the scene viewer. */
function ScoreStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface-2/40 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
        {label}
      </p>
      <p className={`text-lg font-black ${scoreColor(value)}`}>{value.toFixed(1)}</p>
    </div>
  );
}

/** Full-screen-ish viewer for a single scene: script text + analysis. */
function SceneViewerModal({
  scene,
  onClose,
}: {
  scene: SceneRow | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!scene} onOpenChange={(open) => !open && onClose()}>
      {scene && (
        <ModalContent className="max-w-4xl w-[calc(100vw-2rem)] max-h-[88vh] overflow-hidden flex flex-col p-0">
          <ModalHeader className="pr-14">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary">
              <Clapperboard className="w-3.5 h-3.5" />
              Scene {scene.scene_number}
            </div>
            <ModalTitle className="text-lg sm:text-xl leading-snug">{scene.heading}</ModalTitle>
            <ModalDescription asChild>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                  <MapPin className="w-3.5 h-3.5 text-text-muted" />
                  {scene.location || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                  <Users className="w-3.5 h-3.5 text-text-muted" />
                  {scene.characters.length > 0 ? scene.characters.join(", ") : "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                  <FileText className="w-3.5 h-3.5 text-text-muted" />
                  {scene.estimated_pages} pages · {scene.dialogue_pct}% dialogue
                </span>
              </div>
            </ModalDescription>
          </ModalHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6 pb-4">
            <ScoreStat label="Emotion" value={scene.emotion_score} />
            <ScoreStat label="Pacing" value={scene.pacing_score} />
            <ScoreStat label="Conflict" value={scene.conflict_score} />
            <ScoreStat label="Dialogue" value={scene.dialogue_quality} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6 overflow-y-auto">
            {/* Script text */}
            <div className="min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Scene script
              </h4>
              {scene.content && scene.content.trim() ? (
                <pre className="text-[13px] leading-relaxed text-text-secondary whitespace-pre-wrap break-words font-mono bg-surface-2/40 border border-border/70 rounded-xl p-4 max-h-[46vh] overflow-y-auto">
                  {scene.content}
                </pre>
              ) : (
                <p className="text-sm text-text-muted italic bg-surface-2/40 border border-border/70 rounded-xl p-4">
                  Script text isn&apos;t available for this analysis. Re-run the analysis to view the
                  full scene text here.
                </p>
              )}
            </div>

            {/* Analysis */}
            <div className="min-w-0 space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                  Rewrite suggestions
                </h4>
                {scene.rewrite_suggestions.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-text-secondary space-y-1.5">
                    {scene.rewrite_suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-muted italic">No rewrite suggestions.</p>
                )}
              </div>
              <SceneEmotionSpectrum spectrum={scene.emotion_spectrum} />
            </div>
          </div>
        </ModalContent>
      )}
    </Modal>
  );
}

export function SceneBySceneDashboard({
  report,
  onAnalyseAnother,
}: {
  report: SceneAnalysisReport;
  onAnalyseAnother: () => void;
}) {
  const [selectedScene, setSelectedScene] = useState<SceneRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const handlePdf = async () => {
    setExporting(true);
    try {
      await exportSceneReportPDF(report);
    } finally {
      setExporting(false);
    }
  };

  const sceneByNumber = useMemo(() => {
    const map = new Map<number, SceneRow>();
    for (const s of report.scenes) map.set(s.scene_number, s);
    return map;
  }, [report.scenes]);

  const openScene = (sceneNumber: number) => {
    const row = sceneByNumber.get(sceneNumber);
    if (row) setSelectedScene(row);
  };

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
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="default"
            loading={exporting}
            leftIcon={<FileDown className="w-4 h-4" />}
            onClick={handlePdf}
          >
            Download PDF
          </Button>
          <Button variant="secondary" onClick={onAnalyseAnother} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Analyse another
          </Button>
        </div>
      </header>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-green-500/25 bg-green-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-bold text-text-primary">Strongest scenes</h3>
          </div>
          <ul className="space-y-1">
            {report.strongest_scenes.map((s) => (
              <HighlightItem key={s.scene_number} s={s} onOpen={() => openScene(s.scene_number)} />
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-text-primary">Weakest scenes</h3>
          </div>
          <ul className="space-y-1">
            {report.weakest_scenes.map((s) => (
              <HighlightItem key={s.scene_number} s={s} onOpen={() => openScene(s.scene_number)} />
            ))}
          </ul>
        </div>
      </div>

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
                  <tr
                    key={row.scene_number}
                    className="border-t border-border/60 hover:bg-surface-2/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedScene(row)}
                    title="Open scene viewer"
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
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-accent text-xs font-medium">
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <SceneViewerModal scene={selectedScene} onClose={() => setSelectedScene(null)} />
    </div>
  );
}
