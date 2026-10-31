"use client";

import { Bookmark, Check, Sparkles } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { buildRemixPrompt } from "@/lib/prompts";
import { track } from "@/lib/track";

const KEY = "agentic-ui:saved";

const EVENT = "agentic-ui:saved-change";
let memory: string[] = [];

const read = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return memory;
  }
};

const write = (next: string[]) => {
  memory = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the in-memory copy keeps the toggle working for this visit */
  }
  window.dispatchEvent(new Event(EVENT));
};

const subscribe = (notify: () => void) => {
  window.addEventListener(EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener("storage", notify);
  };
};

/** Bookmark a pattern in this browser. Stored locally; nothing is sent anywhere. */
export function SaveButton({ slug }: { slug: string }) {
  const saved = useSyncExternalStore(subscribe, () => read().includes(slug), () => false);

  const toggle = () => {
    write(saved ? read().filter((s) => s !== slug) : [...read(), slug]);
    if (!saved) track("save", { slug });
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2.5 pointer-coarse:min-h-11 text-sm font-medium hover:bg-muted",
        saved ? "bg-muted text-foreground" : "bg-card text-foreground",
      )}
    >
      <Bookmark size={15} className={cn(saved && "fill-current")} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}

/** Copies a prompt that asks the AI to adapt this component to the user's project. */
export function RemixButton({ slug, title, code, usage }: { slug: string; title: string; code: string; usage: string }) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildRemixPrompt({ slug, title, code, usage }));
      track("copy", { slug, kind: "remix" });
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <button
      onClick={copy}
      title="Copies a prompt that asks your AI to adapt this component to your project"
      className="inline-flex items-center gap-2 rounded-lg bg-muted px-3.5 py-2.5 pointer-coarse:min-h-11 text-sm font-medium text-foreground hover:bg-accent"
    >
      {done ? <Check size={15} /> : <Sparkles size={15} />}
      {done ? "Copied" : "Remix"}
    </button>
  );
}
