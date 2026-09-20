import { ImageResponse } from "next/og";
import { getResults } from "@/lib/data/read";
import { ogHeadline } from "@/lib/share";
import { SITE } from "@/lib/config";

export const alt = "Boop result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#111111";
const PAPER = "#ffffff";
const MUTED = "#8a8a87";
const LINE = "#e6e6e3";

/**
 * The share card. Built to survive a timeline: one enormous number, the
 * question underneath, and the split rendered as two bars. No logo soup.
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const results = await getResults(slug);

  if (!results) {
    return new ImageResponse(<Fallback />, size);
  }

  const { big, sub } = ogHeadline(results);
  const question = truncate(results.test.question, 92);
  const bars = results.variants.slice(0, 2);
  const isCompare = results.test.mode === "compare";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="30" height="30" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="11" fill="none" stroke={INK} strokeWidth="1" opacity="0.22" />
            <circle cx="9.5" cy="16" r="4.5" fill={INK} />
            <circle cx="22.5" cy="16" r="4.5" fill="none" stroke={INK} strokeWidth="2" />
            <circle cx="16" cy="16" r="1.6" fill={INK} />
          </svg>
          <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1.4, color: INK }}>
            boop.
          </span>
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 19,
              color: MUTED,
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              padding: "7px 18px",
            }}
          >
            {results.signalLabel}
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 64 }}>
          <span
            style={{
              fontSize: 116,
              fontWeight: 600,
              letterSpacing: -6,
              lineHeight: 1,
              color: INK,
            }}
          >
            {big}
          </span>
          <span
            style={{
              fontSize: 44,
              fontWeight: 500,
              letterSpacing: -1.8,
              color: MUTED,
              marginTop: 16,
            }}
          >
            {sub}
          </span>
        </div>

        <span style={{ flex: 1 }} />

        {/* Split bars */}
        {isCompare && results.totalVotes > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bars.map((v) => (
              <div
                key={v.variant.id}
                style={{ display: "flex", alignItems: "center", gap: 18 }}
              >
                <span
                  style={{
                    display: "flex",
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: v.isWinner ? INK : "#f2f2f0",
                    color: v.isWinner ? PAPER : INK,
                    fontSize: 18,
                    fontWeight: 600,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {v.variant.label}
                </span>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    height: 14,
                    borderRadius: 999,
                    background: "#f2f2f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: `${v.share}%`,
                      height: 14,
                      borderRadius: 999,
                      background: v.isWinner ? INK : "#b4b4b1",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: v.isWinner ? INK : MUTED,
                    width: 74,
                    textAlign: "right",
                  }}
                >
                  {v.share}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Question + footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 36,
            borderTop: `1px solid ${LINE}`,
            paddingTop: 26,
          }}
        >
          <span style={{ fontSize: 28, color: INK, letterSpacing: -0.7 }}>
            &ldquo;{question}&rdquo;
          </span>
          <span style={{ fontSize: 21, color: MUTED, marginTop: 12 }}>
            {SITE.domain}/t/{truncate(slug, 40)}
          </span>
        </div>
      </div>
    ),
    size,
  );
}

function Fallback() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: PAPER,
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1.6, color: INK }}>
        boop.
      </span>
      <span
        style={{
          fontSize: 86,
          fontWeight: 600,
          letterSpacing: -4,
          lineHeight: 1.04,
          color: INK,
          marginTop: 28,
        }}
      >
        {SITE.tagline}
      </span>
      <span style={{ fontSize: 26, color: MUTED, marginTop: 22 }}>{SITE.domain}</span>
    </div>
  );
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
