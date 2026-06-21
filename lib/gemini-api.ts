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
  themes: string[];
  tones: string[];
  moods: string[];
  targetAudience: string[];
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
  moods: string[];          // emotional layers of the scene (multi-select)
  writingStyle: string;     // single dominant writing style
  language: string;         // single target language (strictly respected)
  subtext?: string;         // underlying tension / hidden motivation
  dialogueLength?: "short" | "medium" | "long"; // 4-5 / 8-10 / 12-15 lines
}

/** Per-language guidance — the chosen language is strictly enforced in output. */
const LANGUAGE_GUIDES: Record<string, string> = {
  Hindi:     "Write the dialogue entirely in Hindi (Devanagari or Roman transliteration is acceptable).",
  English:   "Write the dialogue entirely in English.",
  Hinglish:  "Write a natural Hindi-English conversational mix as spoken in urban India (Hinglish).",
  Tamil:     "Write the dialogue entirely in Tamil (Roman transliteration is acceptable).",
  Telugu:    "Write the dialogue entirely in Telugu (Roman transliteration is acceptable).",
  Marathi:   "Write the dialogue entirely in Marathi (Roman transliteration is acceptable).",
  Bengali:   "Write the dialogue entirely in Bengali (Roman transliteration is acceptable).",
  Kannada:   "Write the dialogue entirely in Kannada (Roman transliteration is acceptable).",
  Malayalam: "Write the dialogue entirely in Malayalam (Roman transliteration is acceptable).",
  Punjabi:   "Write the dialogue entirely in Punjabi (Roman transliteration is acceptable).",
  Gujarati:  "Write the dialogue entirely in Gujarati (Roman transliteration is acceptable).",
  Urdu:      "Write the dialogue entirely in Urdu (Roman transliteration is acceptable).",
};

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

  // Try direct parse first, then sanitize + repair before giving up
  try {
    return JSON.parse(text);
  } catch {
    // Sanitize curly/smart quotes and unescaped straight quotes inside string values
    const sanitized = sanitizeGeminiJson(text);
    try {
      return JSON.parse(sanitized);
    } catch {
      const recovered = repairTruncatedJson(sanitized);
      if (recovered !== null) return recovered;
      throw new Error(`Gemini returned invalid JSON (finishReason: ${finishReason}). Raw: ${text.slice(0, 300)}`);
    }
  }
}

/**
 * Sanitizes common Gemini JSON quirks before parsing:
 * 1. Replaces curly/smart quote characters with straight ASCII quotes
 * 2. Escapes unescaped straight double-quotes that appear inside JSON string values
 */
