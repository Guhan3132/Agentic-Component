"use client";

import { ChevronRight, CircleCheck, CircleStop, CircleX } from "lucide-react";
import { useCallback, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ActivityState = "running" | "done" | "failed" | "stopped";

type Props = {
  /** What it is doing, in the present tense: "Running page script". */
  label: string;
  /** What it did, in the past tense, once finished: "Ran page script". Defaults to the label. */
  doneLabel?: string;
  state: ActivityState;
  /** When it started (Date.now()). The timer counts from here while running. */
  startedAt?: number;
  /** A fixed elapsed time in seconds. Use this instead of startedAt for finished work or static previews. */
  elapsedSeconds?: number;
  /** Extra detail behind the chevron: a log, the command, the error. */
  details?: ReactNode;
  onStop?: () => void;
  className?: string;
};

/** "4s", "6m 4s", "1h 2m". */
export function formatElapsed(total: number) {
  const s = Math.max(0, Math.floor(total));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

/** The current second, ticking once a second only while `on`. Empty on the server, so nothing mismatches. */
function useNowSeconds(on: boolean) {
  const subscribe = useCallback(
    (tick: () => void) => {
      if (!on) return () => {};
      const t = setInterval(tick, 1000);
      return () => clearInterval(t);
    },
    [on],
  );
  return useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 1000), () => null);
}

/**
 * One line that says the agent is busy, with what it is doing and for how long. The dots move while
 * it runs, the timer counts, and the chevron opens the detail. When it ends, the same line says how
 * it ended and how long it took, so the history of a chat stays readable.
 */
export function ActivityIndicator({ label, doneLabel, state, startedAt, elapsedSeconds, details, onStop, className }: Props) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const now = useNowSeconds(state === "running" && elapsedSeconds === undefined && startedAt !== undefined);
  const elapsed = elapsedSeconds ?? (startedAt !== undefined && now !== null ? now - Math.floor(startedAt / 1000) : undefined);
  const time = elapsed !== undefined ? formatElapsed(elapsed) : null;

  const text =
    state === "running" ? label : state === "done" ? (doneLabel ?? label) : state === "failed" ? `${doneLabel ?? label} failed` : `${doneLabel ?? label} stopped`;
  const announce = state === "running" ? `${label}.` : state === "done" ? `${doneLabel ?? label}${time ? `, in ${time}` : ""}.` : `${text}.`;

  const row = (
    <>
      <Mark state={state} />
      <span className={cn("min-w-0 truncate", state === "running" ? "text-foreground" : "text-muted-foreground", state === "failed" && "text-danger")}>{text}</span>
      {time && (
        <span aria-hidden className="shrink-0 tabular-nums text-muted-foreground">
          {time}
        </span>
      )}
      {details && <ChevronRight size={14} aria-hidden className={cn("shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", open && "rotate-90")} />}
    </>
  );

  return (
    <div className={cn("text-sm", className)}>
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
      <div className="flex items-center gap-2">
        {details ? (
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={detailsId}
            className="-mx-1.5 flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11"
          >
            {row}
          </button>
        ) : (
          <div className="flex min-w-0 items-center gap-2 py-1">{row}</div>
        )}
        {state === "running" && onStop && (
          <button
            onClick={onStop}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:min-h-11 pointer-coarse:px-3"
          >
            <CircleStop size={13} aria-hidden /> Stop
          </button>
        )}
      </div>
      {details && (
        <div id={detailsId} hidden={!open} className="mt-1 rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground/80">
          {details}
        </div>
      )}
    </div>
  );
}

function Mark({ state }: { state: ActivityState }) {
  if (state === "done") return <CircleCheck size={15} aria-hidden className="shrink-0 text-success" />;
  if (state === "failed") return <CircleX size={15} aria-hidden className="shrink-0 text-danger" />;
  if (state === "stopped") return <CircleStop size={15} aria-hidden className="shrink-0 text-muted-foreground" />;
  // Three dots that take turns, in the brand colour. Under reduced motion they stay still.
  return (
    <span aria-hidden className="flex w-[15px] shrink-0 items-center justify-center gap-[2px]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-[3.5px] rounded-full bg-primary motion-safe:animate-pulse" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </span>
  );
}
