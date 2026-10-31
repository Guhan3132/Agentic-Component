"use client";

import { Monitor, Moon, RotateCw, Smartphone, Sun } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { toolsOf } from "@/lib/simulator/derive";
import { tokens } from "@/lib/simulator/helpers";
import type { AgentEvent, Step } from "@/lib/simulator/types";
import { useAgentSimulator } from "@/lib/simulator/useAgentSimulator";
import { ApprovalStep } from "@/registry/approval-step/approval-step";
import { AiStar, ChatThread, type ChatMessage } from "@/registry/chat-thread/chat-thread";
import { ConfidenceBadge } from "@/registry/confidence-badge/confidence-badge";
import { PlanPreview, type PlanItem } from "@/registry/plan-preview/plan-preview";
import { PromptComposer } from "@/registry/prompt-composer/prompt-composer";
import { ToolTimeline } from "@/registry/tool-timeline/tool-timeline";
import { WhyThisAnswer } from "@/registry/why-this-answer/why-this-answer";

/* ------------------------------------------------------------------ scripted agent flows */

const text = (delay: number, s: string, speed = 40): Step[] => [{ delay, event: { type: "token", text: "" } }, ...tokens(s, speed)];
const call = (id: string, name: string, args: string, wait: number): Step => ({ delay: wait, event: { type: "tool_call", id, name, args } });
const result = (id: string, ok: boolean, summary: string, wait: number): Step => ({ delay: wait, event: { type: "tool_result", id, ok, summary } });

const SCRIPTS = {
  // Plan -> run tools (one fails and recovers) -> ask before booking -> confidence and sources.
  offsite: [
    ...text(500, "I will plan the offsite in a few steps. Review and edit them first. "),
    { delay: 300, event: { type: "plan", id: "plan", steps: ["Find venues for 8 people under $3k", "Check availability for 14 to 16 Nov", "Estimate the total cost", "Ask you before booking"] } },
    call("t1", "search_venues", '{ city: "Lisbon", people: 8 }', 500),
    result("t1", false, "Venue API timed out after 10s", 1200),
    call("t2", "search_venues", '{ source: "backup" }', 500),
    result("t2", true, "Found 9 venues using the backup source", 1200),
    call("t3", "estimate_cost", '{ venue: "Casa Alfama" }', 300),
    result("t3", true, "Total $2,640 for 2 nights, under budget", 1000),
    ...text(400, "Casa Alfama fits at $2,640 all in. I need your approval to book it."),
    {
      delay: 400,
      event: { type: "approval_required", id: "book", title: "Book Casa Alfama", description: "Charges the team card on file.", risk: "medium", details: ["2 nights, 14 to 16 Nov", "8 guests", "Total: $2,640.00"] },
    },
    ...text(700, "Booked. The confirmation is on its way to your inbox."),
    { delay: 300, event: { type: "confidence", value: 0.86, reason: "Price and dates were confirmed with the venue, but the main source was down." } },
    {
      delay: 200,
      event: {
        type: "sources",
        reasoning: ["Searched venues, retried on the backup source", "Priced the best match against your budget", "Booked only after your approval"],
        items: [{ title: "Casa Alfama rates 2025", url: "https://example.com/casa-alfama", snippet: "Whole house for 8, from $1,320 per night." }],
      },
    },
    { delay: 100, event: { type: "done" } },
  ] as Step[],

  // A plain answer with how sure the agent is and where it came from.
  summary: [
    ...text(
      600,
      "Here are three bullets. First, the launch moves to 14 November to avoid the holiday freeze. Second, support training finishes a week earlier than planned. Third, the open risk is the payments migration, which still needs a rollback plan before go-live.",
      30,
    ),
    { delay: 300, event: { type: "confidence", value: 0.74, reason: "Based on one planning document. The migration date comes from an older draft." } },
    {
      delay: 200,
      event: {
        type: "sources",
        reasoning: ["Read the Q3 launch plan", "Compared the dates with the training calendar", "Flagged the migration as the open risk"],
        items: [{ title: "Q3 launch plan", url: "https://example.com/q3", snippet: "Launch: 14 Nov. Support training complete: 7 Nov." }],
      },
    },
    { delay: 100, event: { type: "done" } },
  ] as Step[],

  // Tool calls only: shows a failure, the recovery and the answer.
  venues: [
    ...text(500, "I will search for venues first. "),
    call("t1", "search_venues", '{ city: "Lisbon", people: 8 }', 500),
    result("t1", false, "Venue API timed out after 10s", 1300),
    call("t2", "search_venues", '{ source: "backup" }', 600),
    result("t2", true, "Found 9 venues using the backup source", 1300),
    call("t3", "filter_by_budget", '{ max: 3000 }', 300),
    result("t3", true, "3 venues are free on your dates", 1000),
    ...text(500, "The best value is Casa Alfama at about $1,320 a night, with breakfast and a meeting room included."),
    { delay: 300, event: { type: "confidence", value: 0.9, reason: "Prices come straight from the venues." } },
    { delay: 100, event: { type: "done" } },
  ] as Step[],

  // A draft, then a low-risk approval before it is sent.
  reply: [
    ...text(500, "Here is a draft: Hi Sam, thanks for the update. Tuesday works for me, and I will send the agenda tonight. Best, Alex. I can send it for you."),
    {
      delay: 400,
      event: { type: "approval_required", id: "send", title: "Send reply to Sam", description: "Sends the draft above from your account.", risk: "low", details: ["To: sam@example.com", "Subject: Re: Tuesday sync"] },
    },
    ...text(600, "Sent. I will let you know if Sam replies."),
    { delay: 100, event: { type: "done" } },
  ] as Step[],
};

