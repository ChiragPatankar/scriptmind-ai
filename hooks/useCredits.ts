"use client";

import { useEffect, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-browser";

export interface CreditsState {
  credits:        number | null;
  plan:           string | null;
  planExpiresAt:  string | null;
  isExpired:      boolean;
  loading:        boolean;
  fetchFailed:    boolean;
  syncFromHeader: (remaining: string | null) => void;
}

export function useCredits(): CreditsState {
  const [credits,       setCredits]       = useState<number | null>(null);
  const [plan,          setPlan]          = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [fetchFailed,   setFetchFailed]   = useState(false);

  const isExpired = planExpiresAt !== null && new Date() > new Date(planExpiresAt);

  const syncFromHeader = useCallback((remaining: string | null) => {
    if (remaining !== null) {
      const parsed = parseInt(remaining, 10);
      if (!isNaN(parsed)) setCredits(parsed);
    }
  }, []);

  // Listen for the global credits-changed event fired by the fetch interceptor
  useEffect(() => {
    function onCreditsChanged(e: Event) {
      const detail = (e as CustomEvent<{ remaining: number }>).detail;
      if (typeof detail?.remaining === "number" && !isNaN(detail.remaining)) {
        setCredits(detail.remaining);
      }
    }
    window.addEventListener("credits-changed", onCreditsChanged);
    return () => window.removeEventListener("credits-changed", onCreditsChanged);
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
          const data = await res.json() as { credits: number; plan: string; plan_expires_at: string | null };
          setCredits(data.credits);
          setPlan(data.plan);
          setPlanExpiresAt(data.plan_expires_at ?? null);
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
      if (channelBox.current) return; // already subscribed in this render cycle
      try {
        const channelName = `credits-${userId}`;

        // Remove any stale channel left over from StrictMode double-invoke or HMR
        const stale = supabase.getChannels().find(
          (c) => c.topic === `realtime:${channelName}`
        );
        if (stale) supabase.removeChannel(stale);

        const ch = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${userId}` },
            (payload) => {
              const row = payload.new as { credits: number; plan: string; plan_expires_at: string | null };
              setCredits(row.credits);
              setPlan(row.plan);
              setPlanExpiresAt(row.plan_expires_at ?? null);
            }
          )
          .subscribe();
        channelBox.current = ch;
      } catch {
        // Non-fatal — fetch interceptor still provides real-time updates via header
      }
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

  return { credits, plan, planExpiresAt, isExpired, loading, fetchFailed, syncFromHeader };
}
