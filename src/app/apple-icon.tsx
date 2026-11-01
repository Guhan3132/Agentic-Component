import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
        }}
      >
        <svg width="110" height="110" viewBox="0 0 64 64">
          <path d="M32 4l8 20 20 8-20 8-8 20-8-20-20-8 20-8z" fill="#fff" />
        </svg>
      </div>
    ),
    size,
  );
}
