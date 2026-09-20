"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Dropzone, type Upload } from "@/components/new/Dropzone";
import { Button } from "@/components/ui/Button";
import {
  CATEGORIES,
  CREDITS,
  FIVE_SECOND_PROMPTS,
  LIMITS,
  SUGGESTED_QUESTIONS,
  TEST_MODES,
  type CategoryId,
  type TestMode,
} from "@/lib/config";
import { createTestAction } from "@/app/actions/test";
import type { Visibility } from "@/lib/types";

type VariantDraft = {
  label: string;
  title: string;
  upload: Upload | null;
  copyValue: string;
};

const STEPS = [
  "What are you testing?",
  "Add your versions",
  "What do you want to know?",
  "Mode",
  "How many humans",
  "Preview",
] as const;

const emptyVariants: VariantDraft[] = [
  { label: "A", title: "", upload: null, copyValue: "" },
  { label: "B", title: "", upload: null, copyValue: "" },
];

export function CreateWizard({
  credits,
  signedIn,
  demoMode,
}: {
  credits: number;
  signedIn: boolean;
  demoMode: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<CategoryId>("landing");
  const [kind, setKind] = useState<"image" | "copy">("image");
  const [variants, setVariants] = useState<VariantDraft[]>(emptyVariants);
  const [focused, setFocused] = useState(0);
  const [question, setQuestion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<TestMode>("compare");
  const [fivePrompt, setFivePrompt] = useState<string>(FIVE_SECOND_PROMPTS[0]);
  // Open on the largest preset this account can actually afford, so the first
  // thing a new user sees isn't a negative balance.
  const [targetVotes, setTargetVotes] = useState<number>(() => {
    const affordablePresets = CREDITS.RESPONSE_PRESETS.filter(
      (n) => n * CREDITS.COST_PER_RESPONSE <= credits,
    );
    return affordablePresets.at(-1) ?? CREDITS.MIN_RESPONSES;
  });
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cost = targetVotes * CREDITS.COST_PER_RESPONSE;
  const affordable = credits >= cost;

  const activeVariants = mode === "five_second" ? variants.slice(0, 1) : variants;

  const variantsReady = activeVariants.every((v) =>
    kind === "copy" ? v.copyValue.trim().length > 0 : Boolean(v.upload),
  );

  const stepValid = [
    true,
    variantsReady,
    question.trim().length >= 4 && title.trim().length >= 2,
    true,
    targetVotes >= CREDITS.MIN_RESPONSES && targetVotes <= CREDITS.MAX_RESPONSES,
    affordable,
  ];

  const suggestions = useMemo(
    () => SUGGESTED_QUESTIONS[category] ?? SUGGESTED_QUESTIONS.other,
    [category],
  );

  const setVariant = (index: number, patch: Partial<VariantDraft>) =>
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );

  const launch = () => {
    setError(null);
    startTransition(async () => {
      const result = await createTestAction({
        title: title.trim(),
        question: question.trim(),
        description: description.trim() || null,
        category,
        mode,
        visibility,
        targetVotes,
        fiveSecondPrompt: mode === "five_second" ? fivePrompt : null,
        variants: activeVariants.map((v) => ({
          label: v.label,
          title: v.title.trim() || null,
          imageUrl: kind === "image" ? (v.upload?.url ?? null) : null,
          copyValue: kind === "copy" ? v.copyValue.trim() : null,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/results/${result.slug}?launched=1`);
    });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_268px] lg:gap-14">
      <div>
        {/* Stepper */}
        <ol className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line pb-4">
          {STEPS.map((label, i) => (
            <li key={label} className="shrink-0">
              <button
                type="button"
                onClick={() => i <= step && setStep(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] transition-colors ${
                  i === step
                    ? "bg-ink text-paper"
                    : i < step
                      ? "text-muted hover:bg-sand-deep"
                      : "text-faint"
                }`}
              >
                <span className="font-mono text-[10px] tabular-nums opacity-70">
                  {i + 1}
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-10 min-h-[420px]">
          {/* ---- 1. Category -------------------------------------------- */}
          {step === 0 && (
            <Section
              title="What are you testing?"
              hint="This only picks better suggested questions. You can change it later."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={category === c.id}
                    className={`rounded-xl border px-4 py-3.5 text-left transition-colors ${
                      category === c.id
                        ? "border-ink bg-sand"
                        : "border-line hover:border-faint hover:bg-sand"
                    }`}
                  >
                    <span className="text-[14px] font-medium">{c.label}</span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      {c.hint}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* ---- 2. Versions -------------------------------------------- */}
          {step === 1 && (
            <Section
              title="Add your versions"
              hint={
                kind === "image"
                  ? "Drag two images in, or paste a screenshot straight from your clipboard."
                  : "Two lines of copy. Boop typesets them properly — how it reads at size is part of the test."
              }
            >
              <div className="mb-6 inline-flex rounded-full border border-line p-1">
                {(["image", "copy"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
                      kind === k ? "bg-ink text-paper" : "text-muted hover:text-ink"
                    }`}
                  >
                    {k === "image" ? "Images" : "Copy"}
                  </button>
                ))}
              </div>

              {!signedIn && kind === "image" && (
                <p className="mb-5 rounded-lg border border-line bg-sand px-4 py-3 text-[13px] leading-relaxed text-muted">
                  You&rsquo;ll need to{" "}
                  <Link href="/sign-in?next=/new" className="text-ink underline underline-offset-2">
                    sign in
                  </Link>{" "}
                  before uploading — images are stored against your account.
                </p>
              )}

              <div
                className={`grid gap-4 ${mode === "five_second" ? "" : "sm:grid-cols-2"}`}
              >
                {activeVariants.map((variant, i) => (
                  <div
                    key={variant.label}
                    onFocusCapture={() => setFocused(i)}
                    onMouseEnter={() => setFocused(i)}
                  >
                    {kind === "image" ? (
                      <Dropzone
                        label={variant.label}
                        value={variant.upload}
                        active={focused === i}
                        onChange={(upload) => setVariant(i, { upload })}
                        onError={setUploadError}
                      />
                    ) : (
                      <div className="rounded-xl border border-line bg-paper p-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sand-deep text-[11px] font-semibold">
                            {variant.label}
                          </span>
                          <span className="text-[12px] text-muted">
                            Version {variant.label}
                          </span>
                        </div>
                        <label className="sr-only" htmlFor={`copy-${variant.label}`}>
                          Copy for version {variant.label}
                        </label>
                        <textarea
                          id={`copy-${variant.label}`}
                          rows={3}
                          value={variant.copyValue}
                          onChange={(e) =>
                            setVariant(i, {
                              copyValue: e.target.value.slice(
                                0,
                                LIMITS.COPY_VARIANT_MAX,
                              ),
                            })
                          }
                          placeholder={
                            i === 0 ? "Start free — no card" : "See it work on your data"
                          }
                          className="mt-3 w-full resize-none rounded-lg border border-line bg-sand px-3.5 py-3 text-[16px] leading-snug outline-none transition-colors placeholder:text-faint focus:border-ink focus:bg-paper"
                        />
                        <p className="mt-2 text-right text-[11px] tabular-nums text-faint">
                          {variant.copyValue.length}/{LIMITS.COPY_VARIANT_MAX}
                        </p>
                      </div>
                    )}

                    <label className="sr-only" htmlFor={`title-${variant.label}`}>
                      Label for version {variant.label}
                    </label>
                    <input
                      id={`title-${variant.label}`}
                      value={variant.title}
                      onChange={(e) =>
                        setVariant(i, { title: e.target.value.slice(0, 90) })
                      }
                      placeholder={`Name version ${variant.label} (optional)`}
                      className="mt-2 h-9 w-full rounded-lg border border-line bg-paper px-3 text-[13px] outline-none transition-colors placeholder:text-faint focus:border-ink"
                    />
                  </div>
                ))}
              </div>

              {uploadError && (
                <p className="mt-4 rounded-lg border border-line bg-sand px-3.5 py-2.5 text-[13px]">
                  {uploadError}
                </p>
              )}
            </Section>
          )}

          {/* ---- 3. Question -------------------------------------------- */}
          {step === 2 && (
            <Section
              title="What do you want to know?"
              hint="This is the only part that needs real thought. Ask about a decision, not an opinion."
            >
              <label className="sr-only" htmlFor="question">
                Your question
              </label>
              <input
                id="question"
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value.slice(0, LIMITS.QUESTION_MAX))
                }
                placeholder="Which one would you trust enough to buy?"
                className="h-14 w-full rounded-xl border border-line bg-paper px-4 text-[18px] tracking-[-0.015em] outline-none transition-colors placeholder:text-faint focus:border-ink"
              />
              <p className="mt-2 text-right text-[11px] tabular-nums text-faint">
                {question.length}/{LIMITS.QUESTION_MAX}
              </p>

              <p className="mt-6 eyebrow">Or take one of these</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setQuestion(s);
                      if (!title.trim()) setTitle(s.replace(/\?$/, ""));
                    }}
                    className="rounded-full border border-line px-3.5 py-1.5 text-[13px] transition-colors hover:border-ink hover:bg-sand"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-8 space-y-4 border-t border-line pt-6">
                <Field
                  id="title"
                  label="Name this test"
                  hint="Only you and the results page see this."
                >
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, LIMITS.TITLE_MAX))}
                    placeholder="Homepage hero, round two"
                    className="h-11 w-full rounded-lg border border-line bg-paper px-3.5 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-ink"
                  />
                </Field>

                <Field
                  id="description"
                  label="Context for voters"
                  hint="Optional. One line about what's different between the two."
                >
                  <textarea
                    id="description"
                    rows={2}
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value.slice(0, LIMITS.DESCRIPTION_MAX))
                    }
                    placeholder="Same copy, different layout. B shows the product."
                    className="w-full resize-none rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[14px] leading-relaxed outline-none transition-colors placeholder:text-faint focus:border-ink"
                  />
                </Field>
              </div>
            </Section>
          )}

          {/* ---- 4. Mode ------------------------------------------------- */}
          {step === 3 && (
            <Section title="How should people see it?" hint="Two ways to ask.">
              <div className="grid gap-3 sm:grid-cols-2">
                {TEST_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    aria-pressed={mode === m.id}
                    className={`rounded-xl border p-5 text-left transition-colors ${
                      mode === m.id
                        ? "border-ink bg-sand"
                        : "border-line hover:border-faint hover:bg-sand"
                    }`}
                  >
                    <span className="text-[16px] font-medium tracking-[-0.015em]">
                      {m.label}
                    </span>
                    <span className="mt-1.5 block text-[13px] leading-relaxed text-muted">
                      {m.summary}
                    </span>
                  </button>
                ))}
              </div>

              {mode === "five_second" && (
                <div className="mt-6 rounded-xl border border-line bg-sand p-5">
                  <p className="eyebrow">Ask them afterwards</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {FIVE_SECOND_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFivePrompt(p)}
                        aria-pressed={fivePrompt === p}
                        className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                          fivePrompt === p
                            ? "border-ink bg-ink text-paper"
                            : "border-line bg-paper hover:border-faint"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-[12px] leading-relaxed text-faint">
                    A 5 Second Test shows one design — only version A is used.
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-line pt-6">
                <p className="eyebrow">Who can see it</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["public", "Public", "In the feed. Fastest responses."],
                      ["unlisted", "Unlisted", "Link only. Not in the feed."],
                      ["private", "Private", "Only you. Bring your own audience."],
                    ] as const
                  ).map(([id, label, hint]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setVisibility(id)}
                      aria-pressed={visibility === id}
                      className={`rounded-lg border px-3.5 py-3 text-left transition-colors ${
                        visibility === id
                          ? "border-ink bg-sand"
                          : "border-line hover:border-faint"
                      }`}
                    >
                      <span className="text-[13px] font-medium">{label}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                        {hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* ---- 5. Responses ------------------------------------------- */}
          {step === 4 && (
            <Section
              title="How many humans?"
              hint={`One credit buys one response. You have ${credits.toLocaleString()}.`}
            >
              <div className="flex flex-wrap gap-2">
                {CREDITS.RESPONSE_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTargetVotes(n)}
                    aria-pressed={targetVotes === n}
                    className={`min-w-[84px] rounded-xl border px-4 py-3 text-center transition-colors ${
                      targetVotes === n
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-faint hover:bg-sand"
                    }`}
                  >
                    <span className="block text-[20px] font-medium tabular-nums">{n}</span>
                    <span
                      className={`mt-0.5 block text-[11px] ${targetVotes === n ? "text-[#b5b5b3]" : "text-faint"}`}
                    >
                      {n} credits
                    </span>
                  </button>
                ))}

                <div
                  className={`flex min-w-[130px] flex-col rounded-xl border px-4 py-2.5 transition-colors ${
                    !CREDITS.RESPONSE_PRESETS.includes(
                      targetVotes as (typeof CREDITS.RESPONSE_PRESETS)[number],
                    )
                      ? "border-ink"
                      : "border-line"
                  }`}
                >
                  <label htmlFor="custom-target" className="text-[11px] text-faint">
                    Custom
                  </label>
                  <input
                    id="custom-target"
                    type="number"
                    min={CREDITS.MIN_RESPONSES}
                    max={CREDITS.MAX_RESPONSES}
                    value={targetVotes}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      if (Number.isFinite(raw)) setTargetVotes(Math.floor(raw));
                    }}
                    onBlur={() =>
                      setTargetVotes((v) =>
                        Math.min(
                          CREDITS.MAX_RESPONSES,
                          Math.max(CREDITS.MIN_RESPONSES, v || CREDITS.MIN_RESPONSES),
                        ),
                      )
                    }
                    className="w-full bg-transparent text-[20px] font-medium tabular-nums outline-none"
                  />
                </div>
              </div>

              <div
                className={`mt-6 rounded-xl border px-5 py-4 ${
                  affordable ? "border-line bg-sand" : "border-[#f0d6d4] bg-[#fdf5f4]"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="text-[14px]">Cost</span>
                  <span className="text-[24px] font-medium tabular-nums">
                    {cost.toLocaleString()} credits
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3 text-[13px] text-muted">
                  <span>Balance after launch</span>
                  <span className="tabular-nums">
                    {(credits - cost).toLocaleString()}
                  </span>
                </div>
                {!affordable && (
                  <p className="mt-3 border-t border-[#f0d6d4] pt-3 text-[13px] leading-relaxed">
                    You&rsquo;re {(cost - credits).toLocaleString()} short.{" "}
                    <Link href="/feed" className="text-ink underline underline-offset-2">
                      Boop a few tests
                    </Link>{" "}
                    to earn credits, or{" "}
                    <Link href="/pricing" className="text-ink underline underline-offset-2">
                      top up
                    </Link>
                    .
                  </p>
                )}
              </div>
            </Section>
          )}

          {/* ---- 6. Preview --------------------------------------------- */}
          {step === 5 && (
            <Section
              title="This is what people will see."
              hint="Last look before it goes into the feed."
            >
              <div className="overflow-hidden rounded-xl border border-line bg-paper">
                <div className="border-b border-line bg-sand px-4 py-3">
                  <p className="text-[15px] font-medium tracking-[-0.015em]">
                    {question || "Your question goes here"}
                  </p>
                  {description && (
                    <p className="mt-1 text-[13px] text-muted">{description}</p>
                  )}
                </div>
                <div
                  className={`grid gap-3 p-3 ${mode === "five_second" ? "" : "sm:grid-cols-2"}`}
                >
                  {activeVariants.map((v) => (
                    <div
                      key={v.label}
                      className="overflow-hidden rounded-lg border border-line"
                    >
                      <div className="flex items-center gap-2 border-b border-line px-2.5 py-1.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sand-deep text-[10px] font-semibold">
                          {v.label}
                        </span>
                        <span className="truncate text-[12px] text-muted">
                          {v.title || `Version ${v.label}`}
                        </span>
                      </div>
                      {kind === "image" && v.upload ? (
                        // eslint-disable-next-line @next/next/no-img-element -- preview of a just-uploaded blob
                        <img
                          src={v.upload.url}
                          alt={`Preview of version ${v.label}`}
                          className="block max-h-[220px] w-full bg-sand object-contain"
                        />
                      ) : (
                        <div className="flex min-h-[120px] items-center justify-center bg-sand px-5 py-8">
                          <p className="user-text text-center text-[18px] font-medium leading-snug">
                            {v.copyValue || "—"}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
                {[
                  ["Mode", mode === "compare" ? "Compare" : "5 Second Test"],
                  ["Responses", String(targetVotes)],
                  ["Cost", `${cost} credits`],
                  [
                    "Visibility",
                    visibility.charAt(0).toUpperCase() + visibility.slice(1),
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="bg-paper px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">
                      {k}
                    </dt>
                    <dd className="mt-1 text-[14px] tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>

              {error && (
                <p className="mt-5 rounded-lg border border-[#f0d6d4] bg-[#fdf5f4] px-4 py-3 text-[13px] leading-relaxed">
                  {error}
                </p>
              )}

              {demoMode && (
                <p className="mt-5 rounded-lg border border-dashed border-line bg-sand px-4 py-3 text-[13px] leading-relaxed text-muted">
                  Demo Mode: this test will work exactly as it would in
                  production, but it lives in memory and disappears when the
                  server restarts.
                </p>
              )}
            </Section>
          )}
        </div>

        {/* Navigation */}
        <div className="sticky bottom-0 -mx-5 mt-8 flex items-center justify-between gap-3 border-t border-line bg-paper/90 px-5 py-4 backdrop-blur-sm sm:-mx-8 sm:px-8">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || pending}
          >
            Back
          </Button>

          <span className="text-[12px] tabular-nums text-faint">
            Step {step + 1} of {STEPS.length}
          </span>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!stepValid[step] || pending}
            >
              Continue
            </Button>
          ) : (
            <Button onClick={launch} disabled={!affordable || pending || !signedIn}>
              {pending ? "Launching…" : `Launch · ${cost} credits`}
            </Button>
          )}
        </div>
      </div>

      {/* Rail */}
      <aside className="lg:pt-4">
        <div className="rounded-xl border border-line bg-sand p-5 lg:sticky lg:top-24">
          <p className="eyebrow">Your credits</p>
          <p className="mt-2 text-[32px] font-medium tabular-nums leading-none tracking-[-0.03em]">
            {credits.toLocaleString()}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Earn {CREDITS.EARN_AMOUNT} for every {CREDITS.VOTES_PER_EARN} boops
            you give in the feed.
          </p>

          <div className="mt-5 space-y-2 border-t border-line pt-4 text-[13px]">
            <Row k="This test" v={`${cost} credits`} />
            <Row k="After launch" v={(credits - cost).toLocaleString()} />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Link
              href="/feed"
              className="inline-flex h-9 items-center justify-center rounded-full border border-line bg-paper text-[13px] transition-colors hover:bg-sand-deep"
            >
              Earn credits
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-9 items-center justify-center rounded-full text-[13px] text-muted transition-colors hover:text-ink"
            >
              Buy a pack
            </Link>
          </div>
        </div>

        <p className="mt-4 px-1 text-[12px] leading-relaxed text-faint">
          Tests go live the moment you launch. You can close one early from your
          dashboard — unspent credits stay on the test.
        </p>
      </aside>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-rise">
      <h2 className="text-[24px] font-medium tracking-[-0.03em] sm:text-[30px]">
        {title}
      </h2>
      <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-muted">{hint}</p>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-[12px] text-faint">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}
