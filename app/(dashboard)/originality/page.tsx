"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Fingerprint,
  Upload,
  PenLine,
  FileText,
  ChevronRight,
  AlertCircle,
  Loader2,
  Zap,
  ShieldCheck,
  Repeat2,
  Gem,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/ui/CreditBadge";
import { OriginalityDashboard } from "@/components/originality/OriginalityDashboard";
import { analyzeOriginalityFile, analyzeOriginalityText } from "@/lib/originality-api";
import type { OriginalityReport } from "@/lib/originality-api";

type Phase = "upload" | "loading" | "report";
type InputMode = "file" | "text";

const ACCEPT =
  ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const MIN_TEXT_LEN = 100;

const WHAT_YOU_GET = [
  { icon: Fingerprint, label: "Originality Score",       desc: "How fresh and distinctive your story is.",       color: "#8B5CF6" },
  { icon: AlertCircle,  label: "Similar Narrative Risks", desc: "Familiar patterns reminiscent of other stories.", color: "#EF4444" },
  { icon: Repeat2,      label: "Trope & Repetition Scan", desc: "Overused tropes and repetitive dialogue habits.", color: "#F59E0B" },
  { icon: Lightbulb,    label: "Rewrite Suggestions",     desc: "Concrete ways to raise originality.",             color: "#6366F1" },
  { icon: Gem,          label: "Unique Selling Elements", desc: "The original ideas worth protecting & promoting.", color: "#EC4899" },
  { icon: ShieldCheck,  label: "Predictability Check",    desc: "How formulaic your story beats feel.",            color: "#10B981" },
];

export default function OriginalityPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [report, setReport] = useState<OriginalityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");

  const runAnalysis = useCallback(async (loader: () => Promise<OriginalityReport>) => {
    setError(null);
    setPhase("loading");
    try {
      const data = await loader();
      setReport(data);
      setPhase("report");
      window.dispatchEvent(new CustomEvent("credits-changed"));
      window.setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (e) {
      setPhase("upload");
      setReport(null);
      setError(e instanceof Error ? e.message : "Originality analysis failed. Please try again.");
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
      void runAnalysis(() => analyzeOriginalityFile(file));
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
    void runAnalysis(() => analyzeOriginalityText(trimmed, title));
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

      <AnimatePresence mode="wait">
        {phase === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
                >
                  <Fingerprint className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-text-primary leading-tight">
                      Originality Intelligence
                    </h1>
                    <CreditBadge cost={10} label="credits per run" />
                  </div>
                  <p className="text-xs text-text-muted">
                    Narrative-similarity & originality analysis — not plagiarism detection
                  </p>
                </div>
              </div>
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: input */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex gap-1 p-1 rounded-xl bg-surface-2 border border-border/60 w-fit">
                  {([
                    { mode: "file" as InputMode, icon: Upload, label: "Upload file" },
                    { mode: "text" as InputMode, icon: PenLine, label: "Paste text" },
                  ] as const).map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setInputMode(mode);
                        setError(null);
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        inputMode === mode
                          ? "bg-secondary text-white shadow-sm"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {inputMode === "file" && (
                  <motion.div key="file-panel" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOver(false);
                        handleFile(e.dataTransfer.files);
                      }}
                      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
                        dragOver
                          ? "border-secondary bg-secondary/10 scale-[1.01]"
                          : "border-border hover:border-secondary/40 hover:bg-surface-2/60"
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
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors border ${
                          dragOver ? "bg-secondary/25 border-secondary/50" : "bg-secondary/15 border-secondary/30"
                        }`}
                      >
                        <Upload className="w-8 h-8 text-secondary" />
                      </div>
                      <h3 className="text-lg font-bold text-text-primary mb-2">
                        {dragOver ? "Drop your script here" : "Upload your script"}
                      </h3>
                      <p className="text-text-muted mb-5 text-sm leading-relaxed max-w-md mx-auto">
                        Drag &amp; drop or click to browse. Analyzed with Gemini AI.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {[["PDF", "#EF4444"], ["DOCX", "#3B82F6"], ["TXT", "#10B981"]].map(([fmt, color]) => (
                          <span
                            key={fmt}
                            className="text-xs px-3 py-1 rounded-full bg-surface-3 border border-border text-text-muted flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" style={{ color }} />.{fmt.toLowerCase()}
                          </span>
                        ))}
                      </div>
                      <Button
                        type="button"
                        className="mx-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Choose file <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <p className="text-xs text-amber-400/80">
                        <span className="font-semibold text-amber-400">10 credits</span> deducted only after a
                        successful analysis.
                      </p>
                    </div>
                  </motion.div>
                )}

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
                        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                        Script text
                        <span className="ml-2 font-normal normal-case tracking-normal">
                          ({pastedText.length.toLocaleString()} chars
                          {pastedText.length < MIN_TEXT_LEN && pastedText.length > 0
                            ? ` — need ${MIN_TEXT_LEN - pastedText.length} more`
                            : ""}
                          )
                        </span>
                      </label>
                      <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder={`Paste your full screenplay here...\n\nINT. COFFEE SHOP - DAY\n\nSARAH sits alone at a corner table...`}
                        rows={16}
                        className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-colors resize-y font-mono leading-relaxed"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        size="lg"
                        disabled={pastedText.trim().length < MIN_TEXT_LEN}
                        onClick={handleTextAnalyse}
                      >
                        <Fingerprint className="w-4 h-4 mr-2" />
                        Analyze Originality
                      </Button>
                      <CreditBadge cost={10} />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right: what you get */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-bold text-text-primary">What you&apos;ll get</h3>
                    <p className="text-xs text-text-muted mt-0.5">Originality & narrative-similarity report</p>
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
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-8 px-4 py-3 rounded-xl border border-secondary/25 bg-secondary/5">
              <Loader2 className="w-5 h-5 text-secondary animate-spin shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Scanning for originality with Gemini…</p>
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
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "report" && report && (
        <div ref={reportRef} className="scroll-mt-6">
          <OriginalityDashboard report={report} onAnalyseAnother={reset} />
        </div>
      )}
    </div>
  );
}
