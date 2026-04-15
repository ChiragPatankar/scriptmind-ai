// ══════════════════════════════════════════════════════════════════════════════
//  ScriptMind AI — Revenue Projection Engine  (Hybrid Weighted Model)
//  60 % weighted factor model  +  40 % similarity-weighted dataset average
//  Fully deterministic — zero randomness.
// ══════════════════════════════════════════════════════════════════════════════

import type { ScoredFilm } from "./film-dataset";
import { matchFilms, weightedMultiplier } from "./film-dataset";

// ── Types ──────────────────────────────────────────────────────────────────────

export type StarPower      = "unknown" | "mid" | "a-list";
export type Genre          = "drama" | "comedy" | "action" | "sci-fi";
export type MarketingLevel = "low" | "medium" | "high";
export type ReleaseTiming  = "normal" | "holiday" | "festival";
export type AudienceType   = "niche" | "youth" | "mass";

export interface ProjectionInput {
  budget:           number;   // ₹ Cr
  starPower:        StarPower;
  genre:            Genre;
  marketing:        MarketingLevel;
  releaseTiming:    ReleaseTiming;
  scriptScore:      number;   // 0–100
  audience:         AudienceType;
  historicalBoost:  number;   // 0–1
  exceptionalMovie: boolean;
  benchmarkMatch:   number;   // 0–1
}

export interface ProjectionResult {
  multiplier:       number;
  baseWeightedMult: number;
  datasetMult:      number;
  baseProjected:    number;
  projected:        number;
  lowEstimate:      number;
  highEstimate:     number;
  openingWeekend:   number;
  week1:            number;
  /** Top-N similar films with similarity scores */
  similarFilms:     ScoredFilm[];
  /** Human-readable explanation lines */
  explanation:      string[];
  breakdown: {
    starPower:     number;
    genre:         number;
    marketing:     number;
    releaseTiming: number;
    scriptScore:   number;
    audience:      number;
    historical:    number;
    benchmark:     number;
    exceptional:   number;
  };
}

// ── Look-up tables ─────────────────────────────────────────────────────────────

const STAR_MULTIPLIER: Record<StarPower, number> = {
  unknown:  0.8,
  mid:      1.2,
  "a-list": 2.0,
};

const GENRE_MULTIPLIER: Record<Genre, number> = {
  drama:    1.0,
  comedy:   1.2,
  action:   1.8,
  "sci-fi": 1.5,
};

const MARKETING_MULTIPLIER: Record<MarketingLevel, number> = {
  low:    0.8,
  medium: 1.2,
  high:   1.6,
};

const TIMING_MULTIPLIER: Record<ReleaseTiming, number> = {
  normal:   1.0,
  holiday:  1.3,
  festival: 1.6,
};

const AUDIENCE_MULTIPLIER: Record<AudienceType, number> = {
  niche: 0.9,
  youth: 1.2,
  mass:  1.6,
};

