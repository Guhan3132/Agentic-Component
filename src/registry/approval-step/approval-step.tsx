"use client";

import { Check, ShieldAlert, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type Risk = "low" | "medium" | "high";

type Props = {
  title: string;
  description: string;
  risk: Risk;
  details?: string[];
  /** pending shows the buttons; the other two show the outcome. */
  state: "pending" | "approved" | "rejected";
  onApprove: () => void;
  onReject: () => void;
  /** Move focus into the card when it appears. Turn off for static previews. */
  autoFocus?: boolean;
  className?: string;
};

const RISK = {
  low: { label: "Low risk", style: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10" },
  medium: { label: "Needs review", style: "text-amber-700 dark:text-amber-300 bg-amber-500/10" },
  high: { label: "Hard to undo", style: "text-rose-700 dark:text-rose-300 bg-rose-500/10" },
};

/**
 * Human-in-the-loop gate. High-risk actions require an explicit acknowledgement and put
 * initial focus on the safe option (Reject), so a stray Enter never approves.
 */
export function ApprovalStep({ title, description, risk, details = [], state, onApprove, onReject, autoFocus = true, className }: Props) {
  const [ack, setAck] = useState(false);
  const safeRef = useRef<HTMLButtonElement>(null);
  const approveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoFocus && state === "pending") (risk === "high" ? safeRef : approveRef).current?.focus();
  }, [state, risk, autoFocus]);

  const canApprove = risk !== "high" || ack;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      aria-labelledby="approval-title"
      className={cn(
        "rounded-xl border bg-card p-4",
        state === "pending" ? "border-amber-400/50" : "border-border",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="approval-title" className="flex items-center gap-2 font-medium text-foreground">
            <ShieldAlert size={16} className="text-amber-700 dark:text-amber-300" aria-hidden /> {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs", RISK[risk].style)}>{RISK[risk].label}</span>
      </div>

      {details.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground/80">
          {details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}

      {state === "pending" ? (
        <div className="mt-4 space-y-3">
          {risk === "high" && (
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="accent-primary" />
              I understand this cannot be undone
            </label>
          )}
          <div className="flex gap-2">
            <button
              ref={approveRef}
              onClick={onApprove}
              disabled={!canApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 pointer-coarse:py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check size={14} /> Approve
            </button>
            <button
              ref={safeRef}
              onClick={onReject}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 pointer-coarse:py-2.5 text-sm text-foreground hover:bg-accent"
            >
              <X size={14} /> Reject
            </button>
          </div>
        </div>
      ) : (
        <p role="status" className={cn("mt-4 text-sm", state === "approved" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")}>
          {state === "approved" ? "Approved. The agent is continuing." : "Rejected. The agent stopped and changed nothing."}
        </p>
      )}
    </motion.section>
  );
}
