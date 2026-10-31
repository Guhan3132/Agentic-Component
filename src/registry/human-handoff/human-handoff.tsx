"use client";

import { Check, Clock, Loader2, Mail, MessageCircleMore } from "lucide-react";
import { cn } from "@/lib/cn";

export type HandoffState = "offer" | "waiting" | "connected" | "unavailable";

type Props = {
  state: HandoffState;
  /** What the person will see, so the user never has to repeat themselves. */
  summary?: string[];
  /** Place in the queue, and a rough wait. Shown while waiting. */
  position?: number;
  etaMinutes?: number;
  /** Who joined. Shown when connected. */
  personName?: string;
  /** When the team is back. Shown when unavailable. */
  backAt?: string;
  onRequest?: () => void;
  onCancel?: () => void;
  /** Keep chatting with the agent. */
  onDecline?: () => void;
  /** A non-live way to reach a person, such as email. Offered while waiting and when unavailable. */
  onFallback?: () => void;
  className?: string;
};

/**
 * Hand a conversation to a person without losing it. The user sees what will be shared before they
 * agree, the wait is a real number rather than a spinner, they can leave the queue or switch to email,
 * and the person who joins already has the context.
 */
export function HumanHandoff({ state, summary = [], position, etaMinutes, personName = "A teammate", backAt, onRequest, onCancel, onDecline, onFallback, className }: Props) {
  const ordinal = position === 1 ? "next" : position ? `number ${position}` : null;

  return (
    <section aria-label="Talk to a person" className={cn("rounded-xl border border-border bg-card p-4", className)}>
      {/* One status region, so each change is announced once. */}
      <div role="status" aria-live="polite">
        {state === "offer" && (
          <div>
            <h3 className="flex items-center gap-2 font-medium text-foreground">
              <MessageCircleMore size={17} aria-hidden /> Want to talk to a person?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">I can pass this chat to our team. You will not need to explain it again.</p>
          </div>
        )}
        {state === "waiting" && (
          <div>
            <h3 className="flex items-center gap-2 font-medium text-foreground">
              <Loader2 size={17} className="animate-spin motion-reduce:animate-none" aria-hidden /> Finding someone for you
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {ordinal ? `You are ${ordinal} in line` : "You are in line"}
              {etaMinutes ? `, about ${etaMinutes} min.` : "."} You can keep this page open or leave, and we will email you.
            </p>
          </div>
        )}
        {state === "connected" && (
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-medium text-primary-foreground" aria-hidden>
              {personName.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <h3 className="font-medium text-foreground">{personName} joined the chat</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">They can see the summary below. The agent has stepped back.</p>
            </div>
          </div>
        )}
        {state === "unavailable" && (
          <div>
            <h3 className="flex items-center gap-2 font-medium text-foreground">
              <Clock size={17} aria-hidden /> Our team is offline
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {backAt ? `They are back ${backAt}.` : "They are not available right now."} Leave your details and they will reply there, with this chat attached.
            </p>
          </div>
        )}
      </div>

      {summary.length > 0 && state !== "unavailable" && (
        <div className="mt-3 rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">{state === "connected" ? "Shared with them" : "What they will see"}</p>
          <ul className="mt-1.5 space-y-1 text-sm text-foreground/80">
            {summary.map((s) => (
              <li key={s} className="flex gap-2">
                <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {state === "offer" && (
          <>
            <Btn primary onClick={onRequest}>
              Connect me to a person
            </Btn>
            <Btn onClick={onDecline}>Keep chatting</Btn>
          </>
        )}
        {state === "waiting" && (
          <>
            <Btn onClick={onCancel}>Leave the line</Btn>
            {onFallback && (
              <Btn onClick={onFallback}>
                <Mail size={14} aria-hidden /> Email me instead
              </Btn>
            )}
          </>
        )}
        {state === "unavailable" && (
          <>
            {onFallback && (
              <Btn primary onClick={onFallback}>
                <Mail size={14} aria-hidden /> Email the team
              </Btn>
            )}
            <Btn onClick={onDecline}>Keep chatting with the agent</Btn>
          </>
        )}
      </div>
    </section>
  );
}

function Btn({ children, onClick, primary }: { children: React.ReactNode; onClick?: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium pointer-coarse:min-h-11 pointer-coarse:px-4",
        primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
