import type { AnalyseScriptReport } from "@/lib/mock/analyse-script";

// ── Colour palette ────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const PURPLE: RGB  = [99,  102, 241];
const PINK:   RGB  = [236, 72,  153];
const GREEN:  RGB  = [16,  185, 129];
const AMBER:  RGB  = [245, 158, 11];
const BLUE:   RGB  = [59,  130, 246];
const VIOLET: RGB  = [139, 92,  246];
const CYAN:   RGB  = [6,   182, 212];
const ROSE:   RGB  = [244, 63,  94];
const TEAL:   RGB  = [20,  184, 166];
const ORANGE: RGB  = [249, 115, 22];

const EMOTION_COLOURS: RGB[] = [PURPLE, PINK, GREEN, AMBER, BLUE, VIOLET, CYAN, ROSE, TEAL, ORANGE];

const PAGE_BG:   RGB = [248, 248, 255];
const DARK_TEXT: RGB = [25,  25,  50];
const MID_TEXT:  RGB = [90,  90,  120];
const LIGHT_TEXT:RGB = [160, 160, 185];
const CARD_BG:   RGB = [255, 255, 255];
const BORDER:    RGB = [220, 220, 235];

/**
 * Fully-formatted, chart-rich PDF report for a ScriptMind AI script analysis.
 */
