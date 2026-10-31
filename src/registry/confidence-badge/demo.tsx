"use client";

import { useMemo, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import { tokens } from "@/lib/simulator/helpers";
import type { Scenario, Step } from "@/lib/simulator/types";
import { useAgentSimulator } from "@/lib/simulator/useAgentSimulator";
import { StreamingResponse } from "../streaming-response/streaming-response";
import { ConfidenceBadge } from "./confidence-badge";

const make = (answer: string, value: number, reason: string): Step[] => [
  { delay: 500, event: { type: "token", text: "" } },
  ...tokens(answer),
  { delay: 300, event: { type: "confidence", value, reason } },
  { delay: 50, event: { type: "done" } },
];

const scenarios: Scenario[] = [
  {
    id: "high",
    label: "High",
    hint: "Answer comes from an authoritative, recent source.",
    script: make(
      "Your refund window is 30 days from delivery, per the current returns policy.",
      0.94,
      "Matched the official returns policy page, updated last week.",
    ),
  },
  {
    id: "medium",
    label: "Medium",
    hint: "Sources partly agree.",
    script: make(
      "Shipping to Ireland usually takes 5 to 7 business days.",
      0.64,
      "Two sources say 5 to 7 days, one says up to 10.",
    ),
  },
  {
    id: "low",
    label: "Low",
    hint: "The agent is guessing. The badge changes the advice, not only the colour.",
    script: make(
      "The part number may be KX-4410, but I could not find an exact match.",
      0.28,
      "No source mentions this model. Closest match was a similar older model.",
    ),
  },
];

export default function Demo() {
  const [id, setId] = useState("high");
  const speed = 1;
  const sim = useAgentSimulator(scenarios.find((s) => s.id === id)!.script, speed);
  const text = useMemo(() => sim.events.map((e) => (e.type === "token" ? e.text : "")).join(""), [sim.events]);
  const conf = sim.events.find((e) => e.type === "confidence");

  return (
    <DemoFrame
      scenarios={scenarios}
      scenarioId={id}
      onScenario={(n) => {
        sim.reset();
        setId(n);
      }}
      onReplay={sim.run}
    >
      <div className="space-y-3">
        <StreamingResponse
          text={text}
          status={sim.status === "running" ? "streaming" : sim.status === "idle" ? "idle" : "done"}
          onStop={sim.stop}
          onRegenerate={sim.run}
        />
        {conf?.type === "confidence" && <ConfidenceBadge value={conf.value} reason={conf.reason} />}
      </div>
    </DemoFrame>
  );
}
