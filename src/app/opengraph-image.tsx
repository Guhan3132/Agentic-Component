import { ImageResponse } from "next/og";

export const alt = "Agentic UI: UX patterns for AI agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          background: "#ffffff",
          color: "#18181b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 64 64">
              <path d="M32 4l8 20 20 8-20 8-8 20-8-20-20-8 20-8z" fill="#fff" />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 600 }}>Agentic UI</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
          UX patterns for AI agents you can feel.
        </div>
        <div style={{ marginTop: 32, fontSize: 34, color: "#52525b" }}>
          Live, copyable React components. Streaming, trust, approval, planning, chat.
        </div>
      </div>
    ),
    size,
  );
}
