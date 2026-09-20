import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/* Badge                                                                       */
/* -------------------------------------------------------------------------- */

type BadgeTone = "neutral" | "ink" | "positive" | "caution" | "outline";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-sand-deep text-muted",
  ink: "bg-ink text-paper",
  positive: "bg-[#eef6f1] text-positive",
  caution: "bg-[#fbf5e8] text-caution",
  outline: "border border-line text-muted",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Marks fictional seeded content. Used everywhere demo data is shown. */
export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line bg-paper px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.12em] text-faint ${className}`}
      title="Fictional sample data, not real human responses"
    >
      Demo
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Eyebrow + section heading                                                   */
/* -------------------------------------------------------------------------- */

export function SectionLabel({
  index,
  children,
}: {
  index?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3">
      {index && (
        <span className="font-mono text-[11px] tabular-nums text-faint">
          {index}
        </span>
      )}
      <span className="eyebrow">{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Avatar — deterministic, generated from a seed. No stock photography.        */
/* -------------------------------------------------------------------------- */

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function Avatar({
  seed,
  name,
  size = 28,
}: {
  seed: string;
  name: string;
  size?: number;
}) {
  const h = hash(seed || name);
  const rotation = h % 360;
  const inner = 0.28 + ((h >> 5) % 5) * 0.07;
  const filled = (h >> 9) % 2 === 0;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-sand"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 32 32">
        <g transform={`rotate(${rotation} 16 16)`}>
          <circle
            cx="11"
            cy="16"
            r="6.5"
            fill={filled ? "#111111" : "none"}
            stroke="#111111"
            strokeWidth="1.4"
          />
          <circle
            cx="21"
            cy="16"
            r={6.5 * inner + 2}
            fill={filled ? "none" : "#111111"}
            stroke="#111111"
            strokeWidth="1.4"
          />
        </g>
      </svg>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Info tooltip — hover and keyboard accessible, no JS state                    */
/* -------------------------------------------------------------------------- */

export function InfoTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-line text-[9px] font-semibold text-faint transition-colors hover:border-ink hover:text-ink"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-lg border border-line bg-paper p-3 text-left text-[12px] leading-relaxed font-normal text-muted opacity-0 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.25)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 max-sm:left-auto max-sm:right-0 max-sm:translate-x-0"
      >
        {children}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-sand px-6 py-16 text-center">
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true" className="text-faint">
        <circle cx="9.5" cy="16" r="4.5" fill="currentColor" opacity="0.45" />
        <circle cx="22.5" cy="16" r="4.5" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.45" />
      </svg>
      <h3 className="mt-4 text-[15px] font-medium">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Progress meter                                                              */
/* -------------------------------------------------------------------------- */

export function Meter({
  value,
  label,
  className = "",
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={className}>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-line-soft"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
