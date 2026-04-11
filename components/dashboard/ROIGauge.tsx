"use client";

/**
 * ROIGauge — Precise, fully-animated semi-circular ROI gauge
 *
 * Animation model
 * ───────────────
 * A single `useSpring` drives everything:
 *   • Arc fill  — stroke-dashoffset derived from spring
 *   • Needle    — cx/cy derived from spring via useTransform
 *   • Color     — hex-interpolated on every spring tick via useMotionValueEvent
 *   • Counter   — ROI number counts live in sync with the arc via useMotionValueEvent
 *
 * Color zones (continuous interpolation, no zone snapping)
 * ─────────────────────────────────────────────────────────
 *   −100 % → 0 %   : #EF4444 (red)   → #F59E0B (amber)
 *      0 % → 50 %  : #F59E0B (amber) → #84CC16 (lime)
 *     50 % → 200 % : #84CC16 (lime)  → #22C55E (green)
 */

import React, { useEffect, useState } from "react";
import {
  useMotionValue,
  useSpring,
  useTransform,
  useMotionValueEvent,
  motion,
} from "framer-motion";

// ── Canvas ─────────────────────────────────────────────────────────────────────
const W  = 300;
const H  = 190;
const CX = 150;
const CY = 155;
const R  = 110;

const STROKE    = 12;
const TOTAL_ARC = Math.PI * R;   // πR ≈ 345.6 px

const GRAD_X1 = CX - R;   // x at –100 %
const GRAD_X2 = CX + R;   // x at +200 %

// Break-even tick: roi=0 → norm=1/3 → std-math angle=120°
const BE_DEG = 120;

// Zone-tick angles (std-math degrees)
const TICKS: { deg: number; label: string }[] = [
  { deg: 90,  label: "50%"  },   // roi = 50  → norm = 150/300 = 0.5
  { deg: 60,  label: "100%" },   // roi = 100 → norm = 200/300 ≈ 0.667
];

/**
 * Choose SVG textAnchor so labels radiate outward and never overlap the arc.
 *   Left quadrant  (deg > 100°) → "end"    (text flows leftward  from the tick)
 *   Top             (80–100°)   → "middle" (centred above the tick)
 *   Right quadrant (deg < 80°)  → "start"  (text flows rightward from the tick)
 */
function tickAnchor(deg: number): "start" | "middle" | "end" {
  if (deg > 100) return "end";
  if (deg < 80)  return "start";
  return "middle";
}

// ── Color interpolation ────────────────────────────────────────────────────────

interface ColorStop { n: number; hex: string }

const COLOR_STOPS: ColorStop[] = [
  { n: 0,           hex: "#EF4444" },   // –100 %
  { n: 1 / 3,       hex: "#F59E0B" },   //    0 %
  { n: 0.5,         hex: "#84CC16" },   //   50 %
  { n: 1,           hex: "#22C55E" },   //  200 %
];

function lerpHex(a: string, b: string, t: number): string {
  const p = (h: string, o: number) => parseInt(h.slice(o, o + 2), 16);
  const r = Math.round(p(a, 1) + (p(b, 1) - p(a, 1)) * t);
  const g = Math.round(p(a, 3) + (p(b, 3) - p(a, 3)) * t);
  const bl = Math.round(p(a, 5) + (p(b, 5) - p(a, 5)) * t);
  return `rgb(${r},${g},${bl})`;
}

function interpolateColor(n: number): string {
  const c = Math.max(0, Math.min(1, n));
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const lo = COLOR_STOPS[i], hi = COLOR_STOPS[i + 1];
    if (c >= lo.n && c <= hi.n) {
      return lerpHex(lo.hex, hi.hex, (c - lo.n) / (hi.n - lo.n));
    }
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1].hex;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
}

