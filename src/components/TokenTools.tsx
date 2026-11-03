"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { useBrand } from "@/components/BrandSwitcher";
import { cn } from "@/lib/cn";
import { deriveTheme, themeCss } from "@/theme/derive";

/** A token name or value that copies itself on click, with a short confirmation. */
export function CopyText({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard blocked */
        }
      }}
      title={`Copy ${text}`}
      className={cn("group inline-flex max-w-full items-center gap-1.5 rounded px-1 py-0.5 text-left font-mono text-xs hover:bg-muted pointer-coarse:min-h-11", className)}
    >
      <span className="truncate">{text}</span>
      {done ? <Check size={12} className="shrink-0 text-success" aria-hidden /> : <Copy size={12} className="shrink-0 opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60" aria-hidden />}
      <span role="status" className="sr-only">
        {done ? `Copied ${text}` : ""}
      </span>
    </button>
  );
}

/** The "paste the CSS" example, for whatever brand colour is chosen in the Brand panel right now. */
export function BrandCss() {
  const brand = useBrand();
  const theme = deriveTheme(brand.hex, { tintNeutrals: brand.tint, textColor: brand.white ? "white" : "auto" });
  if (!theme) return null;
  const css = themeCss(theme)
    .replace(/; /g, ";\n  ")
    .replace(/\{ /g, "{\n  ")
    .replace(/; \}/g, ";\n}")
    .replace(/;\s*\}/g, ";\n}");
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        For your current brand colour, <code>{brand.hex}</code>. Change it with the Brand button and this updates.
      </p>
      <CodeBlock code={css} file="globals.css" />
    </div>
  );
}
