"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { PromptComposer, type ComposerSubmission } from "./prompt-composer";

const scenarios: Scenario[] = [
  { id: "empty", label: "Empty", hint: "Type / for commands (/plan, /ask, /build, /model), @ for context, or paste an image. Mode and model sit under the box; tap them or use the / commands.", script: [] },
  { id: "files", label: "With attachment", hint: "Images show as thumbnails, other files as chips. Both sit above the text and can be removed.", script: [] },
  { id: "limit", label: "Over the limit", hint: "The counter appears at 80% of the limit. Past it, Send is disabled and the box says by how much.", script: [] },
  { id: "generating", label: "Generating", hint: "While the agent works, Send becomes Stop so the user is never stuck waiting.", script: [] },
];

/** A small generated image, so the demo shows a real thumbnail without shipping an asset. */
const mockup = () =>
  new File(
    ["<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#60a5fa'/><stop offset='1' stop-color='#7c3aed'/></linearGradient></defs><rect width='160' height='160' fill='url(#g)'/><rect x='24' y='32' width='112' height='16' rx='8' fill='white' fill-opacity='.85'/><rect x='24' y='64' width='72' height='12' rx='6' fill='white' fill-opacity='.6'/></svg>"],
    "mockup.svg",
    { type: "image/svg+xml" },
  );

const LONG = "Plan a three day team offsite for eight people in Lisbon, with a budget of three thousand dollars. ".repeat(41);

export default function Demo() {
  const [id, setId] = useState("empty");
  const [log, setLog] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const files = useMemo(() => (id === "files" ? [mockup(), new File(["x".repeat(48_000)], "brief.pdf"), new File(["x".repeat(9_000)], "budget.csv")] : []), [id]);

  const finish = (text: string) => {
    timer.current = setTimeout(() => {
      setLog((l) => [...l, { role: "agent", text }]);
      setStatus("idle");
    }, 2600);
  };

  const reset = (next: string) => {
    if (timer.current) clearTimeout(timer.current);
    setLog([]);
    setId(next);
    setStatus(next === "generating" ? "generating" : "idle");
    if (next === "generating") finish("Done. Here is a draft plan.");
  };

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const submit = (m: ComposerSubmission) => {
    setLog((l) => [...l, { role: "user", text: m.text || `(${m.files.length} attachment${m.files.length === 1 ? "" : "s"})` }]);
    setStatus("generating");
    finish(`Got it. ${m.mode} mode, ${m.auto ? "auto-routed" : `${m.modelName} at ${m.effort} effort`}.`);
  };

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setStatus("idle");
    setLog((l) => [...l, { role: "agent", text: "Stopped." }]);
  };

  return (
    <DemoFrame scenarios={scenarios} scenarioId={id} onScenario={reset}>
      <div className="flex min-h-72 flex-col justify-end gap-3">
        <div className="space-y-2" aria-live="polite">
          {log.map((m, i) => (
            <p
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                  : "w-fit max-w-[85%] rounded-2xl border border-border bg-card px-3.5 py-2 text-sm text-foreground"
              }
            >
              {m.text}
            </p>
          ))}
        </div>
        <PromptComposer
          key={id}
          status={status}
          onSubmit={submit}
          onStop={stop}
          defaultValue={id === "limit" ? LONG : id === "files" ? "Summarise the attached brief and check it against the budget." : ""}
          defaultFiles={files}
          suggestions={["Plan a team offsite", "Summarise this document", "Draft a reply to Sam"]}
        />
      </div>
    </DemoFrame>
  );
}
