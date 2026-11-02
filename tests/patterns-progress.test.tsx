import axe from "axe-core";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActivityIndicator, formatElapsed } from "@/registry/activity-indicator/activity-indicator";
import { TaskChecklist, type Task } from "@/registry/task-checklist/task-checklist";

afterEach(() => vi.useRealTimers());

const tasks: Task[] = [
  { id: "1", label: "Read the brief", status: "done" },
  { id: "2", label: "Shortlist venues", status: "active" },
  { id: "3", label: "Check availability", status: "pending" },
  { id: "4", label: "Skip the survey", status: "skipped" },
];

describe("TaskChecklist", () => {
  it("counts finished steps, marks the current one, and says each status in words", () => {
    render(<TaskChecklist title="Plan" tasks={tasks} />);
    expect(screen.getByText("2 of 4")).toBeInTheDocument(); // done and skipped both count as finished
    expect(screen.getByRole("progressbar", { name: "Plan progress" })).toHaveAttribute("aria-valuenow", "50");
    const items = screen.getAllByRole("listitem");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[0]).toHaveTextContent("Read the brief, done");
    expect(items[2]).toHaveTextContent("Check availability, not started");
    expect(screen.getByRole("status")).toHaveTextContent("Working on: Shortlist venues.");
  });

  it("folds to one line with the current step, and opens again", async () => {
    const user = userEvent.setup();
    render(<TaskChecklist title="Plan" tasks={tasks} defaultOpen={false} />);
    const toggle = screen.getByRole("button", { name: /Plan/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(toggle).toHaveTextContent("Shortlist venues");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("keeps a failure on its line with the reason and Retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<TaskChecklist title="Plan" tasks={[...tasks.slice(0, 1), { id: "2", label: "Shortlist venues", status: "failed", detail: "Calendar did not respond" }]} onRetry={onRetry} />);
    expect(screen.getByText("Calendar did not respond")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Stopped: Shortlist venues failed.");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledWith("2");
  });

  it("says when everything is done", () => {
    render(<TaskChecklist tasks={tasks.map((t) => ({ ...t, status: "done" as const }))} />);
    expect(screen.getByRole("status")).toHaveTextContent("All 4 steps done.");
  });
});

describe("ActivityIndicator", () => {
  it("formats elapsed time briefly", () => {
    expect(formatElapsed(4)).toBe("4s");
    expect(formatElapsed(364)).toBe("6m 4s");
    expect(formatElapsed(3725)).toBe("1h 2m");
    expect(formatElapsed(-3)).toBe("0s");
  });

  it("counts up from startedAt while running, with the timer hidden from screen readers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-02T10:00:00Z"));
    render(<ActivityIndicator label="Running page script" state="running" startedAt={Date.now() - 364_000} />);
    const timer = screen.getByText("6m 4s");
    expect(timer).toHaveAttribute("aria-hidden", "true");
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText("6m 6s")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Running page script.");
  });

  it("turns into a past-tense record when done, and says how it ended when it fails", () => {
    const { rerender } = render(<ActivityIndicator label="Running page script" doneLabel="Ran page script" state="done" elapsedSeconds={12} />);
    expect(screen.getByText("Ran page script")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Ran page script, in 12s.");
    rerender(<ActivityIndicator label="Running page script" doneLabel="Ran page script" state="failed" elapsedSeconds={3} />);
    expect(screen.getByText("Ran page script failed")).toBeInTheDocument();
  });

  it("opens the detail with the chevron and offers Stop while running", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    render(<ActivityIndicator label="Running page script" state="running" elapsedSeconds={5} details="node collect.mjs" onStop={onStop} />);
    const toggle = screen.getByRole("button", { name: /Running page script/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("node collect.mjs")).not.toBeVisible();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("node collect.mjs")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalled();
  });
});

describe("accessibility (axe) for the progress patterns", () => {
  async function violations(ui: ReactElement) {
    const { container } = render(ui);
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    return r.violations.map((v) => `${v.id}: ${v.help}`);
  }
  it("task checklist, open and folded", async () => {
    expect(await violations(<TaskChecklist tasks={tasks} onRetry={() => {}} />)).toEqual([]);
    expect(await violations(<TaskChecklist tasks={tasks} defaultOpen={false} />)).toEqual([]);
  });
  it("activity indicator, running and done", async () => {
    expect(await violations(<ActivityIndicator label="Running page script" state="running" elapsedSeconds={5} details="log" onStop={() => {}} />)).toEqual([]);
    expect(await violations(<ActivityIndicator label="Searching" doneLabel="Searched" state="done" elapsedSeconds={12} />)).toEqual([]);
  });
});
