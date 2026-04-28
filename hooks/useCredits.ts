"use client";

import { useEffect, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-browser";

export interface CreditsState {
  credits:        number | null;
  plan:           string | null;
  loading:        boolean;
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

    async function fetchBalance(userId: string) {
      try {
        const res = await fetch("/api/credits/balance", {
          credentials: "include",
          cache:        "no-store",
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json() as { credits: number; plan: string };
          setCredits(data.credits);
          setPlan(data.plan);
          setFetchFailed(false);
        } else {
          setFetchFailed(true);
        }
      } catch {
        if (!cancelled) setFetchFailed(true);
      }
      if (!cancelled) setLoading(false);
    }

    function subscribeRealtime(userId: string) {
      if (channelBox.current) return; // already subscribed
      const ch = supabase
        .channel(`credits-${userId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${userId}` },
          (payload) => {
            const row = payload.new as { credits: number; plan: string };
            setCredits(row.credits);
            setPlan(row.plan);
          }
        )
        .subscribe();
      channelBox.current = ch;
    }

    /**
     * onAuthStateChange fires with INITIAL_SESSION once cookies/localStorage
     * are read — this is the reliable way to detect the session on Cloudflare.
     * getUser() alone can return null on the first tick before hydration.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        if (session?.user) {
          fetchBalance(session.user.id);
          subscribeRealtime(session.user.id);
        } else {
          // Not signed in
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (channelBox.current) {
        supabase.removeChannel(channelBox.current);
        channelBox.current = null;
      }
    };
  }, []);

  return { credits, plan, loading, fetchFailed, syncFromHeader };
}
