import { NextRequest, NextResponse } from "next/server";

// Pollinations.ai — free, no-auth FLUX image generation.
// We return the URL directly so the browser fetches the image itself,
// avoiding Cloudflare Worker's 30-second fetch timeout.
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

interface VisualizeInput {
  scene: string;
  style: string;
  mood: string;
}

function buildPrompt(scene: string, style: string, mood: string): string {
  const styleMap: Record<string, string> = {
    cinematic: "cinematic film still, anamorphic lens, shallow depth of field, 35mm film grain",
    realistic: "photorealistic, ultra-detailed, DSLR photo, natural lighting, sharp focus",
    anime: "anime style, vibrant colors, hand-drawn aesthetic, studio ghibli, detailed illustration",
  };
  const moodMap: Record<string, string> = {
    dark: "dark moody atmosphere, low-key dramatic lighting, deep shadows, noir",
    romantic: "warm golden hour lighting, soft bokeh, intimate and tender",
    thriller: "high tension, cold desaturated tones, sharp contrast, suspenseful",
    dramatic: "epic dramatic lighting, powerful composition, intense, cinematic",
  };

  const styleDesc = styleMap[style] ?? style;
  const moodDesc = moodMap[mood] ?? mood;

  return `${moodDesc}, ${styleDesc}: ${scene}. Highly detailed, professional grade, award-winning photography, cinematic composition`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<VisualizeInput>;

    if (!body.scene?.trim() || !body.style || !body.mood) {
      return NextResponse.json(
        { error: "scene, style, and mood are required." },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(body.scene.trim(), body.style, body.mood);
    const seed = Math.floor(Math.random() * 1_000_000);

    // Build the Pollinations URL and return it — the browser loads the image directly.
    // This avoids proxying a large binary through the Worker (which would time out).
    const imageUrl = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?model=flux&width=1024&height=576&seed=${seed}&nologo=true`;

    return NextResponse.json({ imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build image request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
