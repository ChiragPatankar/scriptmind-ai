/**
 * Single source of truth for the 27-emotion spectrum (Cowen & Keltner taxonomy).
 * Shared by the script-level emotion distribution and per-scene spectrum charts.
 */

export interface EmotionMeta {
  label: string;
  color: string;
}

/** Ordered map of emotion key → display label + chart color. */
export const EMOTION_META: Record<string, EmotionMeta> = {
  admiration: { label: "Admiration", color: "#F59E0B" },
  adoration: { label: "Adoration", color: "#EC4899" },
  aesthetic_appreciation: { label: "Aesthetic Apprec.", color: "#8B5CF6" },
  amusement: { label: "Amusement", color: "#10B981" },
  anger: { label: "Anger", color: "#EF4444" },
  anxiety: { label: "Anxiety", color: "#F97316" },
  awe: { label: "Awe", color: "#3B82F6" },
  awkwardness: { label: "Awkwardness", color: "#6B7280" },
  boredom: { label: "Boredom", color: "#9CA3AF" },
  calmness: { label: "Calmness", color: "#06B6D4" },
  confusion: { label: "Confusion", color: "#A78BFA" },
  craving: { label: "Craving", color: "#D97706" },
  disgust: { label: "Disgust", color: "#65A30D" },
  empathic_pain: { label: "Empathic Pain", color: "#F472B6" },
  entrancement: { label: "Entrancement", color: "#6366F1" },
  envy: { label: "Envy", color: "#84CC16" },
  excitement: { label: "Excitement", color: "#FBBF24" },
  fear: { label: "Fear", color: "#DC2626" },
  horror: { label: "Horror", color: "#7F1D1D" },
  interest: { label: "Interest", color: "#60A5FA" },
  joy: { label: "Joy", color: "#FDE68A" },
  nostalgia: { label: "Nostalgia", color: "#C084FC" },
  relief: { label: "Relief", color: "#34D399" },
  romance: { label: "Romance", color: "#F9A8D4" },
  sadness: { label: "Sadness", color: "#93C5FD" },
  satisfaction: { label: "Satisfaction", color: "#86EFAC" },
  sexual_desire: { label: "Sexual Desire", color: "#FB7185" },
};

/** The 27 canonical emotion keys, in declaration order. */
export const EMOTION_KEYS = Object.keys(EMOTION_META);
