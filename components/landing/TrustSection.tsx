"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Brain, Globe, Shield, Zap } from "lucide-react";

const testimonials = [
  {
    name: "Aryan Kapoor",
    role: "Film Student, FTII Pune",
    avatar: "AK",
    avatarColor: "#7C3AED",
    rating: 5,
    text: "ScriptMind AI completely changed how I approach screenwriting. The AI feedback on structure and the dialogue generator saved me weeks of work on my short film project.",
  },
  {
    name: "Meera Nair",
    role: "Indie Filmmaker, Kerala",
    avatar: "MN",
    avatarColor: "#22C55E",
    rating: 5,
    text: "The financial dashboard is a game-changer. I used it to plan my entire debut feature budget and the ROI prediction convinced my investors to greenlight the project.",
  },
  {
    name: "Rohan Sharma",
    role: "YouTube Creator, 2.1M subscribers",
    avatar: "RS",
    avatarColor: "#F59E0B",
    rating: 5,
    text: "I script 4 videos a week and ScriptMind AI cut my scripting time in half. The hook generator alone is worth the Pro subscription. My views went up 40% after better scripts.",
  },
];

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

const stats = [
  { value: "50K+", label: "Filmmakers" },
  { value: "10K+", label: "Scripts Created" },
  { value: "₹500Cr+", label: "Budgets Planned" },
  { value: "4.9★", label: "Average Rating" },
];

export default function TrustSection() {
  return (
    <section className="relative py-28 overflow-hidden" style={{ background: "#0B0B0F" }}>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl p-8 mb-20 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
          style={{
            background: "rgba(16,16,26,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(12px)",
          }}
        >
          {stats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <div className="text-3xl font-black mb-1" style={{
                background: "linear-gradient(135deg, #7C3AED, #A78BFA, #22C55E)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {s.value}
              </div>
              <div className="text-sm text-text-muted">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.3em] font-bold text-accent mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
            <span style={{
              background: "linear-gradient(180deg, #FFFFFF 30%, rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Loved by Filmmakers
            </span>
          </h2>
        </motion.div>

        {/* Testimonials */}
        <div className="grid sm:grid-cols-3 gap-6 mb-20">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: "easeOut" }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl p-7 group"
              style={{ background: "rgba(16,16,26,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: t.avatarColor }}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                  <p className="text-xs text-text-muted">{t.role}</p>
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1px rgba(124,58,237,0.3), 0 0 30px rgba(124,58,237,0.08)` }} />
            </motion.div>
          ))}
        </div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <h3 className="text-2xl sm:text-3xl font-black text-text-primary mb-3">Why Trust ScriptMind AI?</h3>
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
