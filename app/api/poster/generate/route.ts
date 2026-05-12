import { NextRequest, NextResponse } from "next/server";
import { createClient }             from "@supabase/supabase-js";
import { withCredits }              from "@/lib/credits/withCredits";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

// Server-side Supabase admin client for Storage uploads
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PosterInput {
  title:       string;
  genre:       string;
  mood:        string;
  tagline?:    string;
  style:       string;
  regenerate?: boolean;
}

const GENRE_MAP: Record<string, string> = {
  action:    "action blockbuster, explosive energy, dynamic composition",
  romance:   "romantic drama, soft warm tones, intimate atmosphere",
  thriller:  "psychological thriller, dark tension, suspenseful",
  horror:    "horror film, eerie atmosphere, unsettling shadows",
  comedy:    "light-hearted comedy, vibrant colors, playful",
  drama:     "dramatic film, emotional depth, powerful storytelling",
  sci_fi:    "science fiction, futuristic, neon lights, space",
  fantasy:   "epic fantasy, magical atmosphere, mystical world",
  crime:     "crime noir, moody lighting, urban gritty setting",
  biography: "biographical drama, historical, authentic period detail",
};

const MOOD_MAP: Record<string, string> = {
  dark:       "dark and gritty, deep shadows, high contrast, ominous",
  epic:       "epic and grand, sweeping scale, powerful, cinematic grandeur",
  mysterious: "mysterious and atmospheric, foggy, enigmatic, moody",
  hopeful:    "hopeful and uplifting, warm golden light, inspiring",
  tense:      "tense and suspenseful, cold tones, claustrophobic",
  romantic:   "romantic and dreamy, warm bokeh, soft light, intimate",
};

const STYLE_MAP: Record<string, string> = {
  photorealistic: "photorealistic movie poster, ultra detailed, professional photography, 8K",
  illustrated:    "illustrated movie poster, painterly art style, concept art, digital painting",
  vintage:        "vintage retro movie poster, classic film noir aesthetic, aged paper texture",
  minimalist:     "minimalist movie poster, clean bold design, geometric, modern",
  bollywood:      "Bollywood movie poster, vibrant colors, dramatic lighting, South Asian cinema",
};

function buildPosterPrompt(input: PosterInput): string {
  const genre = GENRE_MAP[input.genre]  ?? input.genre;
  const mood  = MOOD_MAP[input.mood]    ?? input.mood;
  const style = STYLE_MAP[input.style]  ?? input.style;

  // Title/tagline are rendered as a crisp CSS/Canvas overlay on the frontend.
  // Asking FLUX to render text produces blurry/garbled results, so we omit it
  // from the prompt entirely and focus purely on the visual composition.
  return (
    `${style}, ${genre}, ${mood}, ` +
    `cinematic movie poster composition, no text, no words, no letters, ` +
    `dramatic hero shot, professional movie poster layout, ` +
    `cinematic lighting, award-winning poster design, ` +
    `high quality, masterpiece, 8K`
  );
}

async function fetchAndUpload(
  imageUrl: string,
  userId: string,
  title: string
): Promise<string | null> {
  try {
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) return null;

    const buffer    = await imgResp.arrayBuffer();
    const fileName  = `${userId}/${Date.now()}-${title.replace(/\s+/g, "-").toLowerCase().slice(0, 40)}.jpg`;

    const { error } = await supabaseAdmin.storage
      .from("posters")
      .upload(fileName, buffer, {
        contentType:  "image/jpeg",
        cacheControl: "3600",
        upsert:       false,
      });

    if (error) {
      console.error("Storage upload error:", error.message);
      return null;
    }

    const { data } = supabaseAdmin.storage.from("posters").getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}

export const POST = withCredits("poster_generate", async (req: NextRequest, userId: string) => {
  let body: Partial<PosterInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.title?.trim() || !body.genre || !body.mood || !body.style) {
    return NextResponse.json(
      { error: "title, genre, mood, and style are required." },
      { status: 400 }
    );
  }

  const prompt = buildPosterPrompt(body as PosterInput);
  const seed   = Math.floor(Math.random() * 1_000_000);

  // Portrait ratio (2:3) — standard movie poster dimensions
  const pollinationsUrl =
    `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}` +
    `?model=flux&width=800&height=1200&seed=${seed}&nologo=true`;

  // Fetch + store in Supabase Storage (best-effort; falls back to direct URL)
  const storedUrl = await fetchAndUpload(pollinationsUrl, userId, body.title.trim());
  const imageUrl  = storedUrl ?? pollinationsUrl;

  return NextResponse.json({
    imageUrl,
    prompt,
    stored: !!storedUrl,
  });
});
