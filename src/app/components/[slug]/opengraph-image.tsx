import { ImageResponse } from "next/og";
import { getPattern, patterns } from "@/registry";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Agentic UI pattern";

export function generateStaticParams() {
  return patterns.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPattern((await params).slug);
  const title = p?.title ?? "Agentic UI";
  const summary = p?.summary ?? "UX patterns for AI agents";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#ffffff", color: "#18181b" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #7c3aed, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" viewBox="0 0 64 64">
                <path d="M32 4l8 20 20 8-20 8-8 20-8-20-20-8 20-8z" fill="#fff" />
              </svg>
            </div>
            <div style={{ fontSize: 34, fontWeight: 600 }}>Agentic UI</div>
          </div>
          {p && (
            <div style={{ display: "flex", fontSize: 26, color: "#52525b", border: "2px solid #e4e4e7", borderRadius: 999, padding: "8px 22px" }}>{p.category}</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
          <div style={{ marginTop: 28, fontSize: 36, lineHeight: 1.3, color: "#52525b", maxWidth: 980 }}>{summary}</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#71717a" }}>agentic-component.vercel.app</div>
      </div>
    ),
    size,
  );
}
