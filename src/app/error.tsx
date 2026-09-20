"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[boop] route error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[620px] flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-36">
      <p className="eyebrow">Something broke</p>
      <h1 className="display mt-4 text-[clamp(2rem,6vw,3rem)]">
        That didn&rsquo;t land.
      </h1>
      <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
        An error interrupted this page. It&rsquo;s been logged. Trying again
        usually works — if it doesn&rsquo;t, the feed definitely does.
      </p>

      {error.digest && (
        <p className="mt-4 font-mono text-[11px] text-faint">
          Reference {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/feed"
          className="inline-flex h-10 items-center rounded-full border border-line px-5 text-[14px] font-medium transition-colors hover:bg-sand-deep"
        >
          Open the feed
        </Link>
      </div>
    </div>
  );
}
