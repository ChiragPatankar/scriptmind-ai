"use client";

/**
 * MotionProvider — wraps the app in Framer Motion's LazyMotion.
 *
 * Using `domAnimation` (instead of the default full feature set) reduces the
 * Framer Motion bundle from ~150 kB to ~18 kB in the shared chunk.
 * All `motion.*` components are replaced with `m.*` imports from framer-motion.
 *
 * Components that still import `motion` directly will use the full bundle for
 * their own chunk only — they won't inflate the shared bundle.
 */

import { LazyMotion, domAnimation } from "framer-motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict={false}>
      {children}
    </LazyMotion>
  );
}
