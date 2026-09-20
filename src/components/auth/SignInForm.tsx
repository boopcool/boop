"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  sendMagicLinkAction,
  signInWithGoogleAction,
  type SignInState,
} from "@/app/actions/auth";

const initial: SignInState = { status: "idle", message: "" };

export function SignInForm({
  next,
  googleEnabled,
}: {
  next: string;
  googleEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    sendMagicLinkAction,
    initial,
  );

  if (state.status === "sent") {
    return (
      <div className="animate-rise rounded-xl border border-line bg-sand p-6 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M2 4l6 4.5L14 4M2 3.5h12v9H2z"
              stroke="currentColor"
              strokeWidth="1.3"
              fill="none"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 className="mt-4 text-[17px] font-medium">Check your email</h2>
        <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-muted">
          {state.message}
          {state.email && (
            <>
              {" "}
              Sent to <span className="text-ink">{state.email}</span>.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />

        <div>
          <label htmlFor="email" className="text-[13px] font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-2 h-11 w-full rounded-lg border border-line bg-paper px-3.5 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-ink"
          />
        </div>

        <Button type="submit" disabled={pending} className="w-full" size="lg">
          {pending ? "Sending…" : "Email me a link"}
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] uppercase tracking-[0.12em] text-faint">
              or
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form action={signInWithGoogleAction}>
            <input type="hidden" name="next" value={next} />
            <Button type="submit" variant="secondary" className="w-full" size="lg">
              Continue with Google
            </Button>
          </form>
        </>
      )}

      {state.message && (
        <p
          role="status"
          className={`mt-5 rounded-lg border px-4 py-3 text-[13px] leading-relaxed ${
            state.status === "error"
              ? "border-[#f0d6d4] bg-[#fdf5f4]"
              : "border-line bg-sand text-muted"
          }`}
        >
          {state.message}
        </p>
      )}

      <p className="mt-6 text-[12px] leading-relaxed text-faint">
        No password to forget. We send a one-time link that signs you straight
        in. By continuing you agree that your votes may be shown, anonymously
        and in aggregate, on public results pages.
      </p>
    </div>
  );
}
