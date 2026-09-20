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
          background: "#111111",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="11" fill="none" stroke="#ffffff" strokeWidth="0.9" opacity="0.28" />
          <circle cx="9.8" cy="16" r="4.6" fill="#ffffff" />
          <circle cx="22.2" cy="16" r="4.6" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="16" cy="16" r="1.7" fill="#ffffff" />
        </svg>
      </div>
    ),
    size,
  );
}
