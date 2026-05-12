/**
 * FitMesh Sync — Logo component.
 *
 * Variants:
 *   - "mark"        : FM monogram square, inline SVG, scales perfectly
 *   - "horizontal"  : full horizontal logo, WebP from /public/logo-horizontal.webp
 *   - "wordmark"    : text-only "FitMesh Sync" in display font
 *
 * Per la variante "horizontal" usiamo <img> diretto sul WebP. WebP è supportato
 * dal 98%+ dei browser (Safari 14+, Chrome, Firefox, Edge). Niente <picture>:
 * il fallback SVG dipendeva dai font system, causando rendering inconsistente
 * mentre Inter/Space Grotesk si caricavano.
 */

type Variant = "mark" | "horizontal" | "wordmark";

// Intrinsic dimensions del logo orizzontale (esattamente come renderizzato
// dal file SVG sorgente). Servono al browser per riservare lo spazio e
// calcolare l'aspect ratio prima di scaricare l'immagine — zero CLS.
const LOGO_HORIZONTAL_W = 1600;
const LOGO_HORIZONTAL_H = 420;

type Props = {
  variant?: Variant;
  size?: number;
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
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo-horizontal.webp"
        alt="FitMesh Sync — wearable data sync to personal dashboard"
        width={LOGO_HORIZONTAL_W}
        height={LOGO_HORIZONTAL_H}
        className={className}
        style={{
          display: "block",
          height: `${size}px`,
          width: "auto",
          maxWidth: "100%",
        }}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
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

        <path d="M14 16 H30 V22 H20 V29 H28 V35 H20 V48 H14 Z" fill={`url(#${id})`} />
        <path d="M32 48 V16 L40 30 L48 16 V48 H42 V30 L40 33 L38 30 V48 Z" fill={`url(#${id})`} />

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
