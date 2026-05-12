"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Lock, ArrowRight, Brain, BarChart3, Zap, Star, Building2, Tag } from "lucide-react";
import Link from "next/link";
import PlanCTAButton from "@/components/PlanCTAButton";

const tiers = [
  {
    name: "Free",
    topBadge: "Start Here",
    topBadgeFeatured: false,
    discountBadge: null,
    price: "₹0",
    originalPrice: null,
    period: "forever",
    isCustom: false,
    icon: Star,
    accent: "#6B7280",
    glow: "rgba(107,114,128,0.1)",
    border: "rgba(107,114,128,0.22)",
    bg: "rgba(107,114,128,0.04)",
    aiLimits: [
      { label: "Credits", value: "20 credits" },
      { label: "Script Analysis", value: "2 cr each" },
      { label: "AI Dialogue", value: "1 cr each" },
    ],
    features: [
      "Basic script insights",
      "Hindi / English / Hinglish",
      "Project management",
    ],
    locked: "Finance Studio",
    featured: false,
    cta: "Start for Free",
    ctaHref: "/signup",
  },
  {
    name: "Basic",
    topBadge: null,
    topBadgeFeatured: false,
    discountBadge: "Save ₹200",
    price: "₹499",
    originalPrice: "₹699",
    period: "/ month",
    isCustom: false,
    icon: Zap,
    accent: "#0EA5E9",
    glow: "rgba(14,165,233,0.1)",
    border: "rgba(14,165,233,0.28)",
    bg: "rgba(14,165,233,0.04)",
    aiLimits: [
      { label: "Credits", value: "250 credits / mo" },
      { label: "Script Analysis", value: "2 cr each" },
      { label: "Finance Studio", value: "1 free trial" },
    ],
    features: [
      "Full script insights + Emotion graphs",
      "Character analysis",
      "All languages + Urdu",
      "Finance Studio (1 free trial)",
    ],
    locked: null,
    featured: false,
    cta: "Start Basic Plan",
    ctaHref: "/signup",
  },
  {
    name: "Pro",
    topBadge: "🔥 Most Popular",
    topBadgeFeatured: true,
    discountBadge: "Save ₹200",
    price: "₹1299",
    originalPrice: "₹1499",
    period: "/ month",
    isCustom: false,
    icon: BarChart3,
    accent: "#7C3AED",
    glow: "rgba(124,58,237,0.22)",
    border: "rgba(124,58,237,0.5)",
    bg: "linear-gradient(145deg, rgba(124,58,237,0.14), rgba(124,58,237,0.05))",
    aiLimits: [
      { label: "Credits", value: "700 credits / mo" },
      { label: "Finance Studio", value: "Full access" },
      { label: "Visualize Scene", value: "3 cr each" },
    ],
    features: [
      "Everything in Basic",
      "Finance Studio — Full Access",
      "Projection Engine",
      "ROI / NPV / IRR + PDF Export",
      "Priority AI processing",
    ],
    locked: null,
    featured: true,
    cta: "Start Pro Plan",
    ctaHref: "/signup",
  },
  {
    name: "Enterprise",
    topBadge: null,
    topBadgeFeatured: false,
    discountBadge: null,
    price: "Custom",
    originalPrice: null,
    period: "",
    isCustom: true,
    icon: Building2,
    accent: "#F59E0B",
    glow: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.28)",
    bg: "rgba(245,158,11,0.04)",
    aiLimits: [
      { label: "Script Analysis", value: "High + Fair Use" },
      { label: "Create Story", value: "High + Fair Use" },
      { label: "AI Dialogue", value: "High + Fair Use" },
    ],
    features: [
      "Everything in Pro",
      "API access",
      "Priority processing",
      "Custom workflows",
      "Dedicated account manager",
    ],
    locked: null,
    featured: false,
    cta: "Contact Sales",
    ctaHref: "/support",
  },
];

