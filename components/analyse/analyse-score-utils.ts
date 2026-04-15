import { cn } from "@/lib/utils";

export type ScoreBand = "low" | "mid" | "high";

/** Red < 5, yellow 5–7, green > 7 (on 0–10 scale) */
export function scoreBand(score: number): ScoreBand {
  if (score < 5) return "low";
  if (score <= 7) return "mid";
  return "high";
}

export function bandProgressClass(band: ScoreBand): string {
  return cn(
    band === "low" && "bg-red-500",
    band === "mid" && "bg-amber-400",
    band === "high" && "bg-emerald-500"
  );
}

export function bandTextClass(band: ScoreBand): string {
  return cn(
    band === "low" && "text-red-400",
    band === "mid" && "text-amber-300",
    band === "high" && "text-emerald-400"
  );
}

export function bandGlowClass(band: ScoreBand): string {
  return cn(
    band === "low" && "shadow-[0_0_24px_rgba(239,68,68,0.25)]",
    band === "mid" && "shadow-[0_0_24px_rgba(251,191,36,0.2)]",
    band === "high" && "shadow-[0_0_24px_rgba(52,211,153,0.25)]"
  );
}

export type DialogueStrength = "Weak" | "Average" | "Strong";

export function dialogueStrength(score: number): DialogueStrength {
  if (score < 5) return "Weak";
  if (score <= 7) return "Average";
  return "Strong";
}
