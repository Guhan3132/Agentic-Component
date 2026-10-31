"use client";

import {
  ArrowDown,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Paperclip,
  RotateCw,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChatLink = {
  label: string;
  /** article opens inside the product, external leaves it, download saves a file. */
  kind?: "article" | "external" | "download";
  href?: string;
};

export type ChatFile = { name: string; /** For example PDF or XLSX. */ type?: string };

export type ChatMessage = {
  id: string;
  /** system messages are centred dividers: a date, a notice, or the unread marker. */
  role: "user" | "agent" | "system";
  text: string;
  time?: string;
  status?: "sending" | "failed" | "streaming";
  /** Agent messages: the person's rating of the answer, if they gave one. */
  feedback?: "up" | "down";
  /** Agent messages: a different sender, such as a person from support. Defaults to agentName. */
  sender?: { name: string; avatar?: string };
  /** A list of references under the text, such as help articles or files to download. */
  links?: ChatLink[];
  attachments?: ChatFile[];
  /** Anything custom, shown under the text. */
  content?: ReactNode;
  /** System messages only. */
  variant?: "date" | "notice" | "unread";
};

type Props = {
  messages: ChatMessage[];
  /** The agent is working but has not started replying: shows a typing indicator. */
  typing?: boolean;
  /** The agent is still working on the latest response, so its rate and copy row stays hidden. Defaults to typing or streaming. */
  busy?: boolean;
  /** Name shown above the agent's messages. */
  agentName?: string;
  /** Called from the Retry button on a message whose status is "failed". */
  onRetry?: (id: string) => void;
  /** Called when the person rates an agent message, or takes the rating back (null). */
  onFeedback?: (id: string, value: "up" | "down" | null) => void;
  /** Rendered under the thread, usually a PromptComposer. */
  footer?: ReactNode;
  /** Give the thread a height, for example "h-[28rem]": the messages scroll inside it. */
  className?: string;
};

type Turn = { kind: "turn"; role: "user" | "agent"; who: string; sender?: ChatMessage["sender"]; items: ChatMessage[] };
type Notice = { kind: "system"; message: ChatMessage };

/** Consecutive messages from one sender share a name row, so the thread reads as turns, not a pile of bubbles. */
function arrange(messages: ChatMessage[], agentName: string): (Turn | Notice)[] {
  const out: (Turn | Notice)[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      out.push({ kind: "system", message: m });
      continue;
    }
    const who = m.role === "agent" ? (m.sender?.name ?? agentName) : "You";
    const last = out[out.length - 1];
    if (last?.kind === "turn" && last.role === m.role && last.who === who) last.items.push(m);
    else out.push({ kind: "turn", role: m.role, who, sender: m.sender, items: [m] });
  }
  return out;
}

const NEAR_BOTTOM = 48;

/**
 * A conversation between a person and an agent, drawn flat: the agent writes plain text under its
 * name, in a fixed order (name, answer, references, rate and copy, time), the person gets a soft
 * bubble with its time under it, and system lines mark the date, hand-offs and unread messages. It follows new messages while you are at the bottom; when you have scrolled up
 * it keeps your place and shows a round jump button with a count instead.
 */
