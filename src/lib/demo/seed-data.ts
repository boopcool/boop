/**
 * The demo corpus.
 *
 * Every test, profile, vote and comment below is FICTIONAL and is labelled as
 * such throughout the UI (`isDemo: true` drives a visible "Demo" badge). None
 * of it references a real company, product or person, and none of it is
 * presented as live human data.
 *
 * It is shared by two consumers:
 *   1. the in-memory store that powers Demo Mode when Supabase is unset, and
 *   2. `scripts/seed.ts`, which writes the same corpus into a real database.
 */

import type { CategoryId, ReasonId, TestMode } from "@/lib/config";
import type { Visibility } from "@/lib/types";
import manifest from "@/lib/demo/generated-manifest.json";

export type SeedProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarSeed: string;
  credits: number;
  boopsGiven: number;
};

export type SeedVariant = {
  label: string;
  title: string;
  imageUrl: string | null;
  copyValue: string | null;
};

export type SeedVote = {
  variantLabel: string;
  reason: ReasonId | null;
  comment: string | null;
};

export type SeedTest = {
  slug: string;
  ownerUsername: string;
  title: string;
  question: string;
  description: string | null;
  category: CategoryId;
  mode: TestMode;
  visibility: Visibility;
  targetVotes: number;
  fiveSecondPrompt: string | null;
  /** Hours before "now" that the test was created. Keeps the feed plausible. */
  ageHours: number;
  variants: SeedVariant[];
  votes: SeedVote[];
  fiveSecondAnswers?: string[];
};

export const SEED_PROFILES: SeedProfile[] = [
  {
    id: "11111111-1111-4111-8111-000000000001",
    username: "renata",
    displayName: "Renata Oyelaran",
    bio: "Building payments infrastructure. Currently allergic to my own landing page.",
    avatarSeed: "renata",
    credits: 64,
    boopsGiven: 212,
  },
  {
    id: "11111111-1111-4111-8111-000000000002",
    username: "tobi",
    displayName: "Tobi Wexler",
    bio: "Solo founder. Design is the only part I enjoy and the only part I'm bad at.",
    avatarSeed: "tobi",
    credits: 18,
    boopsGiven: 87,
  },
  {
    id: "11111111-1111-4111-8111-000000000003",
    username: "mireille",
    displayName: "Mireille Dax",
    bio: "Brand designer. I test everything twice and still change my mind.",
    avatarSeed: "mireille",
    credits: 140,
    boopsGiven: 604,
  },
  {
    id: "11111111-1111-4111-8111-000000000004",
    username: "arvo",
    displayName: "Arvo Lindqvist",
    bio: "Shipping a coffee subscription out of a garage in Tampere.",
    avatarSeed: "arvo",
    credits: 9,
    boopsGiven: 41,
  },
  {
    id: "11111111-1111-4111-8111-000000000005",
    username: "juno",
    displayName: "Juno Abara",
    bio: "Growth. I argue about button copy professionally.",
    avatarSeed: "juno",
    credits: 302,
    boopsGiven: 1180,
  },
  {
    id: "11111111-1111-4111-8111-000000000006",
    username: "pell",
    displayName: "Pell Nakamura",
    bio: "Indie dev. Two apps, one cat, zero designers.",
    avatarSeed: "pell",
    credits: 27,
    boopsGiven: 133,
  },
];

/**
 * Builds a vote list from a distribution plus a pool of reasons/comments, so
 * seeded results have realistic texture without hand-writing 900 rows.
 */
function votes(
  a: number,
  b: number,
  detail: {
    aReasons?: ReasonId[];
    bReasons?: ReasonId[];
    comments?: { v: "A" | "B"; reason: ReasonId; text: string }[];
  } = {},
): SeedVote[] {
  const out: SeedVote[] = [];
  const aReasons = detail.aReasons ?? ["cleaner", "clearer"];
  const bReasons = detail.bReasons ?? ["premium", "trustworthy"];

  for (let i = 0; i < a; i++) {
    out.push({
      variantLabel: "A",
      // Roughly two thirds of voters tag a reason; the rest just boop.
      reason: i % 3 === 2 ? null : (aReasons[i % aReasons.length] ?? null),
      comment: null,
    });
  }
  for (let i = 0; i < b; i++) {
    out.push({
      variantLabel: "B",
      reason: i % 3 === 2 ? null : (bReasons[i % bReasons.length] ?? null),
      comment: null,
    });
  }
  for (const c of detail.comments ?? []) {
    out.push({ variantLabel: c.v, reason: c.reason, comment: c.text });
  }
  return out;
}

