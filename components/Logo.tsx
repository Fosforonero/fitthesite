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

  // ── "mark" variant: official square app icon (PNG asset) ──
  // Usa /public/icon-square.png (1254x1254 source). Coerente con app/icon.png
  // che Next.js usa per la favicon auto-generata.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icon-square.png"
      alt="FitMesh Sync"
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        width: `${size}px`,
        height: `${size}px`,
      }}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
