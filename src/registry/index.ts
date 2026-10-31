export type Category = "Respond" | "Trust" | "Act" | "Control" | "Learn";

export type Pattern = {
  slug: string;
  title: string;
  category: Category;
  summary: string;
  why: string;
  dos: string[];
  donts: string[];
  a11y: string[];
  props: { name: string; type: string; desc: string }[];
};

export const categories: Category[] = ["Respond", "Trust", "Act", "Control", "Learn"];

export const patterns: Pattern[] = [
  {
    slug: "streaming-response",
    title: "Streaming response",
    category: "Respond",
    summary: "Text that arrives as it is written, with stop, retry and a clear failure state.",
    why: "Waiting on a blank screen feels broken. Streaming shows progress, and a Stop button gives users control over a slow or wrong answer. Keeping partial text on failure means a dropped connection never costs them what already arrived.",
    dos: ["Keep partial text when stopped or failed", "Show a thinking indicator before the first token", "Make Retry the primary action after an error"],
    donts: ["Clear the answer when the stream breaks", "Announce every token to screen readers", "Leave Stop hidden until the end"],
    a11y: ["Status changes are announced through a polite live region, not per token", "aria-busy is set while streaming", "Buttons are real buttons with visible focus"],
    props: [
      { name: "text", type: "string", desc: "Accumulated text so far" },
      { name: "status", type: "idle | streaming | stopped | error | done", desc: "Drives which controls appear" },
      { name: "onStop / onRegenerate", type: "() => void", desc: "Control callbacks" },
    ],
  },
  {
    slug: "confidence-badge",
    title: "Confidence badge",
    category: "Trust",
    summary: "A plain-language signal for how sure the agent is, with a reason and a next step.",
    why: "Users either trust everything or nothing unless the system tells them how sure it is. A badge with a reason lets them calibrate, and a low score changes the advice (verify first) instead of only changing a colour.",
    dos: ["Pair colour with an icon and a word", "Explain the score in one sentence", "Tell the user what to do when it is low"],
    donts: ["Show a bare percentage with no meaning", "Use colour alone", "Show high confidence for guesses"],
    a11y: ["Level is conveyed by text and icon, not colour alone", "Reason is visible text, not only a tooltip"],
    props: [
      { name: "value", type: "number (0 to 1)", desc: "Model or retrieval confidence" },
      { name: "reason", type: "string", desc: "Why the score is what it is" },
    ],
  },
  {
    slug: "why-this-answer",
    title: "Why this answer",
    category: "Trust",
    summary: "An expandable panel with reasoning steps and quotable sources.",
    why: "People trust an answer they can check. Keeping the explanation one click away leaves the answer uncluttered while still making it verifiable. When there are no sources, saying so is more honest than hiding the panel.",
    dos: ["Quote the exact snippet used", "Say plainly when nothing is cited", "Keep it collapsed by default"],
    donts: ["Invent sources", "Bury it in a modal", "Show raw chain-of-thought dumps"],
    a11y: ["Toggle uses aria-expanded", "Sources are real links that open in a new tab with rel=noreferrer"],
    props: [
      { name: "sources", type: "{ title, url, snippet }[]", desc: "Empty array shows the no-sources state" },
      { name: "reasoning", type: "string[]", desc: "Short human-readable steps" },
    ],
  },
  {
    slug: "approval-step",
    title: "Approval step",
    category: "Control",
    summary: "A human-in-the-loop gate that scales friction with the risk of the action.",
    why: "Agents that act need a checkpoint, but approving everything trains people to click through. Matching friction to risk keeps low-risk steps fast and makes the dangerous ones deliberate, with focus starting on the safe choice.",
    dos: ["Show exactly what will happen", "Scale friction with risk", "Confirm the outcome after the decision"],
    donts: ["Ask for approval on every step", "Default focus to Approve for destructive actions", "Hide the details behind another click"],
    a11y: ["Focus moves to the card, on Reject for high-risk actions", "Outcome is announced via role=status", "Approve is disabled, not hidden, until acknowledged"],
    props: [
      { name: "risk", type: "low | medium | high", desc: "Controls friction and wording" },
      { name: "state", type: "pending | approved | rejected", desc: "Shows buttons or the outcome" },
      { name: "onApprove / onReject", type: "() => void", desc: "Decision callbacks" },
    ],
  },
  {
    slug: "feedback-thumbs",
    title: "Feedback thumbs",
    category: "Learn",
    summary: "One-tap rating that asks for a reason only after a thumbs-down.",
    why: "Most people will not fill in a form, but a thumbs-up costs nothing. Asking why only after a thumbs-down gets useful signal where it matters, with optional chips so it takes one tap, not a paragraph.",
    dos: ["Make a thumbs-up a single tap", "Offer reason chips, not a blank box", "Let people skip the reason"],
    donts: ["Require a reason", "Ask for feedback before the answer is finished", "Show a long survey"],
    a11y: ["Thumbs are toggle buttons with aria-pressed and labels", "Confirmation is announced politely"],
    props: [
      { name: "onSubmit", type: "(vote, reasons) => void", desc: "Called on thumbs-up or after sending reasons" },
      { name: "downReasons", type: "string[]", desc: "Custom chips for the thumbs-down" },
    ],
  },
  {
    slug: "tool-timeline",
    title: "Tool-call timeline",
    category: "Act",
    summary: "A step-by-step record of what the agent did, with real outcomes, including failures.",
    why: "When an agent acts, people need to see what happened without reading logs. A timeline turns hidden tool calls into a short story: what ran, what came back, and where it went wrong. Showing failures and recoveries builds more trust than a clean-looking run that hides them.",
    dos: ["Show failures and retries, not only successes", "Keep each row to a name, its input and one line of result", "Say how the agent recovered"],
    donts: ["Dump raw JSON into the timeline", "Hide failed steps once they are retried", "Leave a running step with no indicator"],
    a11y: ["Rendered as an ordered list with a label", "Each status icon has a text label (Running, Done, Failed)"],
    props: [
      { name: "steps", type: "{ id, name, args, status, summary? }[]", desc: "status is pending, running, ok or failed" },
    ],
  },
  {
    slug: "plan-preview",
    title: "Plan preview",
    category: "Act",
    summary: "The agent proposes steps. You edit, reorder or remove them before it runs.",
    why: "Reviewing a plan is cheaper than undoing an action. Letting people change the plan, not only accept or reject it, keeps them in charge and gives the agent better instructions than a vague prompt would.",
    dos: ["Make every step editable", "Show the step count on the confirm button", "Provide move buttons, not drag only"],
    donts: ["Offer only Accept and Reject", "Start running before confirmation", "Allow an empty plan to be confirmed"],
    a11y: ["Every control has an accessible name that includes the step number", "Reordering works with the keyboard, no drag needed"],
    props: [
      { name: "steps", type: "{ id, text }[]", desc: "Controlled list of plan steps" },
      { name: "onChange", type: "(steps) => void", desc: "Called when the user edits the plan" },
      { name: "onConfirm / onCancel", type: "() => void", desc: "Decision callbacks" },
    ],
  },
  {
    slug: "interrupt-steer",
    title: "Interrupt and steer",
    category: "Control",
    summary: "A composer that stays live while the agent works, so you redirect it mid-run.",
    why: "Waiting for a wrong answer to finish before correcting it wastes time. Keeping the input active lets people steer early, and keeping what the agent already wrote shows the correction was heard.",
    dos: ["Keep the input enabled while the agent runs", "Keep the partial answer visible", "Offer one-tap suggestions for common corrections"],
    donts: ["Disable the input until the run finishes", "Throw away what was already generated", "Make Stop the only way to react"],
    a11y: ["The transcript is a polite live region", "The input has a label and Enter submits"],
    props: [
      { name: "segments", type: "{ role, text }[]", desc: "Transcript so far" },
      { name: "running", type: "boolean", desc: "Shows Stop and suggestions while true" },
      { name: "onSteer / onStop", type: "callbacks", desc: "Send a correction or halt the run" },
    ],
  },
  {
    slug: "prompt-composer",
    title: "Prompt composer",
    category: "Control",
    summary: "A chat-style message box for agents: / commands, @ context, image paste, voice, and mode and model in a row under the box. Built for phones as well as desktops.",
    why: "The composer is where every agent conversation starts, so small frictions add up. This one keeps the common path to a single field and moves the rest to the keyboard: type / to switch mode, pick a model or attach a file, and @ to add context, with mode and model one tap away under the box. It grows with the text, takes @ mentions and voice, and turns Send into Stop while the agent works. It adapts to its own width: on a phone, touch targets are 44px and text stays at 16px, which stops iOS from zooming in.",
    dos: ["Turn Send into Stop while generating", "Show the limit only when it gets close", "Offer suggestions while the box is empty"],
    donts: ["Disable the whole box while the agent works", "Send on Enter during IME composition", "Use text smaller than 16px on touch screens"],
    a11y: ["The / and @ menus work from the keyboard: arrow keys, Enter or Tab to choose, Escape to dismiss", "Menus open above their own button, move with the arrow keys, close with Escape and return focus to that button", "Every menu row is a real button, so nothing depends on hover; the model menu also takes the number keys 1 to 5", "Recording and generating are announced through a polite live region", "The mic is hidden in browsers without speech recognition, so there is no dead button"],
    props: [
      { name: "onSubmit", type: "({ text, files, mode, modelId, modelName, effort, auto }) => void", desc: "Called on Enter or the Send button" },
      { name: "status", type: "idle | generating", desc: "Generating swaps Send for Stop" },
      { name: "onStop", type: "() => void", desc: "Called by the Stop button" },
      { name: "modes", type: "string[]", desc: "Modes switched with /plan, /ask, /build. The last one is the default" },
      { name: "commands", type: "{ name, hint, run }[]", desc: "Extra / commands, added after the built-in ones" },
      { name: "steerable", type: "boolean", desc: "Keep Send live while generating, with Stop beside it" },
      { name: "models", type: "ComposerModel[]", desc: "Models with an optional badge (hint), supported efforts and a default flag. The first five are listed, the rest sit under More models" },
      { name: "contextOptions", type: "{ tag, hint }[]", desc: "Options for the @ mention menu" },
      { name: "suggestions", type: "string[]", desc: "Chips shown while the box is empty" },
      { name: "maxLength", type: "number", desc: "Character limit, default 4000" },
    ],
  },
  {
    slug: "chat-thread",
    title: "Chat thread",
    category: "Respond",
    summary: "A flat, readable conversation between a person and an agent, with references, files, hand-offs and unread markers.",
    why: "A chat is the most common agent surface, and most of its quality is in small details. The agent writes plain text under its name, so long answers with lists and references read like a document, while the person's messages sit in a soft bubble with the time under it. System lines mark the date, a hand-off to a human and where unread messages begin. A typing indicator and a streaming caret show the agent is working, a failed message offers Retry, and the thread follows new messages only while you are at the bottom, so reading earlier ones is never interrupted.",
    dos: ["Show who is speaking once per run of messages", "Put sources and files in a card under the answer, not in the text", "Mark hand-offs and the first unread message with a line", "Keep the reader's place when they scroll up, and show a jump button with a count"],
    donts: ["Wrap every agent answer in a bubble", "Scroll to the bottom on every message", "Announce every streamed token to screen readers", "Hide a failed send or leave it with no way to retry"],
    a11y: ["The thread is a log region that announces new messages, not every streamed character", "The typing indicator is a status with a label", "Rate and Copy are real buttons with pressed states and tooltips, and they are larger on touch screens", "The jump button says how many messages are new, and the thread can be focused to scroll with the arrow keys"],
    props: [
      { name: "messages", type: "ChatMessage[]", desc: "role is user, agent or system. Optional: time, status, feedback, sender, links, attachments, content, variant" },
      { name: "typing", type: "boolean", desc: "Shows the typing indicator before the reply starts" },
      { name: "agentName", type: "string", desc: "Shown above the agent's messages. Default AI Agent" },
      { name: "onRetry", type: "(id) => void", desc: "Called from Retry on a failed message" },
      { name: "onFeedback", type: "(id, value) => void", desc: "Called when someone rates an agent message (up or down), or takes the rating back (null)" },
      { name: "footer", type: "ReactNode", desc: "Rendered under the thread, usually a PromptComposer" },
      { name: "className", type: "string", desc: "Set a height such as h-[28rem]; the messages scroll inside it" },
    ],
  },
  {
    slug: "error-recovery",
    title: "Error recovery",
    category: "Respond",
    summary: "Says what failed, what survived and what to do next, with a visible auto-retry and a way forward when retrying stops helping.",
    why: "Every agent fails: connections drop, services rate-limit, tools time out, requests get declined. A red banner that says \"Something went wrong\" leaves people guessing whether their work is gone. This pattern names the problem in plain words, lists what was kept, retries transient errors on its own with a countdown you can cancel, and after the last attempt puts the real alternative first, because a fourth retry rarely helps. Declined requests get no Retry at all.",
    dos: ["Say what happened and what was kept", "Retry transient errors automatically, with a visible countdown and a Cancel", "Lead with the alternative once retries run out", "Keep technical detail one click away"],
    donts: ["Show \"Something went wrong\" and nothing else", "Retry silently or forever", "Offer Retry on a refusal", "Throw away the partial answer"],
    a11y: ["The card is role=alert, so the failure is announced once", "The countdown is hidden from screen readers and replaced by one sentence, so it is not read every second", "Technical details use aria-expanded", "Buttons are 44px on touch screens"],
    props: [
      { name: "kind", type: "network | rate-limit | tool | refusal", desc: "Sets the icon and tone. refusal hides Retry" },
      { name: "title / message", type: "string", desc: "What happened, and what the user can do about it" },
      { name: "kept", type: "string[]", desc: "Work that survived, shown as a checklist" },
      { name: "retryAfter", type: "number (seconds)", desc: "Starts an automatic retry countdown. Omit to retry only on request" },
      { name: "retrying / attempt / maxAttempts", type: "boolean / number / number", desc: "Drive the spinner and the retries-exhausted state" },
      { name: "onRetry", type: "() => void", desc: "Called by Retry and when the countdown reaches zero" },
      { name: "alternative", type: "{ label, onClick }", desc: "A different way forward. Becomes the main action after the last attempt" },
      { name: "details", type: "string", desc: "Technical detail for support, behind a toggle" },
    ],
  },
];

export const getPattern = (slug: string) => patterns.find((p) => p.slug === slug);
