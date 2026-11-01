import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentMemory, type MemoryItem } from "@/registry/agent-memory/agent-memory";
import { Citations } from "@/registry/citations/citations";
import { ErrorRecovery } from "@/registry/error-recovery/error-recovery";
import { HumanHandoff } from "@/registry/human-handoff/human-handoff";

afterEach(() => vi.useRealTimers());

describe("ErrorRecovery", () => {
  const base = { kind: "network" as const, title: "Connection lost", message: "The stream stopped." };

  it("retries on its own when the countdown reaches zero", () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    render(<ErrorRecovery {...base} retryAfter={3} onRetry={onRetry} />);
    expect(screen.getByText(/Retrying in 3s/)).toBeInTheDocument();
    // One tick per act: each second schedules the next one only after React has re-rendered.
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    expect(onRetry).not.toHaveBeenCalled();
    expect(screen.getByText(/Retrying in 1s/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("Cancel stops the countdown", () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    render(<ErrorRecovery {...base} retryAfter={3} onRetry={onRetry} />);
    act(() => screen.getByRole("button", { name: "Cancel" }).click());
    act(() => vi.advanceTimersByTime(10000));
    expect(onRetry).not.toHaveBeenCalled();
    expect(screen.queryByText(/Retrying in/)).not.toBeInTheDocument();
  });

  it("offers no Retry for a refusal", () => {
    render(<ErrorRecovery kind="refusal" title="Can't do that" message="No." onRetry={() => {}} alternative={{ label: "Rephrase", onClick: () => {} }} />);
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rephrase" })).toBeInTheDocument();
  });

  it("puts the alternative first once attempts run out", () => {
    render(<ErrorRecovery {...base} attempt={3} maxAttempts={3} onRetry={() => {}} alternative={{ label: "Use cached prices", onClick: () => {} }} />);
    expect(screen.getByText(/Tried 3 times/)).toBeInTheDocument();
    const buttons = screen.getAllByRole("button").map((b) => b.textContent?.trim());
    expect(buttons.indexOf("Use cached prices")).toBeLessThan(buttons.indexOf("Retry"));
  });

  it("is announced as an alert", () => {
    render(<ErrorRecovery {...base} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Connection lost");
  });
});

describe("AgentMemory", () => {
  const seed: MemoryItem[] = [
    { id: "1", text: "You prefer window seats", source: "From your chat" },
    { id: "2", text: "Your team has 8 people", source: "From your chat" },
  ];

  function Harness({ onSuggestionAccept }: { onSuggestionAccept?: () => void }) {
    const [items, setItems] = useState(seed);
    const [enabled, setEnabled] = useState(true);
    return (
      <AgentMemory
        items={items}
        enabled={enabled}
        onToggle={setEnabled}
        suggestion={onSuggestionAccept ? { id: "s", text: "You are vegetarian", source: "From this chat" } : undefined}
        onAccept={() => onSuggestionAccept?.()}
        onEdit={(id, text) => setItems((l) => l.map((m) => (m.id === id ? { ...m, text } : m)))}
        onForget={(id) => setItems((l) => l.filter((m) => m.id !== id))}
        onRestore={(m) => setItems((l) => [...l, m])}
      />
    );
  }

  it("forgets a memory and brings it back with Undo", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /Forget: Your team has 8 people/ }));
    expect(screen.queryByText("Your team has 8 people")).not.toBeInTheDocument();
    expect(screen.getByText(/Forgot/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText("Your team has 8 people")).toBeInTheDocument();
  });

  it("edits a memory in place: Enter saves, Escape cancels", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /Edit: You prefer window seats/ }));
    const field = screen.getByLabelText("Edit memory");
    await user.clear(field);
    await user.type(field, "You prefer aisle seats{Enter}");
    expect(screen.getByText("You prefer aisle seats")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Edit: You prefer aisle seats/ }));
    await user.type(screen.getByLabelText("Edit memory"), " today{Escape}");
    expect(screen.getByText("You prefer aisle seats")).toBeInTheDocument();
  });

  it("asks before remembering, and the switch turns memory off", async () => {
    const user = userEvent.setup();
    const accept = vi.fn();
    render(<Harness onSuggestionAccept={accept} />);
    expect(screen.getByText(/Remember that/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remember" }));
    expect(accept).toHaveBeenCalledTimes(1);

    const sw = screen.getByRole("switch", { name: /Remember things about me/ });
    expect(sw).toHaveAttribute("aria-checked", "true");
    await user.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByText(/Remember that/)).not.toBeInTheDocument();
  });
});

