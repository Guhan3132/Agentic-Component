import axe from "axe-core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { MultiAgentStatus, type AgentRun } from "@/registry/multi-agent-status/multi-agent-status";
import { ToolPermissions, type PermissionTool } from "@/registry/tool-permissions/tool-permissions";
import { VoiceInput } from "@/registry/voice-input/voice-input";

const tools: PermissionTool[] = [
  { id: "s", name: "search_web", description: "Looks things up.", risk: "read", mode: "allow" },
  { id: "e", name: "send_email", description: "Sends email.", risk: "write", mode: "ask" },
  { id: "d", name: "delete_files", description: "Removes files.", risk: "destructive", mode: "block" },
];

describe("ToolPermissions", () => {
  it("summarises the modes and changes one tool with a native radio", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToolPermissions tools={tools} onChange={onChange} />);
    expect(screen.getByText("1 allowed, 1 ask first, 1 blocked")).toBeInTheDocument();
    const group = screen.getByRole("group", { name: /send_email/ });
    expect(within(group).getByRole("radio", { name: "Ask" })).toBeChecked();
    await user.click(within(group).getByRole("radio", { name: "Allow" }));
    expect(onChange).toHaveBeenCalledWith("e", "allow");
  });

  it("answers a request with once, always or deny, and announces it", async () => {
    const user = userEvent.setup();
    const onDecide = vi.fn();
    render(<ToolPermissions tools={tools} onChange={() => {}} request={{ toolId: "e", reason: "To send the agenda." }} onDecide={onDecide} />);
    expect(screen.getByRole("status")).toHaveTextContent("The agent wants to use send_email.");
    await user.click(screen.getByRole("button", { name: "Allow once" }));
    await user.click(screen.getByRole("button", { name: "Always allow" }));
    await user.click(screen.getByRole("button", { name: "Deny" }));
    expect(onDecide.mock.calls.map((c) => c[0])).toEqual(["once", "always", "deny"]);
  });

  it("shows Reset only when asked to", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    const { rerender } = render(<ToolPermissions tools={tools} onChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /Reset/ })).not.toBeInTheDocument();
    rerender(<ToolPermissions tools={tools} onChange={() => {}} onReset={onReset} />);
    await user.click(screen.getByRole("button", { name: /Reset/ }));
    expect(onReset).toHaveBeenCalled();
  });
});

describe("MultiAgentStatus", () => {
  const agents: AgentRun[] = [
    { id: "d", name: "Budget", task: "Done", state: "done" },
    { id: "w", name: "Researcher", task: "Comparing venues", state: "working", progress: 0.4 },
    { id: "b", name: "Writer", task: "Needs a decision", state: "blocked", waitingOn: "your decision" },
    { id: "f", name: "Mailer", task: "Timed out", state: "failed" },
  ];

  it("puts what needs attention first and summarises the group in one sentence", () => {
    render(<MultiAgentStatus agents={agents} />);
    const names = screen.getAllByRole("listitem").map((li) => within(li).getAllByText(/Writer|Mailer|Researcher|Budget/)[0].textContent);
    expect(names).toEqual(["Writer", "Mailer", "Researcher", "Budget"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 working, 1 needs you, 1 failed, 1 done");
  });

  it("shows a labelled progressbar only for working agents, and what blocked ones wait on", () => {
    render(<MultiAgentStatus agents={agents} />);
    const bar = screen.getByRole("progressbar", { name: "Researcher progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
    expect(screen.getByText("Waiting on your decision")).toBeInTheDocument();
  });

  it("offers Stop, Retry and Review on the right rows", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const onRetry = vi.fn();
    const onOpen = vi.fn();
    render(<MultiAgentStatus agents={agents} onStop={onStop} onRetry={onRetry} onOpen={onOpen} />);
    await user.click(screen.getByRole("button", { name: "Stop Researcher" }));
    await user.click(screen.getByRole("button", { name: "Retry Mailer" }));
    await user.click(screen.getByRole("button", { name: "Review" }));
    expect(onStop).toHaveBeenCalledWith("w");
    expect(onRetry).toHaveBeenCalledWith("f");
    expect(onOpen).toHaveBeenCalledWith("b");
  });

  it("has an honest empty state", () => {
    render(<MultiAgentStatus agents={[]} />);
    expect(screen.getByText("No agents running")).toBeInTheDocument();
  });
});

describe("VoiceInput", () => {
  const noop = () => {};
  const base = { onStart: noop, onStop: noop, onCancel: noop, onSend: noop };

  it("starts from idle and stops from listening, with the timer hidden from screen readers", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onStop = vi.fn();
    const { rerender } = render(<VoiceInput {...base} state="idle" onStart={onStart} />);
    await user.click(screen.getByRole("button", { name: "Start speaking" }));
    expect(onStart).toHaveBeenCalled();
    rerender(<VoiceInput {...base} state="listening" seconds={65} onStop={onStop} />);
    expect(screen.getByText("1:05")).toHaveAttribute("aria-hidden", "true");
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onStop).toHaveBeenCalled();
  });

  it("lets the person edit the text, and will not send an empty message", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const { rerender } = render(<VoiceInput {...base} state="review" transcript="Book 8 seats" onSend={onSend} />);
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSend).toHaveBeenCalledWith("Book 8 seats");
    rerender(<VoiceInput {...base} state="review" transcript="   " onSend={onSend} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("treats a blocked microphone differently from silence", () => {
    const { rerender } = render(<VoiceInput {...base} state="error" error="denied" onType={noop} />);
    expect(screen.getByRole("heading", { name: "Microphone is blocked" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Try again/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Type instead" })).toBeInTheDocument();
    rerender(<VoiceInput {...base} state="error" error="no-speech" onType={noop} />);
    expect(screen.getByRole("button", { name: /Try again/ })).toBeInTheDocument();
  });

  it("announces each state through one status line", () => {
    render(<VoiceInput {...base} state="transcribing" />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Turning your voice into text.");
  });
});

describe("accessibility (axe) for the new patterns", () => {
  async function violations(ui: ReactElement) {
    const { container } = render(ui);
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    return r.violations.map((v) => `${v.id}: ${v.help}`);
  }
  const noop = () => {};

  it("tool permissions with a request", async () => {
    expect(await violations(<ToolPermissions tools={tools} onChange={noop} onReset={noop} request={{ toolId: "e", reason: "To send the agenda." }} onDecide={noop} />)).toEqual([]);
  });
  it("multi-agent status", async () => {
    const agents: AgentRun[] = [
      { id: "b", name: "Writer", task: "Needs a decision", state: "blocked", waitingOn: "you" },
      { id: "w", name: "Researcher", task: "Comparing", state: "working", progress: 0.5 },
    ];
    expect(await violations(<MultiAgentStatus agents={agents} onOpen={noop} onStop={noop} />)).toEqual([]);
  });
  it.each(["idle", "listening", "transcribing", "review", "error"] as const)("voice input (%s)", async (state) => {
    expect(await violations(<VoiceInput state={state} transcript="Hello" error="denied" onStart={noop} onStop={noop} onCancel={noop} onSend={noop} onType={noop} />)).toEqual([]);
  });
});
