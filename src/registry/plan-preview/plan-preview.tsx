"use client";

import { ArrowDown, ArrowUp, Ellipsis, Play, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type PlanItem = { id: string; text: string };

type Props = {
  steps: PlanItem[];
  onChange: (steps: PlanItem[]) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

const SPRING = { type: "spring", bounce: 0, duration: 0.3 } as const;

/**
 * The agent proposes; the user edits, reorders or removes steps before anything runs.
 * Layout follows the component's own width: wide shows compact inline controls, narrow keeps each
 * step to one line with a "more" button that reveals labelled, 44px actions. Inputs are 16px
 * when narrow so iOS does not zoom in on focus.
 */
export function PlanPreview({ steps, onChange, onConfirm, onCancel, disabled, className }: Props) {
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const move = (i: number, d: -1 | 1) => {
    const next = [...steps];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const remove = (id: string) => {
    onChange(steps.filter((x) => x.id !== id));
    setOpenId(null);
  };

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...steps, { id: crypto.randomUUID(), text }]);
    setDraft("");
  };

  return (
    <section aria-label="Proposed plan" className={cn("@container rounded-xl border border-border bg-card p-3 @sm:p-4", className)}>
      <h3 className="text-[15px] font-medium text-foreground @sm:text-sm">Proposed plan</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">Edit anything. Nothing runs until you confirm.</p>

      <ol className="mt-3 space-y-1.5 @sm:space-y-2">
        <AnimatePresence initial={false} mode="popLayout">
          {steps.map((s, i) => {
            const open = openId === s.id;
            const up = { label: `Move step ${i + 1} up`, tip: "Move up", run: () => move(i, -1), off: disabled || i === 0 };
            const down = { label: `Move step ${i + 1} down`, tip: "Move down", run: () => move(i, 1), off: disabled || i === steps.length - 1 };
            const del = { label: `Remove step ${i + 1}`, tip: "Remove step", danger: true, run: () => remove(s.id), off: disabled };
            return (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                transition={SPRING}
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs text-muted-foreground">{i + 1}</span>
                  <input
                    value={s.text}
                    disabled={disabled}
                    aria-label={`Step ${i + 1}`}
                    onChange={(e) => onChange(steps.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)))}
                    className="h-11 min-w-0 flex-1 rounded-lg border border-transparent bg-muted/50 px-3 text-base text-foreground outline-none focus:border-input focus:bg-card disabled:opacity-60 @sm:h-auto @sm:px-2.5 @sm:py-1.5 @sm:text-sm"
                  />

                  {/* Wide: inline icon buttons */}
                  <div className="hidden items-center @sm:flex">
                    <IconBtn {...up}>
                      <ArrowUp size={14} />
                    </IconBtn>
                    <IconBtn {...down}>
                      <ArrowDown size={14} />
                    </IconBtn>
                    <IconBtn {...del}>
                      <Trash2 size={14} />
                    </IconBtn>
                  </div>

                  {/* Narrow: one "more" button per step */}
                  <button
                    type="button"
                    aria-label={`Options for step ${i + 1}`}
                    aria-expanded={open}
                    aria-controls={`plan-actions-${s.id}`}
                    disabled={disabled}
                    onClick={() => setOpenId(open ? null : s.id)}
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 @sm:hidden",
                      open && "bg-accent text-foreground",
                    )}
                  >
                    <Ellipsis size={18} />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`plan-actions-${s.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={SPRING}
                      className="overflow-hidden @sm:hidden"
                    >
                      <div className="flex gap-2 pb-1 pl-8 pt-1.5">
                        <WideBtn {...up} text="Up">
                          <ArrowUp size={16} />
                        </WideBtn>
                        <WideBtn {...down} text="Down">
                          <ArrowDown size={16} />
                        </WideBtn>
                        <WideBtn {...del} text="Remove">
                          <Trash2 size={16} />
                        </WideBtn>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      {steps.length === 0 && <p className="mt-3 text-sm text-muted-foreground">The plan is empty. Add a step or cancel.</p>}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a step"
          aria-label="Add a step"
          className="h-11 min-w-0 flex-1 rounded-lg border border-dashed border-input px-3 text-base outline-none focus:border-ring disabled:opacity-60 @sm:h-auto @sm:px-2.5 @sm:py-1.5 @sm:text-sm"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          className="inline-flex h-11 items-center gap-1 rounded-lg bg-muted px-4 text-sm text-foreground hover:bg-accent disabled:opacity-40 @sm:h-auto @sm:px-3 @sm:py-1.5"
        >
          <Plus size={14} /> Add
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2 @sm:flex-row">
        <button
          onClick={onConfirm}
          disabled={disabled || steps.length === 0}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 @sm:h-auto @sm:px-3 @sm:py-1.5"
        >
          <Play size={14} /> Run plan ({steps.length} {steps.length === 1 ? "step" : "steps"})
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={disabled}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-muted px-4 text-sm text-foreground hover:bg-accent disabled:opacity-40 @sm:h-auto @sm:px-3 @sm:py-1.5"
          >
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}

type Action = { label: string; run: () => void; off?: boolean; tip?: string; danger?: boolean };

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

/** Compact icon button for wide layouts. Delete uses the error colour so it reads as destructive. */
function IconBtn({ children, label, run, off, tip, danger }: Action & { children: React.ReactNode }) {
  const t = useTip<HTMLButtonElement>(tip ?? label);
  return (
    <button
      ref={t.ref}
      {...t.bind}
      type="button"
      aria-label={label}
      onClick={run}
      disabled={off}
      className={cn(
        "rounded-md p-1.5 disabled:opacity-30",
        danger ? "text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
      {t.tip}
    </button>
  );
}

/** Labelled, 44px action for narrow widths. */
function WideBtn({ children, label, run, off, text, danger }: Action & { children: React.ReactNode; text: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={run}
      disabled={off}
      className={cn(
        "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium disabled:opacity-30",
        danger ? "bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300" : "bg-muted text-foreground hover:bg-accent",
      )}
    >
      {children}
      {text}
    </button>
  );
}
