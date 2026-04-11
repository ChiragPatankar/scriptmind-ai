"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, Sparkles, Film, Users, MapPin, Wand2, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const genres = ["Romantic Drama", "Action Thriller", "Comedy", "Period Drama", "Crime", "Horror", "Sci-Fi", "Social Drama", "Family", "Heist"];
const tones = ["Intense", "Light-Hearted", "Dark", "Inspiring", "Bittersweet", "Epic", "Quirky"];
const settings = ["Mumbai", "Delhi", "Rajasthan", "Village India", "Abroad", "Flashback India", "Near Future"];

const mockStoryOutline = {
  title: "Ek Raat Mumbai Mein",
  logline: "When a hotshot lawyer discovers her murdered client was innocent, she has one night to expose a political conspiracy — or become the next victim.",
  acts: [
    {
      label: "Act I — Setup",
      scenes: [
        "Priya (35, brilliant criminal lawyer) wins a high-profile murder case. Her client is executed at dawn.",
        "Late-night call from an unknown source: 'The man you defended was innocent. Check the photograph.'",
        "The photograph shows Priya's mentor — the city's most trusted judge — at the crime scene.",
      ],
    },
    {
      label: "Act II — Confrontation",
      scenes: [
        "Priya digs deeper: shell companies, forged evidence, a network reaching the Chief Minister.",
        "She's followed. Her apartment is searched. A journalist who helped her is found dead.",
        "Confrontation with her mentor at the court: 'You were never meant to win that case.'",
      ],
    },
    {
      label: "Act III — Resolution",
      scenes: [
        "Priya leaks the evidence live on a midnight news broadcast from a friend's rooftop studio.",
        "Armed men arrive — but so do hundreds of citizens alerted by the broadcast.",
        "The judge is arrested at dawn, as Mumbai wakes up. Priya stands in the rain, finally still.",
      ],
    },
  ],
  characters: [
    { name: "Priya Mehta", role: "Protagonist", arc: "Self-doubt → Moral courage" },
    { name: "Justice Rao", role: "Antagonist", arc: "Respected figure → Exposed villain" },
    { name: "Kabir", role: "Ally/Love Interest", arc: "Cynical journalist → Believer" },
  ],
};

export default function CreateStoryPage() {
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [genre, setGenre] = useState("Romantic Drama");
  const [tone, setTone] = useState("Intense");
  const [setting, setSetting] = useState("Mumbai");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
    }, 3000);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black text-text-primary mb-1">Create Story</h1>
        <p className="text-text-muted">Transform your idea into a complete Bollywood screenplay outline.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-5"
        >
          <Card variant="default" hover={false}>
            <CardContent className="p-5 space-y-4">
              <Input
                label="Story Title"
                placeholder="e.g. Ek Raat Mumbai Mein"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                leftIcon={<Film className="w-4 h-4" />}
              />
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-1.5">Story Premise</label>
                <textarea
                  value={premise}
                  onChange={(e) => setPremise(e.target.value)}
                  rows={4}
                  placeholder="Describe your core story idea in 2-3 sentences..."
                  className="w-full rounded-xl px-4 py-3 bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
            </CardContent>
          </Card>

          <Card variant="default" hover={false}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Film className="w-4 h-4 text-gold" />
                Genre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      genre === g
                        ? "bg-gold/20 border border-gold/40 text-gold"
                        : "bg-surface-2 border border-border text-text-muted hover:border-gold/20"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card variant="default" hover={false}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1.5">
                  {tones.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                        tone === t
                          ? "bg-accent/15 border border-accent/30 text-accent"
                          : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
                      }`}
                    >
                      {tone === t && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                      {t}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="default" hover={false}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  Setting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1.5">
                  {settings.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSetting(s)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                        setting === s
                          ? "bg-secondary/15 border border-secondary/30 text-secondary"
                          : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
                      }`}
                    >
                      {setting === s && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                      {s}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={generate}
            loading={isGenerating}
            size="lg"
            className="w-full"
            leftIcon={<Wand2 className="w-4 h-4" />}
          >
            {isGenerating ? "Crafting Your Story..." : "Generate Story Outline"}
          </Button>
        </motion.div>

        {/* Story Output */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3"
        >
          <Card variant="default" hover={false} className="h-full min-h-[600px]">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-gold" />
                  Story Outline
                </CardTitle>
                {generated && (
                  <div className="flex items-center gap-2">
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Generated
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {!generated ? (
                  <motion.div
                    key="empty"
                    className="flex flex-col items-center justify-center h-80 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                      <PenTool className="w-8 h-8 text-gold/50" />
                    </div>
                    <p className="text-text-muted text-sm max-w-xs leading-relaxed">
                      Fill in the story details, pick your genre and tone, then let AI craft your Bollywood outline.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="story"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-7"
                  >
                    {/* Title & Logline */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-black text-text-primary">{mockStoryOutline.title}</h2>
                        <Badge variant="warning">{genre}</Badge>
                      </div>
                      <p className="text-sm text-text-secondary italic leading-relaxed border-l-2 border-gold pl-4">
                        &ldquo;{mockStoryOutline.logline}&rdquo;
                      </p>
                    </div>

                    {/* Three Acts */}
                    <div className="space-y-5">
                      {mockStoryOutline.acts.map((act, i) => (
                        <motion.div
                          key={act.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.15 + 0.2 }}
                        >
                          <h3 className="text-sm font-bold text-gold mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                            {act.label}
                          </h3>
                          <div className="space-y-2 pl-7">
                            {act.scenes.map((scene, j) => (
                              <div key={j} className="flex items-start gap-2.5 text-sm text-text-secondary">
                                <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                                {scene}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Characters */}
                    <div>
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-accent" />
                        Key Characters
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {mockStoryOutline.characters.map((char) => (
                          <div key={char.name} className="p-3.5 rounded-xl bg-surface-2 border border-border">
                            <div className="text-sm font-bold text-text-primary">{char.name}</div>
                            <div className="text-xs text-accent mb-1.5">{char.role}</div>
                            <div className="text-xs text-text-muted leading-relaxed">{char.arc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="secondary" size="sm" className="flex-1">Save Project</Button>
                      <Button size="sm" className="flex-1" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                        Expand to Full Script
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
