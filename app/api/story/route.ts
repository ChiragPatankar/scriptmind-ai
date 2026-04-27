import { NextRequest, NextResponse }            from "next/server";
import { generateStoryOutline, type StoryInput } from "@/lib/gemini-api";
import { withCredits }                           from "@/lib/credits/withCredits";

export const POST = withCredits("story_generation", async (req: NextRequest) => {
  try {
    const body = (await req.json()) as Partial<StoryInput>;

    if (!body.genre || !body.tone || !body.setting) {
      return NextResponse.json(
        { error: "genre, tone, and setting are required." },
        { status: 400 }
      );
    }

    const outline = await generateStoryOutline({
      title:   body.title   ?? "",
      premise: body.premise ?? "",
      genre:   body.genre,
      tone:    body.tone,
      setting: body.setting,
    });

    return NextResponse.json(outline);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Story generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
