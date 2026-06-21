"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/ui/CreditBadge";
import { Input } from "@/components/ui/input";
import { SaveButton } from "@/components/ui/SaveButton";
import { useFeatureDraft } from "@/lib/draft/useFeatureDraft";
import type { FullScript, StoryOutline } from "@/lib/gemini-api";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock,
    Copy,
    Download,
    FileText,
    Film,
    Layers,
    MapPin,
    PenTool,
    RefreshCw,
    Search,
    Smile,
    Sparkles,
    Target,
    Users,
    Wand2,
    X, Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────

const GENRES = [
  { label: "Romantic Drama",   emoji: "💕" },
  { label: "Action Thriller",  emoji: "🔫" },
  { label: "Comedy",           emoji: "😄" },
  { label: "Period Drama",     emoji: "🏰" },
  { label: "Crime",            emoji: "🕵️" },
  { label: "Horror",           emoji: "👻" },
  { label: "Sci-Fi",           emoji: "🚀" },
  { label: "Social Drama",     emoji: "✊" },
  { label: "Family",           emoji: "👨‍👩‍👧" },
  { label: "Heist",            emoji: "💎" },
  { label: "Biographical",     emoji: "📖" },
  { label: "Supernatural",     emoji: "🌑" },
];

// Fixed, controlled selections — multi-select chips (see toggle helper below).
const THEME_OPTIONS = [
  "Love", "Family", "Friendship", "Identity", "Redemption", "Hope", "Sacrifice",
  "Revenge", "Justice", "Survival", "Freedom", "Ambition", "Individual vs Society",
  "Meaning of Success", "Destiny vs Choice",
];

const TONES = [
  "Dramatic", "Emotional", "Intense", "Bittersweet", "Realistic", "Philosophical",
  "Inspiring", "Hopeful", "Dark", "Suspenseful", "Romantic", "Light-Hearted",
  "Comedic", "Epic", "Satirical",
];

const AUDIENCE_OPTIONS = [
  "Kids", "Teens", "Young Adults", "Adults", "Family Audience", "Mass Audience",
  "Urban Audience", "Rural Audience", "OTT Audience", "Festival Audience", "Global Audience",
];

// One-click storytelling presets → auto-populate themes, tones & audience.
interface StoryPreset {
  name: string;
  themes: string[];
  tones: string[];
  audience: string[];
}
const STORY_PRESETS: StoryPreset[] = [
  { name: "Commercial Bollywood", themes: ["Love", "Family", "Redemption"],                     tones: ["Dramatic", "Emotional", "Romantic"],   audience: ["Mass Audience", "Family Audience"] },
  { name: "Dark Thriller",        themes: ["Revenge", "Justice", "Survival"],                    tones: ["Dark", "Suspenseful", "Intense"],      audience: ["Adults", "OTT Audience"] },
  { name: "Festival Film",        themes: ["Identity", "Meaning of Success", "Destiny vs Choice"], tones: ["Philosophical", "Realistic", "Bittersweet"], audience: ["Festival Audience", "Global Audience"] },
  { name: "Inspirational Drama",  themes: ["Hope", "Freedom", "Ambition"],                       tones: ["Inspiring", "Hopeful", "Emotional"],   audience: ["Young Adults", "Adults"] },
  { name: "Epic Adventure",       themes: ["Survival", "Destiny vs Choice", "Freedom"],          tones: ["Epic", "Dramatic", "Hopeful"],         audience: ["Teens", "Young Adults", "Global Audience"] },
];

const MOODS = [
  "Emotional", "Intense", "Hopeful", "Reflective", "Conflicted", "Determined",
  "Angry", "Tense", "Romantic", "Bittersweet", "Nostalgic", "Frustrated",
  "Dramatic", "Philosophical",
];

const SETTINGS = [
  { label: "Mumbai",         emoji: "🌆" },
  { label: "Delhi",          emoji: "🏛️" },
  { label: "Rajasthan",      emoji: "🐪" },
  { label: "Village India",  emoji: "🌾" },
  { label: "Abroad",         emoji: "✈️" },
  { label: "Flashback India", emoji: "⏮️" },
  { label: "Near Future",    emoji: "🌐" },
  { label: "Multiple Locations", emoji: "🗺️" },
];

