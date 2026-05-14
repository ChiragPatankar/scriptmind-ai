"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/ui/CreditBadge";
import { Input } from "@/components/ui/input";
import { SaveButton } from "@/components/ui/SaveButton";
import { useFeatureDraft } from "@/lib/draft/useFeatureDraft";
import type { CharacterProfile, GeneratedDialogueLine } from "@/lib/gemini-api";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    Brain,
    CheckCircle2,
    ChevronDown, ChevronUp,
    Copy, Download,
    Film,
    Heart,
    MessageSquare,
    Mic2,
    Pencil,
    Plus,
    RefreshCw,
    Sparkles,
    User,
    Users,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const MOOD_OPTIONS = [
  { label: "Intense",       emoji: "🔥" },
  { label: "Romantic",      emoji: "💕" },
  { label: "Comedic",       emoji: "😄" },
  { label: "Emotional",     emoji: "😢" },
  { label: "Dramatic",      emoji: "🎭" },
  { label: "Philosophical", emoji: "🤔" },
  { label: "Angry",         emoji: "😤" },
  { label: "Nostalgic",     emoji: "🌅" },
  { label: "Tense",         emoji: "😰" },
  { label: "Bittersweet",   emoji: "🌧️" },
];

const LANGUAGE_OPTIONS = ["Hindi", "English", "Hinglish", "Tamil", "Telugu"] as const;
type Language = typeof LANGUAGE_OPTIONS[number];

const STYLE_OPTIONS = ["Classical", "Modern", "Street Slang", "Poetic", "Action-Packed", "Realistic", "Satirical"];

const LENGTH_OPTIONS = [
  { id: "short",  label: "Short",  desc: "4–5 lines"  },
  { id: "medium", label: "Medium", desc: "8–10 lines" },
  { id: "long",   label: "Long",   desc: "12–15 lines" },
] as const;

const PERSONALITY_TAGS = [
  "Aggressive", "Sarcastic", "Reserved", "Impulsive", "Protective",
  "Vulnerable", "Charming", "Manipulative", "Loyal", "Idealistic",
  "Cynical", "Warm", "Stubborn", "Witty", "Mysterious",
];

const ROLE_OPTIONS = ["Protagonist", "Antagonist", "Love Interest", "Mentor", "Supporting", "Comic Relief"];
const SPEECH_PATTERNS = ["Formal", "Casual", "Poetic", "Street Slang", "Broken", "Philosophical", "Blunt"];
const EMOTIONAL_STATES = [
  "Heartbroken", "Furious", "Hopeful", "Desperate", "Joyful",
  "Conflicted", "Vengeful", "Nostalgic", "Terrified", "In love",
  "Resigned", "Determined", "Betrayed", "Relieved", "Guilty",
];

