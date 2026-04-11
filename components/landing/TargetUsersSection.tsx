"use client";

import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Film, Building2, Smartphone, ArrowRight } from "lucide-react";
import Link from "next/link";

const personas = [
  {
    icon: GraduationCap,
    title: "Film Students",
    subtitle: "Learn & Create",
    desc: "Master screenwriting fundamentals with AI guidance. Get real-time feedback on structure, pacing, and dialogue — like having a mentor available 24/7.",
    perks: ["Script formatting templates", "Scene structure analysis", "Free tier available"],
    accent: "#A78BFA",
    bg: "rgba(167,139,250,0.07)",
    border: "rgba(167,139,250,0.2)",
  },
  {
    icon: Film,
    title: "Indie Creators",
    subtitle: "Dream Big, Budget Smart",
    desc: "Bring ambitious stories to life on limited budgets. Use AI to write, plan finances, and predict whether your project can break even — before spending a single rupee.",
    perks: ["Budget forecasting", "ROI prediction", "One-click export"],
    accent: "#7C3AED",
    bg: "rgba(124,58,237,0.07)",
    border: "rgba(124,58,237,0.25)",
    featured: true,
  },
  {
    icon: Building2,
    title: "Production Houses",
    subtitle: "Scale Your Pipeline",
    desc: "Manage multiple projects, teams, and scripts from a single dashboard. AI-powered analysis helps you greenlight the right projects faster.",
    perks: ["Team collaboration", "Multi-project management", "Enterprise analytics"],
    accent: "#3B82F6",
    bg: "rgba(59,130,246,0.07)",
    border: "rgba(59,130,246,0.2)",
  },
  {
    icon: Smartphone,
    title: "Content Creators",
    subtitle: "YouTube & Reels",
    desc: "Write compelling scripts for your YouTube videos, Instagram Reels, and short-form content in minutes. Optimised for engagement and platform algorithms.",
    perks: ["Short-form templates", "Hook generator", "Multi-language support"],
    accent: "#22C55E",
    bg: "rgba(34,197,94,0.07)",
    border: "rgba(34,197,94,0.2)",
  },
];

export default function TargetUsersSection() {
  return (
    <section className="relative py-28 overflow-hidden" style={{ background: "#0B0B0F" }}>
      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(rgba(124,58,237,0.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.3em] font-bold text-accent mb-4">
            Who It&#39;s For
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
            <span style={{
              background: "linear-gradient(180deg, #FFFFFF 30%, rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Built for Every Filmmaker
            </span>
          </h2>
          <p className="text-base text-text-muted max-w-lg mx-auto">
            Whether you&#39;re writing your first scene or greenlit your tenth film,
            ScriptMind AI adapts to your workflow.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: "easeOut" }}
              whileHover={{ y: -6 }}
              className="relative rounded-2xl p-6 group cursor-default"
              style={{
                background: p.featured
                  ? `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))`
                  : p.bg,
                border: `1px solid ${p.border}`,
              }}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ background: "#7C3AED", color: "#fff", boxShadow: "0 0 16px rgba(124,58,237,0.5)" }}>
                    Most Popular
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: `${p.accent}18`, border: `1px solid ${p.accent}35` }}>
                <p.icon className="w-6 h-6" style={{ color: p.accent }} />
              </div>

              {/* Text */}
              <span className="text-[10px] uppercase tracking-widest font-bold mb-1 block" style={{ color: p.accent }}>
                {p.subtitle}
              </span>
              <h3 className="text-lg font-bold text-text-primary mb-3">{p.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-5">{p.desc}</p>

              {/* Perks */}
              <ul className="space-y-1.5 mb-6">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.accent }} />
                    {perk}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/signup"
                className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group-hover:gap-2.5"
                style={{ color: p.accent }}
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: `0 0 40px ${p.accent}12, inset 0 0 0 1px ${p.accent}25` }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
