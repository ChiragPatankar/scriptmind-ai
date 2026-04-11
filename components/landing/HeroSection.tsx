"use client";

import React, { useRef, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, ChevronDown, Sparkles,
  Film, DollarSign, MessageSquare, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "./SearchBar";

// ── Branding colors (matching logo: dark-navy → blue → cyan) ────────────────
const BLUE   = "#1D77C5";
const CYAN   = "#00C2E0";
const NAVY   = "#060D1C";

// ── Types ────────────────────────────────────────────────────────────────────
export interface BollywoodMovie {
  id: number | string;
  title: string;
  posterUrl: string;
  rating?: number | string;
  year?: number | string;
}

// ── Mock UI Cards ─────────────────────────────────────────────────────────────

function WindowDots() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
      <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
    </div>
  );
}

function ScriptEditorCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden w-full shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
      style={{
        background: "rgba(10,12,22,0.93)",
        border: `1px solid ${BLUE}35`,
        backdropFilter: "blur(24px)",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <WindowDots />
        <div className="flex items-center gap-2">
          <Film className="w-3.5 h-3.5" style={{ color: BLUE }} />
          <span className="text-xs font-semibold text-text-primary">Script Studio</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${BLUE}20`, color: BLUE }}>AI</span>
      </div>
      <div className="px-5 py-4 font-mono text-[11px] leading-relaxed space-y-2">
        <p className="uppercase tracking-widest text-[10px]" style={{ color: CYAN }}>INT. MUMBAI ROOFTOP — NIGHT</p>
        <div className="h-px bg-white/[0.04] my-2" />
        <div className="text-center">
          <p className="font-bold uppercase tracking-widest text-[11px] text-yellow-300/90">ARJUN</p>
          <p className="text-white/40 italic text-[10px]">(looking at the city lights)</p>
          <p className="text-white/75 mt-1 leading-snug">Yeh sheher roz ek nayi<br />kahani likhta hai...</p>
        </div>
        <div className="text-center mt-2">
          <p className="font-bold uppercase tracking-widest text-[11px] text-yellow-300/90">PRIYA</p>
          <p className="text-white/75 mt-0.5">Aur aaj ki raat ki?</p>
        </div>
      </div>
      <div className="mx-4 mb-4 px-3 py-2 rounded-lg" style={{ background: `${BLUE}12`, border: `1px solid ${BLUE}25` }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: CYAN }} />
          <p className="text-[10px]" style={{ color: CYAN }}>AI: Add emotional subtext to deepen scene</p>
        </div>
      </div>
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-[10px] text-text-muted">Words: 1,247</span>
        <span className="text-[10px] text-text-muted">Scene 12 of 89</span>
        <span className="text-[10px] flex items-center gap-1" style={{ color: CYAN }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: CYAN }} /> Saved
        </span>
      </div>
    </div>
  );
}

function FinancialCard() {
  const bars = [
    { label: "Production", value: 80, amount: "₹2.4 Cr", color: BLUE },
    { label: "Marketing",  value: 53, amount: "₹0.8 Cr", color: CYAN },
    { label: "Post Prod",  value: 40, amount: "₹0.6 Cr", color: "#5BA8E5" },
  ];
  return (
    <div
      className="rounded-2xl overflow-hidden w-full shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
      style={{ background: "rgba(10,12,22,0.93)", border: `1px solid ${CYAN}25`, backdropFilter: "blur(24px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <WindowDots />
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-gold" />
          <span className="text-xs font-semibold text-text-primary">Financial Overview</span>
        </div>
        <TrendingUp className="w-3.5 h-3.5" style={{ color: CYAN }} />
      </div>
      <div className="px-4 pt-4 pb-2 space-y-2.5">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-text-muted">{bar.label}</span>
              <span className="text-[10px] font-semibold text-text-secondary">{bar.amount}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-surface-3">
              <div className="h-full rounded-full" style={{ width: `${bar.value}%`, background: bar.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mx-4 mb-4 mt-2 p-3 rounded-xl" style={{ background: `${CYAN}0D`, border: `1px solid ${CYAN}25` }}>
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Box Office Prediction</p>
        <div className="flex items-end gap-2">
          <span className="text-xl font-black text-text-primary">₹12.8 Cr</span>
          <span className="text-xs font-bold mb-0.5" style={{ color: CYAN }}>↑ +433% ROI</span>
        </div>
        <svg viewBox="0 0 200 40" className="w-full mt-2 h-8">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={BLUE} />
              <stop offset="100%" stopColor={CYAN} />
            </linearGradient>
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CYAN} stopOpacity="0.25" />
              <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 0,36 C 20,32 40,26 60,20 S 100,10 130,6 L 200,3 L 200,40 L 0,40 Z" fill="url(#fillGrad)" />
          <path d="M 0,36 C 20,32 40,26 60,20 S 100,10 130,6 L 200,3" fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}

function DialogueCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden w-full shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
      style={{ background: "rgba(10,12,22,0.93)", border: `1px solid ${CYAN}30`, backdropFilter: "blur(24px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <WindowDots />
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" style={{ color: CYAN }} />
          <span className="text-xs font-semibold text-text-primary">AI Dialogue</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${CYAN}15`, color: CYAN }}>Hinglish</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] px-2 py-1 rounded-lg bg-surface-2 border border-border text-text-muted">🌙 Rooftop at midnight</span>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-surface-2 border border-border text-text-muted">❤️ Romantic</span>
        </div>
        <div className="h-px bg-white/[0.05] mb-3" />
        <div className="space-y-2.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: BLUE }}>RAHUL</span>
            <p className="text-[11px] text-white/75 leading-snug bg-surface-2 rounded-lg px-3 py-2">Aaj raat kuch alag lagta hai...</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: CYAN }}>SIMRAN</span>
            <p className="text-[11px] text-white/75 leading-snug bg-surface-2 rounded-lg px-3 py-2">Haan, jaise waqt ruk gaya ho.</p>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <button className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold border" style={{ background: `${CYAN}15`, borderColor: `${CYAN}30`, color: CYAN }}>Regenerate</button>
        <button className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-surface-2 border border-border text-text-muted">Save</button>
      </div>
    </div>
  );
}

