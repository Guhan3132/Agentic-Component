"use client";

import { useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { ToolPermissions, type PermissionMode, type PermissionRequest, type PermissionTool } from "./tool-permissions";

const defaults: PermissionTool[] = [
  { id: "search", name: "search_web", description: "Looks things up online. Sends your query to a search provider.", risk: "read", mode: "allow" },
  { id: "files", name: "read_files", description: "Opens files in the folder you shared. Cannot see anything else.", risk: "read", mode: "allow" },
  { id: "email", name: "send_email", description: "Sends email from your account to the people you name.", risk: "write", mode: "ask" },
  { id: "calendar", name: "edit_calendar", description: "Creates and moves events on your calendar.", risk: "write", mode: "ask" },
  { id: "delete", name: "delete_files", description: "Permanently removes files. They do not go to the trash.", risk: "destructive", mode: "block" },
];

type Variant = Scenario & { tools: PermissionTool[]; request?: PermissionRequest };

const scenarios: Variant[] = [
  { id: "defaults", label: "Sensible defaults", hint: "Reading is allowed, changes ask first, deleting is blocked. Change any line, or reset.", script: [], tools: defaults },
  {
    id: "request",
    label: "Agent asks",
    hint: "When the agent needs something it was not given, it asks in plain words with a once, always or no.",
    script: [],
    tools: defaults.map((t) => (t.id === "email" ? { ...t, mode: "block" as const } : t)),
    request: { toolId: "email", reason: "To send the agenda to the 8 people on the offsite list." },
  },
  {
    id: "strict",
    label: "Locked down",
    hint: "Everything asks first, and nothing can be deleted. A good start for a new agent.",
    script: [],
    tools: defaults.map((t) => ({ ...t, mode: (t.risk === "destructive" ? "block" : "ask") as PermissionMode })),
  },
];

export default function Demo() {
  const [id, setId] = useState("defaults");
  const variant = scenarios.find((s) => s.id === id)!;
  const [tools, setTools] = useState(variant.tools);
  const [request, setRequest] = useState<PermissionRequest | undefined>(variant.request);
  const [note, setNote] = useState<string | null>(null);

  const load = (n: string) => {
    const v = scenarios.find((s) => s.id === n)!;
    setTools(v.tools);
    setRequest(v.request);
    setNote(null);
  };

  const set = (toolId: string, mode: PermissionMode) => setTools((l) => l.map((t) => (t.id === toolId ? { ...t, mode } : t)));
  const changed = tools.some((t, i) => t.mode !== variant.tools[i].mode);

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
      <div className="space-y-3">
        <ToolPermissions
          tools={tools}
          onChange={set}
          request={request}
          onDecide={(d) => {
            if (!request) return;
            if (d === "always") set(request.toolId, "allow");
            setNote(d === "once" ? "Allowed for this one request. It will ask again next time." : d === "always" ? "Always allowed. You can change it above." : "Denied. The agent will carry on without it.");
            setRequest(undefined);
          }}
          onReset={changed ? () => load(id) : undefined}
        />
        {note && (
          <p role="status" className="text-sm text-muted-foreground">
            {note}
          </p>
        )}
      </div>
    </DemoFrame>
  );
}
