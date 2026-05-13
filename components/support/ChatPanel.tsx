"use client";

import {
    AlertCircle,
    Bot,
    RefreshCw,
    Send,
    Sparkles,
    User as UserIcon,
    X,
} from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RichText } from "./RichText";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_GREETING: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm Scripty — the ScriptMind AI support assistant. I can help with pricing, credits, script analysis, dialogue, posters, billing, or anything you're stuck on. What do you need help with?",
};

const SUGGESTIONS = [
  "How does pricing work?",
  "How do I analyse a script?",
  "What are credits used for?",
  "My payment didn't add credits",
  "How do I reset my password?",
];

const MAX_INPUT_CHARS = 2000;

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface ChatPanelProps {
  /** Optional close button callback in the header. */
  onClose?: () => void;
  /** Extra classes on the outer wrapper. */
  className?: string;
}

export function ChatPanel({
  onClose,
  className = "",
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Smooth scroll to bottom whenever new content arrives
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, error]);

  // Auto-grow the textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const send = async (text: string, resendWithoutAppend = false) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    let nextHistory: ChatMessage[];
    if (resendWithoutAppend) {
      // Retry flow — history already contains the last user message.
      nextHistory = messages;
    } else {
      const userMsg: ChatMessage = { id: newId(), role: "user", content: trimmed };
      nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setInput("");
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const reply = typeof data.reply === "string" ? data.reply.trim() : "";
      if (!reply) throw new Error("Empty response from assistant.");

      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "assistant", content: reply },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const retryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    void send(lastUser.content, true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline. Ignore IME composition.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const onlyGreeting = messages.length === 1;
  const charCount = input.length;

  return (
    <div className={`flex flex-col bg-surface overflow-hidden h-full min-h-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-surface-2/60 via-surface-2/30 to-transparent">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-surface ring-1 ring-green-500/40" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-tight">Scripty</p>
          <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            ScriptMind AI Support · online
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase text-text-muted bg-surface-2 border border-border rounded-full px-2 py-0.5">
          <Sparkles className="w-3 h-3 text-accent" /> AI
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close support chat"
            className="w-8 h-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollerRef}
        className="overflow-y-auto px-4 py-5 space-y-3.5 flex-1 min-h-0 scroll-smooth"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {loading && <TypingIndicator />}

        {error && (
          <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={retryLast}
                className="inline-flex items-center gap-1 mt-1.5 text-red-200 hover:text-white font-medium"
              >
                <RefreshCw className="w-3 h-3" /> Try again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions — only before the first user message */}
      {onlyGreeting && !loading && (
        <div className="px-4 pb-2.5 pt-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
            Suggestions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-surface-2 border border-border text-text-secondary hover:border-accent/50 hover:text-text-primary hover:bg-accent/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-surface-2/40 p-3"
      >
        <div className="flex items-end gap-2 bg-surface border border-border rounded-2xl pl-3 pr-1.5 py-1.5 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/15 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about ScriptMind AI…"
            disabled={loading}
            rows={1}
            maxLength={MAX_INPUT_CHARS}
            className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted py-2 resize-none leading-relaxed disabled:opacity-50 max-h-[120px]"
            aria-label="Message Scripty"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-9 h-9 flex-shrink-0 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 active:scale-95 transition-all shadow-sm shadow-accent/20"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <p className="text-[10px] text-text-muted">
            <kbd className="px-1 py-0.5 text-[9px] font-semibold text-text-secondary bg-surface-2 border border-border rounded">
              Enter
            </kbd>{" "}
            to send ·{" "}
            <kbd className="px-1 py-0.5 text-[9px] font-semibold text-text-secondary bg-surface-2 border border-border rounded">
              Shift + Enter
            </kbd>{" "}
            for newline
          </p>
          {charCount > MAX_INPUT_CHARS * 0.75 && (
            <p
              className={`text-[10px] ${
                charCount >= MAX_INPUT_CHARS ? "text-red-400" : "text-text-muted"
              }`}
            >
              {charCount} / {MAX_INPUT_CHARS}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center ${
          isUser
            ? "bg-accent/15 border border-accent/30 text-accent"
            : "bg-secondary/15 border border-secondary/30 text-secondary"
        }`}
      >
        {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${
          isUser
            ? "bg-accent text-white rounded-tr-md"
            : "bg-surface-2 border border-border text-text-primary rounded-tl-md"
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div className="whitespace-pre-wrap">
            <RichText text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-secondary/15 border border-secondary/30 text-secondary flex items-center justify-center">
        <Bot className="w-3.5 h-3.5" />
      </div>
      <div className="bg-surface-2 border border-border rounded-2xl rounded-tl-md px-3.5 py-2.5 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" />
        <span
          className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