export default function PricingPreview() {
  return (
    <section
      className="relative py-28 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0B0B0F 0%, #0e0b18 50%, #0B0B0F 100%)" }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.3em] font-bold text-accent mb-4 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            Pricing
          </span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            <span style={{
              background: "linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.5) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              AI is metered.{" "}
            </span>
            <span style={{
              background: "linear-gradient(135deg, #7C3AED, #a78bfa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Finance Studio
            </span>
            <span style={{
              background: "linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.5) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {" "}is your edge.
            </span>
          </h2>
          <p className="text-base text-text-muted max-w-lg mx-auto">
            Pay for AI usage. Unlock Finance Studio as your competitive weapon.
          </p>
        </motion.div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10 items-start">
          {tiers.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.09, duration: 0.55, ease: "easeOut" }}
                whileHover={{
                  y: tier.featured ? -10 : -6,
                  scale: tier.featured ? 1.02 : 1,
                  transition: { duration: 0.2 },
                }}
                className="relative rounded-2xl p-6 flex flex-col"
                style={{
                  background: tier.bg,
                  border: `1px solid ${tier.border}`,
                  boxShadow: tier.featured
                    ? `0 0 70px ${tier.glow}, 0 0 120px ${tier.glow}`
                    : `0 0 24px ${tier.glow}`,
                  paddingTop: tier.featured ? "2rem" : "1.5rem",
                }}
              >
                {/* Top badge */}
                {tier.topBadge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap text-white"
                      style={
                        tier.topBadgeFeatured
                          ? {
                              background: `linear-gradient(135deg, ${tier.accent}, #a78bfa)`,
                              boxShadow: `0 0 16px ${tier.glow}`,
                            }
                          : { background: tier.accent }
                      }
                    >
                      {tier.topBadge}
                    </span>
                  </div>
                )}

                {/* Icon + Name + Discount badge */}
                <div className="flex items-center gap-2.5 mb-4 mt-1">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${tier.accent}18`, border: `1px solid ${tier.accent}28` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: tier.accent }} />
                  </div>
                  <span className="text-base font-black text-text-primary">{tier.name}</span>
                  {tier.discountBadge && (
                    <span
                      className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: `${tier.accent}18`,
                        border: `1px solid ${tier.accent}30`,
                        color: tier.accent,
                      }}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tier.discountBadge}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  {tier.isCustom ? (
                    <div>
                      <p className="text-xl font-black text-text-primary">Custom Pricing</p>
                      <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                        Based on size & requirements
                      </p>
                    </div>
                  ) : (
                    <div>
                      {tier.originalPrice && (
                        <span className="text-xs line-through text-text-muted/50 font-medium block mb-0.5">
                          {tier.originalPrice}
                        </span>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-text-primary">{tier.price}</span>
                        {tier.period && (
                          <span className="text-sm text-text-muted">{tier.period}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Usage pill */}
                <div
                  className="rounded-xl px-3.5 py-2.5 mb-4"
                  style={{ background: `${tier.accent}0A`, border: `1px solid ${tier.accent}1A` }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="w-3 h-3" style={{ color: tier.accent }} />
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: tier.accent }}>
                      AI Usage
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {tier.aiLimits.map((limit) => (
                      <div key={limit.label} className="flex items-center justify-between">
                        <span className="text-[11px] text-text-muted">{limit.label}</span>
                        <span className="text-[11px] font-bold text-text-secondary">{limit.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                      <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: tier.accent }} />
                      {f}
                    </li>
                  ))}
                  {tier.locked && (
                    <li className="flex items-start gap-2 text-xs text-text-muted/40">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {tier.locked}
                    </li>
                  )}
                </ul>

                {/* CTA */}
                <PlanCTAButton
                  plan={tier.name.toLowerCase() as "free" | "basic" | "pro" | "enterprise"}
                  label={tier.cta}
                  featured={tier.featured}
                  accent={tier.accent}
                  glow={tier.glow}
                />
              </motion.div>
            );
          })}
        </div>

        {/* View full pricing link */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition-colors group"
          >
            View full feature comparison
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
