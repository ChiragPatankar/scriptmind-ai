"use client";

import React, { Fragment, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Lightbulb, PenLine, MessageSquare, DollarSign, BarChart3, Rocket } from "lucide-react";

const steps = [
  { icon: Lightbulb,      label: "Idea",     desc: "Generate your concept with AI story tools",       color: "#A78BFA", bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.25)" },
  { icon: PenLine,        label: "Script",   desc: "Write your full screenplay in Studio mode",        color: "#7C3AED", bg: "rgba(124,58,237,0.1)",   border: "rgba(124,58,237,0.25)" },
  { icon: MessageSquare,  label: "Dialogue", desc: "Perfect every scene with AI dialogue generation",  color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   border: "rgba(59,130,246,0.25)" },
  { icon: DollarSign,     label: "Budget",   desc: "Plan your complete film budget and forecast ROI",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.25)" },
  { icon: BarChart3,      label: "Analysis", desc: "Run AI analysis on originality and market fit",    color: "#EC4899", bg: "rgba(236,72,153,0.1)",   border: "rgba(236,72,153,0.25)" },
  { icon: Rocket,         label: "Launch",   desc: "Package, pitch, and take your project to market",  color: "#22C55E", bg: "rgba(34,197,94,0.1)",    border: "rgba(34,197,94,0.25)" },
];

export default function WorkflowSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0B0B0F 0%, #0e0b18 50%, #0B0B0F 100%)" }}
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.3em] font-bold text-secondary mb-4">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
            <span style={{
              background: "linear-gradient(180deg, #FFFFFF 30%, rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              All Your Tools in
            </span>
            {" "}
            <span style={{
              background: "linear-gradient(135deg, #22C55E 0%, #7C3AED 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              One Place
            </span>
          </h2>
          <p className="text-base text-text-muted max-w-lg mx-auto">
            A complete, end-to-end filmmaking pipeline. From your first idea to your opening night.
          </p>
        </motion.div>

        {/* Desktop: horizontal steps — connectors only in gaps (no line under icons) */}
        <div className="hidden lg:flex w-full items-start justify-center">
          {steps.map((step, i) => (
            <Fragment key={step.label}>
              {i > 0 && (
                <div className="flex-1 min-w-[8px] max-w-[140px] h-[76px] flex items-center self-start px-1">
                  <div className="relative w-full h-px rounded-full overflow-hidden">
                    <div
                      className="absolute inset-0 h-px rounded-full"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    />
                    <motion.div
                      className="absolute inset-0 h-px rounded-full origin-left"
                      style={{
                        background: `linear-gradient(90deg, ${steps[i - 1].color}, ${step.color})`,
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: inView ? 1 : 0 }}
                      transition={{
                        duration: 0.65,
                        delay: 0.15 + i * 0.1,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.55, ease: "easeOut" }}
                className="flex flex-col items-center text-center group w-[76px] shrink-0"
              >
                <motion.div
                  whileHover={{ scale: 1.12, boxShadow: `0 0 24px ${step.color}60` }}
                  transition={{ duration: 0.2 }}
                  className="w-[76px] h-[76px] rounded-2xl flex items-center justify-center mb-5 relative cursor-default"
                  style={{ background: step.bg, border: `1px solid ${step.border}` }}
                >
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{ background: step.color, color: "#0B0B0F" }}>
                    {i + 1}
                  </span>
                </motion.div>

                <h3 className="text-sm font-bold text-text-primary mb-1">{step.label}</h3>
                <p className="text-[11px] text-text-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            </Fragment>
          ))}
        </div>

        {/* Mobile: vertical steps */}
        <div className="lg:hidden space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="flex gap-5 relative"
            >
              {/* Vertical connector */}
              {i < steps.length - 1 && (
                <div className="absolute left-[29px] top-[60px] w-px h-[calc(100%-20px)]"
                  style={{ background: `linear-gradient(180deg, ${step.color}40, ${steps[i + 1].color}20)` }} />
              )}

              <div className="w-[60px] h-[60px] rounded-xl flex items-center justify-center flex-shrink-0 relative"
                style={{ background: step.bg, border: `1px solid ${step.border}` }}>
                <step.icon className="w-5 h-5" style={{ color: step.color }} />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                  style={{ background: step.color, color: "#0B0B0F" }}>
                  {i + 1}
                </span>
              </div>

              <div className="pb-10 pt-1">
                <h3 className="text-base font-bold text-text-primary mb-1">{step.label}</h3>
                <p className="text-sm text-text-muted">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
