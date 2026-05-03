"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AnalyseScriptReport } from "@/lib/mock/analyse-script";
import { MetricCardsSection } from "@/components/analyse/MetricCardsSection";
import { SimilarStories } from "@/components/analyse/SimilarStories";
import { EmotionalTimelineSection } from "@/components/analyse/EmotionalTimelineSection";
import { EmotionDistributionSection } from "@/components/analyse/EmotionDistributionSection";
import { CharacterAnalysisSection } from "@/components/analyse/CharacterAnalysisSection";
import { DialogueAnalysisCard } from "@/components/analyse/DialogueAnalysisCard";
import { InsightsSection } from "@/components/analyse/InsightsSection";

const section = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export function AnalyseScriptDashboard({
  report,
  onAnalyseAnother,
}: {
  report: AnalyseScriptReport;
  onAnalyseAnother: () => void;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      const { downloadScriptReport } = await import("@/lib/pdf/downloadReport");
      await downloadScriptReport(report);
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <TooltipProvider delayDuration={180}>
      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.07 }}
        className="space-y-10"
      >
        {/* ── Header ── */}
        <motion.header
          variants={section}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-border/60 pb-7"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">
                <Sparkles className="w-3.5 h-3.5" />
                Analysis complete
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {report.scriptTitle}
            </h1>
            <p className="text-sm text-text-muted mt-2 max-w-xl">
              Emotional intelligence, character analytics, and risk engine — powered by Gemini AI.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="gap-2"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
            >
              {pdfLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Generating PDF…</>
                : <><Download className="w-4 h-4" />Download PDF</>}
            </Button>
            <Button variant="secondary" onClick={onAnalyseAnother} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Analyse another
            </Button>
          </div>
        </motion.header>

        {/* ── Section 1: Top Metrics ── */}
        <motion.div variants={section}>
          <MetricCardsSection
            originality={report.originality}
            hook={report.hook}
            engagement={report.engagement}
            emotional={report.emotional}
          />
        </motion.div>

        {/* ── Section 2: Emotional Timeline (time-based) ── */}
        <motion.div variants={section}>
          <EmotionalTimelineSection timeline={report.emotionalTimeline} />
        </motion.div>

        {/* ── Section 4: Emotion Distribution (full spectrum) ── */}
        <motion.div variants={section}>
          <EmotionDistributionSection distribution={report.emotionDistribution} />
        </motion.div>

        {/* ── Section 5: Character Analysis ── */}
        <motion.div variants={section}>
          <CharacterAnalysisSection
            screenTime={report.screenTime}
            dialogueShare={report.dialogueShare}
            emotionalArcs={report.emotionalArcs}
            actLabels={report.actLabels}
          />
        </motion.div>

        {/* ── Section 6: Dialogue Quality ── */}
        <motion.div variants={section}>
          <DialogueAnalysisCard
            qualityScore={report.dialogueQuality}
            readability={report.readability}
          />
        </motion.div>

        {/* ── Section 7: Risk & Improvement + Best Scene ── */}
        <motion.div variants={section}>
          <InsightsSection
            insights={report.insights}
            bestScene={report.bestScene}
          />
        </motion.div>

        {/* ── Section 8: Similar Stories ── */}
        {report.similar.length > 0 && (
          <motion.div variants={section}>
            <SimilarStories titles={report.similar} />
          </motion.div>
        )}

      </motion.div>
    </TooltipProvider>
  );
}