type FlowKind = keyof typeof SCRIPTS;

const pick = (prompt: string): FlowKind => {
  if (/summar|bullet|q3/i.test(prompt)) return "summary";
  if (/venue|find|search|lisbon/i.test(prompt)) return "venues";
  if (/reply|email|draft|sam/i.test(prompt)) return "reply";
  return "offsite";
};

const STARTERS: { title: string; hint: string; prompt: string; flow: FlowKind }[] = [
  { title: "Plan a team offsite", hint: "Edit the plan, then approve the booking", prompt: "Plan a team offsite for 8 people under $3k.", flow: "offsite" },
  { title: "Summarise the Q3 launch", hint: "See the sources and how sure I am", prompt: "Summarise the Q3 launch plan in three bullets.", flow: "summary" },
  { title: "Find venues in Lisbon", hint: "Watch each step, even when one fails", prompt: "Find venues in Lisbon for 8 people.", flow: "venues" },
  { title: "Draft a reply to Sam", hint: "I will ask before sending anything", prompt: "Draft a reply to Sam about Tuesday's sync.", flow: "reply" },
];

/* ------------------------------------------------------------------ turning agent events into chat messages */

type Block =
  | { kind: "text"; text: string }
  | { kind: "plan"; steps: string[]; resolved?: "approved" | "rejected" }
  | { kind: "tools"; ids: string[] }
  | { kind: "approval"; event: Extract<AgentEvent, { type: "approval_required" }>; resolved?: "approved" | "rejected" }
  | { kind: "confidence"; value: number; reason: string }
  | { kind: "sources"; event: Extract<AgentEvent, { type: "sources" }> };

function toBlocks(events: AgentEvent[]): Block[] {
  const blocks: Block[] = [];
  for (const e of events) {
    const last = blocks[blocks.length - 1];
    if (e.type === "token") {
      if (last?.kind === "text") last.text += e.text;
      else blocks.push({ kind: "text", text: e.text });
    } else if (e.type === "plan") blocks.push({ kind: "plan", steps: e.steps });
    else if (e.type === "tool_call") {
      if (last?.kind === "tools") last.ids.push(e.id);
      else blocks.push({ kind: "tools", ids: [e.id] });
    } else if (e.type === "approval_required") blocks.push({ kind: "approval", event: e });
    else if (e.type === "approval_resolved") {
      const b = [...blocks].reverse().find((x) => (x.kind === "plan" && e.id === "plan") || (x.kind === "approval" && x.event.id === e.id));
      if (b && (b.kind === "plan" || b.kind === "approval")) b.resolved = e.decision;
    } else if (e.type === "confidence") blocks.push({ kind: "confidence", value: e.value, reason: e.reason });
    else if (e.type === "sources") blocks.push({ kind: "sources", event: e });
  }
  return blocks;
}

