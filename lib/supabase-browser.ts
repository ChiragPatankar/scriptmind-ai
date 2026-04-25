import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-side Supabase client.
 * Call this inside "use client" components or hooks.
 * Safe to call multiple times — returns a singleton per render context.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
