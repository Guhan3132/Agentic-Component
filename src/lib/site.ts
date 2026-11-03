/**
 * Where the site lives. Set NEXT_PUBLIC_SITE_URL to move to a custom domain: every page, the sitemap,
 * the social images and the registry files read it from here. No trailing slash.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://agentic-component.vercel.app").replace(/\/$/, "");

export const SITE_HOST = new URL(SITE_URL).host;

export const REPO_URL = "https://github.com/Guhan3132/Agentic-Component";

/** Release dates, so the sitemap reports when a page really changed instead of the build time. */
export const RELEASES: Record<string, string> = {
  "0.1.0": "2026-10-31",
  "0.2.0": "2026-11-01",
  "0.3.0": "2026-11-01",
  "0.4.0": "2026-11-02",
  "0.5.0": "2026-11-03",
};
