import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";
import { BoopMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { CREDITS, isSupabaseConfigured } from "@/lib/config";
import { getViewer } from "@/lib/data/read";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Boop with a one-time email link.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/feed";

  const viewer = await getViewer();
  const configured = isSupabaseConfigured();

  // Already signed in with a real account — nothing to do here.
  if (viewer.profile && !viewer.demoMode) redirect(next);

  return (
    <div className="mx-auto grid max-w-[1080px] gap-12 px-5 py-14 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-24">
      <div className="max-w-sm">
        <BoopMark size={26} />
        <h1 className="display mt-7 text-[clamp(2rem,5.5vw,3rem)]">
          Sign in to Boop.
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-muted">
          You don&rsquo;t need an account to vote — go boop things right now if
          that&rsquo;s what you came for. You do need one to run a test, because
          the results and the credits have to live somewhere.
        </p>

        <ul className="mt-8 space-y-3 text-[14px] text-muted">
          {[
            `${CREDITS.STARTER_GRANT} credits the moment you sign up`,
            `Earn ${CREDITS.EARN_AMOUNT} more for every ${CREDITS.VOTES_PER_EARN} boops you give`,
            "No password, no card",
          ].map((line) => (
            <li key={line} className="flex items-start gap-3">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink" />
              {line}
            </li>
          ))}
        </ul>

        <Link
          href="/feed"
          className="mt-8 inline-flex items-center gap-1.5 text-[14px] text-ink underline-offset-4 hover:underline"
        >
          Just let me vote
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="lg:pt-4">
        <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
          {configured ? (
            <SignInForm next={next} googleEnabled />
          ) : (
            <DemoNotice />
          )}

          {error === "oauth" && (
            <p className="mt-4 rounded-lg border border-[#f0d6d4] bg-[#fdf5f4] px-4 py-3 text-[13px]">
              Google sign-in didn&rsquo;t complete. Try the email link instead.
            </p>
          )}
          {error === "unavailable" && (
            <p className="mt-4 rounded-lg border border-[#f0d6d4] bg-[#fdf5f4] px-4 py-3 text-[13px]">
              Authentication is temporarily unavailable. Try again shortly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoNotice() {
  return (
    <div>
      <span className="inline-flex rounded-full border border-line bg-sand px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
        Demo Mode
      </span>
      <h2 className="mt-4 text-[19px] font-medium tracking-[-0.02em]">
        You&rsquo;re already signed in.
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        This deployment has no Supabase project configured, so Boop is running
        against an in-memory store with a local sample account. Every feature
        works — voting, creating tests, credits, results — but nothing survives
        a server restart and there&rsquo;s no mailbox to send a link to.
      </p>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        Add <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-[12px]">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-[12px]">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        to turn on real accounts, magic links and Google OAuth.
      </p>

      <div className="mt-7 flex flex-wrap gap-2">
        <ButtonLink href="/feed">Go to the feed</ButtonLink>
        <ButtonLink href="/dashboard" variant="secondary">
          Your dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
