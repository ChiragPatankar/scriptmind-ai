"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, Zap, Star, Building2, BarChart3, Brain, ArrowRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Plan definitions ─────────────────────────────────────────────────────────

const plans = [
  {
    id: "free",
    name: "Free",
    topBadge: "Start Here",
    topBadgeStyle: "bg-surface-2 text-text-muted border border-border/60",
    discountBadge: null,
    isCustom: false,
    monthlyPrice: 0,
    originalMonthlyPrice: null,
    yearlyPrice: 0,
    originalYearlyPrice: null,
    period: "forever",
    description: "Taste the AI. Get hooked.",
    icon: Star,
    accentColor: "#6B7280",
    glowColor: "rgba(107,114,128,0.12)",
    borderColor: "rgba(107,114,128,0.25)",
    cardBg: "rgba(107,114,128,0.04)",
    highlighted: false,
    aiLimits: [
      { label: "Script Analysis", value: "2 / month" },
      { label: "Create Story", value: "1 / month" },
      { label: "AI Dialogue", value: "3 / month" },
    ],
    features: [
      { text: "Basic script insights", included: true },
      { text: "Hindi / English / Hinglish", included: true },
      { text: "Project management", included: true },
      { text: "Emotion graphs", included: false },
      { text: "Character analysis", included: false },
      { text: "Finance Studio", locked: true },
    ],
    cta: "Start for Free",
    ctaHref: "/signup",
  },
  {
    id: "basic",
    name: "Basic",
    topBadge: null,
    topBadgeStyle: "",
    discountBadge: "Save ₹200",
    isCustom: false,
    monthlyPrice: 499,
    originalMonthlyPrice: 699,
    yearlyPrice: 399,
    originalYearlyPrice: 559,
    period: "per month",
    description: "Cover costs. Build momentum.",
    icon: Zap,
    accentColor: "#0EA5E9",
    glowColor: "rgba(14,165,233,0.12)",
    borderColor: "rgba(14,165,233,0.3)",
    cardBg: "rgba(14,165,233,0.04)",
    highlighted: false,
    aiLimits: [
      { label: "Script Analysis", value: "15 / month" },
      { label: "Create Story", value: "10 / month" },
      { label: "AI Dialogue", value: "30 / month" },
    ],
    features: [
      { text: "Full script insights", included: true },
      { text: "Emotion graphs", included: true },
      { text: "Character analysis", included: true },
      { text: "All languages + Urdu", included: true },
      { text: "Project management", included: true },
      { text: "Finance Studio", locked: true },
    ],
    cta: "Start Basic Plan",
    ctaHref: "/signup",
  },
  {
    id: "pro",
    name: "Pro",
    topBadge: "🔥 Most Popular",
    topBadgeStyle: "",
    discountBadge: "Save ₹200",
    isCustom: false,
    monthlyPrice: 1299,
    originalMonthlyPrice: 1499,
    yearlyPrice: 1039,
    originalYearlyPrice: 1199,
    period: "per month",
    description: "Maximum margin. Maximum power.",
    icon: BarChart3,
    accentColor: "#7C3AED",
    glowColor: "rgba(124,58,237,0.22)",
    borderColor: "rgba(124,58,237,0.5)",
    cardBg: "linear-gradient(145deg, rgba(124,58,237,0.14), rgba(124,58,237,0.05))",
    highlighted: true,
    aiLimits: [
      { label: "Script Analysis", value: "50 / month" },
      { label: "Create Story", value: "40 / month" },
      { label: "AI Dialogue", value: "100 / month" },
    ],
    features: [
      { text: "Everything in Basic", included: true },
      { text: "Finance Studio — Full Access", included: true, highlight: true },
      { text: "Projection Engine", included: true },
      { text: "ROI / NPV / IRR Calculator", included: true },
      { text: "PDF Export", included: true },
      { text: "Priority AI processing", included: true },
    ],
    cta: "Start Pro Plan",
    ctaHref: "/signup",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    topBadge: null,
    topBadgeStyle: "",
    discountBadge: null,
    isCustom: true,
    monthlyPrice: 0,
    originalMonthlyPrice: null,
    yearlyPrice: 0,
    originalYearlyPrice: null,
    period: "",
    description: "Scale revenue. Not costs.",
    icon: Building2,
    accentColor: "#F59E0B",
    glowColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.3)",
    cardBg: "rgba(245,158,11,0.04)",
    highlighted: false,
    aiLimits: [
      { label: "Script Analysis", value: "High + Fair Use" },
      { label: "Create Story", value: "High + Fair Use" },
      { label: "AI Dialogue", value: "High + Fair Use" },
    ],
    features: [
      { text: "Everything in Pro", included: true },
      { text: "API access", included: true },
      { text: "Priority processing", included: true },
      { text: "Custom workflows", included: true },
      { text: "Team accounts", included: true, soon: true },
      { text: "Dedicated account manager", included: true },
    ],
    cta: "Contact Sales",
    ctaHref: "/support",
  },
] as const;

