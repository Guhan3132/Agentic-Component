export type Source = { title: string; url: string; snippet: string };

export type AgentEvent =
  | { type: "token"; text: string }
  | { type: "tool_call"; id: string; name: string; args: string }
  | { type: "tool_result"; id: string; ok: boolean; summary: string }
  | { type: "confidence"; value: number; reason: string }
  | { type: "sources"; items: Source[]; reasoning: string[] }
  | {
      type: "approval_required";
      id: string;
      title: string;
      description: string;
      risk: "low" | "medium" | "high";
      details: string[];
    }
  | { type: "plan"; id: string; steps: string[] }
  | { type: "approval_resolved"; id: string; decision: "approved" | "rejected" }
  | { type: "error"; message: string }
  | { type: "done" };

export type Step = { delay: number; event: AgentEvent };

export type Scenario = { id: string; label: string; hint: string; script: Step[] };

export type SimStatus = "idle" | "running" | "waiting" | "done" | "stopped" | "error";
