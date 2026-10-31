"use client";

import { useEffect, useRef, useState } from "react";
import { PromptComposer } from "@/registry/prompt-composer/prompt-composer";

const REPLY =
  "Here is how I would start: draft a plan for you to review, run each step while showing what it does, and ask before anything risky. Open the playground to try the full flow.";

/** A small, working composer for the hero: send a message, watch a reply type out, press Stop. */
export function HeroDemo() {
  const [log, setLog] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setTyping(false);
  };

  const submit = (text: string) => {
    stop();
    setLog([{ role: "user", text: text || "(attachment)" }, { role: "agent", text: "" }]);
    setTyping(true);
    let i = 0;
    timer.current = setInterval(() => {
      i += 2;
      setLog((l) => l.map((m, idx) => (idx === 1 ? { ...m, text: REPLY.slice(0, i) } : m)));
      if (i >= REPLY.length) stop();
    }, 28);
  };

  return (
    <div className="flex w-full flex-col gap-2.5">
      {log.length > 0 && (
        <div className="space-y-2" aria-live="polite">
          {log.map((m, i) => (
            <p
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-2xl bg-zinc-900 px-3.5 py-2 text-sm text-white shadow-lg"
                  : "w-fit max-w-[90%] rounded-2xl border border-white/60 bg-white/90 px-3.5 py-2 text-sm text-zinc-800 shadow-lg backdrop-blur"
              }
            >
              {m.text || "…"}
            </p>
          ))}
        </div>
      )}
      <PromptComposer
        className="drop-shadow-2xl"
        status={typing ? "generating" : "idle"}
        onStop={stop}
        onSubmit={(m) => submit(m.text)}
        placeholder="How can I help you today?"
        suggestions={["Plan a team offsite", "Draft a reply to Sam"]}
      />
    </div>
  );
}
