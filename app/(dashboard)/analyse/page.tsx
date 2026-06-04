"use client";

import {
  AnalyseDashboardSkeleton,
  AnalyseScriptDashboard,
  SceneBySceneDashboard,
} from "@/components/analyse";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/ui/CreditBadge";
import { SaveButton } from "@/components/ui/SaveButton";
import { analyseScriptFile, analyseScriptText } from "@/lib/analyse-api";
import { createSceneAnalysisJob, pollSceneAnalysisJob } from "@/lib/scene-analyse-api";
import { useFeatureDraft } from "@/lib/draft/useFeatureDraft";
import type { AnalyseScriptReport } from "@/lib/mock/analyse-script";
import type { SceneAnalysisReport } from "@/lib/mock/scene-analyse";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    BarChart3,
    Brain,
    CheckCircle2,
    ChevronRight,
    FileText,
    Heart,
    Loader2,
    PenLine,
    Shield,
    Sparkles,
    TrendingUp,
    Upload,
    Users,
    Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "upload" | "loading" | "report" | "scene_loading" | "scene_report";
type InputMode = "file" | "text";
type AnalysisMode = "quick" | "scene";

const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const MIN_TEXT_LEN = 100;

const WHAT_YOU_GET = [
  { icon: BarChart3, label: "Originality & Hook Score",   desc: "How unique and compelling your opening is.",      color: "#6366F1" },
  { icon: Heart,     label: "27-Emotion Spectrum",        desc: "Full emotional arc mapped scene by scene.",        color: "#EC4899" },
  { icon: Users,     label: "Character Analysis",         desc: "Screen time, dialogue share, and arc tracking.",   color: "#10B981" },
  { icon: Brain,     label: "AI Dialogue Quality",        desc: "Readability, tone, and authenticity score.",       color: "#F59E0B" },
  { icon: Shield,    label: "Risk & Improvement Tracker", desc: "What's working and what needs fixing.",            color: "#3B82F6" },
  { icon: TrendingUp,label: "Audience Impact Prediction", desc: "Predicted engagement and commercial potential.",   color: "#8B5CF6" },
];

