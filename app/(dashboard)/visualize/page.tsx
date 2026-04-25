"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Sparkles,
  Download,
  RefreshCw,
  AlertCircle,
  ImageIcon,
  Film,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const styleOptions = [
  { value: "cinematic", label: "Cinematic", desc: "35mm film look" },
  { value: "realistic", label: "Realistic", desc: "Photorealistic DSLR" },
  { value: "anime", label: "Anime", desc: "Studio-quality animation" },
];

const moodOptions = [
  { value: "dark", label: "Dark", emoji: "🌑" },
  { value: "romantic", label: "Romantic", emoji: "🌅" },
  { value: "thriller", label: "Thriller", emoji: "⚡" },
  { value: "dramatic", label: "Dramatic", emoji: "🎭" },
];

interface GenerateResult {
  images?: string[];
  error?: string;
}

function downloadImage(base64: string, filename: string) {
  const link = document.createElement("a");
  link.href = `data:image/png;base64,${base64}`;
  link.download = filename;
  link.click();
}

export default function VisualizePage() {
  const [scene, setScene] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [mood, setMood] = useState("dramatic");
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!scene.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene, style, mood }),
      });

      const data = (await res.json()) as GenerateResult;

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      setImages(data.images ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const hasImages = images.length > 0;

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-3xl font-black text-text-primary">Visualize Your Scene</h1>
        </div>
        <p className="text-text-muted ml-[52px]">
          Generate cinematic images from your screenplay scenes using AI.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left Panel: Controls ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-5"
        >
          {/* Scene Input */}
          <Card variant="default" hover={false}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Film className="w-4 h-4 text-violet-400" />
                Scene Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={scene}
                onChange={(e) => setScene(e.target.value)}
                rows={6}
                placeholder={`Paste your scene here...\n\nExample: A lone detective stands under a flickering streetlamp in a rain-soaked Mumbai alley, cigarette in hand, staring at a chalk outline on the ground.`}
                className="w-full rounded-xl px-4 py-3 bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all leading-relaxed"
              />
              <p className="text-xs text-text-muted mt-2">
                Be descriptive — include setting, characters, lighting, action.
              </p>
            </CardContent>
          </Card>

          {/* Style */}
          <Card variant="default" hover={false}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="w-4 h-4 text-violet-400" />
                Visual Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {styleOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 ${
                      style === s.value
                        ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                        : "bg-surface-2 border-border text-text-secondary hover:border-violet-500/20 hover:text-text-primary"
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className="text-xs opacity-60">{s.desc}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mood */}
          <Card variant="default" hover={false}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {moodOptions.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ${
                      mood === m.value
                        ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                        : "bg-surface-2 border-border text-text-secondary hover:border-violet-500/20 hover:text-text-primary"
                    }`}
                  >
                    <span className="text-base">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={generate}
            loading={isLoading}
            disabled={!scene.trim()}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
            size="lg"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Generate Visual
          </Button>
        </motion.div>

        {/* ── Right Panel: Output ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3"
        >
          <Card variant="default" hover={false} className="h-full min-h-[560px]">
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="w-4 h-4 text-violet-400" />
                  Generated Visuals
                </CardTitle>
                {hasImages && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generate}
                    loading={isLoading}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Regenerate
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {/* Loading */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-96 gap-6"
                  >
                    {/* Animated film strip loader */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Camera className="w-9 h-9 text-violet-400" />
                        </motion.div>
                      </div>
                      {/* Orbiting dot */}
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-500"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-text-primary mb-1">
                        Generating cinematic visuals…
                      </p>
                      <p className="text-xs text-text-muted max-w-xs leading-relaxed">
                        Stable Diffusion is rendering your scene. This takes 15–30 seconds.
                      </p>
                    </div>
                    {/* Progress bar animation */}
                    <div className="w-48 h-1 rounded-full bg-surface-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Error */}
                {!isLoading && error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-96 text-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-2">
                        Generation Failed
                      </p>
                      <p className="text-sm text-text-muted max-w-sm leading-relaxed">{error}</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={generate}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      Try Again
                    </Button>
                  </motion.div>
                )}

                {/* Empty */}
                {!isLoading && !error && !hasImages && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-96 text-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-violet-500/8 border border-violet-500/15 flex items-center justify-center mb-5">
                      <Camera className="w-10 h-10 text-violet-500/40" />
                    </div>
                    <p className="text-text-muted text-sm max-w-xs leading-relaxed">
                      Paste your scene description, choose a style and mood,
                      then hit{" "}
                      <span className="text-violet-400 font-medium">Generate Visual</span>
                    </p>
                    <div className="flex items-center gap-4 mt-6 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
                        AI-powered
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                        Stable Diffusion
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 inline-block" />
                        Downloadable
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Images grid */}
                {!isLoading && !error && hasImages && (
                  <motion.div
                    key="images"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-5"
                  >
                    {/* Scene context bar */}
                    <div className="px-4 py-3 rounded-xl bg-surface-2 border border-border">
                      <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">
                        Scene
                      </p>
                      <p className="text-sm text-text-secondary italic line-clamp-2">
                        &ldquo;{scene}&rdquo;
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 capitalize">
                          {style}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 capitalize">
                          {mood}
                        </span>
                      </div>
                    </div>

                    {/* Images */}
                    <div className="grid grid-cols-1 gap-4">
                      {images.map((b64, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative group rounded-2xl overflow-hidden border border-border shadow-card"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`data:image/png;base64,${b64}`}
                            alt={`Generated scene ${idx + 1}`}
                            className="w-full object-cover"
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <Button
                              size="sm"
                              onClick={() =>
                                downloadImage(b64, `scene-visual-${idx + 1}.png`)
                              }
                              className="bg-white/15 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 transition-all"
                              leftIcon={<Download className="w-3.5 h-3.5" />}
                            >
                              Download PNG
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Bottom actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={generate}
                        loading={isLoading}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0"
                        onClick={() =>
                          images.forEach((b64, i) =>
                            downloadImage(b64, `scene-visual-${i + 1}.png`)
                          )
                        }
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                      >
                        Download All
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
