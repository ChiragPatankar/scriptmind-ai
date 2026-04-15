"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Brain, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AnalyseScriptDashboard,
  AnalyseDashboardSkeleton,
} from "@/components/analyse";
import type { AnalyseScriptReport } from "@/lib/mock/analyse-script";
import { analyseScriptFile, getAnalyseApiBaseUrl } from "@/lib/analyse-api";

type Phase = "upload" | "loading" | "report";

const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export default function AnalysePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [report, setReport] = useState<AnalyseScriptReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const runAnalysis = useCallback(async (file: File) => {
    setError(null);
    setPhase("loading");
    try {
      const data = await analyseScriptFile(file);
      setReport(data);
      setPhase("report");
    } catch (e) {
      setPhase("upload");
      setReport(null);
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    }
  }, []);

  const pickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChosen = useCallback(
    (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
        setError("Please upload a PDF, DOCX, or TXT file (backend-supported formats).");
        return;
      }
      void runAnalysis(file);
    },
    [runAnalysis]
  );

  const reset = useCallback(() => {
    setPhase("upload");
    setReport(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-hidden
        onChange={(e) => onFileChosen(e.target.files)}
      />

      {phase === "upload" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-text-primary mb-1">
            Analyse Script
          </h1>
          <p className="text-text-muted">
            Upload a script file — your PDF or DOCX is sent to the analysis API and
            the dashboard fills with real results.
          </p>
          <p className="text-xs text-text-muted mt-2">
            API: <code className="text-text-secondary">{getAnalyseApiBaseUrl()}</code>
            {" · "}
            Set <code className="text-text-secondary">NEXT_PUBLIC_ANALYSE_API_URL</code> in{" "}
            <code className="text-text-secondary">.env.local</code> if the backend runs elsewhere.
          </p>
        </motion.div>
      )}

      {phase === "upload" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl"
        >
          {error && (
            <div
              className="mb-4 flex gap-3 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

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
              onFileChosen(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
              dragOver
                ? "border-accent bg-accent/10"
                : "border-border hover:border-accent/40 hover:bg-surface-2"
            }`}
            onClick={pickFile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pickFile();
              }
            }}
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-5">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Upload your script
            </h3>
            <p className="text-text-muted mb-5 text-sm leading-relaxed">
              Click or drag a file here. We send it to your FastAPI service (PDF, DOCX,
              or TXT) — no mock data.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {["PDF", "DOCX", "TXT"].map((fmt) => (
                <span
                  key={fmt}
                  className="text-xs px-2.5 py-1 rounded-full bg-surface-3 border border-border text-text-muted"
                >
                  .{fmt.toLowerCase()}
                </span>
              ))}
            </div>
            <Button
              type="button"
              className="mx-auto"
              onClick={(e) => {
                e.stopPropagation();
                pickFile();
              }}
            >
              Choose file
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              { icon: Brain, label: "AI-Powered", desc: "Gemini analysis" },
              { icon: Zap, label: "Live API", desc: "Real upload & JSON" },
              {
                icon: CheckCircle2,
                label: "Dashboard",
                desc: "Charts & export",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-surface border border-border rounded-xl p-4 text-center"
                >
                  <Icon className="w-5 h-5 text-accent mx-auto mb-2" />
                  <div className="text-sm font-semibold text-text-primary">
                    {item.label}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">{item.desc}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {phase === "loading" && <AnalyseDashboardSkeleton />}

      {phase === "report" && report && (
        <AnalyseScriptDashboard report={report} onAnalyseAnother={reset} />
      )}
    </div>
  );
}
