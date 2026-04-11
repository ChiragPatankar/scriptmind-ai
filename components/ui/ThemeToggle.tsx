"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** Compact pill variant for tight navbars */
  variant?: "icon" | "pill";
  className?: string;
}

export default function ThemeToggle({
  variant = "icon",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn("w-9 h-9 rounded-xl bg-surface-2 border border-border", className)}
      />
    );
  }

  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "flex items-center gap-2 px-3 h-9 rounded-xl",
          "bg-surface-2 border border-border",
          "text-text-secondary hover:text-text-primary",
          "hover:border-accent/40 hover:bg-surface-3",
          "transition-all duration-200 text-sm font-medium",
          className
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "sun" : "moon"}
            initial={{ scale: 0.5, rotate: isDark ? -90 : 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: isDark ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-gold" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-accent" />
            )}
          </motion.span>
        </AnimatePresence>
        <span className="hidden sm:block">
          {isDark ? "Light" : "Dark"}
        </span>
      </button>
    );
  }

  // Default icon-only variant
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative w-9 h-9 rounded-xl flex items-center justify-center",
        "bg-surface-2 border border-border",
        "text-text-secondary hover:text-text-primary",
        "hover:border-accent/40 hover:bg-surface-3",
        "transition-all duration-200",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ scale: 0.4, rotate: isDark ? -90 : 90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.4, rotate: isDark ? 90 : -90, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-gold" />
          ) : (
            <Moon className="w-4 h-4 text-accent" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
