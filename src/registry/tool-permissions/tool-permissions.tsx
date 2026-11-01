"use client";

import { Eye, PencilLine, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/cn";

export type PermissionMode = "allow" | "ask" | "block";
export type ToolRisk = "read" | "write" | "destructive";
export type PermissionTool = { id: string; name: string; description: string; risk: ToolRisk; mode: PermissionMode };

/** The agent asking for something it has not been given yet. */
export type PermissionRequest = { toolId: string; reason: string };
export type RequestDecision = "once" | "always" | "deny";

type Props = {
  tools: PermissionTool[];
  onChange: (id: string, mode: PermissionMode) => void;
  request?: PermissionRequest;
  onDecide?: (decision: RequestDecision) => void;
  /** Puts every tool back to its default. Shown only when something has been changed. */
  onReset?: () => void;
  className?: string;
};

const RISK = {
  read: { label: "Reads", icon: Eye, tone: "text-muted-foreground" },
  write: { label: "Changes things", icon: PencilLine, tone: "text-amber-700 dark:text-amber-300" },
  destructive: { label: "Hard to undo", icon: Trash2, tone: "text-rose-700 dark:text-rose-300" },
};

const MODES: { value: PermissionMode; label: string }[] = [
  { value: "allow", label: "Allow" },
  { value: "ask", label: "Ask" },
  { value: "block", label: "Block" },
];

/**
 * What the agent may do, one line per tool, in words a person can judge. Each tool is a native radio
 * group (Allow, Ask, Block), so arrow keys and screen readers work with no extra code. When the agent
 * needs something it was not given, it asks in plain words with a one-time yes, an always, or a no.
 */
export function ToolPermissions({ tools, onChange, request, onDecide, onReset, className }: Props) {
  const requested = request ? tools.find((t) => t.id === request.toolId) : undefined;
  const counts = { allow: 0, ask: 0, block: 0 };
  for (const t of tools) counts[t.mode]++;

  return (
    <section aria-label="Tool permissions" className={cn("@container rounded-xl border border-border bg-card", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="flex items-center gap-2 font-medium text-foreground">
            <ShieldAlert size={16} aria-hidden /> What the agent can do
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {counts.allow} allowed, {counts.ask} ask first, {counts.block} blocked
          </p>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:min-h-11"
          >
            <RotateCcw size={13} aria-hidden /> Reset
          </button>
        )}
      </header>

      {/* Announced once when the agent asks. */}
      <div role="status" aria-live="polite">
        {request && requested && (
          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <p className="text-sm text-foreground">
              The agent wants to use <strong className="font-medium">{requested.name}</strong>.
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">{request.reason}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Choice onClick={() => onDecide?.("once")} primary>
                Allow once
              </Choice>
              <Choice onClick={() => onDecide?.("always")}>Always allow</Choice>
              <Choice onClick={() => onDecide?.("deny")}>Deny</Choice>
            </div>
          </div>
        )}
      </div>

      <ul className="divide-y divide-border">
        {tools.map((t) => (
          <Row key={t.id} tool={t} highlighted={request?.toolId === t.id} onChange={(m) => onChange(t.id, m)} />
        ))}
      </ul>
    </section>
  );
}

function Row({ tool, highlighted, onChange }: { tool: PermissionTool; highlighted: boolean; onChange: (m: PermissionMode) => void }) {
  const name = useId();
  const risk = RISK[tool.risk];
  const Icon = risk.icon;
  return (
    <li className={cn("flex flex-col gap-2 px-4 py-3 @md:flex-row @md:items-center @md:justify-between", highlighted && "bg-muted/30")}>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="font-mono">{tool.name}</span>
          <span className={cn("inline-flex items-center gap-1 text-xs font-normal", risk.tone)}>
            <Icon size={12} aria-hidden /> {risk.label}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      </div>
      <fieldset className="shrink-0">
        <legend className="sr-only">Permission for {tool.name}</legend>
        <div className="inline-flex rounded-lg bg-muted p-0.5">
          {MODES.map((m) => (
            <label
              key={m.value}
              className={cn(
                "relative cursor-pointer rounded-md px-3 py-1 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring pointer-coarse:grid pointer-coarse:min-h-11 pointer-coarse:place-items-center pointer-coarse:px-4",
                tool.mode === m.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                tool.mode === m.value && m.value === "block" && "text-rose-700 dark:text-rose-300",
              )}
            >
              <input type="radio" name={name} value={m.value} checked={tool.mode === m.value} onChange={() => onChange(m.value)} className="sr-only" />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>
    </li>
  );
}

function Choice({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium pointer-coarse:min-h-11 pointer-coarse:px-4",
        primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