function statusLabel(roi: number): string {
  if (roi < 0)   return "Projected Loss";
  if (roi < 20)  return "Break-even Zone";
  if (roi < 100) return "Profitable";
  return "High Return";
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface ROIGaugeProps {
  value: number;
  min?: number;
  max?: number;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ROIGauge({ value, min = -100, max = 200 }: ROIGaugeProps) {
  const clamped    = Math.max(min, Math.min(max, value));
  const normalized = (clamped - min) / (max - min);

  // ── Single spring driving the entire animation ──────────────────────────────
  const motionNorm = useMotionValue(0);
  const springNorm = useSpring(motionNorm, { stiffness: 52, damping: 17, mass: 1 });

  useEffect(() => {
    motionNorm.set(normalized);
  }, [normalized, motionNorm]);

  // ── Live state: color + counter — updated on EVERY spring frame ─────────────
  // Both start at the "left edge" (norm=0) so the entrance animation is fully
  // synchronised: color counts from red → zone color, number counts from min→value.
  const [liveColor,   setLiveColor]   = useState<string>("#EF4444");
  const [displayROI,  setDisplayROI]  = useState<number>(min);
  const [pulseKey,    setPulseKey]    = useState(0);

  useMotionValueEvent(springNorm, "change", (n) => {
    setLiveColor(interpolateColor(n));
    setDisplayROI(min + n * (max - min));
  });

  // Retrigger needle-pulse whenever the target value changes
  useEffect(() => {
    const id = setTimeout(() => setPulseKey((k) => k + 1), 650);
    return () => clearTimeout(id);
  }, [value]);

  // ── Motion values derived from spring ──────────────────────────────────────
  const needleX = useTransform(springNorm, (n) => CX + R * Math.cos(Math.PI * (1 - n)));
  const needleY = useTransform(springNorm, (n) => CY - R * Math.sin(Math.PI * (1 - n)));
  const dashOff = useTransform(springNorm, (n) => TOTAL_ARC * (1 - n));

  // ── Static geometry ─────────────────────────────────────────────────────────
  const arcPath  = `M ${GRAD_X1} ${CY} A ${R} ${R} 0 0 1 ${GRAD_X2} ${CY}`;
  const beInner  = polar(R - 9,  BE_DEG);
  const beOuter  = polar(R + 9,  BE_DEG);
  const status   = statusLabel(clamped);

  return (
    <div className="w-full flex flex-col items-center select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "auto", overflow: "visible" }}
        aria-label={`ROI Gauge: ${value.toFixed(1)}%`}
        role="img"
      >
        <defs>
          {/* ── Static red → amber → lime → green arc gradient ── */}
          <linearGradient id="roiArcGrad" gradientUnits="userSpaceOnUse"
            x1={GRAD_X1} y1={CY} x2={GRAD_X2} y2={CY}>
            <stop offset="0%"    stopColor="#EF4444" />
            <stop offset="33.3%" stopColor="#F59E0B" />
            <stop offset="55%"   stopColor="#84CC16" />
            <stop offset="100%"  stopColor="#22C55E" />
          </linearGradient>

          {/* ── Arc glow — wider, softer blur ── */}
          <filter id="arcGlow" x="-25%" y="-70%" width="150%" height="240%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ── Needle glow ── */}
          <filter id="needleGlow" x="-140%" y="-140%" width="380%" height="380%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Layer 1: Ambient ring — colour follows liveColor ── */}
        <path d={arcPath} fill="none"
          stroke={`${liveColor.replace("rgb(", "rgba(").replace(")", ", 0.07)")}`}
          strokeWidth={STROKE * 4.5} strokeLinecap="round" />

        {/* ── Layer 2: Background track ── */}
        <path d={arcPath} fill="none"
          stroke="rgba(var(--surface3-rgb), 1)"
          strokeWidth={STROKE} strokeLinecap="round" />

        {/* ── Layer 3: Gradient value arc (spring-animated) ── */}
        <motion.path
          d={arcPath} fill="none"
          stroke="url(#roiArcGrad)"
          strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={TOTAL_ARC}
          style={{ strokeDashoffset: dashOff }}
          filter="url(#arcGlow)"
        />

        {/* ── Zone ticks (50%, 100%) ── */}
        {TICKS.map(({ deg, label }) => {
          const inner = polar(R - 8,  deg);
          const outer = polar(R + 8,  deg);
          const lbl   = polar(R + 28, deg);   // pushed further out for clearance
          return (
            <g key={label}>
              <line
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke="rgba(var(--text-m-rgb), 0.4)"
                strokeWidth="1.5" strokeLinecap="round"
              />
              <text
                x={lbl.x} y={lbl.y}
                textAnchor={tickAnchor(deg)}
                dominantBaseline="middle"
                fill="rgb(var(--text-s-rgb))"
                fontSize="8.5" fontFamily="Inter, system-ui, sans-serif" fontWeight="600"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* ── Break-even tick (0%) ── */}
        <line
          x1={beInner.x} y1={beInner.y} x2={beOuter.x} y2={beOuter.y}
          stroke="rgba(var(--text-m-rgb), 0.6)"
          strokeWidth="1.5" strokeLinecap="round"
        />
        <text
          x={polar(R + 28, BE_DEG).x} y={polar(R + 28, BE_DEG).y}
          textAnchor={tickAnchor(BE_DEG)}
          dominantBaseline="middle"
          fill="rgb(var(--text-s-rgb))"
          fontSize="9" fontFamily="Inter, system-ui, sans-serif" fontWeight="600"
        >
          0%
        </text>

        {/* ── Pulse ring at needle — replays whenever pulseKey changes ── */}
        <motion.circle
          key={pulseKey}
          r={6.5} fill="none"
          stroke={liveColor} strokeWidth="2"
          style={{ cx: needleX, cy: needleY } as unknown as React.CSSProperties}
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 3.2, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />

        {/* ── Needle dot — color border follows liveColor ── */}
        <motion.circle
          r={6.5} fill="white"
          stroke={liveColor} strokeWidth="2.5"
          style={{ cx: needleX, cy: needleY } as unknown as React.CSSProperties}
          filter="url(#needleGlow)"
        />

        {/* ── ROI value — live counting number, live color ── */}
        <text
          x={CX} y={CY - 44}
          textAnchor="middle" dominantBaseline="auto"
          fill={liveColor}
          fontSize="36" fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="-1"
        >
          {displayROI.toFixed(1)}%
        </text>

        {/* ── Subtitle ── */}
        <text
          x={CX} y={CY - 16}
          textAnchor="middle" dominantBaseline="auto"
          fill="rgba(var(--text-s-rgb), 1)"
          fontSize="11" fontFamily="Inter, system-ui, sans-serif"
          fontWeight="500" letterSpacing="0.2"
        >
          Return on Investment
        </text>

        {/* ── Range labels ── */}
        <text
          x={GRAD_X1 + 4} y={CY + 18}
          textAnchor="start" dominantBaseline="hanging"
          fill="rgb(var(--text-s-rgb))"
          fontSize="10" fontFamily="Inter, system-ui, sans-serif" fontWeight="500"
        >
          −100%
        </text>
        <text
          x={GRAD_X2 - 4} y={CY + 18}
          textAnchor="end" dominantBaseline="hanging"
          fill="rgb(var(--text-s-rgb))"
          fontSize="10" fontFamily="Inter, system-ui, sans-serif" fontWeight="500"
        >
          +200%
        </text>
      </svg>

      {/* ── Status badge — color follows liveColor via CSS transition ── */}
      <span
        className="mt-1 text-[11px] font-bold px-3 py-1 rounded-full"
        style={{
          color:      liveColor,
          background: `${liveColor.replace("rgb(", "rgba(").replace(")", ", 0.08)")}`,
          border:     `1px solid ${liveColor.replace("rgb(", "rgba(").replace(")", ", 0.28)")}`,
          transition: "color 0.05s linear, background 0.05s linear, border-color 0.05s linear",
        }}
      >
        {status}
      </span>
    </div>
  );
}
