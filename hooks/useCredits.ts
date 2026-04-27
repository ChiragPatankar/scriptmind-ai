"use client";

import { useEffect, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-browser";

export interface CreditsState {
  credits:        number | null;
  plan:           string | null;
  loading:        boolean;
  syncFromHeader: (remaining: string | null) => void;
}

export function useCredits(): CreditsState {
  const [credits, setCredits] = useState<number | null>(null);
  const [plan,    setPlan]    = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncFromHeader = useCallback((remaining: string | null) => {
    if (remaining !== null) {
      const parsed = parseInt(remaining, 10);
      if (!isNaN(parsed)) setCredits(parsed);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    /** Box so cleanup always sees the latest channel ref (async race-safe). */
    const channelBox: { current: RealtimeChannel | null } = { current: null };

    (async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/credits/balance");
        if (!cancelled && res.ok) {
          const data = await res.json() as { credits: number; plan: string };
          setCredits(data.credits);
          setPlan(data.plan);
        }
      } catch {
        // Non-fatal
      }

      if (!cancelled) setLoading(false);
      if (cancelled) return;

      // One channel per mount — name includes user id (avoids Strict Mode double-mount collisions)
      const ch = supabase
        .channel(`credits-${user.id}`)
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

      channelBox.current = ch;

      // If effect was torn down while we were subscribing, clean up immediately
      if (cancelled) {
        supabase.removeChannel(ch);
        channelBox.current = null;
      }
    })();

    return () => {
      cancelled = true;
      if (channelBox.current) {
        supabase.removeChannel(channelBox.current);
        channelBox.current = null;
      }
    };
  }, []);

  return { credits, plan, loading, syncFromHeader };
}
