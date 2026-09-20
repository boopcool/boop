# Launch assets

Everything here is a **real screenshot of the running product**, composed into
branded frames. Nothing is a mockup, and every number visible in them
(67%, 88 humans, the 95% intervals, the AI summary text) is what the app
actually rendered.

`*.png` are the masters at 2× — upload these unless a form rejects the size.
`web/*.jpg` are 1600px-wide JPEGs of the same images, all under 250KB, for
upload forms with tight limits.

## What to submit to Orynth

| Slot | File | Size |
| --- | --- | --- |
| Hero / banner | `01-hero.png` or `01b-hero-alt.png` | 1600×900 |
| Gallery 1 | `02-showcase.png` | 1600×1000 |
| Gallery 2 | `03-compare.png` | 1600×1000 |
| Gallery 3 | `04-results.png` | 1600×1000 |
| Gallery 4 | `05-five-second-test.png` | 1600×1000 |
| Gallery 5 | `06-create.png` | 1600×1000 |
| Thumbnail | `10-thumbnail.png` | 512×512 |
| OG / social | `09-social-card.png` | 1200×630 |

`07-pricing.png` and `08-mobile.png` are spares if the listing takes more than
five gallery images.

## The two heroes

Both carry the same headline, tagline and product cards. Pick one:

- **`01-hero.png`** — flat near-black with a CSS dot field. Cleanest, smallest
  file, matches the site's own dark sections exactly.
- **`01b-hero-alt.png`** — same layout over a backdrop generated with OpenAI
  Images (`gpt-image-2.5-flare`): concentric rings spreading from a point of
  contact, which is the Boop mark's idea, plus fine film grain. More depth,
  larger file.

The type in both is real text, not generated. Image models render typography
unreliably and Boop's identity is typographic, so the wordmark and headline are
always drawn as text over the top.

## Ordering logic

The gallery follows the product loop rather than the sitemap: the ask
(5 Second Test card) → the decision (feed) → the answer (results) → how you set
one up (create) → how it's paid for (credits). Someone scrolling the gallery
without reading a word still learns what Boop does.

## Honesty notes

- Every seeded test visible in these shots carries a **DEMO** badge. That's the
  product's own labelling for fictional sample data, and it is deliberately
  left in rather than cropped out.
- The AI summary shown in `01`, `02` and `04` is genuine model output,
  generated from the seeded human comments, and carries its **MODEL-WRITTEN**
  badge in frame.
- No user counts, revenue, testimonials or partner logos appear anywhere.

## Regenerating

The capture and compose scripts are not committed — they're throwaway tooling
that drives a headless Chrome against `localhost:3000`. To rebuild:

1. `npm run dev` with `NEXT_PUBLIC_SITE_URL=https://boop.cool` so the share
   URLs in the screenshots read correctly.
2. Drive each route into the state you want, capture at
   `deviceScaleFactor: 2`, clipping to element bounds rather than guessing
   pixel offsets — a 40px miss leaves a band of blank page in the middle of a
   launch image.
3. Compose in HTML using the tokens from `src/app/globals.css`, and screenshot
   each frame by element id.

## Source screens

`../screens/` holds every route captured unframed at 2×, including the ones
that didn't make the gallery: about, sign-in, profile, 404, the copy-variant
test, the dashboard and both mobile views. Use those if you need to re-compose
for a different platform's aspect ratios.
