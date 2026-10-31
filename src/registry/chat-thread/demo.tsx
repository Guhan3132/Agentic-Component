"use client";

import { useEffect, useRef, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { PromptComposer } from "../prompt-composer/prompt-composer";
import { ChatThread, type ChatMessage } from "./chat-thread";

const scenarios: Scenario[] = [
  { id: "conversation", label: "Conversation", hint: "A list, references and a file. Send a message: it shows as sending, the agent types, then its reply streams in. Rate or copy a reply with the icons under it.", script: [] },
  { id: "streaming", label: "Streaming", hint: "The agent is working before the first word arrives, then the reply streams in. The box turns Send into Stop.", script: [] },
  { id: "handoff", label: "Hand-off", hint: "Notices mark a hand-off to a person, and a red line shows where unread messages begin.", script: [] },
  { id: "failed", label: "Failed send", hint: "A message that did not go through says so, stays visible, and offers Retry.", script: [] },
  { id: "history", label: "Long thread", hint: "Scroll up. When the agent replies, the thread keeps your place and shows a jump button with a count instead of pulling you down.", script: [] },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const clock = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const TODAY: ChatMessage = { id: "d1", role: "system", variant: "date", text: "Today" };
const GREETING: ChatMessage = { id: "a1", role: "agent", text: "👋 Hi! I'm your planning assistant. What are you working on?", time: "9:41 AM" };

const LONG_REPLY =
  "Here are three bullets. First, the launch moves to 14 November to avoid the holiday freeze. Second, support training finishes a week earlier than planned. Third, the open risk is the payments migration, which still needs a rollback plan before go-live.";

const steps = (
  <ol className="list-decimal space-y-1 pl-5 text-[15px] leading-relaxed text-foreground @md:text-sm">
    <li>Set the budget and the dates.</li>
    <li>Shortlist venues.</li>
    <li>Book and send the invite.</li>
    <li>Plan the agenda.</li>
  </ol>
);

const initial = (id: string): ChatMessage[] => {
  if (id === "failed") return [TODAY, GREETING, { id: "u1", role: "user", text: "Book the venue for 14 Nov.", status: "failed" }];
  if (id === "streaming") return [TODAY, { id: "u1", role: "user", text: "Summarise the Q3 launch plan in three bullets.", time: "9:42 AM" }];
  if (id === "handoff") {
    return [
      TODAY,
      { id: "a1", role: "agent", text: "I can only check basic details. I'll connect you with someone from support for a closer look. Please hold on…", time: "9:44 AM" },
      { id: "n1", role: "system", variant: "notice", text: "Your expected waiting time is 2 min." },
      { id: "n2", role: "system", variant: "notice", text: "You are now connected with Sam Rivera." },
      { id: "n3", role: "system", variant: "unread", text: "1 Unread Message" },
      {
        id: "s1",
        role: "agent",
        sender: { name: "Sam Rivera" },
        text: "Hello! I'm Sam from support. I see the budget does not add up. Here is a corrected template you can use. Can you try it?",
        attachments: [{ name: "Corrected_Budget_Template", type: "XLSX" }],
        time: "9:46 AM",
      },
    ];
  }
  if (id === "history") {
    const lines: [ChatMessage["role"], string][] = [
      ["agent", "Hi, I can plan trips, draft emails and check budgets."],
      ["user", "Find venues in Lisbon for 8 people."],
      ["agent", "I found nine venues. Three are free on 14 and 15 November."],
      ["agent", "The best value is Casa Alfama at about $1,320 a night."],
      ["user", "Is breakfast included?"],
      ["agent", "Yes, breakfast is included for all guests."],
      ["user", "And a meeting room?"],
      ["agent", "There is a room for up to ten people with a screen."],
      ["user", "What is the total for two nights?"],
      ["agent", "$2,640 including breakfast, which is under your $3,000 budget."],
      ["user", "Can you hold it until Friday?"],
      ["agent", "I can request a hold. It needs your approval first."],
      ["user", "Go ahead and request it."],
      ["agent", "Requested. I will tell you as soon as they confirm."],
    ];
    return [TODAY, ...lines.map(([role, text], i): ChatMessage => ({ id: `h${i}`, role, text, time: i % 2 ? "9:44 AM" : "9:43 AM" }))];
  }
  return [
    TODAY,
    GREETING,
    { id: "u1", role: "user", text: "Help me plan a team offsite.", time: "9:42 AM" },
    {
      id: "a2",
      role: "agent",
      text: "Sure! Planning an offsite takes four steps.",
      content: steps,
      links: [
        { label: "How to plan an offsite", kind: "article", href: "https://example.com/offsite" },
        { label: "Venue shortlist", kind: "external", href: "https://example.com/venues" },
        { label: "Offsite budget template", kind: "download", href: "https://example.com/budget.xlsx" },
      ],
    },
    { id: "a3", role: "agent", text: "Would you like me to start with venues?", time: "9:42 AM" },
    { id: "u2", role: "user", text: "Yes. Here is our budget.", attachments: [{ name: "Budget", type: "XLSX" }], time: "9:43 AM" },
  ];
};

export default function Demo() {
  const [id, setId] = useState("conversation");
  const [messages, setMessages] = useState<ChatMessage[]>(() => initial("conversation"));
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach((t) => {
      clearTimeout(t);
      clearInterval(t);
    });
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  /** The agent types for a moment, then streams its reply word by word. */
  const reply = (text: string) => {
    setBusy(true);
    setTyping(true);
    later(() => {
      const mid = uid();
      setTyping(false);
      setMessages((m) => [...m, { id: mid, role: "agent", text: "", status: "streaming" }]);
      let i = 0;
      const iv = setInterval(() => {
        i = Math.min(text.length, i + 3);
        const done = i >= text.length;
        setMessages((m) => m.map((x) => (x.id === mid ? { ...x, text: text.slice(0, i), status: done ? undefined : "streaming", time: done ? clock() : x.time } : x)));
        if (done) {
          clearInterval(iv);
          setBusy(false);
        }
      }, 28);
      timers.current.push(iv);
    }, 1100);
  };

  const deliver = (mid: string, text: string) => {
    setMessages((m) => m.map((x) => (x.id === mid ? { ...x, status: undefined, time: clock() } : x)));
    reply(/venue|book|hold/i.test(text) ? "Done. I have asked the venue to hold 14 and 15 November and will confirm once they reply." : "Got it. I will look into that and come back with a short plan you can edit before anything runs.");
  };

  const send = (text: string) => {
    const mid = uid();
    setMessages((m) => [...m, { id: mid, role: "user", text, status: "sending" }]);
    later(() => deliver(mid, text), 500);
  };

  const retry = (mid: string) => {
    const text = messages.find((m) => m.id === mid)?.text ?? "";
    setMessages((m) => m.map((x) => (x.id === mid ? { ...x, status: "sending" } : x)));
    later(() => deliver(mid, text), 700);
  };

  const stop = () => {
    clearTimers();
    setTyping(false);
    setBusy(false);
    setMessages((m) => m.filter((x) => !(x.status === "streaming" && !x.text)).map((x) => (x.status === "streaming" ? { ...x, status: undefined } : x)));
  };

  const load = (next: string) => {
    clearTimers();
    setId(next);
    setTyping(false);
    setBusy(false);
    setMessages(initial(next));
    if (next === "streaming") later(() => reply(LONG_REPLY), 500);
    if (next === "history") {
      later(() => setMessages((m) => [...m, { id: uid(), role: "agent", text: "Quick update: the venue confirmed the hold until Friday.", time: clock() }]), 5000);
    }
  };

  return (
    <DemoFrame fit="auto" scenarios={scenarios} scenarioId={id} onScenario={load} onReplay={() => load(id)}>
      <ChatThread
        className="h-[32rem]"
        messages={messages}
        typing={typing}
        onRetry={retry}
        onFeedback={(mid, v) => setMessages((m) => m.map((x) => (x.id === mid ? { ...x, feedback: v ?? undefined } : x)))}
        footer={<PromptComposer controls={false} status={busy ? "generating" : "idle"} onStop={stop} onSubmit={(m) => send(m.text)} placeholder="Message the assistant" />}
      />
    </DemoFrame>
  );
}
