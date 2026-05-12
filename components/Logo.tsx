/**
 * FM monogram + soundwave — vector reproduction of the brand mark.
 * Uses the brand gradient (green → aqua → blue) defined in design-tokens.css.
 *
 * Use size={28} in the header, size={64} for the hero, etc.
 * If a raster logo (PNG) is later added to /public/logo.png we can swap to next/image.
 */
export default function Logo({
  size = 32,
  withWordmark = false,
  className = "",
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  const id = `fm-grad-${size}`;
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
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

        {/* Rounded square backdrop (deep ink) */}
        <rect x="2" y="2" width="60" height="60" rx="14" fill="#0A0F1F" />
        <rect x="2" y="2" width="60" height="60" rx="14" stroke="rgba(255,255,255,0.06)" />

        {/* F (stylized) */}
        <path
          d="M14 16 H30 V22 H20 V29 H28 V35 H20 V48 H14 Z"
          fill={`url(#${id})`}
        />
        {/* M (right side, stylized as triangular peak) */}
        <path
          d="M32 48 V16 L40 30 L48 16 V48 H42 V30 L40 33 L38 30 V48 Z"
          fill={`url(#${id})`}
        />

        {/* Soundwave bars in the center */}
        <g fill={`url(#${id})`}>
          <rect x="27" y="40" width="2.5" height="8"  rx="1.25" />
          <rect x="31" y="36" width="2.5" height="14" rx="1.25" />
          <rect x="35" y="38" width="2.5" height="11" rx="1.25" />
          <rect x="39" y="34" width="2.5" height="16" rx="1.25" />
        </g>
      </svg>

      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display font-semibold tracking-tight text-text-primary text-base">
            FitMesh
          </span>
          <span className="text-[9px] tracking-[0.3em] text-text-muted uppercase mt-0.5">
            Sync
          </span>
        </span>
      )}
    </span>
  );
}