/**
 * Resolves a demo asset name to a URL.
 *
 * The committed default is the deterministic SVG. Running
 * `npm run generate:assets -- --ai` writes neutral PNGs and records them in
 * `generated-manifest.json`, and those take over automatically — so the image
 * model is an upgrade path, never a build dependency.
 */
function art(name: string): string {
  const overrides = manifest.assets as Record<string, string>;
  return overrides[name] ?? "/generated/" + name + ".svg";
}

export const SEED_TESTS: SeedTest[] = [
  {
    slug: "northwind-hero-centered-or-split",
    ownerUsername: "renata",
    title: "Northwind homepage hero",
    question: "Which homepage would make you try the product?",
    description:
      "Same copy, same product. A is centered and quiet, B is split with the dashboard visible.",
    category: "landing",
    mode: "compare",
    visibility: "public",
    targetVotes: 100,
    fiveSecondPrompt: null,
    ageHours: 6,
    variants: [
      { label: "A", title: "Centered", imageUrl: art("hero-a"), copyValue: null },
      { label: "B", title: "Split with product", imageUrl: art("hero-b"), copyValue: null },
    ],
    votes: votes(27, 55, {
      aReasons: ["cleaner", "premium", "hierarchy"],
      bReasons: ["clearer", "trustworthy", "useful", "clickable"],
      comments: [
        { v: "B", reason: "clearer", text: "B shows me the product. A could be a consultancy or a bank, I genuinely can't tell." },
        { v: "B", reason: "trustworthy", text: "Seeing an actual payout row made it feel real. The centered one felt like a pitch deck." },
        { v: "A", reason: "premium", text: "A is prettier but I'd bounce. Nothing tells me what it does." },
        { v: "B", reason: "useful", text: "\"Settlement, same day\" beats \"Move money without the wait\" — it's specific." },
        { v: "A", reason: "cleaner", text: "A, but only because B's right panel is doing too much at once." },
        { v: "B", reason: "clickable", text: "The B screenshot answered my question before I had to scroll." },
      ],
    }),
  },
  {
    slug: "halcyon-mark-triangle-or-monogram",
    ownerUsername: "mireille",
    title: "Halcyon identity — mark direction",
    question: "Which logo would you remember tomorrow?",
    description: "Field research tool. Needs to survive down to a 16px favicon.",
    category: "logo",
    mode: "compare",
    visibility: "public",
    targetVotes: 100,
    fiveSecondPrompt: null,
    ageHours: 20,
    variants: [
      { label: "A", title: "Peak", imageUrl: art("logo-a"), copyValue: null },
      { label: "B", title: "Monogram", imageUrl: art("logo-b"), copyValue: null },
    ],
    votes: votes(58, 36, {
      aReasons: ["memorable", "cleaner", "premium"],
      bReasons: ["trustworthy", "clearer", "hierarchy"],
      comments: [
        { v: "A", reason: "memorable", text: "I could redraw A from memory. B is a rounded square with a letter in it, like everything else." },
        { v: "A", reason: "cleaner", text: "A holds up at the small size. B turns into a blob." },
        { v: "B", reason: "trustworthy", text: "B looks like a company that has a support team. A looks like a hiking brand." },
        { v: "A", reason: "memorable", text: "The dot inside the peak is the whole idea. Keep it." },
        { v: "B", reason: "hierarchy", text: "B sits better next to the wordmark — A fights it for attention." },
      ],
    }),
  },
  {
    slug: "pricing-cards-or-table",
    ownerUsername: "tobi",
    title: "Pricing page layout",
    question: "Which pricing page is easier to understand?",
    description:
      "Three plans either way. I keep going back and forth and I need to stop.",
    category: "pricing",
    mode: "compare",
    visibility: "public",
    targetVotes: 50,
    fiveSecondPrompt: null,
    ageHours: 3,
    variants: [
      { label: "A", title: "Three cards", imageUrl: art("pricing-a"), copyValue: null },
      { label: "B", title: "Comparison table", imageUrl: art("pricing-b"), copyValue: null },
    ],
    votes: votes(19, 23, {
      aReasons: ["cleaner", "premium", "clickable"],
      bReasons: ["clearer", "useful", "hierarchy"],
      comments: [
        { v: "B", reason: "clearer", text: "Table wins for comparing. Cards make me open three tabs in my head." },
        { v: "A", reason: "cleaner", text: "Cards, because the table looks like a spreadsheet I have to study." },
        { v: "B", reason: "useful", text: "I want to know what I lose by going cheaper. Only B tells me." },
        { v: "A", reason: "clickable", text: "A has one obvious button. B made me hunt." },
      ],
    }),
  },
  {
    slug: "ledger-app-sidebar-or-toolbar",
    ownerUsername: "pell",
    title: "Ledger — navigation shape",
    question: "Which one feels easier to use?",
    description: "Same screen, different navigation. Desktop-first product.",
    category: "design",
    mode: "compare",
    visibility: "public",
    targetVotes: 50,
    fiveSecondPrompt: null,
    ageHours: 34,
    variants: [
      { label: "A", title: "Left sidebar", imageUrl: art("app-a"), copyValue: null },
      { label: "B", title: "Top toolbar", imageUrl: art("app-b"), copyValue: null },
    ],
    votes: votes(31, 18, {
      aReasons: ["useful", "hierarchy", "clearer"],
      bReasons: ["cleaner", "premium"],
      comments: [
        { v: "A", reason: "useful", text: "Sidebar. I'll be in this thing all day and I want the sections visible." },
        { v: "B", reason: "cleaner", text: "The top nav gives the table more room, which is what I actually came for." },
        { v: "A", reason: "hierarchy", text: "A separates 'where am I' from 'what am I doing'. B mixes them." },
      ],
    }),
  },
  {
    slug: "slow-morning-bag-type-or-mark",
    ownerUsername: "arvo",
    title: "Slow Morning — 250g bag",
    question: "Which one would you trust enough to buy?",
    description: "Shelf test. Specialty coffee, first retail run.",
    category: "other",
    mode: "compare",
    visibility: "public",
    targetVotes: 50,
    fiveSecondPrompt: null,
    ageHours: 11,
    variants: [
      { label: "A", title: "Typographic", imageUrl: art("packaging-a"), copyValue: null },
      { label: "B", title: "Circular mark", imageUrl: art("packaging-b"), copyValue: null },
    ],
    votes: votes(33, 14, {
      aReasons: ["premium", "trustworthy", "memorable"],
      bReasons: ["cleaner", "hierarchy"],
      comments: [
        { v: "A", reason: "premium", text: "A reads like a roaster who cares. B reads like an own-brand supermarket bag." },
        { v: "A", reason: "trustworthy", text: "The origin line high on the bag is what I look for. A puts it where my eyes go." },
        { v: "B", reason: "cleaner", text: "B would stand out on a crowded shelf. A disappears next to other type-only bags." },
        { v: "A", reason: "memorable", text: "\"SLOW MORNING\" set that big is the whole product in two words." },
      ],
    }),
  },
  {
    slug: "launch-graphic-black-or-paper",
    ownerUsername: "juno",
    title: "Launch graphic for the feed",
    question: "Which one would you stop scrolling for?",
    description: "Goes out with the announcement post. 1200x675.",
    category: "other",
    mode: "compare",
    visibility: "public",
    targetVotes: 100,
    fiveSecondPrompt: null,
    ageHours: 2,
    variants: [
      { label: "A", title: "Black, type only", imageUrl: art("launch-a"), copyValue: null },
      { label: "B", title: "Paper, with product", imageUrl: art("launch-b"), copyValue: null },
    ],
    votes: votes(41, 38, {
      aReasons: ["memorable", "premium", "cleaner"],
      bReasons: ["clearer", "useful", "trustworthy"],
      comments: [
        { v: "A", reason: "memorable", text: "Black stops the scroll. Everything else in the timeline is white." },
        { v: "B", reason: "clearer", text: "A is a mood. B is an announcement. You're announcing something." },
        { v: "A", reason: "premium", text: "\"We rebuilt the ledger\" is a better line than \"Same-day settlement\" and A gives it room." },
        { v: "B", reason: "useful", text: "The little chart did more work than the headline for me." },
      ],
    }),
  },
  {
    slug: "halcyon-icon-ring-or-slab",
    ownerUsername: "mireille",
    title: "Halcyon app icon",
    question: "Which mark works better at small sizes?",
    description: "Home screen test. Light and dark backgrounds both matter.",
    category: "logo",
    mode: "compare",
    visibility: "public",
    targetVotes: 25,
    fiveSecondPrompt: null,
    ageHours: 48,
    variants: [
      { label: "A", title: "Ring + dot", imageUrl: art("icon-a"), copyValue: null },
      { label: "B", title: "Solid slabs", imageUrl: art("icon-b"), copyValue: null },
    ],
    votes: votes(9, 15, {
      aReasons: ["cleaner", "memorable"],
      bReasons: ["hierarchy", "clearer", "premium"],
      comments: [
        { v: "B", reason: "clearer", text: "B is solid black so it actually reads on a busy wallpaper. A vanishes." },
        { v: "A", reason: "memorable", text: "A is more distinctive but you're right that it's thin." },
      ],
    }),
  },
  {
    slug: "product-card-stacked-or-inline",
    ownerUsername: "tobi",
    title: "Store product card",
    question: "Which one would you click?",
    description: "Grid of these on the shop index. Mobile matters most.",
    category: "design",
    mode: "compare",
    visibility: "public",
    targetVotes: 25,
    fiveSecondPrompt: null,
    ageHours: 15,
    variants: [
      { label: "A", title: "Stacked", imageUrl: art("card-a"), copyValue: null },
      { label: "B", title: "Side by side", imageUrl: art("card-b"), copyValue: null },
    ],
    votes: votes(12, 9, {
      aReasons: ["clickable", "cleaner"],
      bReasons: ["useful", "clearer"],
      comments: [
        { v: "A", reason: "clickable", text: "Big image first. That's the whole job of a product card." },
        { v: "B", reason: "useful", text: "B fits more per screen, which matters more than the hero shot." },
      ],
    }),
  },
  {
    slug: "cta-copy-start-free-or-see-it-work",
    ownerUsername: "juno",
    title: "Primary CTA wording",
    question: "Which line would make you click?",
    description: "Same button, same page. Text only.",
    category: "copy",
    mode: "compare",
    visibility: "public",
    targetVotes: 100,
    fiveSecondPrompt: null,
    ageHours: 8,
    variants: [
      { label: "A", title: "Option A", imageUrl: null, copyValue: "Start free — no card" },
      { label: "B", title: "Option B", imageUrl: null, copyValue: "See it work on your data" },
    ],
    votes: votes(30, 47, {
      aReasons: ["clearer", "trustworthy"],
      bReasons: ["clickable", "useful", "memorable"],
      comments: [
        { v: "B", reason: "clickable", text: "\"On your data\" is the whole pitch. A is what every button says." },
        { v: "A", reason: "trustworthy", text: "\"No card\" removes the thing I'm actually worried about." },
        { v: "B", reason: "useful", text: "B promises a demo, A promises a signup form. I want the demo." },
        { v: "A", reason: "clearer", text: "B sounds like it'll take twenty minutes and a CSV." },
      ],
    }),
  },
  {
    slug: "name-northwind-or-tidemark",
    ownerUsername: "renata",
    title: "Company name, final two",
    question: "Which name is easier to say out loud?",
    description: "B2B fintech. Has to survive being said on a sales call.",
    category: "copy",
    mode: "compare",
    visibility: "public",
    targetVotes: 50,
    fiveSecondPrompt: null,
    ageHours: 72,
    variants: [
      { label: "A", title: "Option A", imageUrl: null, copyValue: "Northwind" },
      { label: "B", title: "Option B", imageUrl: null, copyValue: "Tidemark" },
    ],
    votes: votes(24, 29, {
      aReasons: ["memorable", "premium"],
      bReasons: ["clearer", "trustworthy", "memorable"],
      comments: [
        { v: "B", reason: "memorable", text: "Tidemark has a meaning that fits — a high-water line. Northwind is just weather." },
        { v: "A", reason: "premium", text: "Northwind sounds older and more established, which is what fintech wants." },
        { v: "B", reason: "clearer", text: "I spelled Tidemark right first try. Northwind I typed as Northwing." },
      ],
    }),
  },
  {
    slug: "five-second-northwind-hero",
    ownerUsername: "renata",
    title: "Northwind hero — five second read",
    question: "What does this product do?",
    description:
      "Showing the split hero for five seconds. I want to know if the product lands without a scroll.",
    category: "landing",
    mode: "five_second",
    visibility: "public",
    targetVotes: 50,
    fiveSecondPrompt: "What does this product do?",
    ageHours: 5,
    variants: [
      { label: "A", title: "Split hero", imageUrl: art("hero-b"), copyValue: null },
    ],
    votes: [],
    fiveSecondAnswers: [
      "Moves money between bank accounts faster than a normal transfer.",
      "Something financial — I saw a payout amount and the word settled.",
      "Payments for businesses. Same-day was the phrase that stuck.",
      "Honestly not sure. Money app. There was a big number.",
      "Sends payouts and shows you when they clear.",
      "Accounting or invoicing? I remember rows of transactions.",
      "It settles payments the same day instead of waiting days.",
      "A dashboard for tracking money going out. Vendor payments maybe.",
      "Banking API for developers. It said 'one API call'.",
      "Payouts. $18,420 settled. That's all I got in five seconds.",
      "Business banking. Clean. I'd guess payroll or vendor payments.",
      "Same-day settlement for companies — the headline did the work.",
    ],
  },
  {
    slug: "five-second-packaging-recall",
    ownerUsername: "arvo",
    title: "Coffee bag — what do you remember?",
    question: "What do you remember?",
    description: "Five seconds on the shelf is generous. Let's see what survives.",
    category: "other",
    mode: "five_second",
    visibility: "public",
    targetVotes: 25,
    fiveSecondPrompt: "What do you remember?",
    ageHours: 26,
    variants: [
      { label: "A", title: "Typographic bag", imageUrl: art("packaging-a"), copyValue: null },
    ],
    votes: [],
    fiveSecondAnswers: [
      "SLOW MORNING in big letters. Coffee, I think. Ethiopia?",
      "Ethiopia. Washed. And something about jasmine.",
      "Two words stacked, very large. A paper bag. 250 grams.",
      "Slow Morning. Felt calm, quite expensive.",
      "Coffee from Ethiopia. Tasting notes I can't recall exactly.",
      "Big type, no picture. Guji — that word stuck for some reason.",
      "The name and the weight. Nothing else registered.",
      "Peach? Black tea? One of the notes was a fruit.",
      "Slow Morning, Ethiopia Guji. It looked like a small roaster.",
    ],
  },
  {
    slug: "onboarding-empty-state-copy",
    ownerUsername: "pell",
    title: "Empty state, first run",
    question: "Which one sounds less like marketing?",
    description: "The screen a user sees before they've created anything.",
    category: "copy",
    mode: "compare",
    visibility: "public",
    targetVotes: 25,
    fiveSecondPrompt: null,
    ageHours: 40,
    variants: [
      {
        label: "A",
        title: "Option A",
        imageUrl: null,
        copyValue: "Nothing here yet. Create your first ledger to get started.",
      },
      {
        label: "B",
        title: "Option B",
        imageUrl: null,
        copyValue: "This is where your ledgers will live. Make one and it'll show up here.",
      },
    ],
    votes: votes(8, 16, {
      aReasons: ["cleaner", "clearer"],
      bReasons: ["trustworthy", "useful", "memorable"],
      comments: [
        { v: "B", reason: "trustworthy", text: "B sounds like a person wrote it. A sounds like a component library default." },
        { v: "B", reason: "useful", text: "B tells me what will happen. A just tells me to do something." },
        { v: "A", reason: "cleaner", text: "A is shorter and I'd rather read less on an empty screen." },
      ],
    }),
  },
  {
    slug: "app-store-screenshot-one",
    ownerUsername: "pell",
    title: "App Store — first screenshot",
    question: "Which screenshot makes you want to try the product?",
    description: "The one people see in search results. Everything rides on it.",
    category: "screenshot",
    mode: "compare",
    visibility: "public",
    targetVotes: 100,
    fiveSecondPrompt: null,
    ageHours: 1,
    variants: [
      { label: "A", title: "Full interface", imageUrl: art("app-a"), copyValue: null },
      { label: "B", title: "Interface, less chrome", imageUrl: art("app-b"), copyValue: null },
    ],
    votes: votes(7, 6, {
      aReasons: ["useful", "clearer"],
      bReasons: ["cleaner", "premium"],
      comments: [
        { v: "A", reason: "useful", text: "Showing the nav tells me the app has depth. B could be a single screen." },
      ],
    }),
  },
];

/** Exposed so /feed can promote a couple of tests without a real ranking. */
export const FEATURED_SLUGS = [
  "northwind-hero-centered-or-split",
  "five-second-northwind-hero",
  "halcyon-mark-triangle-or-monogram",
  "cta-copy-start-free-or-see-it-work",
] as const;
