/**
 * Gemini API client — server-side only.
 * Used by Next.js API routes at /api/story and /api/dialogue.
 * Keep this file out of client bundles (no "use client" pages should import it directly).
 */

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  return key;
}

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface StoryInput {
  title: string;
  premise: string;
  genre: string;
  tone: string;
  setting: string;
}

export interface StoryAct {
  label: string;
  scenes: string[];
}

export interface StoryCharacter {
  name: string;
  role: string;
  arc: string;
}

export interface StoryOutline {
  title: string;
  logline: string;
  acts: StoryAct[];
  characters: StoryCharacter[];
}

export interface DialogueInput {
  characters: string[];
  scene: string;
  mood: string;
  language: string;
  style: string;
}

export interface GeneratedDialogueLine {
  character: string;
  text: string;
  emotion?: string;
  direction?: string;
}

// ─── Core Gemini Caller ───────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<unknown> {
  const key = getGeminiApiKey();
  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  if (!res.ok) {
    const message = payload.error?.message ?? `Gemini API error (${res.status})`;
    throw new Error(message);
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned invalid JSON. Raw output: ${text.slice(0, 300)}`);
  }
}

// ─── Story Outline ────────────────────────────────────────────────────────────

export async function generateStoryOutline(input: StoryInput): Promise<StoryOutline> {
  const prompt = `You are a professional Bollywood screenwriter.

Generate a structured story outline based on the details below:
- Title: ${input.title || "Untitled"}
- Premise: ${input.premise || "A compelling story set in India."}
- Genre: ${input.genre}
- Tone: ${input.tone}
- Setting: ${input.setting}

Return ONLY valid JSON (no markdown fences, no extra text) matching this exact schema:
{
  "title": "string — the story title",
  "logline": "string — one compelling sentence capturing the central conflict",
  "acts": [
    {
      "label": "Act I — Setup",
      "scenes": ["scene 1 description", "scene 2 description", "scene 3 description"]
    },
    {
      "label": "Act II — Confrontation",
      "scenes": ["scene 1 description", "scene 2 description", "scene 3 description"]
    },
    {
      "label": "Act III — Resolution",
      "scenes": ["scene 1 description", "scene 2 description", "scene 3 description"]
    }
  ],
  "characters": [
    { "name": "Character Name", "role": "Protagonist", "arc": "Starting state → Final transformation" },
    { "name": "Character Name", "role": "Antagonist", "arc": "Starting state → Final transformation" },
    { "name": "Character Name", "role": "Ally", "arc": "Starting state → Final transformation" }
  ]
}`;

  const raw = await callGemini(prompt);
  return parseStoryOutline(raw);
}

function parseStoryOutline(raw: unknown): StoryOutline {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Story generation returned an unexpected structure.");
  }
  const r = raw as Record<string, unknown>;

  return {
    title: typeof r.title === "string" ? r.title : "Untitled",
    logline: typeof r.logline === "string" ? r.logline : "",
    acts: Array.isArray(r.acts)
      ? r.acts.map((a: unknown) => {
          const act = (a ?? {}) as Record<string, unknown>;
          return {
            label: typeof act.label === "string" ? act.label : "Act",
            scenes: Array.isArray(act.scenes)
              ? act.scenes.filter((s): s is string => typeof s === "string")
              : [],
          };
        })
      : [],
    characters: Array.isArray(r.characters)
      ? r.characters.map((c: unknown) => {
          const ch = (c ?? {}) as Record<string, unknown>;
          return {
            name: typeof ch.name === "string" ? ch.name : "Unknown",
            role: typeof ch.role === "string" ? ch.role : "Character",
            arc: typeof ch.arc === "string" ? ch.arc : "",
          };
        })
      : [],
  };
}

// ─── Dialogue Generation ──────────────────────────────────────────────────────

export async function generateDialogue(
  input: DialogueInput
): Promise<GeneratedDialogueLine[]> {
  const characterList = input.characters.length > 0 ? input.characters.join(", ") : "CHARACTER A, CHARACTER B";

  const languageGuide =
    input.language === "Hindi"
      ? "Write entirely in Hindi (Roman transliteration is acceptable)."
      : input.language === "English"
      ? "Write entirely in English."
      : "Mix Hindi and English naturally as spoken in urban India (Hinglish).";

  const prompt = `You are a professional Bollywood dialogue writer.

Write a cinematic film dialogue for the following scene:
- Characters: ${characterList}
- Scene: ${input.scene}
- Mood: ${input.mood}
- Language: ${input.language} — ${languageGuide}
- Writing Style: ${input.style}

Return ONLY a valid JSON array (no markdown fences, no extra text) with 6 to 8 dialogue exchanges:
[
  {
    "character": "CHARACTER_NAME_IN_CAPS",
    "text": "the spoken dialogue line",
    "emotion": "one or two words describing the character's emotion",
    "direction": "optional parenthetical stage direction — omit the field entirely if not needed"
  }
]`;

  const raw = await callGemini(prompt);
  return parseDialogue(raw);
}

function parseDialogue(raw: unknown): GeneratedDialogueLine[] {
  if (!Array.isArray(raw)) {
    throw new Error("Dialogue generation returned an unexpected structure.");
  }

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      character:
        typeof item.character === "string"
          ? item.character.toUpperCase()
          : "CHARACTER",
      text: typeof item.text === "string" ? item.text : "",
      emotion: typeof item.emotion === "string" && item.emotion ? item.emotion : undefined,
      direction:
        typeof item.direction === "string" && item.direction ? item.direction : undefined,
    }))
    .filter((line) => line.text.trim().length > 0);
}
