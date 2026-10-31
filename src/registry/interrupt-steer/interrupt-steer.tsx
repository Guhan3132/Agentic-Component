"use client";

import { Send, Square } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Segment = { role: "agent" | "user"; text: string };

type Props = {
  /** Replace the built-in input, for example with a PromptComposer. */
  composer?: ReactNode;
  segments: Segment[];
  running: boolean;
  onSteer: (message: string) => void;
  onStop: () => void;
  suggestions?: string[];
  className?: string;
};

/** The composer stays live while the agent works, so users redirect it instead of waiting and restarting. */
export function InterruptSteer({ segments, running, onSteer, onStop, suggestions = [], composer, className }: Props) {
  const [value, setValue] = useState("");

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    onSteer(t);
    setValue("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2" aria-live="polite">
        {segments.map((s, i) => (
          <p
            key={i}
            className={cn(
              "whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
              s.role === "user" ? "ml-auto w-fit max-w-[85%] bg-primary text-primary-foreground" : "border border-border bg-card text-foreground",
            )}
          >
            {s.text}
            {running && i === segments.length - 1 && s.role === "agent" && (
              <span aria-hidden className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-primary" />
            )}
          </p>
        ))}
      </div>

      {composer ?? (
        <>
      {running && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-3 py-1 pointer-coarse:py-2 text-sm text-foreground/80 hover:border-foreground/30">
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(value);
        }}
        className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 pl-3 focus-within:border-ring"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Message the agent"
          placeholder={running ? "Steer the agent while it works" : "Message the agent"}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
        {running && (
          <button type="button" onClick={onStop} className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 pointer-coarse:py-2.5 text-sm text-foreground hover:bg-accent">
            <Square size={12} /> Stop
          </button>
        )}
        <SendButton disabled={!value.trim()} />
      </form>
        </>
      )}
    </div>
  );
}

function SendButton({ disabled }: { disabled: boolean }) {
  const t = useTip<HTMLButtonElement>("Send");
  return (
    <button
      ref={t.ref}
      {...t.bind}
      type="submit"
      aria-label="Send"
      disabled={disabled}
      className="rounded-lg bg-primary p-2 pointer-coarse:p-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
    >
      <Send size={14} />
      {t.tip}
    </button>
  );
}

/** Hover and keyboard-focus label for icon-only buttons. It is fixed-position, so no scrolling or clipping parent can cut it off. */
function useTip<T extends HTMLElement>(label: string) {
  const ref = useRef<T>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const show = (viaFocus: boolean) => {
    const el = ref.current;
    if (!el) return;
    // Mouse tooltips only with a real pointer; keyboard tooltips only when focus is visible.
    if (viaFocus ? !el.matches(":focus-visible") : !window.matchMedia("(pointer: fine)").matches) return;
    const r = el.getBoundingClientRect();
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, 72), window.innerWidth - 72), y: r.top });
  };
  const hide = () => setPos(null);
  return {
    ref,
    bind: { onMouseEnter: () => show(false), onMouseLeave: hide, onFocus: () => show(true), onBlur: hide },
    tip: pos ? (
      <span
        aria-hidden
        className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md"
        style={{ left: pos.x, top: pos.y - 6 }}
      >
        {label}
      </span>
    ) : null,
  };
}