const comparisonRows = [
  { feature: "Script Analysis / month", free: "2", basic: "15", pro: "50", enterprise: "High" },
  { feature: "Create Story / month", free: "1", basic: "10", pro: "40", enterprise: "High" },
  { feature: "AI Dialogue / month", free: "3", basic: "30", pro: "100", enterprise: "High" },
  { feature: "Emotion Graphs", free: false, basic: true, pro: true, enterprise: true },
  { feature: "Character Analysis", free: false, basic: true, pro: true, enterprise: true },
  { feature: "Finance Studio", free: false, basic: false, pro: true, enterprise: true },
  { feature: "Projection Engine", free: false, basic: false, pro: true, enterprise: true },
  { feature: "ROI / NPV / IRR", free: false, basic: false, pro: true, enterprise: true },
  { feature: "PDF Export", free: false, basic: false, pro: true, enterprise: true },
  { feature: "Priority AI Processing", free: false, basic: false, pro: true, enterprise: true },
  { feature: "API Access", free: false, basic: false, pro: false, enterprise: true },
  { feature: "Team Accounts", free: false, basic: false, pro: false, enterprise: "Soon" },
];

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) return <CheckCircle2 className="w-4 h-4 text-secondary mx-auto" />;
  if (value === false) return <span className="text-text-muted/25 text-xl mx-auto block text-center leading-none">—</span>;
  return <span className="text-xs font-semibold text-text-secondary">{value}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div
      className="min-h-screen pt-24 pb-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #0B0B0F 0%, #0d0b16 40%, #0B0B0F 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.3em] font-bold text-accent mb-4 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            Film Intelligence Platform
          </span>
          <h1 className="text-5xl sm:text-6xl font-black mb-5 leading-tight">
            <span style={{
              background: "linear-gradient(180deg, #FFFFFF 30%, rgba(255,255,255,0.5) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              AI is metered.
            </span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #a78bfa 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Finance Studio
            </span>
            <span style={{
              background: "linear-gradient(180deg, #FFFFFF 30%, rgba(255,255,255,0.5) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {" "}is your edge.
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-8">
            Pay for AI usage. Unlock Finance Studio as your competitive weapon. No fluff, no hidden fees.
          </p>

          {/* Monthly / Yearly toggle */}
          <div className="inline-flex items-center gap-1 p-1.5 rounded-xl bg-surface border border-border">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                !yearly ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text-secondary"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                yearly ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text-secondary"
              )}
            >
              Yearly
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold">
                –20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* ── Plan Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-20 items-start">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const currentPrice = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const originalPrice = yearly ? plan.originalYearlyPrice : plan.originalMonthlyPrice;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 + 0.2, duration: 0.55 }}
                whileHover={{
                  y: plan.highlighted ? -10 : -6,
                  scale: plan.highlighted ? 1.02 : 1,
                  transition: { duration: 0.2 },
                }}
                className="relative rounded-2xl p-6 flex flex-col"
                style={{
                  background: plan.cardBg,
                  border: `1px solid ${plan.borderColor}`,
                  boxShadow: plan.highlighted
                    ? `0 0 80px ${plan.glowColor}, 0 0 160px ${plan.glowColor}`
                    : `0 0 30px ${plan.glowColor}`,
                  // Pro card sits slightly taller via padding
                  paddingTop: plan.highlighted ? "2rem" : "1.5rem",
                }}
              >
                {/* Top badge */}
                {plan.topBadge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap",
                        plan.highlighted
                          ? "text-white"
                          : plan.topBadgeStyle
                      )}
                      style={
                        plan.highlighted
                          ? {
                              background: `linear-gradient(135deg, ${plan.accentColor}, #a78bfa)`,
                              boxShadow: `0 0 16px ${plan.glowColor}`,
                            }
                          : undefined
                      }
                    >
                      {plan.topBadge}
                    </span>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-4 mt-1">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${plan.accentColor}18`, border: `1px solid ${plan.accentColor}30` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: plan.accentColor }} />
                  </div>
                  <span className="text-base font-black text-text-primary">{plan.name}</span>

                  {/* Discount badge inline */}
                  {plan.discountBadge && (
                    <span className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
                      style={{
                        background: `${plan.accentColor}18`,
                        border: `1px solid ${plan.accentColor}35`,
                        color: plan.accentColor,
                      }}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {plan.discountBadge}
                    </span>
                  )}
                </div>

                {/* Price block */}
                <div className="mb-1">
                  {plan.isCustom ? (
                    /* Enterprise — custom pricing */
                    <div>
                      <p className="text-2xl font-black text-text-primary mb-0.5">Custom Pricing</p>
                      <p className="text-xs text-text-muted leading-relaxed">
                        Based on company size and requirements
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Strikethrough original price */}
                      {originalPrice !== null && originalPrice > 0 && (
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm line-through text-text-muted/50 font-medium">
                            ₹{originalPrice}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                            style={{
                              background: `${plan.accentColor}18`,
                              color: plan.accentColor,
                            }}
                          >
                            Limited Time
                          </span>
                        </div>
                      )}
                      {/* Current price */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-text-primary">
                          {currentPrice === 0 ? "₹0" : `₹${currentPrice}`}
                        </span>
                        <span className="text-sm text-text-muted">{plan.period}</span>
                      </div>
                      {yearly && currentPrice > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: plan.accentColor }}>
                          Billed ₹{currentPrice * 12}/year
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-text-muted mb-5 mt-2 leading-relaxed">{plan.description}</p>

                {/* AI Limits box */}
                <div
                  className="rounded-xl p-3.5 mb-5"
                  style={{ background: `${plan.accentColor}0A`, border: `1px solid ${plan.accentColor}20` }}
                >
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Brain className="w-3 h-3" style={{ color: plan.accentColor }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: plan.accentColor }}>
                      AI Usage
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {plan.aiLimits.map((limit) => (
                      <div key={limit.label} className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">{limit.label}</span>
                        <span className="text-xs font-bold text-text-secondary">{limit.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature list */}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2.5">
                      {f.locked ? (
                        <Lock className="w-3.5 h-3.5 text-text-muted/40 flex-shrink-0 mt-0.5" />
                      ) : f.included ? (
                        <CheckCircle2
                          className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                          style={{ color: ("highlight" in f && f.highlight) ? plan.accentColor : "#22c55e" }}
                        />
                      ) : (
                        <span className="w-3.5 h-0.5 bg-text-muted/20 flex-shrink-0 mt-2 rounded-full" />
                      )}
                      <span
                        className={cn(
                          "text-xs leading-relaxed",
                          f.locked
                            ? "text-text-muted/40"
                            : f.included
                            ? "text-text-secondary"
                            : "text-text-muted/40",
                          ("highlight" in f && f.highlight) && "font-semibold"
                        )}
                        style={("highlight" in f && f.highlight) ? { color: plan.accentColor } : undefined}
                      >
                        {f.text}
                        {("soon" in f && f.soon) && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold uppercase tracking-wider">
                            Soon
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link href={plan.ctaHref}>
                  <button
                    className={cn(
                      "w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
                      plan.highlighted ? "text-white" : ""
                    )}
                    style={
                      plan.highlighted
                        ? {
                            background: `linear-gradient(135deg, ${plan.accentColor}, #a78bfa)`,
                            boxShadow: `0 0 24px ${plan.glowColor}`,
                          }
                        : {
                            border: `1px solid ${plan.accentColor}40`,
                            color: plan.accentColor,
                            background: `${plan.accentColor}0A`,
                          }
                    }
                  >
                    {plan.cta}
                  </button>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ── Finance Studio Callout ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="rounded-2xl p-8 mb-20 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04))",
            border: "1px solid rgba(124,58,237,0.25)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.1), transparent 70%)" }}
          />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-[#7C3AED]" />
              <span className="text-xs font-black uppercase tracking-widest text-[#7C3AED]">Pro Exclusive</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-3">
              Finance Studio — Your Unfair Advantage
            </h2>
            <p className="text-text-muted max-w-xl mx-auto text-sm leading-relaxed mb-6">
              Full P&L modeling, Break-even analysis, NPV & IRR, Territory revenue splits, ROI gauge, and Investor reports — all client-side. Zero extra AI cost. Maximum value.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["P&L Modeling", "Break-even Analysis", "NPV & IRR", "Territory Revenue", "ROI Gauge", "PDF Export"].map((f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#a78bfa] bg-[#7C3AED]/15 border border-[#7C3AED]/25"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Comparison Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-2xl font-black text-text-primary text-center mb-8">Full Feature Comparison</h2>
          <div className="rounded-2xl overflow-hidden border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border" style={{ background: "rgba(124,58,237,0.06)" }}>
                  <th className="text-left px-5 py-4 text-text-muted font-semibold text-xs uppercase tracking-wider w-[35%]">
                    Feature
                  </th>
                  {[
                    { name: "Free", price: "₹0", color: "#6B7280" },
                    { name: "Basic", price: "₹499", color: "#0EA5E9" },
                    { name: "Pro", price: "₹1299", color: "#7C3AED" },
                    { name: "Enterprise", price: "Custom", color: "#F59E0B" },
                  ].map((p) => (
                    <th key={p.name} className="text-center px-3 py-3" style={{ color: p.color }}>
                      <div className="font-black text-sm">{p.name}</div>
                      <div className="text-[10px] font-semibold opacity-70 mt-0.5">{p.price}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      "border-b border-border/50 transition-colors hover:bg-surface-2/30",
                      i % 2 === 0 ? "bg-transparent" : "bg-surface/30"
                    )}
                  >
                    <td className="px-5 py-3.5 text-text-secondary text-xs font-medium">{row.feature}</td>
                    <td className="px-3 py-3.5 text-center"><FeatureCell value={row.free} /></td>
                    <td className="px-3 py-3.5 text-center"><FeatureCell value={row.basic} /></td>
                    <td className="px-3 py-3.5 text-center" style={{ background: "rgba(124,58,237,0.04)" }}>
                      <FeatureCell value={row.pro} />
                    </td>
                    <td className="px-3 py-3.5 text-center"><FeatureCell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── Footer CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center space-y-4"
        >
          <p className="text-text-muted text-sm">
            Questions?{" "}
            <Link href="/support" className="text-accent hover:text-accent/80 font-semibold transition-colors">
              Talk to our team
            </Link>
            {" "}or read the{" "}
            <Link href="/api-docs" className="text-accent hover:text-accent/80 font-semibold transition-colors">
              documentation
            </Link>
            .
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#a78bfa] hover:text-[#7C3AED] transition-colors group"
          >
            Start free — no credit card required
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
