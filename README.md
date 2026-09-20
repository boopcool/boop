<div align="center">

<img src="public/brand/logo.svg" width="190" alt="Boop" />

**Know what people pick before you ship.**

Human taste tests for landing pages, logos, screenshots, copy and everything
else you're about to ship.

</div>

---

## What Boop is

AI can generate infinite options. Humans still decide what feels right.

Boop is a preference-testing platform. You upload two versions of something —
a hero section, a logo, a pricing table, two CTA lines — ask one question, and
real people pick one. You get counts, a defensible confidence read, the reasons
behind the split, and a share card you can post.

Two modes ship today:

| Mode | What it does |
| --- | --- |
| **Compare** | Two versions side by side. One tap picks a winner, with an optional reason tag and comment. |
| **5 Second Test** | One design shown for exactly five seconds, then hidden, then a single recall question. |

The economy is a closed loop: give boops in the feed, earn credits, spend
credits to get boops on your own test. Buying credits is a shortcut, not the
entrance.

### What Boop is not

It is not an AI design critic. A language model is used for exactly one job —
reading the written comments on a results page and grouping them into themes —
and it is labelled as such wherever it appears. It never casts a vote, never
writes one, and never changes a count. Every number comes from a person who
clicked.

---

## Run it right now

```bash
npm install && npm run dev
```

That's the whole setup. With no environment variables at all, Boop boots into
**Demo Mode**: an in-memory store seeded with 14 fictional tests, ~500
responses, working credits, a signed-in sample account, and every page fully
functional. Nothing is stubbed and no screen says "coming soon".

