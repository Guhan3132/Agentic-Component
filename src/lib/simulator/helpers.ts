import type { Step } from "./types";

/** Split text into word-sized token events with a fixed delay (ms) between them. */
export function tokens(text: string, delay = 45): Step[] {
  return text
    .split(/(?<=\s)/)
    .map((t) => ({ delay, event: { type: "token", text: t } as const }));
}