function sanitizeGeminiJson(raw: string): string {
  // Replace Unicode curly/fancy quotes with ASCII equivalents
  const text = raw
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // curly double quotes → "
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'"); // curly single quotes → '

  // Fix unescaped double-quotes inside JSON string values.
  // Strategy: scan char-by-char tracking whether we're inside a JSON string,
  // and if we find a `"` that isn't opening/closing the string, escape it.
  const out: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      out.push(ch);
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out.push(ch);
      escaped = true;
      continue;
    }
    if (ch === '"') {
      if (!inString) {
        // Opening quote of a JSON string (or structural quote)
        inString = true;
        out.push(ch);
      } else {
        // Could be closing quote OR an unescaped " inside the string.
        // Peek ahead: if next non-space char is one of ,:}] then it's a closing quote.
        let j = i + 1;
        while (j < text.length && (text[j] === " " || text[j] === "\t" || text[j] === "\n" || text[j] === "\r")) j++;
        const next = text[j];
        if (next === "," || next === ":" || next === "}" || next === "]" || j >= text.length) {
          // Closing quote
          inString = false;
          out.push(ch);
        } else {
          // Unescaped quote inside a string value — escape it
          out.push('\\"');
        }
      }
      continue;
    }
    out.push(ch);
  }

  return out.join("");
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
  const themeLine    = input.themes.length ? input.themes.join(", ") : "Director's choice";
  const toneLine     = input.tones.length ? input.tones.join(", ") : "Director's choice";
  const moodLine     = input.moods.length ? input.moods.join(", ") : "Director's choice";
  const audienceLine = input.targetAudience.length ? input.targetAudience.join(", ") : "General audience";

  const directionLines: string[] = [];
  if (input.themes.length)
    directionLines.push(`- Let the selected THEMES (${themeLine}) drive plot development, character motivations, conflict design, the emotional arc, and how the story ends.`);
  if (input.tones.length)
    directionLines.push(`- Let the selected TONE(S) (${toneLine}) shape pacing, emotional flow, dialogue style, narrative structure, and the ending tone; blend multiple tones coherently.`);
  if (input.targetAudience.length)
    directionLines.push(`- Tailor language complexity, pacing, emotional depth, commercial positioning, and story structure to the TARGET AUDIENCE (${audienceLine}).`);
  const directionBlock = directionLines.length
    ? `\nCREATIVE DIRECTION:\n${directionLines.join("\n")}\n`
    : "";

  const prompt = `You are a professional cinematic screenwriter.

Generate a concise story outline based on the details below:
- Title: ${input.title || "Untitled"}
- Premise: ${input.premise || "A compelling story."}
- Genre: ${input.genre}
- Themes: ${themeLine}
- Tone: ${toneLine}
- Mood: ${moodLine}
- Target Audience: ${audienceLine}
- Setting: ${input.setting}
${directionBlock}
IMPORTANT — keep all strings SHORT and CONCISE (max 25 words per scene, max 40 words per arc).
CRITICAL — never use double-quote characters (") inside any string value. Use single quotes (') if quoting is needed within text.

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
    LANGUAGE_GUIDES[input.language] ??
    `Write the dialogue entirely in ${input.language}.`;

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

  const moodLine  = input.moods.length ? input.moods.join(", ") : "Director's choice";
  const styleLine = input.writingStyle?.trim() ? input.writingStyle : "Director's choice";

  const prompt = `You are a professional cinematic dialogue writer with expertise in Indian film, OTT, and international screenwriting.

Write a compelling, authentic film dialogue for the following scene. Each character must speak in a distinctly different voice that reflects their personality, emotional state, and speech pattern.

${characterSection}
- Scene: ${input.scene}
- Mood(s): ${moodLine}
- Writing Style: ${styleLine}
- Language: ${input.language} — ${languageGuide}
${subtextLine}

Rules:
- Each character's lines must feel distinct — different vocabulary, rhythm, and emotional register
- If a speech pattern is specified, honour it strictly
- Emotional states should be reflected in the subtext and delivery, not stated explicitly
- Include meaningful stage directions only when they add cinematic value
- The MOOD(S) (${moodLine}) must drive emotional delivery, pacing, word choice, scene tension, and dialogue realism — blend multiple moods as emotional layers within the scene
- The WRITING STYLE (${styleLine}) must shape sentence structure, dialogue rhythm, realism level, and cinematic quality (e.g. Natural/Realistic = grounded, understated; Cinematic = heightened, vivid; Commercial = punchy, crowd-pleasing; Poetic = lyrical; Action-Packed = terse, kinetic; Classical = formal, measured; Satirical = wry, pointed)
- LANGUAGE IS STRICT: ${languageGuide} Use slang, idioms, cultural references, and conversational patterns authentic to that language and its speakers. Do not switch languages unless the language is Hinglish.

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
  meta: {
    genre: string;
    themes?: string[];
    tones: string[];
    moods?: string[];
    targetAudience?: string[];
    setting: string;
    language?: string;
  }
): Promise<FullScript> {
  const themeLine    = meta.themes?.length ? meta.themes.join(", ") : "Director's choice";
  const toneLine     = meta.tones.length ? meta.tones.join(", ") : "Director's choice";
  const moodLine     = meta.moods?.length ? meta.moods.join(", ") : "Director's choice";
  const audienceLine = meta.targetAudience?.length ? meta.targetAudience.join(", ") : "General audience";
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
Genre: ${meta.genre} | Themes: ${themeLine} | Tone: ${toneLine} | Mood: ${moodLine} | Target Audience: ${audienceLine} | Setting: ${meta.setting}

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
