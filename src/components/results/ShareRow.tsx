"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Share controls. The X intent is a plain link rather than an SDK — no third
 * party script runs on a Boop page.
 */
export function ShareRow({
  url,
  question,
  headline,
}: {
  url: string;
  question: string;
  headline: string;
}) {
  const [copied, setCopied] = useState(false);

  const postText = `${headline}\n\n"${question}"\n\n`;
  const intent = `https://x.com/intent/post?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            // Clipboard can be blocked; the input below is the fallback.
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy link"}
      </Button>

      <a
        href={intent}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 text-[13px] font-medium transition-colors hover:bg-sand-deep"
      >
        Post on X
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M4 2h6v6M10 2L2.5 9.5"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>

      <label className="sr-only" htmlFor="share-url">
        Share link
      </label>
      <input
        id="share-url"
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="h-8 min-w-0 flex-1 rounded-full border border-line bg-sand px-3.5 font-mono text-[12px] text-muted outline-none transition-colors focus:border-ink sm:max-w-xs"
      />
    </div>
  );
}
