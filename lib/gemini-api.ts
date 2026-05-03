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

export interface CharacterProfile {
  name: string;
  age?: string;
  role?: string;           // protagonist | antagonist | supporting | love interest
  personality?: string[];  // e.g. ["sarcastic","reserved","impulsive"]
  emotionalState?: string; // what they're feeling in THIS scene
  speechPattern?: string;  // formal | casual | poetic | street slang | broken
}

export interface DialogueInput {
  characters: string[];
  characterProfiles?: CharacterProfile[];
  scene: string;
  mood: string;
  language: string;
  style: string;
  subtext?: string;         // underlying tension / hidden motivation
  dialogueLength?: "short" | "medium" | "long"; // 4-5 / 8-10 / 12-15 lines
}

export interface GeneratedDialogueLine {
  character: string;
  text: string;
  emotion?: string;
  direction?: string;
}

// ─── Core Gemini Caller ───────────────────────────────────────────────────────

async function callGemini(
  prompt: string,
  opts: { maxOutputTokens?: number; temperature?: number } = {}
): Promise<unknown> {
  const key = getGeminiApiKey();
  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: opts.temperature ?? 0.9,
        topP: 0.95,
        maxOutputTokens: opts.maxOutputTokens ?? 8192,
      },
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    candidates?: {
      content?: { parts?: { text?: string }[] };
      finishReason?: string;
    }[];
  };

  if (!res.ok) {
    const message = payload.error?.message ?? `Gemini API error (${res.status})`;
    throw new Error(message);
  }

  const candidate  = payload.candidates?.[0];
  const text       = candidate?.content?.parts?.[0]?.text ?? "";
  const finishReason = candidate?.finishReason ?? "";

  // Try direct parse first, then always attempt repair before giving up
  try {
    return JSON.parse(text);
  } catch {
    const recovered = repairTruncatedJson(text);
    if (recovered !== null) return recovered;
    throw new Error(`Gemini returned invalid JSON (finishReason: ${finishReason}). Raw: ${text.slice(0, 300)}`);
  }
}

/**
 * Best-effort repair of a JSON string that was cut off mid-generation.
 * Handles: trailing commas, unclosed strings, unclosed arrays/objects.
 */
function repairTruncatedJson(raw: string): unknown | null {
  let text = raw.trim();

  // 1. If the text ends inside an unclosed string literal, close it
  //    e.g. `"dialogue": "She walked away` → add closing `"`
  let inStr = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped)               { escaped = false; continue; }
    if (ch === "\\" && inStr)  { escaped = true; continue; }
    if (ch === '"')            { inStr = !inStr; }
  }
  if (inStr) text += '"'; // close the dangling string

  // 2. Strip any trailing comma (now that strings are closed)
  text = text.replace(/,\s*$/, "");

  // 3. Close unclosed brackets / braces
  const stack: string[] = [];
  let inString = false; let esc = false;
  for (const ch of text) {
    if (esc)                    { esc = false; continue; }
    if (ch === "\\" && inString){ esc = true; continue; }
    if (ch === '"')             { inString = !inString; continue; }
    if (inString)               { continue; }
    if (ch === "{" || ch === "[") stack.push(ch);
    if (ch === "}" || ch === "]") stack.pop();
  }
  for (let i = stack.length - 1; i >= 0; i--) {
    text += stack[i] === "{" ? "}" : "]";
  }

  // 4. Remove trailing commas that ended up just before a closing bracket
  //    e.g.  ,"heading":"INT. SCENE",}  →  ,"heading":"INT. SCENE"}
  text = text.replace(/,(\s*[}\]])/g, "$1");

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ─── Story Outline ────────────────────────────────────────────────────────────

export async function generateStoryOutline(input: StoryInput): Promise<StoryOutline> {
  const prompt = `You are a professional cinematic screenwriter.

Generate a concise story outline based on the details below:
- Title: ${input.title || "Untitled"}
- Premise: ${input.premise || "A compelling story."}
- Genre: ${input.genre}
- Tone: ${input.tone}
- Setting: ${input.setting}

IMPORTANT — keep all strings SHORT and CONCISE (max 25 words per scene, max 40 words per arc).

Return ONLY valid JSON (no markdown fences, no extra text) matching this EXACT schema — include all closing brackets:
{"title":"string","logline":"one sentence max 40 words","acts":[{"label":"Act I — Setup","scenes":["scene 1","scene 2","scene 3"]},{"label":"Act II — Confrontation","scenes":["scene 1","scene 2","scene 3"]},{"label":"Act III — Resolution","scenes":["scene 1","scene 2","scene 3"]}],"characters":[{"name":"Name","role":"Protagonist","arc":"brief arc"},{"name":"Name","role":"Antagonist","arc":"brief arc"},{"name":"Name","role":"Supporting","arc":"brief arc"}]}`;

  const raw = await callGemini(prompt, { maxOutputTokens: 32768, temperature: 0.85 });
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
  const characterList =
    input.characters.length > 0 ? input.characters.join(", ") : "CHARACTER A, CHARACTER B";

  const languageGuide =
    input.language === "Hindi"
      ? "Write entirely in Hindi (Roman transliteration is acceptable)."
      : input.language === "English"
      ? "Write entirely in English."
      : input.language === "Tamil"
      ? "Write in Tamil (Roman transliteration is acceptable)."
      : input.language === "Telugu"
      ? "Write in Telugu (Roman transliteration is acceptable)."
      : "Mix Hindi and English naturally as spoken in urban India (Hinglish).";

  const lineRange =
    input.dialogueLength === "short"  ? "4 to 5"  :
    input.dialogueLength === "long"   ? "12 to 15" : "8 to 10";

  // Build rich character profiles section
  const profileLines = (input.characterProfiles ?? [])
    .filter((p) => p.name)
    .map((p) => {
      const parts = [`  • ${p.name.toUpperCase()}`];
      if (p.age)            parts.push(`age ${p.age}`);
      if (p.role)           parts.push(`role: ${p.role}`);
      if (p.emotionalState) parts.push(`emotional state: ${p.emotionalState}`);
      if (p.personality?.length) parts.push(`personality: ${p.personality.join(", ")}`);
      if (p.speechPattern)  parts.push(`speech: ${p.speechPattern}`);
      return parts.join(" | ");
    })
    .join("\n");

  const characterSection = profileLines
    ? `Character profiles:\n${profileLines}`
    : `Characters: ${characterList}`;

  const subtextLine = input.subtext?.trim()
    ? `- Subtext / underlying tension: ${input.subtext}`
    : "";

  const prompt = `You are a professional cinematic dialogue writer with expertise in Indian film, OTT, and international screenwriting.

Write a compelling, authentic film dialogue for the following scene. Each character must speak in a distinctly different voice that reflects their personality, emotional state, and speech pattern.

${characterSection}
- Scene: ${input.scene}
- Mood: ${input.mood}
- Language: ${input.language} — ${languageGuide}
- Writing Style: ${input.style}
${subtextLine}

Rules:
- Each character's lines must feel distinct — different vocabulary, rhythm, and emotional register
- If a speech pattern is specified, honour it strictly
- Emotional states should be reflected in the subtext and delivery, not stated explicitly
- Include meaningful stage directions only when they add cinematic value
- Language must feel natural and era-appropriate — avoid clichés

Return ONLY a valid JSON array (no markdown fences, no extra text) with ${lineRange} dialogue exchanges:
[
  {
    "character": "CHARACTER_NAME_IN_CAPS",
    "text": "the spoken dialogue line",
    "emotion": "one or two words describing the character's inner emotion",
    "direction": "optional parenthetical stage direction — omit the field entirely if not needed"
  }
]`;

  const raw = await callGemini(prompt);
  return parseDialogue(raw);
}

