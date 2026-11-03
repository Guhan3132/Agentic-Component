"use client";

import { ChevronRight, CircleCheck, CircleStop, CircleX, Copy, RefreshCw, Square, TriangleAlert } from "lucide-react";
import { type ReactNode, useCallback, useId, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

export type StreamStatus = "idle" | "streaming" | "stopped" | "error" | "done";

type Props = {
  text: string;
  status: StreamStatus;
  errorMessage?: string;
  onStop?: () => void;
  onRegenerate?: () => void;
  /** What the agent is doing before or between tokens, as one line with a timer: see ActivityIndicator below. */
  activity?: Omit<ActivityIndicatorProps, "className">;
  className?: string;
};

export function StreamingResponse({ text, status, errorMessage, onStop, onRegenerate, activity, className }: Props) {
  const streaming = status === "streaming";
  const announce =
    streaming ? "Generating response" : status === "done" ? "Response complete" : status === "stopped" ? "Response stopped" : "";
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      {/* Per-token live regions are noisy for screen readers: announce state changes only. */}
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
      {activity && <ActivityIndicator {...activity} className="mb-2" />}
      <div aria-busy={streaming} className="min-h-24 whitespace-pre-wrap leading-relaxed text-foreground">
        {status === "idle" && <span className="text-muted-foreground/60">Press Replay to start the response.</span>}
        {streaming && !text && <ThinkingDots />}
        {text}
        {streaming && text && (
          <span aria-hidden className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-primary" />
        )}
      </div>

      {status === "stopped" && (
        <p className="mt-3 text-sm text-muted-foreground">Stopped. The partial answer is kept so you do not lose it.</p>
      )}
      {status === "error" && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <span>{errorMessage ?? "Something went wrong."} What was generated so far is shown above.</span>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {streaming && (
          <Btn onClick={onStop} primary>
            <Square size={14} /> Stop
          </Btn>
        )}
        {(status === "done" || status === "stopped" || status === "error") && (
          <>
            {onRegenerate && (
              <Btn onClick={onRegenerate} primary={status === "error"}>
                <RefreshCw size={14} /> {status === "error" ? "Retry" : "Regenerate"}
              </Btn>
            )}
            {text && (
              <Btn onClick={() => navigator.clipboard?.writeText(text)}>
                <Copy size={14} /> Copy
              </Btn>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span aria-hidden className="inline-flex gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

function Btn({ children, onClick, primary }: { children: React.ReactNode; onClick?: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 pointer-coarse:py-2.5 text-sm transition focus-visible:outline-2 focus-visible:outline-ring",
        primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Activity indicator: part of this pattern (it used to be its own pattern, "activity-indicator").
// ---------------------------------------------------------------------------
export type ActivityState = "running" | "done" | "failed" | "stopped";

type ActivityIndicatorProps = {
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
export function ActivityIndicator({ label, doneLabel, state, startedAt, elapsedSeconds, details, onStop, className }: ActivityIndicatorProps) {
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
