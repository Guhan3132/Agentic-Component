"use client";

import { useMemo, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import { tokens } from "@/lib/simulator/helpers";
import type { Scenario } from "@/lib/simulator/types";
import { useAgentSimulator } from "@/lib/simulator/useAgentSimulator";
import { StreamingResponse } from "../streaming-response/streaming-response";
import { WhyThisAnswer } from "./why-this-answer";

const ANSWER =
  "Most teams run their weekly planning on Mondays, because it sets priorities before meetings fill the calendar.";

const scenarios: Scenario[] = [
  {
    id: "sourced",
    label: "With sources",
    hint: "Reasoning steps plus quotable sources. Open the panel after the answer finishes.",
    script: [
      { delay: 500, event: { type: "token", text: "" } },
      ...tokens(ANSWER),
      {
        delay: 200,
        event: {
          type: "sources",
          reasoning: [
            "Searched for planning cadence studies",
            "Kept two sources from the last 2 years",
            "Summarised where they agree",
          ],
          items: [
            { title: "State of Team Planning 2025", url: "https://example.com/planning-2025", snippet: "61% of teams plan on Mondays." },
            { title: "Calendar load by weekday", url: "https://example.com/calendar-load", snippet: "Monday has the fewest scheduled meetings before 10am." },
          ],
        },
      },
      { delay: 50, event: { type: "done" } },
    ],
  },
  {
    id: "none",
    label: "No sources",
    hint: "When there is nothing to cite, say so plainly instead of hiding the panel.",
    script: [
      { delay: 500, event: { type: "token", text: "" } },
      ...tokens(ANSWER),
      {
        delay: 200,
        event: { type: "sources", reasoning: ["No search was run", "Answered from general knowledge"], items: [] },
      },
      { delay: 50, event: { type: "done" } },
    ],
  },
];

export default function Demo() {
  const [id, setId] = useState("sourced");
  const speed = 1;
  const sim = useAgentSimulator(scenarios.find((s) => s.id === id)!.script, speed);
  const text = useMemo(() => sim.events.map((e) => (e.type === "token" ? e.text : "")).join(""), [sim.events]);
  const src = sim.events.find((e) => e.type === "sources");

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
        {src?.type === "sources" && <WhyThisAnswer sources={src.items} reasoning={src.reasoning} />}
      </div>
    </DemoFrame>
  );
}
