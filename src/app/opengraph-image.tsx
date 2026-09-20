import { ImageResponse } from "next/og";
import { SITE } from "@/lib/config";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#111111";
const PAPER = "#ffffff";
const MUTED = "#8a8a87";
const LINE = "#e6e6e3";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          padding: "68px 76px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="11" fill="none" stroke={INK} strokeWidth="1" opacity="0.22" />
            <circle cx="9.5" cy="16" r="4.5" fill={INK} />
            <circle cx="22.5" cy="16" r="4.5" fill="none" stroke={INK} strokeWidth="2" />
            <circle cx="16" cy="16" r="1.6" fill={INK} />
          </svg>
          <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1.5, color: INK }}>
            boop.
          </span>
        </div>

        <span style={{ flex: 1 }} />

        <span
          style={{
            fontSize: 96,
            fontWeight: 600,
            letterSpacing: -5,
            lineHeight: 1.02,
            color: INK,
            maxWidth: 940,
          }}
        >
          Ship the one people actually pick.
        </span>

        <span style={{ fontSize: 30, color: MUTED, marginTop: 28, maxWidth: 820 }}>
          Human taste tests for landing pages, logos, screenshots, copy and
          everything else you&rsquo;re about to ship.
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 44,
            borderTop: `1px solid ${LINE}`,
            paddingTop: 26,
          }}
        >
          <span style={{ fontSize: 22, color: MUTED }}>{SITE.domain}</span>
          <span style={{ fontSize: 22, color: LINE }}>·</span>
          <span style={{ fontSize: 22, color: MUTED }}>
            Human taste &gt; another AI opinion
          </span>
        </div>
      </div>
    ),
    size,
  );
}
