"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export type WhySource = { title: string; url: string; snippet: string };

type Props = {
  sources: WhySource[];
  reasoning: string[];
  className?: string;
};

export function WhyThisAnswer({ sources, reasoning, className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 pointer-coarse:py-4 text-sm text-foreground/80 hover:text-foreground"
      >
        <span>
          Why this answer
          <span className="ml-2 text-muted-foreground">
            {sources.length ? `${sources.length} source${sources.length > 1 ? "s" : ""}` : "no sources"}
          </span>
        </span>
        <ChevronDown size={16} className={cn("transition", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          className="overflow-hidden"
        >
        <div className="space-y-4 border-t border-border px-4 py-4 text-sm">
          <ol className="list-decimal space-y-1 pl-5 text-foreground/80">
            {reasoning.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          {sources.length === 0 ? (
            <p className="rounded-lg bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
              This answer comes from the model&apos;s general knowledge, with nothing to cite. Treat it as a starting point.
            </p>
          ) : (
            <ul className="space-y-2">
              {sources.map((s, i) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-border p-3 hover:border-foreground/30"
                  >
                    <span className="flex items-center gap-2 text-foreground">
                      <span className="rounded bg-muted px-1.5 text-xs">{i + 1}</span>
                      {s.title}
                      <ExternalLink size={12} className="text-muted-foreground" />
                    </span>
                    <span className="mt-1 block text-muted-foreground">&ldquo;{s.snippet}&rdquo;</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
