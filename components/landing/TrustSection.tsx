"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Globe, Shield, Zap } from "lucide-react";

const trustSignals = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    desc: "Trained on thousands of successful films, scripts, and box office patterns from Indian and global cinema.",
    color: "#7C3AED",
  },
  {
    icon: Globe,
    title: "Built for Indian & Global Cinema",
    desc: "First-of-its-kind platform that understands Bollywood storytelling conventions, Hinglish dialogue, and desi narratives.",
    color: "#22C55E",
  },
  {
    icon: Shield,
    title: "Your Scripts Stay Yours",
    desc: "End-to-end encryption and zero data sharing. We never use your scripts to train our models without explicit consent.",
    color: "#3B82F6",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    desc: "Instant AI responses, no queues, no lag. Our infrastructure scales to handle your creative flow at full speed.",
    color: "#F59E0B",
  },
];

export default function TrustSection() {
  return (
    <section className="relative py-28 overflow-hidden" style={{ background: "#0B0B0F" }}>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.3em] font-bold text-accent mb-4 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            Why ScriptMind AI
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span style={{
              background: "linear-gradient(180deg, #FFFFFF 30%, rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Built for Film Professionals
            </span>
          </h2>
          <p className="text-sm text-text-muted">Built with integrity, designed for creative professionals.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustSignals.map((ts, i) => (
            <motion.div
              key={ts.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="p-5 rounded-2xl text-center group hover:bg-white/[0.02] transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `${ts.color}15`, border: `1px solid ${ts.color}30` }}>
                <ts.icon className="w-5 h-5" style={{ color: ts.color }} />
              </div>
              <h4 className="text-sm font-bold text-text-primary mb-2">{ts.title}</h4>
              <p className="text-xs text-text-muted leading-relaxed">{ts.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
