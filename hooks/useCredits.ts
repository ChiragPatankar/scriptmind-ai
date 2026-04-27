"use client";

/**
 * React hook — exposes the current user's credit balance and plan.
 *
 * - Fetches via /api/credits/balance (which auto-provisions missing rows)
 * - Updates in real-time via Supabase Realtime on public.users
 * - syncFromHeader() lets callers instantly sync after an AI API response
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

export interface CreditsState {
  credits:  number | null;
  plan:     string  | null;
  loading:  boolean;
  /** Call with the value of X-Credits-Remaining header to sync instantly */
  syncFromHeader: (remaining: string | null) => void;
}

export function useCredits(): CreditsState {
  const [credits, setCredits] = useState<number | null>(null);
  const [plan,    setPlan]    = useState<string  | null>(null);
  const [loading, setLoading] = useState(true);

  const syncFromHeader = useCallback((remaining: string | null) => {
    if (remaining !== null) {
      const parsed = parseInt(remaining, 10);
      if (!isNaN(parsed)) setCredits(parsed);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    async function fetchCredits() {
      setLoading(true);

      // Confirm there is an active session first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Use the API route — it auto-provisions the row if missing
      try {
        const res = await fetch("/api/credits/balance");
        if (res.ok) {
          const data = await res.json() as { credits: number; plan: string };
          setCredits(data.credits);
          setPlan(data.plan);
        }
      } catch {
        // Non-fatal — badge just stays hidden
      }

      setLoading(false);

      // Realtime subscription — credits update live after every AI call
      channelRef = supabase
        .channel("credits-watch")
        .on(
          "postgres_changes",
          {
            event:  "UPDATE",
            schema: "public",
            table:  "users",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            const row = payload.new as { credits: number; plan: string };
            setCredits(row.credits);
            setPlan(row.plan);
          }
        )
        .subscribe();
    }

    fetchCredits();

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { credits, plan, loading, syncFromHeader };
}