describe("HumanHandoff", () => {
  it("shows what will be shared before connecting, and offers a way to decline", async () => {
    const user = userEvent.setup();
    const onRequest = vi.fn();
    const onDecline = vi.fn();
    render(<HumanHandoff state="offer" summary={["Your refund question"]} onRequest={onRequest} onDecline={onDecline} />);
    expect(screen.getByText("What they will see")).toBeInTheDocument();
    expect(screen.getByText("Your refund question")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep chatting" }));
    expect(onDecline).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Connect me to a person" }));
    expect(onRequest).toHaveBeenCalled();
  });

  it("gives a real position and wait, with a way out", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onFallback = vi.fn();
    render(<HumanHandoff state="waiting" position={2} etaMinutes={3} onCancel={onCancel} onFallback={onFallback} />);
    expect(screen.getByText(/number 2 in line, about 3 min/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Leave the line" }));
    await user.click(screen.getByRole("button", { name: /Email me instead/ }));
    expect(onCancel).toHaveBeenCalled();
    expect(onFallback).toHaveBeenCalled();
  });

  it("says who joined, and says plainly when the team is offline", () => {
    const { rerender } = render(<HumanHandoff state="connected" personName="Priya" summary={["x"]} />);
    expect(screen.getByText("Priya joined the chat")).toBeInTheDocument();
    rerender(<HumanHandoff state="unavailable" backAt="at 9:00 AM" onFallback={() => {}} />);
    expect(screen.getByText("Our team is offline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Email the team/ })).toBeInTheDocument();
  });

  it("announces every state in one polite status region", () => {
    render(<HumanHandoff state="offer" />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });
});

describe("Citations", () => {
  const sources = [
    { id: 1, title: "Budgets", url: "https://example.com/a", publisher: "Event Weekly", quote: "Averages $2,400 to $3,100." },
    { id: 2, title: "Venues", url: "https://example.com/b", publisher: "City Notes", quote: "Two-night minimum." },
  ];

  it("opens the exact quote for a marker and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(<Citations text="Costs $2,400 to $3,100 [1]. Needs two nights [2]." sources={sources} />);
    const marker = screen.getByRole("button", { name: /Source 1: Budgets/ });
    expect(marker).toHaveAttribute("aria-expanded", "false");
    await user.click(marker);
    expect(marker).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Averages \$2,400 to \$3,100\./)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByText(/Averages \$2,400/)).not.toBeInTheDocument();
  });

  it("switches the open quote when another marker is chosen", async () => {
    const user = userEvent.setup();
    render(<Citations text="A [1] and B [2]." sources={sources} />);
    await user.click(screen.getByRole("button", { name: /Source 1/ }));
    await user.click(screen.getByRole("button", { name: /Source 2/ }));
    expect(screen.getByText(/Two-night minimum\./)).toBeInTheDocument();
    expect(screen.queryByText(/Averages/)).not.toBeInTheDocument();
  });

  it("flags and counts claims with no source", () => {
    render(<Citations text="Prices rise [?]. Also unsourced [?]." sources={[]} />);
    expect(screen.getAllByText(/no source/)).toHaveLength(3); // two flags and the summary sentence
    expect(screen.getByText(/2 claims have no source/)).toBeInTheDocument();
  });
});
