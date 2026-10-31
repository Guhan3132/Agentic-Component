"use client";

import { Circle, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export type ToolStep = {
  id: string;
  name: string;
  args: string;
  status: "pending" | "running" | "ok" | "failed";
  summary?: string;
};

type Props = {
  steps: ToolStep[];
  className?: string;
};

/** Every action the agent takes, in order, with its real outcome. Failures are shown, never hidden. */
export function ToolTimeline({ steps, className }: Props) {
  if (steps.length === 0) return null;
  return (
    <ol aria-label="Agent actions" className={cn("space-y-0", className)}>
      {steps.map((s, i) => (
        <motion.li
          key={s.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="relative flex gap-3 pb-4 last:pb-0"
        >
          {i < steps.length - 1 && <span aria-hidden className="absolute left-[9px] top-6 h-[calc(100%-1.25rem)] w-px bg-border" />}
          <span className="mt-0.5 shrink-0">
            {s.status === "pending" && <Circle size={20} className="text-muted-foreground/40" aria-label="Waiting" />}
            {s.status === "running" && <Loader2 size={20} className="animate-spin text-muted-foreground/60" aria-label="Running" />}
            {s.status === "ok" && <CircleCheck size={20} className="text-emerald-600 dark:text-emerald-400" aria-label="Done" />}
            {s.status === "failed" && <CircleX size={20} className="text-rose-600 dark:text-rose-400" aria-label="Failed" />}
          </span>
          <div className="min-w-0 text-sm">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium text-foreground">{s.name}</span>
              {s.args && <code className="truncate font-mono text-xs text-muted-foreground">{s.args}</code>}
            </p>
            {s.summary && (
              <p className={cn("mt-0.5", s.status === "failed" ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground")}>{s.summary}</p>
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
