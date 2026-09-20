/**
 * Single source of truth for every tunable product number and label.
 * Nothing in the UI hard-codes a price, a credit rule or a copy string that
 * a founder might reasonably want to change — it all lives here.
 */

export const SITE = {
  name: "Boop",
  wordmark: "boop.",
  domain: "boop.cool",
  tagline: "Know what people pick before you ship.",
  description:
    "Human taste tests for landing pages, logos, screenshots, copy and everything else you're about to ship.",
  pitch:
    "Human taste tests for builders — drop two versions, get real decisions, ship the winner.",
  twitter: "@boopcool",
} as const;

export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/* -------------------------------------------------------------------------- */
/* Credits                                                                     */
/* -------------------------------------------------------------------------- */

export const CREDITS = {
  /** Credits granted once, when a profile is first created. */
  STARTER_GRANT: 10,
  /** Completed boops required before a voter earns credits. */
  VOTES_PER_EARN: 3,
  /** Credits granted each time VOTES_PER_EARN valid boops are completed. */
  EARN_AMOUNT: 1,
  /** Cost, in credits, of one requested human response. */
  COST_PER_RESPONSE: 1,
  /** Bonus credits for leaving a substantive written comment. */
  COMMENT_BONUS: 1,
  /** Minimum characters for a comment to qualify for COMMENT_BONUS. */
  COMMENT_BONUS_MIN_CHARS: 24,
  /** Response-count presets offered in the create wizard. */
  RESPONSE_PRESETS: [10, 25, 50, 100] as const,
  MIN_RESPONSES: 5,
  MAX_RESPONSES: 2000,
  /** Free-plan ceiling on a single test's target responses. */
  FREE_MAX_RESPONSES: 25,
} as const;

/* -------------------------------------------------------------------------- */
/* Pricing                                                                     */
/* -------------------------------------------------------------------------- */

export type CreditPack = {
  id: "free" | "sprint" | "launch" | "studio";
  name: string;
  /** Price in the smallest currency unit (cents). */
  priceCents: number;
  credits: number;
  blurb: string;
  features: readonly string[];
  featured?: boolean;
};

export const CURRENCY = "usd" as const;

