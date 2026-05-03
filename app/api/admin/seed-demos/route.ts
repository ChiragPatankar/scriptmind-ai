/**
 * POST /api/admin/seed-demos
 *
 * Creates 3 demo accounts (free / basic / pro) and sets their credits/plans.
 * Protected by SEED_SECRET env var — never call this from the browser.
 *
 * Usage:
 *   curl -X POST https://your-app.workers.dev/api/admin/seed-demos \
 *        -H "x-seed-token: <SEED_SECRET>"
 *
 * Idempotent: safe to call multiple times — uses upsert everywhere.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// ── Demo account definitions ──────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  {
    email:             "demo.free@scriptmind.ai",
    password:          "DemoFree@123",
    full_name:         "Demo Free",
    plan:              "free" as const,
    credits:           20,
    finance_trial_used: false,
  },
  {
    email:             "demo.basic@scriptmind.ai",
    password:          "DemoBasic@123",
    full_name:         "Demo Basic",
    plan:              "basic" as const,
    credits:           250,
    finance_trial_used: false,
  },
  {
    email:             "demo.pro@scriptmind.ai",
    password:          "DemoPro@123",
    full_name:         "Demo Pro",
    plan:              "pro" as const,
    credits:           700,
    finance_trial_used: false,
  },
] as const;

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Guard: require seed token
  const secret = process.env.SEED_SECRET?.trim();
  const token  = request.headers.get("x-seed-token")?.trim();

  if (!secret) {
    return NextResponse.json(
      { error: "SEED_SECRET env var is not configured on this server." },
      { status: 500 }
    );
  }
  if (!token || token !== secret) {
    return NextResponse.json({ error: "Forbidden — invalid seed token." }, { status: 403 });
  }

  const admin   = createAdminClient();
  const results: Array<{ email: string; status: string; id?: string; error?: string }> = [];

  for (const account of DEMO_ACCOUNTS) {
    // 1. Create (or get existing) auth user via admin API
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email:              account.email,
      password:           account.password,
      email_confirm:      true,   // skip email confirmation for demo accounts
      user_metadata:      { full_name: account.full_name },
    });

    let userId: string | undefined;

    if (createErr) {
      // If user already exists, look them up
      if (createErr.message?.toLowerCase().includes("already")) {
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users?.find((u) => u.email === account.email);
        userId = existing?.id;
      } else {
        results.push({ email: account.email, status: "error", error: createErr.message });
        continue;
      }
    } else {
      userId = created.user?.id;
    }

    if (!userId) {
      results.push({ email: account.email, status: "error", error: "Could not resolve user id" });
      continue;
    }

    // 2. Upsert into public.users with correct plan + credits
    const { error: userErr } = await admin
      .from("users")
      .upsert({
        id:                 userId,
        email:              account.email,
        plan:               account.plan,
        credits:            account.credits,
        finance_trial_used: account.finance_trial_used,
      }, { onConflict: "id" });

    if (userErr) {
      results.push({ email: account.email, status: "users_upsert_error", id: userId, error: userErr.message });
      continue;
    }

    // 3. Upsert into public.profiles
    await admin
      .from("profiles")
      .upsert({
        id:        userId,
        email:     account.email,
        full_name: account.full_name,
      }, { onConflict: "id" });

    results.push({ email: account.email, status: "ok", id: userId });
  }

  const allOk = results.every((r) => r.status === "ok");

  return NextResponse.json({
    success: allOk,
    results,
    summary: {
      created: results.filter((r) => r.status === "ok").length,
      failed:  results.filter((r) => r.status !== "ok").length,
    },
    credentials: DEMO_ACCOUNTS.map((a) => ({
      email:    a.email,
      password: a.password,
      plan:     a.plan,
    })),
  }, { status: allOk ? 200 : 207 });
}
