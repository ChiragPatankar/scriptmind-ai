import { NextRequest, NextResponse } from "next/server";

const HF_API_URL =
  "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2";

interface VisualizeInput {
  scene: string;
  style: string;
  mood: string;
}

function buildPrompt(scene: string, style: string, mood: string): string {
  const styleMap: Record<string, string> = {
    cinematic: "cinematic film still, anamorphic lens, shallow depth of field, 35mm",
    realistic: "photorealistic, ultra-detailed, DSLR photo, natural lighting",
    anime: "anime style, vibrant colors, hand-drawn aesthetic, studio ghibli inspired",
  };
  const moodMap: Record<string, string> = {
    dark: "dark, moody, low-key lighting, shadows, noir atmosphere",
    romantic: "warm golden hour lighting, soft bokeh, intimate, tender",
    thriller: "high tension, cold blue tones, sharp contrast, suspenseful",
    dramatic: "dramatic lighting, epic composition, powerful, intense",
  };

  const styleDesc = styleMap[style] ?? style;
  const moodDesc = moodMap[mood] ?? mood;

  return [
    `${moodDesc} ${styleDesc} scene:`,
    scene,
    "highly detailed, cinematic composition, professional grade, sharp focus, high resolution, award-winning photography",
  ].join(" ");
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

    const token = process.env.HF_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "HF_API_TOKEN is not configured on the server. Add it to .env.local." },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(body.scene.trim(), body.style, body.mood);

    const hfRes = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    // HF returns 503 while the model cold-starts
    if (hfRes.status === 503) {
      return NextResponse.json(
        {
          error:
            "The Stable Diffusion model is warming up. Wait ~20 seconds and try again.",
        },
        { status: 503 }
      );
    }

    if (!hfRes.ok) {
      const errText = await hfRes.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Hugging Face API error (${hfRes.status}): ${errText.slice(0, 300)}`,
        },
        { status: hfRes.status }
      );
    }

    // Response is a raw binary image blob
    const buffer = await hfRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return NextResponse.json({ images: [base64] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