export const CREDIT_PACKS: readonly CreditPack[] = [
  {
    id: "free",
    name: "Free",
    priceCents: 0,
    credits: CREDITS.STARTER_GRANT,
    blurb: "Earn credits by helping others. One small test included.",
    features: [
      `${CREDITS.STARTER_GRANT} starter credits`,
      `Earn ${CREDITS.EARN_AMOUNT} credit per ${CREDITS.VOTES_PER_EARN} boops you give`,
      `Up to ${CREDITS.FREE_MAX_RESPONSES} responses per test`,
      "Compare and 5 Second Test",
      "Public results pages",
    ],
  },
  {
    id: "sprint",
    name: "Sprint",
    priceCents: 900,
    credits: 50,
    blurb: "One decision, settled today.",
    features: [
      "50 Boops",
      "Unlimited tests",
      "Reason tags and written feedback",
      "AI summary of human feedback",
      "Shareable result cards",
    ],
  },
  {
    id: "launch",
    name: "Launch",
    priceCents: 2900,
    credits: 250,
    blurb: "A whole launch worth of calls.",
    featured: true,
    features: [
      "250 Boops",
      "Everything in Sprint",
      "Private tests",
      "Priority placement in the feed",
      "CSV export",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    priceCents: 7900,
    credits: 1000,
    blurb: "For teams shipping every week.",
    features: [
      "1,000 Boops",
      "Everything in Launch",
      "Unlimited private tests",
      "Result page embeds",
      "Email support",
    ],
  },
] as const;

export function packById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "$0";
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/* -------------------------------------------------------------------------- */
/* Test taxonomy                                                               */
/* -------------------------------------------------------------------------- */

export const CATEGORIES = [
  { id: "design", label: "Design", hint: "A screen, a component, a layout" },
  { id: "landing", label: "Landing page", hint: "Hero, above the fold, full page" },
  { id: "logo", label: "Logo", hint: "Marks, wordmarks, app icons" },
  { id: "screenshot", label: "Screenshot", hint: "App store, listing, docs" },
  { id: "copy", label: "Copy", hint: "Names, taglines, CTA text" },
  { id: "pricing", label: "Pricing", hint: "Tables, packaging, tiers" },
  { id: "other", label: "Other", hint: "Ads, packaging, anything else" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as CategoryId[];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? "Other";
}

export const TEST_MODES = [
  {
    id: "compare",
    label: "Compare",
    summary: "Two versions, side by side. One boop picks a winner.",
  },
  {
    id: "five_second",
    label: "5 Second Test",
    summary: "Show it for five seconds, then ask what stuck.",
  },
] as const;

export type TestMode = (typeof TEST_MODES)[number]["id"];

/* -------------------------------------------------------------------------- */
/* Questions                                                                   */
/* -------------------------------------------------------------------------- */

export const SUGGESTED_QUESTIONS: Record<CategoryId, readonly string[]> = {
  design: [
    "Which one feels easier to use?",
    "Which one has better hierarchy?",
    "Which one would you trust with your data?",
  ],
  landing: [
    "Which homepage would make you try the product?",
    "Which landing page feels more premium?",
    "Which one explains the product faster?",
  ],
  logo: [
    "Which logo would you remember tomorrow?",
    "Which mark works better at small sizes?",
    "Which one looks like a company that's been around?",
  ],
  screenshot: [
    "Which screenshot makes you want to try the product?",
    "Which one would you stop scrolling for?",
    "Which one shows what the product does?",
  ],
  copy: [
    "Which line would make you click?",
    "Which name is easier to say out loud?",
    "Which one sounds less like marketing?",
  ],
  pricing: [
    "Which pricing page is easier to understand?",
    "Which one would you trust enough to buy?",
    "Which one makes the plans feel fairly priced?",
  ],
  other: [
    "Which one would you pick?",
    "Which one feels more considered?",
    "Which one would you trust enough to buy?",
  ],
};

export const FIVE_SECOND_PROMPTS = [
  "What do you remember?",
  "What does this product do?",
  "What caught your eye first?",
  "Would you trust this? Why?",
  "What would you click first?",
] as const;

export const FIVE_SECOND_DURATION_MS = 5000;

/* -------------------------------------------------------------------------- */
/* Reasons                                                                     */
/* -------------------------------------------------------------------------- */

export const REASONS = [
  { id: "cleaner", label: "Cleaner" },
  { id: "clearer", label: "Easier to understand" },
  { id: "trustworthy", label: "More trustworthy" },
  { id: "premium", label: "More premium" },
  { id: "memorable", label: "More memorable" },
  { id: "hierarchy", label: "Better hierarchy" },
  { id: "useful", label: "More useful" },
  { id: "clickable", label: "I'd click this" },
  { id: "other", label: "Other" },
] as const;

export type ReasonId = (typeof REASONS)[number]["id"];
export const REASON_IDS = REASONS.map((r) => r.id) as ReasonId[];

export function reasonLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return REASONS.find((r) => r.id === id)?.label ?? null;
}

/* -------------------------------------------------------------------------- */
/* Limits                                                                      */
/* -------------------------------------------------------------------------- */

export const LIMITS = {
  TITLE_MAX: 90,
  QUESTION_MAX: 140,
  DESCRIPTION_MAX: 280,
  COMMENT_MAX: 240,
  FIVE_SECOND_ANSWER_MAX: 280,
  VARIANT_LABEL_MAX: 40,
  COPY_VARIANT_MAX: 220,
  USERNAME_MAX: 24,
  DISPLAY_NAME_MAX: 48,
  BIO_MAX: 160,
  /** Boops an unauthenticated visitor may cast before being asked to sign in. */
  ANON_VOTE_ALLOWANCE: 12,
  MIN_VARIANTS: 2,
  MAX_VARIANTS: 4,
  UPLOAD_MAX_BYTES: 6 * 1024 * 1024,
  UPLOAD_MIME: ["image/png", "image/jpeg", "image/webp"] as const,
} as const;

/* -------------------------------------------------------------------------- */
/* Roadmap — explicitly-unreleased work. Never rendered as shipped.            */
/* -------------------------------------------------------------------------- */

export const ROADMAP = [
  {
    id: "filters",
    title: "Audience filters",
    status: "In design",
    body: "Ask only founders, only designers, or only people who have shipped something this year. Narrow the room before you ask the question.",
    signals: ["Role", "Seniority", "Ships software"],
  },
  {
    id: "panels",
    title: "Private panels",
    status: "Next",
    body: "Invite your own list — customers, beta testers, a Discord — and run the same test against people who actually use your product.",
    signals: ["Invite links", "No public feed", "Owned audience"],
  },
  {
    id: "workspaces",
    title: "Team workspaces",
    status: "Exploring",
    body: "Shared credit pools, shared history, and a record of every call your team made before shipping.",
    signals: ["Shared credits", "Roles", "Test history"],
  },
  {
    id: "api",
    title: "Developer API",
    status: "Exploring",
    body: "Open a test from CI, block a deploy on a taste test, or pipe results back into your own dashboard.",
    signals: ["REST", "Webhooks", "CI action"],
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Feature flags derived from environment                                      */
/* -------------------------------------------------------------------------- */

export function isStripeEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
