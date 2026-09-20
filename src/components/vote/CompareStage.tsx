"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { VariantSurface } from "@/components/vote/VariantSurface";
import { Button } from "@/components/ui/Button";
import { LIMITS, REASONS } from "@/lib/config";
import { annotateVoteAction, voteAction } from "@/app/actions/vote";
import type { TestWithVariants } from "@/lib/types";
import type { ReasonId } from "@/lib/config";

type Phase = "idle" | "booping" | "result";

type Props = {
  test: TestWithVariants;
  /** Rendered as the "what next" control once the boop has landed. */
  onNext?: () => void;
  nextLabel?: string;
  /** Feed mode trims the chrome so the loop stays tight. */
  compact?: boolean;
  initiallyAnswered?: boolean;
};

export function CompareStage({
  test,
  onNext,
  nextLabel = "Next test",
  compact = false,
  initiallyAnswered = false,
}: Props) {
  const [phase, setPhase] = useState<Phase>(initiallyAnswered ? "result" : "idle");
  const [picked, setPicked] = useState<string | null>(null);
  const [shares, setShares] = useState<Record<string, number> | null>(null);
  const [total, setTotal] = useState(0);
  const [voteId, setVoteId] = useState<string | null>(null);
  const [reason, setReason] = useState<ReasonId | null>(null);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);
  const [earned, setEarned] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ripple, setRipple] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );

  const liveRef = useRef<HTMLParagraphElement>(null);
  const busy = useRef(false);

  const submit = useCallback(
    async (variantId: string, origin?: { x: number; y: number }) => {
      if (busy.current || phase !== "idle") return;
      busy.current = true;

      setPicked(variantId);
      setPhase("booping");
      setRipple({ id: variantId, x: origin?.x ?? 50, y: origin?.y ?? 50 });
      setError(null);

      // Fire the request immediately; the animation runs in parallel so the
      // interaction never waits on the network to feel responsive.
      const [result] = await Promise.all([
        voteAction({ slug: test.slug, variantId, reason: null, comment: null }),
        new Promise((r) => setTimeout(r, 220)),
      ]);

      busy.current = false;

      if (!result.ok) {
        setError(result.error);
        setPhase(result.code === "duplicate" ? "result" : "idle");
        if (result.code !== "duplicate") setPicked(null);
        return;
      }

      setShares(result.outcome.shares);
      setTotal(result.outcome.total);
      setVoteId(result.outcome.voteId);
      setEarned(result.outcome.creditsEarned);
      setPhase("result");
    },
    [phase, test.slug],
  );

  /* --- Keyboard shortcuts ------------------------------------------------ */

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (phase === "result" && event.code === "Space" && onNext) {
        event.preventDefault();
        onNext();
        return;
      }
      if (phase !== "idle") return;

      const key = event.key.toLowerCase();
      const index =
        key === "a" || event.key === "ArrowLeft"
          ? 0
          : key === "b" || event.key === "ArrowRight"
            ? 1
            : -1;

      const variant = index >= 0 ? test.variants[index] : undefined;
      if (variant) {
        event.preventDefault();
        void submit(variant.id);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, submit, test.variants, onNext]);

  const showResult = phase === "result" && shares !== null;

  return (
    <div>
      <div
        className={`grid gap-3 sm:gap-4 ${
          test.variants.length > 2 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"
        }`}
      >
        {test.variants.map((variant, index) => {
          const isPicked = picked === variant.id;
          const share = shares?.[variant.id] ?? 0;
          const leads =
            showResult &&
            shares !== null &&
            share === Math.max(...Object.values(shares)) &&
            Object.values(shares).filter((s) => s === share).length === 1;

          return (
            <div key={variant.id} className="flex flex-col">
              <button
                type="button"
                disabled={phase !== "idle"}
                aria-label={`Boop version ${variant.label}${variant.title ? `, ${variant.title}` : ""}`}
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  void submit(variant.id, {
                    x: ((event.clientX - rect.left) / rect.width) * 100,
                    y: ((event.clientY - rect.top) / rect.height) * 100,
                  });
                }}
                className={[
                  "group relative block overflow-hidden rounded-xl border bg-paper text-left transition-[border-color,box-shadow,transform] duration-200",
                  phase === "idle"
                    ? "cursor-pointer border-line hover:border-ink hover:shadow-[0_10px_34px_-20px_rgba(0,0,0,0.5)] focus-visible:border-ink"
                    : "cursor-default",
                  isPicked && phase === "booping" ? "animate-boop-press" : "",
                  showResult && isPicked ? "border-ink" : "",
                  showResult && !isPicked ? "border-line opacity-[0.72]" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between border-b border-line px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                        isPicked ? "bg-ink text-paper" : "bg-sand-deep text-ink"
                      }`}
                    >
                      {variant.label}
                    </span>
                    {variant.title && (
                      <span className="truncate text-[13px] text-muted">
                        {variant.title}
                      </span>
                    )}
                  </span>
                  {showResult && isPicked && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-ink">
                      <CheckIcon />
                      Your pick
                    </span>
                  )}
                </div>

                <VariantSurface
                  variant={variant}
                  question={test.question}
                  priority={index === 0 && !compact}
                />

                {phase === "idle" && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/90 px-3 py-1.5 text-[12px] font-medium text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    Boop {variant.label}
                  </span>
                )}

                {ripple?.id === variant.id && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute z-10 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink animate-boop-ripple"
                    style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }}
                  />
                )}
              </button>

              {showResult && (
                <div className="animate-rise mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`text-[26px] font-medium tabular-nums tracking-[-0.03em] ${
                        leads ? "text-ink" : "text-muted"
                      }`}
                    >
                      {share}%
                    </span>
                    <span className="text-[12px] tabular-nums text-faint">
                      {variant.label}
                    </span>
                  </div>
                  <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-line-soft">
                    <div
                      className={`animate-bar-grow h-full rounded-full ${leads ? "bg-ink" : "bg-faint"}`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- Status line ---------------------------------------------------- */}

      <p ref={liveRef} aria-live="polite" className="sr-only">
        {showResult
          ? `Recorded. ${test.variants
              .map((v) => `${v.label} ${shares?.[v.id] ?? 0} percent`)
              .join(", ")}. ${total} total boops.`
          : ""}
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-line bg-sand px-3.5 py-2.5 text-[13px] text-ink">
          {error}
        </p>
      )}

      {phase === "idle" && (
        <p className="mt-4 hidden items-center gap-3 text-[12px] text-faint sm:flex">
          <Key>A</Key>
          <span>or</span>
          <Key>←</Key>
          <span className="mr-2">picks {test.variants[0]?.label}</span>
          <Key>B</Key>
          <span>or</span>
          <Key>→</Key>
          <span>picks {test.variants[1]?.label}</span>
        </p>
      )}

      {/* --- Why? ----------------------------------------------------------- */}

      {showResult && voteId && !saved && (
        <div className="animate-rise mt-6 rounded-xl border border-line bg-sand p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-medium">Why?</h3>
            <span className="text-[12px] text-faint">Optional — one tap</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={reason === r.id}
                onClick={() => setReason(reason === r.id ? null : (r.id as ReasonId))}
                className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                  reason === r.id
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper text-ink hover:border-faint hover:bg-sand-deep"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label htmlFor={`comment-${test.id}`} className="sr-only">
              Anything else? Optional written feedback
            </label>
            <textarea
              id={`comment-${test.id}`}
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, LIMITS.COMMENT_MAX))}
              rows={2}
              placeholder="Anything else? One sentence is plenty."
              className="w-full resize-none rounded-lg border border-line bg-paper px-3 py-2.5 text-[14px] leading-relaxed outline-none transition-colors placeholder:text-faint focus:border-ink"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] tabular-nums text-faint">
                {comment.length}/{LIMITS.COMMENT_MAX}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSaved(true)}
                  type="button"
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  type="button"
                  disabled={!reason && comment.trim().length === 0}
                  onClick={async () => {
                    const res = await annotateVoteAction({
                      slug: test.slug,
                      voteId,
                      reason,
                      comment: comment.trim() || null,
                    });
                    if (res.ok) setEarned((e) => e + res.creditsEarned);
                    setSaved(true);
                  }}
                >
                  Send it
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- What next ------------------------------------------------------ */}

      {showResult && (saved || !voteId) && (
        <div className="animate-rise mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-muted">
            {total} {total === 1 ? "boop" : "boops"} so far
            {earned > 0 && (
              <>
                {" · "}
                <span className="text-ink">
                  +{earned} credit{earned === 1 ? "" : "s"} earned
                </span>
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Link
              href={`/results/${test.slug}`}
              className="inline-flex h-9 items-center rounded-full border border-line px-4 text-[13px] transition-colors hover:bg-sand-deep"
            >
              Full results
            </Link>
            {onNext && (
              <Button size="sm" onClick={onNext} type="button">
                {nextLabel}
                <span className="ml-1 hidden text-[11px] opacity-60 sm:inline">
                  Space
                </span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-paper px-1.5 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2 6.5l2.5 2.5L10 3"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
