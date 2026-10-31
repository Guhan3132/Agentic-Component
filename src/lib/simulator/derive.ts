import type { AgentEvent } from "./types";

export type DerivedTool = {
  id: string;
  name: string;
  args: string;
  status: "running" | "ok" | "failed";
  summary?: string;
};

export const textOf = (events: AgentEvent[]) => events.map((e) => (e.type === "token" ? e.text : "")).join("");

/** Fold tool_call / tool_result events into one row per call. */
export function toolsOf(events: AgentEvent[]): DerivedTool[] {
  const rows: DerivedTool[] = [];
  for (const e of events) {
    if (e.type === "tool_call") rows.push({ id: e.id, name: e.name, args: e.args, status: "running" });
    if (e.type === "tool_result") {
      const r = rows.find((x) => x.id === e.id);
      if (r) {
        r.status = e.ok ? "ok" : "failed";
        r.summary = e.summary;
      }
    }
  }
  return rows;
}
