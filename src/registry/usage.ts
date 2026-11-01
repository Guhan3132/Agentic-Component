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
  "error-recovery": `"use client"

import { useState } from "react"
import { ErrorRecovery } from "@/components/ui/error-recovery"

export default function Demo() {
  const [attempt, setAttempt] = useState(1)
  return (
    <ErrorRecovery
      kind="rate-limit"
      title="Too many requests right now"
      message="This usually clears within a few seconds."
      kept={["Your question", "Everything found so far"]}
      retryAfter={6}
      attempt={attempt}
      onRetry={() => setAttempt(attempt + 1)}
      alternative={{ label: "Keep what I have", onClick: () => console.log("kept") }}
    />
  )
}`,
  citations: `import { Citations } from "@/components/ui/citations"

export default function Demo() {
  return (
    <Citations
      text="A two-day offsite for 8 people costs $2,400 to $3,100 [1]. Prices rise in peak season [?]."
      sources={[
        {
          id: 1,
          title: "Offsite budgets, explained",
          url: "https://example.com/offsite-budgets",
          quote: "A two-day offsite for 8 people averages $2,400 to $3,100.",
        },
      ]}
    />
  )
}`,
  "agent-memory": `"use client"

import { useState } from "react"
import { AgentMemory, type MemoryItem } from "@/components/ui/agent-memory"

export default function Demo() {
  const [items, setItems] = useState<MemoryItem[]>([
    { id: "1", text: "You prefer window seats", source: "From your chat on 12 Nov" },
  ])
  return (
    <AgentMemory
      items={items}
      onEdit={(id, text) => setItems(items.map((m) => (m.id === id ? { ...m, text } : m)))}
      onForget={(id) => setItems(items.filter((m) => m.id !== id))}
      onRestore={(item) => setItems([...items, item])}
    />
  )
}`,
  "human-handoff": `"use client"

import { useState } from "react"
import { HumanHandoff, type HandoffState } from "@/components/ui/human-handoff"

export default function Demo() {
  const [state, setState] = useState<HandoffState>("offer")
  return (
    <HumanHandoff
      state={state}
      summary={["Your refund question for order #4821", "What I already tried"]}
      position={2}
      etaMinutes={3}
      onRequest={() => setState("waiting")}
      onCancel={() => setState("offer")}
      onDecline={() => console.log("keep chatting")}
      onFallback={() => console.log("email instead")}
    />
  )
}`,
  "tool-permissions": `"use client"

import { useState } from "react"
import { ToolPermissions, type PermissionTool } from "@/components/ui/tool-permissions"

export default function Demo() {
  const [tools, setTools] = useState<PermissionTool[]>([
    { id: "search", name: "search_web", description: "Looks things up online.", risk: "read", mode: "allow" },
    { id: "email", name: "send_email", description: "Sends email from your account.", risk: "write", mode: "ask" },
    { id: "delete", name: "delete_files", description: "Permanently removes files.", risk: "destructive", mode: "block" },
  ])
  return (
    <ToolPermissions
      tools={tools}
      onChange={(id, mode) => setTools(tools.map((t) => (t.id === id ? { ...t, mode } : t)))}
    />
  )
}`,
  "multi-agent-status": `import { MultiAgentStatus } from "@/components/ui/multi-agent-status"

export default function Demo() {
  return (
    <MultiAgentStatus
      agents={[
        { id: "r", name: "Researcher", task: "Comparing venues", state: "working", progress: 0.4 },
        { id: "w", name: "Writer", task: "Drafting the invitation", state: "waiting", waitingOn: "Researcher" },
        { id: "b", name: "Budget", task: "Two venues are over budget", state: "blocked", waitingOn: "your decision" },
      ]}
      onOpen={(id) => console.log("review", id)}
    />
  )
}`,
  "voice-input": `"use client"

import { useState } from "react"
import { VoiceInput, type VoiceState } from "@/components/ui/voice-input"

export default function Demo() {
  const [state, setState] = useState<VoiceState>("idle")
  const [text, setText] = useState("")
  return (
    <VoiceInput
      state={state}
      transcript={text}
      onTranscriptChange={setText}
      onStart={() => setState("listening")}
      onStop={() => {
        setText("Book the house in Alfama for 8 people.")
        setState("review")
      }}
      onCancel={() => setState("idle")}
      onSend={(t) => {
        console.log(t)
        setState("idle")
      }}
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
  "error-recovery": ["Error handling", "Retry", "Resilience", "Accessibility"],
  citations: ["Trust", "Sources", "Verification", "Disclosure"],
  "agent-memory": ["Memory", "Privacy", "Personalisation", "Undo"],
  "human-handoff": ["Support", "Escalation", "Queue", "Context"],
  "tool-permissions": ["Permissions", "Safety", "Agents", "Settings"],
  "multi-agent-status": ["Agents", "Status", "Progress", "Dashboard"],
  "voice-input": ["Voice", "Input", "Mobile", "Accessibility"],
};
