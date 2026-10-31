"use client";

import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/cn";

type Vote = "up" | "down" | null;

type Props = {
  onSubmit?: (vote: "up" | "down", reasons: string[]) => void;
  downReasons?: string[];
  className?: string;
};

const DEFAULT_REASONS = ["Wrong or outdated", "Didn't answer my question", "Too long", "Unsafe or inappropriate"];

/** One tap to vote. Reason chips appear only after a thumbs-down, so the happy path stays frictionless. */
export function FeedbackThumbs({ onSubmit, downReasons = DEFAULT_REASONS, className }: Props) {
  const [vote, setVote] = useState<Vote>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  const pick = (v: "up" | "down") => {
    const next = vote === v ? null : v;
    setVote(next);
    setReasons([]);
    setSent(false);
    if (next === "up") {
      onSubmit?.("up", []);
      setSent(true);
    }
  };

  const toggle = (r: string) => setReasons((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));

  const submit = () => {
    onSubmit?.("down", reasons);
    setSent(true);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-1" role="group" aria-label="Rate this response">
        <IconBtn label="Good response" tip="Good response" pressed={vote === "up"} onClick={() => pick("up")}>
          <ThumbsUp size={16} className={vote === "up" ? "fill-current" : undefined} />
        </IconBtn>
        <IconBtn label="Bad response" tip="Bad response" pressed={vote === "down"} onClick={() => pick("down")}>
          <ThumbsDown size={16} className={vote === "down" ? "fill-current" : undefined} />
        </IconBtn>
        <span role="status" aria-live="polite" className="ml-2 flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300">
          {sent && (
            <>
              <Check size={14} /> Thanks, this helps improve answers.
            </>
          )}
        </span>
      </div>

      <AnimatePresence initial={false}>
      {vote === "down" && !sent && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="space-y-2 rounded-xl border border-border bg-card p-3"
        >
          <p className="text-sm text-muted-foreground">What went wrong? (optional)</p>
          <div className="flex flex-wrap gap-2">
            {downReasons.map((r) => (
              <button
                key={r}
                aria-pressed={reasons.includes(r)}
                onClick={() => toggle(r)}
                className={cn(
                  "rounded-full border px-3 py-1 pointer-coarse:py-2 text-sm transition",
                  reasons.includes(r)
                    ? "border-primary bg-primary/5 text-emerald-700 dark:text-emerald-300"
                    : "border-input text-foreground/80 hover:border-foreground/30",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <button onClick={submit} className="rounded-lg bg-primary px-3 py-1.5 pointer-coarse:py-2.5 text-sm text-primary-foreground hover:bg-primary/90">
            {reasons.length ? "Send feedback" : "Skip and send"}
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function IconBtn({
  children,
  label,
  tip,
  pressed,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  tip: string;
  pressed: boolean;
  onClick: () => void;
}) {
  const [tEl, setTEl] = useState<HTMLButtonElement | null>(null);
  const t = useTip(tEl, tip);
  return (
    <button
      ref={setTEl}
      {...t.bind}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-lg p-2 pointer-coarse:p-3 transition focus-visible:outline-2 focus-visible:outline-ring",
        pressed ? "text-foreground hover:bg-accent" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
      {t.tip}
    </button>
  );
}

/** Hover and keyboard-focus label for icon-only buttons. It is fixed-position, so no scrolling or clipping parent can cut it off. */
function useTip(el: HTMLElement | null, label: string) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const show = (viaFocus: boolean) => {
    if (!el) return;
    // Mouse tooltips only with a real pointer; keyboard tooltips only when focus is visible.
    if (viaFocus ? !el.matches(":focus-visible") : !window.matchMedia("(pointer: fine)").matches) return;
    const r = el.getBoundingClientRect();
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, 72), window.innerWidth - 72), y: r.top });
  };
  const hide = () => setPos(null);
  return {
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
