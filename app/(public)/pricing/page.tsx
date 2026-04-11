"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, X, Zap, Star, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

const plans = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "For casual explorers and hobbyists",
    icon: Star,
    iconColor: "text-text-muted",
    highlighted: false,
    badge: null,
    cta: "Get Started Free",
    features: [
      { text: "5 script analyses per month", included: true },
      { text: "10 AI dialogue generations", included: true },
      { text: "2 story outlines per month", included: true },
      { text: "100 script downloads/month", included: true },
      { text: "Hindi, Hinglish, English", included: true },
      { text: "Unlimited projects", included: false },
      { text: "Priority AI processing", included: false },
      { text: "API access", included: false },
      { text: "Export to Final Draft", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 799,
    yearlyPrice: 639,
    description: "For serious writers and filmmakers",
    icon: Zap,
    iconColor: "text-accent",
    highlighted: true,
    badge: "Most Popular",
    cta: "Start Pro Trial",
    features: [
      { text: "Unlimited script analyses", included: true },
      { text: "Unlimited AI dialogue generation", included: true },
      { text: "Unlimited story outlines", included: true },
      { text: "Unlimited script downloads", included: true },
      { text: "All languages + Urdu support", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Priority AI processing", included: true },
      { text: "API access (1,000 calls/mo)", included: true },
      { text: "Export to Final Draft", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "For studios and production companies",
    icon: Building2,
    iconColor: "text-gold",
    highlighted: false,
    badge: null,
    cta: "Contact Sales",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Custom script training data", included: true },
      { text: "Dedicated AI model", included: true },
      { text: "Unlimited API access", included: true },
      { text: "White-label options", included: true },
      { text: "SSO & team management", included: true },
      { text: "SLA-backed uptime", included: true },
      { text: "Priority support + CSM", included: true },
      { text: "Custom integrations", included: true },
    ],
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-accent mb-4 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            Pricing
          </span>
          <h1 className="text-5xl sm:text-6xl font-black text-text-primary mb-5">
            Simple, Transparent <span className="text-gradient">Pricing</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            Start free and scale as your storytelling grows. No hidden fees, cancel anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-xl bg-surface border border-border">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                !yearly ? "bg-accent text-white" : "text-text-muted hover:text-text-secondary"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                yearly ? "bg-accent text-white" : "text-text-muted hover:text-text-secondary"
              )}
            >
              Yearly
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const price =
              plan.id === "enterprise"
                ? "Custom"
                : plan.id === "free"
                ? "₹0"
                : `₹${yearly ? plan.yearlyPrice : plan.monthlyPrice}`;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.6 }}
                className={cn(
                  "relative rounded-2xl border p-7 flex flex-col",
                  plan.highlighted
                    ? "border-accent/50 bg-gradient-to-b from-accent/10 to-surface shadow-glow"
                    : "border-border bg-surface"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="px-3 py-1 text-xs">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                      plan.highlighted ? "bg-accent/20" : "bg-surface-2"
                    )}>
                      <Icon className={cn("w-5 h-5", plan.iconColor)} />
                    </div>
                    <span className="text-lg font-bold text-text-primary">{plan.name}</span>
                  </div>
                  <p className="text-sm text-text-muted mb-4">{plan.description}</p>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-text-primary">{price}</span>
                    {plan.id !== "enterprise" && (
                      <span className="text-text-muted text-sm">/month</span>
                    )}
                  </div>
                  {yearly && plan.id === "pro" && (
                    <p className="text-xs text-secondary mt-1">Billed ₹{plan.yearlyPrice * 12}/year</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                      )}
                      <span className={cn("text-sm", feature.included ? "text-text-secondary" : "text-text-muted line-through")}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={plan.id === "enterprise" ? "/support" : "/signup"}>
                  <Button
                    variant={plan.highlighted ? "default" : "secondary"}
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Teaser */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-sm text-text-muted mt-10"
        >
          Questions?{" "}
          <Link href="/support" className="text-accent hover:text-accent-light transition-colors font-medium">
            Talk to our team
          </Link>
          {" "}or read the{" "}
          <Link href="/api-docs" className="text-accent hover:text-accent-light transition-colors font-medium">
            documentation
          </Link>
          .
        </motion.p>
      </div>
    </div>
  );
}
