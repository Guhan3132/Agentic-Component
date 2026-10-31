import type { MetadataRoute } from "next";
import { patterns } from "@/registry";

const base = "https://agentic-component.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: base, lastModified: now, priority: 1 },
    { url: `${base}/get-started`, lastModified: now, priority: 0.9 },
    { url: `${base}/about`, lastModified: now, priority: 0.6 },
    { url: `${base}/playground`, lastModified: now, priority: 0.8 },
    ...patterns.map((p) => ({ url: `${base}/components/${p.slug}`, lastModified: now, priority: 0.7 })),
  ];
}
