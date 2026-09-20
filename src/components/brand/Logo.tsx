import { SITE } from "@/lib/config";

type MarkProps = {
  size?: number;
  className?: string;
  /** Adds a ripple ring. Off for very small sizes where it turns to mush. */
  ripple?: boolean;
};

/**
 * The Boop mark: two bodies approaching, and the moment of contact.
 * Drawn with `currentColor` so it inverts cleanly on dark surfaces.
 */
export function BoopMark({ size = 24, className, ripple = true }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {ripple && (
        <circle
          cx="16"
          cy="16"
          r="11"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.22"
        />
      )}
      <circle cx="9.5" cy="16" r="4.5" fill="currentColor" />
      <circle cx="22.5" cy="16" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({
  className = "",
  markSize = 20,
}: {
  className?: string;
  markSize?: number;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BoopMark size={markSize} />
      <span className="text-[19px] font-medium tracking-[-0.045em] leading-none">
        {SITE.wordmark}
      </span>
    </span>
  );
}
