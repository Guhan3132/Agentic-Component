"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import { textOf } from "@/lib/simulator/derive";
import { tokens } from "@/lib/simulator/helpers";
import type { Scenario, Step } from "@/lib/simulator/types";
import { useAgentSimulator } from "@/lib/simulator/useAgentSimulator";
import { PromptComposer } from "../prompt-composer/prompt-composer";
import { InterruptSteer, type Segment } from "./interrupt-steer";

const LONG =
  "Here is a 3-day offsite plan. Day one is travel and a welcome dinner. Day two is a morning workshop, a long lunch and an afternoon walking tour. Day three is a retrospective and departures. Lodging is booked at a central hotel with a meeting room included.";

const scenarios: Scenario[] = [
  {
    id: "offsite",
    label: "Offsite plan",
    hint: "Interrupt mid-answer with a correction. The agent keeps what you already read and continues from there.",
    script: [{ delay: 500, event: { type: "token", text: "" } }, ...tokens(LONG, 110), { delay: 100, event: { type: "done" } }],
  },
];

const continuation = (steer: string): Step[] => [
  ...tokens(`Understood: "${steer}". Adjusting the rest of the plan. Day two moves indoors and the budget drops accordingly, with a shorter lunch and no walking tour.`, 60),
  { delay: 100, event: { type: "done" } },
];

export default function Demo() {
  const speed = 1;
  const [before, setBefore] = useState<Segment[]>([]);
  const [steer, setSteer] = useState<string | null>(null);
  const script = useMemo(() => (steer ? continuation(steer) : scenarios[0].script), [steer]);
  const sim = useAgentSimulator(script, speed);
  const live = useRef(textOf(sim.events));
  live.current = textOf(sim.events);

  // Run the continuation once its script is in place.
  useEffect(() => {
    if (steer) sim.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steer]);

  const text = textOf(sim.events);
  const segments: Segment[] = [...before, ...(text ? [{ role: "agent" as const, text }] : [])];

  const steerWith = (msg: string) => {
    const partial = live.current;
    sim.stop();
    setBefore((b) => [...b, ...(partial ? [{ role: "agent" as const, text: partial }] : []), { role: "user" as const, text: msg }]);
    setSteer(msg);
  };

  const reset = () => {
    sim.reset();
    setBefore([]);
    setSteer(null);
  };

  return (
    <DemoFrame
      scenarios={scenarios}
      scenarioId="offsite"
      onReplay={() => {
        reset();
        // Wait a tick so the original script is active again before running.
        setTimeout(() => sim.run(), 0);
      }}
    >
      {sim.status === "idle" && segments.length === 0 && <p className="mb-3 text-muted-foreground/60">Press Replay, then type a correction while it writes.</p>}
      <InterruptSteer
        segments={segments}
        running={sim.status === "running"}
        suggestions={["Keep it indoors", "Cut the budget"]}
        onStop={sim.stop}
        onSteer={steerWith}
        composer={
          <PromptComposer
            steerable
            status={sim.status === "running" ? "generating" : "idle"}
            onStop={sim.stop}
            onSubmit={(m) => steerWith(m.text)}
            placeholder="Steer the agent while it works"
            suggestions={["Keep it indoors", "Cut the budget"]}
          />
        }
      />
    </DemoFrame>
  );
}
