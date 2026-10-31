import type { ComponentType } from "react";
import ApprovalDemo from "./approval-step/demo";
import ConfidenceDemo from "./confidence-badge/demo";
import ErrorRecoveryDemo from "./error-recovery/demo";
import FeedbackDemo from "./feedback-thumbs/demo";
import StreamingDemo from "./streaming-response/demo";
import InterruptDemo from "./interrupt-steer/demo";
import PlanDemo from "./plan-preview/demo";
import ChatDemo from "./chat-thread/demo";
import ComposerDemo from "./prompt-composer/demo";
import ToolDemo from "./tool-timeline/demo";
import WhyDemo from "./why-this-answer/demo";

export const demos: Record<string, ComponentType> = {
  "streaming-response": StreamingDemo,
  "confidence-badge": ConfidenceDemo,
  "why-this-answer": WhyDemo,
  "approval-step": ApprovalDemo,
  "feedback-thumbs": FeedbackDemo,
  "tool-timeline": ToolDemo,
  "plan-preview": PlanDemo,
  "interrupt-steer": InterruptDemo,
  "prompt-composer": ComposerDemo,
  "chat-thread": ChatDemo,
  "error-recovery": ErrorRecoveryDemo,
};
