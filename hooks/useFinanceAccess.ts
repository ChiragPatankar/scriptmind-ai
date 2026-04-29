"use client";

/**
 * Checks whether the current user can generate a Finance Studio report.
 * Single Supabase query: SELECT plan, finance_trial_used WHERE id = user.id
 *
 * Returns derived booleans — no extra fetches, no extra API calls.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export interface FinanceAccessState {
  isLoading:    boolean;
  canGenerate:  boolean;   // true for pro or unused trial
  isLocked:     boolean;   // basic + trial already used
  isPro:        boolean;
  isTrial:      boolean;   // basic + trial not yet used
  /** Refetch after a successful generation to update state. */
  refresh:      () => void;
}

export function useFinanceAccess(): FinanceAccessState {
  const [isLoading,  setIsLoading]  = useState(true);
  const [isPro,      setIsPro]      = useState(false);
  const [isTrial,    setIsTrial]    = useState(false);
  const [isLocked,   setIsLocked]   = useState(false);
  const [tick,       setTick]       = useState(0);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    const supabase = createClient();
    let cancelled  = false;

    (async () => {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("plan, finance_trial_used")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (!data) {
        // Row missing — treat as free
        setIsPro(false);
        setIsTrial(false);
        setIsLocked(false);
        setIsLoading(false);
        return;
      }

      const { plan, finance_trial_used } = data as {
        plan: string;
        finance_trial_used: boolean;
      };

      const pro   = plan === "pro";
      const basic = plan === "basic";

      setIsPro(pro);
      setIsTrial(basic && !finance_trial_used);
      setIsLocked(basic && finance_trial_used);
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const canGenerate = isPro || isTrial;

  return { isLoading, canGenerate, isLocked, isPro, isTrial, refresh };
}
