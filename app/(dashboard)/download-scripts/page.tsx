"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Zap, FileText, MessageSquare, Image, BarChart3, TrendingDown,
  Calendar, RefreshCw, AlertTriangle, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type LogEntry = {
  id:           string;
  feature:      string;
  credits_used: number;
  created_at:   string;
};

type UsageData = {
  logs:            LogEntry[];
  credits:         number;
  plan:            string;
  plan_expires_at: string | null;
};

// ── Feature metadata ──────────────────────────────────────────────────────────

const FEATURE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  script_analysis:     { label: "Script Analysis",     icon: FileText,      color: "#0EA5E9" },
  story_generation:    { label: "Story Generation",    icon: BarChart3,     color: "#7C3AED" },
  dialogue:            { label: "AI Dialogue",         icon: MessageSquare, color: "#10B981" },
  image_generation:    { label: "Scene Visualizer",    icon: Image,         color: "#F59E0B" },
  projection_insights: { label: "Projection Insights", icon: TrendingDown,  color: "#EC4899" },
  credit_top_up:       { label: "Credit Top-up",       icon: Zap,           color: "#22C55E" },
};

function featureMeta(feature: string) {
  return FEATURE_META[feature] ?? { label: feature, icon: Zap, color: "#6B7280" };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function groupByDay(logs: LogEntry[]) {
  const map: Record<string, LogEntry[]> = {};
  logs.forEach((l) => {
    const day = new Date(l.created_at).toISOString().slice(0, 10);
    if (!map[day]) map[day] = [];
    map[day].push(l);
  });
  return map;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsageDashboardPage() {
  const [data,    setData]    = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function fetchUsage() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/usage", { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load usage data");
      setData(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsage(); }, []);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!data) return null;
    const logs = data.logs.filter((l) => l.credits_used > 0); // exclude top-ups

    const totalSpent = logs.reduce((s, l) => s + l.credits_used, 0);

    // Today (UTC)
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySpent = logs
      .filter((l) => l.created_at.slice(0, 10) === todayStr)
      .reduce((s, l) => s + l.credits_used, 0);

    // This month
    const monthStr = new Date().toISOString().slice(0, 7);
    const monthSpent = logs
      .filter((l) => l.created_at.slice(0, 7) === monthStr)
      .reduce((s, l) => s + l.credits_used, 0);

    // Per-feature breakdown
    const byFeature: Record<string, number> = {};
    logs.forEach((l) => {
      byFeature[l.feature] = (byFeature[l.feature] ?? 0) + l.credits_used;
    });

    // Sorted for chart
    const featureBreakdown = Object.entries(byFeature)
      .sort((a, b) => b[1] - a[1])
      .map(([feature, used]) => ({ feature, used }));

    const maxUsed = featureBreakdown[0]?.used ?? 1;

    return { totalSpent, todaySpent, monthSpent, featureBreakdown, maxUsed };
  }, [data]);

  const grouped = useMemo(() =>
    data ? groupByDay(data.logs) : {}
  , [data]);

  const days = useMemo(() => Object.keys(grouped).sort().reverse(), [grouped]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-text-muted text-sm">{error}</p>
        <button onClick={fetchUsage} className="text-xs text-accent underline">Retry</button>
      </div>
    );
  }

  const planLabel = (data?.plan ?? "free").charAt(0).toUpperCase() + (data?.plan ?? "free").slice(1);
  const isExpired = data?.plan_expires_at && new Date() > new Date(data.plan_expires_at);

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-text-primary mb-1">Usage Dashboard</h1>
          <p className="text-text-muted text-sm">Track your AI credit consumption across all features.</p>
        </div>
        <button
          onClick={fetchUsage}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors border border-border hover:border-accent/30 rounded-lg px-3 py-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: "Credits Left",    value: data?.credits ?? 0,       icon: Zap,          color: "#7C3AED", suffix: "" },
          { label: "Used Today",      value: stats?.todaySpent ?? 0,   icon: Calendar,     color: "#0EA5E9", suffix: "" },
          { label: "Used This Month", value: stats?.monthSpent ?? 0,   icon: TrendingDown, color: "#F59E0B", suffix: "" },
          { label: "Used (90 days)",  value: stats?.totalSpent ?? 0,   icon: BarChart3,    color: "#10B981", suffix: "" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.07 }}
              className="rounded-2xl border border-border bg-surface-2 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                </div>
                <span className="text-xs text-text-muted font-medium">{s.label}</span>
              </div>
              <p className="text-2xl font-black text-text-primary tabular-nums">{s.value}{s.suffix}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Feature Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-surface-2 p-6"
        >
          <h2 className="text-base font-bold text-text-primary mb-5">Credits by Feature (90 days)</h2>
          {stats?.featureBreakdown.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">No usage yet.</p>
          ) : (
            <div className="space-y-4">
              {stats?.featureBreakdown.map(({ feature, used }) => {
                const meta = featureMeta(feature);
                const Icon = meta.icon;
                const pct  = Math.round((used / (stats.maxUsed || 1)) * 100);
                return (
                  <div key={feature}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                        <span className="text-xs font-medium text-text-secondary">{meta.label}</span>
                      </div>
                      <span className="text-xs font-bold text-text-primary tabular-nums">{used} cr</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Plan card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-surface-2 p-6 flex flex-col"
        >
          <h2 className="text-base font-bold text-text-primary mb-4">Your Plan</h2>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black text-text-primary">{planLabel}</span>
                {isExpired && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                    Expired
                  </span>
                )}
              </div>
              {data?.plan_expires_at && (
                <p className="text-xs text-text-muted mb-4">
                  {isExpired ? "Expired" : "Renews"} {formatDate(data.plan_expires_at)}
                </p>
              )}

              {/* Credits bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-text-muted mb-1.5">
                  <span>Credits remaining</span>
                  <span className="font-bold text-text-primary">{data?.credits ?? 0}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-purple-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((data?.credits ?? 0) / (data?.plan === "pro" ? 700 : data?.plan === "basic" ? 250 : 20)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <Link
              href="/settings?tab=billing"
              className="w-full text-center py-2.5 rounded-xl text-sm font-bold border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
            >
              {isExpired ? "Renew Plan" : data?.plan === "free" ? "Upgrade" : "Manage Plan"}
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Activity log */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-border bg-surface-2 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">Activity Log</h2>
          <span className="text-xs text-text-muted">Last 90 days</span>
        </div>

        {days.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="w-10 h-10 text-text-muted mb-3" />
            <p className="text-text-secondary font-medium">No activity yet</p>
            <p className="text-text-muted text-xs mt-1">Use an AI feature and it will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {days.map((day) => {
              const entries = grouped[day];
              const isOpen  = expanded[day] ?? true;
              const dayTotal = entries.reduce((s, l) => s + l.credits_used, 0);

              return (
                <div key={day}>
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [day]: !isOpen }))}
                    className="w-full flex items-center justify-between px-6 py-3 hover:bg-surface-3/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-sm font-semibold text-text-secondary">
                        {formatDate(entries[0].created_at)}
                      </span>
                      <span className="text-xs text-text-muted">· {entries.length} action{entries.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary tabular-nums">−{dayTotal} cr</span>
                      {isOpen
                        ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
                        : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                      }
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-3 space-y-2">
                      {entries.map((entry) => {
                        const meta = featureMeta(entry.feature);
                        const Icon = meta.icon;
                        const isTopUp = entry.credits_used < 0;
                        return (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-3/40 hover:bg-surface-3 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: `${meta.color}18` }}
                              >
                                <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-text-primary">{meta.label}</p>
                                <p className="text-[10px] text-text-muted">{formatTime(entry.created_at)}</p>
                              </div>
                            </div>
                            <span className={cn(
                              "text-xs font-bold tabular-nums",
                              isTopUp ? "text-green-400" : "text-text-secondary"
                            )}>
                              {isTopUp ? `+${Math.abs(entry.credits_used)}` : `−${entry.credits_used}`} cr
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
