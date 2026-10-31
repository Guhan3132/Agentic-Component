/** Short usage examples shown on component pages and included in the AI prompt. */
export const usage: Record<string, string> = {
  "streaming-response": `"use client"

import { StreamingResponse } from "@/components/ui/streaming-response"

export default function Demo() {
  return (
    <StreamingResponse
      text="A two-day offsite for 8 people fits under $3,000."
      status="streaming"
      onStop={() => console.log("stop")}
      onRegenerate={() => console.log("regenerate")}
    />
  )
}`,
  "confidence-badge": `import { ConfidenceBadge } from "@/components/ui/confidence-badge"

export default function Demo() {
  return (
    <ConfidenceBadge
      value={0.64}
      reason="Two sources say 5 to 7 days, one says up to 10."
    />
  )
}`,
  "why-this-answer": `"use client"

import { WhyThisAnswer } from "@/components/ui/why-this-answer"

export default function Demo() {
  return (
    <WhyThisAnswer
      reasoning={["Searched planning studies", "Kept two recent sources"]}
      sources={[
        { title: "State of Team Planning", url: "https://example.com", snippet: "61% plan on Mondays." },
      ]}
    />
  )
}`,
  "approval-step": `"use client"

import { useState } from "react"
import { ApprovalStep } from "@/components/ui/approval-step"

export default function Demo() {
  const [state, setState] = useState<"pending" | "approved" | "rejected">("pending")
  return (
    <ApprovalStep
      title="Book 8 flights"
      description="Charges the team card on file."
      risk="medium"
      details={["8 x LHR to LIS", "Total: $2,376.00"]}
      state={state}
      onApprove={() => setState("approved")}
      onReject={() => setState("rejected")}
    />
  )
}`,
  "feedback-thumbs": `"use client"

import { FeedbackThumbs } from "@/components/ui/feedback-thumbs"

export default function Demo() {
  return <FeedbackThumbs onSubmit={(vote, reasons) => console.log(vote, reasons)} />
}`,
  "tool-timeline": `import { ToolTimeline } from "@/components/ui/tool-timeline"

export default function Demo() {
  return (
    <ToolTimeline
      steps={[
        { id: "1", name: "search_venues", args: "Lisbon", status: "failed", summary: "API timed out" },
        { id: "2", name: "search_venues", args: "backup", status: "ok", summary: "Found 9 venues" },
        { id: "3", name: "estimate_cost", args: "", status: "running" },
      ]}
    />
  )
}`,
  "plan-preview": `"use client"

import { useState } from "react"
import { PlanPreview, type PlanItem } from "@/components/ui/plan-preview"

export default function Demo() {
  const [steps, setSteps] = useState<PlanItem[]>([
    { id: "1", text: "Find venues under $3k" },
    { id: "2", text: "Check availability" },
  ])
  return <PlanPreview steps={steps} onChange={setSteps} onConfirm={() => console.log(steps)} />
}`,
  "interrupt-steer": `"use client"

import { InterruptSteer } from "@/components/ui/interrupt-steer"

export default function Demo() {
  return (
    <InterruptSteer
      running
      segments={[{ role: "agent", text: "Day two is a walking tour." }]}
      suggestions={["Keep it indoors"]}
      onSteer={(message) => console.log(message)}
      onStop={() => console.log("stop")}
    />
  )
}`,
  "prompt-composer": `"use client"

import { useState } from "react"
import { PromptComposer } from "@/components/ui/prompt-composer"

export default function Demo() {
  const [status, setStatus] = useState<"idle" | "generating">("idle")
  return (
    <PromptComposer
      status={status}
      suggestions={["Plan a team offsite", "Summarise this document"]}
      onSubmit={({ text, files, mode, modelName, effort }) => {
        console.log(text, files, mode, modelName, effort)
        setStatus("generating")
      }}
      onStop={() => setStatus("idle")}
    />
  )
}`,
  "chat-thread": `"use client"

import { ChatThread } from "@/components/ui/chat-thread"

export default function Demo() {
  return (
    <ChatThread
      className="h-[28rem]"
      messages={[
        { id: "0", role: "system", variant: "date", text: "Today" },
        { id: "1", role: "agent", text: "What are you working on?", time: "9:41 AM" },
        { id: "2", role: "user", text: "Help me plan a team offsite.", time: "9:42 AM" },
        {
          id: "3",
          role: "agent",
          text: "Sure! Here is a guide to start with.",
          links: [{ label: "How to plan an offsite", kind: "article", href: "https://example.com" }],
        },
      ]}
    />
  )
}`,
};

export const tags: Record<string, string[]> = {
  "streaming-response": ["Streaming", "Chat", "Loading state", "Error handling"],
  "confidence-badge": ["Trust", "Badge", "Uncertainty", "Accessibility"],
  "why-this-answer": ["Trust", "Citations", "Explainability", "Disclosure"],
  "approval-step": ["Human in the loop", "Safety", "Confirmation", "Risk"],
  "feedback-thumbs": ["Feedback", "Rating", "Learning", "Micro-interaction"],
  "tool-timeline": ["Agents", "Tool calls", "Timeline", "Observability"],
  "plan-preview": ["Agents", "Planning", "Editable", "Reorder"],
  "interrupt-steer": ["Agents", "Chat", "Steering", "Composer"],
  "prompt-composer": ["Input", "Chat", "Mobile", "Attachments"],
  "chat-thread": ["Chat", "Conversation", "Agents", "Streaming"],
};
