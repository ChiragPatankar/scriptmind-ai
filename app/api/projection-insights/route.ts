import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL    = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const {
      genre, platform, starPower, marketing, timing, audienceType,
      scriptQualityScore, isExceptionalMovie,
      finalMultiplier, finalRevenue, totalExpenses,
      breakEvenWeek, breakEvenAchieved, weightedScore,
    } = body;

    // Minimal prompt — intentionally terse to keep token cost very low
    const prompt = `
You are a film industry analyst. Given this revenue projection summary, return exactly 4 brief strategic insights (1-2 sentences each). Be specific and actionable. Do NOT repeat the numbers already shown. Focus on risks, opportunities, and release strategy.

Film data:
- Genre: ${genre} | Platform: ${platform} | Star: ${starPower} | Marketing: ${marketing}
- Timing: ${timing} | Audience: ${audienceType} | Script score: ${scriptQualityScore}/10
- Exceptional: ${isExceptionalMovie}
- Final multiplier: ${finalMultiplier?.toFixed(2)}× | Revenue: ₹${finalRevenue?.toFixed(2)} Cr
- Total spend: ₹${totalExpenses?.toFixed(2)} Cr | Break-even: ${breakEvenAchieved ? `Week ${breakEvenWeek}` : "Not achieved in run"}
- Weighted score: ${(weightedScore * 100)?.toFixed(1)}%

Return ONLY a JSON array of 4 strings. Example: ["insight 1", "insight 2", "insight 3", "insight 4"]
`.trim();

    const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 400,   // intentionally very low to save credits
          temperature: 0.4,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

    let insights: string[] = [];
    try {
      insights = JSON.parse(raw);
      if (!Array.isArray(insights)) insights = [];
    } catch {
      insights = [];
    }

    return NextResponse.json({ insights });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
