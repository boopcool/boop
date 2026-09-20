import Link from "next/link";
import type { Metadata } from "next";
import { PricingTable } from "@/components/pricing/PricingTable";
import { ButtonLink } from "@/components/ui/Button";
import { CREDITS, isStripeEnabled } from "@/lib/config";
import { getViewer } from "@/lib/data/read";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One credit, one human response. Earn credits by helping other builders, or buy a pack when you're in a hurry.",
  alternates: { canonical: "/pricing" },
};

export const dynamic = "force-dynamic";

const FAQ = [
  {
    q: "Do credits expire?",
    a: "No. They sit on your account until you spend them.",
  },
  {
    q: "What happens to unspent credits on a test?",
    a: "Credits are spent when you launch, against the number of responses you asked for. If you close a test early, the responses you already collected are yours to keep and the test stops accepting new ones.",
  },
  {
    q: "Is there a subscription?",
    a: "No. Packs are one-off purchases and the free tier is genuinely usable — the earning loop exists so that a builder with no budget can still get answers.",
  },
  {
    q: "Can I get a refund?",
    a: "If a pack didn't deliver the credits it should have, email us and we'll fix it. Credits already spent on collected human responses aren't refundable, for the obvious reason that the humans already did the work.",
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ purchase?: string }>;
}) {
  const { purchase } = await searchParams;
  const viewer = await getViewer();

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 sm:py-20">
      {purchase === "cancelled" && (
        <p className="mb-10 rounded-xl border border-line bg-sand px-4 py-3 text-[14px]">
          Checkout cancelled — nothing was charged.
        </p>
      )}

      <div className="max-w-2xl">
        <p className="eyebrow">Pricing</p>
        <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.25rem)]">
          One credit. One human.
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-muted">
          Boop is priced by the thing you&rsquo;re actually buying: a person
          looking at your work and making a decision. No seats, no minimum, no
          call with anyone.
        </p>
      </div>

      <div className="mt-14">
        <PricingTable
          stripeEnabled={isStripeEnabled()}
          signedIn={Boolean(viewer.profile)}
        />
      </div>

      {/* The earning loop, given equal weight to the paid tiers. */}
      <section className="mt-16 grid gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-3">
        <div className="bg-sand p-6 sm:p-8 lg:col-span-1">
          <h2 className="text-[20px] font-medium tracking-[-0.025em]">
            You can run Boop for free, forever.
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            The credit system exists to keep the feed alive, not to gate the
            product. Everything you give comes back.
          </p>
          <ButtonLink href="/feed" variant="secondary" size="sm" className="mt-5">
            Start earning
          </ButtonLink>
        </div>

        {[
          {
            head: `${CREDITS.STARTER_GRANT} credits`,
            body: "Granted once, when you create an account. Enough for a small test on day one.",
          },
          {
            head: `+${CREDITS.EARN_AMOUNT} per ${CREDITS.VOTES_PER_EARN} boops`,
            body: `Give feedback in the feed and it converts straight into responses on your own tests. Written comments earn ${CREDITS.COMMENT_BONUS} more.`,
          },
        ].map((item) => (
          <div key={item.head} className="bg-paper p-6 sm:p-8">
            <p className="text-[28px] font-medium tabular-nums tracking-[-0.03em]">
              {item.head}
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section className="mt-20">
        <h2 className="eyebrow">Billing questions</h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {FAQ.map((item) => (
            <div key={item.q} className="bg-paper p-6">
              <h3 className="text-[15px] font-medium">{item.q}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 rounded-2xl border border-line bg-ink px-6 py-14 text-center text-paper sm:px-10">
        <h2 className="display mx-auto max-w-[16ch] text-[clamp(1.875rem,5vw,3rem)]">
          Stop guessing. It takes a minute.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/new"
            className="inline-flex h-11 items-center rounded-full bg-paper px-6 text-[15px] font-medium text-ink transition-colors hover:bg-[#ededeb]"
          >
            Run a test
          </Link>
          <Link
            href="/feed"
            className="inline-flex h-11 items-center rounded-full border border-[#3a3a38] px-6 text-[15px] font-medium transition-colors hover:bg-[#1e1e1e]"
          >
            Earn credits first
          </Link>
        </div>
      </section>
    </div>
  );
}
