/**
 * Regenerate a poster with the same inputs but a new random seed.
 * Costs 5 credits (cheaper than first-time generate).
 */
import { NextRequest, NextResponse } from "next/server";
import { withCredits }              from "@/lib/credits/withCredits";

// Re-export the same logic — the only difference is the Feature key used for billing.
// We import the handler factory from the generate route's shared helper.

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

export const POST = withCredits("poster_regenerate", async (req: NextRequest) => {
  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "prompt is required for regeneration." }, { status: 400 });
  }

  const seed     = Math.floor(Math.random() * 1_000_000);
  const imageUrl =
    `${POLLINATIONS_BASE}/${encodeURIComponent(body.prompt)}` +
    `?model=flux&width=800&height=1200&seed=${seed}&nologo=true`;

  return NextResponse.json({ imageUrl });
});
