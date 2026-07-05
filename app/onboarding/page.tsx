"use client";

/**
 * /onboarding — Plan selection shown immediately after signup.
 *
 * Flow:
 *   Free  → router.push("/projects")
 *   Basic / Pro → Razorpay checkout → on success → router.push("/projects?welcome=1")
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, BarChart3, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-browser";
import { useRazorpay } from "@/hooks/useRazorpay";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id:       "free" as const,
    name:     "Trial Pack",
    price:    "₹49",
    period:   "forever",
    credits:  "20 credits",
    color:    "#6B7280",
    icon:     Zap,
    features: ["Script analysis (2 cr)", "AI Dialogue (1 cr)", "Story generation (2 cr)", "Scene visualizer (3 cr)"],
    cta:      "Get Trial Pack",
  },
  {
    id:       "basic" as const,
    name:     "Basic",
    price:    "₹499",
    period:   "per month",
    credits:  "250 credits/mo",
    color:    "#0EA5E9",
    icon:     Zap,
    features: ["Everything in Trial Pack", "250 credits / month", "Finance Studio (1 trial)", "Full script insights"],
    cta:      "Get Basic",
    popular:  false,
  },
  {
    id:       "pro" as const,
    name:     "Pro",
    price:    "₹1,299",
    period:   "per month",
    credits:  "700 credits/mo",
    color:    "#7C3AED",
    icon:     BarChart3,
    features: ["Everything in Basic", "700 credits / month", "Finance Studio — Full Access", "Priority AI processing"],
    cta:      "Get Pro",
    popular:  true,
  },
] as const;

export default function OnboardingPage() {
  const router   = useRouter();
  const supabase = createClient();
  const { pay, paying } = useRazorpay();

  const [selected, setSelected]   = useState<"free" | "basic" | "pro" | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [authChecked, setChecked] = useState(false);

  // Redirect unauthenticated users to signup, and redirect authenticated users with an active plan to projects
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return;
      if (!user) {
        router.replace("/signup");
      } else {
        const { data: userProfile } = await supabase
          .from("users")
          .select("plan_expires_at")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;
        const planExpiresAt = userProfile?.plan_expires_at ?? null;
        const isExpired = planExpiresAt ? new Date() > new Date(planExpiresAt) : true;

        if (!isExpired) {
          router.replace("/projects");
        } else {
          setChecked(true);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  const handleSelect = async (planId: "free" | "basic" | "pro") => {
    setSelected(planId);
    setError(null);

    await pay(planId, {
      onSuccess: (_plan, _credits) => {
        router.push("/projects?welcome=1");
      },
      onError: (msg) => {
        setError(msg);
        setSelected(null);
      },
    });

    setSelected(null);
  };

  if (!authChecked) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background flex flex-col items-center justify-center p-6"
         style={{ colorScheme: "dark" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 max-w-lg"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="ScriptMind AI" width={36} height={36} className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold text-text-primary">ScriptMind <span className="text-gradient">AI</span></span>
        </div>
        <h1 className="text-3xl font-black text-text-primary mb-3">Choose your plan</h1>
        <p className="text-text-muted text-sm leading-relaxed">
          Pick the plan that fits your creative workflow.
          You can upgrade or cancel anytime.
        </p>
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6 max-w-2xl w-full"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        {PLANS.map((plan, i) => {
          const Icon      = plan.icon;
          const isLoading = selected === plan.id && (paying || plan.id === "free");

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "relative rounded-2xl border p-6 flex flex-col cursor-pointer transition-all duration-200",
                "hover:scale-[1.02]",
                "popular" in plan && plan.popular
                  ? "border-accent/50 bg-accent/8 shadow-[0_0_40px_rgba(124,58,237,0.15)]"
                  : "border-border bg-surface-2"
              )}
            >
              {"popular" in plan && plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}30` }}
                >
                  <Icon className="w-4 h-4" style={{ color: plan.color }} />
                </div>
                <span className="font-bold text-text-primary">{plan.name}</span>
              </div>

              <div className="mb-1">
                <span className="text-3xl font-black text-text-primary">{plan.price}</span>
                <span className="text-text-muted text-xs ml-1">{plan.period}</span>
              </div>
              <div
                className="text-xs font-semibold mb-5"
                style={{ color: plan.color }}
              >
                {plan.credits}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                size="sm"
                className="w-full"
                variant={"popular" in plan && plan.popular ? "default" : "secondary"}
                loading={isLoading}
                onClick={() => handleSelect(plan.id)}
                disabled={paying && selected !== plan.id}
                style={
                  "popular" in plan && plan.popular
                    ? {}
                    : { borderColor: `${plan.color}30`, color: plan.color }
                }
              >
                {plan.cta}
              </Button>
            </motion.div>
          );
        })}
      </div>

      <p className="text-text-muted text-xs mt-8">
        Secure payments via Razorpay · Cancel anytime
      </p>
    </div>
  );
}
