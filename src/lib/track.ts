import { track as vercelTrack } from "@vercel/analytics";

type Value = string | number | boolean;

/**
 * Anonymous usage event (no cookies, no personal data). Never throws, so
 * analytics can't break a click, and it is a no-op outside Vercel.
 */
export function track(name: string, props?: Record<string, Value>) {
  try {
    vercelTrack(name, props);
  } catch {
    /* blocked or offline */
  }
}
