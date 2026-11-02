"use client";

import { ChevronDown, CircleCheck, CircleDashed, CircleMinus, CircleX, RotateCw } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export type TaskStatus = "pending" | "active" | "done" | "failed" | "skipped";
export type Task = { id: string; label: string; status: TaskStatus; /** One short line under the task, e.g. what it found or why it failed. */ detail?: string };

type Props = {
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
export function TaskChecklist({ tasks, title = "Plan", defaultOpen = true, onRetry, className }: Props) {
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
