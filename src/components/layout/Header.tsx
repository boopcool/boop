import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Primitives";
import { MobileNav } from "@/components/layout/MobileNav";
import { getViewer } from "@/lib/data/read";

const NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
];

export async function Header() {
  const { profile, demoMode } = await getViewer();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
      <div className="mx-auto flex h-15 max-w-[1240px] items-center gap-6 px-5 py-3 sm:px-8">
        <Link
          href="/"
          className="shrink-0 rounded-md transition-opacity hover:opacity-70"
          aria-label="Boop home"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-[14px] text-muted transition-colors hover:bg-sand-deep hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {profile ? (
            <>
              <CreditPill credits={profile.credits} />
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-[13px] transition-colors hover:bg-sand-deep sm:inline-flex"
              >
                <Avatar seed={profile.avatarSeed} name={profile.displayName} size={24} />
                <span className="max-w-[9rem] truncate">{profile.displayName}</span>
              </Link>
              <ButtonLink href="/new" size="sm" className="hidden sm:inline-flex">
                Run a test
              </ButtonLink>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden rounded-md px-3 py-1.5 text-[14px] text-muted transition-colors hover:bg-sand-deep hover:text-ink sm:block"
              >
                Sign in
              </Link>
              <ButtonLink href="/new" size="sm">
                Run a test
              </ButtonLink>
            </>
          )}

          <MobileNav
            items={NAV}
            signedIn={Boolean(profile)}
            credits={profile?.credits ?? null}
            demoMode={demoMode}
          />
        </div>
      </div>
    </header>
  );
}

function CreditPill({ credits }: { credits: number }) {
  return (
    <Link
      href="/pricing"
      title={`${credits} credits — 1 credit buys 1 human response`}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[13px] tabular-nums transition-colors hover:bg-sand-deep"
    >
      <svg width="12" height="12" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="10" cy="16" r="5" fill="currentColor" />
        <circle cx="22" cy="16" r="5" fill="none" stroke="currentColor" strokeWidth="2.6" />
      </svg>
      <span className="font-medium">{credits.toLocaleString()}</span>
      <span className="sr-only">credits</span>
    </Link>
  );
}
