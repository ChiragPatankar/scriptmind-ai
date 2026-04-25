// ══════════════════════════════════════════════════════════════════════════════
//  ScriptMind AI — Revenue Projection Engine  (Hybrid Weighted Model v2)
//  60 % weighted factor model  +  40 % similarity-weighted dataset average.
//  GOLDEN RULE: Zero randomness. Same inputs → same outputs. Always.
//
//  calculateProjection called with identical inputs twice returns identical output ✓
//
//  DETERMINISM VERIFIED: All outputs are pure functions of inputs.
//  No randomness. No side effects. No external state.
// ══════════════════════════════════════════════════════════════════════════════

import { matchBenchmarkFilms, weightedBenchmarkMultiplier } from "./film-dataset";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION A — Backward-compatible legacy types (kept for label maps & old callers)
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Use StarLevel */
export type StarPower      = "unknown" | "mid" | "a-list";
/** @deprecated Use ReleaseGenre */
export type Genre          = "drama" | "comedy" | "action" | "sci-fi";
export type MarketingLevel = "low" | "medium" | "high";
/** @deprecated Use FullReleaseTiming */
export type ReleaseTiming  = "normal" | "holiday" | "festival";
/** @deprecated Use FullAudienceType */
export type AudienceType   = "niche" | "youth" | "mass";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION B — New v2 types (per spec)
// ─────────────────────────────────────────────────────────────────────────────

export type Platform         = "theatrical" | "youtube" | "ott";
export type StarLevel        = "low" | "medium" | "high";
export type ReleaseGenre     =
  | "action" | "drama" | "comedy" | "horror"
  | "thriller" | "animation" | "documentary" | "scifi";
export type FullReleaseTiming = "summer" | "holiday" | "festival" | "normal" | "limited";
export type FullAudienceType  = "mass" | "family" | "niche" | "teen";

export interface ProjectionInputs {
  platform:                Platform;
  genre:                   ReleaseGenre;
  starPower:               StarLevel;
  marketing:               MarketingLevel;
  timing:                  FullReleaseTiming;
  audienceType:            FullAudienceType;
  /** 1–10 from script analysis module */
  scriptQualityScore:      number;
  /** 1–10 — how strongly dataset shapes forecast */
  historicalDataInfluence: number;
  /** 1–10 — similarity to high-performing benchmark films */
  benchmarkMatch:          number;
  productionBudget:        number;   // ₹ Cr
  marketingBudget:         number;   // ₹ Cr
  pnaExpenses:             number;   // P&A / distribution ₹ Cr
  isExceptionalMovie:      boolean;
  // Digital-only (required when platform !== 'theatrical')
  reach?:          number;  // raw view/follower count
  engagementRate?: number;  // 0–1
  cpm?:            number;  // ₹ per 1 000 views (default 100)
}

export interface FactorScore {
  key:          string;
  label:        string;
  score:        number;       // normalised 0–1
  weight:       number;
  contribution: number;       // score × weight
}

export interface WeeklySlice {
  week:              string;
  percentage:        number;
  revenue:           number;
  cumulativeRevenue: number;
}

export interface ExplanationItem {
  sentiment: "positive" | "negative" | "neutral";
  message:   string;
}

// Extended ProjectionResult — all old fields kept for backward compat
export type SuccessLabel = "High Risk" | "Uncertain" | "Promising" | "Strong Hit";

export interface ProjectionResult {
  // ── NEW fields ──────────────────────────────────────────────────────────────
  platform:           Platform;
  totalExpenses:      number;
  baseRevenue:        number;
  finalRevenue:       number;
  theatricalRevenue:  number;
  digitalRevenue:     number;
  weightedScore:      number;
  baseMultiplier:     number;
  datasetMultiplier:  number;
  finalMultiplier:    number;
  weeklyDistribution: WeeklySlice[];
  breakEvenWeek:      number | null;   // 1-indexed, null if not achieved
  breakEvenAchieved:  boolean;
  factors:            FactorScore[];
  explanations:       ExplanationItem[];
  estimatedViews?:    number;
  adjustedEngagement?: number;

