"use client";

import type { ReactNode } from "react";
import { ApprovalStep } from "@/registry/approval-step/approval-step";
import { ChatThread } from "@/registry/chat-thread/chat-thread";
import { ConfidenceBadge } from "@/registry/confidence-badge/confidence-badge";
import { AgentMemory } from "@/registry/agent-memory/agent-memory";
import { Citations } from "@/registry/citations/citations";
import { ErrorRecovery } from "@/registry/error-recovery/error-recovery";
import { HumanHandoff } from "@/registry/human-handoff/human-handoff";
import { MultiAgentStatus } from "@/registry/multi-agent-status/multi-agent-status";
import { ToolPermissions } from "@/registry/tool-permissions/tool-permissions";
import { VoiceInput } from "@/registry/voice-input/voice-input";
import { FeedbackThumbs } from "@/registry/feedback-thumbs/feedback-thumbs";
import { InterruptSteer } from "@/registry/interrupt-steer/interrupt-steer";
import { PlanPreview } from "@/registry/plan-preview/plan-preview";
import { ToolTimeline } from "@/registry/tool-timeline/tool-timeline";
import { PromptComposer } from "@/registry/prompt-composer/prompt-composer";
import { StreamingResponse } from "@/registry/streaming-response/streaming-response";
import { WhyThisAnswer } from "@/registry/why-this-answer/why-this-answer";

