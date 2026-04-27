import { NextRequest, NextResponse }              from "next/server";
import { generateDialogue, type DialogueInput }   from "@/lib/gemini-api";
import { withCredits }                            from "@/lib/credits/withCredits";

export const POST = withCredits("dialogue", async (req: NextRequest) => {
  try {
    const body = (await req.json()) as Partial<DialogueInput>;

    if (!body.scene || !body.mood || !body.language || !body.style) {
      return NextResponse.json(
        { error: "scene, mood, language, and style are required." },
        { status: 400 }
      );
    }

    const lines = await generateDialogue({
      characters: Array.isArray(body.characters) ? body.characters : [],
      scene:      body.scene,
      mood:       body.mood,
      language:   body.language,
      style:      body.style,
    });

    return NextResponse.json(lines);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dialogue generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
