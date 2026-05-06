import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_ADDRESS = "ScriptMind AI <no-reply@tenthdimensions.in>";

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    email?: string;
    raw_user_meta_data?: {
      full_name?: string;
      name?: string;
      email?: string;
    };
  };
  schema: string;
}

serve(async (req: Request) => {
  // Verify this is a POST from Supabase webhook
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify webhook secret to prevent unauthorised calls
  const webhookSecret = Deno.env.get("WELCOME_WEBHOOK_SECRET");
  if (webhookSecret) {
    const authHeader = req.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Only handle INSERT events on auth.users
  if (payload.type !== "INSERT") {
    return new Response("Ignored", { status: 200 });
  }

  const record = payload.record;
  const email =
    record.email ??
    record.raw_user_meta_data?.email;

  if (!email) {
    console.error("No email found in webhook payload", record);
    return new Response("No email", { status: 200 });
  }

  const fullName =
    record.raw_user_meta_data?.full_name ??
    record.raw_user_meta_data?.name ??
    email.split("@")[0];

  const firstName = fullName.split(" ")[0];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ScriptMind AI</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;overflow:hidden;border:1px solid #222;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🎬 ScriptMind AI</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);">AI-Powered Cinema Intelligence</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">Welcome, ${firstName}! 🎉</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#a3a3a3;">
                Your ScriptMind AI account is ready. You now have access to a full suite of AI-powered tools built for filmmakers, writers, and producers.
              </p>

              <!-- Feature list -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 16px;background:#1a1a1a;border-radius:10px;margin-bottom:8px;border-left:3px solid #7c3aed;">
                    <p style="margin:0;font-size:14px;color:#e5e5e5;">✍️ <strong>Script Analysis</strong> — Deep AI feedback on your screenplay</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#1a1a1a;border-radius:10px;border-left:3px solid #db2777;">
                    <p style="margin:0;font-size:14px;color:#e5e5e5;">📖 <strong>Create Story</strong> — Generate full story outlines & screenplays</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#1a1a1a;border-radius:10px;border-left:3px solid #0891b2;">
                    <p style="margin:0;font-size:14px;color:#e5e5e5;">💬 <strong>AI Dialogue</strong> — Craft character-driven dialogues with psychology</p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#1a1a1a;border-radius:10px;border-left:3px solid #16a34a;">
                    <p style="margin:0;font-size:14px;color:#e5e5e5;">💰 <strong>Finance Studio</strong> — Project box office revenue & ROI</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="https://scriptmindai.in/projects"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#7c3aed,#db2777);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                      Start Creating →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#525252;line-height:1.6;">
                You're on the <strong style="color:#7c3aed;">Free plan</strong>. Upgrade anytime to unlock more credits and advanced features.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #222;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#404040;">ScriptMind AI · Made with ❤️ for filmmakers</p>
              <p style="margin:0;font-size:12px;color:#404040;">
                <a href="https://scriptmindai.in" style="color:#7c3aed;text-decoration:none;">scriptmindai.in</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [email],
      subject: `Welcome to ScriptMind AI, ${firstName}! 🎬`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    return new Response(`Email failed: ${err}`, { status: 500 });
  }

  const data = await res.json();
  console.log("Welcome email sent:", data.id, "→", email);
  return new Response(JSON.stringify({ success: true, id: data.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
