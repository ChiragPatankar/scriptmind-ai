"use client";

import { CreditBadge } from "@/components/ui/CreditBadge";
import { SaveButton } from "@/components/ui/SaveButton";
import { useFeatureDraft } from "@/lib/draft/useFeatureDraft";
import { cn } from "@/lib/utils";
import {
    Download,
    Film,
    ImageIcon,
    Loader2,
    RefreshCw,
    Sparkles,
    Type,
    Wand2,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const GENRES = [
  { value: "action",    label: "Action"     },
  { value: "romance",   label: "Romance"    },
  { value: "thriller",  label: "Thriller"   },
  { value: "horror",    label: "Horror"     },
  { value: "comedy",    label: "Comedy"     },
  { value: "drama",     label: "Drama"      },
  { value: "sci_fi",    label: "Sci-Fi"     },
  { value: "fantasy",   label: "Fantasy"    },
  { value: "crime",     label: "Crime"      },
  { value: "biography", label: "Biography"  },
];

const MOODS = [
  { value: "dark",       label: "Dark & Gritty"  },
  { value: "epic",       label: "Epic & Grand"   },
  { value: "mysterious", label: "Mysterious"     },
  { value: "hopeful",    label: "Hopeful"        },
  { value: "tense",      label: "Tense"          },
  { value: "romantic",   label: "Romantic"       },
];

const STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "illustrated",    label: "Illustrated"    },
  { value: "vintage",        label: "Vintage / Retro"},
  { value: "minimalist",     label: "Minimalist"     },
  { value: "bollywood",      label: "Bollywood"      },
];

// ── Pill selector ──────────────────────────────────────────────────────────────

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border",
            value === o.value
              ? "bg-accent text-white border-accent shadow-glow-sm"
              : "bg-surface-2 text-text-secondary border-border hover:border-accent/50 hover:text-text-primary"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Canvas download helper ─────────────────────────────────────────────────────
// Draws image + gradient + title + tagline onto a canvas and triggers download.

