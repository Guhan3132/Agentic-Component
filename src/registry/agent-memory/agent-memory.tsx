"use client";

import { Brain, Check, Pencil, Trash2, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type MemoryItem = { id: string; text: string; /** Where it was learned, e.g. "From your chat on 12 Nov". */ source: string };

type Props = {
  items: MemoryItem[];
  /** A fact the agent wants to keep, waiting for a yes. */
  suggestion?: MemoryItem;
  /** When false, nothing new is remembered. */
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  onAccept?: (item: MemoryItem) => void;
  onDismiss?: (item: MemoryItem) => void;
  onEdit?: (id: string, text: string) => void;
  onForget: (id: string) => void;
  /** Called by Undo with the item that was just forgotten. */
  onRestore?: (item: MemoryItem) => void;
  className?: string;
};

const UNDO_MS = 6000;

/**
 * What the agent remembers about you, in plain sentences you can read, fix or forget. New memories are
 * asked for rather than taken, every item says where it came from, and a forget can be undone.
 */
export function AgentMemory({ items, suggestion, enabled = true, onToggle, onAccept, onDismiss, onEdit, onForget, onRestore, className }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [undo, setUndo] = useState<MemoryItem | null>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(id);
  }, [undo]);

  useEffect(() => {
    if (editing) field.current?.select();
  }, [editing]);

  const save = (id: string) => {
    const text = draft.trim();
    if (text) onEdit?.(id, text);
    setEditing(null);
  };

  return (
    <section aria-label="Memory" className={cn("rounded-xl border border-border bg-card", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-2 font-medium text-foreground">
          <Brain size={16} aria-hidden /> Memory
          <span className="text-xs font-normal text-muted-foreground">{items.length}</span>
        </h3>
        {onToggle && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            {enabled ? "On" : "Off"}
            <button
              role="switch"
              aria-checked={enabled}
              aria-label="Remember things about me"
              onClick={() => onToggle(!enabled)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors pointer-coarse:h-7 pointer-coarse:w-12",
                enabled ? "bg-primary" : "bg-muted-foreground/30",
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 top-0.5 size-4 rounded-full bg-background transition-transform pointer-coarse:size-6",
                  enabled && "translate-x-4 pointer-coarse:translate-x-5",
                )}
              />
            </button>
          </label>
        )}
      </header>

      {suggestion && enabled && (
        <div role="status" className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-3 text-sm">
          <span className="min-w-0 flex-1 basis-48 text-foreground">
            Remember that <strong className="font-medium">{suggestion.text.toLowerCase()}</strong>?
          </span>
          <button
            onClick={() => onAccept?.(suggestion)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 pointer-coarse:min-h-11"
          >
            <Check size={14} aria-hidden /> Remember
          </button>
          <button onClick={() => onDismiss?.(suggestion)} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:min-h-11">
            Not now
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">{enabled ? "Nothing yet. Things you tell me will show up here, and you decide what stays." : "Memory is off. Nothing is being saved."}</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((m) => (
            <li key={m.id} className="px-4 py-3">
              {editing === m.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    save(m.id);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={field}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                    aria-label="Edit memory"
                    className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:text-sm pointer-coarse:min-h-11"
                  />
                  <IconButton label="Save" type="submit">
                    <Check size={15} />
                  </IconButton>
                  <IconButton label="Cancel" onClick={() => setEditing(null)}>
                    <X size={15} />
                  </IconButton>
                </form>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{m.text}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.source}</p>
                  </div>
                  {onEdit && (
                    <IconButton
                      label={`Edit: ${m.text}`}
                      onClick={() => {
                        setDraft(m.text);
                        setEditing(m.id);
                      }}
                    >
                      <Pencil size={14} />
                    </IconButton>
                  )}
                  <IconButton
                    label={`Forget: ${m.text}`}
                    onClick={() => {
                      onForget(m.id);
                      setUndo(m);
                    }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite">
        {undo && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2.5 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">Forgot “{undo.text}”</span>
            <button
              onClick={() => {
                onRestore?.(undo);
                setUndo(null);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-medium text-foreground hover:bg-muted pointer-coarse:min-h-11"
            >
              <Undo2 size={14} aria-hidden /> Undo
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function IconButton({ label, children, onClick, type = "button" }: { label: string; children: React.ReactNode; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid shrink-0 place-items-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground pointer-coarse:size-11"
    >
      {children}
    </button>
  );
}
