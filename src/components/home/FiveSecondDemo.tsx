"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FIVE_SECOND_DURATION_MS } from "@/lib/config";

type Phase = "idle" | "showing" | "asking";

const RECALL = [
  "Same-day settlement. That was the whole headline.",
  "Money app. There was a big number — eighteen thousand something.",
  "Payouts for businesses. I remember a green-ish 'Settled' tag.",
  "Honestly? A dashboard. Couldn't tell you what it settles.",
];

/**
 * Homepage demonstration of the 5 Second Test. Runs entirely locally — the
 * recall answers shown afterwards are illustrative examples, labelled as such.
 */
export function FiveSecondDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    if (phase !== "showing") return;
    const start = performance.now();

    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / FIVE_SECOND_DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        setPhase("asking");
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [phase]);

  const seconds = Math.ceil((1 - progress) * 5) || 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line bg-sand px-4 py-3">
        <span className="eyebrow">5 Second Test</span>
        <span className="font-mono text-[12px] tabular-nums text-muted">
          {phase === "showing" ? `${seconds}s` : "5s"}
        </span>
      </div>

      <div className="relative min-h-[240px] sm:min-h-[320px]">
        {phase === "idle" && (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[320px]">
            <div className="dotfield h-16 w-16 rounded-full border border-line" />
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-muted">
              You get five seconds with the design. Then it goes away and we ask
              what stuck.
            </p>
            <Button className="mt-5" onClick={() => setPhase("showing")}>
              Run it on me
            </Button>
          </div>
        )}

        {phase === "showing" && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- first-party static SVG demo art */}
            <img
              src="/generated/hero-b.svg"
              alt="Sample landing page shown for five seconds"
              className="block h-auto w-full"
            />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-line-soft">
              <div className="h-full bg-ink" style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        )}

        {phase === "asking" && (
          <div className="animate-rise px-5 py-8 sm:px-8 sm:py-10">
            <p className="eyebrow">Time&rsquo;s up</p>
            <h3 className="mt-3 text-[28px] font-medium leading-tight tracking-[-0.035em] sm:text-[36px]">
              What does this product do?
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Twelve people answered that in a real test. Four of them are below.
              You can feel the gap between what you designed and what landed.
            </p>

            <ul className="mt-5 space-y-2">
              {RECALL.map((line) => (
                <li
                  key={line}
                  className="rounded-lg border border-line bg-sand px-3.5 py-2.5 text-[13px] leading-relaxed text-ink"
                >
                  &ldquo;{line}&rdquo;
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setProgress(0);
                  setPhase("idle");
                }}
              >
                Again
              </Button>
              <span className="text-[11px] text-faint">
                Example answers from a fictional test.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
