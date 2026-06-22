"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Fingerprint,
  Wand2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Repeat2,
  Gem,
  Lightbulb,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/ui/CreditBadge";
import { OriginalityDashboard } from "@/components/originality/OriginalityDashboard";
import { EnhancementPanel } from "@/components/originality/EnhancementPanel";
import { ScriptInput } from "@/components/originality/ScriptInput";
import { analyzeOriginalityFile, ENHANCEMENT_ACTIONS } from "@/lib/originality-api";
import type { OriginalityReport } from "@/lib/originality-api";

type Mode = "choose" | "analyze" | "enhance";
type AnalyzePhase = "input" | "loading" | "report";

// Mirrors the backend MAX_ENHANCE_CHARS cap so users see the limit up-front.
const ENHANCE_MAX_CHARS = 45000;

const WHAT_YOU_GET = [
  { icon: Fingerprint, label: "Originality Score",       desc: "How fresh and distinctive your story is.",       color: "#8B5CF6" },
  { icon: AlertCircle,  label: "Similar Narrative Risks", desc: "Familiar patterns reminiscent of other stories.", color: "#EF4444" },
  { icon: Repeat2,      label: "Trope & Repetition Scan", desc: "Overused tropes and repetitive dialogue habits.", color: "#F59E0B" },
  { icon: Lightbulb,    label: "Rewrite Suggestions",     desc: "Concrete ways to raise originality.",             color: "#6366F1" },
  { icon: Gem,          label: "Unique Selling Elements", desc: "The original ideas worth protecting & promoting.", color: "#EC4899" },
  { icon: ShieldCheck,  label: "Predictability Check",    desc: "How formulaic your story beats feel.",            color: "#10B981" },
];

function titleFromFile(file: File): string {
  return file.name.replace(/\.[^.]+$/i, "").trim() || "Uploaded script";
}

