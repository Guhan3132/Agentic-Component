"use client";

import { ChevronDown, Clock, Loader2, RefreshCw, ShieldOff, TriangleAlert, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type ErrorKind = "network" | "rate-limit" | "tool" | "refusal";

type Props = {
  kind: ErrorKind;
  /** What happened, in plain words. */
  title: string;
  /** What the user can do about it. */
  message: string;
  /** Work that survived the failure, so the user knows nothing was lost. */
  kept?: string[];
  /** Technical detail for support, hidden until asked for. */
  details?: string;
  /** Seconds until an automatic retry. Omit to retry only on request. */
  retryAfter?: number;
  /** A retry is in flight. */
  retrying?: boolean;
  attempt?: number;
  maxAttempts?: number;
  onRetry?: () => void;
  /** A different way forward, such as "Use cached results" or "Rephrase". */
  alternative?: { label: string; onClick: () => void };
  className?: string;
};

const KIND = {
  network: { icon: WifiOff, tone: "text-amber-700 dark:text-amber-300", ring: "border-amber-400/50" },
  "rate-limit": { icon: Clock, tone: "text-amber-700 dark:text-amber-300", ring: "border-amber-400/50" },
  tool: { icon: TriangleAlert, tone: "text-rose-700 dark:text-rose-300", ring: "border-rose-400/50" },
  refusal: { icon: ShieldOff, tone: "text-muted-foreground", ring: "border-border" },
};

/**
 * Says what failed, what survived and what to do next. Transient errors retry on their own with a
 * visible countdown the user can cancel; after the last attempt the alternative becomes the main action.
 */
export function ErrorRecovery({
  kind,
  title,
  message,
  kept = [],
  details,
  retryAfter,
  retrying = false,
  attempt = 1,
  maxAttempts = 3,
  onRetry,
  alternative,
  className,
}: Props) {
  const [left, setLeft] = useState(retryAfter ?? 0);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);
  const retryRef = useRef(onRetry);
  retryRef.current = onRetry;

  const exhausted = attempt >= maxAttempts;
  const counting = !!retryAfter && !paused && !retrying && !exhausted && left > 0;
  const Icon = KIND[kind].icon;

  // A new error (or a new wait) restarts the countdown.
  useEffect(() => {
    setLeft(retryAfter ?? 0);
    setPaused(false);
  }, [retryAfter, attempt]);

  useEffect(() => {
    if (!counting) return;
    const id = setTimeout(() => {
      if (left <= 1) {
        setLeft(0);
        retryRef.current?.();
      } else setLeft(left - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [counting, left]);

  const canRetry = kind !== "refusal" && !!onRetry;
  // Once retrying has run out, the alternative leads and Retry steps back.
  const alternativeFirst = !!alternative && (exhausted || kind === "refusal");

  return (
    <section role="alert" className={cn("rounded-xl border bg-card p-4", KIND[kind].ring, className)}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={cn("mt-0.5 shrink-0", KIND[kind].tone)} aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>

          {kept.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-lg bg-muted/50 p-3 text-sm text-foreground/80">
              {kept.map((k) => (
                <li key={k} className="flex gap-2">
                  <span aria-hidden className="text-emerald-600 dark:text-emerald-300">✓</span>
                  {k}
                </li>
              ))}
            </ul>
          )}

          {/* Announced once as a sentence, not every second. */}
          {counting && (
            <>
              <span className="sr-only">Retrying automatically.</span>
              <p aria-hidden className="mt-3 text-sm text-foreground/80">
                Retrying in {left}s. Attempt {attempt + 1} of {maxAttempts}.
              </p>
            </>
          )}
          {retrying && (
            <p className="mt-3 flex items-center gap-2 text-sm text-foreground/80">
              <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden /> Retrying…
            </p>
          )}
          {exhausted && !retrying && kind !== "refusal" && (
            <p className="mt-3 text-sm text-foreground/80">Tried {maxAttempts} times. Retrying again is unlikely to help right now.</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {alternativeFirst && <Alt alternative={alternative} primary />}
            {canRetry && (
              <button
                onClick={onRetry}
                disabled={retrying}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 pointer-coarse:min-h-11 pointer-coarse:px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50",
                  alternativeFirst ? "bg-muted text-foreground hover:bg-accent" : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                <RefreshCw size={14} aria-hidden /> {counting ? "Retry now" : "Retry"}
              </button>
            )}
            {!alternativeFirst && alternative && <Alt alternative={alternative} />}
            {counting && (
              <button
                onClick={() => setPaused(true)}
                className="rounded-lg px-3 py-1.5 pointer-coarse:min-h-11 pointer-coarse:px-4 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
            )}
          </div>

          {details && (
            <div className="mt-3">
              <button
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground pointer-coarse:min-h-11"
              >
                <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} aria-hidden /> Technical details
              </button>
              {open && <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground/80">{details}</pre>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Alt({ alternative, primary }: { alternative: { label: string; onClick: () => void }; primary?: boolean }) {
  return (
    <button
      onClick={alternative.onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 pointer-coarse:min-h-11 pointer-coarse:px-4 text-sm font-medium",
        primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-foreground hover:bg-accent",
      )}
    >
      {alternative.label}
    </button>
  );
}
