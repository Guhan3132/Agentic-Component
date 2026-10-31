"use client";

import { MotionConfig } from "motion/react";

/** Honour the OS reduced-motion setting everywhere: springs and slides become simple cross-fades. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
