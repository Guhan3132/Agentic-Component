# Agentic UI

React components for the screens of an AI agent: streaming, trust, approval, planning, chat and input. Every pattern runs as a **live, scripted simulation**, so you can click it, break it and copy it, with no API key.

**Live demo: [agentic-component.vercel.app](https://agentic-component.vercel.app)**

It is meant to show how a good agent interface behaves, not only how it looks. Each pattern ships with its scenarios (for example "fails mid-stream" or "destructive action"), the reasoning behind it, do and don't lists, props, accessibility notes and the source.

## The patterns

| Pattern | Category | What it shows |
| --- | --- | --- |
| Streaming response | Respond | Text as it is written, with stop, retry and a clear failure state |
| Chat thread | Respond | A flat conversation: turns, references, files, hand-offs, unread marker, jump button |
| Confidence badge | Trust | How sure the agent is, with a reason and a next step |
| Why this answer | Trust | Reasoning steps and quotable sources, or an honest "no sources" |
| Tool-call timeline | Act | What the agent did, with real outcomes, including failures |
| Plan preview | Act | The agent proposes steps, you edit, reorder or remove them before anything runs |
| Approval step | Control | A human-in-the-loop gate whose friction scales with risk |
| Interrupt and steer | Control | A composer that stays live so you can redirect a running agent |
| Prompt composer | Control | Modes, model and effort, `/` commands, `@` context, image paste, voice |
| Feedback thumbs | Learn | One-tap rating that asks for a reason only after a thumbs-down |
| Error recovery | Respond | What failed, what survived, auto-retry with a countdown, and a way forward when retrying stops helping |
| Citations | Trust | Inline numbered sources that open the exact quote, with a visible flag on uncited claims |
| Agent memory | Control | What the agent remembers: editable, forgettable with undo, and switchable off |
| Human hand-off | Control | Pass a chat to a person with context, a real queue position and an email fallback |

The **Playground** (`/playground`) puts them together in one full-screen chat: pick a starter and watch a plan, tool calls, an approval, confidence and sources arrive in the thread. It has dark mode, reset and a desktop/mobile switch.

## Features

- **Simulated agents.** A small engine (`src/lib/simulator`) plays scripted event streams on a timer: tokens, tool calls, plans, approvals, confidence, sources. The event shape is close to a real stream, so a live model could replace it without changing the components.
- **Light and dark.** Components use shadcn-style tokens (`background`, `card`, `muted`, `primary`, ...), so they follow any theme. Each preview has its own light/dark switch.
- **Desktop and mobile.** Previews switch to a 375px phone frame. Components adapt to their own width with container queries, so they behave the same in a phone-sized panel as on a phone: 44px touch targets and 16px text (no iOS zoom).
- **Accessible.** Keyboard control for every menu, live regions that announce messages (not every streamed character), visible focus, tooltips for icon buttons, and reduced-motion support.
- **Copy it your way.** Each page offers an AI-ready prompt (tuned for Claude Code, Codex, Cursor, Replit, Lovable, Bolt.new and v0), the raw code, or a shadcn CLI command.

## Quick start

```bash
git clone https://github.com/Guhan3132/Agentic-Component.git
cd Agentic-Component
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build the registry JSON, then the production site |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint the project |
| `npm run registry:build` | Write `public/r/*.json` for the shadcn CLI |
| `npm test` | Check that every pattern is wired up and installable |

## Use a pattern in your project

Each component is a single file that depends only on React, [`lucide-react`](https://lucide.dev), [`motion`](https://motion.dev) (for some) and a `cn` helper.

**Requirements:** Tailwind CSS v4, TypeScript, and the shadcn theme tokens (`background`, `foreground`, `card`, `muted`, `muted-foreground`, `accent`, `border`, `input`, `ring`, `primary`, `primary-foreground`) with a `.dark` class for dark mode. Put `cn` in `@/lib/utils`.

**New here? See [Get started](https://agentic-component.vercel.app/get-started).**

**With the shadcn CLI** (every pattern is served from the live site):

```bash
npx shadcn@latest add "https://agentic-component.vercel.app/r/approval-step.json"
```

**Or by hand:** open a pattern page, use **Copy code** or **Copy prompt**, and paste it into `components/ui/`.

## Project structure

```
src/
  app/                    Pages: gallery, /components/[slug], /playground
  components/             Site UI: header, gallery, preview frame, copy menu, playground
  lib/
    simulator/            The scripted-agent engine and event types
    prompts.ts            Builds the "Copy prompt" text for each tool
  registry/
    index.ts              Pattern metadata: title, why, do/don't, a11y, props
    usage.ts              Usage snippets and tags
    <pattern>/
      <pattern>.tsx       The component you copy
      demo.tsx            Its scenarios and playground wiring
scripts/
  build-registry.mjs      Turns each component into public/r/<slug>.json
public/r/                 Generated registry files for the shadcn CLI
```

## Add a pattern

1. Create `src/registry/<slug>/<slug>.tsx` (the component) and `demo.tsx` (scenarios, using `DemoFrame` and the simulator).
2. Add its entry to `src/registry/index.ts`, a usage snippet and tags to `src/registry/usage.ts`, the demo to `src/registry/demos.tsx`, and a miniature to `src/components/Previews.tsx`.
3. Run `npm run registry:build` so the CLI file is generated.

## Tech stack

[Next.js](https://nextjs.org) 15 (App Router) · React 19 · TypeScript · [Tailwind CSS](https://tailwindcss.com) v4 · [Motion](https://motion.dev) · [lucide-react](https://lucide.dev)

## License

[MIT](./LICENSE)
