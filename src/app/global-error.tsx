"use client";

import { useEffect } from "react";

/**
 * Last line of defence: replaces the root layout entirely, so it can't rely on
 * anything the app normally provides — fonts, Tailwind classes or components.
 * Everything here is inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[boop] global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 24,
          textAlign: "center",
          background: "#ffffff",
          color: "#111111",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        }}
      >
        <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="9.5" cy="16" r="4.5" fill="#111111" />
          <circle cx="22.5" cy="16" r="4.5" fill="none" stroke="#111111" strokeWidth="2" />
        </svg>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: "-0.035em",
          }}
        >
          Boop hit an unrecoverable error.
        </h1>
        <p style={{ margin: 0, maxWidth: 380, color: "#737373", lineHeight: 1.6 }}>
          The whole application failed to render. Reloading is the fastest fix.
        </p>
        {error.digest && (
          <p style={{ margin: 0, fontSize: 12, color: "#a3a3a3" }}>
            Reference {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            border: "none",
            borderRadius: 999,
            background: "#111111",
            color: "#ffffff",
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
