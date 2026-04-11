"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for students and hobbyists exploring filmmaking.",
    accent: "#6B7280",
    bg: "rgba(107,114,128,0.06)",
    border: "rgba(107,114,128,0.18)",
    features: [
      "3 scripts / month",
      "Basic AI dialogue (50 lines)",
      "Script formatting tools",
      "Community templates",
    ],
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
  },
  {
    name: "Pro",
    price: "₹799",
    period: "per month",
    desc: "The full platform for serious independent filmmakers.",
    accent: "#7C3AED",
    bg: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))",
    border: "rgba(124,58,237,0.35)",
    featured: true,
    features: [
      "Unlimited scripts",
      "Unlimited AI dialogue",
      "Financial dashboard + ROI",
      "Script analysis engine",
      "AI poster generator",
      "Priority AI processing",
    ],
    cta: "Start Pro Trial",
    ctaVariant: "default" as const,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    desc: "For studios, production houses, and large teams.",
    accent: "#F59E0B",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.2)",
    features: [
      "Everything in Pro",
      "Unlimited team seats",
      "Multi-project management",
      "Advanced analytics & reporting",
      "Dedicated account manager",
      "Custom integrations & API",
    ],
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
  },
];

export default function PricingPreview() {
  return (
    <section className="relative py-28 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0B0B0F 0%, #0d0b16 50%, #0B0B0F 100%)" }}
    >
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)" }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.3em] font-bold text-accent mb-4">
            Pricing
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
            <span style={{
              background: "linear-gradient(180deg, #FFFFFF 30%, rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Simple, Transparent Pricing
            </span>
          </h2>
          <p className="text-base text-text-muted max-w-md mx-auto">
            Start free. Upgrade when you&#39;re ready to go all in.
          </p>
        </motion.div>

        {/* Tier cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: "easeOut" }}
              whileHover={{ y: -5 }}
              className="relative rounded-2xl p-7 flex flex-col"
              style={{
                background: tier.bg,
                border: `1px solid ${tier.border}`,
                boxShadow: tier.featured ? `0 0 60px rgba(124,58,237,0.15)` : undefined,
              }}
            >
              {tier.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                    style={{ background: "#7C3AED", color: "#fff", boxShadow: "0 0 16px rgba(124,58,237,0.6)" }}>
                    <Zap className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}

              {/* Plan name + price */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: tier.accent }}>
                    {tier.name}
                  </span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-black text-text-primary">{tier.price}</span>
                  <span className="text-sm text-text-muted mb-1.5">{tier.period}</span>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{tier.desc}</p>
              </div>

              <div className="h-px mb-5" style={{ background: `${tier.accent}25` }} />

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tier.accent }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {tier.featured ? (
                <Link href="/signup">
                  <Button className="w-full" style={{ boxShadow: "0 0 20px rgba(124,58,237,0.35)" }}>
                    {tier.cta}
                  </Button>
                </Link>
              ) : (
                <Link href={tier.name === "Enterprise" ? "/support" : "/signup"}>
                  <button
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                    style={{
                      border: `1px solid ${tier.accent}40`,
                      color: tier.accent,
                      background: `${tier.accent}08`,
                    }}
                  >
                    {tier.cta}
                  </button>
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Full pricing link */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Link href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition-colors group"
          >
            View Full Pricing & Feature Comparison
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
