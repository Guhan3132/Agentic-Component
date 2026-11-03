"use client";

import { ChevronDown, ExternalLink, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export type CitationSource = { id: number; title: string; url: string; quote: string; publisher?: string };

type Props = {
  /** Plain text. Write [1] where source 1 backs a claim, and [?] where nothing does. */
  text: string;
  sources: CitationSource[];
  /** Short, human-readable steps that led to the answer. Shown folded under the sources. */
  reasoning?: string[];
  className?: string;
};

const MARK = /(\[\d+\]|\[\?\])/g;

/**
 * Inline citations you can check. A marker opens the exact quote under the paragraph (not a floating
 * popover, so it never clips), a claim with no source is flagged instead of hidden, and the source list
 * below stays in step with whichever marker is open.
 */
export function Citations({ text, sources, reasoning = [], className }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const stepsId = useId();
  const panelId = useId();
  const byId = new Map(sources.map((s) => [s.id, s]));
  const current = active ? byId.get(active) : undefined;
  const unsourced = (text.match(/\[\?\]/g) ?? []).length;

  return (
    <div
      className={cn("space-y-4", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setActive(null);
      }}
    >
      <p className="leading-relaxed text-foreground">
        {text.split(MARK).map((part, i) => {
          const n = /^\[(\d+)\]$/.exec(part)?.[1];
          if (n) {
            const id = Number(n);
            const s = byId.get(id);
            if (!s) return null;
            const on = active === id;
            return (
              <button
                key={i}
                aria-label={`Source ${id}: ${s.title}`}
                aria-expanded={on}
                aria-controls={panelId}
                onClick={() => setActive(on ? null : id)}
                className={cn(
                  // On touch the visible dot grows to 24px and an invisible ring takes the hit area to 44px.
                  "relative mx-0.5 inline-grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full px-1 align-[0.15em] text-[0.68rem] font-medium leading-none pointer-coarse:h-6 pointer-coarse:min-w-6 pointer-coarse:before:absolute pointer-coarse:before:-inset-2.5 pointer-coarse:before:content-['']",
                  on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {id}
              </button>
            );
          }
          if (part === "[?]") {
            return (
              <span
                key={i}
                title="No source found for this claim"
                className="ml-0.5 inline-flex items-center gap-0.5 rounded-full border border-dashed border-warning/60 px-1.5 align-[0.1em] text-[0.68rem] leading-4 text-warning"
              >
                <TriangleAlert size={10} aria-hidden /> no source
              </span>
            );
          }
          return part;
        })}
      </p>

      <div id={panelId} aria-live="polite">
        {current && (
          <blockquote className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <p className="text-foreground/90">“{current.quote}”</p>
            <footer className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <span>{current.publisher ?? new URL(current.url).hostname}</span>
              <a
                href={current.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline pointer-coarse:min-h-11"
              >
                Open source <ExternalLink size={11} aria-hidden />
              </a>
            </footer>
          </blockquote>
        )}
      </div>

      {unsourced > 0 && (
        <p className="text-xs text-warning">
          {unsourced === 1 ? "1 claim has" : `${unsourced} claims have`} no source. Treat {unsourced === 1 ? "it" : "them"} as the agent’s own estimate.
        </p>
      )}

      <ol className="space-y-1 text-sm">
        {sources.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => setActive(active === s.id ? null : s.id)}
              className={cn(
                "flex w-full items-baseline gap-2 rounded-lg px-2 py-1.5 text-left pointer-coarse:min-h-11 pointer-coarse:items-center hover:bg-muted",
                active === s.id && "bg-muted",
              )}
            >
              <span className="w-4 shrink-0 text-xs text-muted-foreground">{s.id}</span>
              <span className="min-w-0 flex-1 truncate text-foreground">{s.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{s.publisher ?? new URL(s.url).hostname}</span>
            </button>
          </li>
        ))}
      </ol>

      {reasoning.length > 0 && (
        <div>
          <button
            onClick={() => setShowSteps(!showSteps)}
            aria-expanded={showSteps}
            aria-controls={stepsId}
            className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground pointer-coarse:min-h-11"
          >
            <ChevronDown size={13} aria-hidden className={cn("transition-transform motion-reduce:transition-none", showSteps && "rotate-180")} /> How I got here ({reasoning.length} steps)
          </button>
          <ol id={stepsId} hidden={!showSteps} className="mt-2 list-decimal space-y-1 pl-6 text-sm text-muted-foreground">
            {reasoning.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Why this answer: part of this pattern (it used to be its own pattern, "why-this-answer").
// ---------------------------------------------------------------------------
export type WhySource = { title: string; url: string; snippet: string };

type WhyThisAnswerProps = {
  sources: WhySource[];
  reasoning: string[];
  className?: string;
};

export function WhyThisAnswer({ sources, reasoning, className }: WhyThisAnswerProps) {
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
            <p className="rounded-lg bg-warning/10 p-3 text-warning">
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
