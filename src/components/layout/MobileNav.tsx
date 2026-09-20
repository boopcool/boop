"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type Item = { href: string; label: string };

export function MobileNav({
  items,
  signedIn,
  credits,
  demoMode,
}: {
  items: Item[];
  signedIn: boolean;
  credits: number | null;
  demoMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line transition-colors hover:bg-sand-deep md:hidden"
      >
        <span className="sr-only">Open menu</span>
        <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M1 4h14M1 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/20 backdrop-blur-[2px]"
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="animate-rise absolute inset-x-3 top-3 rounded-2xl border border-line bg-paper p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[13px] text-muted">Menu</span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line transition-colors hover:bg-sand-deep"
              >
                <span className="sr-only">Close menu</span>
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/*
              Closing on link click rather than on a pathname effect: the click
              is the actual intent, and it also closes correctly when someone
              taps the link for the page they're already on.
            */}
            <nav
              className="flex flex-col p-1"
              aria-label="Mobile"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) setOpen(false);
              }}
            >
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-[16px] transition-colors hover:bg-sand-deep"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/about" className="rounded-lg px-3 py-3 text-[16px] transition-colors hover:bg-sand-deep">
                About
              </Link>
              <div className="my-2 border-t border-line" />
              {signedIn ? (
                <>
                  <Link href="/dashboard" className="rounded-lg px-3 py-3 text-[16px] transition-colors hover:bg-sand-deep">
                    Dashboard
                    {credits !== null && (
                      <span className="ml-2 text-[13px] tabular-nums text-muted">
                        {credits.toLocaleString()} credits
                      </span>
                    )}
                  </Link>
                  {demoMode && (
                    <p className="px-3 pb-2 pt-1 text-[12px] leading-relaxed text-faint">
                      Demo Mode — you&rsquo;re signed in as a local sample account.
                    </p>
                  )}
                </>
              ) : (
                <Link href="/sign-in" className="rounded-lg px-3 py-3 text-[16px] transition-colors hover:bg-sand-deep">
                  Sign in
                </Link>
              )}
              <Link
                href="/new"
                className="mt-1 rounded-lg bg-ink px-3 py-3 text-center text-[16px] font-medium text-paper"
              >
                Run a test
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