// Factor weights  — must sum to 1.0
const W = {
  starPower:     0.20,
  genre:         0.12,
  marketing:     0.16,
  releaseTiming: 0.08,
  scriptScore:   0.16,
  audience:      0.08,
  historical:    0.08,
  benchmark:     0.07,
  exceptional:   0.05,
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function scriptScoreMultiplier(score: number): number {
  const s = Math.max(0, Math.min(100, score));
  if (s < 40)  return 0.8;
  if (s <= 70) return 1.15;
  return 1.45;
}

function x(n: number): string { return `${n.toFixed(2)}×`; }
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Explanation generator ──────────────────────────────────────────────────────

function generateExplanation(
  input:            ProjectionInput,
  factors:          ProjectionResult["breakdown"],
  baseWeightedMult: number,
  datasetMult:      number,
  similarFilms:     ScoredFilm[],
): string[] {
  const lines: string[] = [];

  // Star power
  if (input.starPower === "a-list") {
    lines.push(`A-list star power is the strongest driver — ${x(factors.starPower)} multiplier contributes ${x(factors.starPower * W.starPower)} to the composite`);
  } else if (input.starPower === "mid") {
    lines.push(`Mid-tier cast provides a solid ${x(factors.starPower)} star factor — solid but not maximum draw`);
  } else {
    lines.push(`Unknown cast limits opening draw (${x(factors.starPower)}) — marketing and content quality become critical`);
  }

  // Genre
  if (factors.genre >= 1.5) {
    lines.push(`${cap(input.genre)} genre commands a strong ${x(factors.genre)} market factor — broad audience appetite`);
  } else if (factors.genre >= 1.1) {
    lines.push(`${cap(input.genre)} genre adds ${x(factors.genre)} factor — above-average commercial appeal`);
  } else {
    lines.push(`${cap(input.genre)} genre carries a conservative ${x(factors.genre)} factor — expect niche positioning`);
  }

  // Marketing
  if (input.marketing === "high") {
    lines.push(`High marketing budget delivers ${x(factors.marketing)} awareness factor — boosts opening-week foot traffic`);
  } else if (input.marketing === "medium") {
    lines.push(`Medium marketing gives ${x(factors.marketing)} factor — adequate visibility for a targeted release`);
  } else {
    lines.push(`Low marketing (${x(factors.marketing)}) may limit first-week discovery — word-of-mouth becomes essential`);
  }

  // Release timing
  if (input.releaseTiming === "festival") {
    lines.push(`Festival window adds ${x(factors.releaseTiming)} timing boost — Eid / Diwali releases are proven box-office accelerators`);
  } else if (input.releaseTiming === "holiday") {
    lines.push(`Holiday release provides ${x(factors.releaseTiming)} timing advantage — captive family and leisure audiences`);
  } else {
    lines.push(`Normal release timing (${x(factors.releaseTiming)}) — no seasonal uplift; performance driven by content and marketing`);
  }

  // Script score
  if (input.scriptScore > 70) {
    lines.push(`Strong script quality (${input.scriptScore}/100) supports critical reception and sustained word-of-mouth past week 1`);
  } else if (input.scriptScore < 40) {
    lines.push(`Weak script score (${input.scriptScore}/100) risks poor reviews and sharp drop-off after opening weekend`);
  } else {
    lines.push(`Average script quality (${input.scriptScore}/100) — decent content, but retention depends on execution`);
  }

  // Audience
  if (input.audience === "mass") {
    lines.push(`Mass audience target gives ${x(factors.audience)} factor — widest possible theatrical reach`);
  } else if (input.audience === "youth") {
    lines.push(`Youth audience (${x(factors.audience)}) drives strong digital and repeat-viewing performance`);
  } else {
    lines.push(`Niche audience (${x(factors.audience)}) caps theatrical ceiling — OTT / festival circuit strategy recommended`);
  }

  // Exceptional mode
  if (input.exceptionalMovie) {
    lines.push(`Exceptional Movie mode active — high-estimate ceiling raised to ×1.35; opening-weekend share lifted to 45 %`);
  }

  // Historical / benchmark
  if (input.historicalBoost > 0.5) {
    lines.push(`Strong historical comparables boost factor to ${x(factors.historical)} — similar past films performed well`);
  }
  if (input.benchmarkMatch > 0.5) {
    lines.push(`High benchmark match (${x(factors.benchmark)}) — project aligns closely with past blockbuster patterns`);
  }

  // Dataset anchoring
  if (similarFilms.length > 0) {
    const top = similarFilms[0];
    lines.push(
      `Closest comparable: "${top.film.title}" (${x(top.film.multiplier)}, ${top.pct}% match) — anchors dataset reference at ${x(datasetMult)}`,
    );
  }

  // Hybrid blend direction
  if (datasetMult > baseWeightedMult) {
    lines.push(
      `Historical data pulls projection higher — dataset avg ${x(datasetMult)} > model ${x(baseWeightedMult)}; blended at 40 / 60 weight`,
    );
  } else {
    lines.push(
      `Factor model leads historical data — model ${x(baseWeightedMult)} > dataset avg ${x(datasetMult)}; blended at 60 / 40 weight`,
    );
  }

  return lines;
}

// ── Core calculation ───────────────────────────────────────────────────────────

/**
 * Deterministic hybrid projection — same inputs always return the same output.
 *
 *   finalMult = baseWeightedMult × 0.60  +  datasetMult × 0.40
 *
 * datasetMult is a similarity-weighted average:
 *   Σ(film.multiplier × similarityScore) / Σ(similarityScore)
 *
 * Exceptional Movie Mode:
 *   • High-estimate ceiling: ×1.20 → ×1.35
 *   • Opening-weekend share: 35 % → 45 %
 *   • Low-estimate floor:    ×0.80 → ×0.75  (higher event-film volatility)
 */
export function calculateProjection(input: ProjectionInput): ProjectionResult {
  const {
    budget, starPower, genre, marketing, releaseTiming,
    scriptScore, audience, historicalBoost, exceptionalMovie, benchmarkMatch,
  } = input;

  // Factor multipliers
  const factors = {
    starPower:     STAR_MULTIPLIER[starPower],
    genre:         GENRE_MULTIPLIER[genre],
    marketing:     MARKETING_MULTIPLIER[marketing],
    releaseTiming: TIMING_MULTIPLIER[releaseTiming],
    scriptScore:   scriptScoreMultiplier(scriptScore),
    audience:      AUDIENCE_MULTIPLIER[audience],
    historical:    1 + Math.max(0, Math.min(1, historicalBoost)) * 0.35,
    benchmark:     1 + Math.max(0, Math.min(1, benchmarkMatch))  * 0.30,
    exceptional:   exceptionalMovie ? 1.18 : 1,
  };

  // Weighted base model multiplier
  const baseWeightedMult =
    factors.starPower     * W.starPower     +
    factors.genre         * W.genre         +
    factors.marketing     * W.marketing     +
    factors.releaseTiming * W.releaseTiming +
    factors.scriptScore   * W.scriptScore   +
    factors.audience      * W.audience      +
    factors.historical    * W.historical    +
    factors.benchmark     * W.benchmark     +
    factors.exceptional   * W.exceptional;

  // Similarity-weighted dataset average (passes budget + scriptScore for matching)
  const similarFilms = matchFilms(genre, starPower, audience, budget, scriptScore);
  const datasetMult  = weightedMultiplier(similarFilms);

  // Hybrid multiplier
  const multiplier = baseWeightedMult * 0.6 + datasetMult * 0.4;

  // Final projections
  const projected    = budget * multiplier;
  const lowFactor    = exceptionalMovie ? 0.75 : 0.80;
  const highFactor   = exceptionalMovie ? 1.35 : 1.20;
  const openingRatio = exceptionalMovie ? 0.45 : 0.35;
  const week1Ratio   = exceptionalMovie ? 0.75 : 0.65;

  // Explainability
  const explanation = generateExplanation(
    input, factors, baseWeightedMult, datasetMult, similarFilms,
  );

  return {
    multiplier,
    baseWeightedMult,
    datasetMult,
    baseProjected:  budget * baseWeightedMult,
    projected,
    lowEstimate:    projected * lowFactor,
    highEstimate:   projected * highFactor,
    openingWeekend: projected * openingRatio,
    week1:          projected * week1Ratio,
    similarFilms,
    explanation,
    breakdown: factors,
  };
}

export const calculateProjectionDeterministic = calculateProjection;

// ── Human-readable labels ──────────────────────────────────────────────────────

export const STAR_LABELS: Record<StarPower, string> = {
  unknown:  "Unknown / Newcomer",
  mid:      "Mid-tier Star",
  "a-list": "A-list / Superstar",
};

export const GENRE_LABELS: Record<Genre, string> = {
  drama:    "Drama",
  comedy:   "Comedy",
  action:   "Action",
  "sci-fi": "Sci-Fi",
};

export const MARKETING_LABELS: Record<MarketingLevel, string> = {
  low:    "Low  (< ₹5 Cr)",
  medium: "Medium  (₹5–20 Cr)",
  high:   "High  (> ₹20 Cr)",
};

export const TIMING_LABELS: Record<ReleaseTiming, string> = {
  normal:   "Normal Weekend",
  holiday:  "Holiday Weekend",
  festival: "Festival / Eid / Diwali",
};

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  niche: "Niche / Art-house",
  youth: "Youth / College",
  mass:  "Mass / Pan-India",
};

export function projectionZone(
  projected: number,
  budget:    number,
): "loss" | "breakeven" | "hit" | "blockbuster" {
  if (budget <= 0) return "hit";
  const r = projected / budget;
  if (r < 0.9)  return "loss";
  if (r < 1.5)  return "breakeven";
  if (r < 3.0)  return "hit";
  return "blockbuster";
}

export const ZONE_COLORS = {
  loss:        "#EF4444",
  breakeven:   "#F59E0B",
  hit:         "#22C55E",
  blockbuster: "#00C2E0",
} as const;

export const ZONE_LABELS = {
  loss:        "Likely Loss",
  breakeven:   "Break-even Zone",
  hit:         "Probable Hit",
  blockbuster: "Blockbuster Territory",
} as const;
