"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Sparkles, Plus, Copy, Download, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const moodOptions = ["Intense", "Romantic", "Comedic", "Emotional", "Dramatic", "Philosophical", "Angry", "Nostalgic"];
const languageOptions = ["Hindi", "English", "Hinglish"] as const;
const styleOptions = ["Classical", "Modern", "Street Slang", "Poetic", "Action-Packed"];

const mockDialogue = [
  {
    character: "ARJUN",
    text: "Zindagi aur maut ke beech mein, sirf ek cheez hoti hai — choice.",
    emotion: "Intense",
    direction: "(staring at the horizon, rain falling)",
  },
  {
    character: "MEERA",
    text: "Choice? Jab zamana hi tujhe rok le, toh choice kahan bachti hai?",
    emotion: "Emotional",
    direction: "(voice trembling)",
  },
  {
    character: "ARJUN",
    text: "Tab bhi bachti hai. Ek lamha hota hai... ek heartbeat... jab sab kuch badal sakta hai.",
    emotion: "Philosophical",
    direction: "(turns to face her slowly)",
  },
  {
    character: "MEERA",
    text: "Aur agar woh lamha nikal jaaye?",
    emotion: "Quiet desperation",
  },
  {
    character: "ARJUN",
    text: "Tab agle lamhe ke liye jeena.",
    emotion: "Resolute",
    direction: "(a small, sad smile)",
  },
];

type Language = typeof languageOptions[number];

export default function DialoguePage() {
  const [characters, setCharacters] = useState(["ARJUN", "MEERA"]);
  const [newChar, setNewChar] = useState("");
  const [scene, setScene] = useState("Two estranged lovers meet during a Mumbai monsoon night");
  const [mood, setMood] = useState("Intense");
  const [language, setLanguage] = useState<Language>("Hinglish");
  const [style, setStyle] = useState("Modern");
  const [generated, setGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addCharacter = () => {
    if (newChar.trim() && !characters.includes(newChar.toUpperCase())) {
      setCharacters([...characters, newChar.toUpperCase()]);
      setNewChar("");
    }
  };

  const generate = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setGenerated(true);
    }, 2000);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black text-text-primary mb-1">AI Dialogue Generator</h1>
        <p className="text-text-muted">Write cinematic Bollywood dialogues with AI assistance.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Settings Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-5"
        >
          {/* Characters */}
          <Card variant="default" hover={false}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-accent" />
                Characters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {characters.map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-accent/15 border border-accent/30"
                  >
                    <span className="text-xs font-semibold text-accent">{c}</span>
                    <button
                      onClick={() => setCharacters(characters.filter((x) => x !== c))}
                      className="w-3.5 h-3.5 rounded-full text-accent/60 hover:text-accent transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add character..."
                  value={newChar}
                  onChange={(e) => setNewChar(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCharacter()}
                  className="flex-1 h-9"
                />
                <Button size="icon-sm" onClick={addCharacter} variant="secondary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scene */}
          <Card variant="default" hover={false}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Scene Description</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={scene}
                onChange={(e) => setScene(e.target.value)}
                rows={3}
                placeholder="Describe the scene, setting, and situation..."
                className="w-full rounded-xl px-4 py-3 bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </CardContent>
          </Card>

          {/* Mood */}
          <Card variant="default" hover={false}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                      mood === m
                        ? "bg-accent text-white"
                        : "bg-surface-2 border border-border text-text-muted hover:border-accent/30 hover:text-text-secondary"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Language & Style */}
          <Card variant="default" hover={false}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Language & Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-text-muted mb-2 font-medium">Language</p>
                <div className="flex gap-2">
                  {languageOptions.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLanguage(l)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        language === l
                          ? "bg-accent/20 border border-accent/40 text-accent"
                          : "bg-surface-2 border border-border text-text-muted hover:border-accent/20"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2 font-medium">Writing Style</p>
                <div className="flex flex-wrap gap-2">
                  {styleOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                        style === s
                          ? "bg-secondary/20 border border-secondary/40 text-secondary"
                          : "bg-surface-2 border border-border text-text-muted hover:border-secondary/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={generate}
            loading={isLoading}
            className="w-full"
            size="lg"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Generate Dialogue
          </Button>
        </motion.div>

        {/* Output Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3"
        >
          <Card variant="default" hover={false} className="h-full min-h-[500px]">
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-4 h-4 text-secondary" />
                  Generated Dialogue
                </CardTitle>
                {generated && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon-sm">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {!generated ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-80 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-secondary/60" />
                    </div>
                    <p className="text-text-muted text-sm max-w-xs leading-relaxed">
                      Configure your scene, characters, and mood on the left, then hit{" "}
                      <span className="text-text-secondary font-medium">Generate Dialogue</span>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="dialogue"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Scene Header */}
                    <div className="px-4 py-3 rounded-xl bg-surface-2 border border-border">
                      <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Scene</p>
                      <p className="text-sm text-text-secondary italic">&ldquo;{scene}&rdquo;</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="default">{mood}</Badge>
                        <Badge variant="secondary">{language}</Badge>
                        <Badge variant="outline">{style}</Badge>
                      </div>
                    </div>

                    {/* Dialogue Lines */}
                    <div className="space-y-5">
                      {mockDialogue.map((line, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.4 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-[10px] font-bold text-white">{line.character[0]}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold text-accent tracking-wider">{line.character}</span>
                                {line.emotion && (
                                  <span className="text-[10px] text-text-muted italic">({line.emotion})</span>
                                )}
                              </div>
                              {line.direction && (
                                <p className="text-xs text-text-muted italic mb-1.5">{line.direction}</p>
                              )}
                              <p className="text-sm text-text-primary leading-relaxed bg-surface-2 rounded-xl px-4 py-3 border border-border">
                                {line.text}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="secondary" size="sm" className="flex-1" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                        Regenerate
                      </Button>
                      <Button size="sm" className="flex-1" leftIcon={<Download className="w-3.5 h-3.5" />}>
                        Export
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
