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
  canGenerate:  boolean;   // true for paid (basic/pro) or free trial not yet used
  isLocked:     boolean;   // free + trial already used
  isPaid:       boolean;   // basic or pro (credit-based, unlimited)
  isTrial:      boolean;   // free + trial not yet used
  /** Refetch after a successful generation to update state. */
  refresh:      () => void;
}

export function useFinanceAccess(): FinanceAccessState {
  const [isLoading,  setIsLoading]  = useState(true);
  const [isPaid,     setIsPaid]     = useState(false);
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
        // Row missing — give free trial benefit of the doubt
        setIsPaid(false);
        setIsTrial(true);
        setIsLocked(false);
        setIsLoading(false);
        return;
      }

      const { plan, finance_trial_used } = data as {
        plan: string;
        finance_trial_used: boolean;
      };

      const paid = plan === "basic" || plan === "pro";

      setIsPaid(paid);
      // Free: 1 trial. Basic/Pro: unlimited (credit-based), no trial state needed
      setIsTrial(!paid && !finance_trial_used);
      setIsLocked(!paid && !!finance_trial_used);
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const canGenerate = isPaid || isTrial;

  return { isLoading, canGenerate, isLocked, isPaid, isTrial, refresh };
}
