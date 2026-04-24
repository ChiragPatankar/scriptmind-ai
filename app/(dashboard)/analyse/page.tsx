"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Brain, Zap, CheckCircle2, AlertCircle, FileText,
  PenLine, ChevronRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyseScriptDashboard, AnalyseDashboardSkeleton } from "@/components/analyse";
import type { AnalyseScriptReport } from "@/lib/mock/analyse-script";
import { analyseScriptFile, analyseScriptText } from "@/lib/analyse-api";

type Phase = "upload" | "loading" | "report";
type InputMode = "file" | "text";

const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const MIN_TEXT_LEN = 100;

export default function AnalysePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [report, setReport] = useState<AnalyseScriptReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");

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

  const handleFile = useCallback(
    (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
        setError("Please upload a PDF, DOCX, or TXT file.");
        return;
      }
      void runAnalysis(() => analyseScriptFile(file));
    },
    [runAnalysis]
  );

  const handleTextAnalyse = useCallback(() => {
    const trimmed = pastedText.trim();
    if (trimmed.length < MIN_TEXT_LEN) {
      setError(`Script text must be at least ${MIN_TEXT_LEN} characters.`);
      return;
    }
    const title = scriptTitle.trim() || "pasted-script";
    void runAnalysis(() => analyseScriptText(trimmed, title));
  }, [pastedText, scriptTitle, runAnalysis]);

  const reset = useCallback(() => {
    setPhase("upload");
    setReport(null);
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

      {/* ── Upload / Input Phase ── */}
      <AnimatePresence mode="wait">
        {phase === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Page header */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <Brain className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-text-primary leading-tight">Analyse Script</h1>
                  <p className="text-xs text-text-muted">AI-powered screenplay intelligence — emotion, character, and structure</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                {[
                  { icon: Zap, label: "Live Gemini AI", color: "#F59E0B" },
                  { icon: Brain, label: "27-Emotion Spectrum", color: "#A78BFA" },
                  { icon: CheckCircle2, label: "Full Report", color: "#34D399" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-surface text-xs text-text-muted">
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Error banner */}
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

            {/* Input mode tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-surface-2 border border-border/60 w-fit mb-5">
              {([
                { mode: "file" as InputMode, icon: Upload, label: "Upload file" },
                { mode: "text" as InputMode, icon: PenLine, label: "Paste text" },
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

            {/* File upload panel */}
            {inputMode === "file" && (
              <motion.div
                key="file-panel"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-2xl"
              >
                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(false);
                    handleFile(e.dataTransfer.files);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
                    dragOver
                      ? "border-accent bg-accent/10 scale-[1.01]"
                      : "border-border hover:border-accent/40 hover:bg-surface-2/60"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors ${
                    dragOver ? "bg-accent/25 border-accent/50" : "bg-accent/15 border-accent/30"
                  } border`}>
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
                      <span key={fmt}
                        className="text-xs px-3 py-1 rounded-full bg-surface-3 border border-border text-text-muted flex items-center gap-1">
                        <FileText className="w-3 h-3" style={{ color }} />
                        .{fmt.toLowerCase()}
                      </span>
                    ))}
                  </div>
                  <Button
                    type="button"
                    className="mx-auto"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Choose file
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Text paste panel */}
            {inputMode === "text" && (
              <motion.div
                key="text-panel"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-3xl space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                    Script text
                    <span className="ml-2 text-text-muted font-normal normal-case tracking-normal">
                      ({pastedText.length.toLocaleString()} chars
                      {pastedText.length < MIN_TEXT_LEN && pastedText.length > 0
                        ? ` — need ${MIN_TEXT_LEN - pastedText.length} more`
                        : ""})
                    </span>
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Paste your full screenplay here...\n\nINT. COFFEE SHOP - DAY\n\nSARAH sits alone at a corner table, scanning the crowd...`}
                    rows={18}
                    className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors resize-y font-mono leading-relaxed"
                  />
                </div>

                <Button
                  type="button"
                  size="lg"
                  disabled={pastedText.trim().length < MIN_TEXT_LEN}
                  onClick={handleTextAnalyse}
                  className="w-full sm:w-auto"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Script
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Loading Phase ── */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-8 px-1 py-3 rounded-xl border border-accent/25 bg-accent/5">
              <Loader2 className="w-5 h-5 text-accent animate-spin shrink-0 ml-3" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Analyzing with Gemini AI…</p>
                <p className="text-xs text-text-muted">Extracting emotions, character arcs, and structure. This takes 15–30 s.</p>
              </div>
            </div>
            <AnalyseDashboardSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report Phase ── */}
      {phase === "report" && report && (
        <div ref={reportRef} className="scroll-mt-6">
          <AnalyseScriptDashboard report={report} onAnalyseAnother={reset} />
        </div>
      )}
    </div>
  );
}
