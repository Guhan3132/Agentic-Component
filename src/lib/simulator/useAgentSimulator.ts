"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentEvent, SimStatus, Step } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Plays a scripted list of events on a timer. Deterministic, free, and shaped like
 * a real agent stream, so swapping in a live model later does not change the components.
 */
export function useAgentSimulator(script: Step[], speed = 1) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<SimStatus>("idle");
  const runId = useRef(0);
  const resolver = useRef<((d: "approved" | "rejected") => void) | null>(null);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  });

  const stop = useCallback(() => {
    runId.current++;
    resolver.current = null;
    setStatus((s) => (s === "running" || s === "waiting" ? "stopped" : s));
  }, []);

  const reset = useCallback(() => {
    runId.current++;
    resolver.current = null;
    setEvents([]);
    setStatus("idle");
  }, []);

  const run = useCallback(async () => {
    const id = ++runId.current;
    resolver.current = null;
    setEvents([]);
    setStatus("running");
    const push = (e: AgentEvent) => setEvents((prev) => [...prev, e]);

    for (const step of script) {
      await sleep(step.delay / speedRef.current);
      if (runId.current !== id) return;
      const e = step.event;
      push(e);
      if (e.type === "approval_required" || e.type === "plan") {
        setStatus("waiting");
        const decision = await new Promise<"approved" | "rejected">((r) => {
          resolver.current = r;
        });
        if (runId.current !== id) return;
        push({ type: "approval_resolved", id: e.id, decision });
        setStatus("running");
        if (decision === "rejected") break;
      }
      if (e.type === "error") {
        setStatus("error");
        return;
      }
    }
    if (runId.current === id) setStatus("done");
  }, [script]);

  const decide = useCallback((d: "approved" | "rejected") => resolver.current?.(d), []);

  useEffect(() => () => void runId.current++, []);

  return { events, status, run, stop, reset, decide };
}
