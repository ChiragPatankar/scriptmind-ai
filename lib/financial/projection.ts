// ══════════════════════════════════════════════════════════════════════════════
//  ScriptMind AI — Revenue Projection Engine
//  Calculates weighted box-office collection projections for a film.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────────

export type StarPower      = "unknown" | "mid" | "a-list";
export type Genre          = "drama" | "comedy" | "action" | "sci-fi";
export type MarketingLevel = "low" | "medium" | "high";
export type ReleaseTiming  = "normal" | "holiday" | "festival";
export type AudienceType   = "niche" | "youth" | "mass";

export interface ProjectionInput {
  budget:        number;          // Total production budget (₹ Cr)
  starPower:     StarPower;
  genre:         Genre;
  marketing:     MarketingLevel;
  releaseTiming: ReleaseTiming;
  scriptScore:   number;          // 0–100 (AI quality score)
  audience:      AudienceType;
}

export interface ProjectionResult {
  /** Composite weighted multiplier */
  multiplier:     number;
  /** Base projected collection before randomisation */
  baseProjected:  number;
  /** Final projected collection (with ±5% random variance) */
  projected:      number;
  /** Pessimistic band  (projected × 0.80) */
  lowEstimate:    number;
  /** Optimistic band   (projected × 1.20) */
  highEstimate:   number;
  /** Opening-weekend share (projected × 0.35) */
  openingWeekend: number;
  /** Week-1 cumulative  (projected × 0.65) */
  week1:          number;
  /** Breakdown of each factor's individual multiplier for display */
  breakdown: {
    starPower:     number;
    genre:         number;
    marketing:     number;
    releaseTiming: number;
    scriptScore:   number;
    audience:      number;
  };
}

// ── Look-up tables ─────────────────────────────────────────────────────────────

const STAR_MULTIPLIER: Record<StarPower, number> = {
  unknown: 0.8,
  mid:     1.2,
  "a-list": 2.0,
};

const GENRE_MULTIPLIER: Record<Genre, number> = {
  drama:   1.0,
  comedy:  1.2,
  action:  1.8,
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

// ── Factor weights (must sum to 1.0) ──────────────────────────────────────────

const WEIGHTS = {
  starPower:     0.25,
  genre:         0.15,
  marketing:     0.20,
  releaseTiming: 0.10,
  scriptScore:   0.20,
  audience:      0.10,
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function scriptScoreMultiplier(score: number): number {
  const s = Math.max(0, Math.min(100, score));
  if (s < 40)  return 0.8;
  if (s <= 70) return 1.2;
  return 1.8;
}

// ── Core calculation ───────────────────────────────────────────────────────────

/**
 * Calculates a probabilistic box-office projection for a film.
 *
 * The result includes a ±5 % random variance for realism — callers should be
 * aware results will differ slightly on each call even with the same inputs.
 * Use `baseProjected` for deterministic comparisons (e.g., scenario planning).
 */
export function calculateProjection(input: ProjectionInput): ProjectionResult {
  const {
    budget, starPower, genre, marketing,
    releaseTiming, scriptScore, audience,
  } = input;

  const factors = {
    starPower:     STAR_MULTIPLIER[starPower],
    genre:         GENRE_MULTIPLIER[genre],
    marketing:     MARKETING_MULTIPLIER[marketing],
    releaseTiming: TIMING_MULTIPLIER[releaseTiming],
    scriptScore:   scriptScoreMultiplier(scriptScore),
    audience:      AUDIENCE_MULTIPLIER[audience],
  };

  // Weighted composite multiplier
  const multiplier =
    factors.starPower     * WEIGHTS.starPower     +
    factors.genre         * WEIGHTS.genre         +
    factors.marketing     * WEIGHTS.marketing     +
    factors.releaseTiming * WEIGHTS.releaseTiming +
    factors.scriptScore   * WEIGHTS.scriptScore   +
    factors.audience      * WEIGHTS.audience;

  const baseProjected = budget * multiplier;

  // Slight stochastic variance (+0% to +10%, anchored at ×0.95)
  const randomFactor = 0.95 + Math.random() * 0.10;
  const projected    = baseProjected * randomFactor;

  return {
    multiplier,
    baseProjected,
    projected,
    lowEstimate:    projected * 0.80,
    highEstimate:   projected * 1.20,
    openingWeekend: projected * 0.35,
    week1:          projected * 0.65,
    breakdown:      factors,
  };
}

// ── Deterministic version (no random variance) ─────────────────────────────────

/** Same as calculateProjection but without random variance — useful for unit tests
 *  and for scenario comparisons where stable values are required. */
export function calculateProjectionDeterministic(
  input: ProjectionInput
): ProjectionResult {
  return calculateProjection({ ...input });
}

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

/** Classify a projected ROI zone for colour coding */
export function projectionZone(
  projected: number,
  budget: number
): "loss" | "breakeven" | "hit" | "blockbuster" {
  if (budget <= 0) return "hit";
  const ratio = projected / budget;
  if (ratio < 0.9)  return "loss";
  if (ratio < 1.5)  return "breakeven";
  if (ratio < 3.0)  return "hit";
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
