// ══════════════════════════════════════════════════════════════════════════════
//  ScriptMind AI — Film Reference Dataset
//  Archetypal films with similarity-weighted matching.
//  Values are representative benchmarks, not exact real-film figures.
// ══════════════════════════════════════════════════════════════════════════════

import type { StarPower, Genre, AudienceType } from "./projection";

export interface FilmReference {
  id:          string;
  title:       string;
  genre:       Genre;
  star:        StarPower;
  audience:    AudienceType;
  budget:      number;       // ₹ Cr
  collections: number;       // ₹ Cr
  multiplier:  number;       // collections / budget
  scriptScore: number;       // estimated quality score 0–100
}

/** A film paired with its similarity score against the current query */
export interface ScoredFilm {
  film:     FilmReference;
  rawScore: number;   // 0–10  (sum of individual match points)
  pct:      number;   // 0–100 (normalised percentage)
  closest:  boolean;  // true only for the top-ranked match
}

// ── Dataset ────────────────────────────────────────────────────────────────────

export const FILM_DATASET: FilmReference[] = [
  // ── Action · A-list · mass ────────────────────────────────────────────────
  { id: "a1", title: "War Zone",           genre: "action", star: "a-list", audience: "mass",  budget: 200, collections:  750, multiplier: 3.75, scriptScore: 78 },
  { id: "a2", title: "Thunder Peak",       genre: "action", star: "a-list", audience: "mass",  budget: 150, collections:  600, multiplier: 4.00, scriptScore: 82 },
  { id: "a3", title: "Titan's Fury",       genre: "action", star: "a-list", audience: "mass",  budget: 250, collections:  860, multiplier: 3.44, scriptScore: 74 },
  { id: "a4", title: "Storm Rising",       genre: "action", star: "a-list", audience: "youth", budget: 130, collections:  480, multiplier: 3.69, scriptScore: 76 },
  // ── Action · Mid-tier ─────────────────────────────────────────────────────
  { id: "a5", title: "City Chase",         genre: "action", star: "mid",    audience: "youth", budget:  60, collections:  150, multiplier: 2.50, scriptScore: 62 },
  { id: "a6", title: "Street Law",         genre: "action", star: "mid",    audience: "mass",  budget:  75, collections:  190, multiplier: 2.53, scriptScore: 58 },
  { id: "a7", title: "Outlaw Run",         genre: "action", star: "mid",    audience: "niche", budget:  40, collections:   62, multiplier: 1.55, scriptScore: 52 },
  // ── Action · Unknown ──────────────────────────────────────────────────────
  { id: "a8", title: "Gritline",           genre: "action", star: "unknown",audience: "youth", budget:  12, collections:   17, multiplier: 1.42, scriptScore: 48 },
  { id: "a9", title: "Night Crawler",      genre: "action", star: "unknown",audience: "niche", budget:   8, collections:    9, multiplier: 1.13, scriptScore: 38 },
  // ── Drama · A-list ────────────────────────────────────────────────────────
  { id: "d1", title: "The Last Sunset",    genre: "drama",  star: "a-list", audience: "mass",  budget:  80, collections:  240, multiplier: 3.00, scriptScore: 85 },
  { id: "d2", title: "Broken Roads",       genre: "drama",  star: "a-list", audience: "niche", budget:  55, collections:  119, multiplier: 2.16, scriptScore: 79 },
  { id: "d3", title: "River of Time",      genre: "drama",  star: "a-list", audience: "mass",  budget:  95, collections:  305, multiplier: 3.21, scriptScore: 88 },
  // ── Drama · Mid-tier ──────────────────────────────────────────────────────
  { id: "d4", title: "Village Echoes",     genre: "drama",  star: "mid",    audience: "mass",  budget:  30, collections:   65, multiplier: 2.17, scriptScore: 68 },
  { id: "d5", title: "Quiet Storm",        genre: "drama",  star: "mid",    audience: "niche", budget:  15, collections:   18, multiplier: 1.20, scriptScore: 55 },
  { id: "d6", title: "Family Roots",       genre: "drama",  star: "mid",    audience: "mass",  budget:  40, collections:   86, multiplier: 2.15, scriptScore: 65 },
  // ── Drama · Unknown ───────────────────────────────────────────────────────
  { id: "d7", title: "First Step",         genre: "drama",  star: "unknown",audience: "niche", budget:   8, collections:    7, multiplier: 0.88, scriptScore: 42 },
  { id: "d8", title: "Monsoon Letters",    genre: "drama",  star: "unknown",audience: "youth", budget:  10, collections:   11, multiplier: 1.10, scriptScore: 50 },
  // ── Comedy · A-list ───────────────────────────────────────────────────────
  { id: "c1", title: "Grand Fiesta",       genre: "comedy", star: "a-list", audience: "mass",  budget:  90, collections:  315, multiplier: 3.50, scriptScore: 80 },
  { id: "c2", title: "Wedding Chaos",      genre: "comedy", star: "a-list", audience: "mass",  budget:  75, collections:  270, multiplier: 3.60, scriptScore: 77 },
  { id: "c3", title: "Laugh Track",        genre: "comedy", star: "a-list", audience: "youth", budget:  60, collections:  192, multiplier: 3.20, scriptScore: 72 },
  // ── Comedy · Mid-tier ─────────────────────────────────────────────────────
  { id: "c4", title: "Office Mix-Up",      genre: "comedy", star: "mid",    audience: "youth", budget:  30, collections:   72, multiplier: 2.40, scriptScore: 60 },
  { id: "c5", title: "Road Trip Reloaded", genre: "comedy", star: "mid",    audience: "mass",  budget:  45, collections:  108, multiplier: 2.40, scriptScore: 63 },
  { id: "c6", title: "Desi Confusions",    genre: "comedy", star: "unknown",audience: "youth", budget:  12, collections:   20, multiplier: 1.67, scriptScore: 47 },
  // ── Sci-fi · A-list ───────────────────────────────────────────────────────
  { id: "s1", title: "Stellar Wars",       genre: "sci-fi", star: "a-list", audience: "youth", budget: 220, collections:  500, multiplier: 2.27, scriptScore: 73 },
  { id: "s2", title: "Quantum Breach",     genre: "sci-fi", star: "a-list", audience: "mass",  budget: 180, collections:  432, multiplier: 2.40, scriptScore: 76 },
  // ── Sci-fi · Mid-tier ─────────────────────────────────────────────────────
  { id: "s3", title: "Zero Gravity",       genre: "sci-fi", star: "mid",    audience: "youth", budget:  90, collections:  130, multiplier: 1.44, scriptScore: 58 },
  { id: "s4", title: "Future Protocol",    genre: "sci-fi", star: "mid",    audience: "niche", budget:  70, collections:   88, multiplier: 1.26, scriptScore: 54 },
  // ── Sci-fi · Unknown ──────────────────────────────────────────────────────
  { id: "s5", title: "Neon Code",          genre: "sci-fi", star: "unknown",audience: "niche", budget:  30, collections:   27, multiplier: 0.90, scriptScore: 40 },
  { id: "s6", title: "Dark Protocol",      genre: "sci-fi", star: "unknown",audience: "youth", budget:  22, collections:   26, multiplier: 1.18, scriptScore: 45 },
];

