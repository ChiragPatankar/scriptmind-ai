/**
 * Originality Intelligence API client.
 *
 * Routes through the Next.js /api/originality/analyze endpoint so auth and
 * credits are enforced server-side, then maps the raw JSON to the dashboard model.
 *
 * This is an originality / narrative-similarity analysis — NOT plagiarism detection.
 */

export type TropeSeverity = "low" | "medium" | "high";

export interface TropeItem {
  name: string;
  severity: TropeSeverity;
  note: string;
}

export interface PatternItem {
  pattern: string;
  detail: string;
}

export interface OriginalityReport {
  scriptTitle: string;
  originalityScore: number;
  tropeScore: number;
  dialogueUniqueness: number;
  predictabilityScore: number;
  strengths: string[];
  risks: string[];
  repetitivePatterns: PatternItem[];
  commonTropes: TropeItem[];
  recommendations: string[];
  standoutElements: string[];
}

type RawReport = Record<string, unknown>;

function clampScore(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (Number.isNaN(n)) return 0;
  return Math.round(Math.max(0, Math.min(100, n)));
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

function patternArr(v: unknown): PatternItem[] {
  if (!Array.isArray(v)) return [];
  const out: PatternItem[] = [];
  for (const item of v) {
    if (typeof item === "string") {
      if (item.trim()) out.push({ pattern: item.trim(), detail: "" });
    } else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const pattern = String(o.pattern ?? o.name ?? "").trim();
      if (pattern) out.push({ pattern, detail: String(o.detail ?? o.note ?? "").trim() });
    }
  }
  return out;
}

function tropeArr(v: unknown): TropeItem[] {
  if (!Array.isArray(v)) return [];
  const valid: TropeSeverity[] = ["low", "medium", "high"];
  const out: TropeItem[] = [];
  for (const item of v) {
    if (typeof item === "string") {
      if (item.trim()) out.push({ name: item.trim(), severity: "medium", note: "" });
    } else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const name = String(o.name ?? o.trope ?? "").trim();
      if (!name) continue;
      const sevRaw = String(o.severity ?? "medium").toLowerCase() as TropeSeverity;
      const severity = valid.includes(sevRaw) ? sevRaw : "medium";
      out.push({ name, severity, note: String(o.note ?? o.description ?? "").trim() });
    }
  }
  return out;
}

export function mapOriginalityResponse(raw: RawReport, fileName: string): OriginalityReport {
  const title = fileName.replace(/\.[^.]+$/i, "").trim() || "Uploaded script";
  return {
    scriptTitle: title,
    originalityScore: clampScore(raw.originality_score),
    tropeScore: clampScore(raw.trope_score),
    dialogueUniqueness: clampScore(raw.dialogue_uniqueness),
    predictabilityScore: clampScore(raw.predictability_score),
    strengths: strArr(raw.strengths),
    risks: strArr(raw.risks),
    repetitivePatterns: patternArr(raw.repetitive_patterns),
    commonTropes: tropeArr(raw.common_tropes),
    recommendations: strArr(raw.originality_recommendations),
    standoutElements: strArr(raw.standout_elements),
  };
}

async function postFile(file: File): Promise<OriginalityReport> {
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch("/api/originality/analyze", { method: "POST", body: form });
  const payload = (await res.json().catch(() => ({}))) as {
    detail?: string | { msg?: string }[];
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    let message = payload.message ?? payload.error ?? res.statusText ?? "Request failed";
    if (typeof payload.detail === "string") message = payload.detail;
    else if (Array.isArray(payload.detail))
      message = payload.detail.map((d) => d.msg ?? "").filter(Boolean).join("; ") || message;
    throw new Error(message || `Originality analysis failed (${res.status})`);
  }

  return mapOriginalityResponse(payload as RawReport, file.name);
}

/** Analyse an uploaded screenplay file for originality. */
export function analyzeOriginalityFile(file: File): Promise<OriginalityReport> {
  return postFile(file);
}

/** Wrap pasted text in a .txt File and analyse it. */
export function analyzeOriginalityText(
  text: string,
  title = "pasted-script"
): Promise<OriginalityReport> {
  const file = textToFile(text, title);
  return postFile(file);
}

/** Wrap pasted screenplay text in a .txt File (so enhancements can re-send it). */
export function textToFile(text: string, title = "pasted-script"): File {
  const blob = new Blob([text], { type: "text/plain" });
  return new File([blob], `${title}.txt`, { type: "text/plain" });
}

// ── Enhancement Actions ───────────────────────────────────────────────────────

export type EnhancementAction =
  | "improve_dialogue"
  | "emotional_depth"
  | "character_voices"
  | "reduce_predictability"
  | "narrative_flow";

export interface EnhancementActionMeta {
  action: EnhancementAction;
  label: string;
  description: string;
}

/** UI metadata for the five enhancement actions (order = display order). */
export const ENHANCEMENT_ACTIONS: EnhancementActionMeta[] = [
  {
    action: "improve_dialogue",
    label: "Improve Dialogue Authenticity",
    description: "Make lines sound natural, layered with subtext, and true to real speech.",
  },
  {
    action: "emotional_depth",
    label: "Increase Emotional Depth",
    description: "Raise emotional stakes and add meaningful beats the audience connects with.",
  },
  {
    action: "character_voices",
    label: "Strengthen Character Voices",
    description: "Give each character a distinct, consistent voice so none sound alike.",
  },
  {
    action: "reduce_predictability",
    label: "Reduce Predictability",
    description: "Subvert obvious beats and replace clichés with fresher, original turns.",
  },
  {
    action: "narrative_flow",
    label: "Improve Narrative Flow",
    description: "Smooth transitions, tighten pacing, and sharpen cause-and-effect.",
  },
];

export interface EnhancementResult {
  action: EnhancementAction;
  actionLabel: string;
  enhancedScript: string;
  changes: string[];
  focusNotes: string[];
}

function mapEnhancementResponse(raw: RawReport): EnhancementResult {
  return {
    action: String(raw.action ?? "") as EnhancementAction,
    actionLabel: String(raw.action_label ?? "").trim(),
    enhancedScript: String(raw.enhanced_script ?? "").trim(),
    changes: strArr(raw.changes),
    focusNotes: strArr(raw.focus_notes),
  };
}

/**
 * Apply a single enhancement action to the source script.
 * Routes through /api/originality/enhance so auth + enhancement credits are
 * enforced server-side.
 */
export async function enhanceOriginalityScript(
  action: EnhancementAction,
  file: File
): Promise<EnhancementResult> {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("action", action);

  const res = await fetch("/api/originality/enhance", { method: "POST", body: form });
  const payload = (await res.json().catch(() => ({}))) as {
    detail?: string | { msg?: string }[];
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    let message = payload.message ?? payload.error ?? res.statusText ?? "Request failed";
    if (typeof payload.detail === "string") message = payload.detail;
    else if (Array.isArray(payload.detail))
      message = payload.detail.map((d) => d.msg ?? "").filter(Boolean).join("; ") || message;
    throw new Error(message || `Enhancement failed (${res.status})`);
  }

  return mapEnhancementResponse(payload as RawReport);
}
