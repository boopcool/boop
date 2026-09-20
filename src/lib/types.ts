import type { CategoryId, ReasonId, TestMode } from "@/lib/config";

export type Visibility = "public" | "unlisted" | "private";
export type TestStatus = "draft" | "live" | "closed";

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarSeed: string;
  credits: number;
  boopsGiven: number;
  createdAt: string;
  isDemo: boolean;
};

export type Variant = {
  id: string;
  testId: string;
  label: string;
  title: string | null;
  imageUrl: string | null;
  copyValue: string | null;
  displayOrder: number;
};

export type Test = {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  question: string;
  description: string | null;
  category: CategoryId;
  mode: TestMode;
  visibility: Visibility;
  status: TestStatus;
  targetVotes: number;
  fiveSecondPrompt: string | null;
  isDemo: boolean;
  createdAt: string;
  closesAt: string | null;
};

export type TestWithVariants = Test & {
  variants: Variant[];
  owner: Pick<Profile, "id" | "username" | "displayName" | "avatarSeed" | "isDemo">;
  voteCount: number;
};

export type Vote = {
  id: string;
  testId: string;
  variantId: string;
  voterId: string | null;
  reason: ReasonId | null;
  comment: string | null;
  createdAt: string;
};

export type FiveSecondResponse = {
  id: string;
  testId: string;
  voterId: string | null;
  answer: string;
  createdAt: string;
};

export type CreditEntryType =
  | "starter_grant"
  | "vote_earn"
  | "comment_bonus"
  | "test_spend"
  | "test_refund"
  | "purchase";

export type CreditEntry = {
  id: string;
  userId: string;
  amount: number;
  type: CreditEntryType;
  reference: string | null;
  createdAt: string;
};

export type AiSummary = {
  summary: string;
  themes: { label: string; mentions: number; note: string }[];
  strongestSignal: string;
  biggestConcern: string;
  nextAction: string;
  generatedAt: string;
  /** `model` when written by the LLM, `deterministic` when built from counts. */
  source: "model" | "deterministic";
};

/* --- Results ------------------------------------------------------------- */

export type SignalLevel = "none" | "early" | "moderate" | "high";

export type VariantResult = {
  variant: Variant;
  votes: number;
  share: number;
  /** Wilson 95% interval for this variant's share of the vote. */
  low: number;
  high: number;
  isWinner: boolean;
};

export type ReasonTally = {
  id: ReasonId;
  label: string;
  count: number;
  byVariant: Record<string, number>;
};

export type CommentEntry = {
  id: string;
  variantLabel: string;
  reason: string | null;
  comment: string;
  createdAt: string;
};

export type TestResults = {
  test: TestWithVariants;
  totalVotes: number;
  variants: VariantResult[];
  /** Winning variant id, or null when the read is too close or too small. */
  winnerId: string | null;
  margin: number;
  signal: SignalLevel;
  signalLabel: string;
  reasons: ReasonTally[];
  comments: CommentEntry[];
  fiveSecondAnswers: { id: string; answer: string; createdAt: string }[];
  progress: number;
};