// ── Scoring constants ──────────────────────────────────────────────────────────

const MAX_RAW_SCORE = 10; // 3 + 2 + 1 + 2 + 2

/**
 * Compute per-film similarity score:
 *   Genre match         +3
 *   Star match          +2
 *   Audience match      +1
 *   Budget ±30 %        +2
 *   Script score ±20pt  +2
 */
function filmScore(
  f: FilmReference,
  genre: Genre,
  star: StarPower,
  audience: AudienceType,
  inputBudget: number,
  inputScriptScore: number,
): number {
  let s = 0;
  if (f.genre    === genre)    s += 3;
  if (f.star     === star)     s += 2;
  if (f.audience === audience) s += 1;

  if (inputBudget > 0) {
    const lo = inputBudget * 0.70;
    const hi = inputBudget * 1.30;
    if (f.budget >= lo && f.budget <= hi) s += 2;
  }

  if (Math.abs(f.scriptScore - inputScriptScore) <= 20) s += 2;

  return s;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Return top-N films sorted by similarity score.
 * Each result carries `rawScore`, `pct`, and `closest` flag.
 */
export function matchFilms(
  genre:            Genre,
  star:             StarPower,
  audience:         AudienceType,
  inputBudget     = 0,
  inputScriptScore = 50,
  topN             = 3,
): ScoredFilm[] {
  const scored = FILM_DATASET.map((f) => ({
    f,
    score: filmScore(f, genre, star, audience, inputBudget, inputScriptScore),
  }));

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.f.multiplier - a.f.multiplier, // tie-break: higher multiplier first
  );

  const top = scored.slice(0, topN);
  return top.map((item, idx) => ({
    film:     item.f,
    rawScore: item.score,
    pct:      Math.round((item.score / MAX_RAW_SCORE) * 100),
    closest:  idx === 0,
  }));
}

/**
 * Similarity-weighted average multiplier.
 *   mult = Σ(multiplier × score) / Σ(score)
 * Falls back to simple average when all scores are 0.
 */
export function weightedMultiplier(films: ScoredFilm[]): number {
  if (films.length === 0) return 1;

  const totalScore = films.reduce((s, f) => s + f.rawScore, 0);
  if (totalScore === 0) {
    // all scores zero → plain average
    return films.reduce((s, f) => s + f.film.multiplier, 0) / films.length;
  }

  return (
    films.reduce((s, f) => s + f.film.multiplier * f.rawScore, 0) / totalScore
  );
}

/** Simple average — kept for backward compatibility */
export function avgMultiplier(films: Pick<ScoredFilm, "film">[]): number {
  if (films.length === 0) return 1;
  return films.reduce((s, f) => s + f.film.multiplier, 0) / films.length;
}