export function ChatThread({ messages, typing = false, busy, agentName = "AI Agent", onRetry, onFeedback, footer, className }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const lastId = useRef<string | undefined>(undefined);
  /** Until this time, scroll events come from our own smooth scroll, not from the reader. */
  const guard = useRef(0);
  const [away, setAway] = useState(false);
  const [unseen, setUnseen] = useState(0);

  const last = messages[messages.length - 1];
  const turns = arrange(messages, agentName);
  const tail = turns[turns.length - 1];
  const working = busy ?? (typing || last?.status === "streaming");
  const [jumpTipEl, setJumpTipEl] = useState<HTMLButtonElement | null>(null);
  const jumpTip = useTip(jumpTipEl, "Jump to latest");
  const typingNeedsName = !(tail?.kind === "turn" && tail.role === "agent");

  const toBottom = (smooth: boolean) => {
    const el = scroller.current;
    if (!el) return;
    const calm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = smooth && !calm;
    // A smooth scroll fires many scroll events on the way down. Without this guard they would look like
    // the reader scrolling up and switch following off.
    guard.current = animate ? performance.now() + 800 : 0;
    el.scrollTo({ top: el.scrollHeight, behavior: animate ? "smooth" : "auto" });
  };

  // Follow the conversation, but never yank someone who is reading earlier messages.
  useLayoutEffect(() => {
    const isNew = last?.id !== lastId.current;
    lastId.current = last?.id;
    if (stick.current || (isNew && last?.role === "user")) {
      stick.current = true;
      toBottom(false);
      setUnseen(0);
    } else if (isNew && last?.role === "agent") {
      setUnseen((n) => n + 1);
    }
  }, [messages, typing, last]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el || performance.now() < guard.current) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
    stick.current = near;
    setAway(!near);
    if (near) setUnseen(0);
  };

  return (
    <section aria-label={`Chat with ${agentName}`} className={cn("@container flex min-h-0 flex-col", className)}>
      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          onScroll={onScroll}
          role="log"
          aria-label="Messages"
          aria-relevant="additions"
          tabIndex={0}
          className="h-full space-y-6 overflow-y-auto px-1 py-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-inset [&::-webkit-scrollbar]:hidden"
        >
          {turns.map((t, ti) =>
            t.kind === "system" ? (
              <Divider key={t.message.id} message={t.message} />
            ) : t.role === "agent" ? (
              <AgentTurn key={t.items[0].id} turn={t} fresh={ti === turns.length - 1} showActions={ti !== turns.length - 1 || !working} onFeedback={onFeedback} />
            ) : (
              <UserTurn key={t.items[0].id} turn={t} onRetry={onRetry} fresh={ti === turns.length - 1} />
            ),
          )}

          {typing && (
            <div className="flex flex-col gap-2.5">
              {typingNeedsName && <Who name={agentName} />}
              <div role="status" aria-label={`${agentName} is typing`} className="flex h-6 items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} aria-hidden className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${i * 140}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {away && (
            <motion.button
              ref={setJumpTipEl}
              {...jumpTip.bind}
              type="button"
              aria-label={unseen > 0 ? `Jump to latest, ${unseen} new` : "Jump to latest"}
              onClick={() => {
                stick.current = true;
                toBottom(true);
                setAway(false);
                setUnseen(0);
              }}
              initial={{ opacity: 0, y: 8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96, transition: { duration: 0.12 } }}
              transition={{ type: "spring", bounce: 0, duration: 0.28 }}
              className="absolute inset-x-0 bottom-3 mx-auto grid size-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-lg hover:bg-muted @md:size-10"
            >
              <ArrowDown size={18} />
              {unseen > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">{unseen}</span>
              )}
              {jumpTip.tip}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {footer && <div className="pt-3">{footer}</div>}
    </section>
  );
}

/** Name row above an agent's messages: a sparkle for the AI, a photo or initial for a person. */
function Who({ name, sender }: { name: string; sender?: ChatMessage["sender"] }) {
  return (
    <p className="flex items-center gap-2 text-[15px] font-semibold text-foreground @md:text-sm">
      {sender ? <Avatar name={sender.name} src={sender.avatar} /> : <AiStar />}
      {name}
    </p>
  );
}

/**
 * One agent turn: the name, then every message in it, then a single row to rate or copy the whole
 * response, then its time. The row waits until the agent has finished.
 */
function AgentTurn({ turn, fresh, showActions, onFeedback }: { turn: Turn; fresh: boolean; showActions: boolean; onFeedback?: Props["onFeedback"] }) {
  const last = turn.items[turn.items.length - 1];
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(last.feedback ?? null);
  const answer = turn.items.map((m) => m.text).filter(Boolean).join("\n\n");
  const finished = showActions && !!answer && !turn.items.some((m) => m.status);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const rate = (v: "up" | "down") => {
    const next = vote === v ? null : v;
    setVote(next);
    onFeedback?.(last.id, next);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Who name={turn.who} sender={turn.sender} />
      <div className="flex flex-col gap-5">
        {turn.items.map((m, i) => (
          <AgentMessage key={m.id} m={m} fresh={fresh && i === turn.items.length - 1} />
        ))}
      </div>

      {finished && (
        <div role="group" aria-label="Rate or copy this response" className="-ml-2 flex items-center gap-0.5">
          <Action label="Good response" pressed={vote === "up"} onClick={() => rate("up")}>
            <ThumbsUp size={15} className={vote === "up" ? "fill-current" : undefined} />
          </Action>
          <Action label="Bad response" pressed={vote === "down"} onClick={() => rate("down")}>
            <ThumbsDown size={15} className={vote === "down" ? "fill-current" : undefined} />
          </Action>
          <Action label={copied ? "Copied" : "Copy response"} tip={copied ? "Copied" : "Copy"} onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </Action>
        </div>
      )}

      {last.time && <p className="text-xs text-muted-foreground">{last.time}</p>}
    </div>
  );
}

