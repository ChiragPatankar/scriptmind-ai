"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, BarChart3, Brain, Users, Zap, CheckCircle2, TrendingUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockAnalysis = {
  title: "Sholay (1975)",
  sentimentScore: 72,
  themes: ["Friendship", "Revenge", "Justice", "Love", "Loyalty"],
  characters: [
    { name: "Jai", lines: 234, screenTime: 85, sentiment: "positive" },
    { name: "Veeru", lines: 289, screenTime: 90, sentiment: "positive" },
    { name: "Gabbar Singh", lines: 156, screenTime: 62, sentiment: "negative" },
    { name: "Basanti", lines: 198, screenTime: 70, sentiment: "positive" },
    { name: "Thakur", lines: 112, screenTime: 55, sentiment: "neutral" },
  ],
  paceRating: 8.2,
  dialogueQuality: 9.1,
  structureScore: 8.7,
  suggestions: [
    "The second act builds tension masterfully with the dacoit sequences.",
    "Gabbar Singh's character has a powerful arc — consider analysing his dialogue patterns for villain writing inspiration.",
    "The comic relief from Veeru and Basanti balances the intense drama perfectly.",
  ],
};

export default function AnalysePage() {
  const [isAnalysed, setIsAnalysed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleAnalyse = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsAnalysed(true);
    }, 2500);
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black text-text-primary mb-1">Analyse Script</h1>
        <p className="text-text-muted">
          Upload any script and get instant AI-powered insights.
        </p>
      </motion.div>

      {!isAnalysed ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl"
        >
          {/* Upload Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleAnalyse(); }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
              dragOver
                ? "border-accent bg-accent/10"
                : "border-border hover:border-accent/40 hover:bg-surface-2"
            }`}
            onClick={handleAnalyse}
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-5">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Upload Your Script
            </h3>
            <p className="text-text-muted mb-5 text-sm leading-relaxed">
              Drag & drop or click to upload. Supports PDF, Final Draft (.fdx), and plain text files.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {["PDF", "FDX", "TXT", "DOCX"].map((fmt) => (
                <span
                  key={fmt}
                  className="text-xs px-2.5 py-1 rounded-full bg-surface-3 border border-border text-text-muted"
                >
                  .{fmt.toLowerCase()}
                </span>
              ))}
            </div>
            <Button loading={isLoading} className="mx-auto">
              {isLoading ? "Analysing Script..." : "Choose File or Demo Analyse"}
            </Button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { icon: Brain, label: "AI-Powered", desc: "Deep learning analysis" },
              { icon: Zap, label: "Instant", desc: "Results in seconds" },
              { icon: CheckCircle2, label: "Accurate", desc: "98% precision" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-surface border border-border rounded-xl p-4 text-center">
                  <Icon className="w-5 h-5 text-accent mx-auto mb-2" />
                  <div className="text-sm font-semibold text-text-primary">{item.label}</div>
                  <div className="text-xs text-text-muted mt-0.5">{item.desc}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Analysis Title */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{mockAnalysis.title}</h2>
              <p className="text-sm text-secondary flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                Analysis Complete
              </p>
            </div>
            <Button variant="secondary" onClick={() => setIsAnalysed(false)}>
              Analyse Another
            </Button>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Sentiment", value: mockAnalysis.sentimentScore, suffix: "%", color: "text-secondary", icon: TrendingUp },
              { label: "Dialogue Quality", value: mockAnalysis.dialogueQuality, suffix: "/10", color: "text-accent", icon: BarChart3 },
              { label: "Story Structure", value: mockAnalysis.structureScore, suffix: "/10", color: "text-gold", icon: Brain },
              { label: "Pace Rating", value: mockAnalysis.paceRating, suffix: "/10", color: "text-blue-400", icon: Zap },
            ].map((score) => {
              const Icon = score.icon;
              return (
                <Card key={score.label} variant="glass" hover={false}>
                  <CardContent className="p-5">
                    <Icon className={`w-5 h-5 ${score.color} mb-3`} />
                    <div className={`text-3xl font-black ${score.color} mb-1`}>
                      {score.value}
                      <span className="text-lg font-semibold text-text-muted">{score.suffix}</span>
                    </div>
                    <div className="text-xs text-text-muted">{score.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Characters */}
            <Card variant="default" hover={false}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-accent" />
                  Character Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAnalysis.characters.map((char) => (
                    <div key={char.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-text-secondary">
                          {char.name[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary truncate">{char.name}</span>
                          <span className="text-xs text-text-muted">{char.lines} lines</span>
                        </div>
                        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(char.screenTime / 100) * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`h-full rounded-full ${
                              char.sentiment === "positive"
                                ? "bg-secondary"
                                : char.sentiment === "negative"
                                ? "bg-red-500"
                                : "bg-text-muted"
                            }`}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-text-muted flex-shrink-0">{char.screenTime}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Themes & Suggestions */}
            <div className="space-y-4">
              <Card variant="default" hover={false}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Key Themes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {mockAnalysis.themes.map((theme) => (
                      <Badge key={theme} variant="default">{theme}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card variant="default" hover={false}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="w-4 h-4 text-gold" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {mockAnalysis.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-accent">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
