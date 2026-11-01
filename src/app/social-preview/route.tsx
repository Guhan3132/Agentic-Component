import { ImageResponse } from "next/og";

// The 1280x640 image for the GitHub repo's "Social preview" setting. Not linked from the site.
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 100, background: "#ffffff", color: "#18181b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "linear-gradient(135deg, #7c3aed, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="42" height="42" viewBox="0 0 64 64">
              <path d="M32 4l8 20 20 8-20 8-8 20-8-20-20-8 20-8z" fill="#fff" />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 600 }}>Agentic UI</div>
        </div>
        <div style={{ marginTop: 44, fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>UX patterns for AI agents you can feel.</div>
        <div style={{ marginTop: 30, fontSize: 34, color: "#52525b" }}>Open-source React components. Live, copyable, shadcn-ready.</div>
      </div>
    ),
    { width: 1280, height: 640 },
  );
}
