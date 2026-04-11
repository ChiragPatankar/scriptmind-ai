"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp, ShieldCheck, PieChart, Target, ArrowUpRight } from "lucide-react";

// ── Animated counter hook ────────────────────────────────────────────────────
function useCounter(end: number, duration: number, active: boolean, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = end / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(id); }
      else setVal(parseFloat(start.toFixed(decimals)));
    }, 16);
    return () => clearInterval(id);
  }, [active, end, duration, decimals]);
  return val;
}

// ── Metric counter card ───────────────────────────────────────────────────────
function MetricCard({
  prefix = "", suffix = "", value, decimals = 0, label, sub, icon: Icon, color, active,
}: {
  prefix?: string; suffix?: string; value: number; decimals?: number;
  label: string; sub: string; icon: React.ElementType; color: string; active: boolean;
}) {
  const count = useCounter(value, 1800, active, decimals);
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative p-6 rounded-2xl group"
      style={{ background: "rgba(16,16,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `0 0 40px ${color}18, inset 0 0 0 1px ${color}30` }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-secondary opacity-60 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-3xl font-black text-text-primary mb-1">
        {prefix}
        {decimals > 0 ? count.toFixed(decimals) : Math.round(count)}
        {suffix}
      </div>
      <p className="text-sm font-semibold text-text-secondary mb-0.5">{label}</p>
      <p className="text-xs text-text-muted">{sub}</p>
    </motion.div>
  );
}

// ── Budget bar row ────────────────────────────────────────────────────────────
function BudgetBar({ label, pct, amount, color, active, delay }: {
  label: string; pct: number; amount: string; color: string; active: boolean; delay: number;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{amount}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
          initial={{ width: "0%" }}
          animate={{ width: active ? `${pct}%` : "0%" }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function FinancialSection() {
  const ref   = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  const metrics = [
    { prefix: "₹", suffix: " Cr",  value: 2.4,  decimals: 1, label: "Avg. Budget Planned",  sub: "per indie film project",    icon: Target,    color: "#F59E0B" },
    { prefix: "₹", suffix: " Cr",  value: 12.8, decimals: 1, label: "Box Office Prediction", sub: "AI-powered accuracy",       icon: TrendingUp, color: "#22C55E" },
    { prefix: "",  suffix: "%",    value: 433,  decimals: 0, label: "Avg. ROI Predicted",    sub: "across tracked projects",   icon: PieChart,  color: "#7C3AED" },
    { prefix: "",  suffix: "/100", value: 94,   decimals: 0, label: "Risk Score Accuracy",   sub: "validated on past releases", icon: ShieldCheck, color: "#3B82F6" },
  ];

  const budgetBars = [
    { label: "Production",  pct: 80, amount: "₹2.4 Cr", color: "#7C3AED", delay: 0.3 },
    { label: "Marketing",   pct: 53, amount: "₹0.8 Cr", color: "#3B82F6", delay: 0.45 },
    { label: "Post Prod",   pct: 40, amount: "₹0.6 Cr", color: "#22C55E", delay: 0.6 },
    { label: "Contingency", pct: 20, amount: "₹0.2 Cr", color: "#F59E0B", delay: 0.75 },
  ];

  return (
    <section ref={ref} className="relative py-28 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0B0B0F 0%, #0e0b14 50%, #0B0B0F 100%)" }}
    >
      {/* Background glows */}
      <div className="absolute -top-40 right-[-10%] w-[700px] h-[700px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 65%)" }} />
      <div className="absolute bottom-[-20%] left-[-5%] w-[600px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 65%)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.3em] font-bold text-yellow-400 mb-4">
            Financial Intelligence
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
            <span style={{
              background: "linear-gradient(180deg, #FFFFFF 30%, rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              From Creative Idea to
            </span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #22C55E 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Financial Success
            </span>
          </h2>
          <p className="text-base text-text-muted max-w-xl mx-auto leading-relaxed">
            Plan your film like a business. ScriptMind&apos;s financial engine gives you
            the data to make confident, informed decisions before production begins.
          </p>
        </motion.div>

        {/* Metric cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.55 }}
            >
              <MetricCard {...m} active={inView} />
            </motion.div>
          ))}
        </div>

        {/* Dashboard preview */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Budget breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl p-6"
            style={{ background: "rgba(16,16,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-text-primary">Budget Breakdown</h3>
                <p className="text-xs text-text-muted mt-0.5">Sample project: Mumbai Monsoon</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
                ₹4.0 Cr Total
              </span>
            </div>
            {budgetBars.map((b) => (
              <BudgetBar key={b.label} {...b} active={inView} />
            ))}
          </motion.div>

          {/* Revenue forecast chart */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl p-6"
            style={{ background: "rgba(16,16,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-text-primary">Revenue Forecast</h3>
                <p className="text-xs text-text-muted mt-0.5">12-week box office projection</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1"
                style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
                <TrendingUp className="w-3 h-3" /> +433%
              </span>
            </div>

            {/* SVG line chart */}
            <div className="relative h-[160px]">
              <svg viewBox="0 0 440 140" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="50%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#22C55E" />
                  </linearGradient>
                  <linearGradient id="fillG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 1, 2, 3].map((i) => (
                  <line key={i} x1="0" y1={i * 35 + 10} x2="440" y2={i * 35 + 10}
                    stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                {/* Fill */}
                <path d="M 0,130 C 30,125 60,115 90,100 S 150,75 200,55 S 280,25 330,15 L 440,8 L 440,140 L 0,140 Z"
                  fill="url(#fillG)" />
                {/* Line */}
                <motion.path
                  d="M 0,130 C 30,125 60,115 90,100 S 150,75 200,55 S 280,25 330,15 L 440,8"
                  fill="none" stroke="url(#lineG)" strokeWidth="2.5" strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: inView ? 1 : 0 }}
                  transition={{ duration: 1.6, delay: 0.4, ease: "easeInOut" }}
                />
                {/* Dot at peak */}
                <motion.circle cx="440" cy="8" r="5" fill="#22C55E"
                  initial={{ scale: 0 }} animate={{ scale: inView ? 1 : 0 }}
                  transition={{ delay: 2, duration: 0.3 }} />
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[10px] text-text-muted pr-2 pointer-events-none">
                <span>₹15 Cr</span>
                <span>₹10 Cr</span>
                <span>₹5 Cr</span>
                <span>₹0</span>
              </div>
            </div>

            {/* Features list */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {["Budget Planning", "Revenue Prediction", "Risk Analysis", "ROI Insights"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
