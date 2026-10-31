export type Tool = "claude-code" | "codex" | "cursor" | "replit" | "lovable" | "bolt" | "v0";

export const tools: { id: Tool; label: string }[] = [
  { id: "claude-code", label: "Claude Code" },
  { id: "codex", label: "Codex" },
  { id: "cursor", label: "Cursor" },
  { id: "replit", label: "Replit" },
  { id: "lovable", label: "Lovable" },
  { id: "bolt", label: "Bolt.new" },
  { id: "v0", label: "v0 by Vercel" },
];

// Each tool gets one line of context about how it edits a project. The rest is shared.
const toolNote: Record<Tool, string> = {
  "claude-code": "You are running in a local repository. Create the files directly with your file tools, then run the install command for the dependencies.",
  codex: "You are running in a local repository. Apply the change as a patch, then run the install command for the dependencies.",
  cursor: "You are working inside the user's workspace. Create the files in the workspace and install the dependencies in the terminal.",
  replit: "You are working in the user's Replit project. Create the files in the project and install the dependencies with the package manager.",
  lovable: "You are working in the user's Lovable project. Add the files to the project and add the listed dependencies.",
  bolt: "You are working in the user's Bolt project. Add the files to the project and add the listed dependencies.",
  v0: "You are working in the user's v0 project. Add the component and its demo to the project.",
};

type Input = {
  slug: string;
  title: string;
  code: string;
  usage: string;
  tool?: Tool;
};

/** Component source as shipped: shadcn projects keep `cn` in @/lib/utils. */
export const shippedCode = (code: string) => code.replaceAll('"@/lib/cn"', '"@/lib/utils"');

/** npm packages a component file imports, so prompts and docs list exactly what to install. */
export function depsOf(code: string): string[] {
  const deps = new Set<string>();
  if (code.includes("lucide-react")) deps.add("lucide-react");
  if (code.includes("motion/react")) deps.add("motion");
  if (code.includes("@/lib/cn")) deps.add("clsx");
  return [...deps];
}

export function buildPrompt({ slug, title, code, usage, tool }: Input): string {
  return `You are given a task to integrate an existing React component in the codebase${tool ? `\n\n${toolNote[tool]}` : ""}

The codebase should support:
- shadcn project structure
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles.
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
\`\`\`tsx
${slug}.tsx
${shippedCode(code)}

demo.tsx
${usage}
\`\`\`

Component: ${title}. It uses shadcn theme tokens (background, foreground, card, muted, border, primary), so it follows your light and dark theme automatically.

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's arguments and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies (lucide-react, clsx) and make sure a \`cn\` helper exists in @/lib/utils
 2. Wire the callbacks (onStop, onApprove, onSubmit and similar) to the app's real handlers
 3. Use lucide-react icons for svgs or logos if component requires them
`;
}

export const cliCommand = (origin: string, slug: string) => `npx shadcn@latest add "${origin}/r/${slug}.json"`;

/** Remix: start from this component, but have the agent ask what to change before editing. */
export function buildRemixPrompt(input: Input): string {
  return `Remix task: use the component below as the starting point and adapt it to my project. Before you edit anything, ask me which parts to change (copy, props, theme, behaviour), then make only those changes.

${buildPrompt(input)}`;
}
