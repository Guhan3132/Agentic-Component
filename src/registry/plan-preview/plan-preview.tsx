"use client";

import { ArrowDown, ArrowUp, ChevronDown, CircleCheck, CircleDashed, CircleMinus, CircleX, Ellipsis, Play, Plus, RotateCw, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
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

/** Compact icon button for wide layouts. Delete uses the error colour so it reads as destructive. */
function IconBtn({ children, label, run, off, tip, danger }: Action & { children: React.ReactNode }) {
  const [tEl, setTEl] = useState<HTMLButtonElement | null>(null);
  const t = useTip(tEl, tip ?? label);
  return (
    <button
      ref={setTEl}
      {...t.bind}
      type="button"
      aria-label={label}
      onClick={run}
      disabled={off}
      className={cn(
        "rounded-md p-1.5 disabled:opacity-30",
        danger ? "text-danger hover:bg-danger/10 hover:text-danger dark:hover:text-danger" : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
        danger ? "bg-danger/10 text-danger hover:bg-danger/15" : "bg-muted text-foreground hover:bg-accent",
      )}
    >
      {children}
      {text}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Task checklist: part of this pattern (it used to be its own pattern, "task-checklist").
// ---------------------------------------------------------------------------
export type TaskStatus = "pending" | "active" | "done" | "failed" | "skipped";
export type Task = { id: string; label: string; status: TaskStatus; /** One short line under the task, e.g. what it found or why it failed. */ detail?: string };

type TaskChecklistProps = {
  tasks: Task[];
  title?: string;
  /** Collapsed shows only the step in progress, which suits a chat. */
  defaultOpen?: boolean;
  onRetry?: (id: string) => void;
  className?: string;
};

const SR: Record<TaskStatus, string> = { pending: "not started", active: "in progress", done: "done", failed: "failed", skipped: "skipped" };

/**
 * The agent's to-do list while it works: what is done, what it is doing now, and what is next.
 * Finished steps fade back, the current one stands out, and a failure stays on its line with Retry.
 * Collapsed, it shrinks to one line with the current step, so a long plan does not take over a chat.
 */
export function TaskChecklist({ tasks, title = "Plan", defaultOpen = true, onRetry, className }: TaskChecklistProps) {
  const [open, setOpen] = useState(defaultOpen);
  const listId = useId();
  const done = tasks.filter((t) => t.status === "done" || t.status === "skipped").length;
  const active = tasks.find((t) => t.status === "active");
  const failed = tasks.find((t) => t.status === "failed");
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const finished = total > 0 && done === total;

  // One sentence for screen readers, updated only when the current step changes.
  const announce = failed ? `Stopped: ${failed.label} failed.` : finished ? `All ${total} steps done.` : active ? `Working on: ${active.label}.` : "";
  const current = failed ? failed.label : finished ? "All steps done" : (active?.label ?? "Not started");

  return (
    <section aria-label={title} className={cn("rounded-xl border border-border bg-card", className)}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="font-medium text-foreground">{title}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {done} of {total}
            </span>
          </span>
          {!open && <span className={cn("mt-0.5 block truncate text-sm", failed ? "text-danger" : "text-muted-foreground")}>{current}</span>}
        </span>
        <ChevronDown size={16} aria-hidden className={cn("shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", open && "rotate-180")} />
      </button>

      <div className="px-4">
        <div role="progressbar" aria-label={`${title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-1 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none", failed ? "bg-danger" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      <ol id={listId} hidden={!open} className="space-y-0.5 px-2 py-2">
        {tasks.map((t) => (
          <li key={t.id} aria-current={t.status === "active" ? "step" : undefined} className={cn("flex items-start gap-3 rounded-lg px-2 py-1.5", t.status === "active" && "bg-muted/60")}>
            <StatusIcon status={t.status} />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm",
                  t.status === "active" && "font-medium text-foreground",
                  t.status === "pending" && "text-foreground/80",
                  t.status === "done" && "text-muted-foreground",
                  t.status === "skipped" && "text-muted-foreground line-through",
                  t.status === "failed" && "text-foreground",
                )}
              >
                {t.label}
                <span className="sr-only">, {SR[t.status]}</span>
              </p>
              {t.detail && <p className={cn("mt-0.5 text-xs", t.status === "failed" ? "text-danger" : "text-muted-foreground")}>{t.detail}</p>}
            </div>
            {t.status === "failed" && onRetry && (
              <button
                onClick={() => onRetry(t.id)}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground hover:bg-accent pointer-coarse:min-h-11 pointer-coarse:px-3"
              >
                <RotateCw size={12} aria-hidden /> Retry
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function StatusIcon({ status }: { status: TaskStatus }) {
  const cls = "mt-0.5 size-4 shrink-0";
  if (status === "done") return <CircleCheck aria-hidden className={cn(cls, "text-muted-foreground")} />;
  if (status === "failed") return <CircleX aria-hidden className={cn(cls, "text-danger")} />;
  if (status === "skipped") return <CircleMinus aria-hidden className={cn(cls, "text-muted-foreground")} />;
  if (status === "pending") return <CircleDashed aria-hidden className={cn(cls, "text-muted-foreground/60")} />;
  // In progress: a ring with a moving arc. Under reduced motion it holds still.
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn(cls, "text-primary")}>
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="origin-center animate-spin motion-reduce:animate-none" />
    </svg>
  );
}
