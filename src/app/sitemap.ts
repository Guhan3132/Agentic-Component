import type { MetadataRoute } from "next";
import { patterns } from "@/registry";
import { RELEASES, SITE_URL } from "@/lib/site";

const base = SITE_URL;
const latest = new Date(Object.values(RELEASES).sort().at(-1)!);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, lastModified: latest, priority: 1 },
    { url: `${base}/get-started`, lastModified: latest, priority: 0.9 },
    { url: `${base}/about`, lastModified: latest, priority: 0.6 },
    { url: `${base}/tokens`, lastModified: latest, priority: 0.7 },
    { url: `${base}/customize`, lastModified: latest, priority: 0.6 },
    { url: `${base}/playground`, lastModified: latest, priority: 0.8 },
    ...patterns.map((p) => ({ url: `${base}/components/${p.slug}`, lastModified: new Date(RELEASES[p.since ?? "0.1.0"] ?? RELEASES["0.1.0"]), priority: 0.7 })),
  ];
}
