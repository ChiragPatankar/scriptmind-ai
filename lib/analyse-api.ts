/**
 * Script analysis API client — FastAPI POST /api/v1/scripts/analyse
 */

import type {
  AnalyseScriptReport,
  EmotionalTimelinePoint,
  EmotionDistribution,
  StructuredInsights,
} from "@/lib/mock/analyse-script";

const DEFAULT_API_BASE = "http://127.0.0.1:8000";

export function getAnalyseApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_ANALYSE_API_URL?.trim();
  return url || DEFAULT_API_BASE;
}

/** Raw JSON from Gemini (snake_case) */
export type AnalyseApiRaw = {
  originality_score?: number;
  opening_hook_strength?: number;
  engagement_score?: number;
  emotional_hook_strength?: number;
  similar_stories?: string[];
  previous_score?: number;
  new_score?: number;
  improvement?: number;
  screen_time?: Record<string, number>;
  dialogue_share?: Record<string, number>;
  emotional_timeline?: unknown[];
  emotion_distribution?: Record<string, number>;
  character_arcs?: Record<string, number[]>;
  character_emotional_arcs?: Record<string, number[]>;
  dialogue_quality?: number;
  readability?: number;
  insights?: unknown;
  best_scene?: string;
};

const DEFAULT_BEATS = ["Act I", "Act IIa", "Midpoint", "Act IIb", "Climax", "Resolution"];

function defaultActLabels(beatCount: number): string[] {
  if (beatCount <= 0) return [...DEFAULT_BEATS];
  if (beatCount <= DEFAULT_BEATS.length) return DEFAULT_BEATS.slice(0, beatCount);
  return Array.from({ length: beatCount }, (_, i) => `Beat ${i + 1}`);
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const p = parseFloat(v);
    if (!Number.isNaN(p)) return p;
  }
  return fallback;
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function recordNum(v: unknown): Record<string, number> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const n = num(val, NaN);
    if (!Number.isNaN(n)) out[k] = n;
  }
  return out;
}

function emotionalArcsFromApi(v: unknown): Record<string, number[]> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, number[]> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (!Array.isArray(val)) continue;
    out[k] = val.map((x) => num(x, 0));
  }
  return out;
}

const TIMELINE_EMOTION_KEYS = ["joy", "fear", "anger", "sadness", "surprise", "excitement", "anxiety"];

function emotionalTimelineFromApi(v: unknown): EmotionalTimelinePoint[] {
  if (!Array.isArray(v)) return [];
  return v.map((item, idx) => {
    if (!item || typeof item !== "object") return { scene: idx + 1 };
    const obj = item as Record<string, unknown>;
    const point: EmotionalTimelinePoint = { scene: num(obj.scene, idx + 1) };
    for (const key of TIMELINE_EMOTION_KEYS) {
      if (key in obj) point[key] = num(obj[key], 0);
    }
    return point;
  });
}

const EMOTION_KEYS: (keyof EmotionDistribution)[] = [
  "admiration", "adoration", "aesthetic_appreciation", "amusement",
  "anger", "anxiety", "awe", "awkwardness", "boredom", "calmness",
  "confusion", "craving", "disgust", "empathic_pain", "entrancement",
  "envy", "excitement", "fear", "horror", "interest", "joy",
  "nostalgia", "relief", "romance", "sadness", "satisfaction", "sexual_desire",
];

function emotionDistributionFromApi(v: unknown): EmotionDistribution {
  if (!v || typeof v !== "object") return {};
  const raw = v as Record<string, unknown>;
  const out: EmotionDistribution = {};
  for (const key of EMOTION_KEYS) {
    if (key in raw) (out as Record<string, number>)[key] = num(raw[key], 0);
  }
  return out;
}

function insightsFromApi(v: unknown): StructuredInsights {
  // If it's already a structured object
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    return {
      plotHoles: strArr(obj.plot_holes),
      pacingIssues: strArr(obj.pacing_issues),
      weakCharacters: strArr(obj.weak_characters),
      repetitiveDialogue: strArr(obj.repetitive_dialogue),
    };
  }
  // Legacy flat array — dump everything into plotHoles
  if (Array.isArray(v)) {
    return { plotHoles: strArr(v), pacingIssues: [], weakCharacters: [], repetitiveDialogue: [] };
  }
  return { plotHoles: [], pacingIssues: [], weakCharacters: [], repetitiveDialogue: [] };
}

/**
 * Map backend / Gemini payload to dashboard model.
 */
export function mapApiResponseToReport(
  raw: AnalyseApiRaw | Record<string, unknown>,
  fileName: string
): AnalyseScriptReport {
  const r = raw as AnalyseApiRaw;

  const emotionalArcs = emotionalArcsFromApi(r.character_emotional_arcs ?? r.character_arcs);
  const lengths = Object.values(emotionalArcs).map((a) => a.length);
  const maxLen = lengths.length ? Math.max(...lengths) : DEFAULT_BEATS.length;
  const actLabels = defaultActLabels(maxLen);

  const baseTitle = fileName.replace(/\.[^.]+$/i, "").trim() || "Uploaded script";

  return {
    scriptTitle: baseTitle,
    originality: num(r.originality_score),
    hook: num(r.opening_hook_strength),
    engagement: num(r.engagement_score),
    emotional: num(r.emotional_hook_strength),
    previousScore: num(r.previous_score),
    newScore: num(r.new_score),
    improvement: num(r.improvement),
    similar: strArr(r.similar_stories),
    screenTime: recordNum(r.screen_time),
    dialogueShare: recordNum(r.dialogue_share),
    emotionalTimeline: emotionalTimelineFromApi(r.emotional_timeline),
    emotionDistribution: emotionDistributionFromApi(r.emotion_distribution),
    emotionalArcs,
    actLabels,
    dialogueQuality: num(r.dialogue_quality),
    readability: typeof r.readability === "number" ? r.readability : undefined,
    insights: insightsFromApi(r.insights),
    bestScene: typeof r.best_scene === "string" && r.best_scene.trim() ? r.best_scene : "—",
  };
}

async function postFile(file: File): Promise<AnalyseScriptReport> {
  const base = getAnalyseApiBaseUrl().replace(/\/$/, "");
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch(`${base}/api/v1/scripts/analyse`, { method: "POST", body: form });

  const payload = (await res.json().catch(() => ({}))) as { detail?: string | { msg?: string }[] };

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    if (typeof payload.detail === "string") message = payload.detail;
    else if (Array.isArray(payload.detail))
      message = payload.detail.map((d) => d.msg ?? "").filter(Boolean).join("; ");
    throw new Error(message || `Analysis failed (${res.status})`);
  }

  return mapApiResponseToReport(payload as AnalyseApiRaw, file.name);
}

/** POST multipart file to analysis endpoint. Returns mapped report. */
export async function analyseScriptFile(file: File): Promise<AnalyseScriptReport> {
  return postFile(file);
}

/** Wrap plain text in a .txt File and analyse it. */
export async function analyseScriptText(
  text: string,
  title = "pasted-script"
): Promise<AnalyseScriptReport> {
  const blob = new Blob([text], { type: "text/plain" });
  const file = new File([blob], `${title}.txt`, { type: "text/plain" });
  return postFile(file);
}