// ─── Full Script Expansion ────────────────────────────────────────────────────

export interface ScriptExchange {
  character: string;
  dialogue: string;
  direction?: string;
}

export interface ScriptScene {
  heading: string;   // e.g. "INT. COFFEE SHOP - DAY"
  action: string;    // action / description block
  exchanges: ScriptExchange[];
}

export interface FullScript {
  title: string;
  genre: string;
  logline: string;
  scenes: ScriptScene[];
}

export async function expandToFullScript(
  outline: StoryOutline,
  meta: { genre: string; tone: string; setting: string; language?: string }
): Promise<FullScript> {
  const actSummary = outline.acts
    .map((a) => `${a.label}: ${a.scenes.join(" | ")}`)
    .join("\n");
  const charSummary = outline.characters
    .map((c) => `${c.name} (${c.role}): ${c.arc}`)
    .join("\n");

  const langNote =
    meta.language === "Hindi"
      ? "Write dialogue in Hindi (Roman script acceptable)."
      : meta.language === "Tamil"
      ? "Write dialogue in Tamil (Roman script acceptable)."
      : "Mix Hindi and English naturally (Hinglish) for dialogue.";

  const prompt = `You are a professional ${meta.genre} screenwriter.

Using the story outline below, write a COMPLETE feature-length screenplay excerpt covering all three acts.

STORY OUTLINE:
Title: ${outline.title}
Logline: ${outline.logline}
Genre: ${meta.genre} | Tone: ${meta.tone} | Setting: ${meta.setting}

ACTS:
${actSummary}

CHARACTERS:
${charSummary}

LANGUAGE NOTE: ${langNote}

Generate 9 to 12 screenplay scenes — 3 to 4 scenes per act. Each scene must have a proper scene heading (INT./EXT.), action lines, and dialogue exchanges.

Return ONLY valid JSON (no markdown, no fences) matching this EXACT compact schema:
{"title":"string","genre":"string","logline":"string","scenes":[{"heading":"INT. LOCATION - DAY","action":"brief action block max 30 words","exchanges":[{"character":"NAME","dialogue":"line","direction":"optional stage direction or omit"}]}]}

RULES:
- Keep action blocks concise (max 30 words each)
- Each scene must have 2 to 5 dialogue exchanges
- Scene headings must follow proper screenplay format (INT./EXT. LOCATION - TIME)
- Characters must speak distinctly based on their arcs`;

  const raw = await callGemini(prompt, { maxOutputTokens: 65536, temperature: 0.85 });
  return parseFullScript(raw, outline, meta.genre);
}

function parseFullScript(raw: unknown, outline: StoryOutline, genre: string): FullScript {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Full script generation returned an unexpected structure.");
  }
  const r = raw as Record<string, unknown>;

  const scenes: ScriptScene[] = Array.isArray(r.scenes)
    ? r.scenes
        .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
        .map((s) => ({
          heading: typeof s.heading === "string" ? s.heading : "INT. LOCATION - DAY",
          action:  typeof s.action  === "string" ? s.action  : "",
          exchanges: Array.isArray(s.exchanges)
            ? s.exchanges
                .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
                .map((e) => ({
                  character: typeof e.character === "string" ? e.character.toUpperCase() : "CHARACTER",
                  dialogue:  typeof e.dialogue  === "string" ? e.dialogue  : "",
                  direction: typeof e.direction === "string" && e.direction ? e.direction : undefined,
                }))
                .filter((e) => e.dialogue.trim().length > 0)
            : [],
        }))
    : [];

  return {
    title:   typeof r.title   === "string" ? r.title   : outline.title,
    genre:   typeof r.genre   === "string" ? r.genre   : genre,
    logline: typeof r.logline === "string" ? r.logline : outline.logline,
    scenes,
  };
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