export default function AnalysePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef    = useRef<HTMLDivElement>(null);

  const [phase,         setPhase]         = useState<Phase>("upload");
  const [analysisMode,  setAnalysisMode]  = useState<AnalysisMode>("quick");
  const [inputMode,     setInputMode]     = useState<InputMode>("file");
  const [report,        setReport]        = useState<AnalyseScriptReport | null>(null);
  const [sceneReport,   setSceneReport]   = useState<SceneAnalysisReport | null>(null);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [scenePhaseMsg, setScenePhaseMsg] = useState("");
  const [error,         setError]         = useState<string | null>(null);
  const [dragOver,   setDragOver]   = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");

  // ── Draft persistence ────────────────────────────────────────────────────
  // Saved fields: input mode, pasted text, script title, and the last report so
  // users can reopen a previous analysis without burning credits again.
  const draftSnapshot = { inputMode, pastedText, scriptTitle, report, sceneReport, analysisMode };
  const {
    loadedDraft, isHydrated, status: saveStatus, isDirty, lastSavedAt, save,
  } = useFeatureDraft("analyse", draftSnapshot);

  useEffect(() => {
    if (!loadedDraft) return;
    if (loadedDraft.inputMode === "file" || loadedDraft.inputMode === "text")
      setInputMode(loadedDraft.inputMode);
    if (typeof loadedDraft.pastedText  === "string") setPastedText(loadedDraft.pastedText);
    if (typeof loadedDraft.scriptTitle === "string") setScriptTitle(loadedDraft.scriptTitle);
    if (loadedDraft.sceneReport) {
      setSceneReport(loadedDraft.sceneReport as SceneAnalysisReport);
      setPhase("scene_report");
    } else if (loadedDraft.report) {
      setReport(loadedDraft.report);
      setPhase("report");
    }
    if (loadedDraft.analysisMode === "quick" || loadedDraft.analysisMode === "scene") {
      setAnalysisMode(loadedDraft.analysisMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedDraft]);

  const runAnalysis = useCallback(
    async (loader: () => Promise<AnalyseScriptReport>) => {
      setError(null);
      setPhase("loading");
      try {
        const data = await loader();
        setReport(data);
        setPhase("report");
        window.setTimeout(() => {
          reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      } catch (e) {
        setPhase("upload");
        setReport(null);
        setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
      }
    },
    []
  );

  const runSceneAnalysis = useCallback(async (file: File) => {
    setError(null);
    setSceneReport(null);
    setPhase("scene_loading");
    setSceneProgress(0);
    setScenePhaseMsg("Starting…");

    try {
      const { jobId } = await createSceneAnalysisJob(file);
      const result = await pollSceneAnalysisJob(jobId, {
        intervalMs: 2500,
        onUpdate: (job) => {
          setSceneProgress(job.progress_pct);
          setScenePhaseMsg(job.phase_message ?? job.status);
        },
      });
      setSceneReport(result);
      setPhase("scene_report");
      window.dispatchEvent(new CustomEvent("credits-changed"));
      window.setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (e) {
      setPhase("upload");
      setSceneReport(null);
      setError(e instanceof Error ? e.message : "Scene analysis failed.");
    }
  }, []);

  const handleFile = useCallback(
    (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
        setError("Please upload a PDF, DOCX, or TXT file.");
        return;
      }
      if (analysisMode === "scene") {
        void runSceneAnalysis(file);
      } else {
        void runAnalysis(() => analyseScriptFile(file));
      }
    },
    [analysisMode, runAnalysis, runSceneAnalysis]
  );

  const handleTextAnalyse = useCallback(() => {
    const trimmed = pastedText.trim();
    if (trimmed.length < MIN_TEXT_LEN) {
      setError(`Script text must be at least ${MIN_TEXT_LEN} characters.`);
      return;
    }
    const title = scriptTitle.trim() || "pasted-script";
    if (analysisMode === "scene") {
      const blob = new Blob([trimmed], { type: "text/plain" });
      const file = new File([blob], `${title}.txt`, { type: "text/plain" });
      void runSceneAnalysis(file);
    } else {
      void runAnalysis(() => analyseScriptText(trimmed, title));
    }
  }, [pastedText, scriptTitle, runAnalysis, analysisMode, runSceneAnalysis]);

  const reset = useCallback(() => {
    setPhase("upload");
    setReport(null);
    setSceneReport(null);
    setError(null);
    setPastedText("");
    setScriptTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="min-h-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-hidden
        onChange={(e) => handleFile(e.target.files)}
      />

      <AnimatePresence mode="wait">
        {phase === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── Page Header ── */}
            <div className="mb-7">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                    <Brain className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-text-primary leading-tight">Analyse Script</h1>
                      <CreditBadge
                        cost={analysisMode === "scene" ? 15 : 3}
                        label="credits per run"
                      />
                    </div>
                    <p className="text-xs text-text-muted">AI-powered screenplay intelligence — emotion, character, and structure</p>
                  </div>
                </div>
                <SaveButton
                  status={saveStatus}
                  isDirty={isDirty && isHydrated}
                  lastSavedAt={lastSavedAt}
                  onClick={save}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { icon: Zap,          label: "Live Gemini AI",      color: "#F59E0B" },
                  { icon: Brain,        label: "27-Emotion Spectrum",  color: "#A78BFA" },
                  { icon: CheckCircle2, label: "Full Report",          color: "#34D399" },
                  { icon: Sparkles,     label: "PDF Export",           color: "#60A5FA" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-surface text-xs text-text-muted">
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Error banner ── */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex gap-3 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <div>{error}</div>
              </motion.div>
            )}

            {/* Analysis mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => { setAnalysisMode("quick"); setError(null); }}
                className={`text-left rounded-2xl border p-5 transition-all ${
                  analysisMode === "quick"
                    ? "border-accent bg-accent/10 ring-1 ring-accent/40"
                    : "border-border bg-surface hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-text-primary">Quick Analysis</span>
                  <CreditBadge cost={3} size="sm" />
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Holistic scores, character arcs, and emotion spectrum (~first 60 pages). Fast.
                </p>
              </button>
              <button
                type="button"
                onClick={() => { setAnalysisMode("scene"); setError(null); }}
                className={`text-left rounded-2xl border p-5 transition-all ${
                  analysisMode === "scene"
                    ? "border-secondary bg-secondary/10 ring-1 ring-secondary/40"
                    : "border-border bg-surface hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                    Scene-by-Scene <span className="text-secondary">⭐</span>
                  </span>
                  <CreditBadge cost={15} size="sm" />
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Full script · per-scene scores · rewrite notes · 1–3 min (Basic: 5/mo, Pro: 25/mo).
                </p>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* ── Left: Upload panel ── */}
              <div className="lg:col-span-3 space-y-4">
                {/* Input mode tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-surface-2 border border-border/60 w-fit">
                  {([
                    { mode: "file" as InputMode, icon: Upload,  label: "Upload file" },
                    { mode: "text" as InputMode, icon: PenLine, label: "Paste text"  },
                  ] as const).map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setInputMode(mode); setError(null); }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        inputMode === mode
                          ? "bg-accent text-white shadow-sm"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* File upload */}
                {inputMode === "file" && (
                  <motion.div
                    key="file-panel"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); handleFile(e.dataTransfer.files); }}
                      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
                        dragOver
                          ? "border-accent bg-accent/10 scale-[1.01]"
                          : "border-border hover:border-accent/40 hover:bg-surface-2/60"
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors border ${
                        dragOver ? "bg-accent/25 border-accent/50" : "bg-accent/15 border-accent/30"
                      }`}>
                        <Upload className="w-8 h-8 text-accent" />
                      </div>
                      <h3 className="text-lg font-bold text-text-primary mb-2">
                        {dragOver ? "Drop your script here" : "Upload your script"}
                      </h3>
                      <p className="text-text-muted mb-5 text-sm leading-relaxed max-w-md mx-auto">
                        Drag & drop or click to browse. Sent directly to Gemini AI — no mock data.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {[["PDF", "#EF4444"], ["DOCX", "#3B82F6"], ["TXT", "#10B981"]].map(([fmt, color]) => (
                          <span key={fmt} className="text-xs px-3 py-1 rounded-full bg-surface-3 border border-border text-text-muted flex items-center gap-1">
                            <FileText className="w-3 h-3" style={{ color }} />
                            .{fmt.toLowerCase()}
                          </span>
                        ))}
                      </div>
                      <Button type="button" className="mx-auto" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        Choose file <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    {/* Credit info */}
                    <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <p className="text-xs text-amber-400/80">
                        <span className="font-semibold text-amber-400">
                          {analysisMode === "scene" ? "15 credits" : "3 credits"}
                        </span>{" "}
                        when analysis starts.
                        {analysisMode === "scene"
                          ? " Monthly plan limits apply (Basic 5, Pro 25)."
                          : " Rate limit: 10 quick analyses/day."}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Text paste */}
                {inputMode === "text" && (
                  <motion.div
                    key="text-panel"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                        Script title (optional)
                      </label>
                      <input
                        type="text"
                        value={scriptTitle}
                        onChange={(e) => setScriptTitle(e.target.value)}
                        placeholder="e.g. My Thriller Draft"
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                        Script text
                        <span className="ml-2 font-normal normal-case tracking-normal">
                          ({pastedText.length.toLocaleString()} chars
                          {pastedText.length < MIN_TEXT_LEN && pastedText.length > 0
                            ? ` — need ${MIN_TEXT_LEN - pastedText.length} more` : ""})
                        </span>
                      </label>
                      <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder={`Paste your full screenplay here...\n\nINT. COFFEE SHOP - DAY\n\nSARAH sits alone at a corner table...`}
                        rows={16}
                        className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors resize-y font-mono leading-relaxed"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button" size="lg"
                        disabled={pastedText.trim().length < MIN_TEXT_LEN}
                        onClick={handleTextAnalyse}
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Analyze Script
                      </Button>
                      <CreditBadge cost={analysisMode === "scene" ? 15 : 3} />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ── Right: What you get ── */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-bold text-text-primary">What you&apos;ll get</h3>
                    <p className="text-xs text-text-muted mt-0.5">6 in-depth intelligence modules</p>
                  </div>
                  <div className="divide-y divide-border">
                    {WHAT_YOU_GET.map(({ icon: Icon, label, desc, color }) => (
                      <div key={label} className="flex items-start gap-3 px-5 py-3.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
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

                {/* How it works */}
                <div className="rounded-2xl border border-border bg-surface px-5 py-4">
                  <h3 className="text-sm font-bold text-text-primary mb-3">How it works</h3>
                  <div className="space-y-3">
                    {[
                      { step: "1", text: "Upload your script (PDF, DOCX, or TXT)" },
                      { step: "2", text: "Gemini AI reads and parses every scene" },
                      { step: "3", text: "Full report ready in 15–30 seconds" },
                      { step: "4", text: "Download a watermarked PDF of the report" },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-black text-accent">{step}</span>
                        </div>
                        <p className="text-xs text-text-muted">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Loading ── */}
        {phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-8 px-4 py-3 rounded-xl border border-accent/25 bg-accent/5">
              <Loader2 className="w-5 h-5 text-accent animate-spin shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Quick analysis with Gemini…</p>
                <p className="text-xs text-text-muted">Extracting emotions, character arcs, and structure. ~15–30 s.</p>
              </div>
            </div>
            <AnalyseDashboardSkeleton />
          </motion.div>
        )}

        {phase === "scene_loading" && (
          <motion.div key="scene-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-8 px-4 py-4 rounded-xl border border-secondary/25 bg-secondary/5">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-secondary animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">Scene-by-scene analysis…</p>
                  <p className="text-xs text-text-muted">{scenePhaseMsg || "Processing"}</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full bg-secondary transition-all duration-500"
                  style={{ width: `${sceneProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-text-muted mt-2">{sceneProgress}% — do not close this tab</p>
            </div>
            <AnalyseDashboardSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "report" && report && (
        <div ref={reportRef} className="scroll-mt-6">
          <AnalyseScriptDashboard report={report} onAnalyseAnother={reset} />
        </div>
      )}

      {phase === "scene_report" && sceneReport && (
        <div ref={reportRef} className="scroll-mt-6">
          <SceneBySceneDashboard report={sceneReport} onAnalyseAnother={reset} />
        </div>
      )}
    </div>
  );
}
