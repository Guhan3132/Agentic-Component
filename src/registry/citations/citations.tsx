"use client";

import { ExternalLink, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export type CitationSource = { id: number; title: string; url: string; quote: string; publisher?: string };

type Props = {
  /** Plain text. Write [1] where source 1 backs a claim, and [?] where nothing does. */
  text: string;
  sources: CitationSource[];
  className?: string;
};

const MARK = /(\[\d+\]|\[\?\])/g;

/**
 * Inline citations you can check. A marker opens the exact quote under the paragraph (not a floating
 * popover, so it never clips), a claim with no source is flagged instead of hidden, and the source list
 * below stays in step with whichever marker is open.
 */
export function Citations({ text, sources, className }: Props) {
  const [active, setActive] = useState<number | null>(null);
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
                className="ml-0.5 inline-flex items-center gap-0.5 rounded-full border border-dashed border-amber-500/60 px-1.5 align-[0.1em] text-[0.68rem] leading-4 text-amber-700 dark:text-amber-300"
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
        <p className="text-xs text-amber-700 dark:text-amber-300">
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
    </div>
  );
}
