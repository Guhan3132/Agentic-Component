"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { PatternCard } from "@/components/PatternCard";
import type { Category, Pattern } from "@/registry";
import { tags } from "@/registry/usage";

export function Gallery({ patterns, categories }: { patterns: Pattern[]; categories: Category[] }) {
  const [cat, setCat] = useState<Category | "All">("All");
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const shown = patterns.filter(
    (p) => (cat === "All" || p.category === cat) && [p.title, p.summary, ...(tags[p.slug] ?? [])].join(" ").toLowerCase().includes(q.trim().toLowerCase()),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clear = () => {
    setQ("");
    input.current?.focus();
  };

  return (
    <section id="patterns" className="mx-auto max-w-6xl px-5 pb-24">
      <h2 className="text-lg font-semibold tracking-tight">
        {cat === "All" ? "All patterns" : cat} <span className="text-sm font-normal text-zinc-400">({shown.length})</span>
      </h2>

      {/* Filters on the left, search at the right end */}
      <div className="mb-8 mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Category" className="flex flex-wrap gap-1.5">
          {(["All", ...categories] as const).map((c) => (
            <button
              key={c}
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm pointer-coarse:min-h-11 pointer-coarse:px-4",
                cat === c ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400",
              )}
            >
              {c} <span className={cn("text-xs", cat === c ? "text-white/70" : "text-zinc-400")}>{c === "All" ? patterns.length : patterns.filter((p) => p.category === c).length}</span>
            </button>
          ))}
        </div>

        <label className="relative flex w-full items-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500 focus-within:border-zinc-400 sm:w-64">
          <Search size={14} aria-hidden className="pointer-events-none absolute left-3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && q) {
                e.preventDefault();
                clear();
              }
            }}
            placeholder="Search patterns"
            aria-keyshortcuts="/"
            aria-label="Search patterns"
            autoComplete="off"
            className="h-11 w-full bg-transparent pl-9 pr-10 text-base text-zinc-900 outline-none placeholder:text-zinc-400 sm:h-9 sm:text-sm"
          />
          {!q && (
            <kbd aria-hidden className="pointer-events-none absolute right-3 hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 text-xs text-zinc-400 pointer-fine:block">
              /
            </kbd>
          )}
          {q && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="absolute right-1 grid size-9 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 sm:size-7"
            >
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">
          <p>{q ? `No patterns match "${q.trim()}".` : "No patterns in this category."}</p>
          {q && (
            <button onClick={clear} className="mt-2 text-sm font-medium text-zinc-900 underline underline-offset-4">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <PatternCard key={p.slug} pattern={p} />
          ))}
        </div>
      )}
    </section>
  );
}
