"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";

/**
 * Global floating support-chat launcher.
 *
 * Mounted once in app/layout.tsx — renders a floating "?" button at the
 * bottom-right of every page that expands into Scripty's chat panel.
 *
 * Hidden on the full-page /support route to avoid a duplicate chat.
 */
export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";

  // Close with Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Don't show on the dedicated support page (it already is the chat).
  if (pathname.startsWith("/support")) return null;

  return (
    <>
      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="scripty-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="fixed bottom-24 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] sm:w-[380px] max-w-[420px] h-[min(560px,calc(100vh-8rem))] rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col"
            role="dialog"
            aria-label="ScriptMind AI support chat"
          >
            <ChatPanel onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher button */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support chat" : "Open support chat"}
        aria-expanded={open}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] w-14 h-14 rounded-full bg-accent text-white shadow-xl shadow-accent/30 flex items-center justify-center hover:bg-accent/90 hover:scale-105 active:scale-95 transition-all ring-4 ring-accent/10"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="inline-flex"
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="inline-flex"
            >
              <MessageCircle className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Subtle pulse when closed to draw attention on first load */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping pointer-events-none" />
        )}
      </motion.button>
    </>
  );
}
