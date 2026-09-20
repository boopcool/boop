import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { SITE, isSupabaseConfigured } from "@/lib/config";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/feed", label: "Feed" },
      { href: "/new", label: "Run a test" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#five-second", label: "5 Second Test" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/#roadmap", label: "Roadmap" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
];

export function Footer() {
  const demo = !isSupabaseConfigured();

  return (
    <footer className="section-rule mt-24 bg-sand">
      <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              {SITE.tagline} Human taste tests for the things you&rsquo;re about
              to ship.
            </p>
          </div>

          <div className="flex gap-12 sm:gap-16">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[14px] text-muted transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="section-rule mt-12 flex flex-col gap-3 pt-6 text-[13px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. {SITE.domain}
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Sample tests are fictional and marked{" "}
              <span className="uppercase tracking-[0.1em]">Demo</span>.
            </span>
            {demo && (
              <span className="rounded-full border border-line bg-paper px-2 py-0.5">
                Demo Mode
              </span>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
