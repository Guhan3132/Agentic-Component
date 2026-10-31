"use client";

import { useMemo, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import { textOf, toolsOf } from "@/lib/simulator/derive";
import { tokens } from "@/lib/simulator/helpers";
import type { Scenario, Step } from "@/lib/simulator/types";
import { useAgentSimulator } from "@/lib/simulator/useAgentSimulator";
import { StreamingResponse } from "../streaming-response/streaming-response";
import { ToolTimeline } from "./tool-timeline";

const call = (id: string, name: string, args: string, wait: number): Step => ({
  delay: wait,
  event: { type: "tool_call", id, name, args },
});
const result = (id: string, ok: boolean, summary: string, wait: number): Step => ({
  delay: wait,
  event: { type: "tool_result", id, ok, summary },
});

const scenarios: Scenario[] = [
  {
    id: "happy",
    label: "Happy path",
    hint: "Each step shows what ran and what it found, in order.",
    script: [
      call("1", "search_venues", '{ city: "Lisbon", people: 8 }', 400),
      result("1", true, "Found 14 venues under budget", 1200),
      call("2", "check_availability", '{ dates: "14-16 Nov" }', 300),
      result("2", true, "3 venues are free on those dates", 1200),
      call("3", "estimate_cost", '{ venue: "Casa Alfama" }', 300),
      result("3", true, "Total $2,640, under the $3,000 budget", 1000),
      ...tokens("Casa Alfama fits: $2,640 all in, available on your dates.", 40),
      { delay: 100, event: { type: "done" } },
    ],
  },
  {
    id: "retry",
    label: "Fails, then recovers",
    hint: "A tool fails. The agent says so, changes approach and carries on.",
    script: [
      call("1", "search_venues", '{ city: "Lisbon", people: 8 }', 400),
      result("1", false, "Venue API timed out after 10s", 1500),
      call("2", "search_venues", '{ city: "Lisbon", source: "backup" }', 600),
      result("2", true, "Found 9 venues using the backup source", 1300),
      ...tokens("The main source was down, so I used the backup. Results may be slightly less recent.", 40),
      { delay: 100, event: { type: "done" } },
    ],
  },
  {
    id: "fail",
    label: "Fails for good",
    hint: "When it cannot finish, the timeline explains where it stopped.",
    script: [
      call("1", "search_venues", '{ city: "Lisbon", people: 8 }', 400),
      result("1", false, "Venue API timed out after 10s", 1500),
      call("2", "search_venues", '{ city: "Lisbon", source: "backup" }', 600),
      result("2", false, "Backup source returned 503", 1300),
      { delay: 300, event: { type: "error", message: "I could not reach any venue source." } },
    ],
  },
];

export default function Demo() {
  const [id, setId] = useState("happy");
  const speed = 1;
  const sim = useAgentSimulator(scenarios.find((s) => s.id === id)!.script, speed);
  const text = useMemo(() => textOf(sim.events), [sim.events]);
  const steps = useMemo(() => toolsOf(sim.events), [sim.events]);
  const err = sim.events.find((e) => e.type === "error");

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
      <div className="space-y-4">
        {sim.status === "idle" && <p className="text-muted-foreground/60">Press Replay to start the agent.</p>}
        <ToolTimeline steps={steps} />
        {(text || err) && (
          <StreamingResponse
            text={text}
            status={err ? "error" : sim.status === "running" ? "streaming" : "done"}
            errorMessage={err?.type === "error" ? err.message : undefined}
            onRegenerate={sim.run}
          />
        )}
      </div>
    </DemoFrame>
  );
}
