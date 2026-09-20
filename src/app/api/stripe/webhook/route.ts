import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cleanEnv, isStripeEnabled, packById } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook.
 *
 * Three things make this safe to expose:
 *  1. The signature is verified against STRIPE_WEBHOOK_SECRET before the body
 *     is trusted for anything.
 *  2. Fulfilment is idempotent — `credit_ledger` has a unique index on
 *     (type, reference), so a replayed event inserts nothing and the balance
 *     cannot be inflated by retries.
 *  3. Credits and the pack size are read from server-side configuration keyed
 *     by the pack id, never from amounts in the payload.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const raw = await request.text();

  const { default: StripeSdk } = await import("stripe");
  const stripe = new StripeSdk(cleanEnv(process.env.STRIPE_SECRET_KEY)!);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      signature,
      cleanEnv(process.env.STRIPE_WEBHOOK_SECRET)!,
    );
  } catch (error) {
    console.error(
      "[boop] stripe signature verification failed:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    // Acknowledged, deliberately ignored.
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const userId = session.metadata?.userId ?? session.client_reference_id;
  const packId = session.metadata?.pack;
  const pack = packId ? packById(packId) : undefined;

  if (!userId || !pack) {
    console.error("[boop] webhook missing userId or pack metadata", {
      event: event.id,
    });
    // 200 so Stripe stops retrying something we can never fulfil.
    return NextResponse.json({ received: true, fulfilled: false });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    // 500 so Stripe retries once the service key is present.
    return NextResponse.json({ error: "Storage unavailable." }, { status: 500 });
  }

  const reference = session.id;

  const { error: purchaseError } = await admin.from("purchases").upsert(
    {
      user_id: userId,
      pack: pack.id,
      credits: pack.credits,
      amount_cents: session.amount_total ?? pack.priceCents,
      currency: session.currency ?? "usd",
      provider: "stripe",
      provider_reference: reference,
      status: "paid",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider,provider_reference" },
  );

  if (purchaseError) {
    console.error("[boop] failed to record purchase:", purchaseError.message);
    return NextResponse.json({ error: "Could not record purchase." }, { status: 500 });
  }

  // The unique index on (type, reference) makes this a no-op on replay.
  const { error: ledgerError } = await admin.from("credit_ledger").insert({
    user_id: userId,
    amount: pack.credits,
    type: "purchase",
    reference,
  });

  if (ledgerError && ledgerError.code !== "23505") {
    console.error("[boop] failed to credit purchase:", ledgerError.message);
    return NextResponse.json({ error: "Could not credit account." }, { status: 500 });
  }

  return NextResponse.json({ received: true, fulfilled: true });
}
