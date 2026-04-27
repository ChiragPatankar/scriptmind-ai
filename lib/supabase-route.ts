/**
 * Supabase server client for Route Handlers (App Router).
 *
 * Cloudflare Workers + OpenNext often fail to read auth cookies when using
 * `cookies()` from `next/headers`. This adapter wires cookies directly from
 * the incoming NextRequest and collects any refreshed session cookies to
 * attach to the outgoing NextResponse.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type CookieSet = { name: string; value: string; options: CookieOptions };

export function createRouteSupabase(request: NextRequest) {
  const outgoingCookies: CookieSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            outgoingCookies.push({ name, value, options: options ?? {} });
          });
        },
      },
    }
  );

  /** Attach any cookies Supabase refreshed during getUser() to the response. */
  function applyCookies<T extends NextResponse>(response: T): T {
    outgoingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  return { supabase, applyCookies };
}
