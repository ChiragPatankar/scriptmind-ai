"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AnalyseScriptReport } from "@/lib/mock/analyse-script";
import { MetricCardsSection } from "@/components/analyse/MetricCardsSection";
import { ImprovementTracker } from "@/components/analyse/ImprovementTracker";
import { SimilarStories } from "@/components/analyse/SimilarStories";
import { CharacterAnalysisSection } from "@/components/analyse/CharacterAnalysisSection";
import { DialogueAnalysisCard } from "@/components/analyse/DialogueAnalysisCard";
import { InsightsSection } from "@/components/analyse/InsightsSection";
import { AnalyseUtilities } from "@/components/analyse/AnalyseUtilities";

export function AnalyseScriptDashboard({
  report,
  onAnalyseAnother,
}: {
  report: AnalyseScriptReport;
  onAnalyseAnother: () => void;
}) {
  return (
    <TooltipProvider delayDuration={180}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-10"
      >
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-border/80 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
                <Sparkles className="w-3.5 h-3.5" />
                Analysis report
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {report.scriptTitle}
            </h1>
            <p className="text-sm text-text-muted mt-2 max-w-xl">
              Executive view of originality, character load, dialogue craft, and next revision targets — built for showrunners and development executives.
            </p>
          </div>
          <Button variant="secondary" onClick={onAnalyseAnother} className="shrink-0">
            Analyse another script
          </Button>
        </header>

        <MetricCardsSection
          originality={report.originality}
          hook={report.hook}
          engagement={report.engagement}
          emotional={report.emotional}
        />

        <ImprovementTracker
          previousScore={report.previousScore}
          newScore={report.newScore}
        />

        <SimilarStories titles={report.similar} />

        <CharacterAnalysisSection
          screenTime={report.screenTime}
          dialogueShare={report.dialogueShare}
          emotionalArcs={report.emotionalArcs}
          actLabels={report.actLabels}
        />

        <DialogueAnalysisCard
          qualityScore={report.dialogueQuality}
          readability={report.readability}
        />

        <InsightsSection
          insights={report.insights}
          bestScene={report.bestScene}
        />

        <AnalyseUtilities report={report} />
      </motion.div>
    </TooltipProvider>
  );
}