/** One agent message: the answer, then references, files and any custom content. */
function AgentMessage({ m, fresh }: { m: ChatMessage; fresh: boolean }) {
  return (
    <motion.div
      initial={fresh ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      className="flex flex-col gap-2.5"
    >
      {m.text && (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground @md:text-sm">
          {m.text}
          {m.status === "streaming" && <span aria-hidden className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-foreground/70" />}
        </p>
      )}
      {m.content}
      {m.links && m.links.length > 0 && <LinkList links={m.links} />}
      {m.attachments?.map((f) => <FileCard key={f.name} file={f} />)}
    </motion.div>
  );
}

/** Icon button in the row under a response, with a tooltip for mouse and keyboard users. */
function Action({ children, label, tip, pressed, onClick }: { children: ReactNode; label: string; tip?: string; pressed?: boolean; onClick: () => void }) {
  const [tEl, setTEl] = useState<HTMLButtonElement | null>(null);
  const t = useTip(tEl, tip ?? label);
  return (
    <button
      ref={setTEl}
      {...t.bind}
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-lg hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:size-10",
        pressed ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
      {t.tip}
    </button>
  );
}

function UserTurn({ turn, onRetry, fresh }: { turn: Turn; onRetry?: (id: string) => void; fresh: boolean }) {
  return (
    <div className="flex flex-col items-end gap-2">
      {turn.items.map((m, i) => (
        <motion.div
          key={m.id}
          initial={fresh && i === turn.items.length - 1 ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="flex max-w-[88%] flex-col items-end gap-1"
        >
          {/* A bubble with a file keeps one width (18rem, less on narrow screens), so file bubbles line up whatever the text says */}
          <div className={cn("rounded-2xl bg-muted px-4 py-3", m.attachments?.length && "w-72 max-w-full", m.status === "sending" && "opacity-60", m.status === "failed" && "ring-1 ring-rose-500/50")}>
            {m.text && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground @md:text-sm">{m.text}</p>}
            {m.attachments && (
              <div className={cn("flex flex-col gap-2", m.text && "mt-2")}>
                {m.attachments.map((f) => (
                  <FileCard key={f.name} file={f} raised />
                ))}
              </div>
            )}
          </div>

          {m.status === "failed" ? (
            <p role="alert" className="flex items-center gap-2 px-1 text-xs text-rose-600 dark:text-rose-400">
              <TriangleAlert size={13} aria-hidden /> Not sent.
              {onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(m.id)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium underline underline-offset-2 hover:bg-rose-500/10 pointer-coarse:py-2"
                >
                  <RotateCw size={12} /> Retry
                </button>
              )}
            </p>
          ) : (
            (m.status === "sending" || m.time) && <p className="px-1 text-xs text-muted-foreground">{m.status === "sending" ? "Sending…" : m.time}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/** The date, a notice such as a hand-off, or the line before unread messages. */
function Divider({ message: m }: { message: ChatMessage }) {
  if (m.variant === "date") return <p className="text-center text-xs text-muted-foreground">{m.text}</p>;
  const alert = m.variant === "unread";
  return (
    <div role={alert ? "separator" : undefined} className={cn("flex items-center gap-3 text-xs", alert ? "text-rose-500" : "text-muted-foreground")}>
      <span aria-hidden className={cn("h-px flex-1", alert ? "bg-rose-500/60" : "bg-border")} />
      <span className="text-center">{m.text}</span>
      <span aria-hidden className={cn("h-px flex-1", alert ? "bg-rose-500/60" : "bg-border")} />
    </div>
  );
}

const linkIcon = { article: BookOpen, external: Globe, download: FileText } as const;
const linkTrail = { article: ChevronRight, external: ExternalLink, download: Download } as const;

/** References the agent used or suggests, as a short list in one card. */
function LinkList({ links }: { links: ChatLink[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {links.map((l) => {
        const kind = l.kind ?? "article";
        const Lead = linkIcon[kind];
        const Trail = linkTrail[kind];
        const row = (
          <>
            <Lead size={16} aria-hidden className="shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{l.label}</span>
            <Trail size={15} aria-hidden className="shrink-0 text-muted-foreground" />
          </>
        );
        const cls = "flex min-h-11 w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm text-foreground hover:bg-muted focus-visible:bg-muted focus-visible:outline-none @md:min-h-10";
        return (
          <li key={l.label}>
            {l.href ? (
              <a href={l.href} target={kind === "external" ? "_blank" : undefined} rel="noreferrer" download={kind === "download" ? "" : undefined} className={cls}>
                {row}
              </a>
            ) : (
              <div className={cls}>{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function FileCard({ file, raised }: { file: ChatFile; raised?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border px-3 py-2.5", raised ? "bg-card" : "bg-card")}>
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Paperclip size={16} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">{file.name}</span>
        {file.type && <span className="block text-xs text-muted-foreground">{file.type}</span>}
      </span>
    </div>
  );
}

/** The AI mark: a large and two small four-point stars, filled with a gradient. */
export function AiStar() {
  const id = "ai-star-" + useId().replace(/:/g, "");
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id={id} x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ec4899" />
          <stop offset="0.55" stopColor="#a855f7" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <path d="M10 3.5l1.9 5.3 5.3 1.9-5.3 1.9L10 17.9l-1.9-5.3-5.3-1.9 5.3-1.9z" />
        <path d="M18.5 2.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" />
        <path d="M18 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
      </g>
    </svg>
  );
}

/** A round photo, or an initial on a colour tinted from the name when there is no photo. */
function Avatar({ name, src }: { name: string; src?: string }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="size-6 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      aria-hidden
      className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
      style={{ background: `linear-gradient(135deg, hsl(${h} 75% 58%), hsl(${(h + 45) % 360} 70% 42%))` }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
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