/* ------------------------------------------------------------------ the conversation */

function PlaygroundChat() {
  const [flow, setFlow] = useState<{ turn: number; script: Step[]; prompt: string } | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [items, setItems] = useState<PlanItem[]>([]);
  const turns = useRef(0);
  const sim = useAgentSimulator(flow?.script ?? SCRIPTS.offsite, 1);
  const running = sim.status === "running" || sim.status === "waiting";

  // Start the script once it is in place for a new turn.
  useEffect(() => {
    if (flow) sim.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow?.turn]);

  // Keep the editable plan in step with the plan the agent proposes.
  const planEvent = sim.events.find((e) => e.type === "plan");
  useEffect(() => {
    if (planEvent?.type === "plan") setItems(planEvent.steps.map((t, i) => ({ id: `${flow?.turn}-p${i}`, text: t })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planEvent]);

  const blocks = toBlocks(sim.events);
  const tools = toolsOf(sim.events);

  const current: ChatMessage[] = flow
    ? [
        { id: `${flow.turn}-user`, role: "user", text: flow.prompt },
        ...blocks.flatMap((b, i): ChatMessage[] => {
          const id = `${flow.turn}-${i}`;
          switch (b.kind) {
            case "text":
              return b.text.trim() ? [{ id, role: "agent", text: b.text, status: sim.status === "running" && i === blocks.length - 1 ? "streaming" : undefined }] : [];
            case "plan":
              return [
                {
                  id,
                  role: "agent",
                  text: "",
                  content: (
                    <PlanPreview steps={items} onChange={setItems} disabled={!!b.resolved} onConfirm={() => sim.decide("approved")} onCancel={() => sim.decide("rejected")} />
                  ),
                },
              ];
            case "tools":
              return [
                {
                  id,
                  role: "agent",
                  text: "",
                  content: (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <ToolTimeline steps={tools.filter((t) => b.ids.includes(t.id))} />
                    </div>
                  ),
                },
              ];
            case "approval":
              return [
                {
                  id,
                  role: "agent",
                  text: "",
                  content: (
                    <ApprovalStep
                      title={b.event.title}
                      description={b.event.description}
                      risk={b.event.risk}
                      details={b.event.details}
                      state={b.resolved ?? "pending"}
                      onApprove={() => sim.decide("approved")}
                      onReject={() => sim.decide("rejected")}
                    />
                  ),
                },
              ];
            case "confidence":
              return [{ id, role: "agent", text: "", content: <ConfidenceBadge value={b.value} reason={b.reason} /> }];
            case "sources":
              return [{ id, role: "agent", text: "", content: <WhyThisAnswer sources={b.event.items} reasoning={b.event.reasoning} /> }];
          }
        }),
      ]
    : [];

  const begin = (prompt: string, kind?: FlowKind) => {
    const q = prompt.trim();
    if (!q) return;
    if (flow) setHistory((h) => [...h, ...current]); // keep the last turn on screen
    turns.current += 1;
    setItems([]);
    setFlow({ turn: turns.current, script: SCRIPTS[kind ?? pick(q)], prompt: q });
  };

  const typing = !!flow && sim.status === "running" && blocks.length === 0;

  const composer = (
    <PromptComposer
      status={running ? "generating" : "idle"}
      onStop={sim.stop}
      onSubmit={(m) => begin(m.text)}
      placeholder={flow ? "Message the assistant" : "Ask anything, or pick a starter"}
    />
  );

  return (
    <div className="@container mx-auto flex h-full w-full max-w-3xl flex-col px-4 pb-4">
      {!flow ? (
        <>
          {/* Welcome: who I am, what I will do, and a few ways to start */}
          {/* my-auto centres the content when there is room, and lets it scroll from the top when there is not */}
          <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto py-6 text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="my-auto flex w-full flex-col items-center gap-6">
            <span aria-hidden className="grid size-14 place-items-center rounded-2xl border border-border bg-card shadow-sm">
              <span className="scale-[1.6]">
                <AiStar />
              </span>
            </span>
            <div className="max-w-md">
              <h1 className="text-2xl font-semibold @md:text-3xl">Welcome to the playground</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                I&apos;m your planning assistant. Ask me to plan, research or draft. I&apos;ll show every step, and ask before anything risky.
              </p>
            </div>
            <div className="grid w-full gap-2.5 text-left @xl:grid-cols-2">
              {STARTERS.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => begin(s.prompt, s.flow)}
                  className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="block text-[15px] font-medium text-foreground">{s.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{s.hint}</span>
                </button>
              ))}
            </div>
            </div>
          </div>
          {composer}
        </>
      ) : (
        <ChatThread
          className="min-h-0 flex-1"
          messages={[{ id: "date", role: "system", variant: "date", text: "Today" }, ...history, ...current]}
          typing={typing}
          busy={running}
          footer={composer}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ the full-screen app */

function Tip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-150 pointer-fine:block group-hover/tip:opacity-100 group-focus-visible/tip:opacity-100"
    >
      {children}
    </span>
  );
}

function TopButton({ label, tip, pressed, onClick, children }: { label: string; tip: string; pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "group/tip relative grid size-10 place-items-center rounded-lg hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:size-9",
        pressed ? "bg-muted text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
      <Tip>{tip}</Tip>
    </button>
  );
}

/**
 * The whole screen is the app: a slim top bar and a chat, like the apps it imitates. Theme, reset
 * and desktop/mobile live at the top right; mobile shows the same chat inside a phone frame.
 */
export function Playground() {
  const [dark, setDark] = useState(false);
  const [fading, setFading] = useState(false);
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [run, setRun] = useState(0);

  const toggleTheme = () => {
    setFading(true);
    setDark(!dark);
    setTimeout(() => setFading(false), 360);
  };

  return (
    <div className={cn("flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-background text-foreground", dark && "dark", fading && "theme-anim")}>
      <header className="mx-auto flex h-14 w-full max-w-6xl shrink-0 items-center justify-between px-5">
        <span className="px-1 text-sm font-semibold tracking-tight">Playground</span>

        <div className="flex items-center gap-1">
          <TopButton label={dark ? "Switch to light mode" : "Switch to dark mode"} tip={dark ? "Light mode" : "Dark mode"} onClick={toggleTheme}>
            {dark ? <Moon size={17} /> : <Sun size={17} />}
          </TopButton>
          <TopButton label="Reset conversation" tip="Reset" onClick={() => setRun((n) => n + 1)}>
            <RotateCw size={17} />
          </TopButton>
          <div role="group" aria-label="Preview size" className="ml-1 hidden items-center gap-0.5 rounded-xl border border-border p-0.5 sm:flex">
            <TopButton label="Desktop view" tip="Desktop" pressed={view === "desktop"} onClick={() => setView("desktop")}>
              <Monitor size={17} />
            </TopButton>
            <TopButton label="Mobile view" tip="Mobile" pressed={view === "mobile"} onClick={() => setView("mobile")}>
              <Smartphone size={17} />
            </TopButton>
          </div>
        </div>
      </header>

      {/* One chat instance in both views, so switching size keeps the conversation */}
      <main className={cn("min-h-0 flex-1", view === "mobile" && "grid place-items-center bg-muted/50 px-4 pb-4")}>
        <div
          className={cn(
            "h-full",
            view === "mobile" && "max-h-[52rem] w-[375px] max-w-full overflow-hidden rounded-[2.25rem] border-[8px] border-zinc-900 bg-background shadow-2xl dark:border-zinc-600",
          )}
        >
          <PlaygroundChat key={run} />
        </div>
      </main>
    </div>
  );
}
