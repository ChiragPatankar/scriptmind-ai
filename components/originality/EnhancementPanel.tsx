"use client";

import React, { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Wand2,
  MessageSquare,
  Heart,
  Users,
  Shuffle,
  Waves,
  Loader2,
  Copy,
  Check,
  Download,
  X,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/ui/CreditBadge";
import {
  ENHANCEMENT_ACTIONS,
  enhanceOriginalityScript,
} from "@/lib/originality-api";
import type { EnhancementAction, EnhancementResult } from "@/lib/originality-api";

const ENHANCE_COST = 5;

const ACTION_ICONS: Record<
  EnhancementAction,
  React.ComponentType<{ className?: string }>
> = {
  improve_dialogue: MessageSquare,
  emotional_depth: Heart,
  character_voices: Users,
  reduce_predictability: Shuffle,
  narrative_flow: Waves,
};

/**
 * Enhancement Actions — apply a single craft rewrite to a loaded script.
 * Shared by the standalone Enhance mode and the bottom of the analysis report.
 */
export function EnhancementPanel({
  sourceFile,
  scriptTitle,
}: {
  sourceFile: File | null;
  scriptTitle: string;
}) {
  const [runningAction, setRunningAction] = useState<EnhancementAction | null>(null);
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const runEnhancement = useCallback(
    async (action: EnhancementAction) => {
      if (!sourceFile || runningAction) return;
      setError(null);
      setCopied(false);
      setRunningAction(action);
      try {
        const res = await enhanceOriginalityScript(action, sourceFile);
        setResult(res);
        window.dispatchEvent(new CustomEvent("credits-changed"));
        window.setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Enhancement failed. Please try again.");
      } finally {
        setRunningAction(null);
      }
    },
    [sourceFile, runningAction]
  );

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.enhancedScript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result.enhancedScript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = (scriptTitle || "script").replace(/[^\w.-]+/g, "_").slice(0, 60);
    a.href = url;
    a.download = `${safeTitle}-${result.action}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [result, scriptTitle]);

  return (
    <section className="rounded-2xl border border-secondary/25 bg-secondary/[0.04] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-secondary" />
          <h3 className="text-sm font-bold text-text-primary">Enhancement Actions</h3>
          <CreditBadge cost={ENHANCE_COST} />
        </div>
      </div>
      <p className="text-xs text-text-muted leading-relaxed mb-4 max-w-2xl">
        Apply a focused AI rewrite to <span className="font-semibold text-text-secondary">{scriptTitle}</span>.
        Each action rewrites your own script and costs{" "}
        <span className="font-semibold text-text-secondary">{ENHANCE_COST} credits</span>, charged only on success.
      </p>

      {!sourceFile && (
        <p className="text-xs text-amber-400/90 mb-4">
          Load a script to enable enhancements.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ENHANCEMENT_ACTIONS.map(({ action, label, description }) => {
          const Icon = ACTION_ICONS[action];
          const isRunning = runningAction === action;
          const disabled = !sourceFile || (runningAction !== null && !isRunning);
          return (
            <button
              key={action}
              type="button"
              disabled={disabled || isRunning}
              onClick={() => runEnhancement(action)}
              className={`group flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 ${
                isRunning
                  ? "border-secondary bg-secondary/10"
                  : "border-border bg-surface hover:border-secondary/50 hover:bg-surface-2/60"
              } ${disabled && !isRunning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/15 border border-secondary/25 text-secondary">
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </span>
                <span className="text-sm font-semibold text-text-primary">{label}</span>
              </div>
              <span className="text-[11px] text-text-muted leading-relaxed">
                {isRunning ? "Rewriting with Gemini…" : description}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 flex gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 rounded-2xl border border-border bg-surface overflow-hidden scroll-mt-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h4 className="text-sm font-bold text-text-primary">
                  {result.actionLabel || "Enhanced script"}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleDownload}>
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
                <button
                  type="button"
                  aria-label="Dismiss enhanced script"
                  onClick={() => setResult(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {(result.changes.length > 0 || result.focusNotes.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 py-4 border-b border-border bg-surface-2/30">
                {result.changes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ListChecks className="w-3.5 h-3.5 text-green-400" />
                      <p className="text-xs font-bold text-text-primary uppercase tracking-wide">
                        What changed
                      </p>
                    </div>
                    <ul className="space-y-1.5">
                      {result.changes.map((c, i) => (
                        <li key={i} className="flex gap-2 text-xs text-text-secondary leading-relaxed">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.focusNotes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-accent" />
                      <p className="text-xs font-bold text-text-primary uppercase tracking-wide">
                        Craft notes
                      </p>
                    </div>
                    <ul className="space-y-1.5">
                      {result.focusNotes.map((c, i) => (
                        <li key={i} className="flex gap-2 text-xs text-text-secondary leading-relaxed">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <pre className="max-h-[460px] overflow-auto px-5 py-4 text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
              {result.enhancedScript}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
