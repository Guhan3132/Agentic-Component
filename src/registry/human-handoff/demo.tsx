"use client";

import { useEffect, useRef, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { HumanHandoff, type HandoffState } from "./human-handoff";

const summary = ["Your question about the refund for order #4821", "That the card was charged twice on 9 Nov", "What I already tried: reissuing the receipt"];

const scenarios: Scenario[] = [
  { id: "live", label: "Person joins", hint: "Agree, watch the queue move with a real position and wait, then a person joins with the context.", script: [] },
  { id: "leave", label: "Leave the line", hint: "Leaving is always possible, and email is one click away while you wait.", script: [] },
  { id: "offline", label: "Team offline", hint: "When no one is there, say so up front and offer a way that works, instead of queueing forever.", script: [] },
];

export default function Demo() {
  const [id, setId] = useState("live");
  const [state, setState] = useState<HandoffState>("offer");
  const [position, setPosition] = useState(2);
  const [note, setNote] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const start = (n: string) => {
    clear();
    setNote(null);
    setPosition(2);
    setState(n === "offline" ? "unavailable" : "offer");
  };

  const request = () => {
    setState("waiting");
    setPosition(2);
    // The queue moves on its own, then someone joins.
    timers.current.push(setTimeout(() => setPosition(1), 2500));
    if (id === "live") timers.current.push(setTimeout(() => setState("connected"), 5000));
  };

  return (
    <DemoFrame
      scenarios={scenarios}
      scenarioId={id}
      onScenario={(n) => {
        setId(n);
        start(n);
      }}
      onReplay={() => start(id)}
    >
      <div className="space-y-3">
        <HumanHandoff
          state={state}
          summary={summary}
          position={position}
          etaMinutes={position === 1 ? 1 : 3}
          personName="Priya"
          backAt="at 9:00 AM tomorrow"
          onRequest={request}
          onCancel={() => {
            clear();
            setState("offer");
            setNote("You left the line. The chat is still here.");
          }}
          onDecline={() => setNote("Okay, I will keep helping here.")}
          onFallback={() => {
            clear();
            setNote("Done. The team will email you, with this chat attached.");
            setState(id === "offline" ? "unavailable" : "offer");
          }}
        />
        {note && (
          <p role="status" className="text-sm text-muted-foreground">
            {note}
          </p>
        )}
      </div>
    </DemoFrame>
  );
}
