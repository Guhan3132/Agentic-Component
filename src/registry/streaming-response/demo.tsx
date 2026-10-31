"use client";

import { useMemo, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import { tokens } from "@/lib/simulator/helpers";
import type { Scenario } from "@/lib/simulator/types";
import { useAgentSimulator } from "@/lib/simulator/useAgentSimulator";
import { StreamingResponse, type StreamStatus } from "./streaming-response";

const ANSWER =
  "A two-day offsite for 8 people fits comfortably under $3,000. Book a house near the city for about $1,100, split catering across two dinners at roughly $900, and keep $600 for activities and travel. Fix the dates first, since lodging prices climb quickly inside three weeks.";

const scenarios: Scenario[] = [
  {
    id: "happy",
    label: "Happy path",
    hint: "Tokens arrive steadily. Try pressing Stop mid-stream.",
    script: [{ delay: 700, event: { type: "token", text: "" } }, ...tokens(ANSWER), { delay: 100, event: { type: "done" } }],
  },
  {
    id: "slow",
    label: "Slow network",
    hint: "Long first-token wait, then uneven bursts. The dots show the agent has not frozen.",
    script: [
      { delay: 2800, event: { type: "token", text: "" } },
      ...tokens(ANSWER.slice(0, 120), 160),
      { delay: 1800, event: { type: "token", text: "" } },
      ...tokens(ANSWER.slice(120), 40),
      { delay: 100, event: { type: "done" } },
    ],
  },
  {
    id: "error",
    label: "Fails mid-stream",
    hint: "The connection drops. Partial text stays visible and Retry is the primary action.",
    script: [
      { delay: 600, event: { type: "token", text: "" } },
      ...tokens(ANSWER.slice(0, 150), 50),
      { delay: 400, event: { type: "error", message: "Connection lost." } },
    ],
  },
];

export default function Demo() {
  const [id, setId] = useState("happy");
  const speed = 1;
  const scenario = scenarios.find((s) => s.id === id)!;
  const sim = useAgentSimulator(scenario.script, speed);

  const text = useMemo(() => sim.events.map((e) => (e.type === "token" ? e.text : "")).join(""), [sim.events]);
  const error = sim.events.find((e) => e.type === "error");
  const status: StreamStatus =
    sim.status === "running" ? "streaming" : sim.status === "idle" ? "idle" : (sim.status as StreamStatus);

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
      <StreamingResponse
        text={text}
        status={status}
        errorMessage={error?.type === "error" ? error.message : undefined}
        onStop={sim.stop}
        onRegenerate={sim.run}
      />
    </DemoFrame>
  );
}