export default function OriginalityPage() {
  const reportRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>("choose");

  // Analyze flow
  const [analyzePhase, setAnalyzePhase] = useState<AnalyzePhase>("input");
  const [report, setReport] = useState<OriginalityReport | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Enhance flow
  const [enhanceFile, setEnhanceFile] = useState<File | null>(null);

  const goChoose = useCallback(() => {
    setMode("choose");
    setAnalyzePhase("input");
    setReport(null);
    setReportFile(null);
    setAnalyzeError(null);
    setEnhanceFile(null);
  }, []);

  const runAnalysis = useCallback(async (file: File) => {
    setAnalyzeError(null);
    setAnalyzePhase("loading");
    try {
      const data = await analyzeOriginalityFile(file);
      setReport(data);
      setReportFile(file);
      setAnalyzePhase("report");
      window.dispatchEvent(new CustomEvent("credits-changed"));
      window.setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (e) {
      setAnalyzePhase("input");
      setReport(null);
      setAnalyzeError(e instanceof Error ? e.message : "Originality analysis failed. Please try again.");
    }
  }, []);

  const resetAnalyze = useCallback(() => {
    setAnalyzePhase("input");
    setReport(null);
    setReportFile(null);
    setAnalyzeError(null);
  }, []);

  return (
    <div className="min-h-full">
      <AnimatePresence mode="wait">
        {/* ── Mode picker ───────────────────────────────────────────── */}
        {mode === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
                >
                  <Fingerprint className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-text-primary leading-tight">
                    Originality Intelligence
                  </h1>
                  <p className="text-xs text-text-muted">
                    Analyze your script&apos;s originality, or enhance it with focused AI rewrites
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
              {/* Analyze card */}
              <button
                type="button"
                onClick={() => setMode("analyze")}
                className="group text-left rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:border-secondary/50 hover:bg-surface-2/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
                  >
                    <Fingerprint className="w-6 h-6 text-secondary" />
                  </div>
                  <CreditBadge cost={10} label="per analysis" />
                </div>
                <h2 className="text-lg font-bold text-text-primary mb-1.5">View Originality</h2>
                <p className="text-sm text-text-muted leading-relaxed mb-4">
                  Score your script for originality, similar narrative patterns, overused tropes, and
                  predictability — with concrete rewrite suggestions.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary">
                  Analyze a script
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>

              {/* Enhance card */}
              <button
                type="button"
                onClick={() => setMode("enhance")}
                className="group text-left rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:border-secondary/50 hover:bg-surface-2/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
                  >
                    <Wand2 className="w-6 h-6 text-secondary" />
                  </div>
                  <CreditBadge cost={5} label="per action" />
                </div>
                <h2 className="text-lg font-bold text-text-primary mb-1.5">Enhance Script</h2>
                <p className="text-sm text-text-muted leading-relaxed mb-4">
                  Skip the analysis and apply a focused AI rewrite — improve dialogue, deepen emotion,
                  sharpen character voices, reduce predictability, or smooth narrative flow.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary">
                  Enhance a script
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>

            <p className="text-xs text-text-muted mt-6 max-w-2xl">
              Originality and narrative-similarity analysis — not plagiarism or copyright detection.
            </p>
          </motion.div>
        )}

        {/* ── Analyze mode ─────────────────────────────────────────── */}
        {mode === "analyze" && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {analyzePhase !== "report" && (
              <>
                <ModeHeader
                  icon={Fingerprint}
                  title="View Originality"
                  subtitle="Narrative-similarity & originality analysis — not plagiarism detection"
                  cost={10}
                  costLabel="credits per run"
                  onBack={goChoose}
                />

                {analyzePhase === "input" && (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                      <ScriptInput
                        cost={10}
                        submitLabel="Analyze Originality"
                        submitIcon={Fingerprint}
                        error={analyzeError}
                        onSubmit={runAnalysis}
                      />
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                        <div className="px-5 py-4 border-b border-border">
                          <h3 className="text-sm font-bold text-text-primary">What you&apos;ll get</h3>
                          <p className="text-xs text-text-muted mt-0.5">
                            Originality & narrative-similarity report
                          </p>
                        </div>
                        <div className="divide-y divide-border">
                          {WHAT_YOU_GET.map(({ icon: Icon, label, desc, color }) => (
                            <div key={label} className="flex items-start gap-3 px-5 py-3.5">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                              >
                                <Icon className="w-4 h-4" style={{ color }} />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-text-primary">{label}</p>
                                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {analyzePhase === "loading" && (
                  <div>
                    <div className="flex items-center gap-3 mb-8 px-4 py-3 rounded-xl border border-secondary/25 bg-secondary/5">
                      <Loader2 className="w-5 h-5 text-secondary animate-spin shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          Scanning for originality with Gemini…
                        </p>
                        <p className="text-xs text-text-muted">
                          Comparing narrative patterns, tropes, and dialogue. ~15–40 s.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl border border-border bg-surface-2/40 animate-pulse" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {analyzePhase === "report" && report && (
              <div ref={reportRef} className="scroll-mt-6">
                <button
                  type="button"
                  onClick={goChoose}
                  className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Originality
                </button>
                <OriginalityDashboard report={report} sourceFile={reportFile} onAnalyseAnother={resetAnalyze} />
              </div>
            )}
          </motion.div>
        )}

        {/* ── Enhance mode ─────────────────────────────────────────── */}
        {mode === "enhance" && (
          <motion.div
            key="enhance"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <ModeHeader
              icon={Wand2}
              title="Enhance Script"
              subtitle="Apply a focused AI rewrite to your own script — no analysis required"
              cost={5}
              costLabel="credits per action"
              onBack={goChoose}
            />

            {!enhanceFile ? (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <ScriptInput
                    cost={5}
                    submitLabel="Load Script"
                    submitIcon={Wand2}
                    textOnly
                    maxChars={ENHANCE_MAX_CHARS}
                    onSubmit={(file) => setEnhanceFile(file)}
                  />
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                      <h3 className="text-sm font-bold text-text-primary">Available enhancements</h3>
                      <p className="text-xs text-text-muted mt-0.5">Run any after loading your script</p>
                    </div>
                    <div className="divide-y divide-border">
                      {ENHANCEMENT_ACTIONS.map(({ action, label, description }) => (
                        <div key={action} className="flex items-start gap-3 px-5 py-3.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-secondary/15 border border-secondary/25">
                            <Wand2 className="w-4 h-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-primary">{label}</p>
                            <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/40 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-secondary shrink-0" />
                    <span className="text-sm font-semibold text-text-primary truncate">
                      {titleFromFile(enhanceFile)}
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" className="gap-1.5 shrink-0" onClick={() => setEnhanceFile(null)}>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Different script
                  </Button>
                </div>

                <EnhancementPanel sourceFile={enhanceFile} scriptTitle={titleFromFile(enhanceFile)} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Shared header with a back button and credit badge for both working modes. */
function ModeHeader({
  icon: Icon,
  title,
  subtitle,
  cost,
  costLabel,
  onBack,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  cost: number;
  costLabel: string;
  onBack: () => void;
}) {
  return (
    <div className="mb-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
        >
          <Icon className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-text-primary leading-tight">{title}</h1>
            <CreditBadge cost={cost} label={costLabel} />
          </div>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
