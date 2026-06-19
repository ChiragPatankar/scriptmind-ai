import type { SceneAnalysisReport, SceneRow } from "@/lib/mock/scene-analyse";
import { EMOTION_META } from "@/lib/emotions";

/**
 * Lightweight text PDF of the scene-by-scene report (no DOM capture). Client-only.
 */
export async function exportSceneReportPDF(report: SceneAnalysisReport): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 22;
  const margin = 20;
  const maxW = 170;
  const step = (n: number) => {
    y += n;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  };

  const heading = (t: string, size = 14) => {
    doc.setFontSize(size);
    doc.text(t, margin, y);
    step(size * 0.5 + 2);
  };

  const body = (t: string, size = 10) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(t, maxW);
    doc.text(lines, margin, y);
    step(lines.length * 4.2 + 2);
  };

  const topEmotions = (row: SceneRow): string => {
    const spectrum = row.emotion_spectrum;
    if (!spectrum) return "—";
    const top = Object.entries(spectrum)
      .filter(([, v]) => (Number(v) || 0) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 4)
      .map(([k, v]) => `${EMOTION_META[k]?.label ?? k} ${(Number(v) * 100).toFixed(0)}%`);
    return top.length ? top.join(", ") : "—";
  };

  heading("ScriptMind AI - Scene-by-Scene Report", 16);
  body(`Script: ${report.script_title}`);
  body(
    `${report.scene_count} scenes - ${report.batch_count} AI batches - pacing consistency ${report.pacing_consistency}/10`
  );
  step(4);

  heading("Strongest scenes", 12);
  if (report.strongest_scenes.length === 0) body("None.");
  else
    report.strongest_scenes.forEach((s) =>
      body(`#${s.scene_number} ${s.heading} (${s.composite_score.toFixed(1)})`)
    );
  step(2);

  heading("Weakest scenes", 12);
  if (report.weakest_scenes.length === 0) body("None.");
  else
    report.weakest_scenes.forEach((s) =>
      body(`#${s.scene_number} ${s.heading} (${s.composite_score.toFixed(1)})`)
    );
  step(4);

  heading("Scene breakdown", 12);
  report.scenes.forEach((row) => {
    heading(`Scene ${row.scene_number} - ${row.heading}`, 11);
    body(
      `Emotion ${row.emotion_score.toFixed(1)} | Pacing ${row.pacing_score.toFixed(1)} | ` +
        `Conflict ${row.conflict_score.toFixed(1)} | Dialogue ${row.dialogue_quality.toFixed(1)} | ` +
        `Composite ${row.composite_score.toFixed(1)}`
    );
    body(`Pages ${row.estimated_pages} | Dialogue ${row.dialogue_pct}% | Location ${row.location || "-"}`);
    body(`Emotions: ${topEmotions(row)}`);
    if (row.rewrite_suggestions.length > 0) {
      row.rewrite_suggestions.forEach((s) => body(`- ${s}`));
    }
    step(2);
  });

  doc.save(`scriptmind-scene-report-${Date.now()}.pdf`);
}
