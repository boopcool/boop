"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { REASONS } from "@/lib/config";

/**
 * The homepage's interactive demonstration.
 *
 * Deliberately self-contained: it writes nothing, records nothing and is
 * labelled as a sample, because the percentages it reveals are illustrative
 * rather than a live tally. Its only job is to let a first-time visitor feel
 * the boop before they decide whether to sign up.
 */

const OPTIONS = [
  {
    id: "a",
    label: "A",
    title: "Centered",
    src: "/generated/hero-a.svg",
    share: 33,
  },
  {
    id: "b",
    label: "B",
    title: "Split, with the product",
    src: "/generated/hero-b.svg",
    share: 67,
  },
] as const;

const SAMPLE_REASONS = [
  { label: "Easier to understand", count: 31 },
  { label: "More trustworthy", count: 18 },
  { label: "I'd click this", count: 12 },
];

export function HeroDemo() {
  const [picked, setPicked] = useState<string | null>(null);
  const [pressing, setPressing] = useState<string | null>(null);
  const [ripple, setRipple] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );
  const [revealed, setRevealed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const pick = (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (picked) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setRipple({
      id,
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
    setPicked(id);
    setPressing(id);
    timers.current.push(setTimeout(() => setPressing(null), 240));
    timers.current.push(setTimeout(() => setRevealed(true), 260));
  };

  const reset = () => {
    setPicked(null);
    setRevealed(false);
    setRipple(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_28px_80px_-48px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-sand px-4 py-3 sm:px-6">
        <div>
          <p className="eyebrow">Which one would you ship?</p>
          <p className="mt-1 text-[15px] font-medium tracking-[-0.015em] sm:text-[17px]">
            &ldquo;Which homepage would make you try the product?&rdquo;
          </p>
        </div>
        <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
          Sample
        </span>
      </div>

      {/* Stage */}
      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-5">
        {OPTIONS.map((option) => {
          const isPicked = picked === option.id;
          const leads = revealed && option.share > 50;

          return (
            <div key={option.id} className="flex flex-col">
              <button
                type="button"
                disabled={Boolean(picked)}
                onClick={(e) => pick(option.id, e)}
                aria-label={`Boop version ${option.label}, ${option.title}`}
                className={[
                  "group relative block overflow-hidden rounded-xl border bg-paper text-left transition-[border-color,box-shadow,opacity] duration-200",
                  picked
                    ? isPicked
                      ? "border-ink"
                      : "border-line opacity-70"
                    : "cursor-pointer border-line hover:border-ink hover:shadow-[0_12px_36px_-24px_rgba(0,0,0,0.6)]",
                  pressing === option.id ? "animate-boop-press" : "",
                ].join(" ")}
              >
                <span className="flex items-center justify-between border-b border-line px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                        isPicked ? "bg-ink text-paper" : "bg-sand-deep text-ink"
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="text-[13px] text-muted">{option.title}</span>
                  </span>
                  {isPicked && (
                    <span className="text-[11px] font-medium">Your pick</span>
                  )}
                </span>

                {/* eslint-disable-next-line @next/next/no-img-element -- first-party static SVG demo art */}
                <img
                  src={option.src}
                  alt={`Sample homepage layout ${option.label}: ${option.title}`}
                  width={1280}
                  height={800}
                  loading="eager"
                  decoding="async"
                  className="block h-auto w-full"
                />

                {!picked && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/90 px-3 py-1.5 text-[12px] font-medium text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    Boop {option.label}
                  </span>
                )}

                {ripple?.id === option.id && (
                  <span
                    aria-hidden="true"
                    className="animate-boop-ripple pointer-events-none absolute z-10 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
                    style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }}
                  />
                )}
              </button>

              {revealed && (
                <div className="animate-rise mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`text-[28px] font-medium tabular-nums tracking-[-0.035em] ${
                        leads ? "text-ink" : "text-muted"
                      }`}
                    >
                      {option.share}%
                    </span>
                    {leads && (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-paper">
                        Winner
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-line-soft">
                    <div
                      className={`animate-bar-grow h-full rounded-full ${leads ? "bg-ink" : "bg-faint"}`}
                      style={{ width: `${option.share}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-line px-4 py-4 sm:px-6 sm:py-5">
        {!revealed ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-muted">
              Pick one. This is the whole interaction.
            </p>
            <p className="hidden items-center gap-2 text-[12px] text-faint sm:flex">
              Voters can also use
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line px-1.5 font-mono text-[10px]">
                A
              </kbd>
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line px-1.5 font-mono text-[10px]">
                B
              </kbd>
            </p>
          </div>
        ) : (
          <div className="animate-rise">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
              <span className="text-muted">
                <span className="font-medium text-ink tabular-nums">82</span> boops
              </span>
              <span className="text-muted">
                Margin <span className="font-medium text-ink tabular-nums">34 pts</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef6f1] px-2.5 py-1 text-[11px] font-medium text-positive">
                <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                High confidence
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {SAMPLE_REASONS.map((r) => (
                <span
                  key={r.label}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[12px]"
                >
                  {r.label}
                  <span className="tabular-nums text-faint">{r.count}</span>
                </span>
              ))}
              <span className="inline-flex items-center rounded-full border border-dashed border-line px-3 py-1.5 text-[12px] text-faint">
                +{REASONS.length - SAMPLE_REASONS.length} more reason tags
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={reset}>
                Try the other one
              </Button>
              <Link
                href="/feed"
                className="inline-flex h-8 items-center rounded-full bg-ink px-3.5 text-[13px] font-medium text-paper transition-colors hover:bg-[#2b2b2b]"
              >
                Boop real tests
              </Link>
              <p className="ml-auto text-[11px] text-faint">
                Illustrative numbers. Real tests show live counts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
