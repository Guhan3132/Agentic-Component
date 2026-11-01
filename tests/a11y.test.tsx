import axe from "axe-core";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { AgentMemory } from "@/registry/agent-memory/agent-memory";
import { ApprovalStep } from "@/registry/approval-step/approval-step";
import { Citations } from "@/registry/citations/citations";
import { ConfidenceBadge } from "@/registry/confidence-badge/confidence-badge";
import { ErrorRecovery } from "@/registry/error-recovery/error-recovery";
import { FeedbackThumbs } from "@/registry/feedback-thumbs/feedback-thumbs";
import { HumanHandoff } from "@/registry/human-handoff/human-handoff";
import { PlanPreview } from "@/registry/plan-preview/plan-preview";
import { WhyThisAnswer } from "@/registry/why-this-answer/why-this-answer";

/** Structure and ARIA checks. Colour contrast needs real layout, so it is checked in the browser instead. */
async function violations(ui: ReactElement) {
  const { container } = render(ui);
  const result = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
}

const noop = () => {};
const cases: [string, ReactElement][] = [
  ["error recovery", <ErrorRecovery key="a" kind="rate-limit" title="Too many requests" message="Try again shortly." kept={["Your question"]} retryAfter={6} onRetry={noop} alternative={{ label: "Keep what I have", onClick: noop }} details="HTTP 429" />],
  ["error recovery (refusal)", <ErrorRecovery key="b" kind="refusal" title="Can't help" message="Not possible." alternative={{ label: "Rephrase", onClick: noop }} />],
  ["agent memory", <AgentMemory key="c" items={[{ id: "1", text: "You prefer window seats", source: "From your chat" }]} suggestion={{ id: "s", text: "You are vegetarian", source: "This chat" }} onToggle={noop} onEdit={noop} onForget={noop} />],
  ["human hand-off (offer)", <HumanHandoff key="d" state="offer" summary={["Your question"]} onRequest={noop} onDecline={noop} />],
  ["human hand-off (waiting)", <HumanHandoff key="e" state="waiting" position={2} etaMinutes={3} onCancel={noop} onFallback={noop} />],
  ["citations", <Citations key="f" text="Costs $3,000 [1]. Rises in peak season [?]." sources={[{ id: 1, title: "Budgets", url: "https://example.com", quote: "About $3,000." }]} />],
  ["approval step", <ApprovalStep key="g" title="Book flights" description="Charges the card." risk="high" details={["8 seats"]} state="pending" autoFocus={false} onApprove={noop} onReject={noop} />],
  ["confidence badge", <ConfidenceBadge key="h" value={0.64} reason="Sources disagree." />],
  ["feedback thumbs", <FeedbackThumbs key="i" />],
  ["why this answer", <WhyThisAnswer key="j" reasoning={["Searched studies"]} sources={[{ title: "Study", url: "https://example.com", snippet: "61%." }]} />],
  ["plan preview", <PlanPreview key="k" steps={[{ id: "1", text: "Find venues" }, { id: "2", text: "Check dates" }]} onChange={noop} onConfirm={noop} />],
];

describe("accessibility (axe, structure and ARIA)", () => {
  it.each(cases)("%s has no violations", async (_name, ui) => {
    expect(await violations(ui)).toEqual([]);
  });
});
