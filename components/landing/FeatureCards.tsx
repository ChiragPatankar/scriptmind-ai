"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  PenLine, MessageSquare, BarChart3, FolderKanban,
  Brain, ImageIcon, ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: PenLine,
    title: "Script Writing Studio",
    desc: "Write and structure your screenplay with AI assistance. Intelligent formatting, scene suggestions, and real-time feedback built in.",
    accent: "#7C3AED",
    glow: "rgba(124,58,237,0.15)",
    tag: "Write",
  },
  {
    icon: MessageSquare,
    title: "AI Dialogue Generator",
    desc: "Generate realistic dialogues for any scene instantly. Choose tone, language (Hindi, Hinglish, English), and character voice.",
    accent: "#22C55E",
    glow: "rgba(34,197,94,0.12)",
    tag: "Generate",
  },
  {
    icon: BarChart3,
    title: "Financial Dashboard",
    desc: "Plan budgets, predict box office returns, and calculate ROI. Turn your creative vision into a data-backed business case.",
    accent: "#F59E0B",
    glow: "rgba(245,158,11,0.12)",
    tag: "Analyse",
  },
  {
    icon: FolderKanban,
    title: "Project Management",
    desc: "Manage scripts, versions, team collaborators, and your entire film pipeline from pre-production to post.",
    accent: "#3B82F6",
    glow: "rgba(59,130,246,0.12)",
    tag: "Manage",
  },
  {
    icon: Brain,
    title: "Script Analysis Engine",
    desc: "Understand emotional arc, originality score, pacing, and predicted audience impact — all powered by AI.",
    accent: "#EC4899",
    glow: "rgba(236,72,153,0.12)",
    tag: "Analyse",
  },
  {
    icon: ImageIcon,
    title: "AI Movie Poster Generator",
    desc: "Create cinematic promotional posters and mood boards for your film concept using generative AI.",
    accent: "#06B6D4",
    glow: "rgba(6,182,212,0.12)",
    tag: "Create",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

export default function FeatureCards() {
  return (
    <section id="features" className="relative py-28 overflow-hidden" style={{ background: "#0B0B0F" }}>
      {/* subtle grid bg */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(124,58,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.3em] font-bold text-accent mb-4">
            Platform Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
            <span style={{
              background: "linear-gradient(180deg, #FFFFFF 30%, rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Everything You Need to
            </span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 60%, #22C55E 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Make Your Film
            </span>
          </h2>
          <p className="text-base text-text-muted max-w-xl mx-auto leading-relaxed">
            Six powerful tools, one seamless platform. Built for filmmakers at every stage of their journey.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group relative rounded-2xl p-6 cursor-pointer"
              style={{
                background: "rgba(16,16,24,0.8)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1px ${f.accent}40, 0 0 40px ${f.glow}` }}
              />

              {/* Top row */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${f.glow}`, border: `1px solid ${f.accent}30` }}
                >
                  <f.icon className="w-6 h-6" style={{ color: f.accent }} />
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg"
                  style={{ color: f.accent, background: `${f.glow}`, border: `1px solid ${f.accent}25` }}
                >
                  {f.tag}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-text-primary mb-2 leading-snug">{f.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-6">{f.desc}</p>

              {/* CTA */}
              <div className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group-hover:gap-2.5"
                style={{ color: f.accent }}
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-6 right-6 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)` }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
