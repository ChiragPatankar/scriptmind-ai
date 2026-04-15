import type { AnalyseScriptReport } from "@/lib/mock/analyse-script";

/**
 * Lightweight text PDF of the analysis (no DOM capture). Client-only.
 */
export async function exportAnalyseReportPDF(
  report: AnalyseScriptReport,
  languageLabel: string
): Promise<void> {
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

  heading("ScriptMind AI — Script Analysis Report", 16);
  body(`Script: ${report.scriptTitle}`);
  body(`Language: ${languageLabel}`);
  step(4);

  heading("Top metrics (0–10)", 12);
  body(
    `Originality ${report.originality} · Hook ${report.hook} · Engagement ${report.engagement} · Emotional ${report.emotional}`
  );
  step(4);

  heading("Improvement tracker", 12);
  body(`Previous ${report.previousScore} → New ${report.newScore}`);
  step(4);

  heading("Similar stories", 12);
  report.similar.forEach((s) => body(`• ${s}`));
  step(4);

  heading("Dialogue", 12);
  body(`Quality score: ${report.dialogueQuality} / 10`);
  if (report.readability != null) {
    body(`Readability index: ${report.readability}`);
  }
  step(4);

  heading("Insights", 12);
  report.insights.forEach((s) => body(`• ${s}`));
  step(4);

  heading("Most impactful scene", 12);
  body(report.bestScene);

  doc.save(`scriptmind-analysis-${Date.now()}.pdf`);
}
