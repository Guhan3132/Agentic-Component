"use client";

import { useEffect, useMemo, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import { textOf } from "@/lib/simulator/derive";
import { tokens } from "@/lib/simulator/helpers";
import type { Scenario } from "@/lib/simulator/types";
import { useAgentSimulator } from "@/lib/simulator/useAgentSimulator";
import { ToolTimeline, type ToolStep } from "../tool-timeline/tool-timeline";
import { PlanPreview, type PlanItem } from "./plan-preview";

const plan = (steps: string[]) => steps;

const scenarios: Scenario[] = [
  {
    id: "offsite",
    label: "Team offsite",
    hint: "Edit, reorder or remove steps, then run. The agent follows your version.",
    script: [
      ...tokens("Here is how I would plan the offsite. ", 40),
      { delay: 400, event: { type: "plan", id: "p1", steps: plan(["Find venues for 8 people under $3k", "Check availability for 14 to 16 Nov", "Draft the invite email", "Book the venue"]) } },
      { delay: 200, event: { type: "done" } },
    ],
  },
  {
    id: "report",
    label: "Weekly report",
    hint: "A different plan, same pattern.",
    script: [
      ...tokens("I will build this week's report in four steps. ", 40),
      { delay: 400, event: { type: "plan", id: "p2", steps: plan(["Pull this week's metrics", "Compare with last week", "Write the summary", "Email it to the team"]) } },
      { delay: 200, event: { type: "done" } },
    ],
  },
];

export default function Demo() {
  const [id, setId] = useState("offsite");
  const speed = 1;
  const sim = useAgentSimulator(scenarios.find((s) => s.id === id)!.script, speed);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [run, setRun] = useState<ToolStep[] | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const proposed = sim.events.find((e) => e.type === "plan");
  const text = useMemo(() => textOf(sim.events), [sim.events]);

  useEffect(() => {
    if (proposed?.type === "plan") setItems(proposed.steps.map((t, i) => ({ id: `${proposed.id}-${i}`, text: t })));
  }, [proposed]);

  // Execute the user's edited plan, one step at a time.
  useEffect(() => {
    if (!run) return;
    const next = run.findIndex((s) => s.status === "running");
    if (next === -1) return;
    const t = setTimeout(() => {
      setRun((cur) =>
        cur?.map((s, i) => (i === next ? { ...s, status: "ok", summary: "Done" } : i === next + 1 ? { ...s, status: "running" } : s)) ?? cur,
      );
    }, 900 / speed);
    return () => clearTimeout(t);
  }, [run, speed]);

  const reset = () => {
    sim.reset();
    setRun(null);
    setCancelled(false);
  };

  return (
    <DemoFrame
      scenarios={scenarios}
      scenarioId={id}
      onScenario={(n) => {
        reset();
        setId(n);
      }}
      onReplay={() => {
        reset();
        sim.run();
      }}
    >
      <div className="space-y-4">
        <p className="min-h-6 text-foreground">{sim.status === "idle" ? <span className="text-muted-foreground/60">Press Replay to start the agent.</span> : text}</p>
        {proposed && !run && !cancelled && (
          <PlanPreview
            steps={items}
            onChange={setItems}
            onConfirm={() => {
              sim.decide("approved");
              setRun(items.map((s, i): ToolStep => ({ id: s.id, name: s.text, args: "", status: i === 0 ? "running" : "pending" })));
            }}
            onCancel={() => {
              sim.decide("rejected");
              setCancelled(true);
            }}
          />
        )}
        {cancelled && <p className="text-sm text-muted-foreground">Plan cancelled. Nothing was run.</p>}
        {run && <ToolTimeline steps={run} />}
      </div>
    </DemoFrame>
  );
}
