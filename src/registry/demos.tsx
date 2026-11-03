import type { ComponentType } from "react";
import { MergedDemo, type DemoPart } from "@/components/MergedDemo";
import AgentMemoryDemo from "./agent-memory/demo";
import ApprovalDemo from "./approval-step/demo";
import ChatDemo from "./chat-thread/demo";
import FeedbackDemo from "./chat-thread/demo-feedback";
import CitationsDemo from "./citations/demo";
import ReasoningDemo from "./citations/demo-reasoning";
import ConfidenceDemo from "./confidence-badge/demo";
import ErrorRecoveryDemo from "./error-recovery/demo";
import HumanHandoffDemo from "./human-handoff/demo";
import MultiAgentStatusDemo from "./multi-agent-status/demo";
import PlanDemo from "./plan-preview/demo";
import ProgressDemo from "./plan-preview/demo-progress";
import ComposerDemo from "./prompt-composer/demo";
import SteerDemo from "./prompt-composer/demo-steer";
import VoiceDemo from "./prompt-composer/demo-voice";
import StreamingDemo from "./streaming-response/demo";
import ActivityDemo from "./streaming-response/demo-activity";
import ToolPermissionsDemo from "./tool-permissions/demo";
import ToolDemo from "./tool-timeline/demo";

const parts = (list: DemoPart[]): ComponentType =>
  function Parts() {
    return <MergedDemo parts={list} />;
  };

export const demos: Record<string, ComponentType> = {
  "streaming-response": parts([
    { id: "stream", label: "Streaming text", Demo: StreamingDemo },
    { id: "activity", label: "Activity line", Demo: ActivityDemo },
  ]),
  "confidence-badge": ConfidenceDemo,
  citations: parts([
    { id: "inline", label: "Inline sources", Demo: CitationsDemo },
    { id: "reasoning", label: "Why this answer", Demo: ReasoningDemo },
  ]),
  "approval-step": ApprovalDemo,
  "tool-timeline": ToolDemo,
  "plan-preview": parts([
    { id: "review", label: "Before: review", Demo: PlanDemo },
    { id: "progress", label: "During: progress", Demo: ProgressDemo },
  ]),
  "prompt-composer": parts([
    { id: "compose", label: "Compose", Demo: ComposerDemo },
    { id: "steer", label: "Steer while running", Demo: SteerDemo },
    { id: "voice", label: "Voice", Demo: VoiceDemo },
  ]),
  "chat-thread": parts([
    { id: "thread", label: "Thread", Demo: ChatDemo },
    { id: "feedback", label: "Feedback", Demo: FeedbackDemo },
  ]),
  "error-recovery": ErrorRecoveryDemo,
  "agent-memory": AgentMemoryDemo,
  "human-handoff": HumanHandoffDemo,
  "tool-permissions": ToolPermissionsDemo,
  "multi-agent-status": MultiAgentStatusDemo,
};
