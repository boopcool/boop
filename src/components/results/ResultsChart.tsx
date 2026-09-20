import { InfoTip } from "@/components/ui/Primitives";
import { CONFIDENCE_EXPLAINER } from "@/lib/stats";
import type { TestResults } from "@/lib/types";

/**
 * Hand-drawn SVG rather than a charting library: two to four bars with a
 * confidence whisker is not worth 90kB of JavaScript, and drawing it directly
 * keeps the rendering on the server.
 *
 * The whisker is the point of the chart. A 67% bar with an interval that runs
 * from 56% to 76% reads very differently from one that runs from 44% to 84%,
 * and a plain bar hides that difference completely.
 */
export function ResultsChart({ results }: { results: TestResults }) {
  // Fixed 0–100 domain. Scaling to the leading variant would stretch a 67%
  // result to the full width of the track, which reads as a bigger win than it
  // is — and would push the confidence whisker past the end of the bar.
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="eyebrow">The split</span>
        <span className="flex items-center gap-1.5 text-[11px] text-faint">
          95% interval
          <InfoTip label="What the interval means">
            {CONFIDENCE_EXPLAINER}
          </InfoTip>
        </span>
      </div>

      <ul className="mt-5 space-y-6">
        {results.variants.map((v) => (
            <li key={v.variant.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ${
                      v.isWinner ? "bg-ink text-paper" : "bg-sand-deep text-ink"
                    }`}
                  >
                    {v.variant.label}
                  </span>
                  <span className="text-[14px] text-muted">
                    {v.variant.title ?? `Version ${v.variant.label}`}
                  </span>
                  {v.isWinner && (
                    <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-paper">
                      Winner
                    </span>
                  )}
                </span>
                <span className="text-[15px] font-medium tabular-nums">
                  {v.share}%
                  <span className="ml-2 text-[12px] font-normal text-faint">
                    {v.votes} {v.votes === 1 ? "boop" : "boops"}
                  </span>
                </span>
              </div>

              {/* Bar, then the 95% interval drawn underneath it to the same scale */}
              <div className="relative mt-2.5 h-7">
                <div className="absolute inset-x-0 top-1 h-2.5 overflow-hidden rounded-full bg-line-soft">
                  <div
                    className={`h-full rounded-full ${v.isWinner ? "bg-ink" : "bg-faint"}`}
                    style={{ width: `${Math.max(v.share, v.votes > 0 ? 1.5 : 0)}%` }}
                  />
                </div>

                {results.totalVotes > 0 && (
                  <div
                    className="absolute top-[18px] flex h-2 items-center"
                    style={{
                      left: `${v.low * 100}%`,
                      width: `${Math.max((v.high - v.low) * 100, 1)}%`,
                    }}
                    aria-hidden="true"
                  >
                    <span className="h-2 w-px bg-faint" />
                    <span className="h-px flex-1 bg-faint" />
                    <span className="h-2 w-px bg-faint" />
                  </div>
                )}

                {/* The 50% mark — the line a winner has to clear. */}
                {results.variants.length === 2 && results.totalVotes > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-0 h-[18px] w-px bg-line"
                  />
                )}
              </div>

              {results.totalVotes > 0 && (
                <p className="mt-1 text-[11px] tabular-nums text-faint">
                  95% interval {Math.round(v.low * 100)}%–{Math.round(v.high * 100)}%
                </p>
              )}
            </li>
        ))}
      </ul>

      {/* 50% reference line, drawn only when it is meaningful. */}
      {results.variants.length === 2 && results.totalVotes > 0 && (
        <p className="mt-6 border-t border-line pt-4 text-[12px] leading-relaxed text-faint">
          {results.winnerId
            ? "The leader's whole interval sits above 50%, so the preference is consistent at this sample size."
            : "The leader's interval still crosses 50%, so this sample can't separate the two."}
        </p>
      )}
    </div>
  );
}
