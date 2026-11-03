"use client";

// A chat screen wired to a real model with the Vercel AI SDK, using three Agentic UI patterns:
//   StreamingResponse for the text (with an activity line while tools run),
//   ToolTimeline for what the agent did, and ApprovalStep for the tool that needs a yes.
// Install the patterns first:  npx shadcn@latest add <site>/r/streaming-response.json (and tool-timeline, approval-step)
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart, lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage } from "ai";
import { useState } from "react";
import { ApprovalStep } from "@/registry/approval-step/approval-step";
import { StreamingResponse, type StreamStatus } from "@/registry/streaming-response/streaming-response";
import { ToolTimeline, type ToolStep } from "@/registry/tool-timeline/tool-timeline";

/** The AI SDK's tool part states, mapped onto the timeline's four. */
function toSteps(message: UIMessage): ToolStep[] {
  return message.parts.filter(isToolUIPart).map((part) => {
    const status: ToolStep["status"] =
      part.state === "output-available" ? "ok" : part.state === "output-error" || part.state === "output-denied" ? "failed" : part.state === "approval-requested" ? "pending" : "running";
    const output = part.state === "output-available" ? (part.output as { summary?: string } | undefined) : undefined;
    return {
      id: part.toolCallId,
      name: getToolName(part),
      args: part.input ? JSON.stringify(part.input) : "",
      status,
      summary: output?.summary ?? (part.state === "output-error" ? part.errorText : part.state === "output-denied" ? "Not approved" : undefined),
    };
  });
}

export function AgentChat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, regenerate, error, addToolApprovalResponse } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    // After the person answers an approval, send it back so the run continues.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const last = messages.findLast((m) => m.role === "assistant");
  const text = last?.parts.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";
  const steps = last ? toSteps(last) : [];
  const running = steps.find((s) => s.status === "running");
  const streamStatus: StreamStatus = error ? "error" : status === "submitted" || status === "streaming" ? "streaming" : last ? "done" : "idle";
  const approval = last?.parts.filter(isToolUIPart).find((p) => p.state === "approval-requested");

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      {messages.filter((m) => m.role === "user").map((m) => (
        <p key={m.id} className="ml-auto w-fit rounded-2xl bg-muted px-4 py-2 text-sm">
          {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
        </p>
      ))}

      {steps.length > 0 && <ToolTimeline steps={steps} />}

      {approval && approval.state === "approval-requested" && (
        <ApprovalStep
          title={`Run ${getToolName(approval)}`}
          description="Charges the team card on file."
          risk="medium"
          details={[JSON.stringify(approval.input)]}
          state="pending"
          onApprove={() => addToolApprovalResponse({ id: approval.approval.id, approved: true })}
          onReject={() => addToolApprovalResponse({ id: approval.approval.id, approved: false, reason: "The person said no" })}
        />
      )}

      {last && (
        <StreamingResponse
          text={text}
          status={streamStatus}
          errorMessage={error?.message}
          onStop={stop}
          onRegenerate={() => regenerate()}
          // The activity line times itself from when each tool starts.
          activity={running ? { label: `Running ${running.name}`, state: "running" } : undefined}
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
        className="flex gap-2"
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} aria-label="Message" className="min-w-0 flex-1 rounded-lg border border-input bg-card px-3 py-2 text-base sm:text-sm" />
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Send</button>
      </form>
    </div>
  );
}