Demo Mode is a real fallback, not a mock. The same code paths run; only the
persistence layer differs. Every seeded test carries a visible **Demo** badge so
it can never be mistaken for real human data, and the app tells you it's in
Demo Mode on the dashboard, in the sign-in page and in the footer.

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                     Marketing homepage (12 sections)
│   ├── feed/                        The voting loop — look, decide, boop, next
│   ├── new/                         Six-step create wizard
│   ├── test/[slug]/                 Single-test voting surface
│   ├── results/[slug]/              Results dashboard + dynamic OG card
│   ├── dashboard/                   Your tests, credits, ledger
│   ├── pricing/  profile/[username]/  about/  sign-in/
│   ├── actions/                     Server actions — every mutation lives here
│   ├── api/upload/                  Validated image upload
│   ├── api/stripe/webhook/          Signature-verified, idempotent fulfilment
│   └── auth/callback/               Magic-link + OAuth code exchange
├── components/                      Server components by default
├── lib/
│   ├── config.ts                    Every tunable number and label
│   ├── stats.ts                     Wilson intervals, signal levels
│   ├── validation.ts                Zod schemas for every input
│   ├── data/{read,write,results}.ts Data layer — Supabase or demo store
│   ├── demo/                        In-memory store + seed corpus
│   ├── ai/summarize.ts              Feedback synthesis (+ deterministic fallback)
│   ├── payments/adapter.ts          Payment provider interface
│   ├── supabase/{server,client}.ts  RLS-scoped and service-role clients
│   ├── anon.ts  rate-limit.ts  request.ts  share.ts
│   └── types.ts
├── proxy.ts                         Session refresh (Next 16's middleware)
supabase/migrations/                 Schema, RLS, triggers, storage policies
scripts/                             seed.ts, generate-demo-assets.ts
tests/                               Statistics and validation unit tests
```

### Decisions worth knowing about

**One data layer, two backends.** `lib/data/read.ts` and `write.ts` branch on
whether Supabase is configured. Every page and action calls the same functions
either way, so Demo Mode can't drift from production behaviour.

**Authorization is never in the browser.** All mutations are server actions.
The client sends a slug and a variant id; identity always comes from the
session. No schema in `validation.ts` accepts a user id.

**Credits are an append-only ledger.** `profiles.credits` is a trigger-maintained
cache of `sum(credit_ledger.amount)`, and a `BEFORE UPDATE` trigger rejects any
client write to it. Launching a test debits credits and flips the test live
inside one `SECURITY DEFINER` function that locks the profile row first, so two
concurrent launches can't both pass the balance check.

**Raw votes are not public.** RLS lets you read your own votes and lets a test
owner read all of theirs. Everyone else gets aggregates from `test_tally()`, a
`SECURITY DEFINER` function — so nobody can scrape a tally before voting, and
comments stay with the person who commissioned them.

**No charting library.** Two to four bars with a confidence whisker is not worth
90kB of JavaScript. `ResultsChart` is hand-drawn and renders on the server.

**No `react-hook-form`.** The create wizard is mostly one-tap choices with three
text fields; RHF would add a dependency and a layer without removing any code.
Validation still runs through Zod, on the server, where it counts.

**SVG demo art, not generated images.** The bundled demo artwork is drawn in
code (`scripts/lib/demo-svg.ts`) — original, neutral, deterministic, a few kB
each, and genuinely closer to the "minimal editorial" brief than an image model
gets. It is also the *correct* artwork: the seeded human comments were written
against these specific designs and quote them by name, so the results pages
stay coherent.

`npm run generate:assets -- --ai` does work — it renders neutral PNGs through
`OPENAI_IMAGE_MODEL` and records them in `src/lib/demo/generated-manifest.json`,
which `seed-data.ts` reads and prefers. It ships with an empty manifest on
purpose: swapping the artwork without rewriting the seeded comments would leave
voters quoting designs nobody can see. Use it when you're bringing your own
corpus. The app never requires it to build.

---

## Statistics

A winner is declared only when the **entire 95% Wilson score interval** for the
leading variant sits above 50%.

Wilson rather than the normal approximation because Boop tests routinely run at
n = 10–50, exactly where the naive interval is both too narrow and capable of
producing bounds outside [0, 1].

| Label | Condition |
| --- | --- |
| Not enough boops yet | n < 5 |
| Early signal | interval crosses 50%, or n < 20 |
| Moderate signal | interval clears 50% and n ≥ 20 |
| High confidence | interval clears 50% and n ≥ 60 |

Every results page carries a tooltip stating plainly that this measures
consistency of the observed preference at this sample size, and is **not** a
claim about a wider population. Boop's voters are self-selected internet
builders; the UI never pretends otherwise.

Covered by `tests/stats.test.ts`.

---

## Environment variables

Copy `.env.example` to `.env.local`. **Every variable is optional** — each
unset group degrades to a working fallback rather than an error.

| Variable | Needed for | Without it |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, OG images, share links | Falls back to the Vercel URL, then `localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Database, auth, storage | Demo Mode (in-memory) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same | Demo Mode |
| `SUPABASE_SERVICE_ROLE_KEY` | Anonymous votes, seeding, webhooks | Anonymous voting asks for sign-in |
| `SUPABASE_STORAGE_BUCKET` | Upload target | Defaults to `boop-variants` |
| `OPENAI_API_KEY` | Feedback synthesis, `--ai` assets | Deterministic summary from the counts |
| `OPENAI_TEXT_MODEL` | Which model summarises | Defaults to `gpt-5.4-mini` |
| `OPENAI_IMAGE_MODEL` | `generate:assets --ai` | Defaults to `gpt-image-2.5-flare` |
| `STRIPE_SECRET_KEY` | Credit purchases | Pricing UI stays live, explains checkout is off |
| `STRIPE_WEBHOOK_SECRET` | Fulfilment | Same |
| `ANON_HASH_SECRET` | Pepper for anonymous vote hashes | Dev pepper + a loud production warning |

`.env.local` is gitignored. No secret is read anywhere outside a `server-only`
module, and nothing secret is prefixed `NEXT_PUBLIC_`.

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the URL, anon key and service-role key into `.env.local`.
3. Apply the migration:

   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```

   Or paste `supabase/migrations/20260101000000_init.sql` into the SQL editor.
   It is idempotent on the storage bucket and safe to run on a fresh project.

4. Seed the demo corpus (optional, marks everything `is_demo = true`):

   ```bash
   npm run seed          # insert anything missing
   npm run seed -- --reset   # delete previously seeded demo rows first
   ```

   The seed script only ever deletes rows it created. It cannot clear real
   users' tests.

5. **Auth** — in Authentication → Providers, enable Email (magic link). For
   Google, enable the provider and add
   `https://<your-domain>/auth/callback` to both Supabase's redirect allow-list
   and your Google OAuth client.

6. **Storage** — the migration creates the public `boop-variants` bucket with a
   6MB limit, a PNG/JPEG/WEBP allow-list, and policies scoping writes to
   `<user-id>/…` so nobody can write into another user's prefix.

The migration also installs the account bootstrap trigger: a new `auth.users`
row creates a profile with a unique username and grants the starter credits.
**Keep the numbers in `handle_new_user()` and `after_vote_insert()` in sync with
`CREDITS` in `src/lib/config.ts`** — they're duplicated because triggers can't
read TypeScript.

---

## OpenAI setup

Set `OPENAI_API_KEY` and optionally `OPENAI_TEXT_MODEL`. That's it.

The summariser receives the question, the counts, the reason tags and the
written comments, and returns structured JSON via a strict schema: a two
sentence summary, up to three themes, the strongest signal, the biggest
concern, and a next action. Its system prompt forbids inventing feedback or
contradicting the supplied counts.

It is skipped entirely when there are fewer than three pieces of written
feedback — arithmetic is better than a model with nothing to read — and any
failure or timeout falls back to `deterministicSummary()` without breaking the
page. Results pages label which one produced the text.

---

## Stripe setup (optional)

1. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
2. Add a webhook endpoint at `https://<your-domain>/api/stripe/webhook`
   subscribed to `checkout.session.completed`.
3. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

Credit packs live in `CREDIT_PACKS` in `src/lib/config.ts` and are created as
inline `price_data`, so there are no Stripe dashboard products to keep in sync —
edit the config and redeploy.

Fulfilment is idempotent three ways: the signature is verified before the body
is trusted, `purchases` has a unique index on `(provider, provider_reference)`,
and `credit_ledger` has one on `(type, reference)`. A replayed event inserts
nothing. Credit amounts are read from server config keyed by pack id, never
from the payload.

With Stripe unset, the pricing page stays fully interactive and explains that
checkout isn't enabled on this deployment. No fake charges, ever.

---

## Development

```bash
npm run dev               # dev server on :3000
npm run lint              # eslint
npm run typecheck         # tsc --noEmit
npm test                  # unit tests (statistics + validation)
npm run build             # production build
npm run check             # all four, in order

npm run seed              # seed a real Supabase project
npm run generate:assets   # rewrite deterministic SVG demo art
npm run generate:assets -- --ai   # also render neutral PNGs via OpenAI
```

---

## Deployment

Vercel, with no special configuration:

1. Import the repository.
2. Add environment variables (Production and Preview).
3. Set `NEXT_PUBLIC_SITE_URL` to your real origin — OG images and share links
   read it.
4. Deploy.

Add your production domain to Supabase's redirect allow-list, and point the
Stripe webhook at the deployed URL.

**One caveat about Demo Mode in production.** The in-memory store and the
in-process rate limiter live per serverless instance, so on a multi-instance
deploy without Supabase, writes will appear to vanish between requests. That's
fine for a preview or a demo link and wrong for real traffic — configure
Supabase for anything else.

---

## Security notes

- **RLS on every table.** Public read is limited to public, non-draft tests and
  the public fields of a profile. Writes are scoped to the owner.
- **Aggregates behind `SECURITY DEFINER`.** Non-owners can't read raw votes, so
  a tally can't be scraped before voting.
- **Credits can't be client-written.** Trigger-enforced, ledger-derived,
  append-only, with an immutability trigger on the ledger itself.
- **Zod on every input.** Server actions and route handlers validate before
  anything downstream sees a value. No schema accepts a user id.
- **Upload validation.** Size checked before the body is read, then declared
  MIME against an allow-list, then a magic-number sniff that has the final say —
  a renamed `.svg` can't get through. Storage keys are prefixed with the
  uploader's id, which the storage policy enforces.
- **Open-redirect safe.** `next` parameters on sign-in and the auth callback are
  validated as same-origin paths. Covered by a unit test.
- **Anonymous voting is hashed, and honest.** A random 128-bit id lives in an
  httpOnly cookie; only an HMAC of it, keyed with `ANON_HASH_SECRET`, reaches
  the database. Unique indexes enforce one vote per test. This is a speed bump,
  not a Sybil defence — Boop does no fingerprinting and says so on `/about`.
- **No `dangerouslySetInnerHTML` anywhere.** All user text renders as text, with
  `overflow-wrap: anywhere` so it can't break a layout.
- **Security headers** set in `next.config.ts`; remote images restricted to the
  configured Supabase host.
- **Rate limiting** behind an interface (`lib/rate-limit.ts`) on voting, test
  creation, uploads, summaries and auth. The default is in-process — swap
  `createDurableLimiter` for a shared backend before you need it to hold across
  instances.

---

## Honesty about demo data

The seeded corpus in `src/lib/demo/seed-data.ts` is entirely fictional. No real
company, product or person appears in it, and no vote in it came from a human.
Every seeded test, profile and results page is badged **Demo** in the UI, seeded
votes carry a deliberately synthetic hash, and the homepage's interactive demo
is labelled **Sample** with a note that the percentages are illustrative.

There are no testimonials on this site, because nobody has given one.

## Art policy

All visual assets are original. The logo, the wordmark, the avatars and the
demo artwork are authored as SVG in this repository. Nothing imitates a living
artist, no image prompt references one by name, and no third-party portfolio
was used as reference or training material.

---

## Licence

Unlicensed / all rights reserved. Add one before making the repository public.
