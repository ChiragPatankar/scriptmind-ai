/**
 * Scene-by-scene analysis report types.
 */

export interface SceneRow {
  scene_number: number;
  heading: string;
  characters: string[];
  length_chars: number;
  length_lines: number;
  estimated_pages: number;
  dialogue_pct: number;
  character_count: number;
  location: string;
  emotion_score: number;
  pacing_score: number;
  conflict_score: number;
  dialogue_quality: number;
  composite_score: number;
  rewrite_suggestions: string[];
}

export interface SceneHighlight {
  scene_number: number;
  heading: string;
  composite_score: number;
  summary: string;
}

export interface MergedSegment {
  scene_numbers: number[];
  label: string;
  merged: boolean;
}

export interface SceneAnalysisReport {
  script_title: string;
  scene_count: number;
  batch_count: number;
  merged_segments: MergedSegment[];
  scenes: SceneRow[];
  emotional_curve: { scene: number; emotion: number }[];
  pacing_consistency: number;
  strongest_scenes: SceneHighlight[];
  weakest_scenes: SceneHighlight[];
  location_count: number;
  locations: string[];
}

export type SceneJobStatus =
  | "queued"
  | "parsing"
  | "batching"
  | "analyzing"
  | "aggregating"
  | "completed"
  | "failed";

export interface SceneAnalysisJob {
  id: string;
  status: SceneJobStatus;
  progress_pct: number;
  phase_message: string | null;
  error: string | null;
  result: SceneAnalysisReport | null;
  input_meta?: Record<string, unknown>;
}
