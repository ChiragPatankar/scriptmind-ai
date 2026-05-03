import { NextRequest, NextResponse }                    from "next/server";
import { expandToFullScript, type StoryOutline }        from "@/lib/gemini-api";
import { withCredits }                                  from "@/lib/credits/withCredits";

export const POST = withCredits("script_expand", async (req: NextRequest) => {
  try {
    const body = await req.json() as {
      outline?: StoryOutline;
      genre?: string;
      tone?: string;
      setting?: string;
      language?: string;
    };

    if (!body.outline?.title || !body.outline?.acts?.length) {
      return NextResponse.json(
        { error: "A valid story outline (title + acts) is required." },
        { status: 400 }
      );
    }

    const script = await expandToFullScript(body.outline, {
      genre:    body.genre    ?? "Drama",
      tone:     body.tone     ?? "Intense",
      setting:  body.setting  ?? "India",
      language: body.language ?? "Hinglish",
    });

    return NextResponse.json(script);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Script expansion failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
