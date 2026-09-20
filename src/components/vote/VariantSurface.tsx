import Image from "next/image";
import type { Variant } from "@/lib/types";

/**
 * Renders what a voter is actually judging.
 *
 * Two cases: an uploaded raster image (PNG/JPEG/WEBP — the only types the
 * upload validator accepts), or a copy variant, which gets typeset rather than
 * dumped into a monospace block, because how copy *reads* is the thing being
 * tested.
 *
 * The bundled demo artwork is SVG we authored ourselves, served from
 * `/generated`. It goes through a plain <img> rather than next/image so that
 * `dangerouslyAllowSVG` never has to be switched on for the whole app.
 */
export function VariantSurface({
  variant,
  question,
  priority = false,
  className = "",
}: {
  variant: Variant;
  question: string;
  priority?: boolean;
  className?: string;
}) {
  const alt = [
    `Version ${variant.label}`,
    variant.title,
    `— one of the options for: ${question}`,
  ]
    .filter(Boolean)
    .join(" ");

  if (variant.copyValue && !variant.imageUrl) {
    return (
      <div
        className={`flex min-h-[180px] items-center justify-center bg-sand px-6 py-12 sm:min-h-[260px] sm:px-10 ${className}`}
      >
        <p className="user-text max-w-md text-center text-[22px] font-medium leading-snug tracking-[-0.02em] sm:text-[28px]">
          {variant.copyValue}
        </p>
      </div>
    );
  }

  if (!variant.imageUrl) {
    return (
      <div
        className={`flex min-h-[180px] items-center justify-center bg-sand text-[13px] text-faint ${className}`}
      >
        Nothing to show
      </div>
    );
  }

  const isLocalSvg =
    variant.imageUrl.startsWith("/") && variant.imageUrl.endsWith(".svg");

  if (isLocalSvg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- first-party static SVG; see note above.
      <img
        src={variant.imageUrl}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`block h-auto w-full bg-paper ${className}`}
      />
    );
  }

  return (
    <Image
      src={variant.imageUrl}
      alt={alt}
      width={1280}
      height={800}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px"
      className={`block h-auto w-full bg-paper object-cover ${className}`}
    />
  );
}
