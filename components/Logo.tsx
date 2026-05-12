/**
 * FitMesh Sync — Logo component.
 *
 * Variants:
 *   - "mark"        : just the FM monogram square (SVG inline, no asset needed)
 *   - "horizontal"  : full horizontal logo (FM mark + divider + "FitMesh SYNC")
 *                     ▸ uses `/logo-horizontal.svg` (vector, scales perfectly)
 *   - "wordmark"    : solo testo "FitMesh Sync" in font display (no asset)
 *
 * For app icons / OG images we use static PNGs (app/icon.png, apple-icon.png)
 * + dynamic OG image generation (app/opengraph-image.tsx).
 */

type Variant = "mark" | "horizontal" | "wordmark";

type Props = {
  variant?: Variant;
  size?: number; // for mark/wordmark: pixel height; for horizontal: pixel height (width auto)
  className?: string;
  priority?: boolean;
};

export default function Logo({
  variant = "mark",
  size = 32,
  className = "",
  priority = false,
}: Props) {
  if (variant === "horizontal") {
    // SVG is served as-is by Next.js. Plain <img> avoids next/image overhead
    // (no rasterization needed for vector art) and lets the SVG scale crisply.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo-horizontal.svg"
        alt="FitMesh Sync"
        height={size}
        style={{ height: size, width: "auto" }}
        className={`inline-block ${className}`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        className={`inline-flex flex-col leading-none ${className}`}
        style={{ fontSize: size * 0.6 }}
      >
        <span className="font-display font-semibold tracking-tight text-text-primary">
          FitMesh
        </span>
        <span
          className="text-text-muted uppercase mt-0.5"
          style={{
            fontSize: size * 0.22,
            letterSpacing: "0.3em",
          }}
        >
          Sync
        </span>
      </span>
    );
  }

  // ── "mark" variant: inline SVG of the FM monogram + soundwave ──
  const id = `fm-grad-${size}`;
  return (
    <span
      className={`inline-flex items-center ${className}`}
      aria-label="FitMesh Sync"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={id} x1="6" y1="8" x2="58" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#7CFF5B" />
            <stop offset="45%"  stopColor="#21E6C1" />
            <stop offset="100%" stopColor="#1DA1FF" />
          </linearGradient>
        </defs>

        <rect x="2" y="2" width="60" height="60" rx="14" fill="#0A0F1F" />
        <rect x="2" y="2" width="60" height="60" rx="14" stroke="rgba(255,255,255,0.06)" />

        {/* F (stylized) */}
        <path d="M14 16 H30 V22 H20 V29 H28 V35 H20 V48 H14 Z" fill={`url(#${id})`} />
        {/* M (right-side) */}
        <path d="M32 48 V16 L40 30 L48 16 V48 H42 V30 L40 33 L38 30 V48 Z" fill={`url(#${id})`} />

        {/* Soundwave bars */}
        <g fill={`url(#${id})`}>
          <rect x="27" y="40" width="2.5" height="8"  rx="1.25" />
          <rect x="31" y="36" width="2.5" height="14" rx="1.25" />
          <rect x="35" y="38" width="2.5" height="11" rx="1.25" />
          <rect x="39" y="34" width="2.5" height="16" rx="1.25" />
        </g>
      </svg>
    </span>
  );
}
