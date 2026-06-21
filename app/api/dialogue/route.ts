import { NextRequest, NextResponse }              from "next/server";
import { generateDialogue, type DialogueInput }   from "@/lib/gemini-api";
import { withCredits }                            from "@/lib/credits/withCredits";

export const POST = withCredits("dialogue", async (req: NextRequest) => {
  try {
    const body = (await req.json()) as Partial<DialogueInput>;

    if (!body.scene) {
      return NextResponse.json(
        { error: "scene is required." },
        { status: 400 }
      );
    }

    const lines = await generateDialogue({
      characters:        Array.isArray(body.characters) ? body.characters : [],
      characterProfiles: Array.isArray(body.characterProfiles) ? body.characterProfiles : undefined,
      scene:             body.scene,
      moods:             Array.isArray(body.moods) ? body.moods : [],
      writingStyle:      typeof body.writingStyle === "string" ? body.writingStyle : "",
      language:          typeof body.language === "string" && body.language ? body.language : "Hinglish",
      subtext:           typeof body.subtext === "string" ? body.subtext : undefined,
      dialogueLength:    body.dialogueLength as "short" | "medium" | "long" | undefined,
    });

    return NextResponse.json(lines);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dialogue generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