export async function downloadScriptReport(report: AnalyseScriptReport): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W      = 210;
  const H      = 297;
  const ML     = 14;   // margin left
  const MR     = 14;   // margin right
  const CW     = W - ML - MR;  // content width
  let   y      = 0;

  // ── Utility helpers ───────────────────────────────────────────────────────

  function rgb(r: number, g: number, b: number) { return [r, g, b] as RGB; }
  void rgb; // suppress unused

  function setFill(c: RGB)   { doc.setFillColor(c[0], c[1], c[2]); }
  function setDraw(c: RGB)   { doc.setDrawColor(c[0], c[1], c[2]); }
  function setColor(c: RGB)  { doc.setTextColor(c[0], c[1], c[2]); }

  function card(x: number, cy: number, w: number, h: number, radius = 3) {
    setFill(CARD_BG);
    setDraw(BORDER);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, cy, w, h, radius, radius, "FD");
  }

  function checkBreak(needed = 12) {
    if (y + needed > H - 16) newPage();
  }

  function newPage() {
    addPageFooter();
    addWatermark();
    doc.addPage();
    y = 20;
  }

  function addWatermark() {
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity: 0.04 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(48);
    doc.setTextColor(80, 80, 80);
    for (let i = 0; i < 3; i++) {
      doc.text("ScriptMind AI", 20 + i * 55, 70 + i * 70, { angle: 45 });
    }
    doc.restoreGraphicsState();
  }

  function addPageFooter() {
    const pageNum = doc.getNumberOfPages();
    setFill(PURPLE);
    doc.rect(0, H - 2.5, W, 2.5, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setColor(LIGHT_TEXT);
    doc.text(`ScriptMind AI  ·  AI-Powered Script Intelligence  ·  scriptmindai.in`, ML, H - 5);
    doc.text(`Page ${pageNum}`, W - MR - 6, H - 5);
  }

  // ── Bar chart helper ──────────────────────────────────────────────────────
  // Draws a single horizontal bar with label and value
  function hBar(
    label: string, value: number, maxVal: number,
    bx: number, by: number, bw: number, bh: number,
    color: RGB, showPct = true
  ) {
    const filled = Math.max((value / maxVal) * bw, 0);

    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    setColor(MID_TEXT);
    const shortLabel = label.length > 22 ? label.slice(0, 20) + "…" : label;
    doc.text(shortLabel, bx, by + bh / 2 + 2.5);

    const barX = bx + 48;
    const barW = bw - 48 - 14;

    // Track
    setFill([235, 235, 248]);
    setDraw([235, 235, 248]);
    doc.roundedRect(barX, by, barW, bh, bh / 2, bh / 2, "F");

    // Fill
    if (filled > 0) {
      setFill(color);
      doc.roundedRect(barX, by, Math.max(filled * (barW / bw), 2), bh, bh / 2, bh / 2, "F");
    }

    // Value
    if (showPct) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      setColor(color);
      doc.text(`${Math.round(value)}%`, barX + barW + 2, by + bh / 2 + 2.5);
    }
  }

  // ── Grouped bar chart helper (character screen time + dialogue share) ─────
  function groupedBars(
    labels: string[], series: { label: string; values: number[]; color: RGB }[],
    cx: number, cy: number, cw: number, ch: number
  ) {
    const n       = labels.length;
    const groupW  = cw / n;
    const barW    = Math.min((groupW / series.length) * 0.65, 12);
    const maxVal  = 100;
    const scaleH  = ch - 14; // reserve bottom for labels

    // Y grid lines
    setDraw([230, 230, 245]);
    doc.setLineWidth(0.2);
    [25, 50, 75, 100].forEach((pct) => {
      const ly = cy + scaleH - (pct / maxVal) * scaleH;
      doc.line(cx, ly, cx + cw, ly);
      doc.setFontSize(6);
      setColor(LIGHT_TEXT);
      doc.text(`${pct}`, cx - 6, ly + 1.5);
    });

    labels.forEach((lbl, i) => {
      const gx = cx + i * groupW + (groupW - series.length * barW) / 2;

      series.forEach((s, si) => {
        const val    = s.values[i] ?? 0;
        const filledH = Math.max((val / maxVal) * scaleH, 0.5);
        const bx     = gx + si * barW;
        const by     = cy + scaleH - filledH;

        setFill(s.color);
        doc.roundedRect(bx, by, barW * 0.85, filledH, 0.8, 0.8, "F");
      });

      // X label
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      setColor(MID_TEXT);
      const short = lbl.length > 10 ? lbl.slice(0, 9) + "." : lbl;
      doc.text(short, cx + i * groupW + groupW / 2, cy + scaleH + 6, { align: "center" });
    });

    // Legend
    series.forEach((s, si) => {
      const lx = cx + si * 38;
      setFill(s.color);
      doc.roundedRect(lx, cy + scaleH + 10, 5, 3, 0.5, 0.5, "F");
      doc.setFontSize(6.5);
      setColor(MID_TEXT);
      doc.text(s.label, lx + 7, cy + scaleH + 13);
    });
  }

  // ── Emotional timeline sparkline chart ────────────────────────────────────
  // Values arrive as 0–1 (Gemini normalised range). We scale to chart height.
  function timelineChart(
    timeline: AnalyseScriptReport["emotionalTimeline"],
    cx: number, cy: number, cw: number, ch: number
  ) {
    if (!timeline?.length) return;

    const firstPt     = timeline[0] ?? {};
    const emotionKeys = Object.keys(firstPt).filter((k) => k !== "scene" && firstPt[k] !== undefined);
    if (!emotionKeys.length) return;

    const colours = EMOTION_COLOURS.slice(0, emotionKeys.length);
    const n       = timeline.length;
    const scaleH  = ch - 14;
    const scaleW  = cw;
    const MAX_VAL = 1; // Gemini returns 0–1

    // Y grid (show as percentages)
    setDraw([230, 230, 245]);
    doc.setLineWidth(0.2);
    [0.25, 0.5, 0.75, 1.0].forEach((frac) => {
      const ly = cy + scaleH - frac * scaleH;
      doc.line(cx, ly, cx + scaleW, ly);
      doc.setFontSize(6);
      setColor(LIGHT_TEXT);
      doc.text(`${Math.round(frac * 100)}%`, cx - 10, ly + 1.5);
    });

    // One line per emotion
    emotionKeys.forEach((key, ki) => {
      const color = colours[ki] ?? PURPLE;
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.7);

      let prevX: number | null = null;
      let prevY: number | null = null;

      timeline.forEach((pt, i) => {
        const val = Math.min(MAX_VAL, Math.max(0, pt[key] ?? 0));
        const px  = cx + (i / Math.max(n - 1, 1)) * scaleW;
        const py  = cy + scaleH - (val / MAX_VAL) * scaleH;

        if (prevX !== null && prevY !== null) {
          doc.line(prevX, prevY, px, py);
        }
        prevX = px;
        prevY = py;
      });
    });

    // X-axis label
    doc.setFontSize(6.5);
    setColor(LIGHT_TEXT);
    doc.text("Scene →", cx + scaleW - 12, cy + scaleH + 6);

    // Legend (up to 7 emotions, spread across width)
    const legendSpacing = Math.min(32, scaleW / emotionKeys.length);
    emotionKeys.slice(0, 7).forEach((key, ki) => {
      const color = colours[ki] ?? PURPLE;
      const lx    = cx + ki * legendSpacing;
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(1.2);
      doc.line(lx, cy + scaleH + 11, lx + 7, cy + scaleH + 11);
      doc.setFontSize(6);
      setColor(MID_TEXT);
      doc.text(key.charAt(0).toUpperCase() + key.slice(1), lx + 9, cy + scaleH + 13);
    });
  }

  // ── Emotion distribution ──────────────────────────────────────────────────
  // Values are 0–1 from Gemini. We use maxV for relative scaling and show as %.
  function emotionDistChart(
    dist: AnalyseScriptReport["emotionDistribution"],
    cx: number, cy: number, cw: number
  ) {
    const entries = Object.entries(dist ?? {})
      .filter(([, v]) => v != null && (v as number) > 0)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 12);

    const rowH  = 8;
    const maxV  = Math.max(...entries.map(([, v]) => v as number), 0.01);

    entries.forEach(([emotion, val], i) => {
      const v     = val as number;
      const color = EMOTION_COLOURS[i % EMOTION_COLOURS.length]!;
      const label = emotion.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      // Draw bar scaled to maxV (relative), display as % of 100
      hBar(label, v, maxV, cx, cy + i * rowH, cw, rowH - 1.5, color, false);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      setColor(color);
      // Show as percentage (0–1 → 0–100%)
      doc.text(`${Math.round(v * 100)}%`, cx + cw - 1, cy + i * rowH + rowH / 2 + 1.5, { align: "right" });
    });

    return entries.length * rowH;
  }

  // ── Section header ────────────────────────────────────────────────────────
  function sectionHeader(title: string, subtitle?: string, accent: RGB = PURPLE) {
    checkBreak(16);
    y += 3;
    setFill(accent);
    doc.rect(ML, y, 3, 10, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    setColor(DARK_TEXT);
    doc.text(title, ML + 6, y + 7);
    if (subtitle) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      setColor(LIGHT_TEXT);
      doc.text(subtitle, ML + 6 + doc.getTextWidth(title) + 3, y + 7);
    }
    y += 14;
  }

  function bulletList(items: string[], color: RGB = MID_TEXT) {
    items.slice(0, 8).forEach((item) => {
      checkBreak(7);
      const lines = doc.splitTextToSize(`${item}`, CW - 8);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      setColor(color);
      setFill(color);
      doc.circle(ML + 2, y + 1.5, 0.8, "F");
      doc.text(lines, ML + 5, y + 3);
      y += lines.length * 5 + 2;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ═══════════════════════════════════════════════════════════════════════════

  // Background
  setFill(PAGE_BG);
  doc.rect(0, 0, W, H, "F");

  // Top accent bar
  setFill(PURPLE);
  doc.rect(0, 0, W, 4, "F");

  y = 16;

  // Logo row
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  setColor(PURPLE);
  doc.text("ScriptMind", ML, y);
  setColor(CYAN);
  doc.text("AI", ML + doc.getTextWidth("ScriptMind ") - 1, y);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  setColor(LIGHT_TEXT);
  doc.text("AI-Powered Script Intelligence", ML + 38, y);
  doc.text(`Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, W - MR, y, { align: "right" });

  y += 14;

  // Horizontal rule
  setDraw(BORDER);
  doc.setLineWidth(0.4);
  doc.line(ML, y, W - MR, y);
  y += 10;

  // Script title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  setColor(DARK_TEXT);
  const titleLines = doc.splitTextToSize(report.scriptTitle, CW);
  doc.text(titleLines, ML, y);
  y += titleLines.length * 10 + 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  setColor(MID_TEXT);
  doc.text("Full Script Analysis Report  ·  Powered by Google Gemini AI", ML, y);
  y += 14;

  // ── Overall Score card ──────────────────────────────────────────────────
  const overallScore = Math.round((report.originality + report.hook + report.engagement + report.emotional) / 4);

  card(ML, y, CW, 28, 4);
  // Score
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  setColor(PURPLE);
  doc.text(`${overallScore}`, ML + 8, y + 20);
  doc.setFontSize(13);
  setColor(MID_TEXT);
  doc.text("/100", ML + 8 + doc.getTextWidth(`${overallScore} `) + 1, y + 20);

  // Vertical divider
  setDraw(BORDER);
  doc.setLineWidth(0.3);
  doc.line(ML + 45, y + 5, ML + 45, y + 23);

  // Mini metric pills
  const miniMetrics = [
    { label: "Originality",     val: report.originality,     color: PURPLE },
    { label: "Hook",            val: report.hook,            color: PINK   },
    { label: "Engagement",      val: report.engagement,      color: GREEN  },
    { label: "Emotional Depth", val: report.emotional,       color: AMBER  },
  ];

  const pillW = (CW - 55) / 4;
  miniMetrics.forEach((m, i) => {
    const px = ML + 50 + i * pillW;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    setColor(m.color);
    doc.text(`${m.val}`, px, y + 16, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setColor(LIGHT_TEXT);
    doc.text(m.label, px, y + 23, { align: "center" });
  });

  doc.setFontSize(8.5);
  setColor(MID_TEXT);
  doc.text("Overall Score", ML + 8, y + 26.5);
  y += 36;

  // ── Core metrics bars ───────────────────────────────────────────────────
  sectionHeader("Core Metrics", "Originality, Hook, Engagement & Emotional Depth");

  // dialogueQuality is 0–10, convert to 0–100 for the bar chart
  const dqPct = Math.min(100, Math.round(report.dialogueQuality * 10));
  const rdPct = report.readability != null ? Math.min(100, Math.round(report.readability * 10)) : null;

  const metricsData = [
    { label: "Originality",    val: report.originality, color: PURPLE },
    { label: "Hook Strength",  val: report.hook,        color: PINK   },
    { label: "Engagement",     val: report.engagement,  color: GREEN  },
    { label: "Emotional Depth",val: report.emotional,   color: AMBER  },
    { label: "Dialogue Quality (×10)", val: dqPct,      color: BLUE   },
    ...(rdPct != null ? [{ label: "Readability (×10)", val: rdPct, color: TEAL }] : []),
  ];

  const barsPerRow = 2;
  const barCW = (CW - 6) / barsPerRow;

  metricsData.forEach((m, i) => {
    const col = i % barsPerRow;
    const row = Math.floor(i / barsPerRow);
    if (col === 0 && row > 0) y += 0;
    checkBreak(10);
    hBar(m.label, m.val, 100, ML + col * (barCW + 6), y + row * 10, barCW, 6, m.color);
  });
  y += Math.ceil(metricsData.length / barsPerRow) * 10 + 6;

  // ═══════════════════════════════════════════════════════════════════════════
  // EMOTIONAL TIMELINE
  // ═══════════════════════════════════════════════════════════════════════════

  // Only render timeline if there is meaningful data (at least one non-zero emotion value)
  const hasTimelineData = report.emotionalTimeline?.some((pt) =>
    Object.entries(pt).some(([k, v]) => k !== "scene" && (v ?? 0) > 0)
  );

  if (hasTimelineData) {
    checkBreak(70);
    sectionHeader("Emotional Timeline", "Emotion intensity across scenes (0–100%)");

    const chartH = 55;
    card(ML, y, CW, chartH + 22, 3);
    timelineChart(report.emotionalTimeline, ML + 14, y + 6, CW - 22, chartH);
    y += chartH + 28;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMOTION DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════════════════

  const distEntries = Object.entries(report.emotionDistribution ?? {})
    .filter(([, v]) => v != null && (v as number) > 0);

  if (distEntries.length) {
    checkBreak(80);
    sectionHeader("Emotion Distribution", "Top emotions detected across the screenplay");

    const distH = Math.min(distEntries.length, 12) * 8 + 10;
    card(ML, y, CW, distH, 3);
    emotionDistChart(report.emotionDistribution, ML + 6, y + 6, CW - 12);
    y += distH + 8;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARACTER ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  const characters = Object.keys(report.screenTime ?? {}).slice(0, 8);

  if (characters.length) {
    checkBreak(90);
    sectionHeader("Character Analysis", "Screen time vs dialogue share");

    const chartH = 60;
    card(ML, y, CW, chartH + 22, 3);

    groupedBars(
      characters,
      [
        { label: "Screen Time %",   values: characters.map((c) => report.screenTime[c]    ?? 0), color: PURPLE },
        { label: "Dialogue Share %", values: characters.map((c) => report.dialogueShare[c] ?? 0), color: CYAN   },
      ],
      ML + 10, y + 6, CW - 20, chartH
    );
    y += chartH + 30;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════════

  const insights = report.insights;

  // ── Plot Holes ────────────────────────────────────────────────────────────
  if (insights.plotHoles?.length) {
    checkBreak(30);
    sectionHeader("Plot Issues", `${insights.plotHoles.length} identified`, ROSE);
    bulletList(insights.plotHoles, ROSE);
    y += 4;
  }

  // ── Pacing Issues ─────────────────────────────────────────────────────────
  if (insights.pacingIssues?.length) {
    checkBreak(30);
    sectionHeader("Pacing Issues", `${insights.pacingIssues.length} identified`, ORANGE);
    bulletList(insights.pacingIssues, ORANGE);
    y += 4;
  }

  // ── Weak Characters ───────────────────────────────────────────────────────
  if (insights.weakCharacters?.length) {
    checkBreak(30);
    sectionHeader("Character Weaknesses", `${insights.weakCharacters.length} identified`, AMBER);
    bulletList(insights.weakCharacters, AMBER);
    y += 4;
  }

  // ── Repetitive Dialogue ───────────────────────────────────────────────────
  if (insights.repetitiveDialogue?.length) {
    checkBreak(30);
    sectionHeader("Repetitive Dialogue", `${insights.repetitiveDialogue.length} patterns`, PINK);
    bulletList(insights.repetitiveDialogue, PINK);
    y += 4;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BEST SCENE + SIMILAR TITLES
  // ═══════════════════════════════════════════════════════════════════════════

  if (report.bestScene) {
    checkBreak(28);
    sectionHeader("Best Scene", undefined, GREEN);
    const sceneLines = doc.splitTextToSize(`"${report.bestScene}"`, CW - 8);
    const quoteH = sceneLines.length * 5.5 + 12;
    card(ML, y, CW, quoteH, 3);
    setFill(GREEN);
    doc.rect(ML, y, 3, quoteH, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    setColor(MID_TEXT);
    doc.text(sceneLines, ML + 7, y + 8);
    y += quoteH + 8;
  }

  if (report.similar?.length) {
    checkBreak(30);
    sectionHeader("Similar Titles", "Comparable works by tone and structure");
    const cols = 2;
    const colW = (CW - 4) / cols;
    report.similar.slice(0, 6).forEach((title, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      checkBreak(7);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      setFill(PURPLE);
      doc.circle(ML + col * (colW + 4) + 2, y + row * 7 + 1.5, 1, "F");
      setColor(MID_TEXT);
      doc.text(title, ML + col * (colW + 4) + 5, y + row * 7 + 3.5);
    });
    y += Math.ceil(report.similar.slice(0, 6).length / cols) * 7 + 6;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FINALIZE — footer + watermark on every page
  // ═══════════════════════════════════════════════════════════════════════════

  addPageFooter();
  addWatermark();

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Update page number in footer
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setColor(LIGHT_TEXT);
    // Overwrite old page number
    setFill(PAGE_BG);
    doc.rect(W - MR - 12, H - 8, 12, 5, "F");
    doc.text(`Page ${i} / ${totalPages}`, W - MR, H - 5, { align: "right" });
  }

  const safeName = report.scriptTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
  doc.save(`ScriptMind_Report_${safeName}.pdf`);
}