/** Static, non-interactive miniatures used on gallery cards. */
const previews: Record<string, ReactNode> = {
  "streaming-response": (
    <StreamingResponse text="A two-day offsite for 8 people fits under $3,000. Book a house near the city for" status="streaming" />
  ),
  "confidence-badge": <ConfidenceBadge value={0.64} reason="Two sources say 5 to 7 days, one says up to 10." />,
  "why-this-answer": (
    <WhyThisAnswer
      sources={[{ title: "State of Team Planning", url: "#", snippet: "61% plan on Mondays." }]}
      reasoning={["Searched planning studies"]}
    />
  ),
  "approval-step": (
    <ApprovalStep
      title="Book 8 flights"
      description="Charges the team card on file."
      risk="medium"
      details={["Total: $2,376.00"]}
      state="pending"
      autoFocus={false}
      onApprove={() => {}}
      onReject={() => {}}
    />
  ),
  "feedback-thumbs": <FeedbackThumbs />,
  citations: (
    <Citations
      text="A two-day offsite for 8 people costs $2,400 to $3,100 [1]. Prices rise in peak season [?]."
      sources={[{ id: 1, title: "Offsite budgets, explained", url: "https://example.com", publisher: "Event Weekly", quote: "A two-day offsite averages $2,400 to $3,100." }]}
    />
  ),
  "agent-memory": (
    <AgentMemory
      items={[
        { id: "1", text: "You prefer window seats", source: "From your chat on 12 Nov" },
        { id: "2", text: "Your team has 8 people", source: "From your chat on 3 Nov" },
      ]}
      onEdit={() => {}}
      onForget={() => {}}
    />
  ),
  "human-handoff": (
    <HumanHandoff
      state="waiting"
      summary={["Your refund question for order #4821", "What I already tried"]}
      position={2}
      etaMinutes={3}
      onCancel={() => {}}
      onFallback={() => {}}
    />
  ),
  "tool-permissions": (
    <ToolPermissions
      tools={[
        { id: "s", name: "search_web", description: "Looks things up online.", risk: "read", mode: "allow" },
        { id: "e", name: "send_email", description: "Sends email from your account.", risk: "write", mode: "ask" },
        { id: "d", name: "delete_files", description: "Permanently removes files.", risk: "destructive", mode: "block" },
      ]}
      onChange={() => {}}
    />
  ),
  "multi-agent-status": (
    <MultiAgentStatus
      agents={[
        { id: "b", name: "Budget", task: "Two venues are over budget", state: "blocked", waitingOn: "your decision" },
        { id: "r", name: "Researcher", task: "Comparing venues", state: "working", progress: 0.6 },
        { id: "w", name: "Writer", task: "Drafting the invitation", state: "waiting", waitingOn: "Researcher" },
      ]}
      onOpen={() => {}}
    />
  ),
  "voice-input": (
    <VoiceInput
      state="listening"
      seconds={7}
      levels={[0.2, 0.4, 0.7, 0.5, 0.3, 0.6, 0.9, 0.5, 0.35, 0.55, 0.8, 0.4, 0.25, 0.5, 0.75, 0.45, 0.3, 0.6, 0.85, 0.5, 0.3, 0.45, 0.65, 0.35]}
      onStart={() => {}}
      onStop={() => {}}
      onCancel={() => {}}
      onSend={() => {}}
    />
  ),
  "error-recovery": (
    <ErrorRecovery
      kind="rate-limit"
      title="Too many requests right now"
      message="This usually clears within a few seconds."
      kept={["Your question", "Everything found so far"]}
      onRetry={() => {}}
      alternative={{ label: "Keep what I have", onClick: () => {} }}
    />
  ),
  "tool-timeline": (
    <div className="rounded-xl border border-border bg-card p-4">
      <ToolTimeline
        steps={[
          { id: "1", name: "search_venues", args: "Lisbon", status: "failed", summary: "API timed out" },
          { id: "2", name: "search_venues", args: "backup", status: "ok", summary: "Found 9 venues" },
          { id: "3", name: "estimate_cost", args: "", status: "running" },
        ]}
      />
    </div>
  ),
  "plan-preview": (
    <PlanPreview
      steps={[
        { id: "1", text: "Find venues under $3k" },
        { id: "2", text: "Check availability" },
        { id: "3", text: "Draft the invite" },
      ]}
      onChange={() => {}}
      onConfirm={() => {}}
    />
  ),
  "chat-thread": (
    <div className="rounded-xl bg-card p-4">
      <ChatThread
        className="h-[250px]"
        messages={[
          { id: "1", role: "agent", text: "What are you working on?", time: "9:41 AM" },
          { id: "2", role: "user", text: "Help me plan a team offsite.", time: "9:42 AM" },
          { id: "3", role: "agent", text: "Sure! Here is a guide to start with.", links: [{ label: "How to plan an offsite", kind: "article" }] },
        ]}
      />
    </div>
  ),
  "prompt-composer": <PromptComposer onSubmit={() => {}} suggestions={["Plan an offsite", "Summarise a document"]} />,
  "interrupt-steer": (
    <InterruptSteer
      segments={[
        { role: "agent", text: "Day two is a morning workshop and an afternoon walking tour." },
        { role: "user", text: "Keep it indoors" },
      ]}
      running
      onSteer={() => {}}
      onStop={() => {}}
      composer={<PromptComposer steerable status="generating" onSubmit={() => {}} onStop={() => {}} placeholder="Steer the agent while it works" />}
    />
  ),
};

/** Width the miniature renders at, and how far it is scaled down. Wide ones show the compact layout. */
const sizes: Record<string, { w: number; s: number }> = {
  "plan-preview": { w: 440, s: 0.7 },
  "chat-thread": { w: 380, s: 0.74 },
  "prompt-composer": { w: 500, s: 0.64 },
  "interrupt-steer": { w: 500, s: 0.64 },
};


export function Preview({ slug }: { slug: string }) {
  const { w, s } = sizes[slug] ?? { w: 340, s: 0.82 };
  // Centred by position, not by the grid, so a wide miniature never stretches its card.
  return (
    <div aria-hidden inert className="pointer-events-none relative size-full select-none">
      <div className="absolute left-1/2 top-1/2" style={{ width: w, transform: `translate(-50%, -50%) scale(${s})` }}>
        {previews[slug]}
      </div>
    </div>
  );
}