// ── Main HeroSection ──────────────────────────────────────────────────────────

interface HeroSectionProps {
  movies?: BollywoodMovie[];
}

export default function HeroSection({ movies = [] }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const textY  = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const fadeOp = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const bgY    = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  // Build 4 marquee rows, each doubled for seamless loop
  const rows = useMemo(() => {
    if (!movies.length) return [];
    const base = movies.length < 8 ? [...movies, ...movies, ...movies, ...movies] : movies;
    const half = Math.ceil(base.length / 2);
    const r1   = base.slice(0, half);
    const r2   = base.slice(half);
    return [
      { items: [...r1, ...r1], dir: -1, speed: 38 },
      { items: [...r2, ...r2], dir:  1, speed: 46 },
      { items: [...r1, ...r1], dir: -1, speed: 42 },
      { items: [...r2, ...r2], dir:  1, speed: 36 },
    ];
  }, [movies]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-start overflow-hidden pt-16"
      style={{ background: `radial-gradient(ellipse 130% 90% at 50% -10%, ${NAVY} 0%, #0B0B0F 55%)` }}
    >
      {/* ── MOVIE POSTER MARQUEE BACKGROUND ──────────────────────── */}
      {rows.length > 0 && (
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none gap-2"
        >
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex overflow-hidden">
              <div
                className={row.dir === -1 ? "marquee-left" : "marquee-right"}
                style={{
                  display: "flex",
                  gap: "10px",
                  flexShrink: 0,
                  willChange: "transform",
                  ["--marquee-speed" as string]: `${row.speed}s`,
                }}
              >
                {row.items.map((movie, i) => (
                  <div
                    key={`${movie.id}-${i}`}
                    className="relative flex-shrink-0 w-28 sm:w-32 md:w-40 rounded-xl overflow-hidden"
                    style={{
                      height: "clamp(120px, 13vw, 190px)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
                    }}
                  >
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      sizes="160px"
                      className="object-cover"
                      style={{ opacity: 0.22 + (rowIdx % 2) * 0.06 }}
                      priority={rowIdx === 0 && i < 4}
                    />
                    {/* Blue tint overlay to align with brand */}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${BLUE}1A 0%, ${NAVY}80 100%)` }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── CENTER VIGNETTE (lets foreground content pop) ─────────── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 75% 80% at 50% 50%, rgba(6,13,28,0.92) 0%, rgba(6,13,28,0.75) 45%, transparent 75%)`,
        }} />

      {/* ── AMBIENT GLOWS ─────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full opacity-45"
          style={{ background: `radial-gradient(ellipse, ${BLUE}40 0%, transparent 70%)` }} />
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full opacity-25"
          style={{ background: `radial-gradient(ellipse, ${CYAN}25 0%, transparent 70%)` }} />
        <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: `radial-gradient(ellipse, ${BLUE}30 0%, transparent 70%)` }} />
        {/* Breathing orb */}
        <motion.div
          initial={false}
          animate={{ scale: [1, 1.2, 1], opacity: [0.18, 0.35, 0.18] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[30%] w-[700px] h-[400px] rounded-full"
          style={{ background: `radial-gradient(ellipse, ${BLUE}28 0%, transparent 65%)`, opacity: 0.18 }}
        />
      </div>

      {/* ── SPOTLIGHT ─────────────────────────────────────────────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="w-[800px] h-[500px] opacity-12"
          style={{
            background: `conic-gradient(from 180deg at 50% 0%, transparent 72deg, ${BLUE}CC 90deg, ${CYAN}FF 100deg, ${BLUE}CC 110deg, transparent 128deg)`,
            clipPath: "polygon(32% 0%, 68% 0%, 96% 100%, 4% 100%)",
          }} />
      </div>

      {/* ── FILM GRAIN ────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.045,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "180px 180px",
      }} />

      {/* ── FLOATING PARTICLES ────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { x: "8%",  y: "20%", s: 5, c: BLUE, d: 6 },
          { x: "90%", y: "15%", s: 4, c: BLUE, d: 8 },
          { x: "85%", y: "70%", s: 5, c: CYAN, d: 5 },
          { x: "12%", y: "65%", s: 3, c: BLUE, d: 7 },
          { x: "50%", y: "88%", s: 4, c: CYAN, d: 9 },
          { x: "70%", y: "40%", s: 3, c: BLUE, d: 6 },
        ].map((p, i) => (
          <motion.div
            key={i}
            initial={false}
            className="absolute rounded-full"
            style={{ left: p.x, top: p.y, width: p.s, height: p.s, background: p.c, filter: `blur(${p.s / 3}px)`, opacity: 0.3 }}
            animate={{ opacity: [0.2, 0.6, 0.2], y: [-p.d, 0] }}
            transition={{ duration: 4 + i * 0.9, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: i * 0.6 }}
          />
        ))}
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 lg:pt-10 lg:pb-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">

          {/* LEFT — Text Content */}
          <motion.div style={{ y: textY, opacity: fadeOp }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-5"
              style={{ background: `${BLUE}18`, border: `1px solid ${BLUE}45`, backdropFilter: "blur(12px)" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: CYAN }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: CYAN }} />
              </span>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: CYAN }}>
                All-in-One Filmmaking Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl lg:text-[64px] font-black tracking-tight leading-[1.05] mb-5"
            >
              <span className="block" style={{
                background: "linear-gradient(180deg, #FFFFFF 20%, rgba(255,255,255,0.65) 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Build Your Movie.
              </span>
              <span className="block" style={{
                background: `linear-gradient(135deg, ${BLUE} 0%, #5BA8E5 50%, ${CYAN} 100%)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 40px ${BLUE}60)`,
              }}>
                From Idea to Box Office.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="text-base sm:text-lg leading-relaxed mb-6 max-w-xl"
              style={{ color: "rgba(248,248,255,0.6)" }}
            >
              ScriptMind AI is your all-in-one filmmaking platform — write scripts,
              generate dialogues, plan budgets, predict earnings, and manage your
              entire film project in one place.
            </motion.p>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7 }}
              className="mb-6"
            >
              <SearchBar />
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              className="flex flex-wrap items-center gap-3 mb-8"
            >
              <Link href="/signup">
                <Button
                  size="lg"
                  className="group relative overflow-hidden"
                  style={{ boxShadow: `0 0 28px ${BLUE}55, 0 0 56px ${BLUE}25` }}
                  rightIcon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                >
                  <span className="relative z-10">Start Creating Your Film</span>
                  <motion.span className="absolute inset-0 bg-white/10"
                    initial={{ x: "-100%" }} animate={{ x: "200%" }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                    style={{ clipPath: "polygon(0 0, 30% 0, 50% 100%, 20% 100%)" }}
                  />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="glass" size="lg"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(16px)" }}
                  rightIcon={<ChevronDown className="w-4 h-4" />}
                >
                  Explore Features
                </Button>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="flex flex-wrap gap-6"
              style={{ paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { value: "50K+",    label: "Filmmakers" },
                { value: "10K+",    label: "Scripts Written" },
                { value: "₹120Cr+", label: "Budgets Planned" },
                { value: "99.9%",   label: "Uptime" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-black" style={{
                    background: `linear-gradient(135deg, ${BLUE}, #5BA8E5, ${CYAN})`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(248,248,255,0.35)" }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT — 2-column card panel: Script left | Financial+Dialogue stacked right */}
          <div
            className="hidden lg:flex gap-4 items-start self-center"
            style={{ perspective: "1400px" }}
          >
            {/* Left sub-col — Script Studio (wider, offset down to centre vertically) */}
            <div className="w-[265px] flex-shrink-0 mt-9">
              <motion.div
                initial={{ opacity: 0, x: -28, rotateY: -8 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ transform: "rotate(-1.5deg)" }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ScriptEditorCard />
                </motion.div>
              </motion.div>
            </div>

            {/* Right sub-col — Financial on top, Dialogue below */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {/* Financial card */}
              <motion.div
                initial={{ opacity: 0, x: 28, y: -12, rotateY: 8 }}
                animate={{ opacity: 1, x: 0, y: 0, rotateY: 0 }}
                transition={{ delay: 0.55, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ transform: "rotate(1deg)" }}
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                >
                  <FinancialCard />
                </motion.div>
              </motion.div>

              {/* Dialogue card */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.72, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ transform: "rotate(-0.5deg)" }}
              >
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
                >
                  <DialogueCard />
                </motion.div>
              </motion.div>
            </div>

            {/* Ambient glow across the panel */}
            <div className="absolute inset-0 pointer-events-none -z-10"
              style={{ background: `radial-gradient(ellipse 70% 60% at 55% 50%, ${BLUE}10 0%, transparent 70%)` }} />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #0B0B0F)" }} />
    </section>
  );
}
