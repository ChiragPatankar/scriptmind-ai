"use client";

/**
 * React hook that exposes the current user's credit balance and plan.
 *
 * - Fetches on mount
 * - Updates in real-time via Supabase Realtime (postgres_changes on public.users)
 * - Also reads the X-Credits-Remaining response header after any AI fetch call
 *   if you call syncFromHeader(remainingStr) after a successful response.
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

export interface CreditsState {
  credits:  number | null;
  plan:     string  | null;
  loading:  boolean;
  /** Call this with the value of X-Credits-Remaining header to sync instantly */
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("users")
        .select("credits, plan")
        .eq("id", user.id)
        .single();

      if (data) {
        setCredits((data as { credits: number; plan: string }).credits);
        setPlan((data as { credits: number; plan: string }).plan);
      }

      setLoading(false);

      // Realtime — credits update live after every API call
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
