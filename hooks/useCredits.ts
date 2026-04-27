"use client";

import { useEffect, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-browser";

export interface CreditsState {
  credits:        number | null;
  plan:           string | null;
  loading:        boolean;
  /** True when signed in but /api/credits/balance failed (e.g. missing service key). */
  fetchFailed:    boolean;
  syncFromHeader: (remaining: string | null) => void;
}

export function useCredits(): CreditsState {
  const [credits,     setCredits]     = useState<number | null>(null);
  const [plan,        setPlan]        = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  const syncFromHeader = useCallback((remaining: string | null) => {
    if (remaining !== null) {
      const parsed = parseInt(remaining, 10);
      if (!isNaN(parsed)) setCredits(parsed);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    const channelBox: { current: RealtimeChannel | null } = { current: null };

    (async () => {
      setLoading(true);
      setFetchFailed(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/credits/balance", {
          credentials: "include",
          cache:         "no-store",
        });

        if (!cancelled) {
          if (res.ok) {
            const data = await res.json() as { credits: number; plan: string };
            setCredits(data.credits);
            setPlan(data.plan);
            setFetchFailed(false);
          } else {
            setFetchFailed(true);
          }
        }
      } catch {
        if (!cancelled) setFetchFailed(true);
      }

      if (!cancelled) setLoading(false);
      if (cancelled) return;

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

  return { credits, plan, loading, fetchFailed, syncFromHeader };
}
