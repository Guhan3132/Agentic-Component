"use client";

import { useEffect, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { TaskChecklist, type Task } from "./plan-preview";

const steps = [
  "Read the offsite brief",
  "Shortlist venues under $3,000",
  "Check availability for 14 to 16 Nov",
  "Price travel for 8 people",
  "Draft the agenda",
  "Write the invitation",
];

const scenarios: Scenario[] = [
  { id: "working", label: "Working through", hint: "Done steps fade back, the current one stands out, and the count and bar move with it.", script: [] },
  { id: "failed", label: "A step fails", hint: "A failure stops the plan on its own line, says why, and offers Retry.", script: [] },
  { id: "collapsed", label: "Collapsed in chat", hint: "Folded to one line with the current step, so a long plan does not take over the chat. Open it to see all.", script: [] },
];

const fresh = (): Task[] => steps.map((label, i) => ({ id: String(i), label, status: i === 0 ? "active" : "pending" }));

export default function Demo() {
  const [id, setId] = useState("working");
  const [tasks, setTasks] = useState<Task[]>(fresh);
  const [run, setRun] = useState(0);
  const [failedOnce, setFailedOnce] = useState(false);

  const load = () => {
    setTasks(fresh());
    setFailedOnce(false);
    setRun((r) => r + 1);
  };

  // A small clock finishes one step at a time. In "A step fails", step 3 fails the first time.
  useEffect(() => {
    const t = setInterval(() => {
      setTasks((list) => {
        const i = list.findIndex((x) => x.status === "active");
        if (i === -1) return list;
        if (id === "failed" && i === 2 && !failedOnce) {
          setFailedOnce(true);
          return list.map((x, j) => (j === i ? { ...x, status: "failed", detail: "The venue's calendar did not respond after 3 tries." } : x));
        }
        return list.map((x, j) => (j === i ? { ...x, status: "done", detail: j === 1 ? "Found 3 that fit" : undefined } : j === i + 1 ? { ...x, status: "active" } : x));
      });
    }, 1400);
    return () => clearInterval(t);
  }, [id, run, failedOnce]);

  return (
    <DemoFrame
      scenarios={scenarios}
      scenarioId={id}
      onScenario={(n) => {
        setId(n);
        load();
      }}
      onReplay={load}
    >
      <TaskChecklist
        key={id + run}
        title="Planning the offsite"
        tasks={tasks}
        defaultOpen={id !== "collapsed"}
        onRetry={(tid) => setTasks((l) => l.map((x) => (x.id === tid ? { ...x, status: "active", detail: undefined } : x)))}
      />
    </DemoFrame>
  );
}
