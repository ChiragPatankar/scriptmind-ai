"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  PenLine,
  FileText,
  ChevronRight,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/ui/CreditBadge";
import { textToFile } from "@/lib/originality-api";

const ACCEPT =
  ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const MIN_TEXT_LEN = 100;

type InputMode = "file" | "text";

/**
 * Reusable screenplay input (file upload + paste text) used by both the
 * Analyze and Enhance modes of Originality Intelligence. Bubbles up a single
 * File via onSubmit; the caller decides what to do with it.
 */
export function ScriptInput({
  cost,
  submitLabel,
  submitIcon: SubmitIcon,
  busy = false,
  error,
  onSubmit,
  textOnly = false,
  maxChars,
}: {
  cost: number;
  submitLabel: string;
  submitIcon: React.ComponentType<{ className?: string }>;
  busy?: boolean;
  error?: string | null;
  onSubmit: (file: File) => void;
  /** When true, only the paste-text option is shown (no file upload). */
  textOnly?: boolean;
  /** When set, shows "x / max chars" and warns if the text exceeds the limit. */
  maxChars?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMode, setInputMode] = useState<InputMode>(textOnly ? "text" : "file");
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const overLimit = maxChars != null && pastedText.length > maxChars;

  const handleFile = useCallback(
    (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
        setLocalError("Please upload a PDF, DOCX, or TXT file.");
        return;
      }
      setLocalError(null);
      onSubmit(file);
    },
    [onSubmit]
  );

  const handleTextSubmit = useCallback(() => {
    const trimmed = pastedText.trim();
    if (trimmed.length < MIN_TEXT_LEN) {
      setLocalError(`Script text must be at least ${MIN_TEXT_LEN} characters.`);
      return;
    }
    setLocalError(null);
    onSubmit(textToFile(trimmed, scriptTitle.trim() || "pasted-script"));
  }, [pastedText, scriptTitle, onSubmit]);

  const shownError = error ?? localError;

  return (
    <div className="space-y-4">
      {!textOnly && (
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          aria-hidden
          onChange={(e) => handleFile(e.target.files)}
        />
      )}

      {shownError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div>{shownError}</div>
        </motion.div>
      )}

      {!textOnly && (
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
                setLocalError(null);
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
      )}

      {!textOnly && inputMode === "file" && (
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
              if (!busy) handleFile(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
              busy ? "opacity-60 pointer-events-none" : "cursor-pointer"
            } ${
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
              Drag &amp; drop or click to browse. Processed with Gemini AI.
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
              disabled={busy}
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
              <span className="font-semibold text-amber-400">{cost} credits</span> deducted only after a
              successful run.
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
            <label className="flex flex-wrap items-center gap-x-2 text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              <span>Script text</span>
              <span className={`font-normal normal-case tracking-normal ${overLimit ? "text-amber-400" : ""}`}>
                ({pastedText.length.toLocaleString()}
                {maxChars != null ? ` / ${maxChars.toLocaleString()}` : ""} chars
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
          {overLimit && maxChars != null && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-400/90">
                Only the first <span className="font-semibold text-amber-400">{maxChars.toLocaleString()} characters</span>{" "}
                will be used. The rest will be trimmed.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="lg"
              disabled={busy || pastedText.trim().length < MIN_TEXT_LEN}
              onClick={handleTextSubmit}
            >
              <SubmitIcon className="w-4 h-4 mr-2" />
              {submitLabel}
            </Button>
            <CreditBadge cost={cost} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