const RUNTIMES  = [
  { id: "short",    label: "Short Film", desc: "< 40 min"    },
  { id: "feature",  label: "Feature",    desc: "90–120 min"  },
  { id: "series",   label: "Mini-Series",desc: "6–8 episodes"},
];

type RuntimeType = "short" | "feature" | "series";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Toggle a value in/out of a string-array selection (multi-select). */
function toggleSelection(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function SectionBox({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        {icon}
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Reusable searchable multi-select chip group ────────────────────────────────

interface ChipMultiSelectProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  activeClass: string;
  hoverClass: string;
}

function ChipMultiSelect({
  icon, title, hint, options, selected, onChange, activeClass, hoverClass,
}: ChipMultiSelectProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  const toggle = (v: string) => onChange(toggleSelection(selected, v));

  return (
    <SectionBox icon={icon} title={title}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-text-muted">Select one or more — optional</p>
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])}
              className="text-[11px] text-text-muted hover:text-text-primary transition-colors">
              Clear ({selected.length})
            </button>
          )}
        </div>

        <Input
          variant="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={hint}
          leftIcon={<Search className="w-4 h-4" />}
        />

        <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1 scroll-smooth">
          {filtered.length === 0 ? (
            <p className="text-xs text-text-muted py-1.5">No matches for &ldquo;{query}&rdquo;.</p>
          ) : (
            filtered.map((o) => {
              const active = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(o)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    active ? activeClass : `bg-surface-2 border-border text-text-muted ${hoverClass} hover:text-text-secondary`
                  )}
                >
                  {o}
                  {active && <X className="w-3 h-3" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </SectionBox>
  );
}

// ── Character card in output ───────────────────────────────────────────────────

const CHAR_COLORS = ["text-accent", "text-pink-400", "text-emerald-400", "text-amber-400", "text-cyan-400"];
const CHAR_BG     = ["bg-accent/10 border-accent/20", "bg-pink-500/10 border-pink-500/20", "bg-emerald-500/10 border-emerald-500/20", "bg-amber-500/10 border-amber-500/20", "bg-cyan-500/10 border-cyan-500/20"];

// ── Scene Block (used in full-script modal) ───────────────────────────────────

function SceneBlock({ scene, index }: { scene: import("@/lib/gemini-api").ScriptScene; index: number }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Heading */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-2 hover:bg-surface-2/80 transition-all text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold text-text-muted w-5 text-right flex-shrink-0">{index + 1}</span>
          <span className="text-xs font-black text-text-primary tracking-widest uppercase">{scene.heading}</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 space-y-4">
              {/* Action */}
              {scene.action && (
                <p className="text-xs text-text-muted leading-relaxed italic">{scene.action}</p>
              )}
              {/* Exchanges */}
              {scene.exchanges.map((ex, ei) => (
                <div key={ei} className="space-y-0.5">
                  <p className="text-center text-xs font-black text-text-primary tracking-widest">{ex.character}</p>
                  {ex.direction && (
                    <p className="text-center text-[11px] text-text-muted italic">({ex.direction})</p>
                  )}
                  <p className="text-center text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">{ex.dialogue}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateStoryPage() {
  const [title,     setTitle]     = useState("");
  const [premise,   setPremise]   = useState("");
  const [genre,          setGenre]          = useState("Romantic Drama");
  const [themes,         setThemes]         = useState<string[]>([]);
  const [tones,          setTones]          = useState<string[]>([]);
  const [moods,          setMoods]          = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [setting,        setSetting]        = useState("Mumbai");
  const [runtime,        setRuntime]        = useState<RuntimeType>("feature");

  const [isGenerating,  setIsGenerating]  = useState(false);
  const [storyOutline,  setStoryOutline]  = useState<StoryOutline | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [copied,        setCopied]        = useState(false);

  // Full script expansion
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [isExpanding,   setIsExpanding]   = useState(false);
  const [fullScript,    setFullScript]    = useState<FullScript | null>(null);
  const [expandError,   setExpandError]   = useState<string | null>(null);
  const [scriptModal,   setScriptModal]   = useState(false);

  // ── Draft persistence ────────────────────────────────────────────────────
  const draftSnapshot = {
    title, premise, genre, themes, tones, moods, targetAudience, setting, runtime,
    storyOutline, fullScript,
  };
  const {
    loadedDraft, isHydrated, status: saveStatus, isDirty, lastSavedAt, save,
  } = useFeatureDraft("create-story", draftSnapshot);

  useEffect(() => {
    if (!loadedDraft) return;
    if (typeof loadedDraft.title    === "string") setTitle(loadedDraft.title);
    if (typeof loadedDraft.premise  === "string") setPremise(loadedDraft.premise);
    if (typeof loadedDraft.genre    === "string") setGenre(loadedDraft.genre);
    if (Array.isArray(loadedDraft.themes)) {
      setThemes(loadedDraft.themes.filter((t): t is string => typeof t === "string"));
    } else {
      // Migrate legacy single-theme drafts saved before multi-select.
      const legacyTheme = (loadedDraft as { theme?: unknown }).theme;
      if (typeof legacyTheme === "string" && legacyTheme) setThemes([legacyTheme]);
    }
    if (Array.isArray(loadedDraft.tones)) {
      setTones(loadedDraft.tones.filter((t): t is string => typeof t === "string"));
    } else {
      // Migrate legacy single-tone drafts saved before multi-select.
      const legacyTone = (loadedDraft as { tone?: unknown }).tone;
      if (typeof legacyTone === "string" && legacyTone) setTones([legacyTone]);
    }
    if (Array.isArray(loadedDraft.moods)) {
      setMoods(loadedDraft.moods.filter((m): m is string => typeof m === "string"));
    }
    if (Array.isArray(loadedDraft.targetAudience)) {
      setTargetAudience(loadedDraft.targetAudience.filter((a): a is string => typeof a === "string"));
    } else {
      // Migrate legacy single-audience drafts saved before multi-select.
      const legacyAudience = (loadedDraft as { audience?: unknown }).audience;
      if (typeof legacyAudience === "string" && legacyAudience) setTargetAudience([legacyAudience]);
    }
    if (typeof loadedDraft.setting  === "string") setSetting(loadedDraft.setting);
    if (loadedDraft.runtime === "short" || loadedDraft.runtime === "feature" || loadedDraft.runtime === "series")
      setRuntime(loadedDraft.runtime);
    if (loadedDraft.storyOutline)   setStoryOutline(loadedDraft.storyOutline);
    if (loadedDraft.fullScript)     setFullScript(loadedDraft.fullScript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedDraft]);

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    setStoryOutline(null);
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, premise, genre, themes, tones, moods, targetAudience, setting }),
      });
      const data = await res.json() as StoryOutline & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setStoryOutline(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyOutline = async () => {
    if (!storyOutline) return;
    const lines = [
      `TITLE: ${storyOutline.title}`,
      `LOGLINE: ${storyOutline.logline}`,
      "",
      ...storyOutline.acts.flatMap((act) => [
        `\n${act.label.toUpperCase()}`,
        ...act.scenes.map((s, i) => `  ${i + 1}. ${s}`),
      ]),
      "",
      "CHARACTERS:",
      ...storyOutline.characters.map((c) => `  ${c.name} (${c.role}): ${c.arc}`),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportOutline = () => {
    if (!storyOutline) return;
    const lines = [
      `TITLE: ${storyOutline.title}`,
      `GENRE: ${genre}  |  THEMES: ${themes.join(", ") || "—"}  |  TONE: ${tones.join(", ") || "—"}  |  MOOD: ${moods.join(", ") || "—"}  |  AUDIENCE: ${targetAudience.join(", ") || "—"}  |  SETTING: ${setting}`,
      `LOGLINE: ${storyOutline.logline}`,
      "\n" + "─".repeat(60),
      ...storyOutline.acts.flatMap((act) => [
        `\n${act.label.toUpperCase()}`,
        ...act.scenes.map((s, i) => `  ${i + 1}. ${s}`),
      ]),
      "\n" + "─".repeat(60),
      "\nCHARACTERS:",
      ...storyOutline.characters.map((c) => `  ${c.name} (${c.role})\n    Arc: ${c.arc}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${(storyOutline.title || "story").replace(/\s+/g, "_")}_outline.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const expandToScript = async () => {
    if (!storyOutline) return;
    setShowConfirm(false);
    setIsExpanding(true);
    setExpandError(null);
    setFullScript(null);
    try {
      const res = await fetch("/api/story/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outline: storyOutline, genre, themes, tones, moods, targetAudience, setting, language: "Hinglish" }),
      });
      const data = await res.json() as FullScript & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setFullScript(data);
      setScriptModal(true);
    } catch (err) {
      setExpandError(err instanceof Error ? err.message : "Expansion failed. Please try again.");
    } finally {
      setIsExpanding(false);
    }
  };

  const exportFullScript = () => {
    if (!fullScript) return;
    const lines: string[] = [
      fullScript.title.toUpperCase(),
      "",
      `Genre: ${fullScript.genre}`,
      `Logline: ${fullScript.logline}`,
      "",
      "─".repeat(60),
      "",
    ];
    for (const scene of fullScript.scenes) {
      lines.push(scene.heading.toUpperCase());
      lines.push("");
      if (scene.action) { lines.push(scene.action); lines.push(""); }
      for (const ex of scene.exchanges) {
        lines.push(`                    ${ex.character}`);
        if (ex.direction) lines.push(`               (${ex.direction})`);
        lines.push(`          ${ex.dialogue}`);
        lines.push("");
      }
      lines.push("─".repeat(40));
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${fullScript.title.replace(/\s+/g, "_")}_SCRIPT.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Storytelling preset helpers ────────────────────────────────────────────
  const sameSet = (a: string[], b: string[]) =>
    a.length === b.length && a.every((x) => b.includes(x));

  const applyPreset = (preset: StoryPreset) => {
    setThemes(preset.themes);
    setTones(preset.tones);
    setTargetAudience(preset.audience);
  };

  const isPresetActive = (preset: StoryPreset) =>
    sameSet(preset.themes, themes) &&
    sameSet(preset.tones, tones) &&
    sameSet(preset.audience, targetAudience);

  return (
    <div>
      {/* ── Confirm modal ── */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl p-6 z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gold" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary">Expand to Full Script</h3>
                </div>
                <button onClick={() => setShowConfirm(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                This will generate a complete screenplay with scene headings, action lines, and full dialogue for all three acts.
              </p>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-amber-400">6 credits will be deducted</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button className="flex-1" onClick={expandToScript} leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                  Confirm & Generate
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Full Script Modal ── */}
      <AnimatePresence>
        {scriptModal && fullScript && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setScriptModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative w-full max-w-3xl rounded-2xl border border-border bg-surface shadow-2xl z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <div>
                  <h2 className="text-lg font-black text-text-primary">{fullScript.title}</h2>
                  <p className="text-xs text-text-muted italic mt-0.5">&ldquo;{fullScript.logline}&rdquo;</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={exportFullScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 transition-all">
                    <Download className="w-3.5 h-3.5" /> Export .txt
                  </button>
                  <button onClick={() => setScriptModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Script content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm">
                {fullScript.scenes.map((scene, si) => (
                  <SceneBlock key={si} scene={scene} index={si} />
                ))}
              </div>

              <div className="px-6 py-3 border-t border-border flex items-center justify-between flex-shrink-0">
                <p className="text-xs text-text-muted">{fullScript.scenes.length} scenes · {fullScript.genre}</p>
                <Button size="sm" onClick={exportFullScript} leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download Script
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-text-primary">Create Story</h1>
            <CreditBadge cost={2} label="credits per story" />
          </div>
          <SaveButton
            status={saveStatus}
            isDirty={isDirty && isHydrated}
            lastSavedAt={lastSavedAt}
            onClick={save}
          />
        </div>
        <p className="text-text-muted text-sm">Transform your idea into a complete, structured screenplay outline with AI.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Core Idea */}
          <SectionBox icon={<BookOpen className="w-4 h-4 text-gold" />} title="Story Idea">
            <div className="space-y-4">
              <Input
                label="Story Title"
                placeholder="e.g. Ek Raat Mumbai Mein"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                leftIcon={<Film className="w-4 h-4" />}
              />
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Story Premise</label>
                  <span className="text-[10px] text-text-muted">{premise.length}/400</span>
                </div>
                <textarea
                  value={premise}
                  onChange={(e) => { if (e.target.value.length <= 400) setPremise(e.target.value); }}
                  rows={4}
                  placeholder="Describe your core story idea in 2–3 sentences. What's the central conflict? Who is the protagonist? What's at stake?"
                  className="w-full rounded-xl px-4 py-3 bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
            </div>
          </SectionBox>

          {/* Genre */}
          <SectionBox icon={<Film className="w-4 h-4 text-gold" />} title="Genre">
            <div className="flex flex-wrap gap-2">
              {GENRES.map(({ label, emoji }) => (
                <button key={label} type="button" onClick={() => setGenre(label)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    genre === label
                      ? "bg-gold/20 border border-gold/40 text-gold"
                      : "bg-surface-2 border border-border text-text-muted hover:border-gold/20 hover:text-text-secondary"
                  )}
                >
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </SectionBox>

          {/* Quick storytelling presets — auto-populate themes, tones & audience */}
          <SectionBox icon={<Wand2 className="w-4 h-4 text-gold" />} title="Quick Presets">
            <div className="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible -mx-1 px-1 pb-1 scroll-smooth">
              {STORY_PRESETS.map((preset) => {
                const active = isPresetActive(preset);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    title={`Themes: ${preset.themes.join(", ")}\nTones: ${preset.tones.join(", ")}\nAudience: ${preset.audience.join(", ")}`}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all flex-shrink-0",
                      active
                        ? "bg-gold/20 border-gold/40 text-gold"
                        : "bg-surface-2 border-border text-text-muted hover:border-gold/30 hover:text-text-secondary"
                    )}
                  >
                    <Sparkles className="w-3 h-3" /> {preset.name}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-text-muted mt-3">
              Tap a preset to auto-fill Themes, Tones &amp; Target Audience — then fine-tune below.
            </p>
          </SectionBox>

          {/* Themes (multi-select, searchable) */}
          <ChipMultiSelect
            icon={<Target className="w-4 h-4 text-emerald-400" />}
            title="Themes"
            hint="Search themes…"
            options={THEME_OPTIONS}
            selected={themes}
            onChange={setThemes}
            activeClass="bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
            hoverClass="hover:border-emerald-500/20"
          />

          {/* Tone (multi-select, searchable) */}
          <ChipMultiSelect
            icon={<Layers className="w-4 h-4 text-accent" />}
            title="Tone"
            hint="Search tones…"
            options={TONES}
            selected={tones}
            onChange={setTones}
            activeClass="bg-accent/20 border-accent/40 text-accent"
            hoverClass="hover:border-accent/20"
          />

          {/* Mood (multi-select) */}
          <SectionBox icon={<Smile className="w-4 h-4 text-violet-400" />} title="Mood">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] text-text-muted">Select one or more — optional</p>
              {moods.length > 0 && (
                <button type="button" onClick={() => setMoods([])}
                  className="text-[11px] text-text-muted hover:text-text-primary transition-colors">
                  Clear ({moods.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((label) => {
                const active = moods.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setMoods((prev) => toggleSelection(prev, label))}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      active
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                        : "bg-surface-2 border-border text-text-muted hover:border-violet-500/20 hover:text-text-secondary"
                    )}
                  >
                    {active && <CheckCircle2 className="w-3 h-3" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </SectionBox>

          {/* Setting */}
          <SectionBox icon={<MapPin className="w-4 h-4 text-secondary" />} title="Setting">
            <div className="flex flex-wrap gap-2">
              {SETTINGS.map(({ label, emoji }) => (
                <button key={label} type="button" onClick={() => setSetting(label)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    setting === label
                      ? "bg-secondary/20 border-secondary/40 text-secondary"
                      : "bg-surface-2 border-border text-text-muted hover:border-secondary/20 hover:text-text-secondary"
                  )}
                >
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </SectionBox>

          {/* Target Audience (multi-select, searchable) */}
          <ChipMultiSelect
            icon={<Users className="w-4 h-4 text-pink-400" />}
            title="Target Audience"
            hint="Search audiences…"
            options={AUDIENCE_OPTIONS}
            selected={targetAudience}
            onChange={setTargetAudience}
            activeClass="bg-pink-500/20 border-pink-500/40 text-pink-400"
            hoverClass="hover:border-pink-500/20"
          />

          {/* Runtime / Format */}
          <SectionBox icon={<Clock className="w-4 h-4 text-pink-400" />} title="Runtime / Format">
            <div className="grid grid-cols-3 gap-2">
              {RUNTIMES.map((r) => (
                <button key={r.id} type="button" onClick={() => setRuntime(r.id as RuntimeType)}
                  className={cn(
                    "flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs font-medium transition-all",
                    runtime === r.id
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-border bg-surface-2 text-text-muted hover:border-accent/20"
                  )}
                >
                  <span className="font-bold">{r.label}</span>
                  <span className="text-[10px] opacity-60 mt-0.5">{r.desc}</span>
                </button>
              ))}
            </div>
          </SectionBox>

          <Button
            onClick={generate}
            loading={isGenerating}
            size="lg"
            className="w-full"
            leftIcon={<Wand2 className="w-4 h-4" />}
          >
            {isGenerating ? "Crafting Your Story…" : "Generate Story Outline"}
          </Button>
        </motion.div>

        {/* ── Right Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3"
        >
          <div className="rounded-2xl border border-border bg-surface overflow-hidden h-full min-h-[620px] flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-gold" />
                <h3 className="text-sm font-bold text-text-primary">Story Outline</h3>
                {storyOutline && (
                  <Badge variant="success" className="ml-1">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Generated
                  </Badge>
                )}
              </div>
              {storyOutline && (
                <div className="flex items-center gap-1.5">
                  <button onClick={copyOutline}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-2 border border-border text-text-muted hover:text-text-primary hover:border-accent/30 transition-all">
                    {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={exportOutline}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-2 border border-border text-text-muted hover:text-text-primary hover:border-accent/30 transition-all">
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">

                {error ? (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full text-center gap-4 py-20">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-1">Generation Failed</p>
                      <p className="text-sm text-text-muted max-w-xs leading-relaxed">{error}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={generate} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Try Again</Button>
                  </motion.div>

                ) : !storyOutline ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full text-center gap-6 py-20">
                    <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <PenTool className="w-8 h-8 text-gold/50" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-text-primary mb-1">Your story outline will appear here</p>
                      <p className="text-sm text-text-muted max-w-xs leading-relaxed">
                        Fill in your idea, pick a genre and tone, then hit{" "}
                        <span className="text-gold font-medium">Generate Story Outline</span>
                      </p>
                    </div>
                    {/* "What you'll get" chips */}
                    <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                      {["Story Title & Logline", "3-Act Structure", "Scene Breakdowns", "Character Arcs", "Export to .txt"].map((item) => (
                        <span key={item} className="text-xs px-3 py-1.5 rounded-full bg-surface-2 border border-border text-text-muted">
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                    {/* Current selection preview */}
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="warning">{genre}</Badge>
                      {themes.map((t) => <Badge key={`theme-${t}`} variant="success">{t}</Badge>)}
                      {tones.map((t) => <Badge key={`tone-${t}`} variant="default">{t}</Badge>)}
                      {moods.map((m) => <Badge key={`mood-${m}`} variant="secondary">{m}</Badge>)}
                      {targetAudience.map((a) => <Badge key={`aud-${a}`} variant="outline">{a}</Badge>)}
                      <Badge variant="outline">{setting}</Badge>
                    </div>
                  </motion.div>

                ) : (
                  <motion.div key="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-7">

                    {/* Title & meta */}
                    <div className="pb-5 border-b border-border">
                      <div className="flex flex-wrap items-start gap-3 mb-3">
                        <h2 className="text-2xl font-black text-text-primary leading-tight">{storyOutline.title}</h2>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Badge variant="warning">{genre}</Badge>
                          {themes.map((t) => <Badge key={`theme-${t}`} variant="success">{t}</Badge>)}
                          {tones.map((t) => <Badge key={`tone-${t}`} variant="default">{t}</Badge>)}
                          {moods.map((m) => <Badge key={`mood-${m}`} variant="secondary">{m}</Badge>)}
                          {targetAudience.map((a) => <Badge key={`aud-${a}`} variant="outline">{a}</Badge>)}
                          <Badge variant="outline">{setting}</Badge>
                        </div>
                      </div>
                      <blockquote className="border-l-2 border-gold pl-4 text-sm text-text-secondary italic leading-relaxed">
                        &ldquo;{storyOutline.logline}&rdquo;
                      </blockquote>
                    </div>

                    {/* Acts */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" /> Three-Act Structure
                      </h3>
                      {storyOutline.acts.map((act, i) => {
                        const accentColors = ["text-gold", "text-accent", "text-secondary"];
                        const bgColors     = ["bg-gold/10 border-gold/20", "bg-accent/10 border-accent/20", "bg-secondary/10 border-secondary/20"];
                        return (
                          <motion.div key={act.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.12 + 0.1 }}
                          >
                            <div className="flex items-center gap-2.5 mb-3">
                              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border", bgColors[i])}>
                                <span className={accentColors[i]}>{i + 1}</span>
                              </div>
                              <h4 className={cn("text-sm font-bold", accentColors[i])}>{act.label}</h4>
                            </div>
                            <div className="space-y-2 pl-9">
                              {act.scenes.map((scene, j) => (
                                <div key={j} className="flex items-start gap-2.5">
                                  <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                                  <p className="text-sm text-text-secondary leading-relaxed">{scene}</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Characters */}
                    <div>
                      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2 mb-3">
                        <Users className="w-3.5 h-3.5" /> Key Characters
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {storyOutline.characters.map((char, i) => (
                          <motion.div key={char.name}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 + 0.3 }}
                            className={cn("p-4 rounded-xl border", CHAR_BG[i % CHAR_BG.length])}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn("w-7 h-7 rounded-full bg-surface flex items-center justify-center text-[11px] font-black", CHAR_COLORS[i % CHAR_COLORS.length])}>
                                {char.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-text-primary">{char.name}</p>
                                <p className={cn("text-[10px] font-medium", CHAR_COLORS[i % CHAR_COLORS.length])}>{char.role}</p>
                              </div>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">{char.arc}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Expand error */}
                    {expandError && (
                      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400 leading-relaxed">{expandError}</p>
                      </div>
                    )}

                    {/* Expanding progress */}
                    {isExpanding && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gold/10 border border-gold/20">
                        <RefreshCw className="w-4 h-4 text-gold animate-spin flex-shrink-0" />
                        <p className="text-xs text-gold font-medium">Writing your complete screenplay… this may take a moment.</p>
                      </div>
                    )}

                    {/* Previously generated script shortcut */}
                    {fullScript && !scriptModal && (
                      <button onClick={() => setScriptModal(true)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gold/10 border border-gold/20 hover:bg-gold/15 transition-all">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gold" />
                          <span className="text-sm font-semibold text-gold">Full script ready — view screenplay</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gold" />
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 border-t border-border">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={generate} loading={isGenerating}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                        Regenerate
                      </Button>
                      <Button size="sm" className="flex-1" onClick={exportOutline}
                        leftIcon={<Download className="w-3.5 h-3.5" />}>
                        Export Outline
                      </Button>
                      <Button
                        size="sm" className="flex-1 relative"
                        loading={isExpanding}
                        onClick={() => setShowConfirm(true)}
                        leftIcon={!isExpanding ? <Sparkles className="w-3.5 h-3.5" /> : undefined}
                      >
                        <span>{isExpanding ? "Writing…" : "Expand to Script"}</span>
                        {!isExpanding && (
                          <span className="ml-1.5 text-[10px] opacity-70 font-normal">(6cr)</span>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
