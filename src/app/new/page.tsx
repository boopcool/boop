import Link from "next/link";
import type { Metadata } from "next";
import { CreateWizard } from "@/components/new/CreateWizard";
import { ButtonLink } from "@/components/ui/Button";
import { CREDITS } from "@/lib/config";
import { getViewer } from "@/lib/data/read";

export const metadata: Metadata = {
  title: "Run a test",
  description:
    "Two versions, one question, and real people picking between them. Up and running in under a minute.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function NewTestPage() {
  const viewer = await getViewer();

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">New test</p>
          <h1 className="display mt-3 text-[clamp(1.875rem,5vw,2.75rem)]">
            What can&rsquo;t you decide on?
          </h1>
        </div>
        <Link
          href="/feed"
          className="text-[13px] text-muted transition-colors hover:text-ink"
        >
          Cancel
        </Link>
      </div>

      <div className="mt-12">
        {viewer.profile ? (
          <CreateWizard
            credits={viewer.profile.credits}
            signedIn
            demoMode={viewer.demoMode}
          />
        ) : (
          <SignInPrompt />
        )}
      </div>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-line bg-sand px-6 py-14 text-center">
      <h2 className="text-[22px] font-medium tracking-[-0.025em]">
        Sign in to run a test.
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-muted">
        Voting works without an account. Creating one needs somewhere to send
        the results and somewhere to keep your credits — so that part needs an
        email.
      </p>
      <p className="mt-4 text-[13px] text-faint">
        {CREDITS.STARTER_GRANT} free credits when you do.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <ButtonLink href="/sign-in?next=/new">Sign in</ButtonLink>
        <ButtonLink href="/feed" variant="secondary">
          Boop something first
        </ButtonLink>
      </div>
    </div>
  );
}
