"use client";

import { useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { AgentMemory, type MemoryItem } from "./agent-memory";

const seed: MemoryItem[] = [
  { id: "1", text: "You prefer window seats", source: "From your chat on 12 Nov" },
  { id: "2", text: "Your team has 8 people", source: "From your chat on 3 Nov" },
  { id: "3", text: "Budget for offsites is about $3,000", source: "From your chat on 3 Nov" },
];

const suggestion: MemoryItem = { id: "s1", text: "You are vegetarian", source: "From this chat" };

const scenarios: Scenario[] = [
  { id: "manage", label: "Review and fix", hint: "Edit a line in place, or forget it. A forget can be undone for a few seconds.", script: [] },
  { id: "ask", label: "Asks first", hint: "New memories are offered, never taken silently. Not now keeps the list unchanged.", script: [] },
  { id: "off", label: "Memory off", hint: "Turning memory off is one switch, and the panel says plainly that nothing is saved.", script: [] },
];

const initial = (id: string) => ({
  items: id === "off" ? seed.slice(0, 2) : seed,
  enabled: id !== "off",
  suggestion: id === "ask" ? suggestion : undefined,
});

export default function Demo() {
  const [id, setId] = useState("manage");
  const [state, setState] = useState(initial("manage"));
  const [run, setRun] = useState(0);

  const reset = (n: string) => {
    setState(initial(n));
    setRun((r) => r + 1);
  };

  return (
    <DemoFrame
      scenarios={scenarios}
      scenarioId={id}
      onScenario={(n) => {
        setId(n);
        reset(n);
      }}
      onReplay={() => reset(id)}
    >
      <AgentMemory
        key={id + run}
        items={state.items}
        suggestion={state.suggestion}
        enabled={state.enabled}
        onToggle={(enabled) => setState((s) => ({ ...s, enabled }))}
        onAccept={(item) => setState((s) => ({ ...s, items: [...s.items, { ...item, id: String(Date.now()) }], suggestion: undefined }))}
        onDismiss={() => setState((s) => ({ ...s, suggestion: undefined }))}
        onEdit={(itemId, text) => setState((s) => ({ ...s, items: s.items.map((m) => (m.id === itemId ? { ...m, text, source: "Edited by you" } : m)) }))}
        onForget={(itemId) => setState((s) => ({ ...s, items: s.items.filter((m) => m.id !== itemId) }))}
        onRestore={(item) => setState((s) => ({ ...s, items: [...s.items, item] }))}
      />
    </DemoFrame>
  );
}
