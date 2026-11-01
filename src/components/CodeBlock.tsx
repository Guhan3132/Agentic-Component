"use client";

import { Check, Copy } from "lucide-react";
import { highlight } from "sugar-high";
import { useMemo, useState } from "react";

const language = (file: string) => (file === "terminal" ? "bash" : file.endsWith(".css") ? "css" : file.endsWith(".ts") ? "ts" : "tsx");

export function CodeBlock({ code, file }: { code: string; file: string }) {
  const [copied, setCopied] = useState(false);
  // sugar-high escapes the source, and the code here is our own, so injecting its output is safe.
  const html = useMemo(() => (file === "terminal" ? null : highlight(code)), [code, file]);
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 text-xs text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="font-mono">{file}</span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">{language(file)}</span>
        </span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 rounded px-2 py-1 text-zinc-700 hover:bg-zinc-100 pointer-coarse:min-h-11 pointer-coarse:px-3"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
        </button>
        <span role="status" className="sr-only">
          {copied ? `Copied ${file}` : ""}
        </span>
      </div>
      <pre className="max-h-96 overflow-auto p-4 text-xs leading-relaxed text-zinc-700">
        {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{code}</code>}
      </pre>
    </div>
  );
}
