"use client";

import { Maximize2, Minimize2, Monitor, Moon, RotateCw, Smartphone, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Scenario } from "@/lib/simulator/types";

type Props = {
  scenarios?: Scenario[];
  scenarioId?: string;
  onScenario?: (id: string) => void;
  onReplay?: () => void;
  /** fixed: the stage keeps one height so the page never jumps between states. auto: it grows with the content. */
  fit?: "fixed" | "auto";
  children: React.ReactNode;
};

type Viewport = "desktop" | "mobile";

const NO_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * Preview frame: a bordered stage with floating toolbars (expand, light/dark and reset on the left;
 * desktop/mobile on the right) and a control bar underneath for scenarios and replay.
 * Expand opens the same frame as a centred modal, so the demo keeps its state. The theme applies
 * only inside the frame (the `dark` class is scoped), and mobile narrows a real container so
 * components reflow as they would on a phone.
 */
export function DemoFrame({ scenarios, scenarioId, onScenario, onReplay, fit = "fixed", children }: Props) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [height, setHeight] = useState<number>();
  const [fading, setFading] = useState(false);
  const [run, setRun] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const expandBtn = useRef<HTMLButtonElement>(null);
  const active = scenarios?.find((s) => s.id === scenarioId);

  const expand = () => {
    // Keep the page layout steady while the frame lifts out of the flow.
    setHeight(wrap.current?.getBoundingClientRect().height);
    setOpen(true);
  };

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      expandBtn.current?.focus();
    }, 140);
  }, []);

  // Modal behaviour: Escape closes, Tab stays inside, page behind does not scroll.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    expandBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Reset returns the demo to its idle state: scenario demos reset their simulator, others remount.
  const reset = () => {
    if (scenarioId) onScenario?.(scenarioId);
    setRun((n) => n + 1);
  };

  const toggleTheme = () => {
    setFading(true);
    setDark(!dark);
    setTimeout(() => setFading(false), 360);
  };

  return (
    <div ref={wrap} style={open ? { height } : undefined}>
      {open && <div aria-hidden onClick={close} data-closing={closing || undefined} className="demo-backdrop" />}
      <div
        ref={panel}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-label={open ? "Expanded preview" : undefined}
        data-closing={closing || undefined}
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm",
          dark && "dark",
          fading && "theme-anim",
          open && "demo-modal flex flex-col shadow-2xl",
        )}
      >
        {/* Stage */}
        {/* No extra padded layer: the stage fills the frame, with the toolbars floating on it */}
        <div className={cn("relative", open && "min-h-0 flex-1")}>
          <Toolbar className="left-3 top-3 sm:left-4 sm:top-4">
            <IconBtn ref={expandBtn} label={open ? "Close expanded view" : "Expand preview"} onClick={open ? close : expand}>
              {open ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </IconBtn>
            <IconBtn label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme}>
              {dark ? <Moon size={15} /> : <Sun size={15} />}
            </IconBtn>
            <IconBtn label="Reset preview" onClick={reset}>
              <RotateCw size={15} />
            </IconBtn>
          </Toolbar>

          <Toolbar className="right-3 top-3 hidden sm:right-4 sm:top-4 sm:flex" label="Preview size">
            {(
              [
                ["desktop", Monitor, "Desktop view"],
                ["mobile", Smartphone, "Mobile view"],
              ] as const
            ).map(([v, Icon, label]) => (
              <IconBtn key={v} label={label} pressed={viewport === v} onClick={() => setViewport(v)}>
                <Icon size={15} />
              </IconBtn>
            ))}
          </Toolbar>

          <div
            className={cn(
              "flex flex-col bg-background px-2 pb-4 pt-14 sm:px-8 sm:pb-6 sm:pt-16",
              NO_SCROLLBAR,
              open ? "h-full min-h-0 overflow-y-auto" : fit === "fixed" ? "h-[32rem] overflow-y-auto" : "min-h-[22rem]",
            )}
          >
            {/* Critically damped spring (no overshoot), so resizing never feels bouncy. */}
            <motion.div
              key={run}
              initial={false}
              animate={{ width: viewport === "mobile" ? 375 : "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.45 }}
              className={cn(
                "mx-auto my-auto max-w-full bg-card",
                viewport === "mobile"
                  ? "rounded-[2rem] border-[6px] border-zinc-900 p-4 shadow-xl dark:border-zinc-600"
                  : "rounded-xl border border-border p-3 sm:p-6",
              )}
            >
              {children}
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        {(scenarios || onReplay) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2.5">
            {scenarios && (
              <div role="tablist" aria-label="Scenario" className="flex flex-wrap gap-1.5">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={s.id === scenarioId}
                    onClick={() => onScenario?.(s.id)}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm sm:px-3 sm:py-1",
                      s.id === scenarioId ? "bg-primary font-medium text-primary-foreground" : "bg-muted text-foreground/80 hover:bg-accent",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            {onReplay && (
              <button onClick={onReplay} className="ml-auto flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-2 text-sm text-foreground hover:bg-accent sm:px-3 sm:py-1">
                <RotateCw size={14} /> Replay
              </button>
            )}
            {active && <p className="basis-full text-sm text-muted-foreground">{active.hint}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function Toolbar({ children, className, label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn("absolute z-10 flex items-center gap-0.5 rounded-lg border border-border bg-card/90 p-0.5 shadow-sm backdrop-blur", className)}
    >
      {children}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  pressed,
  ref,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cn("rounded-md p-2.5 hover:bg-muted hover:text-foreground sm:p-1.5", pressed ? "bg-muted text-foreground" : "text-muted-foreground")}
    >
      {children}
    </button>
  );
}
