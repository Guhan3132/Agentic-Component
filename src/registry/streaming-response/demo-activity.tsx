"use client";

import { useEffect, useRef, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { ActivityIndicator, type ActivityState } from "./streaming-response";

const scenarios: Scenario[] = [
  { id: "long", label: "Long task", hint: "A long job says what it is doing and for how long, so a wait never looks like a freeze. Open the detail, or stop it.", script: [] },
  { id: "finish", label: "Finishes", hint: "When it ends, the same line turns into a short record: what it did and how long it took.", script: [] },
  { id: "fail", label: "Fails", hint: "A failure says so on the line, and the detail holds the error.", script: [] },
];

const LOG = ["$ node scripts/collect-prices.mjs", "Fetched 12 venues", "Fetched 9 flights", "Writing prices.json"];

export default function Demo() {
  const [id, setId] = useState("long");
  const [state, setState] = useState<ActivityState>("running");
  // "Long task" pretends it began 6 minutes ago; the others start now.
  const [startedAt, setStartedAt] = useState(() => Date.now() - 364_000);
  const [took, setTook] = useState<number | undefined>(undefined);
  const [run, setRun] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = (n: string) => {
    clearTimeout(timer.current);
    setStartedAt(Date.now() - (n === "long" ? 364_000 : 0));
    setState("running");
    setTook(undefined);
    setRun((r) => r + 1);
  };

  // "Finishes" and "Fails" end on their own after a few seconds.
  useEffect(() => {
    if (id === "long") return;
    timer.current = setTimeout(() => {
      setTook(Math.round((Date.now() - startedAt) / 1000));
      setState(id === "finish" ? "done" : "failed");
    }, id === "finish" ? 4200 : 3200);
    return () => clearTimeout(timer.current);
  }, [id, run, startedAt]);

  return (
    <DemoFrame
      scenarios={scenarios}
      scenarioId={id}
      onScenario={(n) => {
        setId(n);
        load(n);
      }}
      onReplay={() => load(id)}
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground">Collecting prices for the offsite.</p>
        <ActivityIndicator
          key={id + run}
          label="Running page script"
          doneLabel="Ran page script"
          state={state}
          startedAt={state === "running" ? startedAt : undefined}
          elapsedSeconds={state === "running" ? undefined : took}
          onStop={() => {
            setTook(Math.round((Date.now() - startedAt) / 1000));
            setState("stopped");
          }}
          details={
            <pre className="whitespace-pre-wrap font-mono">
              {(state === "failed" ? [...LOG.slice(0, 2), "Error: flight search timed out after 30s"] : LOG).join("\n")}
            </pre>
          }
        />
      </div>
    </DemoFrame>
  );
}
