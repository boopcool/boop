"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/data/read";
import { paymentProvider } from "@/lib/payments/adapter";
import { checkoutSchema } from "@/lib/validation";

export type CheckoutState = { status: "idle" | "error" | "info"; message: string };

export async function startCheckoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({ pack: formData.get("pack") });
  if (!parsed.success) {
    return { status: "error", message: "Unknown credit pack." };
  }

  const viewer = await getViewer();
  if (!viewer.profile) {
    redirect(`/sign-in?next=${encodeURIComponent("/pricing")}`);
  }

  const result = await paymentProvider().startCheckout({
    packId: parsed.data.pack,
    profile: viewer.profile,
  });

  if (result.status === "redirect") redirect(result.url);
  if (result.status === "unconfigured") {
    return { status: "info", message: result.message };
  }
  return { status: "error", message: result.message };
}
