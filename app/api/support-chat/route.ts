/**
 * POST /api/support-chat
 *
 * Public ScriptMind AI support assistant — powered by Groq (llama-3.3-70b-versatile).
 * Sends the full product knowledge base as the system prompt on every turn,
 * so the bot always answers with complete ScriptMind AI context.
 *
 * Body:  { messages: [{ role: "user" | "assistant", content: string }, ...] }
 * 200:   { reply: string }
 */

import { SCRIPTMIND_SYSTEM_PROMPT } from "@/lib/support/knowledge-base";
import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

const MAX_TURNS          = 20;
const MAX_MSG_CHARS      = 2000;
const MAX_OUTPUT_TOKENS  = 800;
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_ATTEMPTS       = 2;

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface GroqChoice {
  message?: { role?: string; content?: string };
  finish_reason?: string;
}

interface GroqResponse {
  choices?: GroqChoice[];
  error?: { message?: string };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json().catch(() => null)) as { messages?: unknown } | null;
    const rawMessages = Array.isArray(body?.messages) ? body!.messages : [];

    const messages: ChatMsg[] = (rawMessages as unknown[])
      .filter(
        (m): m is ChatMsg =>
          !!m &&
          typeof m === "object" &&
          "role" in m &&
          ((m as ChatMsg).role === "user" || (m as ChatMsg).role === "assistant") &&
          typeof (m as ChatMsg).content === "string"
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MSG_CHARS) }))
      .slice(-MAX_TURNS);

    if (!messages.some((m) => m.role === "user")) {
      return NextResponse.json(
        { error: "At least one user message is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Support chat is not configured on the server." },
        { status: 500 }
      );
    }

    const payload = {
      model:       GROQ_MODEL,
      temperature: 0.4,
      top_p:       0.9,
      max_tokens:  MAX_OUTPUT_TOKENS,
      messages: [
        { role: "system", content: SCRIPTMIND_SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    };

    let lastError = "Support chat failed.";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const reply = await callGroq(apiKey, payload);
        if (reply) return NextResponse.json({ reply });
        lastError = "Assistant returned an empty response.";
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Support chat failed.";
        // Only retry on transient failures (timeout / 5xx / network)
        if (!isTransientError(lastError)) break;
      }
    }

    return NextResponse.json({ error: lastError }, { status: 502 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Support chat failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function callGroq(
  apiKey: string,
  payload: Record<string, unknown>
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${apiKey}`,
      },
      body:   JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as GroqResponse;

    if (!res.ok) {
      const msg = data.error?.message ?? `Groq error (${res.status})`;
      throw new Error(msg);
    }

    const content = data.choices?.[0]?.message?.content ?? "";
    return typeof content === "string" ? content.trim() : "";
  } finally {
    clearTimeout(timer);
  }
}

function isTransientError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("timeout") ||
    m.includes("aborted") ||
    m.includes("network") ||
    m.includes("fetch failed") ||
    /\b5\d{2}\b/.test(m) // any 5xx status code in the message
  );
}
