"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import { tokens } from "@/lib/simulator/helpers";
import type { Scenario } from "@/lib/simulator/types";
import { useAgentSimulator } from "@/lib/simulator/useAgentSimulator";
import { ErrorRecovery, type ErrorKind } from "./error-recovery";

type Config = {
  kind: ErrorKind;
  title: string;
  message: string;
  kept: string[];
  details: string;
  retryAfter?: number;
  /** The attempt that finally works. Infinity means it never does. */
  succeedsOn: number;
  alternative: { label: string; result: string };
  recovered: string;
};

const intro = "Day one is the walking tour of Alfama, then lunch near the river. ";

const configs: Record<string, Config> = {
  network: {
    kind: "network",
    title: "Connection lost",
    message: "The stream stopped before the answer was finished.",
    kept: ["Your question", "The text above, up to where it stopped"],
    details: "ERR_NETWORK_CHANGED\nstream closed after 214 tokens\nrequest id req_8f31c2",
    retryAfter: 4,
    succeedsOn: 2,
    alternative: { label: "Keep what I have", result: "Kept the partial answer. You can ask me to finish it later." },
    recovered: "Day two is a Sintra day trip, with the palace first thing to avoid the queues.",
  },
  "rate-limit": {
    kind: "rate-limit",
    title: "Too many requests right now",
    message: "The service asked us to slow down. This usually clears within a few seconds.",
    kept: ["Your question", "Everything found so far"],
    details: "HTTP 429 Too Many Requests\nretry-after: 6\nrequest id req_1a9d07",
    retryAfter: 6,
    succeedsOn: 2,
    alternative: { label: "Keep what I have", result: "Kept the partial answer. You can ask me to finish it later." },
    recovered: "Day two is a Sintra day trip, with the palace first thing to avoid the queues.",
  },
  tool: {
    kind: "tool",
    title: "Couldn't check live availability",
    message: "The booking service didn't answer. I can use the prices I saved an hour ago instead.",
    kept: ["Your plan and budget", "Cached prices from 10:12"],
    details: "tool: check_availability\nstatus: 503\nattempts: see below",
    retryAfter: 3,
    succeedsOn: Infinity,
    alternative: { label: "Use cached prices", result: "Using prices from 10:12. I will mark them as possibly out of date." },
    recovered: "",
  },
  refusal: {
    kind: "refusal",
    title: "I can't help with that as asked",
    message: "The request asks for personal details about a private person. I can help with a public profile or a general approach.",
    kept: ["Your question is saved in the history"],
    details: "",
    succeedsOn: Infinity,
    alternative: { label: "Rephrase request", result: "Okay. Here is a general approach to finding public information about a company instead." },
    recovered: "",
  },
};

const scenarios: Scenario[] = [
  { id: "network", label: "Dropped connection", hint: "Partial text is kept, and it retries on its own with a countdown you can cancel.", script: [...tokens(intro), { delay: 500, event: { type: "error", message: "network" } }] },
  { id: "rate-limit", label: "Rate limited", hint: "A longer wait is shown as a countdown, never a silent spinner.", script: [...tokens(intro), { delay: 500, event: { type: "error", message: "rate-limit" } }] },
  { id: "tool", label: "Retries run out", hint: "After three attempts the alternative becomes the main action and Retry steps back.", script: [...tokens(intro), { delay: 500, event: { type: "error", message: "tool" } }] },
  { id: "refusal", label: "Can't do that", hint: "No Retry, because trying again changes nothing. Offer a different way forward.", script: [{ delay: 700, event: { type: "error", message: "refusal" } }] },
];

export default function Demo() {
  const [id, setId] = useState("network");
  const [attempt, setAttempt] = useState(1);
  const [retrying, setRetrying] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const config = configs[id];
  const sim = useAgentSimulator(scenarios.find((s) => s.id === id)!.script, 1);

  const clear = () => {
    clearTimeout(timer.current);
    setAttempt(1);
    setRetrying(false);
    setOutcome(null);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const text = useMemo(() => sim.events.map((e) => (e.type === "token" ? e.text : "")).join(""), [sim.events]);
  const failed = sim.status === "error";

  const retry = () => {
    if (retrying) return;
    setRetrying(true);
    timer.current = setTimeout(() => {
      setRetrying(false);
      if (attempt + 1 >= config.succeedsOn) setOutcome(config.recovered);
      else setAttempt((a) => a + 1);
    }, 1300);
  };

  const replay = () => {
    clear();
    sim.run();
  };

  return (
    <DemoFrame
      scenarios={scenarios}
      scenarioId={id}
      onScenario={(n) => {
        clear();
        sim.reset();
        setId(n);
      }}
      onReplay={replay}
    >
      <div className="space-y-3">
        <p className="min-h-6 whitespace-pre-wrap text-foreground">
          {sim.status === "idle" ? <span className="text-muted-foreground/60">Press Replay to start the agent.</span> : text}
          {outcome && <span className="text-foreground">{outcome}</span>}
        </p>
        {failed && !outcome && (
          <ErrorRecovery
            key={id}
            kind={config.kind}
            title={config.title}
            message={config.message}
            kept={config.kept}
            details={config.details}
            retryAfter={config.retryAfter}
            retrying={retrying}
            attempt={attempt}
            maxAttempts={3}
            onRetry={config.kind === "refusal" ? undefined : retry}
            alternative={{ label: config.alternative.label, onClick: () => setOutcome(config.alternative.result) }}
          />
        )}
      </div>
    </DemoFrame>
  );
}
