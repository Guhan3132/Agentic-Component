"use client";

import { Check, Loader2, Mic, MicOff, RotateCcw, Square, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type VoiceState = "idle" | "listening" | "transcribing" | "review" | "error";
export type VoiceError = "denied" | "no-speech" | "offline";

type Props = {
  state: VoiceState;
  /** Whole seconds recorded so far. */
  seconds?: number;
  /** Loudness of the last moments, 0 to 1 each, oldest first. Drives the bars. */
  levels?: number[];
  transcript?: string;
  onTranscriptChange?: (text: string) => void;
  error?: VoiceError;
  onStart: () => void;
  /** Done speaking: moves on to transcribing. */
  onStop: () => void;
  onCancel: () => void;
  onSend: (text: string) => void;
  /** Leave voice and type instead. Offered whenever voice fails. */
  onType?: () => void;
  className?: string;
};

const ERROR_COPY: Record<VoiceError, { title: string; body: string; retry: boolean }> = {
  denied: { title: "Microphone is blocked", body: "Allow microphone access for this site in your browser, or type instead. Nothing was recorded.", retry: false },
  "no-speech": { title: "I didn't catch anything", body: "Try again a little closer to the microphone, or type instead.", retry: true },
  offline: { title: "Can't reach the speech service", body: "Your connection dropped while I was listening. Try again, or type instead.", retry: true },
};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Talking to an agent, with every state in view: ready, listening with a live level and a timer,
 * turning speech into text, an editable result, and failures that say what happened and what to do.
 * The text always lands in a box the person can fix before anything is sent, because speech
 * recognition gets names and numbers wrong.
 */
export function VoiceInput({ state, seconds = 0, levels = [], transcript = "", onTranscriptChange, error = "no-speech", onStart, onStop, onCancel, onSend, onType, className }: Props) {
  const bars = levels.length ? levels : Array.from({ length: 24 }, () => 0.08);

  return (
    <section aria-label="Voice input" className={cn("@container rounded-xl border border-border bg-card p-4", className)}>
      {/* One status line for every state, announced once per change. */}
      <p role="status" aria-live="polite" className="sr-only">
        {state === "idle" && "Ready to listen."}
        {state === "listening" && "Listening."}
        {state === "transcribing" && "Turning your voice into text."}
        {state === "review" && "Text is ready to check."}
        {state === "error" && ERROR_COPY[error].title}
      </p>

      {state === "idle" && (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <button
            onClick={onStart}
            aria-label="Start speaking"
            className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Mic size={22} aria-hidden />
          </button>
          <p className="text-sm text-foreground">Tap and talk</p>
          <p className="max-w-xs text-xs text-muted-foreground">You can edit the text before anything is sent.</p>
        </div>
      )}

      {state === "listening" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <span aria-hidden className="size-2 rounded-full bg-rose-500 motion-safe:animate-pulse" /> Listening
            </span>
            <span aria-hidden className="text-sm tabular-nums text-muted-foreground">
              {mmss(seconds)}
            </span>
          </div>
          <div aria-hidden className="flex h-12 items-center justify-center gap-[3px]">
            {bars.map((v, i) => (
              <span key={i} className="w-1 rounded-full bg-foreground/70 transition-[height] duration-100 motion-reduce:transition-none" style={{ height: `${Math.max(8, Math.round(v * 100))}%` }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onStop}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 pointer-coarse:min-h-11"
            >
              <Square size={13} aria-hidden /> Done
            </button>
            <button onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-foreground hover:bg-accent pointer-coarse:min-h-11">
              <X size={14} aria-hidden /> Cancel
            </button>
          </div>
        </div>
      )}

      {state === "transcribing" && (
        <div className="flex items-center justify-between gap-3 py-2">
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden /> Turning your voice into text…
          </p>
          <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:min-h-11">
            Cancel
          </button>
        </div>
      )}

      {state === "review" && (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="voice-transcript">
            What I heard. Fix anything that is off.
          </label>
          <textarea
            id="voice-transcript"
            value={transcript}
            onChange={(e) => onTranscriptChange?.(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:text-sm"
          />
          <p className="text-xs text-muted-foreground">Check names and numbers before sending.</p>
          <div className="flex gap-2">
            <button
              onClick={() => onSend(transcript)}
              disabled={!transcript.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11"
            >
              <Check size={14} aria-hidden /> Send
            </button>
            <button onClick={onStart} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-foreground hover:bg-accent pointer-coarse:min-h-11">
              <RotateCcw size={14} aria-hidden /> Record again
            </button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="flex items-start gap-3">
          <MicOff size={18} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
          <div className="min-w-0">
            <h3 className="font-medium text-foreground">{ERROR_COPY[error].title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{ERROR_COPY[error].body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ERROR_COPY[error].retry && (
                <button onClick={onStart} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 pointer-coarse:min-h-11">
                  <Mic size={14} aria-hidden /> Try again
                </button>
              )}
              {onType && (
                <button
                  onClick={onType}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium pointer-coarse:min-h-11",
                    ERROR_COPY[error].retry ? "bg-muted text-foreground hover:bg-accent" : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  Type instead
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
