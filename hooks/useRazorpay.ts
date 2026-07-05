"use client";

/**
 * Loads the Razorpay checkout.js script on demand and returns a helper
 * that opens the payment modal for a given plan.
 *
 * Usage:
 *   const { pay, paying } = useRazorpay();
 *   await pay("pro", { onSuccess, onError });
 */

import { useState, useCallback } from "react";

type PayOptions = {
  onSuccess?: (plan: string, credits: number) => void;
  onError?:   (message: string) => void;
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const s = document.createElement("script");
    s.src = src;
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export function useRazorpay() {
  const [paying, setPaying] = useState(false);

  const pay = useCallback(async (plan: "free" | "basic" | "pro", opts: PayOptions = {}) => {
    setPaying(true);

    try {
      // Load checkout.js
      const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!loaded) {
        opts.onError?.("Failed to load payment gateway. Check your connection.");
        return;
      }

      // Create order server-side
      const orderRes = await fetch("/api/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        opts.onError?.(err.error ?? "Could not initiate payment.");
        return;
      }

      const order = await orderRes.json();

      // Open Razorpay modal
      await new Promise<void>((resolve) => {
        const rzp = new window.Razorpay({
          key:         order.key_id,
          order_id:    order.order_id,
          amount:      order.amount,
          currency:    order.currency,
          name:        "ScriptMind AI",
          description: order.name,
          image:       "/logo.png",
          theme:       { color: "#7C3AED" },

          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id:   string;
            razorpay_signature:  string;
          }) => {
            // Verify server-side
            const verifyRes = await fetch("/api/verify-payment", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ ...response, plan }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}));
              opts.onError?.(err.error ?? "Payment verification failed.");
            } else {
              const data = await verifyRes.json();
              opts.onSuccess?.(data.plan, data.credits);
            }
            resolve();
          },

          modal: {
            ondismiss: () => resolve(),
          },
        });

        rzp.open();
      });
    } catch (e) {
      opts.onError?.("Unexpected error during payment.");
      console.error(e);
    } finally {
      setPaying(false);
    }
  }, []);

  return { pay, paying };
}
