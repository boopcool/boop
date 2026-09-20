import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Nothing to boop here",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[620px] flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-36">
      <svg width="44" height="44" viewBox="0 0 32 32" aria-hidden="true" className="text-faint">
        <circle cx="7" cy="16" r="4.5" fill="currentColor" opacity="0.4" />
        <circle cx="25" cy="16" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      </svg>

      <p className="eyebrow mt-8">404</p>
      <h1 className="display mt-4 text-[clamp(2rem,6vw,3.25rem)]">
        Nothing to boop here.
      </h1>
      <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
        This page doesn&rsquo;t exist, or the test behind it was closed or made
        private. The two circles never touched.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <ButtonLink href="/feed">Open the feed</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back home
        </ButtonLink>
      </div>

      <Link
        href="/new"
        className="mt-6 text-[13px] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        Or run a test of your own
      </Link>
    </div>
  );
}
