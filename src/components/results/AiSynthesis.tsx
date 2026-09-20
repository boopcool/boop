import { summarizeFeedback } from "@/lib/ai/summarize";
import { isOpenAIConfigured } from "@/lib/config";
import type { TestResults } from "@/lib/types";

/**
 * Streams in via Suspense on the results page, because a model call should
 * never hold up the numbers — which are the part that matters.
 */
export async function AiSynthesis({ results }: { results: TestResults }) {
  const summary = await summarizeFeedback(results);
  const fromModel = summary.source === "model";

  return (
    <section className="rounded-xl border border-line bg-paper p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="eyebrow">
          {fromModel ? "AI summary of human feedback" : "Summary"}
        </h2>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-faint">
          {fromModel ? "Model-written" : "Computed"}
        </span>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed">{summary.summary}</p>

      {summary.themes.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.12em] text-faint">
            Themes
          </p>
          <ul className="mt-3 space-y-3">
            {summary.themes.map((theme) => (
              <li
                key={theme.label}
                className="flex gap-3 rounded-lg border border-line bg-sand px-3.5 py-3"
              >
                <span className="mt-[3px] flex h-5 min-w-5 items-center justify-center rounded-full bg-paper px-1.5 text-[11px] tabular-nums text-muted">
                  {theme.mentions}
                </span>
                <div>
                  <p className="text-[13px] font-medium">{theme.label}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
                    {theme.note}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="mt-6 space-y-4">
        {[
          ["Strongest signal", summary.strongestSignal],
          ["Biggest concern", summary.biggestConcern],
          ["Next action", summary.nextAction],
        ].map(([head, body]) => (
          <div key={head}>
            <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">
              {head}
            </dt>
            <dd className="mt-1 text-[13px] leading-relaxed text-muted">{body}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 border-t border-line pt-4 text-[12px] leading-relaxed text-faint">
        {fromModel
          ? "Written by a language model from the votes, tags and comments on this page. It organises human feedback — it never casts a vote, writes one, or changes a count."
          : isOpenAIConfigured()
            ? "Built from the counts alone. There isn't enough written feedback yet for a model to add anything."
            : "Built from the counts alone. Add an OPENAI_API_KEY to have written comments grouped into themes."}
      </p>
    </section>
  );
}

export function AiSynthesisSkeleton() {
  return (
    <section className="rounded-xl border border-line bg-paper p-5 sm:p-7">
      <div className="skeleton h-3 w-44 rounded-full" />
      <div className="mt-5 space-y-2">
        <div className="skeleton h-3.5 w-full rounded-full" />
        <div className="skeleton h-3.5 w-[92%] rounded-full" />
        <div className="skeleton h-3.5 w-[64%] rounded-full" />
      </div>
      <div className="mt-7 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-14 w-full rounded-lg" />
        ))}
      </div>
      <p className="mt-6 text-[12px] text-faint">Reading the comments…</p>
    </section>
  );
}