  // ── Extended fields (v2.1) ──────────────────────────────────────────────────
  /** Hit probability via sigmoid — deterministic, 0–1 */
  successProbability: number;
  successLabel:       SuccessLabel;
  /** Domestic / overseas revenue split */
  domesticRevenue:    number;
  overseasRevenue:    number;
  /** Estimated OTT acquisition deal value */
  ottDealEstimate:    number;
  /** Confidence in projection based on dataset similarity + historical weight, 0–1 */
  confidenceScore:    number;
  /** Conservative floor: finalRevenue × 0.70 */
  minRevenue:         number;
  /** Optimistic ceiling: finalRevenue × 1.30 */
  maxRevenue:         number;
  /** 1-sentence deterministic summary driven by top 2 contributing factors */
  summaryLine:        string;

  // ── LEGACY fields (kept for backward compat with existing renders) ──────────
  multiplier:       number;   // alias → finalMultiplier
  baseWeightedMult: number;   // alias → baseMultiplier
  datasetMult:      number;   // alias → datasetMultiplier
  baseProjected:    number;   // alias → baseRevenue
  projected:        number;   // alias → finalRevenue
  lowEstimate:      number;
  highEstimate:     number;
  openingWeekend:   number;
  week1:            number;
  similarFilms:     { film: { id:string; title:string; genre:string; star:string; audience:string; budget:number; collections:number; multiplier:number; scriptScore:number }; rawScore:number; pct:number; closest:boolean }[];
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION C — Factor weight constants (exact spec, sum = 1.0)
// ─────────────────────────────────────────────────────────────────────────────

const FACTOR_WEIGHTS = {
  genre:      0.15,
  star:       0.20,
  script:     0.15,
  marketing:  0.15,
  timing:     0.10,
  audience:   0.10,
  historical: 0.10,
  benchmark:  0.05,
} as const;
// Σ = 0.15+0.20+0.15+0.15+0.10+0.10+0.10+0.05 = 1.00 ✓

// ─────────────────────────────────────────────────────────────────────────────
// SECTION D — Normalisation maps (exact spec values, do not deviate)
// ─────────────────────────────────────────────────────────────────────────────

const STAR_SCORES: Record<StarLevel, number> = {
  low: 0.40, medium: 0.70, high: 1.00,
};
const MARKETING_SCORES: Record<MarketingLevel, number> = {
  low: 0.40, medium: 0.70, high: 1.00,
};
const GENRE_SCORES: Record<ReleaseGenre, number> = {
  action: 0.90, scifi: 0.82, animation: 0.85, comedy: 0.70,
  thriller: 0.72, horror: 0.65, drama: 0.58, documentary: 0.40,
};
const TIMING_SCORES: Record<FullReleaseTiming, number> = {
  summer: 0.90, holiday: 0.85, festival: 0.65, normal: 0.60, limited: 0.45,
};
const AUDIENCE_SCORES: Record<FullAudienceType, number> = {
  mass: 0.90, family: 0.85, teen: 0.70, niche: 0.50,
};

// Slider normalisation: 1–10 → 0–1 (linear)
const normSlider = (val: number): number => (Math.max(1, Math.min(10, val)) - 1) / 9;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION E — Digital virality constants
// ─────────────────────────────────────────────────────────────────────────────

const VIRALITY_BY_GENRE: Record<ReleaseGenre, number> = {
  action: 0.78, scifi: 0.72, animation: 0.80, comedy: 0.75,
  thriller: 0.65, horror: 0.70, drama: 0.55, documentary: 0.50,
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION E2 — Extended model constants (v2.1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sigmoid — Deterministic S-curve squashing function.
 * Pure function: no side effects, no randomness.
 * Maps any real number to the range (0, 1).
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Genre-based overseas share boost (additive over base 0.30) */
const OVERSEAS_BOOST: Partial<Record<ReleaseGenre, number>> = {
  action:    0.10,
  scifi:     0.10,
  animation: 0.05,
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION F — Weekly distribution tables
// ─────────────────────────────────────────────────────────────────────────────

const THEATRICAL_WEEKS = [
  { week: "Week 1", pct: 0.40 },
  { week: "Week 2", pct: 0.25 },
  { week: "Week 3", pct: 0.15 },
  { week: "Week 4+", pct: 0.20 },
];
const DIGITAL_WEEKS = [
  { week: "Week 1", pct: 0.45 },
  { week: "Week 2", pct: 0.28 },
  { week: "Week 3", pct: 0.16 },
  { week: "Week 4+", pct: 0.11 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION G — Explanation generator (per spec rules)
// ─────────────────────────────────────────────────────────────────────────────

function generateExplanations(
  inputs:  ProjectionInputs,
  result:  Pick<ProjectionResult, "weightedScore" | "baseMultiplier" | "datasetMultiplier" | "finalMultiplier" | "factors">,
): ExplanationItem[] {
  const items: ExplanationItem[] = [];
  const factorMap = Object.fromEntries(result.factors.map((f) => [f.key, f]));
  const pct = (score: number) => `${(score * 100).toFixed(1)}%`;

  // Genre
  const genreScore = GENRE_SCORES[inputs.genre];
  if (genreScore >= 0.80) {
    items.push({ sentiment: "positive", message: `Strong ${inputs.genre} genre commands high box-office draw — genre contributes ${pct(factorMap.genre?.contribution ?? 0)} to weighted score.` });
  } else if (genreScore < 0.55) {
    items.push({ sentiment: "negative", message: `${inputs.genre} has historically narrower theatrical appeal — reduced genre contribution of ${pct(factorMap.genre?.contribution ?? 0)}.` });
  }

  // Star power
  if (inputs.starPower === "high") {
    items.push({ sentiment: "positive", message: `A-list star power amplifies multiplier — star factor adds ${pct(factorMap.star?.contribution ?? 0)} and drives opening weekend.` });
  } else if (inputs.starPower === "low") {
    items.push({ sentiment: "negative", message: `Newcomer cast reduces opening weekend pull — star factor only ${pct(factorMap.star?.contribution ?? 0)}.` });
  }

  // Script quality
  if (inputs.scriptQualityScore >= 8) {
    items.push({ sentiment: "positive", message: `Exceptional script quality (${inputs.scriptQualityScore}/10) boosts word-of-mouth and reduces weekly drop-off.` });
  } else if (inputs.scriptQualityScore <= 4) {
    items.push({ sentiment: "negative", message: `Low script score (${inputs.scriptQualityScore}/10) limits repeat viewing and critical support.` });
  }

  // Marketing
  if (inputs.marketing === "high") {
    items.push({ sentiment: "positive", message: `Full tentpole campaign maximizes reach — marketing contributes ${pct(factorMap.marketing?.contribution ?? 0)}.` });
  } else if (inputs.marketing === "low") {
    items.push({ sentiment: "negative", message: `Limited campaign constrains audience awareness — marketing only ${pct(factorMap.marketing?.contribution ?? 0)}.` });
  }

  // Timing
  if (inputs.timing === "summer" || inputs.timing === "holiday") {
    items.push({ sentiment: "positive", message: `Premium ${inputs.timing} window aligns with peak cinema attendance — timing at ${pct(factorMap.timing?.contribution ?? 0)}.` });
  } else if (inputs.timing === "limited") {
    items.push({ sentiment: "negative", message: "Limited release window caps theatrical ceiling." });
  }

  // Historical influence
  if (inputs.historicalDataInfluence >= 7) {
    items.push({ sentiment: "positive", message: `High historical data influence (${inputs.historicalDataInfluence}/10) — dataset strongly supports this trajectory.` });
  }

  // Benchmark match
  if (inputs.benchmarkMatch >= 7) {
    items.push({ sentiment: "positive", message: `Benchmark match (${inputs.benchmarkMatch}/10) — comparable films confirm ${result.finalMultiplier.toFixed(2)}× multiplier has precedent.` });
  }

  // Exceptional movie
  if (inputs.isExceptionalMovie) {
    items.push({ sentiment: "positive", message: "Exceptional movie flag active — ceiling raised, floor stabilized, opening boosted." });
  }

  // Platform
  if (inputs.platform !== "theatrical") {
    items.push({ sentiment: "neutral", message: "Digital model active — revenue computed via views × engagement × virality / CPM." });
  }

  // Always last: final multiplier breakdown
  items.push({
    sentiment: "neutral",
    message: `Final multiplier = ${result.finalMultiplier.toFixed(2)}× (base ${result.baseMultiplier.toFixed(2)}× × 0.6 + dataset ${result.datasetMultiplier.toFixed(2)}× × 0.4)`,
  });

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION H — Core calculation (deterministic — zero randomness)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * calculateProjection — Deterministic hybrid projection engine.
 *
 * Formula:
 *   weightedScore   = Σ(factorScore × weight)
 *   baseMultiplier  = 0.8 + (weightedScore × 1.5)
 *   datasetMult     = similarity-weighted average of matched benchmark films
 *   finalMultiplier = (baseMultiplier × 0.6) + (datasetMult × 0.4)
 *
 * Exceptional movie override:
 *   finalMultiplier = Math.min(finalMultiplier × 1.25, 3.5)
 *
 * Same inputs always return the same output (no Math.random, no Date.now in calculations).
 */
export function calculateProjection(inputs: ProjectionInputs): ProjectionResult {
  const {
    platform, genre, starPower, marketing, timing, audienceType,
    scriptQualityScore, historicalDataInfluence, benchmarkMatch,
    productionBudget, marketingBudget, pnaExpenses, isExceptionalMovie,
    reach = 0, engagementRate = 0.3, cpm = 100,
  } = inputs;

  // ── 1. Factor scores (all normalized 0–1) ─────────────────────────────────
  const genreScore     = GENRE_SCORES[genre];
  const starScore      = STAR_SCORES[starPower];
  const scriptScore    = normSlider(scriptQualityScore);
  const marketingScore = MARKETING_SCORES[marketing];
  const timingScore    = TIMING_SCORES[timing];
  const audienceScore  = AUDIENCE_SCORES[audienceType];
  const historicalScore = normSlider(historicalDataInfluence);
  const benchmarkScore = normSlider(benchmarkMatch);

  // ── 2. Weighted score ─────────────────────────────────────────────────────
  const weightedScore =
    genreScore     * FACTOR_WEIGHTS.genre      +
    starScore      * FACTOR_WEIGHTS.star       +
    scriptScore    * FACTOR_WEIGHTS.script     +
    marketingScore * FACTOR_WEIGHTS.marketing  +
    timingScore    * FACTOR_WEIGHTS.timing     +
    audienceScore  * FACTOR_WEIGHTS.audience   +
    historicalScore * FACTOR_WEIGHTS.historical +
    benchmarkScore * FACTOR_WEIGHTS.benchmark;

  // ── 3. Multipliers ────────────────────────────────────────────────────────
  const baseMultiplier = 0.8 + (weightedScore * 1.5);

  const { films: benchmarkFilms, averageSimilarity } = matchBenchmarkFilms(inputs);
  const datasetMultiplier = weightedBenchmarkMultiplier(benchmarkFilms);

  let finalMultiplier = (baseMultiplier * 0.6) + (datasetMultiplier * 0.4);
  if (isExceptionalMovie) {
    finalMultiplier = Math.min(finalMultiplier * 1.25, 3.5);
  }

  // ── 4. Revenue (theatrical vs digital) ───────────────────────────────────
  const totalExpenses = productionBudget + marketingBudget + pnaExpenses;
  const baseRevenue   = totalExpenses;

  let finalRevenue:       number;
  let theatricalRevenue:  number;
  let digitalRevenue:     number;
  let estimatedViews:     number | undefined;
  let adjustedEngagement: number | undefined;

  if (platform === "theatrical") {
    finalRevenue      = baseRevenue * finalMultiplier;
    theatricalRevenue = finalRevenue * (isExceptionalMovie ? 0.65 : 0.60);
    digitalRevenue    = finalRevenue * (isExceptionalMovie ? 0.35 : 0.40);
  } else {
    // Digital revenue model (YouTube / OTT)
    const virality         = VIRALITY_BY_GENRE[genre];
    const engBoost         = 1 + (weightedScore * 0.5);
    adjustedEngagement     = Math.min(engagementRate * engBoost, 0.95);
    estimatedViews         = reach * adjustedEngagement * virality * (isExceptionalMovie ? 1.3 : 1.0);
    // revenue (₹ Cr) = (views / 1000) × cpm / 100
    finalRevenue           = (estimatedViews / 1000) * cpm / 100;
    theatricalRevenue      = 0;
    digitalRevenue         = finalRevenue;
  }

  // ── 5. Weekly distribution ────────────────────────────────────────────────
  const weekDefs = platform === "theatrical" ? THEATRICAL_WEEKS : DIGITAL_WEEKS;
  let cumulative = 0;
  const weeklyDistribution: WeeklySlice[] = weekDefs.map(({ week, pct }, i) => {
    let weekRevenue = finalRevenue * pct;
    // +15% opening-week bonus for exceptional movies
    if (isExceptionalMovie && i === 0) weekRevenue *= 1.15;
    cumulative += weekRevenue;
    return {
      week,
      percentage:        pct * 100,
      revenue:           weekRevenue,
      cumulativeRevenue: cumulative,
    };
  });

  // ── 6. Break-even ─────────────────────────────────────────────────────────
  const breakEvenIdx = totalExpenses > 0
    ? weeklyDistribution.findIndex((w) => w.cumulativeRevenue >= totalExpenses)
    : -1;
  const breakEvenWeek     = breakEvenIdx >= 0 ? breakEvenIdx + 1 : null;
  const breakEvenAchieved = breakEvenWeek !== null;

  // ── 7. FactorScore[] ──────────────────────────────────────────────────────
  const factors: FactorScore[] = [
    { key: "genre",     label: "Genre",                score: genreScore,      weight: FACTOR_WEIGHTS.genre,      contribution: genreScore     * FACTOR_WEIGHTS.genre      },
    { key: "star",      label: "Star Power",           score: starScore,       weight: FACTOR_WEIGHTS.star,       contribution: starScore      * FACTOR_WEIGHTS.star       },
    { key: "script",    label: "Script Quality",       score: scriptScore,     weight: FACTOR_WEIGHTS.script,     contribution: scriptScore    * FACTOR_WEIGHTS.script     },
    { key: "marketing", label: "Marketing",            score: marketingScore,  weight: FACTOR_WEIGHTS.marketing,  contribution: marketingScore * FACTOR_WEIGHTS.marketing  },
    { key: "timing",    label: "Release Timing",       score: timingScore,     weight: FACTOR_WEIGHTS.timing,     contribution: timingScore    * FACTOR_WEIGHTS.timing     },
    { key: "audience",  label: "Audience Type",        score: audienceScore,   weight: FACTOR_WEIGHTS.audience,   contribution: audienceScore  * FACTOR_WEIGHTS.audience   },
    { key: "historical",label: "Historical Influence", score: historicalScore, weight: FACTOR_WEIGHTS.historical, contribution: historicalScore* FACTOR_WEIGHTS.historical },
    { key: "benchmark", label: "Benchmark Match",      score: benchmarkScore,  weight: FACTOR_WEIGHTS.benchmark,  contribution: benchmarkScore * FACTOR_WEIGHTS.benchmark  },
  ];

  // ── 8. Explanations ───────────────────────────────────────────────────────
  const explanations = generateExplanations(inputs, {
    weightedScore, baseMultiplier, datasetMultiplier, finalMultiplier, factors,
  });

  // ── 9. Extended fields (v2.1) — all deterministic, no randomness ──────────

  // 9a. Hit probability via sigmoid
  const sigInput =
    (finalMultiplier - 1.2) * 2 +
    (scriptScore      - 0.6) * 2 +   // scriptScore already normalized 0–1
    (marketingScore   - 0.5);         // marketingScore already normalized 0–1
  const successProbability = sigmoid(sigInput);
  const successLabel: SuccessLabel =
    successProbability < 0.40 ? "High Risk"  :
    successProbability < 0.60 ? "Uncertain"  :
    successProbability < 0.80 ? "Promising"  :
                                "Strong Hit";

  // 9b. Region split
  const overseasShare   = 0.30 + (OVERSEAS_BOOST[genre] ?? 0);
  const domesticShare   = 1 - overseasShare;
  const domesticRevenue = finalRevenue * domesticShare;
  const overseasRevenue = finalRevenue * overseasShare;

  // 9c. OTT deal estimate
  const ottFactor =
    finalMultiplier < 1.2 ? 0.8 :
    finalMultiplier < 1.8 ? 1.2 :
                            2.0;
  const ottDealEstimate = productionBudget * ottFactor;

  // 9d. Confidence score
  const historicalWeight = normSlider(historicalDataInfluence);  // (val-1)/9 → 0–1
  const confidenceScore  = averageSimilarity * 0.6 + historicalWeight * 0.4;

  // 9e. Revenue range (deterministic — no random spread)
  const minRevenue = finalRevenue * 0.70;
  const maxRevenue = finalRevenue * 1.30;

  // 9f. Summary line — driven by top 2 contributing factors
  const sortedFactors  = [...factors].sort((a, b) => b.contribution - a.contribution);
  const f1Label        = sortedFactors[0]?.label ?? "Factor 1";
  const f2Label        = sortedFactors[1]?.label ?? "Factor 2";
  const summaryLine    =
    isExceptionalMovie
      ? `Exceptional movie designation elevated ceiling — ${f1Label} and ${f2Label} reinforce strong upside.`
      : successLabel === "High Risk"
      ? `High risk profile — ${f1Label} is insufficient to offset weak overall score.`
      : `${f1Label} and ${f2Label} are the primary drivers of this projection.`;

  // ── 10. Legacy field compatibility ─────────────────────────────────────────
  const openingWeekRatio = isExceptionalMovie ? 0.45 : 0.35;
  const week1Ratio       = isExceptionalMovie ? 0.75 : 0.65;
  const lowFactor        = isExceptionalMovie ? 0.75 : 0.80;
  const highFactor       = isExceptionalMovie ? 1.35 : 1.20;

  return {
    // New v2 fields
    platform,
    totalExpenses,
    baseRevenue,
    finalRevenue,
    theatricalRevenue,
    digitalRevenue,
    weightedScore,
    baseMultiplier,
    datasetMultiplier,
    finalMultiplier,
    weeklyDistribution,
    breakEvenWeek,
    breakEvenAchieved,
    factors,
    explanations,
    ...(estimatedViews     !== undefined ? { estimatedViews }     : {}),
    ...(adjustedEngagement !== undefined ? { adjustedEngagement } : {}),

    // Extended v2.1 fields
    successProbability,
    successLabel,
    domesticRevenue,
    overseasRevenue,
    ottDealEstimate,
    confidenceScore,
    minRevenue,
    maxRevenue,
    summaryLine,

    // Legacy aliases (backward compat)
    multiplier:       finalMultiplier,
    baseWeightedMult: baseMultiplier,
    datasetMult:      datasetMultiplier,
    baseProjected:    baseRevenue,
    projected:        finalRevenue,
    lowEstimate:      finalRevenue * lowFactor,
    highEstimate:     finalRevenue * highFactor,
    openingWeekend:   finalRevenue * openingWeekRatio,
    week1:            finalRevenue * week1Ratio,
    similarFilms:     benchmarkFilms.map((bf) => ({
      film: {
        id: bf.film.id, title: bf.film.title, genre: bf.film.genre,
        star: bf.film.star, audience: bf.film.audience,
        budget: bf.film.budget, collections: bf.film.collections,
        multiplier: bf.film.multiplier, scriptScore: bf.film.scriptScore,
      },
      rawScore: bf.rawScore,
      pct: bf.pct,
      closest: bf.closest,
    })),
    explanation: explanations.map((e) => e.message),
    breakdown: {
      starPower:     starScore,
      genre:         genreScore,
      marketing:     marketingScore,
      releaseTiming: timingScore,
      scriptScore:   scriptScore,
      audience:      audienceScore,
      historical:    historicalScore,
      benchmark:     benchmarkScore,
      exceptional:   isExceptionalMovie ? 1.18 : 1,
    },
  };
}

export const calculateProjectionDeterministic = calculateProjection;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION I — Human-readable label maps (backward compat + new)
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated kept for backward compat */
export const STAR_LABELS: Record<StarPower, string> = {
  unknown:  "Unknown / Newcomer",
  mid:      "Mid-tier Star",
  "a-list": "A-list / Superstar",
};
export const STAR_LEVEL_LABELS: Record<StarLevel, string> = {
  low:    "Low / Unknown",
  medium: "Mid-tier Star",
  high:   "A-list / Superstar",
};

/** @deprecated kept for backward compat */
export const GENRE_LABELS: Record<Genre, string> = {
  drama:    "Drama",
  comedy:   "Comedy",
  action:   "Action",
  "sci-fi": "Sci-Fi",
};
export const RELEASE_GENRE_LABELS: Record<ReleaseGenre, string> = {
  action:      "Action",
  drama:       "Drama",
  comedy:      "Comedy",
  horror:      "Horror",
  thriller:    "Thriller",
  animation:   "Animation",
  documentary: "Documentary",
  scifi:       "Sci-Fi / Sci-Fi",
};

export const MARKETING_LABELS: Record<MarketingLevel, string> = {
  low:    "Low  (< ₹5 Cr)",
  medium: "Medium  (₹5–20 Cr)",
  high:   "High  (> ₹20 Cr)",
};

/** @deprecated kept for backward compat */
export const TIMING_LABELS: Record<ReleaseTiming, string> = {
  normal:   "Normal Weekend",
  holiday:  "Holiday Weekend",
  festival: "Festival / Eid / Diwali",
};
export const FULL_TIMING_LABELS: Record<FullReleaseTiming, string> = {
  summer:   "Summer Season",
  holiday:  "Holiday Weekend",
  festival: "Festival / Eid / Diwali",
  normal:   "Normal Weekend",
  limited:  "Limited Release",
};

/** @deprecated kept for backward compat */
export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  niche: "Niche / Art-house",
  youth: "Youth / College",
  mass:  "Mass / Pan-India",
};
export const FULL_AUDIENCE_LABELS: Record<FullAudienceType, string> = {
  mass:   "Mass / Pan-India",
  family: "Family Audience",
  teen:   "Teen / Youth",
  niche:  "Niche / Art-house",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  theatrical: "🎬 Theatrical",
  ott:        "📺 OTT / Streaming",
  youtube:    "▶  YouTube",
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION J — Zone helpers (backward compat)
// ─────────────────────────────────────────────────────────────────────────────

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
