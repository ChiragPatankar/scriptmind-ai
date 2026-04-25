// ══════════════════════════════════════════════════════════════════════════════
//  ScriptMind AI — Film Reference Dataset  (v2 — 8 genres)
//  Deterministic similarity-weighted matching.
//  Values are representative benchmarks, not exact real-film figures.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  StarPower, Genre, AudienceType,
  StarLevel, ReleaseGenre, FullReleaseTiming, FullAudienceType,
  ProjectionInputs,
} from "./projection";

// ─────────────────────────────────────────────────────────────────────────────
// Legacy types (kept for backward compat with old film-dataset callers)
// ─────────────────────────────────────────────────────────────────────────────

export interface FilmReference {
  id:          string;
  title:       string;
  genre:       Genre;
  star:        StarPower;
  audience:    AudienceType;
  budget:      number;       // ₹ Cr
  collections: number;       // ₹ Cr
  multiplier:  number;
  scriptScore: number;       // 0–100
}

export interface ScoredFilm {
  film:     FilmReference;
  rawScore: number;
  pct:      number;
  closest:  boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// New v2 benchmark types (8-genre, 3-timing, 4-audience)
// ─────────────────────────────────────────────────────────────────────────────

export interface BenchmarkFilm {
  id:          string;
  title:       string;
  genre:       ReleaseGenre;
  star:        StarLevel;
  audience:    FullAudienceType;
  timing:      FullReleaseTiming;
  budget:      number;       // ₹ Cr (total spend)
  collections: number;       // ₹ Cr
  multiplier:  number;
  scriptScore: number;       // 0–100
}

export interface ScoredBenchmark {
  film:     BenchmarkFilm;
  rawScore: number;   // 0–10 (0.5+0.3+0.2 similarity)
  pct:      number;   // 0–100 normalised
  closest:  boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy dataset (kept — do not delete)
// ─────────────────────────────────────────────────────────────────────────────

export const FILM_DATASET: FilmReference[] = [
  // ── Action · A-list · mass ────────────────────────────────────────────────
  { id: "a1", title: "War Zone",           genre: "action", star: "a-list", audience: "mass",  budget: 200, collections:  750, multiplier: 3.75, scriptScore: 78 },
  { id: "a2", title: "Thunder Peak",       genre: "action", star: "a-list", audience: "mass",  budget: 150, collections:  600, multiplier: 4.00, scriptScore: 82 },
  { id: "a3", title: "Titan's Fury",       genre: "action", star: "a-list", audience: "mass",  budget: 250, collections:  860, multiplier: 3.44, scriptScore: 74 },
  { id: "a4", title: "Storm Rising",       genre: "action", star: "a-list", audience: "youth", budget: 130, collections:  480, multiplier: 3.69, scriptScore: 76 },
  { id: "a5", title: "City Chase",         genre: "action", star: "mid",    audience: "youth", budget:  60, collections:  150, multiplier: 2.50, scriptScore: 62 },
  { id: "a6", title: "Street Law",         genre: "action", star: "mid",    audience: "mass",  budget:  75, collections:  190, multiplier: 2.53, scriptScore: 58 },
  { id: "a7", title: "Outlaw Run",         genre: "action", star: "mid",    audience: "niche", budget:  40, collections:   62, multiplier: 1.55, scriptScore: 52 },
  { id: "a8", title: "Gritline",           genre: "action", star: "unknown",audience: "youth", budget:  12, collections:   17, multiplier: 1.42, scriptScore: 48 },
  { id: "a9", title: "Night Crawler",      genre: "action", star: "unknown",audience: "niche", budget:   8, collections:    9, multiplier: 1.13, scriptScore: 38 },
  // ── Drama · A-list ────────────────────────────────────────────────────────
  { id: "d1", title: "The Last Sunset",    genre: "drama",  star: "a-list", audience: "mass",  budget:  80, collections:  240, multiplier: 3.00, scriptScore: 85 },
  { id: "d2", title: "Broken Roads",       genre: "drama",  star: "a-list", audience: "niche", budget:  55, collections:  119, multiplier: 2.16, scriptScore: 79 },
  { id: "d3", title: "River of Time",      genre: "drama",  star: "a-list", audience: "mass",  budget:  95, collections:  305, multiplier: 3.21, scriptScore: 88 },
  { id: "d4", title: "Village Echoes",     genre: "drama",  star: "mid",    audience: "mass",  budget:  30, collections:   65, multiplier: 2.17, scriptScore: 68 },
  { id: "d5", title: "Quiet Storm",        genre: "drama",  star: "mid",    audience: "niche", budget:  15, collections:   18, multiplier: 1.20, scriptScore: 55 },
  { id: "d6", title: "Family Roots",       genre: "drama",  star: "mid",    audience: "mass",  budget:  40, collections:   86, multiplier: 2.15, scriptScore: 65 },
  { id: "d7", title: "First Step",         genre: "drama",  star: "unknown",audience: "niche", budget:   8, collections:    7, multiplier: 0.88, scriptScore: 42 },
  { id: "d8", title: "Monsoon Letters",    genre: "drama",  star: "unknown",audience: "youth", budget:  10, collections:   11, multiplier: 1.10, scriptScore: 50 },
  // ── Comedy · A-list ───────────────────────────────────────────────────────
  { id: "c1", title: "Grand Fiesta",       genre: "comedy", star: "a-list", audience: "mass",  budget:  90, collections:  315, multiplier: 3.50, scriptScore: 80 },
  { id: "c2", title: "Wedding Chaos",      genre: "comedy", star: "a-list", audience: "mass",  budget:  75, collections:  270, multiplier: 3.60, scriptScore: 77 },
  { id: "c3", title: "Laugh Track",        genre: "comedy", star: "a-list", audience: "youth", budget:  60, collections:  192, multiplier: 3.20, scriptScore: 72 },
  { id: "c4", title: "Office Mix-Up",      genre: "comedy", star: "mid",    audience: "youth", budget:  30, collections:   72, multiplier: 2.40, scriptScore: 60 },
  { id: "c5", title: "Road Trip Reloaded", genre: "comedy", star: "mid",    audience: "mass",  budget:  45, collections:  108, multiplier: 2.40, scriptScore: 63 },
  { id: "c6", title: "Desi Confusions",    genre: "comedy", star: "unknown",audience: "youth", budget:  12, collections:   20, multiplier: 1.67, scriptScore: 47 },
  // ── Sci-fi ────────────────────────────────────────────────────────────────
  { id: "s1", title: "Stellar Wars",       genre: "sci-fi", star: "a-list", audience: "youth", budget: 220, collections:  500, multiplier: 2.27, scriptScore: 73 },
  { id: "s2", title: "Quantum Breach",     genre: "sci-fi", star: "a-list", audience: "mass",  budget: 180, collections:  432, multiplier: 2.40, scriptScore: 76 },
  { id: "s3", title: "Zero Gravity",       genre: "sci-fi", star: "mid",    audience: "youth", budget:  90, collections:  130, multiplier: 1.44, scriptScore: 58 },
  { id: "s4", title: "Future Protocol",    genre: "sci-fi", star: "mid",    audience: "niche", budget:  70, collections:   88, multiplier: 1.26, scriptScore: 54 },
  { id: "s5", title: "Neon Code",          genre: "sci-fi", star: "unknown",audience: "niche", budget:  30, collections:   27, multiplier: 0.90, scriptScore: 40 },
  { id: "s6", title: "Dark Protocol",      genre: "sci-fi", star: "unknown",audience: "youth", budget:  22, collections:   26, multiplier: 1.18, scriptScore: 45 },
];

// ─────────────────────────────────────────────────────────────────────────────
// v2 Benchmark dataset — 8 genres, timing + audience dimensions added
// ─────────────────────────────────────────────────────────────────────────────

export const BENCHMARK_FILMS: BenchmarkFilm[] = [
  // ── Action ────────────────────────────────────────────────────────────────
  { id: "b-a1",  title: "War Zone",          genre: "action",      star: "high",   audience: "mass",   timing: "summer",   budget: 200, collections:  750, multiplier: 3.75, scriptScore: 78 },
  { id: "b-a2",  title: "Thunder Peak",      genre: "action",      star: "high",   audience: "mass",   timing: "holiday",  budget: 150, collections:  600, multiplier: 4.00, scriptScore: 82 },
  { id: "b-a3",  title: "Storm Rising",      genre: "action",      star: "high",   audience: "teen",   timing: "summer",   budget: 130, collections:  480, multiplier: 3.69, scriptScore: 76 },
  { id: "b-a4",  title: "City Chase",        genre: "action",      star: "medium", audience: "teen",   timing: "normal",   budget:  60, collections:  150, multiplier: 2.50, scriptScore: 62 },
  { id: "b-a5",  title: "Street Law",        genre: "action",      star: "medium", audience: "mass",   timing: "normal",   budget:  75, collections:  190, multiplier: 2.53, scriptScore: 58 },
  { id: "b-a6",  title: "Night Crawler",     genre: "action",      star: "low",    audience: "niche",  timing: "limited",  budget:   8, collections:    9, multiplier: 1.13, scriptScore: 38 },
  // ── Drama ─────────────────────────────────────────────────────────────────
  { id: "b-d1",  title: "The Last Sunset",   genre: "drama",       star: "high",   audience: "mass",   timing: "festival", budget:  80, collections:  240, multiplier: 3.00, scriptScore: 85 },
  { id: "b-d2",  title: "River of Time",     genre: "drama",       star: "high",   audience: "mass",   timing: "holiday",  budget:  95, collections:  305, multiplier: 3.21, scriptScore: 88 },
  { id: "b-d3",  title: "Village Echoes",    genre: "drama",       star: "medium", audience: "mass",   timing: "normal",   budget:  30, collections:   65, multiplier: 2.17, scriptScore: 68 },
  { id: "b-d4",  title: "Family Roots",      genre: "drama",       star: "medium", audience: "family", timing: "festival", budget:  40, collections:   86, multiplier: 2.15, scriptScore: 65 },
  { id: "b-d5",  title: "First Step",        genre: "drama",       star: "low",    audience: "niche",  timing: "limited",  budget:   8, collections:    7, multiplier: 0.88, scriptScore: 42 },
  // ── Comedy ────────────────────────────────────────────────────────────────
  { id: "b-c1",  title: "Grand Fiesta",      genre: "comedy",      star: "high",   audience: "mass",   timing: "festival", budget:  90, collections:  315, multiplier: 3.50, scriptScore: 80 },
  { id: "b-c2",  title: "Wedding Chaos",     genre: "comedy",      star: "high",   audience: "family", timing: "holiday",  budget:  75, collections:  270, multiplier: 3.60, scriptScore: 77 },
  { id: "b-c3",  title: "Laugh Track",       genre: "comedy",      star: "high",   audience: "teen",   timing: "summer",   budget:  60, collections:  192, multiplier: 3.20, scriptScore: 72 },
  { id: "b-c4",  title: "Office Mix-Up",     genre: "comedy",      star: "medium", audience: "teen",   timing: "normal",   budget:  30, collections:   72, multiplier: 2.40, scriptScore: 60 },
  { id: "b-c5",  title: "Desi Confusions",   genre: "comedy",      star: "low",    audience: "teen",   timing: "normal",   budget:  12, collections:   20, multiplier: 1.67, scriptScore: 47 },
  // ── Horror ────────────────────────────────────────────────────────────────
  { id: "b-h1",  title: "Haunted House",     genre: "horror",      star: "medium", audience: "teen",   timing: "normal",   budget:  20, collections:   52, multiplier: 2.60, scriptScore: 64 },
  { id: "b-h2",  title: "The Dark Entity",   genre: "horror",      star: "low",    audience: "niche",  timing: "limited",  budget:   8, collections:   14, multiplier: 1.75, scriptScore: 55 },
  { id: "b-h3",  title: "Possession Night",  genre: "horror",      star: "high",   audience: "mass",   timing: "holiday",  budget:  45, collections:  128, multiplier: 2.84, scriptScore: 70 },
  { id: "b-h4",  title: "Scream Valley",     genre: "horror",      star: "medium", audience: "teen",   timing: "summer",   budget:  30, collections:   75, multiplier: 2.50, scriptScore: 60 },
  // ── Thriller ──────────────────────────────────────────────────────────────
  { id: "b-t1",  title: "Hidden Motive",     genre: "thriller",    star: "high",   audience: "mass",   timing: "normal",   budget:  80, collections:  232, multiplier: 2.90, scriptScore: 82 },
  { id: "b-t2",  title: "The Last Witness",  genre: "thriller",    star: "medium", audience: "niche",  timing: "limited",  budget:  25, collections:   42, multiplier: 1.68, scriptScore: 68 },
  { id: "b-t3",  title: "Edge of Truth",     genre: "thriller",    star: "high",   audience: "mass",   timing: "summer",   budget: 100, collections:  315, multiplier: 3.15, scriptScore: 78 },
  { id: "b-t4",  title: "Cold Trail",        genre: "thriller",    star: "low",    audience: "niche",  timing: "limited",  budget:  12, collections:   12, multiplier: 1.00, scriptScore: 50 },
  // ── Animation ─────────────────────────────────────────────────────────────
  { id: "b-an1", title: "Painted World",     genre: "animation",   star: "medium", audience: "family", timing: "summer",   budget:  60, collections:  216, multiplier: 3.60, scriptScore: 78 },
  { id: "b-an2", title: "Sky Kingdom",       genre: "animation",   star: "high",   audience: "family", timing: "holiday",  budget: 120, collections:  480, multiplier: 4.00, scriptScore: 84 },
  { id: "b-an3", title: "The Little Giants", genre: "animation",   star: "low",    audience: "family", timing: "normal",   budget:  25, collections:   57, multiplier: 2.28, scriptScore: 70 },
  { id: "b-an4", title: "Jungle Tales",      genre: "animation",   star: "medium", audience: "teen",   timing: "summer",   budget:  45, collections:  135, multiplier: 3.00, scriptScore: 72 },
  // ── Documentary ───────────────────────────────────────────────────────────
  { id: "b-dc1", title: "Truth on Film",     genre: "documentary", star: "low",    audience: "niche",  timing: "limited",  budget:   5, collections:    6, multiplier: 1.20, scriptScore: 78 },
  { id: "b-dc2", title: "The Real Story",    genre: "documentary", star: "medium", audience: "niche",  timing: "festival", budget:  10, collections:   18, multiplier: 1.80, scriptScore: 82 },
  { id: "b-dc3", title: "Behind the Frame",  genre: "documentary", star: "low",    audience: "mass",   timing: "normal",   budget:   8, collections:   10, multiplier: 1.25, scriptScore: 72 },
  // ── Sci-Fi ────────────────────────────────────────────────────────────────
  { id: "b-s1",  title: "Stellar Wars",      genre: "scifi",       star: "high",   audience: "teen",   timing: "summer",   budget: 220, collections:  500, multiplier: 2.27, scriptScore: 73 },
  { id: "b-s2",  title: "Quantum Breach",    genre: "scifi",       star: "high",   audience: "mass",   timing: "holiday",  budget: 180, collections:  432, multiplier: 2.40, scriptScore: 76 },
  { id: "b-s3",  title: "Zero Gravity",      genre: "scifi",       star: "medium", audience: "teen",   timing: "normal",   budget:  90, collections:  130, multiplier: 1.44, scriptScore: 58 },
  { id: "b-s4",  title: "Future Protocol",   genre: "scifi",       star: "medium", audience: "niche",  timing: "limited",  budget:  70, collections:   88, multiplier: 1.26, scriptScore: 54 },
  { id: "b-s5",  title: "Neon Code",         genre: "scifi",       star: "low",    audience: "niche",  timing: "limited",  budget:  30, collections:   27, multiplier: 0.90, scriptScore: 40 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Legacy public API (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_RAW_SCORE = 10;

function legacyFilmScore(
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
    score: legacyFilmScore(f, genre, star, audience, inputBudget, inputScriptScore),
  }));
  scored.sort((a, b) => b.score - a.score || b.f.multiplier - a.f.multiplier);
  const top = scored.slice(0, topN);
  return top.map((item, idx) => ({
    film:     item.f,
    rawScore: item.score,
    pct:      Math.round((item.score / MAX_RAW_SCORE) * 100),
    closest:  idx === 0,
  }));
}

export function weightedMultiplier(films: ScoredFilm[]): number {
  if (films.length === 0) return 1;
  const totalScore = films.reduce((s, f) => s + f.rawScore, 0);
  if (totalScore === 0) {
    return films.reduce((s, f) => s + f.film.multiplier, 0) / films.length;
  }
  return films.reduce((s, f) => s + f.film.multiplier * f.rawScore, 0) / totalScore;
}

export function avgMultiplier(films: Pick<ScoredFilm, "film">[]): number {
  if (films.length === 0) return 1;
  return films.reduce((s, f) => s + f.film.multiplier, 0) / films.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// v2 Public API — benchmark matching using ProjectionInputs
//
// Similarity score = genre match (0.5) + timing match (0.3) + audience (0.2)
// Returns top-3 closest BenchmarkFilm entries.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_BENCH_SCORE = 1.0; // genre(0.5) + timing(0.3) + audience(0.2)

function benchmarkScore(
  f:      BenchmarkFilm,
  inputs: ProjectionInputs,
): number {
  let s = 0;
  if (f.genre    === inputs.genre)       s += 0.5;
  if (f.timing   === inputs.timing)      s += 0.3;
  if (f.audience === inputs.audienceType) s += 0.2;
  return s;
}

/**
 * Result shape returned by matchBenchmarkFilms.
 * averageSimilarity: mean rawScore of the top-N matched films (0–1 scale).
 * Used by calculateProjection() to derive confidenceScore.
 */
export interface BenchmarkMatchResult {
  films:             ScoredBenchmark[];
  averageSimilarity: number;   // 0–1
}

/**
 * matchBenchmarkFilms — Match on genre + timing + audience.
 * Returns top 3 closest BenchmarkFilm entries + their average similarity.
 * Similarity score = genre match (0.5) + timing match (0.3) + audience (0.2).
 */
export function matchBenchmarkFilms(
  inputs: ProjectionInputs,
  topN = 3,
): BenchmarkMatchResult {
  const scored = BENCHMARK_FILMS.map((f) => ({
    f,
    score: benchmarkScore(f, inputs),
  }));

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.f.multiplier - a.f.multiplier, // tie-break: higher multiplier first
  );

  const top = scored.slice(0, topN);
  const films = top.map((item, idx) => ({
    film:     item.f,
    rawScore: item.score,
    pct:      Math.round((item.score / MAX_BENCH_SCORE) * 100),
    closest:  idx === 0,
  }));

  const averageSimilarity =
    films.length > 0
      ? films.reduce((s, f) => s + f.rawScore, 0) / films.length
      : 0;

  return { films, averageSimilarity };
}

/**
 * weightedBenchmarkMultiplier — Average multiplier weighted by similarity score.
 * Returns a number like 1.8, 2.3, etc.
 */
export function weightedBenchmarkMultiplier(films: ScoredBenchmark[]): number {
  if (films.length === 0) return 1.5; // neutral fallback
  const totalScore = films.reduce((s, f) => s + f.rawScore, 0);
  if (totalScore === 0) {
    return films.reduce((s, f) => s + f.film.multiplier, 0) / films.length;
  }
  return (
    films.reduce((s, f) => s + f.film.multiplier * f.rawScore, 0) / totalScore
  );
}
