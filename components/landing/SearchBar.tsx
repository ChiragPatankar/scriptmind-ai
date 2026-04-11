"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Film, FolderOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const suggestions = [
  { icon: Search,     label: "Search scripts",          desc: "Browse thousands of Bollywood scripts",  color: "text-accent" },
  { icon: FolderOpen, label: "Start a new project",     desc: "Kickstart your film project",            color: "text-secondary" },
  { icon: Lightbulb,  label: "Generate story idea",     desc: "Let AI craft your next concept",         color: "text-yellow-400" },
  { icon: Film,       label: "Explore screenplay tools", desc: "Write, edit and analyse your script",   color: "text-blue-400" },
];

const quickTags = [
  "Drama script", "Action screenplay", "Budget planner", "AI dialogue", "Script analysis",
];

interface SearchBarProps {
  onSearch?: (query: string) => void;
  className?: string;
}

export default function SearchBar({ onSearch, className }: SearchBarProps) {
  const [query, setQuery]       = useState("");
  const [focused, setFocused]   = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
      setShowDrop(false);
    }
  };

  const handleSuggestionClick = (label: string) => {
    setQuery(label);
    onSearch?.(label);
    setShowDrop(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDrop(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className={cn("w-full", className)}>
      <form onSubmit={handleSearch}>
        <div
          className={cn(
            "relative flex items-center rounded-2xl transition-all duration-300",
            "border",
            focused
              ? "border-accent/60 shadow-[0_0_0_4px_rgba(124,58,237,0.12),0_8px_32px_rgba(0,0,0,0.4)]"
              : "border-white/[0.10] hover:border-accent/30 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          )}
          style={{ background: "rgba(18,18,28,0.85)", backdropFilter: "blur(20px)" }}
        >
          <div className="absolute left-4 text-text-muted pointer-events-none">
            <Search className={cn("w-5 h-5 transition-colors duration-200", focused && "text-accent")} />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { setFocused(true); setShowDrop(true); }}
            placeholder="Search scripts, projects, or explore ideas..."
            className="flex-1 h-14 pl-12 pr-4 bg-transparent text-text-primary placeholder:text-text-muted text-sm sm:text-base outline-none rounded-2xl"
          />

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-lg bg-accent/10 border border-accent/20">
            <Sparkles className="w-3 h-3 text-accent" />
            <span className="text-[11px] text-accent font-semibold tracking-wide">AI</span>
          </div>

          <Button type="submit" className="mr-2 h-10 px-5 rounded-xl text-sm">
            Search
          </Button>
        </div>
      </form>

      {/* Suggestion Dropdown */}
      <AnimatePresence>
        {showDrop && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-50 mt-2 w-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            style={{
              background: "rgba(15,15,22,0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(24px)",
              maxWidth: "560px",
            }}
          >
            <div className="p-2">
              <p className="text-[10px] uppercase tracking-widest text-text-muted px-3 pt-2 pb-1 font-semibold">
                Quick Actions
              </p>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => handleSuggestionClick(s.label)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-left group"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-surface-2 border border-border group-hover:border-white/10 transition-colors")}>
                    <s.icon className={cn("w-4 h-4", s.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{s.label}</p>
                    <p className="text-[11px] text-text-muted">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick tags */}
      <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
        <span className="text-[11px] text-text-muted font-medium">Try:</span>
        {quickTags.map((tag) => (
          <button
            key={tag}
            onClick={() => { setQuery(tag); onSearch?.(tag); }}
            className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] text-text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/8 transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
