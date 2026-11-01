"use client";

import { useEffect, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { MultiAgentStatus, type AgentRun } from "./multi-agent-status";

const scenarios: Scenario[] = [
  { id: "parallel", label: "In parallel", hint: "Three agents at once. The writer waits on the researcher, and the summary line says how it is going.", script: [] },
  { id: "blocked", label: "Needs you", hint: "An agent that needs a decision floats to the top and says what it is waiting for.", script: [] },
  { id: "failed", label: "One fails", hint: "A failure is shown on its own row with Retry, and the other agents carry on.", script: [] },
];

const start = (id: string): AgentRun[] => {
  const researcher: AgentRun = { id: "r", name: "Researcher", task: "Comparing venues in Lisbon", state: "working", progress: 0.1 };
  const writer: AgentRun = { id: "w", name: "Writer", task: "Drafting the invitation", state: "waiting", waitingOn: "Researcher", progress: 0 };
  const budget: AgentRun = { id: "b", name: "Budget", task: "Checking totals against $3,000", state: "working", progress: 0.25 };
  if (id === "blocked") return [researcher, { ...budget, id: "b", state: "blocked", task: "Two venues are over budget", waitingOn: "your decision", progress: undefined }, writer];
  return [researcher, writer, budget];
};

export default function Demo() {
  const [id, setId] = useState("parallel");
  const [agents, setAgents] = useState<AgentRun[]>(() => start("parallel"));
  const [run, setRun] = useState(0);

  const load = (n: string) => {
    setAgents(start(n));
    setRun((r) => r + 1);
  };

  // A small clock moves the work along, so the page is alive without any real agents.
  useEffect(() => {
    const t = setInterval(() => {
      setAgents((list) =>
        list.map((a) => {
          if (a.state === "working") {
            const next = Math.min(1, (a.progress ?? 0) + (a.id === "b" ? 0.09 : 0.06));
            if (id === "failed" && a.id === "b" && (a.progress ?? 0) <= 0.6 && next > 0.6) return { ...a, state: "failed", task: "The price service timed out", progress: undefined };
            return next >= 1 ? { ...a, state: "done", task: a.id === "r" ? "Shortlisted 3 venues" : "Everything fits the budget", progress: undefined } : { ...a, progress: next };
          }
          if (a.state === "waiting" && a.waitingOn === "Researcher" && list.find((x) => x.id === "r")?.state === "done") {
            return { ...a, state: "working", waitingOn: undefined, task: "Drafting the invitation", progress: 0.05 };
          }
          return a;
        }),
      );
    }, 500);
    return () => clearInterval(t);
  }, [id, run]);

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
      <MultiAgentStatus
        agents={agents}
        onStop={(aid) => setAgents((l) => l.map((a) => (a.id === aid ? { ...a, state: "failed", task: "Stopped by you", progress: undefined } : a)))}
        onRetry={(aid) => setAgents((l) => l.map((a) => (a.id === aid ? { ...a, state: "working", task: a.id === "b" ? "Checking totals against $3,000" : a.task, progress: 0.7 } : a)))}
        onOpen={(aid) => setAgents((l) => l.map((a) => (a.id === aid ? { ...a, state: "working", waitingOn: undefined, task: "Dropped the two over-budget venues", progress: 0.5 } : a)))}
      />
    </DemoFrame>
  );
}
