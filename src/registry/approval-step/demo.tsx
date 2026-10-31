"use client";

import { useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import { tokens } from "@/lib/simulator/helpers";
import type { Scenario, Step } from "@/lib/simulator/types";
import { useAgentSimulator } from "@/lib/simulator/useAgentSimulator";
import { ApprovalStep } from "./approval-step";

const make = (
  intro: string,
  title: string,
  description: string,
  risk: "low" | "medium" | "high",
  details: string[],
  after: string,
): Step[] => [
  ...tokens(intro),
  { delay: 400, event: { type: "approval_required", id: "a1", title, description, risk, details } },
  { delay: 500, event: { type: "token", text: "\n\n" } },
  ...tokens(after),
  { delay: 100, event: { type: "done" } },
];

const scenarios: Scenario[] = [
  {
    id: "low",
    label: "Low risk",
    hint: "Reversible, so approval is one click with focus on Approve.",
    script: make(
      "I drafted a reply to Sam. ",
      "Send reply to Sam",
      "A short confirmation of Tuesday's meeting.",
      "low",
      ["To: sam@example.com", "Subject: Re: Tuesday sync"],
      "Sent. I will flag any reply.",
    ),
  },
  {
    id: "medium",
    label: "Spends money",
    hint: "Shows exactly what will be charged before anything happens.",
    script: make(
      "I found the best flight for the group. ",
      "Book 8 flights",
      "Charges the team card on file.",
      "medium",
      ["8 x LHR to LIS, 14 Nov", "Total: $2,376.00", "Card ending 4242"],
      "Booked. Confirmations are in your inbox.",
    ),
  },
  {
    id: "high",
    label: "Destructive",
    hint: "Approve is locked until you acknowledge, and focus starts on Reject.",
    script: make(
      "These files have not been opened in 2 years. ",
      "Permanently delete 14 files",
      "Removes the files from Drive and from trash.",
      "high",
      ["/Archive/2022/*.pdf (9 files)", "/Archive/2022/drafts (5 files)"],
      "Deleted 14 files.",
    ),
  },
];

export default function Demo() {
  const [id, setId] = useState("low");
  const speed = 1;
  const sim = useAgentSimulator(scenarios.find((s) => s.id === id)!.script, speed);

  const text = sim.events.map((e) => (e.type === "token" ? e.text : "")).join("");
  const req = sim.events.find((e) => e.type === "approval_required");
  const res = sim.events.find((e) => e.type === "approval_resolved");
  const state = res?.type === "approval_resolved" ? res.decision : "pending";

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
        <p className="min-h-6 whitespace-pre-wrap text-foreground">
          {sim.status === "idle" ? <span className="text-muted-foreground/60">Press Replay to start the agent.</span> : text}
        </p>
        {req?.type === "approval_required" && (
          <ApprovalStep
            key={sim.events.length > 0 ? id + req.id : ""}
            title={req.title}
            description={req.description}
            risk={req.risk}
            details={req.details}
            state={state === "approved" || state === "rejected" ? state : "pending"}
            onApprove={() => sim.decide("approved")}
            onReject={() => sim.decide("rejected")}
          />
        )}
      </div>
    </DemoFrame>
  );
}