async function downloadWithOverlay(
  imageUrl: string,
  title:    string,
  tagline:  string,
  filename: string
) {
  const img = new window.Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload  = () => resolve();
    img.onerror = reject;
    img.src = imageUrl;
  });

  const W = img.naturalWidth  || 800;
  const H = img.naturalHeight || 1200;

  const canvas  = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 1. Draw base image
  ctx.drawImage(img, 0, 0, W, H);

  // 2. Bottom gradient overlay (transparent → black)
  const grad = ctx.createLinearGradient(0, H * 0.55, 0, H);
  grad.addColorStop(0,   "rgba(0,0,0,0)");
  grad.addColorStop(0.6, "rgba(0,0,0,0.75)");
  grad.addColorStop(1,   "rgba(0,0,0,0.93)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 3. Title text
  const titleSize = Math.round(W * 0.1);        // ~80px at 800w
  ctx.font        = `900 ${titleSize}px "Georgia", serif`;
  ctx.textAlign   = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle   = "#ffffff";
  ctx.shadowColor  = "rgba(0,0,0,0.9)";
  ctx.shadowBlur   = 18;
  ctx.shadowOffsetY = 4;

  const titleY = tagline.trim() ? H - Math.round(H * 0.12) : H - Math.round(H * 0.08);
  ctx.fillText(title.toUpperCase(), W / 2, titleY, W * 0.9);

  // 4. Tagline text (if provided)
  if (tagline.trim()) {
    const tagSize  = Math.round(W * 0.038);
    ctx.font       = `italic ${tagSize}px "Georgia", serif`;
    ctx.fillStyle  = "rgba(255,255,255,0.82)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillText(tagline, W / 2, H - Math.round(H * 0.055), W * 0.85);
  }

  // 5. Subtle "ScriptMind AI" watermark
  ctx.font      = `400 ${Math.round(W * 0.022)}px sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.textAlign = "right";
  ctx.fillText("ScriptMind AI", W - 16, H - 14);

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/jpeg", 0.95);
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PosterGeneratorPage() {
  const [title,   setTitle]   = useState("");
  const [tagline, setTagline] = useState("");
  const [genre,   setGenre]   = useState("drama");
  const [mood,    setMood]    = useState("epic");
  const [style,   setStyle]   = useState("photorealistic");

  const [loading,   setLoading]   = useState(false);
  const [regenLoad, setRegenLoad] = useState(false);
  const [dlLoad,    setDlLoad]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const [imageUrl,      setImageUrl]      = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [isStored,      setIsStored]      = useState(false);

  // Track the title/tagline that were used when generating (for overlay)
  const [displayTitle,   setDisplayTitle]   = useState("");
  const [displayTagline, setDisplayTagline] = useState("");

  // ── Draft persistence ────────────────────────────────────────────────────
  const draftSnapshot = {
    title, tagline, genre, mood, style,
    imageUrl, currentPrompt, displayTitle, displayTagline,
  };
  const {
    loadedDraft, isHydrated, status: saveStatus, isDirty, lastSavedAt, save,
  } = useFeatureDraft("poster", draftSnapshot);

  useEffect(() => {
    if (!loadedDraft) return;
    if (typeof loadedDraft.title          === "string") setTitle(loadedDraft.title);
    if (typeof loadedDraft.tagline        === "string") setTagline(loadedDraft.tagline);
    if (typeof loadedDraft.genre          === "string") setGenre(loadedDraft.genre);
    if (typeof loadedDraft.mood           === "string") setMood(loadedDraft.mood);
    if (typeof loadedDraft.style          === "string") setStyle(loadedDraft.style);
    if (typeof loadedDraft.imageUrl       === "string") setImageUrl(loadedDraft.imageUrl);
    if (typeof loadedDraft.currentPrompt  === "string") setCurrentPrompt(loadedDraft.currentPrompt);
    if (typeof loadedDraft.displayTitle   === "string") setDisplayTitle(loadedDraft.displayTitle);
    if (typeof loadedDraft.displayTagline === "string") setDisplayTagline(loadedDraft.displayTagline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedDraft]);

  // ── Generate ────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!title.trim()) { setError("Please enter a film title."); return; }
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/poster/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, tagline, genre, mood, style }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "Generation failed.");
        return;
      }

      setImageUrl(data.imageUrl);
      setCurrentPrompt(data.prompt ?? null);
      setIsStored(data.stored ?? false);
      setDisplayTitle(title.trim());
      setDisplayTagline(tagline.trim());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Regenerate ──────────────────────────────────────────────────────────────

  async function handleRegenerate() {
    if (!currentPrompt) return;
    setRegenLoad(true);
    setError(null);

    try {
      const res = await fetch("/api/poster/regenerate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt: currentPrompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "Regeneration failed.");
        return;
      }

      setImageUrl(data.imageUrl);
      setIsStored(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRegenLoad(false);
    }
  }

  // ── Download (with overlay burned in) ───────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (!imageUrl) return;
    setDlLoad(true);
    try {
      const filename = `${displayTitle.replace(/\s+/g, "-").toLowerCase() || "poster"}.jpg`;
      await downloadWithOverlay(imageUrl, displayTitle, displayTagline, filename);
    } catch {
      window.open(imageUrl, "_blank");
    } finally {
      setDlLoad(false);
    }
  }, [imageUrl, displayTitle, displayTagline]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <div className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow-sm">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Poster Generator</h1>
              <p className="text-xs text-text-muted">AI-crafted cinematic movie posters</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreditBadge cost={10} label="credits per poster" />
            <SaveButton
              status={saveStatus}
              isDirty={isDirty && isHydrated}
              lastSavedAt={lastSavedAt}
              onClick={save}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Left: Inputs ──────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Film Details */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Film className="w-4 h-4 text-accent" /> Film Details
              </h2>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Film Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Last Monsoon"
                  maxLength={60}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Type className="w-3 h-3" />
                    Tagline
                    <span className="text-text-muted font-normal">(optional — rendered as crisp text overlay)</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Some stories are worth dying for"
                  maxLength={80}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-colors"
                />
              </div>
            </div>

            {/* Genre */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">Genre</h2>
              <PillGroup options={GENRES} value={genre} onChange={setGenre} />
            </div>

            {/* Mood */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">Mood</h2>
              <PillGroup options={MOODS} value={mood} onChange={setMood} />
            </div>

            {/* Style */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">Visual Style</h2>
              <PillGroup options={STYLES} value={style} onChange={setStyle} />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !title.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200",
                loading || !title.trim()
                  ? "bg-accent/40 text-white/50 cursor-not-allowed"
                  : "bg-gradient-accent text-white hover:shadow-glow cursor-pointer"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Poster…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Poster
                  <span className="ml-1 text-xs opacity-80 font-normal">(10 credits)</span>
                </>
              )}
            </button>
          </div>

          {/* ── Right: Poster Preview ──────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Poster frame */}
            <div className="relative rounded-2xl border border-border overflow-hidden aspect-[2/3] bg-surface flex items-center justify-center">

              {/* Loading */}
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface z-10">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-accent animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-accent/60" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-text-primary">Crafting your poster…</p>
                    <p className="text-xs text-text-muted mt-1">This takes 10–20 seconds</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading && !imageUrl && (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
                    <ImageIcon className="w-7 h-7 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">No poster yet</p>
                    <p className="text-xs text-text-muted mt-1">Fill in the details and hit Generate</p>
                  </div>
                </div>
              )}

              {/* Generated poster + CSS text overlay */}
              {!loading && imageUrl && (
                <>
                  {/* Background image */}
                  <Image
                    src={imageUrl}
                    alt={`${displayTitle} movie poster`}
                    fill
                    className="object-cover"
                    unoptimized
                  />

                  {/* Gradient scrim — bottom 50% */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.92) 100%)",
                    }}
                  />

                  {/* Title + tagline overlay */}
                  <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 text-center z-10">
                    {displayTagline && (
                      <p
                        className="text-white/80 italic mb-1.5 leading-snug"
                        style={{
                          fontSize:    "clamp(10px, 2.2%, 13px)",
                          textShadow:  "0 1px 8px rgba(0,0,0,0.9)",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {displayTagline}
                      </p>
                    )}
                    <h2
                      className="text-white font-black uppercase tracking-wide leading-none"
                      style={{
                        fontSize:   "clamp(18px, 8.5cqw, 42px)",
                        textShadow: "0 2px 16px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.8)",
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {displayTitle}
                    </h2>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            {imageUrl && !loading && (
              <div className="flex gap-3">
                <button
                  onClick={handleRegenerate}
                  disabled={regenLoad}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all",
                    regenLoad
                      ? "border-border text-text-muted cursor-not-allowed"
                      : "border-border text-text-secondary hover:border-accent/50 hover:text-accent bg-surface-2"
                  )}
                >
                  {regenLoad
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />
                  }
                  {regenLoad ? "Regenerating…" : "Regenerate"}
                  {!regenLoad && <span className="text-xs text-text-muted font-normal">(5cr)</span>}
                </button>

                <button
                  onClick={handleDownload}
                  disabled={dlLoad}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                    dlLoad
                      ? "bg-accent/50 text-white/60 cursor-not-allowed"
                      : "bg-gradient-accent text-white hover:shadow-glow"
                  )}
                >
                  {dlLoad
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Download className="w-3.5 h-3.5" />
                  }
                  {dlLoad ? "Preparing…" : "Download"}
                </button>
              </div>
            )}

            {/* Hint */}
            {imageUrl && !loading && (
              <p className="text-center text-xs text-text-muted">
                {isStored ? "✓ Saved to your poster library · " : ""}
                Download includes title &amp; tagline baked in
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
