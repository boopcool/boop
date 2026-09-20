import Link from "next/link";
import { Avatar, Badge, DemoBadge } from "@/components/ui/Primitives";
import { categoryLabel } from "@/lib/config";
import type { TestWithVariants } from "@/lib/types";

/** Compact preview of a variant, used inside cards. Never shows results. */
function Thumb({
  src,
  copy,
  label,
  alt,
}: {
  src: string | null;
  copy: string | null;
  label: string;
  alt: string;
}) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-sand">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- mixed first-party SVG and uploaded raster; sized by CSS.
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          // Crop from the top-left: designs are read from there, and centering
          // a wide hero in a 4:3 thumbnail slices the headline in half.
          className="h-full w-full object-cover object-left-top"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-3">
          <p className="user-text line-clamp-3 text-center text-[12px] font-medium leading-snug">
            {copy}
          </p>
        </div>
      )}
      <span className="absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-paper/90 text-[9px] font-semibold">
        {label}
      </span>
    </div>
  );
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function subtitle(test: TestWithVariants): string | null {
  if (test.description) return test.description;
  return normalise(test.title) === normalise(test.question) ? null : test.title;
}

export function TestCard({
  test,
  href,
}: {
  test: TestWithVariants;
  href?: string;
}) {
  const target = href ?? `/test/${test.slug}`;
  const remaining = Math.max(0, test.targetVotes - test.voteCount);
  const isFiveSecond = test.mode === "five_second";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-paper transition-[border-color,box-shadow] duration-200 hover:border-faint hover:shadow-[0_12px_36px_-28px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-2 gap-2 p-2">
        {test.variants.slice(0, 2).map((v) => (
          <Thumb
            key={v.id}
            src={v.imageUrl}
            copy={v.copyValue}
            label={v.label}
            alt={`Version ${v.label} of ${test.title}`}
          />
        ))}
        {test.variants.length === 1 && (
          <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-line bg-sand text-center text-[11px] leading-snug text-faint">
            5 seconds,
            <br />
            then recall
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="outline">{categoryLabel(test.category)}</Badge>
          {isFiveSecond && <Badge tone="ink">5 second</Badge>}
          {test.isDemo && <DemoBadge />}
        </div>

        <h3 className="mt-2.5 text-[15px] font-medium leading-snug tracking-[-0.015em]">
          <Link href={target} className="after:absolute after:inset-0">
            {test.question}
          </Link>
        </h3>

        {/*
          Fall back to the title only when it adds something. The create wizard
          seeds the title from the question, so printing both would just repeat
          the headline underneath itself.
        */}
        {subtitle(test) && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {subtitle(test)}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <Avatar seed={test.owner.avatarSeed} name={test.owner.displayName} size={20} />
              <span className="truncate text-[12px] text-muted">
                {test.owner.displayName}
              </span>
            </span>
            <span className="shrink-0 text-[12px] tabular-nums text-faint">
              {remaining > 0 ? `${remaining} to go` : "Target met"}
            </span>
          </div>
          <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-line-soft">
            <div
              className="h-full rounded-full bg-ink/70"
              style={{
                width: `${Math.min(100, (test.voteCount / Math.max(1, test.targetVotes)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
