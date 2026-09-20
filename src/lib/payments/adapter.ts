import "server-only";

import {
  cleanEnv,
  CURRENCY,
  isStripeEnabled,
  packById,
  siteUrl,
} from "@/lib/config";
import type { Profile } from "@/lib/types";

/**
 * Payments sit behind this adapter so that nothing outside this folder knows
 * Stripe exists. With STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET unset, the
 * pricing UI stays fully interactive and `startCheckout` returns a clear
 * "unconfigured" result — no fake charges, no thrown errors, no dead buttons.
 */

export type CheckoutResult =
  | { status: "redirect"; url: string }
  | { status: "unconfigured"; message: string }
  | { status: "error"; message: string };

export interface PaymentProvider {
  readonly id: string;
  readonly enabled: boolean;
  startCheckout(args: {
    packId: string;
    profile: Profile;
  }): Promise<CheckoutResult>;
}

const demoProvider: PaymentProvider = {
  id: "demo",
  enabled: false,
  async startCheckout() {
    return {
      status: "unconfigured",
      message:
        "Checkout isn't wired up on this deployment. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to enable it — until then, earn credits by booping tests in the feed.",
    };
  },
};

const stripeProvider: PaymentProvider = {
  id: "stripe",
  enabled: true,
  async startCheckout({ packId, profile }) {
    const pack = packById(packId);
    if (!pack || pack.priceCents <= 0) {
      return { status: "error", message: "Unknown credit pack." };
    }

    try {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(cleanEnv(process.env.STRIPE_SECRET_KEY)!);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        // Lets the webhook credit the right account without trusting the
        // browser, and lets Stripe dedupe a double-submitted checkout.
        client_reference_id: profile.id,
        metadata: { userId: profile.id, pack: pack.id, credits: String(pack.credits) },
        payment_intent_data: {
          metadata: { userId: profile.id, pack: pack.id },
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: CURRENCY,
              unit_amount: pack.priceCents,
              product_data: {
                name: `Boop — ${pack.name}`,
                description: `${pack.credits.toLocaleString()} Boops`,
              },
            },
          },
        ],
        success_url: `${siteUrl()}/dashboard?purchase=success`,
        cancel_url: `${siteUrl()}/pricing?purchase=cancelled`,
      });

      if (!session.url) {
        return { status: "error", message: "Stripe did not return a checkout URL." };
      }
      return { status: "redirect", url: session.url };
    } catch (error) {
      console.error("[boop] stripe checkout failed:", error);
      return { status: "error", message: "Couldn't start checkout. Try again." };
    }
  },
};

export function paymentProvider(): PaymentProvider {
  return isStripeEnabled() ? stripeProvider : demoProvider;
}
