"use client";

import { CircleAlert, CircleCheck, CircleDashed, Hourglass, Loader2, RotateCw, Square } from "lucide-react";
import { cn } from "@/lib/cn";

export type AgentState = "working" | "waiting" | "blocked" | "done" | "failed";

export type AgentRun = {
  id: string;
  name: string;
  /** What it is doing right now, or what it finished or failed at. */
  task: string;
  state: AgentState;
  /** 0 to 1. Leave out when the amount of work is unknown. */
  progress?: number;
  /** For waiting and blocked: what it is waiting on, in words. */
  waitingOn?: string;
};

type Props = {
  agents: AgentRun[];
  onStop?: (id: string) => void;
  onRetry?: (id: string) => void;
  /** For a blocked agent: opens whatever it needs from the person. */
  onOpen?: (id: string) => void;
  className?: string;
};

const STATE = {
  working: { label: "Working", icon: Loader2, tone: "text-foreground", spin: true },
  waiting: { label: "Waiting", icon: Hourglass, tone: "text-muted-foreground", spin: false },
  blocked: { label: "Needs you", icon: CircleAlert, tone: "text-amber-700 dark:text-amber-300", spin: false },
  done: { label: "Done", icon: CircleCheck, tone: "text-emerald-700 dark:text-emerald-300", spin: false },
  failed: { label: "Failed", icon: CircleAlert, tone: "text-rose-700 dark:text-rose-300", spin: false },
};

/** One sentence that answers "how is it going?", so nobody has to read every row to find out. */
function summarise(agents: AgentRun[]) {
  const n = (s: AgentState) => agents.filter((a) => a.state === s).length;
  const parts = [
    n("working") && `${n("working")} working`,
    n("waiting") && `${n("waiting")} waiting`,
    n("blocked") && `${n("blocked")} need${n("blocked") === 1 ? "s" : ""} you`,
    n("failed") && `${n("failed")} failed`,
    n("done") && `${n("done")} done`,
  ].filter(Boolean);
  return agents.length ? parts.join(", ") : "No agents running";
}

/**
 * Several agents at once, sorted by what needs attention. Anything blocked or failed floats to the top,
 * every row says what it is doing and what it is waiting on, and the summary line is the only part that
 * is announced, so a screen reader is not interrupted by every progress tick.
 */
export function MultiAgentStatus({ agents, onStop, onRetry, onOpen, className }: Props) {
  const order: AgentState[] = ["blocked", "failed", "working", "waiting", "done"];
  const sorted = [...agents].sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state));
  const summary = summarise(agents);

  return (
    <section aria-label="Agents" className={cn("@container rounded-xl border border-border bg-card", className)}>
      <header className="border-b border-border px-4 py-3">
        <h3 className="font-medium text-foreground">Agents</h3>
        <p role="status" aria-live="polite" className="mt-0.5 text-xs text-muted-foreground">
          {summary}
        </p>
      </header>

      {agents.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
          <CircleDashed size={16} aria-hidden /> Nothing is running. Start a task and each agent appears here.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((a) => {
            const s = STATE[a.state];
            const Icon = s.icon;
            const pct = a.progress === undefined ? undefined : Math.round(Math.min(Math.max(a.progress, 0), 1) * 100);
            return (
              <li key={a.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <Icon size={16} aria-hidden className={cn("mt-0.5 shrink-0", s.tone, s.spin && "animate-spin motion-reduce:animate-none")} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-medium text-foreground">{a.name}</span>
                      <span className={cn("text-xs", s.tone)}>{s.label}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{a.task}</p>
                    {a.waitingOn && (a.state === "waiting" || a.state === "blocked") && (
                      <p className={cn("mt-0.5 text-xs", a.state === "blocked" ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground")}>Waiting on {a.waitingOn}</p>
                    )}
                    {pct !== undefined && a.state === "working" && (
                      <div className="mt-2 flex items-center gap-2">
                        <div role="progressbar" aria-label={`${a.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
                        </div>
                        <span aria-hidden className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {a.state === "working" && onStop && (
                      <Action label={`Stop ${a.name}`} onClick={() => onStop(a.id)}>
                        <Square size={13} />
                      </Action>
                    )}
                    {a.state === "blocked" && onOpen && (
                      <button
                        onClick={() => onOpen(a.id)}
                        className="rounded-lg bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90 pointer-coarse:min-h-11 pointer-coarse:px-4"
                      >
                        Review
                      </button>
                    )}
                    {a.state === "failed" && onRetry && (
                      <Action label={`Retry ${a.name}`} onClick={() => onRetry(a.id)}>
                        <RotateCw size={13} />
                      </Action>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Action({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid place-items-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:size-11"
    >
      {children}
    </button>
  );
}
