"use client";

/**
 * Smart plan CTA button used on pricing pages.
 *
 * - Logged-in user  + paid plan → opens Razorpay checkout immediately
 * - Logged-in user  + free plan → redirects to /projects
 * - Not logged-in   + paid plan → redirects to /signup (onboarding handles payment after signup)
 * - Enterprise                  → redirects to /support
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { useRazorpay } from "@/hooks/useRazorpay";
import { cn } from "@/lib/utils";

interface PlanCTAButtonProps {
  plan:      "free" | "basic" | "pro" | "enterprise";
  label:     string;
  featured?: boolean;
  accent:    string;
  glow:      string;
  className?: string;
}

export default function PlanCTAButton({
  plan, label, featured = false, accent, glow, className,
}: PlanCTAButtonProps) {
  const router   = useRouter();
  const supabase = createClient();
  const { pay, paying } = useRazorpay();

  const [loggedIn, setLoggedIn]   = useState<boolean | null>(null); // null = loading
  const [error,    setError]      = useState<string | null>(null);
  const [loading,  setLoading]    = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
  }, [supabase]);

  const handleClick = async () => {
    setError(null);

    if (plan === "enterprise") {
      router.push("/support");
      return;
    }

    if (plan === "free") {
      router.push(loggedIn ? "/projects" : "/signup");
      return;
    }

    // paid plan
    if (!loggedIn) {
      router.push("/signup");
      return;
    }

    // Logged in — open Razorpay
    setLoading(true);
    await pay(plan, {
      onSuccess: () => router.push("/projects?welcome=1"),
      onError:   (msg) => setError(msg),
    });
    setLoading(false);
  };

  const isLoading = loading || paying || loggedIn === null;

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
          "hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2",
          className
        )}
        style={
          featured
            ? {
                background: `linear-gradient(135deg, ${accent}, #a78bfa)`,
                color:      "#fff",
                boxShadow:  `0 0 20px ${glow}`,
              }
            : {
                border:     `1px solid ${accent}35`,
                color:      accent,
                background: `${accent}08`,
              }
        }
      >
        {isLoading && loggedIn !== null && (paying || loading) ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : null}
        {label}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
