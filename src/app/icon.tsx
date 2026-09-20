import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** PNG favicon for clients that don't take the SVG. */
export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="11" cy="16" r="4.4" fill="#ffffff" />
          <circle cx="22" cy="16" r="4.4" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="16.6" cy="16" r="1.5" fill="#ffffff" />
        </svg>
      </div>
    ),
    size,
  );
}
