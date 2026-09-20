"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { CREDIT_PACKS, CREDITS, formatPrice } from "@/lib/config";
import { startCheckoutAction, type CheckoutState } from "@/app/actions/billing";

const initial: CheckoutState = { status: "idle", message: "" };

export function PricingTable({
  stripeEnabled,
  signedIn,
}: {
  stripeEnabled: boolean;
  signedIn: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    startCheckoutAction,
    initial,
  );

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {CREDIT_PACKS.map((pack) => {
          const featured = Boolean(pack.featured);
          return (
            <div
              key={pack.id}
              className={[
                "flex flex-col rounded-xl border p-5 transition-colors sm:p-6",
                featured
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-paper hover:border-faint",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-medium">{pack.name}</h3>
                {featured && (
                  <span className="rounded-full bg-paper/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]">
                    Most picked
                  </span>
                )}
              </div>

              <p
                className={`mt-6 text-[44px] font-medium leading-none tracking-[-0.04em] ${featured ? "" : ""}`}
              >
                {formatPrice(pack.priceCents)}
              </p>
              <p
                className={`mt-2 text-[13px] ${featured ? "text-[#b5b5b3]" : "text-muted"}`}
              >
                {pack.priceCents === 0
                  ? "Free forever"
                  : `${pack.credits.toLocaleString()} Boops · one-off`}
              </p>
              <p
                className={`mt-3 text-[13px] leading-relaxed ${featured ? "text-[#c9c9c7]" : "text-muted"}`}
              >
                {pack.blurb}
              </p>

              <ul className="mt-5 space-y-2.5">
                {pack.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-[13px] leading-snug">
                    <span
                      className={`mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full ${featured ? "bg-paper" : "bg-ink"}`}
                    />
                    <span className={featured ? "text-[#dcdcda]" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex-1" />

              {pack.priceCents === 0 ? (
                <Link
                  href="/feed"
                  className="inline-flex h-10 w-full items-center justify-center rounded-full border border-line text-[14px] font-medium transition-colors hover:bg-sand-deep"
                >
                  Start booping
                </Link>
              ) : (
                <form action={formAction}>
                  <input type="hidden" name="pack" value={pack.id} />
                  <Button
                    type="submit"
                    disabled={pending}
                    variant={featured ? "secondary" : "primary"}
                    className="w-full"
                  >
                    {pending
                      ? "Opening…"
                      : signedIn
                        ? `Get ${pack.credits.toLocaleString()} Boops`
                        : "Sign in to buy"}
                  </Button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {state.message && (
        <p
          role="status"
          className="mt-5 rounded-xl border border-line bg-sand px-4 py-3 text-[13px] leading-relaxed text-muted"
        >
          {state.message}
        </p>
      )}

      {!stripeEnabled && !state.message && (
        <p className="mt-5 rounded-xl border border-dashed border-line bg-sand px-4 py-3 text-[13px] leading-relaxed text-muted">
          <span className="font-medium text-ink">Checkout isn&rsquo;t enabled on
          this deployment.</span>{" "}
          The pricing above is real configuration, not a mockup — add your Stripe
          keys and these buttons open a live Checkout session. Until then, every
          credit is earned: {CREDITS.EARN_AMOUNT} credit per{" "}
          {CREDITS.VOTES_PER_EARN} boops you give.
        </p>
      )}
    </div>
  );
}
