"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { VariantSurface } from "@/components/vote/VariantSurface";
import { Button } from "@/components/ui/Button";
import { FIVE_SECOND_DURATION_MS, LIMITS } from "@/lib/config";
import { fiveSecondAction } from "@/app/actions/vote";
import type { TestWithVariants } from "@/lib/types";

type Phase = "ready" | "showing" | "answering" | "done";

export function FiveSecondStage({
  test,
  onNext,
  nextLabel = "Next test",
  initiallyAnswered = false,
}: {
  test: TestWithVariants;
  onNext?: () => void;
  nextLabel?: string;
  initiallyAnswered?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(initiallyAnswered ? "done" : "ready");
  const [remaining, setRemaining] = useState(FIVE_SECOND_DURATION_MS);
  const [answer, setAnswer] = useState("");
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const variant = test.variants[0];
  const prompt = test.fiveSecondPrompt ?? test.question;

  /* --- The clock --------------------------------------------------------- */

  useEffect(() => {
    if (phase !== "showing") return;

    const startedAt = performance.now();
    let frame = 0;

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const left = Math.max(0, FIVE_SECOND_DURATION_MS - elapsed);
      setRemaining(left);
      if (left <= 0) {
        setPhase("answering");
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase === "answering") inputRef.current?.focus();
  }, [phase]);

  const submit = useCallback(async () => {
    if (pending || answer.trim().length === 0) return;
    setPending(true);
    setError(null);

    const result = await fiveSecondAction({ slug: test.slug, answer });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      if (result.code === "duplicate") setPhase("done");
      return;
    }
    setTotal(result.total);
    setPhase("done");
  }, [answer, pending, test.slug]);

  if (!variant) return null;

  const seconds = Math.ceil(remaining / 1000);
  const progress = 1 - remaining / FIVE_SECOND_DURATION_MS;

  return (
    <div>
      {/* --- Ready ---------------------------------------------------------- */}

      {phase === "ready" && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-sand px-6 py-16 text-center sm:py-24">
          <Countdown progress={0} label="5" />
          <h2 className="mt-6 text-[22px] font-medium tracking-[-0.03em] sm:text-[26px]">
            Five seconds. Then one question.
          </h2>
          <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
            You&rsquo;ll see one design. When it disappears, you&rsquo;ll be
            asked: <span className="text-ink">{prompt}</span>
          </p>
          <Button
            className="mt-6"
            size="lg"
            onClick={() => {
              setRemaining(FIVE_SECOND_DURATION_MS);
              setPhase("showing");
            }}
          >
            Show it
          </Button>
          <p className="mt-3 text-[12px] text-faint">No going back. That&rsquo;s the point.</p>
        </div>
      )}

      {/* --- Showing -------------------------------------------------------- */}

      {phase === "showing" && (
        <div className="relative overflow-hidden rounded-xl border border-ink bg-paper">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-[12px] uppercase tracking-[0.14em] text-faint">
              Look
            </span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-[13px] tabular-nums">{seconds}s</span>
              <Countdown progress={progress} size={18} stroke={2.5} />
            </span>
          </div>
          <VariantSurface variant={variant} question={test.question} priority />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[3px] bg-line-soft"
          >
            <div
              className="h-full bg-ink transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* --- Answering ------------------------------------------------------ */}

      {phase === "answering" && (
        <div className="animate-rise rounded-xl border border-line bg-paper p-5 sm:p-8">
          <p className="eyebrow">Time&rsquo;s up</p>
          <h2 className="mt-3 text-[26px] font-medium leading-tight tracking-[-0.035em] sm:text-[34px]">
            {prompt}
          </h2>
          <p className="mt-2 text-[14px] text-muted">
            First instinct. Don&rsquo;t overthink it — that&rsquo;s the data.
          </p>

          <label htmlFor={`five-${test.id}`} className="sr-only">
            {prompt}
          </label>
          <textarea
            ref={inputRef}
            id={`five-${test.id}`}
            rows={3}
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value.slice(0, LIMITS.FIVE_SECOND_ANSWER_MAX))
            }
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void submit();
            }}
            placeholder="Whatever you remember…"
            className="mt-5 w-full resize-none rounded-lg border border-line bg-sand px-4 py-3 text-[16px] leading-relaxed outline-none transition-colors placeholder:text-faint focus:border-ink focus:bg-paper"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] tabular-nums text-faint">
              {answer.length}/{LIMITS.FIVE_SECOND_ANSWER_MAX}
            </span>
            <Button
              onClick={() => void submit()}
              disabled={pending || answer.trim().length === 0}
            >
              {pending ? "Sending…" : "Send answer"}
            </Button>
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-line bg-sand px-3.5 py-2.5 text-[13px]">
              {error}
            </p>
          )}
        </div>
      )}

      {/* --- Done ----------------------------------------------------------- */}

      {phase === "done" && (
        <div className="animate-rise rounded-xl border border-line bg-paper p-5 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M2 6.5l2.5 2.5L10 3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-[18px] font-medium tracking-[-0.02em]">
                Logged. Thanks.
              </h2>
              <p className="mt-1 text-[14px] leading-relaxed text-muted">
                Your answer goes into the recall summary for this test
                {total > 0 && <> — {total} {total === 1 ? "person has" : "people have"} answered so far</>}
                . You won&rsquo;t see the others&rsquo; answers here, so the next
                person&rsquo;s read stays clean.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={`/results/${test.slug}`}
              className="inline-flex h-9 items-center rounded-full border border-line px-4 text-[13px] transition-colors hover:bg-sand-deep"
            >
              See the summary
            </Link>
            {onNext && (
              <Button size="sm" onClick={onNext}>
                {nextLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Countdown({
  progress,
  label,
  size = 56,
  stroke = 3,
}: {
  progress: number;
  label?: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <span className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} aria-hidden="true" className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
        />
      </svg>
      {label && (
        <span className="absolute font-mono text-[15px] tabular-nums">{label}</span>
      )}
    </span>
  );
}
