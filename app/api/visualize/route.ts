import { NextRequest, NextResponse } from "next/server";

// Pollinations.ai — free, no-auth FLUX/SD image generation
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

    // GET request — Pollinations returns the image as raw bytes
    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?model=flux&width=1024&height=576&seed=${seed}&nologo=true&enhance=true`;

    const imgRes = await fetch(url, {
      method: "GET",
      // Cloudflare Workers timeout: give Pollinations up to 60s
      signal: AbortSignal.timeout(60_000),
    });

    if (!imgRes.ok) {
      const errText = await imgRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Image generation failed (${imgRes.status}): ${errText.slice(0, 200)}` },
        { status: imgRes.status }
      );
    }

    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return NextResponse.json({ images: [base64] });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Image generation timed out. Please try again." },
        { status: 504 }
      );
    }
    const message = err instanceof Error ? err.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
