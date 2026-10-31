"use client";

import { Check, ChevronDown, CodeXml, Sparkles, Terminal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toolIcons } from "@/components/ToolIcons";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { buildPrompt, cliCommand, shippedCode, tools, type Tool } from "@/lib/prompts";

type Props = { slug: string; title: string; code: string; usage: string; children?: ReactNode };

/** Split button: the main action copies the AI prompt; the menu offers code, CLI and per-tool prompts. */
export function CopyMenu({ slug, title, code, usage, children }: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [originX, setOriginX] = useState(24);
  const box = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        caret.current?.focus();
      }
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  // Move focus into the menu once it is open, so arrow keys work straight away.
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true }), 40);
    return () => clearTimeout(id);
  }, [open]);

  const toggle = () => {
    if (!open && caret.current && box.current) {
      // The menu grows out of the chevron that opened it, not its own centre.
      const c = caret.current.getBoundingClientRect();
      const b = box.current.getBoundingClientRect();
      setOriginX(c.left - b.left + c.width / 2);
    }
    setOpen(!open);
  };

  const items = () => [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
  const onMenuKey = (e: React.KeyboardEvent) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") list[(i + 1) % list.length]?.focus();
    else if (e.key === "ArrowUp") list[(i - 1 + list.length) % list.length]?.focus();
    else if (e.key === "Home") list[0]?.focus();
    else if (e.key === "End") list[list.length - 1]?.focus();
    else return;
    e.preventDefault();
  };

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      track("copy", { slug, kind: id });
      setDone(id);
      setOpen(false);
      setTimeout(() => setDone((d) => (d === id ? null : d)), 1600);
    } catch {
      setDone("error");
    }
  };

  const prompt = (tool?: Tool) => buildPrompt({ slug, title, code, usage, tool });
  const cli = () => cliCommand(window.location.origin, slug);

  return (
    <div ref={box} className="relative flex flex-wrap items-center gap-2">
      <div className="flex">
        <button
          onClick={() => copy("prompt", prompt())}
          className="inline-flex items-center gap-2 rounded-l-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Swap on={done === "prompt"} on_={<Check size={15} />} off={<PromptIcon />} />
          {done === "prompt" ? "Copied" : "Copy prompt"}
        </button>
        <button
          ref={caret}
          aria-label="More copy options"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={toggle}
          className="rounded-r-lg border-l border-primary-foreground/20 bg-primary px-2.5 text-primary-foreground hover:bg-primary/90"
        >
          <ChevronDown size={16} className={cn("transition-transform duration-200", open && "rotate-180")} />
        </button>
      </div>

      {children}

      <button
        onClick={() => copy("cli", cli())}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
      >
        <Swap on={done === "cli"} on_={<Check size={15} />} off={<Terminal size={15} />} />
        {done === "cli" ? "Copied" : "CLI"}
      </button>

      {done === "error" && <span role="alert" className="text-sm text-rose-600">Clipboard is blocked in this browser.</span>}

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menu}
            role="menu"
            onKeyDown={onMenuKey}
            style={{ transformOrigin: `${originX}px 0px` }}
            initial={{ opacity: 0, scale: 0.94, y: -6, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            // Same path out as in, only quicker: spatial consistency.
            exit={{ opacity: 0, scale: 0.96, y: -4, filter: "blur(4px)", transition: { duration: 0.13, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="material-pop absolute left-0 top-full z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border p-1.5 shadow-2xl"
          >
            <Item icon={<Sparkles size={16} />} title="Copy prompt" hint="AI-ready prompt with full component context." onClick={() => copy("prompt", prompt())} />
            <Item icon={<CodeXml size={16} />} title="Copy code" hint="Raw source code of the component." onClick={() => copy("code", shippedCode(code))} />
            <Item icon={<Terminal size={16} />} title="Copy CLI command" hint="Installs the file with the shadcn CLI." onClick={() => copy("cli", cli())} />
            <div className="mx-2 my-1.5 border-t border-border" />
            <p className="px-3 pb-1 pt-1.5 text-xs text-muted-foreground">Optimized for</p>
            {tools.map((t) => {
              const Icon = toolIcons[t.id];
              return (
                <button
                  key={t.id}
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => copy(t.id, prompt(t.id))}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <span className="grid h-5 w-5 place-items-center">
                    <Icon />
                  </span>
                  {t.label}
                  {done === t.id && <Check size={14} className="ml-auto" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Icon swap with a quick scale, so the confirmation reads as a response to the press. */
function Swap({ on, on_, off }: { on: boolean; on_: ReactNode; off: ReactNode }) {
  return (
    <span className="grid h-4 w-4 place-items-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={on ? "on" : "off"}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", bounce: 0, duration: 0.25 }}
          className="grid place-items-center"
        >
          {on ? on_ : off}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Item({ icon, title, hint, onClick }: { icon: ReactNode; title: string; hint: string; onClick: () => void }) {
  return (
    <button
      role="menuitem"
      tabIndex={-1}
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
    >
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span>
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

function PromptIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.5 14 5v6L8 14.5 2 11V5l6-3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2 5l6 3.5L14 5M8 8.5v6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
