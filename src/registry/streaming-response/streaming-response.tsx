"use client";

import { Copy, RefreshCw, Square, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export type StreamStatus = "idle" | "streaming" | "stopped" | "error" | "done";

type Props = {
  text: string;
  status: StreamStatus;
  errorMessage?: string;
  onStop?: () => void;
  onRegenerate?: () => void;
  className?: string;
};

export function StreamingResponse({ text, status, errorMessage, onStop, onRegenerate, className }: Props) {
  const streaming = status === "streaming";
  const announce =
    streaming ? "Generating response" : status === "done" ? "Response complete" : status === "stopped" ? "Response stopped" : "";
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      {/* Per-token live regions are noisy for screen readers: announce state changes only. */}
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
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
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
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