// Assign a consistent colour to each character
const CHAR_COLOURS = [
  { bg: "bg-accent/15",    border: "border-accent/30",    text: "text-accent",    dot: "#6366F1" },
  { bg: "bg-pink-500/15",  border: "border-pink-500/30",  text: "text-pink-400",  dot: "#EC4899" },
  { bg: "bg-emerald-500/15",border:"border-emerald-500/30",text:"text-emerald-400",dot: "#10B981" },
  { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400", dot: "#F59E0B" },
  { bg: "bg-cyan-500/15",  border: "border-cyan-500/30",  text: "text-cyan-400",  dot: "#06B6D4" },
];

function charColor(idx: number) {
  return CHAR_COLOURS[idx % CHAR_COLOURS.length]!;
}

// ── Character Add/Edit Modal ───────────────────────────────────────────────────

interface CharacterModalProps {
  initial?: CharacterProfile;
  onSave: (p: CharacterProfile) => void;
  onClose: () => void;
}

function CharacterModal({ initial, onSave, onClose }: CharacterModalProps) {
  const [p, setP] = useState<CharacterProfile>(
    initial ?? { name: "", age: "", role: "", personality: [], emotionalState: "", speechPattern: "" }
  );

  const togglePersonality = (tag: string) =>
    setP((prev) => ({
      ...prev,
      personality: prev.personality?.includes(tag)
        ? prev.personality.filter((t) => t !== tag)
        : [...(prev.personality ?? []), tag],
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            <h2 className="text-base font-bold text-text-primary">
              {initial ? "Edit Character" : "Add Character"}
            </h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Name + Age */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Character Name *"
              value={p.name}
              placeholder="e.g. ARJUN"
              onChange={(e) => setP((prev) => ({ ...prev, name: e.target.value.toUpperCase() }))}
            />
            <Input
              label="Age"
              value={p.age ?? ""}
              placeholder="e.g. 28"
              onChange={(e) => setP((prev) => ({ ...prev, age: e.target.value }))}
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Role in Scene</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r} type="button"
                  onClick={() => setP((prev) => ({ ...prev, role: prev.role === r ? "" : r }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    p.role === r
                      ? "bg-accent text-white"
                      : "bg-surface-2 border border-border text-text-muted hover:border-accent/30"
                  )}
                >{r}</button>
              ))}
            </div>
          </div>

          {/* Emotional State */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Heart className="w-3 h-3" /> Emotional State in This Scene
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOTIONAL_STATES.map((e) => (
                <button
                  key={e} type="button"
                  onClick={() => setP((prev) => ({ ...prev, emotionalState: prev.emotionalState === e ? "" : e }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    p.emotionalState === e
                      ? "bg-pink-500/20 border border-pink-500/40 text-pink-400"
                      : "bg-surface-2 border border-border text-text-muted hover:border-pink-500/20"
                  )}
                >{e}</button>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Brain className="w-3 h-3" /> Personality Traits (pick up to 4)
            </label>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_TAGS.map((tag) => {
                const active = p.personality?.includes(tag);
                const maxed  = !active && (p.personality?.length ?? 0) >= 4;
                return (
                  <button
                    key={tag} type="button"
                    disabled={maxed}
                    onClick={() => togglePersonality(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      active
                        ? "bg-violet-500/20 border border-violet-500/40 text-violet-400"
                        : maxed
                        ? "opacity-30 bg-surface-2 border border-border text-text-muted cursor-not-allowed"
                        : "bg-surface-2 border border-border text-text-muted hover:border-violet-500/20"
                    )}
                  >{tag}</button>
                );
              })}
            </div>
          </div>

          {/* Speech Pattern */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Mic2 className="w-3 h-3" /> Speech Pattern
            </label>
            <div className="flex flex-wrap gap-2">
              {SPEECH_PATTERNS.map((s) => (
                <button
                  key={s} type="button"
                  onClick={() => setP((prev) => ({ ...prev, speechPattern: prev.speechPattern === s ? "" : s }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    p.speechPattern === s
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                      : "bg-surface-2 border border-border text-text-muted hover:border-amber-500/20"
                  )}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            disabled={!p.name.trim()}
            onClick={() => { onSave(p); onClose(); }}
          >
            {initial ? "Save Changes" : "Add Character"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Character Card ─────────────────────────────────────────────────────────────

interface CharCardProps {
  profile: CharacterProfile;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
}

function CharCard({ profile, index, onEdit, onRemove }: CharCardProps) {
  const [open, setOpen] = useState(false);
  const col = charColor(index);

  return (
    <div className={cn("rounded-xl border p-3 transition-all", col.border, col.bg)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white")}
            style={{ background: col.dot }}>
            {profile.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className={cn("text-sm font-bold truncate", col.text)}>{profile.name}</p>
            {profile.role && <p className="text-[10px] text-text-muted">{profile.role}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-all">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={() => setOpen((v) => !v)} className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-all">
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button onClick={onRemove} className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
              {profile.age && <p className="text-[11px] text-text-muted">Age: <span className="text-text-secondary">{profile.age}</span></p>}
              {profile.emotionalState && <p className="text-[11px] text-text-muted">Feeling: <span className="text-pink-400">{profile.emotionalState}</span></p>}
              {profile.speechPattern && <p className="text-[11px] text-text-muted">Speech: <span className="text-amber-400">{profile.speechPattern}</span></p>}
              {profile.personality?.length ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.personality.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400">{t}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Pill selector ──────────────────────────────────────────────────────────────

function PillGroup<T extends string>({
  options, value, onChange, accent = "accent",
}: {
  options: string[];
  value: T;
  onChange: (v: T) => void;
  accent?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o} type="button"
          onClick={() => onChange(o as T)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
            value === o
              ? accent === "secondary"
                ? "bg-secondary/20 border border-secondary/40 text-secondary"
                : "bg-accent text-white"
              : "bg-surface-2 border border-border text-text-muted hover:border-accent/30 hover:text-text-secondary"
          )}
        >{o}</button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DialoguePage() {
  const [profiles, setProfiles]     = useState<CharacterProfile[]>([
    { name: "ARJUN", role: "Protagonist",  emotionalState: "Heartbroken", speechPattern: "Casual", personality: ["Reserved", "Stubborn"] },
    { name: "MEERA", role: "Love Interest", emotionalState: "Conflicted",  speechPattern: "Poetic",  personality: ["Warm", "Idealistic"] },
  ]);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editIdx,   setEditIdx]     = useState<number | null>(null);

  const [scene,    setScene]    = useState("Two estranged lovers meet during a Mumbai monsoon night");
  const [subtext,  setSubtext]  = useState("She is leaving the country tomorrow. He doesn't know.");
  const [mood,     setMood]     = useState("Intense");
  const [language, setLanguage] = useState<Language>("Hinglish");
  const [style,    setStyle]    = useState("Modern");
  const [length,   setLength]   = useState<"short"|"medium"|"long">("medium");

  const [dialogue,   setDialogue]   = useState<GeneratedDialogueLine[]>([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);

  // ── Draft persistence ────────────────────────────────────────────────────
  const draftSnapshot = {
    profiles, scene, subtext, mood, language, style, length, dialogue,
  };
  const {
    loadedDraft, isHydrated, status: saveStatus, isDirty, lastSavedAt, save,
  } = useFeatureDraft("dialogue", draftSnapshot);

  // Rehydrate state once when a saved draft is found
  useEffect(() => {
    if (!loadedDraft) return;
    if (Array.isArray(loadedDraft.profiles))         setProfiles(loadedDraft.profiles);
    if (typeof loadedDraft.scene === "string")       setScene(loadedDraft.scene);
    if (typeof loadedDraft.subtext === "string")     setSubtext(loadedDraft.subtext);
    if (typeof loadedDraft.mood === "string")        setMood(loadedDraft.mood);
    if (typeof loadedDraft.language === "string")    setLanguage(loadedDraft.language as Language);
    if (typeof loadedDraft.style === "string")       setStyle(loadedDraft.style);
    if (loadedDraft.length === "short" || loadedDraft.length === "medium" || loadedDraft.length === "long") setLength(loadedDraft.length);
    if (Array.isArray(loadedDraft.dialogue))         setDialogue(loadedDraft.dialogue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedDraft]);

  const openAddModal  = () => { setEditIdx(null); setModalOpen(true); };
  const openEditModal = (i: number) => { setEditIdx(i); setModalOpen(true); };

  const handleSaveProfile = (p: CharacterProfile) => {
    if (editIdx !== null) {
      setProfiles((prev) => prev.map((x, i) => (i === editIdx ? p : x)));
    } else {
      setProfiles((prev) => [...prev, p]);
    }
  };

  const removeProfile = (i: number) => setProfiles((prev) => prev.filter((_, idx) => idx !== i));

  const generate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characters:        profiles.map((p) => p.name),
          characterProfiles: profiles,
          scene, mood, language, style, subtext, dialogueLength: length,
        }),
      });
      const data = await res.json() as GeneratedDialogueLine[] | { error?: string };
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
      setDialogue(data as GeneratedDialogueLine[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyDialogue = async () => {
    const text = dialogue.map((line) => {
      const parts = [`${line.character}${line.emotion ? ` (${line.emotion})` : ""}`];
      if (line.direction) parts.push(`  ${line.direction}`);
      parts.push(`  ${line.text}`);
      return parts.join("\n");
    }).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportDialogue = () => {
    const header = `SCENE: ${scene}\nMOOD: ${mood}  |  LANGUAGE: ${language}  |  STYLE: ${style}${subtext ? `\nSUBTEXT: ${subtext}` : ""}\n${"─".repeat(60)}\n\n`;
    const body = dialogue.map((line) => {
      const parts = [`${line.character}${line.emotion ? ` (${line.emotion})` : ""}`];
      if (line.direction) parts.push(`  ${line.direction}`);
      parts.push(`  ${line.text}`);
      return parts.join("\n");
    }).join("\n\n");
    const blob = new Blob([header + body], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `dialogue_${scene.slice(0, 20).replace(/\s+/g, "_")}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const hasDialogue = dialogue.length > 0;

  return (
    <div>
      <AnimatePresence>
        {modalOpen && (
          <CharacterModal
            initial={editIdx !== null ? profiles[editIdx] : undefined}
            onSave={handleSaveProfile}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-text-primary">AI Dialogue Generator</h1>
            <CreditBadge cost={1} label="credit per generation" />
          </div>
          <SaveButton
            status={saveStatus}
            isDirty={isDirty && isHydrated}
            lastSavedAt={lastSavedAt}
            onClick={save}
          />
        </div>
        <p className="text-text-muted text-sm">Write cinematic dialogues in any language with full character psychology.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left Panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >

          {/* Characters */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-text-primary">Characters</h3>
                <span className="text-xs text-text-muted">({profiles.length})</span>
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 transition-all"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="p-4 space-y-2">
              {profiles.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">No characters yet. Add at least one.</p>
              ) : (
                profiles.map((p, i) => (
                  <CharCard key={i} profile={p} index={i} onEdit={() => openEditModal(i)} onRemove={() => removeProfile(i)} />
                ))
              )}
            </div>
          </div>

          {/* Scene */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
              <Film className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-bold text-text-primary">Scene</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-text-muted font-medium block mb-1.5">Scene Description</label>
                <textarea
                  value={scene}
                  onChange={(e) => setScene(e.target.value)}
                  rows={3}
                  placeholder="Describe the setting, situation, and what's happening…"
                  className="w-full rounded-xl px-4 py-3 bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted font-medium block mb-1.5">Subtext / Hidden Tension <span className="italic">(optional)</span></label>
                <textarea
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  rows={2}
                  placeholder="What's the underlying conflict or secret neither character is saying out loud?"
                  className="w-full rounded-xl px-4 py-3 bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Mood */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="text-sm font-bold text-text-primary">Mood</h3>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map(({ label, emoji }) => (
                  <button
                    key={label} type="button"
                    onClick={() => setMood(label)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      mood === label
                        ? "bg-accent text-white"
                        : "bg-surface-2 border border-border text-text-muted hover:border-accent/30 hover:text-text-secondary"
                    )}
                  >
                    <span>{emoji}</span> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Language, Style, Length */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="text-sm font-bold text-text-primary">Output Settings</h3>
            </div>
            <div className="p-4 space-y-4">

              <div>
                <p className="text-xs text-text-muted font-medium mb-2">Language</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((l) => (
                    <button key={l} type="button" onClick={() => setLanguage(l)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        language === l
                          ? "bg-accent/20 border border-accent/40 text-accent"
                          : "bg-surface-2 border border-border text-text-muted hover:border-accent/20"
                      )}
                    >{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-text-muted font-medium mb-2">Writing Style</p>
                <PillGroup options={STYLE_OPTIONS} value={style} onChange={setStyle} accent="secondary" />
              </div>

              <div>
                <p className="text-xs text-text-muted font-medium mb-2">Dialogue Length</p>
                <div className="grid grid-cols-3 gap-2">
                  {LENGTH_OPTIONS.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setLength(opt.id)}
                      className={cn(
                        "flex flex-col items-center py-2 px-3 rounded-xl border text-xs font-medium transition-all",
                        length === opt.id
                          ? "border-accent/50 bg-accent/10 text-accent"
                          : "border-border bg-surface-2 text-text-muted hover:border-accent/20"
                      )}
                    >
                      <span className="font-bold">{opt.label}</span>
                      <span className="text-[10px] opacity-70 mt-0.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={generate}
            loading={isLoading}
            className="w-full"
            size="lg"
            leftIcon={<Sparkles className="w-4 h-4" />}
            disabled={profiles.length === 0}
          >
            {isLoading ? "Writing dialogue…" : "Generate Dialogue"}
          </Button>
        </motion.div>

        {/* ── Right Panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3"
        >
          <div className="rounded-2xl border border-border bg-surface overflow-hidden h-full min-h-[560px] flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-bold text-text-primary">Generated Dialogue</h3>
                {hasDialogue && (
                  <span className="text-xs text-text-muted ml-1">({dialogue.length} lines)</span>
                )}
              </div>
              {hasDialogue && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={generate}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-2 border border-border text-text-muted hover:text-text-primary hover:border-accent/30 transition-all"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </button>
                  <button
                    onClick={copyDialogue}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-2 border border-border text-text-muted hover:text-text-primary hover:border-accent/30 transition-all"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={exportDialogue}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-2 border border-border text-text-muted hover:text-text-primary hover:border-accent/30 transition-all"
                  >
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
                    className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-1">Generation Failed</p>
                      <p className="text-sm text-text-muted max-w-xs leading-relaxed">{error}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={generate} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Try Again</Button>
                  </motion.div>

                ) : !hasDialogue ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full text-center py-16 gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-secondary/60" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-text-primary mb-1">Your dialogue will appear here</p>
                      <p className="text-sm text-text-muted max-w-xs leading-relaxed">
                        Configure your characters, scene, and mood on the left — then hit{" "}
                        <span className="text-accent font-medium">Generate Dialogue</span>
                      </p>
                    </div>
                    {/* Character preview */}
                    {profiles.length > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        {profiles.map((p, i) => {
                          const col = charColor(i);
                          return (
                            <div key={i} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold", col.border, col.bg, col.text)}>
                              {p.name}
                              {p.emotionalState && <span className="opacity-60">· {p.emotionalState}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>

                ) : (
                  <motion.div key="dialogue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    {/* Scene info bar */}
                    <div className="px-4 py-3 rounded-xl bg-surface-2 border border-border">
                      <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Scene</p>
                      <p className="text-sm text-text-secondary italic leading-relaxed">&ldquo;{scene}&rdquo;</p>
                      {subtext && <p className="text-xs text-text-muted italic mt-1 opacity-75">Subtext: {subtext}</p>}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="default">{mood}</Badge>
                        <Badge variant="secondary">{language}</Badge>
                        <Badge variant="outline">{style}</Badge>
                        <Badge variant="outline">{length.charAt(0).toUpperCase() + length.slice(1)}</Badge>
                      </div>
                    </div>

                    {/* Dialogue lines */}
                    <div className="space-y-4">
                      {dialogue.map((line, i) => {
                        const charIdx = profiles.findIndex((p) => p.name === line.character);
                        const col = charColor(charIdx >= 0 ? charIdx : i);
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.35 }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black text-white"
                                style={{ background: col.dot }}>
                                {line.character.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className={cn("text-xs font-bold tracking-wider", col.text)}>{line.character}</span>
                                  {line.emotion && (
                                    <span className="text-[10px] text-text-muted italic bg-surface-2 px-2 py-0.5 rounded-full border border-border">
                                      {line.emotion}
                                    </span>
                                  )}
                                </div>
                                {line.direction && (
                                  <p className="text-xs text-text-muted italic mb-1.5 pl-1">({line.direction})</p>
                                )}
                                <div className={cn("rounded-xl px-4 py-3 border text-sm text-text-primary leading-relaxed", col.bg, col.border)}>
                                  {line.text}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-border">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={generate} loading={isLoading}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Regenerate</Button>
                      <Button size="sm" className="flex-1" onClick={exportDialogue}
                        leftIcon={<Download className="w-3.5 h-3.5" />}>Export .txt</Button>
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
