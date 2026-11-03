"use client";

import { useId, useState, type ComponentType, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export type DemoPart = { id: string; label: string; Demo: ComponentType };

/**
 * For a pattern made of more than one component: a tab per part above the preview. Only the chosen
 * part is mounted, so each keeps its own scenarios and replay.
 */
export function MergedDemo({ parts }: { parts: DemoPart[] }) {
  const [current, setCurrent] = useState(parts[0].id);
  const base = useId();
  const index = parts.findIndex((p) => p.id === current);
  const { Demo } = parts[index];

  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = parts[(index + step + parts.length) % parts.length];
    setCurrent(next.id);
    document.getElementById(`${base}-${next.id}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Part of this pattern" className="mb-3 inline-flex gap-1 rounded-xl bg-muted p-1" onKeyDown={onKey}>
        {parts.map((p) => (
          <button
            key={p.id}
            id={`${base}-${p.id}`}
            role="tab"
            aria-selected={p.id === current}
            aria-controls={`${base}-panel`}
            tabIndex={p.id === current ? 0 : -1}
            onClick={() => setCurrent(p.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium pointer-coarse:min-h-11",
              p.id === current ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-${current}`}>
        <Demo key={current} />
      </div>
    </div>
  );
}
